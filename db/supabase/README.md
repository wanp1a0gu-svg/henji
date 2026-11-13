# 迁移到 Supabase · 执行清单

> 目标：把站点从 WorkBuddy 云（`wbapp_9pvnTdP5dI1cB9PjsWg1Ou`）迁到 Supabase，
> 跑在海外主机 + 自有域名 `tracesclub.com` 上。

## 文件说明

| 文件 | 作用 | 敏感 |
|---|---|---|
| `01-schema.sql` | 10 张表 + 索引 + 授权（按线上真实 DDL 还原） | 否 |
| `02-rls.sql` | `is_admin()` / `whoami()` + 全部 RLS 策略 + 管理员名单 | 否 |
| `03-functions.sql` | 7 个钱包函数（从旧库 1:1 移植，密钥改为读 `app_secrets`） | 否 |
| `04-import-data.sql` | 业务数据导入（**自动生成**） | **是**，已 gitignore |
| `../../scripts/build_import_sql.py` | 从备份 JSON 生成上一条 | — |

## 执行顺序

### 第 1 步：建表

`01-schema.sql` 整段执行。

### 第 2 步：权限与策略

`02-rls.sql` 整段执行。核对：

```sql
select * from public.admin_emails;   -- 应有 2 行
select public.is_admin();            -- 登录态下应为 true
```

### 第 3 步：函数

`03-functions.sql` 整段执行。

然后**单独**写入钱包签名密钥（值取自本机 `server-config.json` 的
`WALLET_RECHARGE_SECRET`，与旧库函数体里的那串完全一致，已核对）：

```sql
insert into public.app_secrets (key, value)
values ('wallet_secret', '<48 位 hex>')
on conflict (key) do update set value = excluded.value, updated_at = now();
```

⚠️ 这串密钥**不要**写进任何入库文件——仓库是 public 的。

### 第 4 步：用户先注册

导入靠邮箱把旧数据挂到新用户上。让有资产的用户在站上完成注册（同邮箱）。
没注册的不会丢，只是先挂在旧 `owner_id` 上，注册后重跑第 5 步即可补上。

### 第 5 步：导入数据

`04-import-data.sql` 整段执行。开头会先输出映射命中情况（`old_id / email / new_uid`），
`new_uid` 为空的说明该用户还没注册。

### 第 6 步：核对

| 表 | 期望 |
|---|---|
| wallet_accounts | 4 |
| wallet_transactions | 23 |
| payment_orders | 15 |
| readings | 22 |
| withdrawals | 1 |
| product_stock | 17 |

## 已完成：函数体抢救

旧库 9 个自建函数已通过云数据库接口原样导出并移植完毕（2026-11-13）。
签名算法、超时窗口、金额校验阈值全部保持原样：

| 函数 | 签名串 | 有效期 |
|---|---|---|
| `wallet_spend_signed` | `uid\|product\|amount\|ts` | ±900s |
| `wallet_recharge` | `uid\|amount\|order\|ts` | ±1800s |
| `wallet_receipt_sign` | `wallet\|txn\|amount\|ts`（金额 `FM999999990.00`） | — |

## 已知缺口

1. `page_views` 547 条访问日志未导入（分析数据，价值低）。
2. `skills` 表在旧库本来就是 **0 行**，无需迁移。
3. `profiles` 只有 1 行，如需要另行导出。
4. `whoami()` 新版返回 jsonb（旧版返回 TABLE），调用方两种都兼容。
5. 邮箱验证码登录：Supabase 默认发链接不发 6 位码，需要改邮件模板或后端自建发码。
