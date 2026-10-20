"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  Plus,
  Wallet,
  X,
} from "lucide-react";
import { getCloud } from "@/lib/cloud";
import { Locale } from "@/lib/i18n";
import { getWalletMessages } from "@/lib/wallet-i18n";
import { useAuth } from "./AuthProvider";
import { PayPalButton } from "./PayPalButton";

interface WalletTx {
  id: number;
  amount: string;
  kind: string;
  product: string | null;
  note: string | null;
  balance_after: string | null;
  created_at: string;
}

/** 充值档位 —— 必须与 server.js 的 WALLET_TIERS 一致（金额由服务端定价） */
const TIERS = [10, 20, 50, 100, 200];

const money = (v: string | number | null | undefined) => {
  const n = typeof v === "number" ? v : parseFloat(v || "0");
  return (Number.isFinite(n) ? n : 0).toFixed(2);
};

/**
 * 账户页 · 钱包卡：可用余额 + 充值 + 最近交易流水。
 *
 * 数据只读：wallet_accounts / wallet_transactions 都只有 SELECT 策略。
 * 充值流程：PayPal 支付 → 服务端捕获并核验金额 → 返回签名凭据 →
 *          前端拿凭据调 RPC wallet_recharge 入账（签名防伪造，见 server.js）。
 */
export function WalletCard({ locale }: { locale: Locale }) {
  const w = getWalletMessages(locale);
  const { user } = useAuth();

  const [balance, setBalance] = useState<string>("0");
  const [txs, setTxs] = useState<WalletTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 充值弹窗
  const [open, setOpen] = useState(false);
  const [tier, setTier] = useState(20);
  const [credit, setCredit] = useState<"idle" | "crediting" | "ok" | "already" | "error">("idle");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const db = getCloud().database;
      // ⚠️ 必须显式按 owner_id 过滤：管理员账号的 RLS 会叠加 *_select_admin 策略，
      //    不加过滤的话管理员在自己账户页会看到全站流水。
      const [acct, list] = await Promise.all([
        db.from("wallet_accounts").select("balance, updated_at").eq("owner_id", user.id).limit(1),
        db
          .from("wallet_transactions")
          .select("id, amount, kind, product, note, balance_after, created_at")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      if (acct.error) throw new Error(acct.error.message);
      if (list.error) throw new Error(list.error.message);
      const row = Array.isArray(acct.data) ? acct.data[0] : null;
      setBalance((row && row.balance) || "0");
      setTxs((list.data as WalletTx[]) || []);
    } catch (e: any) {
      setError((e && e.message) || w.loadError);
    } finally {
      setLoading(false);
    }
  }, [user, w.loadError]);

  useEffect(() => {
    load();
  }, [load]);

  /** PayPal 支付成功 → 用服务端签发的凭据入账 */
  const handlePaid = async (order: any) => {
    const rc = order && order.recharge;
    if (!rc) {
      setCredit("error");
      return;
    }
    setCredit("crediting");
    try {
      const { error: err } = await getCloud().database.rpc("wallet_recharge", {
        p_uid: rc.uid,
        p_amount: rc.amount,
        p_order: rc.orderId,
        p_ts: rc.ts,
        p_sig: rc.sig,
      });
      if (err) {
        const msg = String(err.message || "");
        if (msg.indexOf("ALREADY_CREDITED") !== -1) {
          setCredit("already");
          await load();
          return;
        }
        console.error("[wallet] recharge failed:", msg);
        setCredit("error");
        return;
      }
      setCredit("ok");
      await load();
    } catch (e) {
      console.error("[wallet] recharge exception:", e);
      setCredit("error");
    }
  };

  const openRecharge = () => {
    setCredit("idle");
    setTier(20);
    setOpen(true);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const kindLabel = (kind: string) =>
    kind === "grant" ? w.kindGrant : kind === "purchase" ? w.kindPurchase : w.kindAdjust;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/20 bg-accent/10">
            <Wallet size={18} className="text-accent" />
          </div>
          <div>
            <h2 className="font-serif text-xl">{w.title}</h2>
            <p className="text-xs text-muted">{w.currencyNote}</p>
          </div>
        </div>
        <button
          onClick={openRecharge}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-medium text-background transition hover:bg-accent-light"
        >
          <Plus size={13} />
          {w.recharge}
        </button>
      </div>

      {/* 余额 */}
      <div className="glass relative overflow-hidden rounded-2xl p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/10 blur-[60px]" />
        <p className="text-xs uppercase tracking-[0.25em] text-accent">{w.balanceLabel}</p>
        <p className="mt-2 font-serif text-4xl font-light tracking-wide text-gradient">
          {loading ? "—" : `$${money(balance)}`}
        </p>
        {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
      </div>

      {/* 流水 */}
      <div className="mt-6">
        <p className="mb-3 text-xs uppercase tracking-[0.25em] text-muted/70">
          {w.transactionsTitle}
        </p>

        {loading ? (
          <div className="glass flex items-center justify-center rounded-2xl py-10">
            <Loader2 size={18} className="animate-spin text-accent/70" />
            <span className="ml-2 text-xs text-muted">{w.loading}</span>
          </div>
        ) : txs.length === 0 ? (
          <div className="glass rounded-2xl px-6 py-10 text-center">
            <p className="text-sm text-muted">{w.empty}</p>
            <p className="mt-1 text-xs text-muted/60">{w.emptyHint}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {txs.map((tx) => {
              const amt = parseFloat(tx.amount || "0");
              const positive = amt > 0;
              return (
                <div
                  key={tx.id}
                  className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-3.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        positive
                          ? "border border-accent/25 bg-accent/10 text-accent"
                          : "border border-white/10 bg-white/[0.04] text-muted"
                      }`}
                    >
                      {positive ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm">
                        {kindLabel(tx.kind)}
                        {tx.product ? (
                          <span className="ml-2 text-xs text-muted/70">{tx.product}</span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-muted/60">
                        {formatDate(tx.created_at)}
                        {tx.note ? ` · ${tx.note}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-serif text-lg tabular-nums ${
                        positive ? "text-accent" : "text-foreground/80"
                      }`}
                    >
                      {positive ? "+" : "−"}${money(Math.abs(amt))}
                    </p>
                    {tx.balance_after != null && (
                      <p className="text-[10px] text-muted/50">
                        {w.balanceAfter} ${money(tx.balance_after)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 充值弹窗 */}
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0b09] p-6 shadow-2xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted transition hover:bg-white/5 hover:text-foreground"
              aria-label={w.close}
            >
              <X size={16} />
            </button>

            <h3 className="font-serif text-xl">{w.rechargeTitle}</h3>
            <p className="mt-1 mb-5 text-xs text-muted">{w.rechargeHint}</p>

            <div className="mb-5 grid grid-cols-3 gap-2">
              {TIERS.map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setTier(v);
                    setCredit("idle");
                  }}
                  className={`rounded-xl border px-3 py-3 text-sm transition ${
                    tier === v
                      ? "border-accent/60 bg-accent/15 text-accent"
                      : "border-white/10 bg-white/[0.03] text-muted hover:border-accent/30"
                  }`}
                >
                  ${v}
                </button>
              ))}
            </div>

            {credit === "ok" || credit === "already" ? (
              <div className="rounded-xl border border-green-500/25 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                <p className="flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  {credit === "already" ? w.rechargeAlready : w.rechargeSuccess}
                </p>
              </div>
            ) : credit === "error" ? (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <p className="flex items-center gap-2">
                  <AlertCircle size={14} />
                  {w.rechargeFailed}
                </p>
              </div>
            ) : credit === "crediting" ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-muted">
                <Loader2 size={14} className="animate-spin text-accent" />
                {w.rechargeCrediting}
              </div>
            ) : (
              // key 变化时重建按钮，避免复用旧的 PayPal 实例
              <PayPalButton
                key={tier}
                product={`wallet:${tier}`}
                locale={locale}
                uid={user?.id}
                onSuccess={handlePaid}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
