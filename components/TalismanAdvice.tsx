"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { SHOP_PRODUCTS } from "@/lib/shop-data";
import { recommendTalismans } from "@/lib/talisman-match";
import { getTalismanMessages, formatFacts, plainFor } from "@/lib/talisman-i18n";

/**
 * 命盘解读完成后的符纸推荐（只推 1-2 个）。
 *
 * 关键点：每个推荐都带「命盘依据」——日主、财星/官星计数、桃花位、身弱比例等，
 * 用户能对着自己的命盘核对，而不是看一句「助事业」。
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
      return product ? { product, facts: p.facts } : null;
    })
    .filter(Boolean) as { product: (typeof SHOP_PRODUCTS)[number]; facts: any[] }[];

  if (!items.length) return null;

  const name = (p: (typeof SHOP_PRODUCTS)[number]) => (locale === "zh" ? p.nameZh : p.name);
  const desc = (p: (typeof SHOP_PRODUCTS)[number]) => (locale === "zh" ? p.descZh : p.desc);

  return (
    <section className="mt-8 rounded-2xl border border-accent/15 bg-accent/[0.03] p-5 sm:p-6">
      <div className="mb-1 flex items-center gap-2">
        <Sparkles size={14} className="text-accent" />
        <h3 className="font-serif text-base text-accent sm:text-lg">{t.title}</h3>
      </div>
      <p className="mb-5 text-[11.5px] leading-relaxed text-muted/70">{t.note}</p>

      <div className={items.length > 1 ? "grid gap-4 sm:grid-cols-2" : ""}>
        {items.map(({ product, facts }) => (
          <Link
            key={product.id}
            href={`/${locale}/shop`}
            className="group block rounded-xl border border-white/[0.07] bg-white/[0.015] p-4 transition hover:border-accent/40 hover:bg-accent/[0.05]"
          >
            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image}
                alt=""
                className="h-20 w-20 shrink-0 rounded-lg object-cover"
                loading="lazy"
              />
              <div className="min-w-0 flex-1">
                {/* 英文符名较长，允许两行，避免被 truncate 截成省略号 */}
                <p className="line-clamp-2 font-serif text-[14.5px] leading-snug text-foreground group-hover:text-accent">
                  {name(product)}
                </p>
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted/60">
                  {desc(product)}
                </p>
                <p className="mt-1.5 text-[12px] text-accent/80">${product.price}</p>
              </div>
            </div>

            {/* 大白话：先说人话，再说依据 */}
            <p className="mt-3 text-[12.5px] leading-[1.85] text-foreground/85">
              <span className="me-1 text-accent/70">{t.plainLabel}：</span>
              {plainFor(locale, product.id, facts)}
            </p>

            {/* 命盘依据：给愿意核对的人 */}
            <div className="mt-2.5 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2">
              <p className="text-[9.5px] uppercase tracking-[0.14em] text-muted/45">{t.basis}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted/80">
                {formatFacts(locale, facts)}
              </p>
            </div>
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
