"use client";

import { useEffect, useState } from "react";
import { Sparkles, Gem, Truck, Info, ShieldCheck, RotateCcw, Landmark } from "lucide-react";
import { getUiMessages } from "@/lib/ui-i18n";
import { ShippingForm, EMPTY_SHIP, shipReady, type ShipInfo } from "./ShippingForm";
import { notifyOrder, shipToText } from "@/lib/notify";
import { Locale } from "@/lib/i18n";
import { getShopMessages } from "@/lib/shop-i18n";
import {
  SHOP_PRODUCTS,
  SHOP_CATEGORIES,
  SHOP_GROUPS,
  SHOP_GROUP_ORDER,
  type ShopProduct,
  type ShopCategory,
} from "@/lib/shop-data";
import { getPayMessages } from "@/lib/pay-i18n";
import { PayPalButton } from "./PayPalButton";
import { BalancePayButton } from "./BalancePayButton";
import { getAuthMessages } from "@/lib/auth-i18n";
import { getCloud } from "@/lib/cloud";
import { fetchStock, stockInfo, type StockMap } from "@/lib/shop-stock";
import { useAuth } from "./AuthProvider";

const BADGE_STYLE: Record<string, string> = {
  bestseller: "border-accent/30 bg-accent/90 text-background",
  premium: "border-white/20 bg-[#12100d]/90 text-accent",
  new: "border-white/20 bg-black/60 text-foreground",
};

export function ShopContent({ locale }: { locale: Locale }) {
  const s = getShopMessages(locale);
  const pay = getPayMessages(locale);
  const a = getAuthMessages(locale);
  const { user, openAuth } = useAuth();
  const [customInfo, setCustomInfo] = useState({ name: "", text: "" });
  const [ship, setShip] = useState<ShipInfo>(EMPTY_SHIP);
  const ui = getUiMessages(locale);
  const customReady = (p: any) => p.id !== "custom" || (customInfo.name.trim() !== "" && customInfo.text.trim() !== "");
  const [payOpen, setPayOpen] = useState<string>(""); // 展开支付的商品 id
  // 库存：拉不到就当有货，绝不因为网络问题让整店买不了
  const [stock, setStock] = useState<StockMap>({});
  useEffect(() => {
    let alive = true;
    fetchStock().then((m) => {
      if (alive) setStock(m);
    });
    return () => {
      alive = false;
    };
  }, []);
  const [paidId, setPaidId] = useState<string>(""); // 已支付商品 id
  const [cat, setCat] = useState<ShopCategory | "all">("all"); // 当前分类
  const isZh = locale === "zh";

  const catLabel = (c: ShopCategory) =>
    c === "wealth" ? s.catWealth
      : c === "relation" ? s.catRelation
        : c === "protection" ? s.catProtection
          : c === "clearing" ? s.catClearing
            : s.catCustom;

  const shown = cat === "all" ? SHOP_PRODUCTS : SHOP_PRODUCTS.filter((p) => p.category === cat);

  const badgeLabel = (p: ShopProduct) =>
    p.badge === "bestseller" ? s.badgeBest : p.badge === "premium" ? s.badgePremium : p.badge === "new" ? s.badgeNew : "";

  return (
    <main className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative px-6 pb-10 pt-16 text-center sm:pb-14 sm:pt-24">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-accent/[0.06] blur-[120px]" />
        </div>
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">{s.eyebrow}</p>
        <h1 className="mx-auto mb-5 max-w-3xl font-serif text-3xl font-light leading-tight text-gradient sm:text-4xl md:text-5xl">
          {s.title}
        </h1>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          {s.subtitle}
        </p>
      </section>

      {/* Category filter */}
      <section className="px-6 pb-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2">
          {(["all", ...SHOP_CATEGORIES] as (ShopCategory | "all")[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCat(c);
                setPayOpen("");
              }}
              className={`rounded-full px-4 py-1.5 text-xs transition ${
                cat === c
                  ? "bg-accent text-background"
                  : "border border-white/10 bg-white/[0.03] text-muted hover:border-accent/30"
              }`}
            >
              {c === "all" ? s.all : catLabel(c as ShopCategory)}
            </button>
          ))}
        </div>
      </section>

      {/* Products */}
      <section className="px-6 pb-8">
        <div className="mx-auto max-w-6xl space-y-12">
          {SHOP_GROUP_ORDER.filter((g) => shown.some((p) => p.group === g)).map((g) => (
            <div key={g}>
              <div className="mb-4 flex items-center gap-3">
                <h2 className="font-serif text-lg tracking-wide text-foreground/90">
                  {isZh ? SHOP_GROUPS[g].zh : SHOP_GROUPS[g].en}
                </h2>
                <span className="text-[11px] text-muted/50">
                  {shown.filter((p) => p.group === g).length}
                </span>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {shown.filter((p) => p.group === g).map((p) => (
            <div
              key={p.id}
              className="glass glow-sm group flex flex-col overflow-hidden rounded-2xl transition hover:border-accent/30"
            >
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-[#15130f]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
                {p.badge && (
                  <span
                    className={`absolute start-3 top-3 rounded-full border px-2.5 py-1 text-[10px] tracking-wide backdrop-blur-sm ${BADGE_STYLE[p.badge]}`}
                  >
                    {badgeLabel(p)}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-sm font-medium leading-snug text-foreground">
                  {isZh ? p.nameZh : p.name}
                </h3>
                <p className="mt-1 text-xs text-muted/80">{isZh ? p.name : p.nameZh}</p>
                <p className="mt-3 text-xs leading-relaxed text-muted">{isZh ? p.descZh : p.desc}</p>
                <p className="mt-2 text-[11px] leading-relaxed text-muted/60">
                  {isZh ? p.specZh : p.spec}
                </p>
                <div className="mt-3 flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-accent/70">{s.usageLabel}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted/75">
                    {isZh ? p.usageZh : p.usage}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="font-serif text-xl text-accent">${p.price}</span>
                  {(() => {
                    const st = stockInfo(stock, p.id);
                    if (st.soldOut) {
                      return (
                        <span className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-xs text-muted/70">
                          {s.soldOut}
                        </span>
                      );
                    }
                    return (
                      <button
                        type="button"
                        onClick={() => setPayOpen(payOpen === p.id ? "" : p.id)}
                        className="rounded-full bg-accent px-4 py-2 text-xs font-medium text-background shadow-lg shadow-accent/10 transition hover:bg-accent-light"
                      >
                        {s.buy}
                      </button>
                    );
                  })()}
                </div>

                {stockInfo(stock, p.id).low && (
                  <p className="mt-1.5 text-[11px] text-amber-200/70">
                    {s.onlyLeft.replace("{n}", String(stockInfo(stock, p.id).stock))}
                  </p>
                )}

                {payOpen === p.id && paidId !== p.id && !stockInfo(stock, p.id).soldOut && (
                  <div className="mt-4">
                    {user ? (
                      <>
                      <ShippingForm ui={ui} value={ship} onChange={setShip} />
                      {p.id === "custom" && (
                        <div className="mb-3 space-y-2 rounded-xl border border-accent/20 bg-accent/[0.04] p-3">
                          <input
                            value={customInfo.name}
                            onChange={(e) => setCustomInfo({ ...customInfo, name: e.target.value })}
                            placeholder={ui.customNameLabel}
                            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-foreground placeholder:text-muted/50 focus:border-accent/40 focus:outline-none"
                          />
                          <textarea
                            value={customInfo.text}
                            onChange={(e) => setCustomInfo({ ...customInfo, text: e.target.value })}
                            placeholder={ui.customTextLabel}
                            rows={2}
                            className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-foreground placeholder:text-muted/50 focus:border-accent/40 focus:outline-none"
                          />
                        </div>
                      )}
                      {!customReady(p) ? (
                        <p className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-3 py-3 text-center text-[11px] text-amber-200/90">
                          {ui.customFillHint}
                        </p>
                      ) : !shipReady(ship) ? (
                        <p className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-3 py-3 text-center text-[11px] text-amber-200/90">
                          {ui.shipHint}
                        </p>
                      ) : (
                      <>
                      <PayPalButton
                        product={"shop:" + p.id}
                        locale={locale}
                        onSuccess={async (order: any) => {
                          setPaidId(p.id);
                          notifyOrder("paid", order.payerEmail || (user && user.email), locale, {
                            product: "shop:" + p.id,
                            productName: (p as any).nameZh || (p as any).name || p.id,
                            amount: order.amount || String(p.price),
                            currency: order.currency || "USD",
                            shipTo: shipToText(ship),
                          });
                          try {
                            await getCloud().database.from("payment_orders").insert({
                              owner_id: user ? user.id : null,
                              method: "paypal",
                              amount: order.amount || String(p.price),
                              currency: order.currency || "USD",
                              product: order.product || "shop:" + p.id,
                              status: "completed",
                              paypal_order_id: order.orderId || null,
                              payer_email: order.payerEmail || null,
                              contact: ship.phone.trim() || order.payerEmail || null,
                              shipping_address: shipReady(ship) ? { ...ship } : order.shipping || null,
                              payer_note:
                                p.id === "custom"
                                  ? JSON.stringify({ name: customInfo.name.trim(), text: customInfo.text.trim() })
                                  : null,
                              capture_raw: order,
                            });
                          } catch (e) {
                            console.error("[order] shop insert failed", e);
                            try {
                              localStorage.setItem(
                                "traces_pending_order",
                                JSON.stringify({ order, product: p.id, at: new Date().toISOString() })
                              );
                            } catch {}
                          }
                        }}
                      />
                      <BalancePayButton
                        product={"shop:" + p.id}
                        locale={locale}
                        shipping={shipReady(ship) ? { ...ship } : null}
                        onSuccess={() => {
                          setPaidId(p.id);
                          notifyOrder("paid", user && user.email, locale, {
                            product: "shop:" + p.id,
                            productName: (p as any).nameZh || (p as any).name || p.id,
                            amount: String(p.price),
                            currency: "USD",
                            shipTo: shipToText(ship),
                          });
                        }}
                      />
                      </>
                      )}
                      </>
                    ) : (
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-center">
                        <p className="mb-2 text-[11px] text-muted">{pay.loginToBuy}</p>
                        <button
                          onClick={openAuth}
                          className="rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs text-accent transition hover:bg-accent/20"
                        >
                          {a.gateCta}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {paidId === p.id && (
                  <p className="mt-4 rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2.5 text-[11px] leading-relaxed text-green-300">
                    {pay.shopSuccess}
                  </p>
                )}
              </div>
            </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Shipping / notes */}
      <section className="px-6 pb-10">
        <div className="mx-auto max-w-6xl">
          <div className="glass rounded-2xl p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-start gap-3">
                <Truck size={15} className="mt-0.5 shrink-0 text-accent" />
                <p className="text-[11px] leading-relaxed text-muted">{s.shipping}</p>
              </div>
              <div className="flex items-start gap-3">
                <RotateCcw size={15} className="mt-0.5 shrink-0 text-accent" />
                <p className="text-[11px] leading-relaxed text-muted">{s.returns}</p>
              </div>
              <div className="flex items-start gap-3">
                <Landmark size={15} className="mt-0.5 shrink-0 text-accent" />
                <p className="text-[11px] leading-relaxed text-muted">{s.customs}</p>
              </div>
            </div>
            <p className="mt-5 flex items-start gap-2 border-t border-white/[0.06] pt-4 text-[10px] leading-relaxed text-muted/60">
              <Info size={12} className="mt-0.5 shrink-0 text-accent/70" />
              {s.natural}
            </p>
          </div>
        </div>
      </section>

      {/* CTA + disclaimer */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-4xl rounded-3xl border border-white/[0.08] bg-gradient-to-br from-accent/10 via-transparent to-transparent p-8 text-center sm:p-12">
          <Gem size={22} className="mx-auto mb-4 text-accent" />
          <h2 className="mb-6 font-serif text-2xl font-light sm:text-3xl">{s.ctaTitle}</h2>
          <a
            href={`/${locale}/bazi`}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-medium text-background shadow-lg shadow-accent/20 transition hover:bg-accent-light"
          >
            <Sparkles size={16} />
            {s.ctaBazi}
          </a>
        </div>
        <p className="mx-auto mt-8 flex max-w-2xl items-start justify-center gap-2 text-center text-[10px] leading-relaxed text-muted/60">
          <ShieldCheck size={11} className="mt-0.5 shrink-0" />
          {s.disclaimer}
        </p>
      </section>
    </main>
  );
}
