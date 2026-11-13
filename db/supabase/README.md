# 迁移到 Supabase · 执行清单

> 目标：把站点从 WorkBuddy 云（`wbapp_9pvnTdP5dI1cB9PjsWg1Ou`）迁到 Supabase，
> 让站能跑在海外主机 + 自有域名 `tracesclub.com` 上。

## 文件说明

| 文件 | 作用 | 是否含敏感数据 |
|---|---|---|
| `01-schema.sql` | 10 张表 + 索引 + 授权 | 否 |
| `02-rls.sql` | `is_admin()` / `whoami()` + 全部 RLS 策略 + 管理员名单表 | 否 |
| `03-import-data.sql` | 业务数据导入（**自动生成，已 gitignore**） | **是**（真实邮箱与金额） |
| `../../scripts/build_import_sql.py` | 从备份 JSON 生成上面那个 SQL | — |

## 执行顺序

### 第 0 步（最重要，别跳过）：先把旧库的函数体导出来

旧库有 9 个自建函数，其中 4 个是钱包核心，**函数体不在仓库里**（当初为了避免密钥入 git，只记了签名）。

旧应用一旦下线，这些逻辑就再也拿不回来了。**在 WorkBuddy 云控制台的 SQL 编辑器里跑这段，把结果存下来**：

```sql
select p.proname, pg_get_functiondef(p.oid) as def
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prokind = 'f'
order by p.proname;
```

需要特别保存的：`wallet_spend_signed`、`wallet_recharge`、`wallet_receipt_sign`、
`wallet_withdraw_request`、`wallet_withdraw_settle`。

签名串的算法已经从 `server.js` 反推出来，可用于交叉验证：

| 函数 | 签名串 | 出处 |
|---|---|---|
| `wallet_recharge` | `uid\|amount\|orderId\|ts` | server.js:1585 |
| `wallet_spend_signed` | `uid\|product\|amount\|ts` | server.js:1594 |
| `wallet_receipt_sign` | `wallet\|txn\|amount\|ts` | server.js:859 |

算法是 `HMAC-SHA256(WALLET_RECHARGE_SECRET, payload)` 转 hex。

### 第 1 步：建表

Supabase Dashboard → SQL Editor → 整段执行 `01-schema.sql`。

### 第 2 步：权限

同样方式执行 `02-rls.sql`。执行后确认管理员名单：

```sql
select * from public.admin_emails;   -- 应有 2 行
select public.is_admin();            -- 登录态下应为 true
```

### 第 3 步：用户先注册

导入脚本靠**邮箱**把旧数据挂到新用户上。所以要让有资产的用户在站上完成注册（同邮箱）。
没注册的用户不会丢数据，只是那一行先挂在旧 `owner_id` 上，注册后重跑脚本即可补上。

### 第 4 步：导入数据

把 `03-import-data.sql` 整段贴进 SQL Editor 执行。

脚本行为：
- 开局先查一次映射命中情况（`old_id / email / new_uid`），**先看这段输出**，`new_uid` 为空的说明该用户还没注册
- 钱包、流水、订单、测算、提现、库存全部按原 `id` 导入，末尾 `setval` 对齐序列
- 订单和测算对不上用户时**保留原 owner_id**，不丢单，后台仍可见

### 第 5 步：核对

脚本末尾自带核对查询，应与备份行数一致：

| 表 | 期望 |
|---|---|
| wallet_accounts | 4 |
| wallet_transactions | 23 |
| payment_orders | 15 |
| readings | 22 |
| withdrawals | 1 |
| product_stock | 17 |

## 重新生成导入 SQL

备份更新后（比如又导了一份），重跑即可：

```bash
python scripts/build_import_sql.py --backup db/backups/2026-11-11/backup.json
```

## 已知缺口

1. **`page_views` 536 条访问日志没有导入**——纯分析数据，价值低，需要的话可单独加。
2. **`profiles` / `skills` / `admin_access_log` 不在备份里**，表已建好但为空。`skills` 是对话助手的技能配置，如果小痕要恢复上线，需要从旧库另导。
3. **钱包签名函数体待补**（第 0 步）。补齐之前，余额支付链路不可用；纯 PayPal 支付和命书生成不受影响。
