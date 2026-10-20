/**
 * Cloud database schema types (supabase-style) for strong typing.
 *
 * ⚠️ 本文件是**云端数据库结构的镜像**，改动需与线上一致。
 * 最后同步：2026-10-20（补齐 payment_orders 全字段、profiles/skills/page_views、
 * 钱包两张表与 4 个 RPC）。核对方式见文件末尾的「结构核对 SQL」。
 *
 * 注意：PostgreSQL 的 `numeric` 经 PostgREST 返回时是**字符串**（避免精度丢失），
 * 所以余额、金额类字段在 Row 里都声明为 `string`。
 */
export type Database = {
  public: {
    Tables: {
      readings: {
        Row: {
          id: number;
          owner_id: string;
          name: string | null;
          birth_date: string;
          birth_time: string | null;
          gender: string;
          focus: string | null;
          locale: string | null;
          report: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          owner_id?: string;
          name?: string | null;
          birth_date: string;
          birth_time?: string | null;
          gender: string;
          focus?: string | null;
          locale?: string | null;
          report: string;
          created_at?: string;
        };
        Update: {
          name?: string | null;
          birth_date?: string;
          birth_time?: string | null;
          gender?: string;
          focus?: string | null;
          locale?: string | null;
          report?: string;
        };
      };

      payment_orders: {
        Row: {
          id: number;
          owner_id: string;
          /** 支付方式：paypal / balance / manual … */
          method: string;
          amount: string | null;
          payer_note: string | null;
          contact: string | null;
          /** pending / completed / failed / refunded … */
          status: string;
          created_at: string;
          paypal_order_id: string | null;
          /** 商品标识：bazi / tarot / bagua / shop:<slug> */
          product: string | null;
          currency: string | null;
          payer_email: string | null;
          shipping_address: Record<string, unknown> | null;
          capture_raw: Record<string, unknown> | null;
          /** 商城订单履约状态：null（未处理）/ shipped */
          fulfillment: string | null;
        };
        Insert: {
          id?: number;
          owner_id?: string;
          method: string;
          amount?: string | null;
          payer_note?: string | null;
          contact?: string | null;
          status?: string;
          created_at?: string;
          paypal_order_id?: string | null;
          product?: string | null;
          currency?: string | null;
          payer_email?: string | null;
          shipping_address?: Record<string, unknown> | null;
          capture_raw?: Record<string, unknown> | null;
          fulfillment?: string | null;
        };
        Update: {
          status?: string;
          payer_note?: string | null;
          contact?: string | null;
          payer_email?: string | null;
          shipping_address?: Record<string, unknown> | null;
          capture_raw?: Record<string, unknown> | null;
          fulfillment?: string | null;
          paypal_order_id?: string | null;
        };
      };

      profiles: {
        Row: {
          owner_id: string;
          display_name: string | null;
          /** 指向 runtime 存储 users/<uid>/avatars/ */
          avatar_path: string | null;
          updated_at: string;
        };
        Insert: {
          owner_id?: string;
          display_name?: string | null;
          avatar_path?: string | null;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          avatar_path?: string | null;
          updated_at?: string;
        };
      };

      skills: {
        Row: {
          id: number;
          name: string;
          content: string;
          enabled: boolean;
          sort: number;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          content: string;
          enabled?: boolean;
          sort?: number;
          updated_at?: string;
        };
        Update: {
          name?: string;
          content?: string;
          enabled?: boolean;
          sort?: number;
          updated_at?: string;
        };
      };

      page_views: {
        Row: {
          id: number;
          path: string;
          locale: string | null;
          /** 随机访客 ID，不含 IP / 设备信息 */
          visitor_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          path: string;
          locale?: string | null;
          visitor_id?: string | null;
          created_at?: string;
        };
        Update: {
          path?: string;
          locale?: string | null;
        };
      };

      /**
       * 余额钱包（USD 记账）。一行一个用户，PK = owner_id。
       * 只能通过 wallet_grant / wallet_spend 变动，客户端无法直接改（RLS 只给读权限）。
       */
      wallet_accounts: {
        Row: {
          owner_id: string;
          owner_email: string | null;
          /** numeric → 字符串；DB 有 CHECK (balance >= 0) */
          balance: string;
          updated_at: string;
        };
        Insert: {
          owner_id?: string;
          owner_email?: string | null;
          balance?: string;
          updated_at?: string;
        };
        Update: {
          owner_email?: string | null;
        };
      };

      /** 余额流水：正数=充值/赠送，负数=消费。只读，由 RPC 写入。 */
      wallet_transactions: {        Row: {
          id: number;
          owner_id: string;
          amount: string;
          /** grant / adjust / purchase … */
          kind: string;
          /** 消费时记录购买的商品标识 */
          product: string | null;
          /** 关联订单号 / PayPal capture id 等 */
          ref_id: string | null;
          note: string | null;
          /** 本次变动后的余额快照 */
          balance_after: string | null;
          created_at: string;
        };
        Insert: {
          id?: never;
          owner_id: string;
          amount: string;
          kind: string;
          product?: string | null;
          ref_id?: string | null;
          note?: string | null;
          balance_after?: string | null;
          created_at?: string;
        };
        Update: {
          note?: string | null;
        };
      };

      /** 提现申请：申请时先冻结扣款，站长打款后置 paid，被拒则退款（kind='refund'）。 */
      withdrawals: {
        Row: {
          id: number;
          owner_id: string;
          amount: string;
          /** 收款 PayPal 账号（邮箱） */
          account: string;
          note: string | null;
          /** pending / paid / rejected */
          status: string;
          admin_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: never;
          owner_id?: string;
          amount: string;
          account: string;
          note?: string | null;
          status?: string;
          admin_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: string;
          admin_note?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      /** 当前登录用户是否管理员（内部按 lower(auth.email()) 白名单判定）。 */
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      /** 诊断用：返回当前会话的 uid 与 email。 */
      whoami: {
        Args: Record<string, never>;
        Returns: { uid: string | null; email: string | null }[];
      };
      /**
       * 管理员给指定邮箱发/扣余额（p_amount 为负即扣减）。
       * 要求 is_admin()；目标用户必须在 auth.users 存在。
       * 异常：FORBIDDEN / INVALID_AMOUNT / INVALID_EMAIL / USER_NOT_FOUND
       */
      wallet_grant: {
        Args: { p_email: string; p_amount: number; p_note?: string | null };
        Returns: { owner_id: string; email: string; balance: string };
      };
      /**
       * 当前登录用户消费余额（原子扣减，余额不足直接报错，不会写流水）。
       * 异常：NOT_AUTHENTICATED / INVALID_AMOUNT / INVALID_PRODUCT / INSUFFICIENT_BALANCE
       */
      wallet_spend: {
        Args: {
          p_amount: number;
          p_product: string;
          p_ref?: string | null;
          p_note?: string | null;
        };
        Returns: { balance: string; product: string };
      };
      /**
       * PayPal 充值入账（**只应由服务端签发的凭据调用**）。
       * p_sig = HMAC-SHA256(`${p_uid}|${p_amount}|${p_order}|${p_ts}`, 服务端与库内共享密钥)
       * 校验：签名、时间窗（±30min）、同一 PayPal 订单只能入账一次（ref_id 唯一索引）。
       * 异常：INVALID_UID / INVALID_AMOUNT / INVALID_ORDER / SIGNATURE_EXPIRED /
       *       BAD_SIGNATURE / ALREADY_CREDITED
       */
      wallet_recharge: {
        Args: {
          p_uid: string;
          /** 金额用字符串传，签名按原样拼接（避免 10 与 10.00 不一致） */
          p_amount: string;
          p_order: string;
          p_ts: number;
          p_sig: string;
        };
        Returns: { balance: string; amount: string };
      };
      /**
       * 余额支付（**只应由 /api/wallet/quote 签发的凭据调用**）。
       * p_sig = HMAC-SHA256(`${p_uid}|${p_product}|${p_amount}|${p_ts}`)
       * 强制 p_uid = auth.uid()（只能花自己的钱），余额不足抛 INSUFFICIENT_BALANCE。
       */
      wallet_spend_signed: {
        Args: {
          p_uid: string;
          p_product: string;
          p_amount: string;
          p_ts: number;
          p_sig: string;
        };
        Returns: { balance: string; product: string; amount: string };
      };
      /**
       * 提现申请：立即从余额扣款（冻结），生成 pending 记录。
       * 最低 $10。异常：NOT_AUTHENTICATED / INVALID_AMOUNT / AMOUNT_TOO_SMALL /
       * INVALID_ACCOUNT / INSUFFICIENT_BALANCE
       */
      wallet_withdraw_request: {
        Args: { p_amount: string; p_account: string; p_note?: string | null };
        Returns: { id: number; balance: string; amount: string };
      };
      /**
       * 提现审核（管理员）：p_action = 'paid' 标记已打款 / 'reject' 拒绝并退款。
       * 异常：FORBIDDEN / INVALID_ACTION / NOT_FOUND / ALREADY_SETTLED
       */
      wallet_withdraw_settle: {
        Args: { p_id: number; p_action: string; p_admin_note?: string | null };
        Returns: { id: number; status: string; balance?: string };
      };
    };
  };
};

/**
 * 结构核对 SQL（在云数据库控制台 / db_exec_sql 里跑，应与本文件一致）：
 *
 *   SELECT table_name, column_name, data_type, is_nullable, column_default
 *     FROM information_schema.columns
 *    WHERE table_schema='public'
 *    ORDER BY table_name, ordinal_position;
 *
 *   SELECT p.proname, pg_get_functiondef(p.oid)
 *     FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 *    WHERE n.nspname='public' ORDER BY p.proname;
 *
 *   SELECT tablename, policyname, cmd, roles::text, qual, with_check
 *     FROM pg_policies WHERE schemaname='public'
 *    ORDER BY tablename, policyname;
 */
