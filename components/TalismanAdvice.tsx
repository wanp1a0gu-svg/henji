"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { SHOP_PRODUCTS } from "@/lib/shop-data";
import { recommendTalismans } from "@/lib/talisman-match";
import { getTalismanMessages } from "@/lib/talisman-i18n";

/**
 * 命盘解读完成后推荐的符纸。
 *
 * 只推商店里真实存在的款（按 id 取数据），推荐理由由规则算出来、
 * 文案按语言渲染；价格和图片都取自商店数据，避免两处不一致。
 */
export function TalismanAdvice({
  chart,
  focus,
  locale,
}: {
  chart: any;
  focus: string;
  locale: Locale;
}) {
  const t = getTalismanMessages(locale);
  const picks = recommendTalismans(chart, focus);

  const items = picks
    .map((p) => {
      const product = SHOP_PRODUCTS.find((x) => x.id === p.id);
      return product ? { product, reason: p.reason } : null;
    })
    .filter(Boolean) as { product: (typeof SHOP_PRODUCTS)[number]; reason: keyof typeof t.reasons }[];

  if (!items.length) return null;

  const name = (p: (typeof SHOP_PRODUCTS)[number]) => (locale === "zh" ? p.nameZh : p.name);
  const desc = (p: (typeof SHOP_PRODUCTS)[number]) => (locale === "zh" ? p.descZh : p.desc);

  return (
    <section className="mt-8 rounded-2xl border border-accent/15 bg-accent/[0.03] p-5 sm:p-6">
      <div className="mb-1 flex items-center gap-2">
        <Sparkles size={14} className="text-accent" />
        <h3 className="font-serif text-base text-accent sm:text-lg">{t.title}</h3>
      </div>
      <p className="mb-4 text-[11.5px] leading-relaxed text-muted/70">{t.note}</p>

      <div className="grid gap-3 sm:grid-cols-3">
        {items.map(({ product, reason }) => (
          <Link
            key={product.id}
            href={`/${locale}/shop`}
            className="group flex gap-3 rounded-xl border border-white/[0.07] bg-white/[0.015] p-3 transition hover:border-accent/40 hover:bg-accent/[0.05]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image}
              alt=""
              className="h-16 w-16 shrink-0 rounded-lg object-cover"
              loading="lazy"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-[13.5px] text-foreground group-hover:text-accent">
                {name(product)}
              </p>
              <p className="mt-0.5 inline-block rounded-full border border-accent/25 bg-accent/10 px-1.5 py-0.5 text-[9.5px] text-accent/90">
                {t.reasons[reason]}
              </p>
              <p className="mt-1 line-clamp-2 text-[10.5px] leading-relaxed text-muted/60">
                {desc(product)}
              </p>
            </div>
            <span className="shrink-0 self-center text-[11px] text-accent/70">${product.price}</span>
          </Link>
        ))}
      </div>

      <div className="mt-4">
        <Link
          href={`/${locale}/shop`}
          className="inline-flex items-center gap-1.5 text-[11.5px] text-accent/80 transition hover:text-accent"
        >
          {t.cta}
          <ArrowRight size={11} />
        </Link>
      </div>
    </section>
  );
}
