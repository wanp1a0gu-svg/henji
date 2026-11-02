"use client";

import {
  Sparkles,
  Moon,
  Compass,
  Star,
  BookOpen,
  FileText,
  Gem,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { Locale } from "@/lib/i18n";
import { getFeaturesMessages, FREE_KEYS, MID_KEYS, HIGH_KEYS, type FeatureItem } from "@/lib/features-i18n";

const ICONS: Record<string, any> = {
  advisor: Sparkles,
  tarot: Moon,
  bagua: Compass,
  ziwei: Star,
  learn: BookOpen,
  bazi: FileText,
  shop: Gem,
  courses: GraduationCap,
};

/**
 * 功能总览：按「免费 → 微付费 → 重付费」分组。
 * 每张卡整块是链接，点哪儿都能进详情页。
 */
export function FeaturesContent({ locale }: { locale: Locale }) {
  const t = getFeaturesMessages(locale);
  const link = (p: string) => `/${locale}${p}`;

  const card = (item: FeatureItem, hot: boolean) => {
    const Icon = ICONS[item.key] || Sparkles;
    return (
      <a
        key={item.key}
        href={link(item.href)}
        className={`group flex flex-col rounded-2xl border p-5 transition ${
          hot
            ? "border-white/[0.08] bg-white/[0.025] hover:border-accent/40 hover:bg-accent/[0.05]"
            : "border-white/[0.07] bg-white/[0.02] hover:border-accent/35"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/20 bg-accent/10">
            <Icon size={17} className="text-accent" />
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] ${
              hot
                ? "border border-accent/30 bg-accent/10 text-accent"
                : "border border-white/10 bg-white/[0.04] text-muted/80"
            }`}
          >
            {item.badge}
          </span>
        </div>

        <h3 className="mt-4 font-serif text-base text-foreground group-hover:text-accent transition">
          {item.title}
        </h3>
        <p className="mt-2 flex-1 text-[12.5px] leading-relaxed text-muted">{item.desc}</p>

        <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-accent">
          {t.cta}
          <ArrowRight size={12} className="transition group-hover:translate-x-0.5" />
        </span>
      </a>
    );
  };

  const byKeys = (keys: string[]) =>
    t.items.filter((i) => keys.indexOf(i.key) !== -1);

  return (
    <main className="flex-1 pt-[72px]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        {/* 标题 */}
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-[0.24em] text-accent/60">{t.eyebrow}</p>
          <h1 className="mx-auto mt-4 max-w-3xl font-serif text-3xl leading-tight text-gradient sm:text-4xl">
            {t.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted">{t.subtitle}</p>
        </div>

        {/* 免费 */}
        <section className="mt-14">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/[0.07]" />
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-accent/70">{t.sectionFree}</h2>
            <span className="h-px flex-1 bg-white/[0.07]" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {byKeys(FREE_KEYS).map((i) => card(i, true))}
          </div>
        </section>

        {/* 微付费 */}
        <section className="mt-12">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/[0.07]" />
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-muted/60">{t.sectionMid}</h2>
            <span className="h-px flex-1 bg-white/[0.07]" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {byKeys(MID_KEYS).map((i) => card(i, false))}
          </div>
        </section>

        {/* 重付费 */}
        <section className="mt-12">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/[0.07]" />
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-muted/60">{t.sectionHigh}</h2>
            <span className="h-px flex-1 bg-white/[0.07]" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {byKeys(HIGH_KEYS).map((i) => card(i, false))}
          </div>
        </section>

        {/* 两句说明 */}
        <div className="mx-auto mt-12 max-w-2xl space-y-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-center">
          <p className="text-[11px] leading-relaxed text-muted/70">{t.freeNote}</p>
          <p className="text-[11px] leading-relaxed text-muted/50">{t.loginNote}</p>
        </div>
      </div>
    </main>
  );
}
