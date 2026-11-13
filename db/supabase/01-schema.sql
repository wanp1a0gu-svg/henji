-- ============================================================================
-- 痕迹 Traces · Supabase 建表脚本
-- ============================================================================
-- 来源：旧云端库（wbapp_9pvnTdP5dI1cB9PjsWg1Ou）的结构快照
-- 目标：Supabase 项目（Postgres 15+，自带 auth.users）
--
-- 用法：在 Supabase Dashboard → SQL Editor 里整段执行。
-- 幂等：全部 IF NOT EXISTS，可重复跑。
--
-- ⚠️ 与原库的差异（有意为之）：
--   1. owner_id 仍用 text（存 auth.users.id::text），不改 uuid —— 迁移脚本
--      和前端代码都按 text 处理，改类型会连带动一片，收益为零。
--   2. 原库的 wallet_* 签名函数体不在仓库里，本文件不含它们，
--      见 02-functions-min.sql 的说明。
-- ============================================================================

-- 依赖：HMAC 验签需要 pgcrypto
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. 用户资料
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  owner_id     text primary key,
  display_name text,
  avatar_path  text,
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. 八字测算记录
-- ---------------------------------------------------------------------------
create table if not exists public.readings (
  id         bigint generated always as identity primary key,
  owner_id   text not null,
  name       text,
  birth_date text,
  birth_time text,
  gender     text,
  focus      text,
  locale     text,
  place      text,
  tier       text,
  chart      jsonb,
  report     text,
  created_at timestamptz not null default now()
);
create index if not exists readings_owner_idx on public.readings (owner_id);

-- ---------------------------------------------------------------------------
-- 3. 支付订单（PayPal + 余额）
-- ---------------------------------------------------------------------------
create table if not exists public.payment_orders (
  id               bigint generated always as identity primary key,
  owner_id         text not null default auth.uid()::text,
  method           text,
  amount           text,              -- 金额存 text，与旧库一致（避免浮点丢精度）
  currency         text,
  product          text,
  status           text,
  paypal_order_id  text,
  payer_email      text,
  contact          text,
  shipping_address jsonb,
  capture_raw      jsonb,
  fulfillment      text,
  payer_note       text,
  tracking_number  text,
  carrier          text,
  created_at       timestamptz not null default now()
);
create index if not exists payment_orders_owner_idx  on public.payment_orders (owner_id);
create index if not exists payment_orders_status_idx on public.payment_orders (status);

-- ---------------------------------------------------------------------------
-- 4. 钱包账户 / 流水
-- ---------------------------------------------------------------------------
create table if not exists public.wallet_accounts (
  owner_id    text primary key default auth.uid()::text,
  owner_email text,
  balance     numeric not null default 0 check (balance >= 0),
  updated_at  timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id            bigint generated always as identity primary key,
  owner_id      text not null,
  amount        numeric not null,     -- 正=充值/赠送，负=消费
  kind          text not null,        -- grant / adjust / purchase / withdrawal
  product       text,
  ref_id        text,
  note          text,
  balance_after numeric,
  created_at    timestamptz not null default now()
);
create unique index if not exists wallet_transactions_ref_uniq
  on public.wallet_transactions (ref_id) where ref_id is not null;
create index if not exists wallet_transactions_owner_idx on public.wallet_transactions (owner_id);

-- ---------------------------------------------------------------------------
-- 5. 提现
-- ---------------------------------------------------------------------------
create table if not exists public.withdrawals (
  id         bigint generated always as identity primary key,
  owner_id   text not null,
  amount     numeric not null,
  account    text,
  note       text,
  status     text not null default 'pending',  -- pending / paid / rejected
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 6. 商品库存
-- ---------------------------------------------------------------------------
create table if not exists public.product_stock (
  product    text primary key,
  stock      integer not null default 0 check (stock >= 0),
  unlimited  boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 7. 对话助手技能（后台可编辑）
-- ---------------------------------------------------------------------------
create table if not exists public.skills (
  id         bigint generated always as identity primary key,
  name       text,
  content    text,
  enabled    boolean not null default true,
  sort       integer not null default 0,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 8. 访问统计
-- ---------------------------------------------------------------------------
create table if not exists public.page_views (
  id         bigint generated always as identity primary key,
  path       text,
  locale     text,
  visitor_id text,
  user_id    text,
  user_email text,
  ip         text,
  user_agent text,
  referrer   text,
  country    text,
  region     text,
  city       text,
  isp        text,
  ip_kind    text,
  tz         text,
  created_at timestamptz not null default now()
);
create index if not exists page_views_created_idx on public.page_views (created_at);

-- ---------------------------------------------------------------------------
-- 9. 后台访问日志（安全审计，独立于 page_views）
-- ---------------------------------------------------------------------------
create table if not exists public.admin_access_log (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id    text,
  user_email text,
  allowed    boolean not null default false,
  path       text,
  locale     text,
  ip         text,
  user_agent text,
  country    text,
  region     text,
  city       text,
  isp        text
);

-- ---------------------------------------------------------------------------
-- 10. 授权（DML 放开，实际由 RLS 兜底；与旧库一致）
-- ---------------------------------------------------------------------------
grant select on public.product_stock to anon;
grant select on public.profiles, public.readings, public.payment_orders,
      public.wallet_accounts, public.wallet_transactions, public.withdrawals
  to authenticated;
grant all on all tables in schema public to service_role;
