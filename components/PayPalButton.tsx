"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Locale } from "@/lib/i18n";
import { getPayMessages } from "@/lib/pay-i18n";

/** 站点语言 → PayPal SDK locale。 */
const PP_LOCALE: Record<string, string> = {
  en: "en_US", zh: "zh_CN", ja: "ja_JP", ko: "ko_KR", es: "es_ES",
  fr: "fr_FR", de: "de_DE", pt: "pt_PT", ru: "ru_RU", ar: "ar_AR",
};

let sdkPromise: Promise<void> | null = null;

/** 动态加载 PayPal JS SDK（全局仅加载一次；client-id 决定沙盒/正式）。 */
function loadSdk(clientId: string, locale: string): Promise<void> {
  if ((window as any).paypal) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src =
      "https://www.paypal.com/sdk/js?client-id=" +
      encodeURIComponent(clientId) +
      "&currency=USD&intent=capture&components=buttons&locale=" +
      encodeURIComponent(locale);
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      sdkPromise = null;
      reject(new Error("PayPal SDK load failed"));
    };
    document.head.appendChild(s);
  });
  return sdkPromise;
}

/**
 * 真实 PayPal 支付按钮（官方 SDK）。
 * - 金额由服务端商品表决定（product: "bazi" | "shop:<id>"）
 * - 支付成功 → 服务端捕获 → onSuccess(订单信息)
 */
export function PayPalButton({
  product,
  locale,
  note,
  onSuccess,
}: {
  product: string;
  locale: Locale;
  note?: string;
  onSuccess?: (order: any) => void;
}) {
  const t = getPayMessages(locale);
  const [phase, setPhase] = useState<"loading" | "ready" | "processing" | "done" | "error" | "unavailable">("loading");
  const [order, setOrder] = useState<any>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/paypal/config");
        const cfg = (await res.json()) as any;
        if (cancelled) return;
        if (!cfg.configured || !cfg.clientId) {
          setPhase("unavailable");
          return;
        }
        await loadSdk(cfg.clientId, PP_LOCALE[locale] || "en_US");
        if (cancelled || !boxRef.current || renderedRef.current) return;
        renderedRef.current = true;

        (window as any).paypal
          .Buttons({
            style: { layout: "vertical", shape: "rect", label: "paypal" },
            createOrder: async () => {
              const r = await fetch("/api/paypal/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ product }),
              });
              const j = (await r.json()) as any;
              if (!r.ok || !j.id) throw new Error(j.error || "create failed");
              return j.id;
            },
            onApprove: async (data: any) => {
              setPhase("processing");
              try {
                const r = await fetch("/api/paypal/capture-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ orderId: data.orderID }),
                });
                const j = (await r.json()) as any;
                if (r.ok && j.status === "COMPLETED") {
                  setOrder(j);
                  setPhase("done");
                  onSuccessRef.current?.(j);
                } else {
                  setPhase("error");
                }
              } catch {
                setPhase("error");
              }
            },
            onError: () => setPhase("error"),
            onCancel: () => setPhase((p) => (p === "processing" ? "ready" : p)),
          })
          .render(boxRef.current);
        setPhase((p) => (p === "loading" ? "ready" : p));
      } catch {
        if (!cancelled) setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, locale]);

  return (
    <div>
      {/* SDK 按钮容器：ready/processing 时保持挂载 */}
      <div
        ref={boxRef}
        className={phase === "loading" || phase === "unavailable" || phase === "error" ? "hidden" : ""}
      />

      {phase === "loading" && (
        <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted">
          <Loader2 size={15} className="animate-spin text-accent" />
        </div>
      )}

      {phase === "unavailable" && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-xs text-muted">
          {t.unavailable}
        </div>
      )}

      {phase === "processing" && (
        <p className="mt-2 text-center text-xs text-muted">{t.processing}</p>
      )}

      {phase === "error" && (
        <div className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          <AlertCircle size={14} /> {t.error}
        </div>
      )}

      {phase === "done" && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-center text-sm text-green-300">
          ✓ {t.success}
        </div>
      )}

      {note && phase !== "done" && (
        <p className="mt-3 text-center text-[10px] leading-relaxed text-muted/60">{note}</p>
      )}
    </div>
  );
}
