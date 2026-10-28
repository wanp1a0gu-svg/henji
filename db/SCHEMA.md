# 数据库结构速查（痕迹 Traces）

> 云服务应用 ID：`wbapp_9pvnTdP5dI1cB9PjsWg1Ou`
> 数据库是**云端托管**的，不随电脑走。本文件只是结构快照，方便换机/交接时快速理解数据模型。
> 导出时间：2026-10-26

## ⚠️ 先说一句

`wallet_*` 系列函数体里**硬编码了 `WALLET_RECHARGE_SECRET`**（与 `server-config.json` 同值）。
所以本文件**只记录函数签名，不抄函数体**。要拿完整定义：

```sql
select pg_get_functiondef(p.oid)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'wallet_spend_signed';
```

## 一、数据表（8 张）

### `readings` — 八字测算记录
| 列 | 类型 |
| --- | --- |
| id | bigint |
| owner_id | text |
| name / birth_date / birth_time / gender / focus / locale | text |
| report | text |
| created_at | timestamptz |

### `payment_orders` — 支付订单（PayPal + 余额）
`id` bigint、`owner_id` text、`method` text、`amount` text、`currency` text、`product` text、
`status` text、`paypal_order_id` text、`payer_email` text、`contact` text、
`shipping_address` jsonb、`capture_raw` jsonb、`fulfillment` text、`payer_note` text、
`tracking_number` text（运单号，10-28 新增）、`carrier` text（承运商，10-28 新增）、`created_at` timestamptz

> `owner_id` 是 `NOT NULL DEFAULT auth.uid()` —— 游客下单会插入失败，所以付款前必须登录。

### `wallet_accounts` — 钱包余额
`owner_id` text（主键）、`owner_email` text、`balance` numeric、`updated_at` timestamptz

### `wallet_transactions` — 余额流水
`id` bigint、`owner_id` text、`amount` numeric、`kind` text（grant / purchase / withdrawal）、
`product` text、`ref_id` text（唯一索引，防充值重放）、`note` text、`balance_after` numeric、`created_at` timestamptz

### `withdrawals` — 提现申请
`id` bigint、`owner_id` text、`amount` numeric、`account` text、`note` text、
`status` text（pending / paid / rejected）、`admin_note` text、`created_at`、`updated_at`

### `profiles` — 用户资料
`owner_id` text（主键）、`display_name` text、`avatar_path` text、`updated_at` timestamptz

### `skills` — 对话助手技能（可后台编辑）
`id` bigint、`name` text、`content` text、`enabled` boolean、`sort` integer、`updated_at` timestamptz

### `page_views` — 自建访问统计
`id` bigint、`path` text、`locale` text、`visitor_id` text、`created_at` timestamptz

## 二、数据库函数（9 个，都是自建）

| 函数 | 参数 | 用途 |
| --- | --- | --- |
| `is_admin()` | — | 鉴权核心。`lower(auth.email()) = ANY(白名单)`，8 条 RLS admin 策略都引用它 |
| `whoami()` | — | 返回当前 uid/email，调试用 |
| `wallet_grant` | p_email, p_amount, p_note | 管理员发放/扣减余额 |
| `wallet_spend` | p_amount, p_product, p_ref, p_note | 用户消费（原子扣减） |
| `wallet_spend_signed` | p_uid, p_product, p_amount, p_ts, p_sig | 带签名验签的消费；**返回 `txn_id`**（付费墙收据要用） |
| `wallet_receipt_sign` | p_txn | **付费墙收据签发**：校验交易属主后签 `HMAC(wallet\|txn\|amount\|ts)`，GRANT anon |
| `wallet_recharge` | p_uid, p_amount, p_order, p_ts, p_sig | 充值入账（PayPal 付款后） |
| `wallet_withdraw_request` | p_amount, p_account, p_note | 申请提现（立即冻结余额） |
| `wallet_withdraw_settle` | p_id, p_action, p_admin_note | 管理员标记已打款 / 驳回退款 |

## 三、权限（RLS）

- 全部业务表都开了 RLS，默认**按 `owner_id = auth.uid()` 隔离**
- 管理员（`is_admin()`）额外有 `*_select_admin` / `*_update_admin` 策略，可看全站数据
- `wallet_accounts` / `wallet_transactions` **前端只读**，余额变动必须走 RPC
- ⚠️ 写查询时**一定要带 `.eq("owner_id", user.id)`**，否则管理员会看到全站数据

## 四、换机时要做的数据库检查

```sql
-- 1. 表都在？
select table_name from information_schema.tables
where table_schema='public' and table_type='BASE TABLE' order by 1;

-- 2. 函数都在？
select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.prokind='f' and proname like 'wallet%' order by 1;

-- 3. pgcrypto 装了没（HMAC 依赖）
select extname from pg_extension where extname='pgcrypto';
```
