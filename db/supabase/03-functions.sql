-- ============================================================================
-- 痕迹 Traces · 钱包与鉴权函数（从旧库 1:1 移植）
-- ============================================================================
-- 来源：从 wbapp_9pvnTdP5dI1cB9PjsWg1Ou 用 pg_get_functiondef() 原样导出，
--       2026-11-13 导出，逻辑未做任何修改。
--
-- ⚠️ 与原库唯一的差异：签名密钥不再硬编码在函数体里。
--    原库 5 个函数各自写死同一串 48 位 hex，改密钥要改 5 处、且函数体本身入了库。
--    这里改成从 public.app_secrets 读，改密钥只需 update 一行。
--
-- 执行顺序：01-schema.sql → 02-rls.sql → 本文件 → 04-import-data.sql
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. 密钥表（前端永远读不到：开了 RLS 且没有任何策略，只允许函数以 definer 身份读）
-- ---------------------------------------------------------------------------
create table if not exists public.app_secrets (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_secrets enable row level security;
revoke all on public.app_secrets from anon, authenticated;

-- 密钥由运维单独写入，不随本文件入库。在 SQL Editor 里执行（值取自
-- server-config.json 的 WALLET_RECHARGE_SECRET，与原库完全一致）：
--
--   insert into public.app_secrets (key, value)
--   values ('wallet_secret', '<48位hex>')
--   on conflict (key) do update set value = excluded.value, updated_at = now();

-- 取密钥的小工具，避免每个函数重复写 select
create or replace function public.wallet_secret()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select value from public.app_secrets where key = 'wallet_secret';
$$;
revoke all on function public.wallet_secret() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 1. wallet_grant —— 管理员发放/扣减余额（p_amount 为负即扣减）
-- ---------------------------------------------------------------------------
create or replace function public.wallet_grant(
  p_email  text,
  p_amount numeric,
  p_note   text default null
)
returns jsonb
language plpgsql
security definer
as $function$
declare
  v_uid text;
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_bal numeric;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if p_amount is null or p_amount = 0 then raise exception 'INVALID_AMOUNT'; end if;
  if v_email = '' then raise exception 'INVALID_EMAIL'; end if;
  select u.id::text into v_uid from auth.users u where lower(u.email) = v_email limit 1;
  if v_uid is null then raise exception 'USER_NOT_FOUND'; end if;
  insert into public.wallet_accounts (owner_id, owner_email, balance) values (v_uid, v_email, 0)
    on conflict (owner_id) do update set owner_email = excluded.owner_email;
  update public.wallet_accounts
     set balance = balance + p_amount, updated_at = now()
   where owner_id = v_uid
   returning balance into v_bal;
  insert into public.wallet_transactions (owner_id, amount, kind, note, balance_after)
    values (v_uid, p_amount, case when p_amount > 0 then 'grant' else 'adjust' end, p_note, v_bal);
  return jsonb_build_object('owner_id', v_uid, 'email', v_email, 'balance', v_bal);
end
$function$;

-- ---------------------------------------------------------------------------
-- 2. wallet_spend —— 当前登录用户消费（原子扣减，余额不足直接报错）
-- ---------------------------------------------------------------------------
create or replace function public.wallet_spend(
  p_amount  numeric,
  p_product text,
  p_ref     text default null,
  p_note    text default null
)
returns jsonb
language plpgsql
security definer
as $function$
declare
  v_uid text := auth.uid();
  v_email text := nullif(lower(coalesce(auth.email(), '')), '');
  v_bal numeric;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;
  if p_product is null or length(btrim(p_product)) = 0 then raise exception 'INVALID_PRODUCT'; end if;
  insert into public.wallet_accounts (owner_id, owner_email) values (v_uid, v_email)
    on conflict (owner_id) do nothing;
  update public.wallet_accounts
     set balance = balance - p_amount, updated_at = now()
   where owner_id = v_uid and balance >= p_amount
   returning balance into v_bal;
  if v_bal is null then raise exception 'INSUFFICIENT_BALANCE'; end if;
  insert into public.wallet_transactions (owner_id, amount, kind, product, ref_id, note, balance_after)
    values (v_uid, -p_amount, 'purchase', p_product, p_ref, p_note, v_bal);
  return jsonb_build_object('balance', v_bal, 'product', p_product);
end
$function$;

-- ---------------------------------------------------------------------------
-- 3. wallet_spend_signed —— 带签名验签的消费，返回 txn_id（付费墙收据用）
--    签名串：uid|product|amount(原始文本)|ts，HMAC-SHA256，有效期 ±900s
-- ---------------------------------------------------------------------------
create or replace function public.wallet_spend_signed(
  p_uid     text,
  p_product text,
  p_amount  text,
  p_ts      bigint,
  p_sig     text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_secret text := public.wallet_secret();
  v_amount numeric;
  v_expect text;
  v_bal numeric;
  v_txn bigint;
  v_now bigint := extract(epoch from now())::bigint;
begin
  if auth.uid() is null or p_uid is null or p_uid <> auth.uid() then raise exception 'FORBIDDEN'; end if;
  begin
    v_amount := p_amount::numeric;
  exception when others then
    raise exception 'INVALID_AMOUNT';
  end;
  if v_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;
  if p_product is null or length(btrim(p_product)) = 0 then raise exception 'INVALID_PRODUCT'; end if;
  if p_ts is null or abs(v_now - p_ts) > 900 then raise exception 'SIGNATURE_EXPIRED'; end if;
  v_expect := encode(hmac(p_uid || '|' || p_product || '|' || p_amount || '|' || p_ts::text, v_secret, 'sha256'), 'hex');
  if lower(coalesce(p_sig, '')) <> v_expect then raise exception 'BAD_SIGNATURE'; end if;
  update public.wallet_accounts set balance = balance - v_amount, updated_at = now()
   where owner_id = p_uid and balance >= v_amount returning balance into v_bal;
  if v_bal is null then raise exception 'INSUFFICIENT_BALANCE'; end if;
  insert into public.wallet_transactions (owner_id, amount, kind, product, note, balance_after)
    values (p_uid, -v_amount, 'purchase', p_product, '余额支付', v_bal)
    returning id into v_txn;
  return jsonb_build_object('balance', v_bal, 'product', p_product, 'amount', v_amount, 'txn_id', v_txn);
end
$function$;

-- ---------------------------------------------------------------------------
-- 4. wallet_receipt_sign —— 付费墙收据签发
--    签名串：wallet|txn|amount(FM999999990.00 格式)|ts
-- ---------------------------------------------------------------------------
create or replace function public.wallet_receipt_sign(p_txn bigint)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_secret text := public.wallet_secret();
  v_uid text := auth.uid();
  v_amount numeric;
  v_amt_text text;
  v_ts bigint := extract(epoch from now())::bigint;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select abs(amount) into v_amount from public.wallet_transactions
   where id = p_txn and owner_id = v_uid and kind = 'purchase';
  if v_amount is null then raise exception 'RECEIPT_NOT_FOUND'; end if;
  v_amt_text := to_char(v_amount, 'FM999999990.00');
  return jsonb_build_object(
    'txn', p_txn,
    'amount', v_amt_text,
    'ts', v_ts,
    'sig', encode(hmac('wallet|' || p_txn::text || '|' || v_amt_text || '|' || v_ts::text, v_secret, 'sha256'), 'hex')
  );
end
$function$;

-- ---------------------------------------------------------------------------
-- 5. wallet_recharge —— PayPal 付款后入账
--    签名串：uid|amount(原始文本)|order|ts，有效期 ±1800s
-- ---------------------------------------------------------------------------
create or replace function public.wallet_recharge(
  p_uid    text,
  p_amount text,
  p_order  text,
  p_ts     bigint,
  p_sig    text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_secret text := public.wallet_secret();
  v_amount numeric;
  v_expect text;
  v_bal numeric;
  v_now bigint := extract(epoch from now())::bigint;
begin
  if p_uid is null or length(btrim(p_uid)) = 0 then raise exception 'INVALID_UID'; end if;
  begin
    v_amount := p_amount::numeric;
  exception when others then
    raise exception 'INVALID_AMOUNT';
  end;
  if v_amount <= 0 or v_amount > 10000 then raise exception 'INVALID_AMOUNT'; end if;
  if p_order is null or length(btrim(p_order)) < 6 then raise exception 'INVALID_ORDER'; end if;
  if p_ts is null or abs(v_now - p_ts) > 1800 then raise exception 'SIGNATURE_EXPIRED'; end if;
  v_expect := encode(hmac(p_uid || '|' || p_amount || '|' || p_order || '|' || p_ts::text, v_secret, 'sha256'), 'hex');
  if lower(coalesce(p_sig, '')) <> v_expect then raise exception 'BAD_SIGNATURE'; end if;
  if exists (select 1 from public.wallet_transactions t where t.ref_id = p_order and t.kind = 'grant') then
    raise exception 'ALREADY_CREDITED';
  end if;
  insert into public.wallet_accounts (owner_id, owner_email)
    values (p_uid, nullif(lower(coalesce(auth.email(), '')), ''))
    on conflict (owner_id) do nothing;
  update public.wallet_accounts set balance = balance + v_amount, updated_at = now()
   where owner_id = p_uid returning balance into v_bal;
  insert into public.wallet_transactions (owner_id, amount, kind, product, ref_id, note, balance_after)
    values (p_uid, v_amount, 'grant', 'wallet-recharge', p_order, 'PayPal 充值', v_bal);
  return jsonb_build_object('balance', v_bal, 'amount', v_amount);
end
$function$;

-- ---------------------------------------------------------------------------
-- 6. wallet_withdraw_request —— 申请提现（立即冻结余额，下限 10 / 上限 10000）
-- ---------------------------------------------------------------------------
create or replace function public.wallet_withdraw_request(
  p_amount  text,
  p_account text,
  p_note    text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_uid text := auth.uid();
  v_amount numeric;
  v_bal numeric;
  v_id bigint;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  begin
    v_amount := p_amount::numeric;
  exception when others then
    raise exception 'INVALID_AMOUNT';
  end;
  if v_amount < 10 then raise exception 'AMOUNT_TOO_SMALL'; end if;
  if v_amount > 10000 then raise exception 'INVALID_AMOUNT'; end if;
  if p_account is null or length(btrim(p_account)) < 5 then raise exception 'INVALID_ACCOUNT'; end if;
  update public.wallet_accounts set balance = balance - v_amount, updated_at = now()
   where owner_id = v_uid and balance >= v_amount returning balance into v_bal;
  if v_bal is null then raise exception 'INSUFFICIENT_BALANCE'; end if;
  insert into public.withdrawals (owner_id, amount, account, note, status)
    values (v_uid, v_amount, btrim(p_account), nullif(btrim(coalesce(p_note, '')), ''), 'pending')
    returning id into v_id;
  insert into public.wallet_transactions (owner_id, amount, kind, product, ref_id, note, balance_after)
    values (v_uid, -v_amount, 'withdraw', 'withdraw', v_id::text, '提现申请', v_bal);
  return jsonb_build_object('id', v_id, 'balance', v_bal, 'amount', v_amount);
end
$function$;

-- ---------------------------------------------------------------------------
-- 7. wallet_withdraw_settle —— 管理员标记已打款 / 驳回并退回
-- ---------------------------------------------------------------------------
create or replace function public.wallet_withdraw_settle(
  p_id         bigint,
  p_action     text,
  p_admin_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_row public.withdrawals;
  v_bal numeric;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if p_action not in ('paid', 'reject') then raise exception 'INVALID_ACTION'; end if;
  select * into v_row from public.withdrawals where id = p_id for update;
  if v_row.id is null then raise exception 'NOT_FOUND'; end if;
  if v_row.status <> 'pending' then raise exception 'ALREADY_SETTLED'; end if;
  if p_action = 'paid' then
    update public.withdrawals set status = 'paid', admin_note = nullif(btrim(coalesce(p_admin_note, '')), ''), updated_at = now() where id = p_id;
    return jsonb_build_object('id', p_id, 'status', 'paid');
  end if;
  update public.wallet_accounts set balance = balance + v_row.amount, updated_at = now()
   where owner_id = v_row.owner_id returning balance into v_bal;
  update public.withdrawals set status = 'rejected', admin_note = nullif(btrim(coalesce(p_admin_note, '')), ''), updated_at = now() where id = p_id;
  insert into public.wallet_transactions (owner_id, amount, kind, product, ref_id, note, balance_after)
    values (v_row.owner_id, v_row.amount, 'refund', 'withdraw', p_id::text, '提现被拒，已退回', v_bal);
  return jsonb_build_object('id', p_id, 'status', 'rejected', 'balance', v_bal);
end
$function$;

-- ---------------------------------------------------------------------------
-- 8. 执行权限（与旧库一致：前端可调，具体校验在函数体内）
-- ---------------------------------------------------------------------------
grant execute on function public.wallet_grant(text, numeric, text)              to authenticated;
grant execute on function public.wallet_spend(numeric, text, text, text)         to authenticated;
grant execute on function public.wallet_spend_signed(text, text, text, bigint, text) to authenticated;
grant execute on function public.wallet_receipt_sign(bigint)                     to authenticated;
grant execute on function public.wallet_recharge(text, text, text, bigint, text) to authenticated;
grant execute on function public.wallet_withdraw_request(text, text, text)       to authenticated;
grant execute on function public.wallet_withdraw_settle(bigint, text, text)      to authenticated;
