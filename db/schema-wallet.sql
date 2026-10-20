-- ============================================================================
-- 余额钱包（wallet）数据库结构快照
-- ============================================================================
-- 来源：2026-10-19 晚在另一台电脑上创建，2026-10-20 从云端反向同步回仓库。
-- 应用：wbapp_9pvnTdP5dI1cB9PjsWg1Ou（痕迹 Traces）
--
-- ⚠️ 这是**结构快照/参考**，线上表已存在。脚本用 IF NOT EXISTS / CREATE OR
--    REPLACE 写成幂等的，重跑不会破坏数据；但 RLS 策略不幂等（重复建会报错），
--    重建前先 DROP POLICY IF EXISTS 或跳过策略段。
--
-- 设计要点：
--   · 一个用户一行（PK = owner_id = auth.uid()），余额 USD 记账
--   · 客户端**只读**（RLS 只给 SELECT 策略），余额变动一律走 RPC：
--       wallet_grant  —— 管理员给指定邮箱加/扣钱（SECURITY DEFINER）
--       wallet_spend  —— 当前登录用户消费，带余额校验的原子扣减
--   · 每次变动都写一条 wallet_transactions 流水，含 balance_after 快照
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. 表
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.wallet_accounts (
  owner_id     text        NOT NULL DEFAULT auth.uid() PRIMARY KEY,
  owner_email  text,
  balance      numeric     NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id            bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_id      text        NOT NULL,
  amount        numeric     NOT NULL,             -- 正数=充值/赠送，负数=消费
  kind          text        NOT NULL,             -- grant / adjust / purchase
  product       text,                             -- 消费时的商品标识
  ref_id        text,                             -- 关联订单号 / capture id
  note          text,
  balance_after numeric,                          -- 变动后的余额快照
  created_at    timestamptz NOT NULL DEFAULT now()
);


-- ---------------------------------------------------------------------------
-- 2. 授权（与线上一致：DML 权限放开，实际由 RLS 兜底）
-- ---------------------------------------------------------------------------

GRANT SELECT, UPDATE ON public.wallet_accounts TO anon;
GRANT SELECT ON public.wallet_transactions TO anon;
GRANT ALL ON public.wallet_accounts TO authenticated, service_role;
GRANT ALL ON public.wallet_transactions TO authenticated, service_role;


-- ---------------------------------------------------------------------------
-- 3. RLS —— 普通用户只读自己的，管理员只读全部 + 可改账户
-- ---------------------------------------------------------------------------

ALTER TABLE public.wallet_accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- 读自己的钱包
CREATE POLICY wallet_accounts_select_own ON public.wallet_accounts
  FOR SELECT TO anon, authenticated
  USING (owner_id = auth.uid());

-- 管理员读全部
CREATE POLICY wallet_accounts_select_admin ON public.wallet_accounts
  FOR SELECT TO authenticated
  USING (is_admin());

-- 管理员改账户（人工调账；正常调账建议用 wallet_grant 以便留流水）
CREATE POLICY wallet_accounts_update_admin ON public.wallet_accounts
  FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- 流水：读自己的 + 管理员读全部（无写策略 → 客户端无法伪造流水）
CREATE POLICY wallet_transactions_select_own ON public.wallet_transactions
  FOR SELECT TO anon, authenticated
  USING (owner_id = auth.uid());

CREATE POLICY wallet_transactions_select_admin ON public.wallet_transactions
  FOR SELECT TO authenticated
  USING (is_admin());


-- ---------------------------------------------------------------------------
-- 4. RPC
-- ---------------------------------------------------------------------------

-- 管理员发放/扣减余额。p_amount 为负即扣减。
-- 目标用户必须在 auth.users 存在（按 email 反查 uid）。
CREATE OR REPLACE FUNCTION public.wallet_grant(
  p_email  text,
  p_amount numeric,
  p_note   text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_uid text;
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_bal numeric;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF p_amount IS NULL OR p_amount = 0 THEN RAISE EXCEPTION 'INVALID_AMOUNT'; END IF;
  IF v_email = '' THEN RAISE EXCEPTION 'INVALID_EMAIL'; END IF;
  SELECT u.id::text INTO v_uid FROM auth.users u WHERE lower(u.email) = v_email LIMIT 1;
  IF v_uid IS NULL THEN RAISE EXCEPTION 'USER_NOT_FOUND'; END IF;
  INSERT INTO public.wallet_accounts (owner_id, owner_email, balance) VALUES (v_uid, v_email, 0)
    ON CONFLICT (owner_id) DO UPDATE SET owner_email = excluded.owner_email;
  UPDATE public.wallet_accounts
     SET balance = balance + p_amount, updated_at = now()
   WHERE owner_id = v_uid
   RETURNING balance INTO v_bal;
  INSERT INTO public.wallet_transactions (owner_id, amount, kind, note, balance_after)
    VALUES (v_uid, p_amount, CASE WHEN p_amount > 0 THEN 'grant' ELSE 'adjust' END, p_note, v_bal);
  RETURN jsonb_build_object('owner_id', v_uid, 'email', v_email, 'balance', v_bal);
END
$function$;


-- 当前用户消费余额（原子扣减；余额不足直接报错，不写流水）。
CREATE OR REPLACE FUNCTION public.wallet_spend(
  p_amount  numeric,
  p_product text,
  p_ref     text DEFAULT NULL,
  p_note    text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_uid text := auth.uid();
  v_email text := nullif(lower(coalesce(auth.email(), '')), '');
  v_bal numeric;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'INVALID_AMOUNT'; END IF;
  IF p_product IS NULL OR length(btrim(p_product)) = 0 THEN RAISE EXCEPTION 'INVALID_PRODUCT'; END IF;
  INSERT INTO public.wallet_accounts (owner_id, owner_email) VALUES (v_uid, v_email)
    ON CONFLICT (owner_id) DO NOTHING;
  UPDATE public.wallet_accounts
     SET balance = balance - p_amount, updated_at = now()
   WHERE owner_id = v_uid AND balance >= p_amount
   RETURNING balance INTO v_bal;
  IF v_bal IS NULL THEN RAISE EXCEPTION 'INSUFFICIENT_BALANCE'; END IF;
  INSERT INTO public.wallet_transactions (owner_id, amount, kind, product, ref_id, note, balance_after)
    VALUES (v_uid, -p_amount, 'purchase', p_product, p_ref, p_note, v_bal);
  RETURN jsonb_build_object('balance', v_bal, 'product', p_product);
END
$function$;


-- ---------------------------------------------------------------------------
-- 5. 现状数据（2026-10-20 快照）
-- ---------------------------------------------------------------------------
-- wallet_accounts:     1 行 —— 872212051@qq.com, balance 99999.00
-- wallet_transactions: 1 行 —— +99999.00, kind=grant, note='后台初始赠送'
