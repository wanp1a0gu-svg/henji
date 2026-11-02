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
import { getFeaturesMessages, FREE_KEYS, MID_KEYS, HIGH_KEYS } from "@/lib/features-i18n";
import { openCatAssistant } from "@/lib/cat-open";

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
 * 首页第三屏：功能介绍。
 *
 * 和 /features 的区别：那里是「只有名字、悬停展开」的探索页；
 * 这里是介绍，简介直接显示（进来的人不需要先猜）。
 * 顺序仍按 免费 → 微付费 → 重付费。
 */
export function HomeFeatures({ locale }: { locale: Locale }) {
  const t = getFeaturesMessages(locale);
  const link = (p: string) => `/${locale}${p}`;

  const keys = [...FREE_KEYS, ...MID_KEYS, ...HIGH_KEYS];
  const items = keys.map((k) => t.items.find((i) => i.key === k)).filter(Boolean) as typeof t.items;

  return (
    <section className="snap-section relative flex items-center overflow-hidden px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-accent/70">{t.eyebrow}</p>
          <h2 className="font-serif text-3xl font-light text-gradient sm:text-4xl">{t.title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted">{t.subtitle}</p>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {items.map((item) => {
            const Icon = ICONS[item.key] || Sparkles;
            const isCat = item.key === "advisor";
            const clickable = true;
            const inner = (
              <>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent/15 bg-accent/[0.07] transition-colors group-hover:border-accent/45 group-hover:bg-accent/15">
                  <Icon size={15} className="text-accent" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-serif text-[15px] text-foreground transition-colors group-hover:text-accent">
                      {item.title}
                    </span>
                    <span className="rounded-full border border-white/10 px-1.5 py-0.5 text-[9px] text-muted/60">
                      {item.badge}
                    </span>
                  </span>
                  <span className="mt-1 block text-[12px] leading-relaxed text-muted/85">{item.desc}</span>
                </span>
                {clickable && (
                  <ArrowRight
                    size={13}
                    className="mt-1 shrink-0 text-accent/25 transition group-hover:translate-x-0.5 group-hover:text-accent"
                  />
                )}
              </>
            );

            const cls =
              "group flex w-full items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3.5 text-start transition hover:border-accent/35 hover:bg-accent/[0.045]";

            return isCat ? (
              <button key={item.key} type="button" onClick={openCatAssistant} className={cls}>
                {inner}
              </button>
            ) : (
              <a key={item.key} href={link(item.href)} className={cls}>
                {inner}
              </a>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <a
            href={link("/features")}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-xs text-muted transition hover:border-accent/40 hover:text-accent"
          >
            {t.eyebrow}
            <ArrowRight size={12} />
          </a>
        </div>
      </div>
    </section>
  );
}
