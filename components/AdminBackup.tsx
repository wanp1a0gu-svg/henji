"use client";

/**
 * 后台「备份」标签。
 *
 * 为什么放在前端：数据库只允许带登录态的客户端访问，服务端没有密钥。
 * 管理员登录后 RLS 放行全表读取，于是可以在浏览器里把整库导成 JSON 存到本地。
 *
 * 建议节奏：每次发货批次结束、每月月初各导一次；文件名带日期，直接丢网盘/移动硬盘。
 */

import { useState } from "react";
import { Download, Loader2, HardDriveDownload } from "lucide-react";
import { getCloud } from "@/lib/cloud";

type TableDef = {
  key: string;
  label: string;
  /** 大表限制行数，避免把浏览器撑爆 */
  limit?: number;
  orderBy?: string;
  ascending?: boolean;
};

const TABLES: TableDef[] = [
  { key: "payment_orders", label: "订单 payment_orders", orderBy: "id", ascending: false },
  { key: "wallet_accounts", label: "钱包账户 wallet_accounts" },
  { key: "wallet_transactions", label: "钱包流水 wallet_transactions", orderBy: "id", ascending: false },
  { key: "readings", label: "测算记录 readings", orderBy: "created_at", ascending: false },
  { key: "product_stock", label: "商品库存 product_stock" },
  { key: "withdrawals", label: "提现 withdrawals", orderBy: "created_at", ascending: false },
  { key: "page_views", label: "访问日志 page_views（最近 2 万条）", limit: 20000, orderBy: "created_at", ascending: false },
];

function saveJson(name: string, data: any) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function AdminBackup() {
  const [busy, setBusy] = useState("");
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const [msg, setMsg] = useState("");

  const fetchTable = async (t: TableDef) => {
    let q = getCloud().database.from(t.key).select("*");
    if (t.orderBy) q = q.order(t.orderBy, { ascending: !!t.ascending });
    if (t.limit) q = q.limit(t.limit);
    const { data, error } = await q;
    if (error) throw new Error(`${t.key}: ${error.message}`);
    return data || [];
  };

  const exportOne = async (t: TableDef) => {
    setBusy(t.key);
    setMsg("");
    try {
      const rows = await fetchTable(t);
      const day = new Date().toISOString().slice(0, 10);
      saveJson(`traces-${t.key}-${day}.json`, { exportedAt: new Date().toISOString(), table: t.key, count: rows.length, rows });
      setCounts((c) => ({ ...c, [t.key]: rows.length }));
      setMsg(`已导出 ${t.key}：${rows.length} 条`);
    } catch (e: any) {
      setMsg("导出失败：" + ((e && e.message) || ""));
    } finally {
      setBusy("");
    }
  };

  const exportAll = async () => {
    setBusy("__all__");
    setMsg("正在导出全部表…");
    const out: Record<string, any> = {};
    const nextCounts: Record<string, number | null> = {};
    try {
      for (const t of TABLES) {
        try {
          const rows = await fetchTable(t);
          out[t.key] = rows;
          nextCounts[t.key] = rows.length;
        } catch (e: any) {
          out[t.key] = { error: (e && e.message) || "读取失败" };
          nextCounts[t.key] = null;
        }
      }
      const day = new Date().toISOString().slice(0, 10);
      saveJson(`traces-backup-${day}.json`, { exportedAt: new Date().toISOString(), tables: out });
      setCounts(nextCounts);
      setMsg("全量备份已下载。建议改名加上备注，丢到网盘或移动硬盘。");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="glass flex flex-wrap items-center gap-3 rounded-2xl px-5 py-4">
        <div className="text-xs text-muted">
          数据库在云端，这页把你**能看到的全部数据**导成 JSON 存到本地。
          <span className="ms-2 text-muted/50">建议：每次批量发货后、每月月初各导一次。</span>
        </div>
        <button
          onClick={exportAll}
          disabled={!!busy}
          className="ms-auto inline-flex items-center gap-1.5 rounded-xl border border-accent/30 bg-accent/10 px-4 py-2 text-xs text-accent transition hover:bg-accent/20 disabled:opacity-50"
        >
          {busy === "__all__" ? <Loader2 size={13} className="animate-spin" /> : <HardDriveDownload size={13} />}
          全量备份（JSON）
        </button>
      </div>

      {msg && <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] text-muted">{msg}</p>}

      <div className="glass overflow-hidden rounded-2xl">
        <table className="w-full text-start text-xs">
          <thead>
            <tr className="border-b border-white/[0.08] text-[10px] uppercase tracking-wider text-muted/60">
              <th className="px-4 py-3">数据表</th>
              <th className="px-4 py-3">上次导出条数</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {TABLES.map((t) => (
              <tr key={t.key} className="border-b border-white/[0.04]">
                <td className="px-4 py-3 text-foreground/90">{t.label}</td>
                <td className="px-4 py-3 text-muted">
                  {counts[t.key] === undefined ? "—" : counts[t.key] === null ? "读取失败" : counts[t.key]}
                </td>
                <td className="px-4 py-3 text-end">
                  <button
                    onClick={() => exportOne(t)}
                    disabled={!!busy}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] text-muted transition hover:border-accent/30 hover:text-accent disabled:opacity-50"
                  >
                    {busy === t.key ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
                    导出
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="px-1 text-[11px] leading-relaxed text-muted/50">
        说明：JSON 里保留了原始字段（含金额字符串、时间戳），恢复时按表结构写回即可；
        订单金额是文本类型，注意别被 Excel 吃掉精度。
      </p>
    </div>
  );
}
