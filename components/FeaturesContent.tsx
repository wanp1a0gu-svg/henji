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

  /**
   * 默认态只露「图标 + 名字」；鼠标移上去（或触屏点开）才浮出简介与箭头。
   * 触屏没有 hover，用 @media(hover:none) 让简介常显，避免手机上永远看不到说明。
   */
  const card = (item: FeatureItem, hot: boolean) => {
    const Icon = ICONS[item.key] || Sparkles;
    return (
      <a
        key={item.key}
        href={link(item.href)}
        className={`feat-card group relative flex h-[168px] flex-col justify-start overflow-hidden rounded-2xl border p-6 transition-all duration-300 ease-out hover:translate-x-1.5 hover:shadow-[12px_0_36px_-18px_rgba(201,168,124,0.5)] ${
          hot
            ? "border-white/[0.08] bg-white/[0.02] hover:border-accent/55 hover:bg-accent/[0.06]"
            : "border-white/[0.06] bg-white/[0.015] hover:border-accent/45 hover:bg-accent/[0.05]"
        }`}
      >
        {/* 悬停时的金色光晕 */}
        <span className="pointer-events-none absolute -inset-px rounded-2xl bg-[radial-gradient(circle_at_0%_50%,rgba(201,168,124,0.18),transparent_62%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent/20 bg-accent/10 transition-colors duration-300 group-hover:border-accent/45 group-hover:bg-accent/15">
            <Icon size={16} className="text-accent" />
          </span>
          <h3 className="font-serif text-lg text-foreground transition-colors duration-300 group-hover:text-accent">
            {item.title}
          </h3>
          <span className="ms-auto shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-muted/60 transition-colors duration-300 group-hover:border-accent/30 group-hover:text-accent/80">
            {item.badge}
          </span>
        </div>

        {/* 简介：默认收起，悬停/触屏展开 */}
        <div className="feat-desc relative mt-0 max-h-0 -translate-x-1.5 overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover:mt-3 group-hover:max-h-[84px] group-hover:translate-x-0 group-hover:opacity-100">
          <p className="text-[12.5px] leading-relaxed text-muted">{item.desc}</p>
        </div>

        <span className="feat-cta relative mt-0 inline-flex max-h-0 -translate-x-1.5 items-center gap-1.5 overflow-hidden text-[11px] text-accent opacity-0 transition-all duration-300 group-hover:mt-3 group-hover:max-h-6 group-hover:translate-x-0 group-hover:opacity-100">
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
