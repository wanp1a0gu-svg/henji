"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Loader2, Wallet } from "lucide-react";
import { getCloud } from "@/lib/cloud";
import { Locale } from "@/lib/i18n";
import { getWalletMessages } from "@/lib/wallet-i18n";
import { useAuth } from "./AuthProvider";

interface WalletTx {
  id: number;
  amount: string;
  kind: string;
  product: string | null;
  note: string | null;
  balance_after: string | null;
  created_at: string;
}

const money = (v: string | number | null | undefined) => {
  const n = typeof v === "number" ? v : parseFloat(v || "0");
  return (Number.isFinite(n) ? n : 0).toFixed(2);
};

/**
 * 账户页 · 钱包卡：显示可用余额 + 最近交易流水。
 * 数据由 RLS 限定为「本人可见」（wallet_accounts / wallet_transactions 都只有 SELECT 策略）。
 */
export function WalletCard({ locale }: { locale: Locale }) {
  const w = getWalletMessages(locale);
  const { user } = useAuth();

  const [balance, setBalance] = useState<string>("0");
  const [txs, setTxs] = useState<WalletTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    kind === "grant"
      ? w.kindGrant
      : kind === "purchase"
        ? w.kindPurchase
        : w.kindAdjust;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/20 bg-accent/10">
          <Wallet size={18} className="text-accent" />
        </div>
        <div>
          <h2 className="font-serif text-xl">{w.title}</h2>
          <p className="text-xs text-muted">{w.currencyNote}</p>
        </div>
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
    </div>
  );
}
