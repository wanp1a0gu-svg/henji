-- ============================================================================
-- 用户注册后，把旧数据挂到新账号上
-- ============================================================================
-- 前提：用户已在站点注册（邮箱与旧库一致）
-- 作用：把 owner_id 从旧的 uuid 换成新 auth.users.id
-- 幂等：可重复执行，已挂好的不会重复处理
-- ============================================================================

-- 1) 钱包账户（按 owner_email 反查）
update public.wallet_accounts wa
   set owner_id = u.id::text, updated_at = now()
  from auth.users u
 where wa.owner_email is not null
   and lower(u.email) = lower(wa.owner_email)
   and wa.owner_id <> u.id::text
   and not exists (select 1 from public.wallet_accounts x where x.owner_id = u.id::text);

-- 2) 流水（跟随钱包账户的 owner_email）
update public.wallet_transactions wt
   set owner_id = u.id::text
  from public.wallet_accounts wa
  join auth.users u on lower(u.email) = lower(wa.owner_email)
 where wt.owner_id = wa.owner_id
   and wt.owner_id <> u.id::text;

-- 3) 订单（按 payer_email 反查）
update public.payment_orders po
   set owner_id = u.id::text
  from auth.users u
 where po.payer_email is not null
   and lower(u.email) = lower(po.payer_email)
   and po.owner_id <> u.id::text;

-- 4) 测算记录（无邮箱字段，只能靠订单/钱包里的对照关系；未匹配的保留旧 id）
update public.readings r
   set owner_id = u.id::text
  from public.payment_orders po
  join auth.users u on lower(u.email) = lower(po.payer_email)
 where r.owner_id = po.owner_id
   and r.owner_id <> u.id::text;

-- 5) 提现（同上）
update public.withdrawals w
   set owner_id = u.id::text
  from public.wallet_accounts wa
  join auth.users u on lower(u.email) = lower(wa.owner_email)
 where w.owner_id = wa.owner_id
   and w.owner_id <> u.id::text;

-- 6) 核对：还剩多少行挂着旧 owner_id
select 'wallet_accounts' t, count(*) from public.wallet_accounts where owner_id not in (select id::text from auth.users)
union all select 'wallet_transactions', count(*) from public.wallet_transactions where owner_id not in (select id::text from auth.users)
union all select 'payment_orders', count(*) from public.payment_orders where owner_id not in (select id::text from auth.users)
union all select 'readings', count(*) from public.readings where owner_id not in (select id::text from auth.users);
