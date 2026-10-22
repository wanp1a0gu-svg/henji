"use client";

import { useState } from "react";
import { Sparkles, Gem, Truck, Info, ShieldCheck } from "lucide-react";
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
  const [payOpen, setPayOpen] = useState<string>(""); // 展开支付的商品 id
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
                    className={`absolute left-3 top-3 rounded-full border px-2.5 py-1 text-[10px] tracking-wide backdrop-blur-sm ${BADGE_STYLE[p.badge]}`}
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
                <div className="mt-3 flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-accent/70">{s.usageLabel}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted/75">
                    {isZh ? p.usageZh : p.usage}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="font-serif text-xl text-accent">${p.price}</span>
                  <button
                    type="button"
                    onClick={() => setPayOpen(payOpen === p.id ? "" : p.id)}
                    className="rounded-full bg-accent px-4 py-2 text-xs font-medium text-background shadow-lg shadow-accent/10 transition hover:bg-accent-light"
                  >
                    {s.buy}
                  </button>
                </div>

                {payOpen === p.id && paidId !== p.id && (
                  <div className="mt-4">
                    {user ? (
                      <>
                      <PayPalButton
                        product={"shop:" + p.id}
                        locale={locale}
                        onSuccess={async (order: any) => {
                          setPaidId(p.id);
                          try {
                            await getCloud().database.from("payment_orders").insert({
                              method: "paypal",
                              amount: order.amount || String(p.price),
                              currency: order.currency || "USD",
                              product: order.product || "shop:" + p.id,
                              status: "completed",
                              paypal_order_id: order.orderId || null,
                              payer_email: order.payerEmail || null,
                              contact: order.payerEmail || null,
                              shipping_address: order.shipping || null,
                              capture_raw: order,
                            });
                          } catch {
                            /* 入库失败不影响用户 */
                          }
                        }}
                      />
                      <BalancePayButton
                        product={"shop:" + p.id}
                        locale={locale}
                        onSuccess={() => setPaidId(p.id)}
                      />
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
          <div className="glass flex flex-col gap-3 rounded-2xl p-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-center sm:gap-8">
            <span className="flex items-center gap-2">
              <Truck size={14} className="shrink-0 text-accent" />
              {s.shipping}
            </span>
            <span className="flex items-center gap-2">
              <Info size={14} className="shrink-0 text-accent" />
              {s.natural}
            </span>
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
