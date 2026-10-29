"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Wallet } from "lucide-react";
import { getCloud } from "@/lib/cloud";
import { Locale } from "@/lib/i18n";
import { getWalletMessages } from "@/lib/wallet-i18n";
import { useAuth } from "./AuthProvider";

const money = (v: string | number | null | undefined) => {
  const n = typeof v === "number" ? v : parseFloat(v || "0");
  return (Number.isFinite(n) ? n : 0).toFixed(2);
};

/**
 * 「用余额支付」按钮（挂在商品支付区，与 PayPal 并列）。
 *
 * 流程：POST /api/wallet/quote（服务端按价格表定价并签名）
 *      → RPC wallet_spend_signed（验签 + 原子扣减）
 *      → 写 payment_orders(method='balance') → onSuccess
 *
 * 金额由服务端签名，改前端只会验签失败，不会少付钱。
 */
export function BalancePayButton({
  product,
  locale,
  onSuccess,
  shipping,
}: {
  product: string;
  locale: Locale;
  onSuccess?: (order: any) => void;
  /** 实体商品的收货信息（写入 payment_orders.shipping_address） */
  shipping?: any;
}) {
  const w = getWalletMessages(locale);
  const { user } = useAuth();
  const [balance, setBalance] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const loadBalance = useCallback(async () => {
    if (!user) return setBalance(null);
    try {
      const { data } = await getCloud()
        .database.from("wallet_accounts")
        .select("balance")
        .eq("owner_id", user.id)
        .limit(1);
      const row = Array.isArray(data) ? data[0] : null;
      setBalance((row && row.balance) || "0");
    } catch {
      setBalance("0");
    }
  }, [user]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  const pay = async () => {
    if (!user) return;
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/wallet/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, uid: user.id }),
      });
      const quote = (await r.json()) as any;
      if (!r.ok || !quote.sig) throw new Error(quote.error || "quote failed");

      const { data, error } = await getCloud().database.rpc("wallet_spend_signed", {
        p_uid: quote.uid,
        p_product: quote.product,
        p_amount: quote.amount,
        p_ts: quote.ts,
        p_sig: quote.sig,
      });
      if (error) {
        const m = String(error.message || "");
        if (m.indexOf("INSUFFICIENT_BALANCE") !== -1) {
          setErr(w.payInsufficient);
          await loadBalance();
          return;
        }
        throw new Error(m);
      }

      // 订单入库（失败不阻塞交付）
      try {
        await getCloud().database.from("payment_orders").insert({
          method: "balance",
          amount: quote.amount,
          currency: quote.currency || "USD",
          product: quote.product,
          status: "completed",
          payer_email: user.email || null,
          contact: (shipping && shipping.phone) || user.email || null,
          shipping_address: shipping || null,
          capture_raw: { quote, result: data },
        });
      } catch {
        /* ignore */
      }

      const row: any = Array.isArray(data) ? data[0] : data;
      if (row && row.balance != null) setBalance(String(row.balance));

      // 取数据库签发的付款收据：服务端用同一密钥验签，确认这笔扣款真实存在
      let receipt: any = null;
      const txnId = row && row.txn_id != null ? row.txn_id : null;
      if (txnId != null) {
        try {
          const { data: rc } = await getCloud().database.rpc("wallet_receipt_sign", {
            p_txn: txnId,
          });
          const r: any = Array.isArray(rc) ? rc[0] : rc;
          if (r && r.sig) {
            receipt = {
              channel: "wallet",
              txn: String(r.txn),
              amount: String(r.amount),
              ts: r.ts,
              sig: r.sig,
            };
          }
        } catch {
          /* 拿不到收据 → 上层无法生成报告，会提示用户 */
        }
      }

      onSuccess?.({
        method: "balance",
        receipt,
        status: "COMPLETED",
        orderId: null,
        product: quote.product,
        productName: quote.productName,
        amount: quote.amount,
        currency: quote.currency || "USD",
        payerEmail: user.email || null,
      });
    } catch (e: any) {
      setErr((e && e.message) || w.payFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3">
      <button
        onClick={pay}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20 disabled:opacity-60"
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Wallet size={15} />}
        {w.payWith}
        {balance !== null && (
          <span className="text-xs text-muted">（${money(balance)}）</span>
        )}
      </button>
      {err && <p className="mt-2 text-center text-[11px] text-red-300">{err}</p>}
    </div>
  );
}
