-- ============================================================================
-- 痕迹 Traces · Supabase 建表脚本
-- ============================================================================
-- 依据：2026-11-13 从旧库 wbapp_9pvnTdP5dI1cB9PjsWg1Ou 的 information_schema
--       实际导出的列定义重写（不是照文档抄的，文档有几处与线上不符）。
--
-- 与旧库的差异：主键用 bigserial（旧库是 sequence + default nextval），
-- 语义一致；用 serial 而非 identity 的好处是导入时可直接指定 id，
-- 不需要 OVERRIDING SYSTEM VALUE。
--
-- 用法：Supabase Dashboard → SQL Editor → 整段执行。全部 IF NOT EXISTS，可重跑。
-- ============================================================================

create extension if not exists pgcrypto;

-- 1. 用户资料 -----------------------------------------------------------------
create table if not exists public.profiles (
  owner_id     text primary key default auth.uid()::text,
  display_name text,
  avatar_path  text,
  updated_at   timestamptz not null default now()
);

-- 2. 八字测算记录 -------------------------------------------------------------
create table if not exists public.readings (
  id         bigserial primary key,
  owner_id   text not null default auth.uid()::text,
  name       text,
  birth_date text not null,
  birth_time text,
  gender     text not null,
  focus      text,
  locale     text default 'en',
  report     text not null,
  created_at timestamptz not null default now(),
  place      text,
  chart      jsonb,
  tier       text
);
create index if not exists readings_owner_idx on public.readings (owner_id);

-- 3. 支付订单（PayPal + 余额） ------------------------------------------------
create table if not exists public.payment_orders (
  id               bigserial primary key,
  owner_id         text not null default auth.uid()::text,
  method           text not null,
  amount           text,
  payer_note       text,
  contact          text,
  status           text not null default 'pending',
  created_at       timestamptz not null default now(),
  paypal_order_id  text,
  product          text,
  currency         text default 'USD',
  payer_email      text,
  shipping_address jsonb,
  capture_raw      jsonb,
  fulfillment      text,
  tracking_number  text,
  carrier          text
);
create index if not exists payment_orders_owner_idx  on public.payment_orders (owner_id);
create index if not exists payment_orders_status_idx on public.payment_orders (status);

-- 4. 钱包账户 / 流水 ----------------------------------------------------------
create table if not exists public.wallet_accounts (
  owner_id    text primary key default auth.uid()::text,
  owner_email text,
  balance     numeric not null default 0 check (balance >= 0),
  updated_at  timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id            bigserial primary key,
  owner_id      text not null,
  amount        numeric not null,
  kind          text not null,
  product       text,
  ref_id        text,
  note          text,
  balance_after numeric,
  created_at    timestamptz not null default now()
);
-- 只对"充值类"流水做唯一：旧库里两笔提现流水的 ref_id 都是 1，
-- 全局唯一会冲突；防重放真正需要约束的是 grant（充值时 ref_id = 订单号）
create unique index if not exists wallet_transactions_ref_uniq
  on public.wallet_transactions (ref_id) where ref_id is not null and kind = 'grant';
create index if not exists wallet_transactions_owner_idx on public.wallet_transactions (owner_id);

-- 5. 提现 --------------------------------------------------------------------
create table if not exists public.withdrawals (
  id         bigserial primary key,
  owner_id   text not null default auth.uid()::text,
  amount     numeric not null,
  account    text not null,
  note       text,
  status     text not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. 商品库存 ----------------------------------------------------------------
create table if not exists public.product_stock (
  product    text primary key,
  stock      integer not null default 0 check (stock >= 0),
  unlimited  boolean not null default false,
  updated_at timestamptz not null default now()
);

-- 7. 对话助手技能 ------------------------------------------------------------
create table if not exists public.skills (
  id         bigserial primary key,
  name       text not null,
  content    text not null,
  enabled    boolean not null default true,
  sort       integer not null default 0,
  updated_at timestamptz not null default now()
);

-- 8. 访问统计 ----------------------------------------------------------------
create table if not exists public.page_views (
  id         bigserial primary key,
  path       text not null,
  locale     text,
  visitor_id text,
  created_at timestamptz not null default now(),
  ip         text,
  user_agent text,
  referrer   text,
  user_id    text,
  user_email text,
  country    text,
  region     text,
  city       text,
  isp        text,
  ip_kind    text,
  tz         text
);
create index if not exists page_views_created_idx on public.page_views (created_at);

-- 9. 后台访问日志（安全审计） -------------------------------------------------
create table if not exists public.admin_access_log (
  id         bigserial primary key,
  created_at timestamptz not null default now(),
  user_id    text,
  user_email text,
  allowed    boolean,
  path       text,
  locale     text,
  ip         text,
  user_agent text,
  country    text,
  region     text,
  city       text,
  isp        text,
  ip_kind    text,
  tz         text
);

-- 10. 授权（与旧库一致：DML 放开，实际由 RLS 兜底） --------------------------
grant select on public.product_stock to anon;
grant select on public.profiles, public.readings, public.payment_orders,
      public.wallet_accounts, public.wallet_transactions, public.withdrawals
  to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
