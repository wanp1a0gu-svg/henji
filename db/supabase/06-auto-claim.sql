-- ============================================================================
-- 老用户资产自动认领（注册即挂回）
-- ============================================================================
-- 背景：旧站（WorkBuddy 云 wbapp_9pvnTdP5dI1cB9PjsWg1Ou）的账号体系无法导出，
--       老用户只能在新站用同一邮箱重新注册。他们的钱包/订单/测算记录
--       导入时 owner_id 还挂在旧 id 上，需要按邮箱认领回来。
--
-- 之前 05-remap-users.sql 靠手工跑，且第 2、4 步有逻辑 bug：
--   它先把 wallet_accounts.owner_id 改成了新 uid，再按 wt.owner_id = wa.owner_id
--   去搬流水——此时旧 id 已经不存在，条件永远不成立，流水和测算记录实际一条都没搬过去。
--   本文件用"先收集旧 id 数组 → 先搬引用方 → 最后搬账户"的顺序修掉。
--
-- 触发时机（重要，涉及安全）：
--   ✗ 不在注册瞬间认领。否则任何人用别人的邮箱抢注，就能把对方资产锁死。
--   ✓ 只在 email_confirmed_at 由空变为非空时认领（即用户真的点开了确认邮件）。
--     若项目关闭了邮箱确认（invite/auto-confirm），insert 时 confirmed_at 已有值，
--     第一个触发器会兜住。
--
-- 权限：claim_legacy_data 对 public/anon/authenticated 全部 revoke，
--       只有触发器（security definer，属主 postgres）能调用，防止有人传别人邮箱抢资产。
--
-- 用法：Supabase Dashboard → SQL Editor → 整段执行。可重复执行。
-- ============================================================================

-- 1. 认领函数 ---------------------------------------------------------------
create or replace function public.claim_legacy_data(p_uid uuid, p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_mail text := lower(btrim(coalesce(p_email, '')));
  v_uid  text := p_uid::text;
  v_old  text[];
  n_wallet int := 0;
  n_tx int := 0;
  n_orders int := 0;
  n_readings int := 0;
  n_withdrawals int := 0;
begin
  if p_uid is null or v_mail = '' then
    return jsonb_build_object('ok', false, 'reason', 'bad_args');
  end if;

  -- 目标账号已经有钱包账户，说明不是首次认领；不自动合并余额，交人工处理
  if exists (select 1 from public.wallet_accounts w where w.owner_id = v_uid) then
    return jsonb_build_object('ok', false, 'reason', 'target_has_wallet');
  end if;

  -- 收集该邮箱名下仍挂在旧 id 上的所有 owner_id（钱包 + 订单两条线索）
  select coalesce(array_agg(distinct x), '{}'::text[])
    into v_old
    from (
      select w.owner_id as x
        from public.wallet_accounts w
       where w.owner_email is not null
         and lower(btrim(w.owner_email)) = v_mail
         and w.owner_id <> v_uid
      union
      select o.owner_id
        from public.payment_orders o
       where o.payer_email is not null
         and lower(btrim(o.payer_email)) = v_mail
         and o.owner_id <> v_uid
    ) s
   where s.x is not null;

  if cardinality(v_old) = 0 then
    return jsonb_build_object('ok', true, 'claimed', false, 'reason', 'no_legacy_rows');
  end if;

  -- 先搬引用方，最后搬账户本身：否则匹配条件会被自己改掉
  update public.wallet_transactions set owner_id = v_uid where owner_id = any(v_old);
  get diagnostics n_tx = row_count;

  update public.withdrawals        set owner_id = v_uid where owner_id = any(v_old);
  get diagnostics n_withdrawals = row_count;

  update public.readings           set owner_id = v_uid where owner_id = any(v_old);
  get diagnostics n_readings = row_count;

  update public.payment_orders     set owner_id = v_uid where owner_id = any(v_old);
  get diagnostics n_orders = row_count;

  -- owner_id 是主键；同邮箱若有多条钱包，只迁余额最大的那条
  update public.wallet_accounts w
     set owner_id = v_uid, updated_at = now()
   where w.owner_id = (
     select w2.owner_id
       from public.wallet_accounts w2
      where w2.owner_id = any(v_old)
        and w2.owner_email is not null
        and lower(btrim(w2.owner_email)) = v_mail
      order by w2.balance desc
      limit 1
   );
  get diagnostics n_wallet = row_count;

  return jsonb_build_object('ok', true, 'claimed', true,
    'wallet', n_wallet, 'transactions', n_tx, 'orders', n_orders,
    'readings', n_readings, 'withdrawals', n_withdrawals, 'legacy_ids', to_jsonb(v_old));
end;
$$;

-- 2. 触发器包装：任何异常都不能阻塞注册/确认 --------------------------------
create or replace function public.on_auth_user_signup_claim()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_res jsonb;
begin
  begin
    v_res := public.claim_legacy_data(new.id, new.email);
    raise notice 'claim_legacy_data uid=% result=%', new.id, v_res;
  exception when others then
    raise warning 'claim_legacy_data failed uid=% err=%', new.id, sqlerrm;
  end;
  return new;
end;
$$;

-- 3. 两个触发点：注册即确认（auto-confirm 场景）/ 点确认邮件后 --------------
drop trigger if exists trg_auth_user_signup_claim on auth.users;
drop trigger if exists trg_auth_user_confirm_claim on auth.users;

create trigger trg_auth_user_signup_claim
after insert on auth.users
for each row
when (new.email is not null and new.email_confirmed_at is not null)
execute function public.on_auth_user_signup_claim();

create trigger trg_auth_user_confirm_claim
after update of email_confirmed_at on auth.users
for each row
when (new.email is not null and new.email_confirmed_at is not null and old.email_confirmed_at is null)
execute function public.on_auth_user_signup_claim();

-- 4. 收权：禁止外部直接调用（否则可传任意邮箱抢资产） -----------------------
revoke all on function public.claim_legacy_data(uuid, text) from public;
revoke all on function public.claim_legacy_data(uuid, text) from anon, authenticated;
revoke all on function public.on_auth_user_signup_claim() from public;
revoke all on function public.on_auth_user_signup_claim() from anon, authenticated;

comment on function public.claim_legacy_data(uuid, text) is
  '按邮箱把旧 owner_id 名下的钱包/流水/订单/测算/提现迁到新用户；仅触发器可调用';

-- 5. 自检 -------------------------------------------------------------------
-- 应返回 2 行（INSERT 与 UPDATE 各一），tgenabled 均为 O
select tgname,
       case when tgtype & 4 = 4 then 'INSERT' else 'UPDATE' end as on_event,
       tgenabled
  from pg_trigger
 where tgrelid = 'auth.users'::regclass
   and tgname in ('trg_auth_user_signup_claim','trg_auth_user_confirm_claim')
 order by tgname;
