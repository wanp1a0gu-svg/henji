-- ============================================================================
-- 痕迹 Traces · 权限函数 + RLS 策略
-- ============================================================================
-- 在 01-schema.sql 之后执行。幂等：先 drop policy if exists 再建。
--
-- 与原库的差异：原库 is_admin() 是硬编码邮箱白名单在函数体里，改人要改函数。
-- 这里改成读 admin_emails 表 —— 加管理员只需 insert 一行，不用动函数。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. 管理员名单
-- ---------------------------------------------------------------------------
create table if not exists public.admin_emails (
  email      text primary key,
  note       text,
  created_at timestamptz not null default now()
);

-- 初始管理员（按旧库交接文档的白名单）
insert into public.admin_emails (email, note) values
  ('wanp1a0gu@gmail.com', '站主'),
  ('501183563@qq.com',    '站主')
on conflict (email) do nothing;

alter table public.admin_emails enable row level security;
-- 不建任何策略 = 只有 service_role 能读写，前端永远读不到名单

-- ---------------------------------------------------------------------------
-- 2. 鉴权函数
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_emails a
    where a.email = lower(coalesce(auth.email(), ''))
  );
$$;

create or replace function public.whoami()
returns jsonb
language sql
stable
as $$
  select jsonb_build_object('uid', auth.uid()::text, 'email', auth.email(), 'is_admin', public.is_admin());
$$;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.whoami()   to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. RLS 策略
-- ---------------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.readings            enable row level security;
alter table public.payment_orders      enable row level security;
alter table public.wallet_accounts     enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.withdrawals         enable row level security;
alter table public.product_stock       enable row level security;
alter table public.skills              enable row level security;
alter table public.page_views          enable row level security;
alter table public.admin_access_log    enable row level security;

-- profiles ------------------------------------------------------------------
drop policy if exists profiles_select_own   on public.profiles;
drop policy if exists profiles_insert_own   on public.profiles;
drop policy if exists profiles_update_own   on public.profiles;
drop policy if exists profiles_select_admin on public.profiles;
create policy profiles_select_own   on public.profiles for select to authenticated using (owner_id = auth.uid()::text);
create policy profiles_insert_own   on public.profiles for insert to authenticated with check (owner_id = auth.uid()::text);
create policy profiles_update_own   on public.profiles for update to authenticated using (owner_id = auth.uid()::text) with check (owner_id = auth.uid()::text);
create policy profiles_select_admin on public.profiles for select to authenticated using (public.is_admin());

-- readings ------------------------------------------------------------------
drop policy if exists readings_select_own   on public.readings;
drop policy if exists readings_insert_own   on public.readings;
drop policy if exists readings_delete_own   on public.readings;
drop policy if exists readings_select_admin on public.readings;
create policy readings_select_own   on public.readings for select to authenticated using (owner_id = auth.uid()::text);
create policy readings_insert_own   on public.readings for insert to authenticated with check (owner_id = auth.uid()::text);
create policy readings_delete_own   on public.readings for delete to authenticated using (owner_id = auth.uid()::text);
create policy readings_select_admin on public.readings for select to authenticated using (public.is_admin());

-- payment_orders ------------------------------------------------------------
drop policy if exists orders_select_own   on public.payment_orders;
drop policy if exists orders_insert_own   on public.payment_orders;
drop policy if exists orders_select_admin on public.payment_orders;
drop policy if exists orders_update_admin on public.payment_orders;
create policy orders_select_own   on public.payment_orders for select to authenticated using (owner_id = auth.uid()::text);
create policy orders_insert_own   on public.payment_orders for insert to authenticated with check (owner_id = auth.uid()::text);
create policy orders_select_admin on public.payment_orders for select to authenticated using (public.is_admin());
create policy orders_update_admin on public.payment_orders for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- wallet_accounts（前端只读，写入一律走函数） --------------------------------
drop policy if exists wallet_accounts_select_own   on public.wallet_accounts;
drop policy if exists wallet_accounts_select_admin on public.wallet_accounts;
drop policy if exists wallet_accounts_update_admin on public.wallet_accounts;
create policy wallet_accounts_select_own   on public.wallet_accounts for select to authenticated using (owner_id = auth.uid()::text);
create policy wallet_accounts_select_admin on public.wallet_accounts for select to authenticated using (public.is_admin());
create policy wallet_accounts_update_admin on public.wallet_accounts for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- wallet_transactions（无写策略 → 前端无法伪造流水） -------------------------
drop policy if exists wallet_transactions_select_own   on public.wallet_transactions;
drop policy if exists wallet_transactions_select_admin on public.wallet_transactions;
create policy wallet_transactions_select_own   on public.wallet_transactions for select to authenticated using (owner_id = auth.uid()::text);
create policy wallet_transactions_select_admin on public.wallet_transactions for select to authenticated using (public.is_admin());

-- withdrawals ---------------------------------------------------------------
drop policy if exists withdrawals_select_own   on public.withdrawals;
drop policy if exists withdrawals_insert_own   on public.withdrawals;
drop policy if exists withdrawals_select_admin on public.withdrawals;
drop policy if exists withdrawals_update_admin on public.withdrawals;
create policy withdrawals_select_own   on public.withdrawals for select to authenticated using (owner_id = auth.uid()::text);
create policy withdrawals_insert_own   on public.withdrawals for insert to authenticated with check (owner_id = auth.uid()::text);
create policy withdrawals_select_admin on public.withdrawals for select to authenticated using (public.is_admin());
create policy withdrawals_update_admin on public.withdrawals for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- product_stock（公开可读，改动仅管理员） ------------------------------------
drop policy if exists stock_select_all   on public.product_stock;
drop policy if exists stock_insert_admin on public.product_stock;
drop policy if exists stock_update_admin on public.product_stock;
drop policy if exists stock_delete_admin on public.product_stock;
create policy stock_select_all   on public.product_stock for select to anon, authenticated using (true);
create policy stock_insert_admin on public.product_stock for insert to authenticated with check (public.is_admin());
create policy stock_update_admin on public.product_stock for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy stock_delete_admin on public.product_stock for delete to authenticated using (public.is_admin());

-- skills（启用的公开可读） ---------------------------------------------------
drop policy if exists skills_select_public on public.skills;
drop policy if exists skills_admin_all     on public.skills;
create policy skills_select_public on public.skills for select to anon, authenticated using (enabled = true);
create policy skills_admin_all     on public.skills for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- page_views（谁都能写一条，只有管理员能读） --------------------------------
drop policy if exists pv_insert_any    on public.page_views;
drop policy if exists pv_select_admin  on public.page_views;
create policy pv_insert_any   on public.page_views for insert to anon, authenticated with check (true);
create policy pv_select_admin on public.page_views for select to authenticated using (public.is_admin());

-- admin_access_log（审计：限本人写入，管理员可读） ---------------------------
drop policy if exists aal_insert_self  on public.admin_access_log;
drop policy if exists aal_select_admin on public.admin_access_log;
create policy aal_insert_self  on public.admin_access_log for insert to authenticated with check (user_id = auth.uid()::text);
create policy aal_select_admin on public.admin_access_log for select to authenticated using (public.is_admin());
