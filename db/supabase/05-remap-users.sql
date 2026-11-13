-- ============================================================================
-- 手工兜底：给已注册用户补挂旧数据
-- ============================================================================
-- 正常情况下不需要跑这个文件。06-auto-claim.sql 的触发器会在用户
-- "确认邮箱"的那一刻自动认领（注册即确认的场景也能兜住）。
--
-- 这个文件用于两种情况：
--   1. 触发器上线前就已经注册、但资产还挂在旧 owner_id 上的用户
--   2. 自动认领失败（函数里 exception 被吞掉了，只打了 warning），需要人工补
--
-- 幂等：可重复执行。已挂好的返回 claimed=false 或 target_has_wallet，不会重复搬。
--
-- ⚠️ 旧版本（本文档 2026-11-13 之前）的写法有 bug：
--    它先改 wallet_accounts.owner_id，再按 wt.owner_id = wa.owner_id 搬流水，
--    此时旧 id 已经被覆盖，条件永远不成立 —— 流水/测算/提现实际一条都没搬。
--    现在统一走 claim_legacy_data，内部按"先收集旧 id → 先搬引用方 → 后搬账户"执行。
-- ============================================================================

-- 1) 批量：对所有已确认邮箱的用户各认领一次
select u.email,
       u.id as new_uid,
       public.claim_legacy_data(u.id, u.email) as result
  from auth.users u
 where u.email is not null
   and u.email_confirmed_at is not null
 order by u.created_at;

-- 2) 单个用户补挂（把邮箱换成要处理的）
-- select public.claim_legacy_data(
--   (select id from auth.users where lower(email) = lower('someone@example.com')),
--   'someone@example.com'
-- );

-- 3) 核对：还剩多少行挂着不属于任何 auth 用户的旧 owner_id
--    （老用户还没来注册时，这里就是"待认领"的数量，属于正常状态）
select 'wallet_accounts' as t, count(*) as orphan_rows
  from public.wallet_accounts where owner_id not in (select id::text from auth.users)
union all
select 'wallet_transactions', count(*)
  from public.wallet_transactions where owner_id not in (select id::text from auth.users)
union all
select 'payment_orders', count(*)
  from public.payment_orders where owner_id not in (select id::text from auth.users)
union all
select 'readings', count(*)
  from public.readings where owner_id not in (select id::text from auth.users)
union all
select 'withdrawals', count(*)
  from public.withdrawals where owner_id not in (select id::text from auth.users);
