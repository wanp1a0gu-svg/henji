#!/usr/bin/env python3
"""
把备份 JSON 转成 Supabase 可直接执行的导入 SQL。

为什么需要它：
  旧库的业务数据用 owner_id（auth.users.id 的 uuid 字符串）做外键，
  新 Supabase 项目里用户是重新注册的，uuid 全变了。
  但三张核心表都带邮箱（wallet_accounts.owner_email、payment_orders.payer_email），
  所以按「旧 owner_id → 邮箱 → 新 auth.users.id」这条路重挂。

用法：
    python scripts/build_import_sql.py                       # 用默认备份
    python scripts/build_import_sql.py --backup db/backups/2026-11-11/backup.json
    python scripts/build_import_sql.py --out db/supabase/03-import-data.sql

前置：所有用户在 Supabase 里完成注册（同邮箱），映射才连得上。
没有对应用户的行不会丢——会列在输出末尾的「未匹配」里，注册完重跑即可。
"""

import argparse
import json
import os
import sys
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------------------------------------------------------------------------
# SQL 拼接小工具
# ---------------------------------------------------------------------------

def q(v):
    """字符串字面量；None → NULL。"""
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "TRUE" if v else "FALSE"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def qjson(v):
    """jsonb 字面量。"""
    if v is None:
        return "NULL"
    if isinstance(v, str):
        # 已经是 JSON 字符串就原样放，否则当普通文本包一层
        s = v.strip()
        if s[:1] in "[{":
            return q(s) + "::jsonb"
        return q(json.dumps(v)) + "::jsonb"
    return q(json.dumps(v, ensure_ascii=False)) + "::jsonb"


# ---------------------------------------------------------------------------
# 主流程
# ---------------------------------------------------------------------------

def build(backup_path, out_path):
    with open(backup_path, encoding="utf-8") as f:
        data = json.load(f)

    tables = data.get("tables", {})
    L = []
    add = L.append

    # --- 旧的 owner_id → 邮箱 映射 ---
    id2email = {}
    for r in tables.get("wallet_accounts", []):
        if r.get("owner_id") and r.get("owner_email"):
            id2email[r["owner_id"]] = r["owner_email"].strip().lower()
    for r in tables.get("payment_orders", []):
        if r.get("owner_id") and r.get("payer_email"):
            id2email.setdefault(r["owner_id"], r["payer_email"].strip().lower())

    add("-- 自动生成：备份 → Supabase 导入 SQL")
    add(f"-- 源文件：{os.path.basename(backup_path)}（导出于 {data.get('exportedAt', '?')}）")
    add("-- ⚠️ 含真实邮箱与金额，不入库、不外发")
    add("")
    add("begin;")
    add("")

    # 映射表
    add("-- 1) 旧 owner_id → 邮箱（只用于 join，跑完即弃）")
    add("create temp table if not exists _m (old_id text primary key, email text) on commit drop;")
    if id2email:
        rows = [f"({q(k)}, {q(v)})" for k, v in id2email.items()]
        add("insert into _m (old_id, email) values")
        add("    " + ",\n    ".join(rows))
        add("on conflict (old_id) do nothing;")
    add("")
    add("-- 映射命中情况")
    add("select m.old_id, m.email, u.id as new_uid")
    add("from _m m left join auth.users u on lower(u.email) = m.email")
    add("order by (u.id is null), m.email;")
    add("")

    stats = {}

    # --- 2) wallet_accounts ---
    rows = tables.get("wallet_accounts", [])
    if rows:
        add("-- 2) 钱包账户（按邮箱重挂 owner_id）")
        add("insert into public.wallet_accounts (owner_id, owner_email, balance, updated_at)")
        add("select u.id::text, m.email, v.balance::numeric, v.updated_at::timestamptz")
        add("from (values")
        vals = []
        for r in rows:
            vals.append(f"({q(r.get('owner_id'))}, {q(str(r.get('balance', '0')) if r.get('balance') is not None else None)}, {q(r.get('updated_at'))})")
        add("    " + ",\n    ".join(vals))
        add(") as v(old_id, balance, updated_at)")
        add("join _m m on m.old_id = v.old_id")
        add("join auth.users u on lower(u.email) = m.email")
        add("on conflict (owner_id) do update set")
        add("  balance = excluded.balance, owner_email = excluded.owner_email, updated_at = excluded.updated_at;")
        add("")
        stats["wallet_accounts"] = len(rows)

    # --- 3) wallet_transactions ---
    rows = tables.get("wallet_transactions", [])
    if rows:
        add("-- 3) 钱包流水（保留原 id，末尾对齐序列）")
        add("insert into public.wallet_transactions (id, owner_id, amount, kind, product, ref_id, note, balance_after, created_at)")
        add("select v.id, u.id::text, v.amount::numeric, v.kind, v.product, v.ref_id, v.note, v.balance_after::numeric, v.created_at::timestamptz")
        add("from (values")
        vals = []
        for r in rows:
            vals.append(
                f"({q(r.get('id'))}, {q(r.get('owner_id'))}, {q(str(r.get('amount')))}, {q(r.get('kind'))}, "
                f"{q(r.get('product'))}, {q(r.get('ref_id'))}, {q(r.get('note'))}, "
                f"{q(str(r['balance_after']) if r.get('balance_after') is not None else None)}, {q(r.get('created_at'))})"
            )
        add("    " + ",\n    ".join(vals))
        add(") as v(id, old_id, amount, kind, product, ref_id, note, balance_after, created_at)")
        add("join _m m on m.old_id = v.old_id")
        add("join auth.users u on lower(u.email) = m.email")
        add("on conflict (id) do nothing;")
        add("select setval(pg_get_serial_sequence('public.wallet_transactions','id'), coalesce((select max(id) from public.wallet_transactions), 1));")
        add("")
        stats["wallet_transactions"] = len(rows)

    # --- 4) payment_orders ---
    rows = tables.get("payment_orders", [])
    if rows:
        add("-- 4) 订单（保留原 id；金额字段保持 text 不转数字）")
        add("insert into public.payment_orders (id, owner_id, method, amount, currency, product, status, paypal_order_id, payer_email, contact, shipping_address, capture_raw, fulfillment, payer_note, tracking_number, carrier, created_at)")
        add("select v.id, coalesce(u.id::text, v.old_id), v.method, v.amount, v.currency, v.product, v.status, v.paypal_order_id, v.payer_email, v.contact, v.shipping_address, v.capture_raw, v.fulfillment, v.payer_note, v.tracking_number, v.carrier, v.created_at")
        add("from (values")
        vals = []
        for r in rows:
            vals.append(
                f"({q(r.get('id'))}, {q(r.get('owner_id'))}, {q(r.get('method'))}, {q(str(r['amount']) if r.get('amount') is not None else None)}, "
                f"{q(r.get('currency'))}, {q(r.get('product'))}, {q(r.get('status'))}, {q(r.get('paypal_order_id'))}, "
                f"{q(r.get('payer_email'))}, {q(r.get('contact'))}, {qjson(r.get('shipping_address'))}, {qjson(r.get('capture_raw'))}, "
                f"{q(r.get('fulfillment'))}, {q(r.get('payer_note'))}, {q(r.get('tracking_number'))}, {q(r.get('carrier'))}, {q(r.get('created_at'))})"
            )
        add("    " + ",\n    ".join(vals))
        add(") as v(id, old_id, method, amount, currency, product, status, paypal_order_id, payer_email, contact, shipping_address, capture_raw, fulfillment, payer_note, tracking_number, carrier, created_at)")
        add("left join _m m on m.old_id = v.old_id")
        add("left join auth.users u on lower(u.email) = m.email")
        add("on conflict (id) do nothing;")
        add("select setval(pg_get_serial_sequence('public.payment_orders','id'), coalesce((select max(id) from public.payment_orders), 1));")
        add("-- 订单不去重、不跳过：邮箱对不上时保留原 owner_id，后台仍能看到这笔单")
        add("")
        stats["payment_orders"] = len(rows)

    # --- 5) readings ---
    rows = tables.get("readings", [])
    if rows:
        add("-- 5) 测算记录（对不上用户的会保留原 owner_id）")
        add("insert into public.readings (id, owner_id, name, birth_date, birth_time, gender, focus, locale, place, tier, chart, report, created_at)")
        add("select v.id, coalesce(u.id::text, v.old_id), v.name, v.birth_date, v.birth_time, v.gender, v.focus, v.locale, v.place, v.tier, v.chart, v.report, v.created_at")
        add("from (values")
        vals = []
        for r in rows:
            vals.append(
                f"({q(r.get('id'))}, {q(r.get('owner_id'))}, {q(r.get('name'))}, {q(r.get('birth_date'))}, {q(r.get('birth_time'))}, "
                f"{q(r.get('gender'))}, {q(r.get('focus'))}, {q(r.get('locale'))}, {q(r.get('place'))}, {q(r.get('tier'))}, "
                f"{qjson(r.get('chart'))}, {q(r.get('report'))}, {q(r.get('created_at'))})"
            )
        add("    " + ",\n    ".join(vals))
        add(") as v(id, old_id, name, birth_date, birth_time, gender, focus, locale, place, tier, chart, report, created_at)")
        add("left join _m m on m.old_id = v.old_id")
        add("left join auth.users u on lower(u.email) = m.email")
        add("on conflict (id) do nothing;")
        add("select setval(pg_get_serial_sequence('public.readings','id'), coalesce((select max(id) from public.readings), 1));")
        add("")
        stats["readings"] = len(rows)

    # --- 6) withdrawals ---
    rows = tables.get("withdrawals", [])
    if rows:
        add("-- 6) 提现申请")
        add("insert into public.withdrawals (id, owner_id, amount, account, note, status, admin_note, created_at, updated_at)")
        add("select v.id, coalesce(u.id::text, v.old_id), v.amount::numeric, v.account, v.note, v.status, v.admin_note, v.created_at, v.updated_at")
        add("from (values")
        vals = []
        for r in rows:
            vals.append(
                f"({q(r.get('id'))}, {q(r.get('owner_id'))}, {q(str(r['amount']) if r.get('amount') is not None else None)}, "
                f"{q(r.get('account'))}, {q(r.get('note'))}, {q(r.get('status'))}, {q(r.get('admin_note'))}, "
                f"{q(r.get('created_at'))}, {q(r.get('updated_at'))})"
            )
        add("    " + ",\n    ".join(vals))
        add(") as v(id, old_id, amount, account, note, status, admin_note, created_at, updated_at)")
        add("left join _m m on m.old_id = v.old_id")
        add("left join auth.users u on lower(u.email) = m.email")
        add("on conflict (id) do nothing;")
        add("select setval(pg_get_serial_sequence('public.withdrawals','id'), coalesce((select max(id) from public.withdrawals), 1));")
        add("")
        stats["withdrawals"] = len(rows)

    # --- 7) product_stock ---
    rows = tables.get("product_stock", [])
    if rows:
        add("-- 7) 库存（覆盖写：以备份为准）")
        add("insert into public.product_stock (product, stock, unlimited, updated_at)")
        add("values")
        vals = []
        for r in rows:
            vals.append(f"({q(r.get('product'))}, {q(r.get('stock'))}, {q(bool(r.get('unlimited')))}, {q(r.get('updated_at'))})")
        add("    " + ",\n    ".join(vals))
        add("on conflict (product) do update set stock = excluded.stock, unlimited = excluded.unlimited, updated_at = excluded.updated_at;")
        add("")
        stats["product_stock"] = len(rows)

    # --- 8) 核对 ---
    add("-- 8) 导入后核对（数量应与备份一致）")
    add("select 'wallet_accounts' t, count(*) from public.wallet_accounts")
    add("union all select 'wallet_transactions', count(*) from public.wallet_transactions")
    add("union all select 'payment_orders', count(*) from public.payment_orders")
    add("union all select 'readings', count(*) from public.readings")
    add("union all select 'withdrawals', count(*) from public.withdrawals")
    add("union all select 'product_stock', count(*) from public.product_stock;")
    add("")
    add("commit;")

    sql = "\n".join(L)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(sql)

    # --- 控制台摘要 ---
    print("已生成:", out_path)
    print("表行数:", ", ".join(f"{k}={v}" for k, v in stats.items()))
    print("邮箱映射条目:", len(id2email))
    unmapped = []
    for t in ("wallet_transactions", "readings", "withdrawals"):
        for r in tables.get(t, []):
            oid = r.get("owner_id")
            if oid and oid not in id2email:
                unmapped.append((t, oid))
    if unmapped:
        print("⚠️ 无法按邮箱重挂的行（会保留原 owner_id）:")
        for t, oid in Counter(unmapped).most_common():
            print(f"   {t[0]}: {t[1]} × {oid}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--backup", default=os.path.join(ROOT, "db", "backups", "2026-11-11", "backup.json"))
    ap.add_argument("--out", default=os.path.join(ROOT, "db", "supabase", "04-import-data.sql"))
    a = ap.parse_args()
    if not os.path.exists(a.backup):
        sys.exit(f"找不到备份文件: {a.backup}")
    build(a.backup, a.out)
