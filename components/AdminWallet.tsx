"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Minus, Plus, RefreshCw, Wallet } from "lucide-react";
import { getCloud } from "@/lib/cloud";

interface Account {
  owner_id: string;
  owner_email: string | null;
  balance: string;
  updated_at: string;
}

interface Tx {
  id: number;
  owner_id: string;
  amount: string;
  kind: string;
  product: string | null;
  note: string | null;
  balance_after: string | null;
  created_at: string;
}

interface Withdrawal {
  id: number;
  owner_id: string;
  amount: string;
  account: string;
  note: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
}

const money = (v: string | number | null | undefined) => {
  const n = typeof v === "number" ? v : parseFloat(v || "0");
  return (Number.isFinite(n) ? n : 0).toFixed(2);
};

const KIND_LABEL: Record<string, string> = {
  grant: "充值/赠送",
  adjust: "调整",
  purchase: "消费",
  withdraw: "提现",
  refund: "提现退回",
};

/** 把 RPC 抛出的英文异常码翻成人话 */
function explainError(raw: string): string {
  const s = raw || "";
  if (s.includes("USER_NOT_FOUND")) return "该邮箱还没有注册账号（auth.users 里查不到）";
  if (s.includes("INVALID_EMAIL")) return "邮箱格式不对";
  if (s.includes("INVALID_AMOUNT")) return "金额不能为 0";
  if (s.includes("FORBIDDEN")) return "当前账号不是管理员";
  if (s.includes("NOT_AUTHENTICATED")) return "未登录";
  if (s.includes("INSUFFICIENT_BALANCE")) return "余额不足";
  if (s.includes("INVALID_PRODUCT")) return "商品标识不能为空";
  return s;
}

/**
 * 管理后台 · 钱包面板。
 * 余额变动一律走 RPC：wallet_grant（发/扣）/ wallet_spend（用户消费）。
 * 客户端不能直接 UPDATE wallet_accounts（RLS 无用户 update 策略）。
 */
export function AdminWallet() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [txs, setTxs] = useState<Tx[] | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[] | null>(null);
  const [settlingId, setSettlingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // 发放表单
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setErr("");
    try {
      const db = getCloud().database;
      const [a, t, wd] = await Promise.all([
        db
          .from("wallet_accounts")
          .select("owner_id, owner_email, balance, updated_at")
          .order("updated_at", { ascending: false })
          .limit(200),
        db
          .from("wallet_transactions")
          .select("id, owner_id, amount, kind, product, note, balance_after, created_at")
          .order("created_at", { ascending: false })
          .limit(200),
        db
          .from("withdrawals")
          .select("id, owner_id, amount, account, note, status, admin_note, created_at")
          .order("created_at", { ascending: false })
          .limit(200),
      ]);
      if (a.error) throw new Error(a.error.message);
      if (t.error) throw new Error(t.error.message);
      if (wd.error) throw new Error(wd.error.message);
      setAccounts((a.data as Account[]) || []);
      setTxs((t.data as Tx[]) || []);
      setWithdrawals((wd.data as Withdrawal[]) || []);
    } catch (e: any) {
      setErr((e && e.message) || "加载失败");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const emailOf = (ownerId: string) =>
    accounts?.find((x) => x.owner_id === ownerId)?.owner_email || ownerId;

  const submit = async (sign: 1 | -1) => {
    setMsg("");
    setErr("");
    const amt = Math.abs(parseFloat(amount));
    if (!email.trim()) return setErr("请填写用户邮箱");
    if (!Number.isFinite(amt) || amt <= 0) return setErr("请填写大于 0 的金额");

    setSubmitting(true);
    try {
      const { data, error } = await getCloud().database.rpc("wallet_grant", {
        p_email: email.trim().toLowerCase(),
        p_amount: sign * amt,
        p_note: note.trim() || (sign > 0 ? "后台发放" : "后台扣减"),
      });
      if (error) throw new Error(error.message);
      const row: any = Array.isArray(data) ? data[0] : data;
      setMsg(
        `${sign > 0 ? "已发放" : "已扣减"} $${money(amt)} → ${row?.email || email}，当前余额 $${money(
          row?.balance
        )}`
      );
      setAmount("");
      setNote("");
      await load();
    } catch (e: any) {
      setErr(explainError((e && e.message) || "操作失败"));
    } finally {
      setSubmitting(false);
    }
  };

  /** 审核提现：'paid' 标记已打款 / 'reject' 拒绝并退回余额 */
  const settle = async (id: number, action: "paid" | "reject") => {
    const tip =
      action === "paid"
        ? "确认已经通过 PayPal 打款？标记后不可撤销。"
        : "确认拒绝这笔提现？金额会退回用户余额。";
    if (!window.confirm(tip)) return;
    setMsg("");
    setErr("");
    setSettlingId(id);
    try {
      const { error } = await getCloud().database.rpc("wallet_withdraw_settle", {
        p_id: id,
        p_action: action,
        p_admin_note: action === "paid" ? "已打款" : "已拒绝并退款",
      });
      if (error) throw new Error(error.message);
      setMsg(action === "paid" ? `提现 #${id} 已标记为已打款` : `提现 #${id} 已拒绝，金额已退回`);
      await load();
    } catch (e: any) {
      setErr(explainError((e && e.message) || "操作失败"));
    } finally {
      setSettlingId(null);
    }
  };

  const totalBalance = (accounts || []).reduce((s, a) => s + (parseFloat(a.balance) || 0), 0);

  return (
    <div className="space-y-6">
      {/* 发放 / 扣减 */}
      <div className="glass rounded-2xl p-6">
        <h3 className="mb-1 flex items-center gap-2 font-serif text-lg">
          <Wallet size={16} className="text-accent" />
          余额发放
        </h3>
        <p className="mb-5 text-xs text-muted">
          按邮箱给用户加钱或扣钱。用户必须已在站上注册（
          <code className="text-accent/80">auth.users</code> 有记录），否则会提示「还没有注册账号」。
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="用户邮箱"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm outline-none transition placeholder:text-muted/40 focus:border-accent/50"
          />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="金额（USD）"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm outline-none transition placeholder:text-muted/40 focus:border-accent/50"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="备注（可选）"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm outline-none transition placeholder:text-muted/40 focus:border-accent/50"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => submit(1)}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-medium text-background transition hover:bg-accent-light disabled:opacity-60"
          >
            {submitting ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            发放
          </button>
          <button
            onClick={() => submit(-1)}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-60"
          >
            {submitting ? <Loader2 size={13} className="animate-spin" /> : <Minus size={13} />}
            扣减
          </button>
          <button
            onClick={load}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-muted transition hover:border-accent/30 disabled:opacity-60"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            刷新
          </button>
        </div>

        {msg && (
          <p className="mt-4 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-2.5 text-xs text-green-300">
            {msg}
          </p>
        )}
        {err && (
          <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
            {err}
          </p>
        )}
      </div>

      {/* 提现审核 */}
      <div className="glass rounded-2xl p-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-serif text-lg">提现审核</h3>
          <p className="text-xs text-muted/70">
            待处理{" "}
            <span className="text-accent">
              {(withdrawals || []).filter((x) => x.status === "pending").length}
            </span>{" "}
            笔 · 申请时已从余额扣除，拒绝会自动退回
          </p>
        </div>
        {withdrawals === null ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={16} className="animate-spin text-accent/70" />
          </div>
        ) : withdrawals.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted">还没有提现申请</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="text-muted/60">
                <tr className="border-b border-white/[0.06]">
                  <th className="py-2 pe-4 font-normal">时间</th>
                  <th className="py-2 pe-4 font-normal">用户</th>
                  <th className="py-2 pe-4 font-normal">金额</th>
                  <th className="py-2 pe-4 font-normal">收款账号</th>
                  <th className="py-2 pe-4 font-normal">状态</th>
                  <th className="py-2 font-normal">操作</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((x) => (
                  <tr key={x.id} className="border-b border-white/[0.03]">
                    <td className="py-2.5 pe-4 text-muted/70">
                      {new Date(x.created_at).toLocaleString("zh-CN")}
                    </td>
                    <td className="py-2.5 pe-4 text-foreground/80">{emailOf(x.owner_id)}</td>
                    <td className="py-2.5 pe-4 font-medium text-accent tabular-nums">
                      ${money(x.amount)}
                    </td>
                    <td className="py-2.5 pe-4 text-muted">{x.account}</td>
                    <td className="py-2.5 pe-4">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] ${
                          x.status === "pending"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                            : x.status === "paid"
                              ? "border-green-500/30 bg-green-500/10 text-green-300"
                              : "border-white/10 bg-white/[0.04] text-muted"
                        }`}
                      >
                        {x.status === "pending" ? "待处理" : x.status === "paid" ? "已打款" : "已拒绝"}
                      </span>
                    </td>
                    <td className="py-2.5">
                      {x.status === "pending" ? (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => settle(x.id, "paid")}
                            disabled={settlingId === x.id}
                            className="rounded-lg bg-accent px-2.5 py-1 text-[10px] font-medium text-background transition hover:bg-accent-light disabled:opacity-60"
                          >
                            {settlingId === x.id ? "处理中…" : "标记已打款"}
                          </button>
                          <button
                            onClick={() => settle(x.id, "reject")}
                            disabled={settlingId === x.id}
                            className="rounded-lg border border-red-500/25 bg-red-500/10 px-2.5 py-1 text-[10px] text-red-300 transition hover:bg-red-500/20 disabled:opacity-60"
                          >
                            拒绝退款
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted/50">{x.admin_note || "—"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 账户列表 */}
      <div className="glass rounded-2xl p-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-serif text-lg">钱包账户</h3>
          <p className="text-xs text-muted/70">
            共 {accounts?.length ?? 0} 个账户 · 余额合计{" "}
            <span className="text-accent">${money(totalBalance)}</span>
          </p>
        </div>
        {accounts === null ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={16} className="animate-spin text-accent/70" />
          </div>
        ) : accounts.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted">还没有钱包账户</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="text-muted/60">
                <tr className="border-b border-white/[0.06]">
                  <th className="py-2 pe-4 font-normal">邮箱</th>
                  <th className="py-2 pe-4 font-normal">余额</th>
                  <th className="py-2 pe-4 font-normal">更新时间</th>
                  <th className="py-2 font-normal">owner_id</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.owner_id} className="border-b border-white/[0.03]">
                    <td className="py-2.5 pe-4 text-foreground/90">{a.owner_email || "—"}</td>
                    <td className="py-2.5 pe-4 font-medium text-accent tabular-nums">
                      ${money(a.balance)}
                    </td>
                    <td className="py-2.5 pe-4 text-muted/70">
                      {a.updated_at ? new Date(a.updated_at).toLocaleString("zh-CN") : "—"}
                    </td>
                    <td className="py-2.5 font-mono text-[10px] text-muted/40">{a.owner_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 流水 */}
      <div className="glass rounded-2xl p-6">
        <h3 className="mb-4 font-serif text-lg">最近流水</h3>
        {txs === null ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={16} className="animate-spin text-accent/70" />
          </div>
        ) : txs.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted">还没有流水记录</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="text-muted/60">
                <tr className="border-b border-white/[0.06]">
                  <th className="py-2 pe-4 font-normal">时间</th>
                  <th className="py-2 pe-4 font-normal">用户</th>
                  <th className="py-2 pe-4 font-normal">类型</th>
                  <th className="py-2 pe-4 font-normal">金额</th>
                  <th className="py-2 pe-4 font-normal">变动后</th>
                  <th className="py-2 font-normal">备注</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((t) => {
                  const amt = parseFloat(t.amount || "0");
                  const positive = amt > 0;
                  return (
                    <tr key={t.id} className="border-b border-white/[0.03]">
                      <td className="py-2.5 pe-4 text-muted/70">
                        {new Date(t.created_at).toLocaleString("zh-CN")}
                      </td>
                      <td className="py-2.5 pe-4 text-foreground/80">{emailOf(t.owner_id)}</td>
                      <td className="py-2.5 pe-4 text-muted">
                        {KIND_LABEL[t.kind] || t.kind}
                        {t.product ? <span className="text-muted/50"> · {t.product}</span> : null}
                      </td>
                      <td
                        className={`py-2.5 pe-4 font-medium tabular-nums ${
                          positive ? "text-green-300" : "text-foreground/80"
                        }`}
                      >
                        {positive ? "+" : "−"}${money(Math.abs(amt))}
                      </td>
                      <td className="py-2.5 pe-4 text-muted/70 tabular-nums">
                        ${money(t.balance_after)}
                      </td>
                      <td className="py-2.5 text-muted/60">{t.note || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
