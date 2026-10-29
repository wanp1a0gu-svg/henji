"use client";

import { useEffect } from "react";
import { Sparkles, BookOpen, Compass, Star, ArrowRight, Check } from "lucide-react";
import { Locale, Messages } from "@/lib/i18n";
import { ChatContent } from "./ChatContent";
import { COURSES_OPEN } from "@/lib/site-config";
import { getUiMessages } from "@/lib/ui-i18n";
import { HeroScene } from "./HeroScene";

export function HomeContent({ messages, locale }: { messages: Messages; locale: Locale }) {
  const t = (key: string) => {
    const parts = key.split(".");
    let value: any = messages;
    for (const part of parts) value = value?.[part];
    if (Array.isArray(value)) {
      return (index: number, subKey?: string) => {
        const item = value[index];
        return subKey ? item?.[subKey] : item;
      };
    }
    return value || key;
  };

  const ui = getUiMessages(locale);
  const tCourse = t("courses.items") as (i: number, k: string) => string;
  const link = (path: string) => `/${locale}${path}`;

  // 整屏翻页下，浏览器"恢复滚动位置"会让人一进来就停在中间某一屏（看起来像页面空了）。
  // 首页一律从首屏开始。
  useEffect(() => {
    if (typeof history !== "undefined" && "scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    if (typeof window !== "undefined" && !window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, []);

  const stats = [
    { label: t("stats.years"), value: "10+" },
    { label: t("stats.students"), value: "2,000+" },
    { label: t("stats.readings"), value: "500+" },
  ];

  const pillars = locale === "zh"
    ? [
        { label: "年柱", god: "正印", gan: "辛", zhi: "酉", hidden: "藏 辛" },
        { label: "月柱", god: "食神", gan: "丙", zhi: "申", hidden: "藏 庚壬戊" },
        { label: "日柱", god: "日主", gan: "戊", zhi: "辰", hidden: "藏 戊乙癸" },
        { label: "时柱", god: "偏财", gan: "甲", zhi: "寅", hidden: "藏 甲丙戊" },
      ]
    : [
        { label: "Year", god: "Resource", gan: "辛", zhi: "酉", hidden: "Xin" },
        { label: "Month", god: "Output", gan: "丙", zhi: "申", hidden: "Geng·Ren·Wu" },
        { label: "Day", god: "Self", gan: "戊", zhi: "辰", hidden: "Wu·Yi·Gui" },
        { label: "Hour", god: "Wealth", gan: "甲", zhi: "寅", hidden: "Jia·Bing·Wu" },
      ];

  const baziBullets = [
    t("bazi.includes.report"),
    t("bazi.includes.time"),
    t("bazi.includes.privacy"),
    ui.trueSolar,
  ];

  const features = [
    { icon: Compass, title: t("features.personal.title"), desc: t("features.personal.desc") },
    { icon: Star, title: t("features.wisdom.title"), desc: t("features.wisdom.desc") },
    { icon: Sparkles, title: t("features.clarity.title"), desc: t("features.clarity.desc") },
  ];

  return (
    <main className="flex-1 snap-page">
      {/* Hero */}
      {/* 3D 点云背景：整页固定，滚动驱动形态变化 */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <HeroScene glyph={locale === "zh" ? "痕" : "T"} />
      </div>

      <section className="snap-section relative flex flex-col items-center justify-center overflow-hidden px-6 pt-[72px] pb-16 text-center">
        <div className="absolute inset-0 -z-10">
          <div className="pointer-events-none absolute left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-accent/[0.05] blur-[120px]" />
          
          
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="mx-auto mb-8 flex items-center justify-center gap-3">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-accent/60" />
            <p className="text-xs uppercase tracking-[0.35em] text-accent">{t("hero.eyebrow")}</p>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-accent/60" />
          </div>

          <h1 className="mb-6 font-serif text-5xl font-light leading-[1.1] tracking-tight text-gradient sm:text-7xl md:text-8xl">
            {t("hero.title")}
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-muted sm:text-xl">
            {t("hero.subtitle")}
          </p>

          <div className="flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row">
            <a
              href={link("/bazi")}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-8 py-4 text-sm font-medium text-background shadow-lg shadow-accent/20 transition hover:bg-accent-light hover:text-background sm:w-auto"
            >
              <Sparkles size={17} />
              {t("hero.ctaReading")}
              <span className="rounded-full bg-[#0d0b09]/85 px-2 py-0.5 text-[11px] font-medium text-accent">
                {t("bazi.price")}
              </span>
            </a>
            <a
              href={link("/courses")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-accent/30 bg-white/[0.03] px-8 py-4 text-sm font-medium text-accent backdrop-blur-sm transition hover:border-accent/60 hover:bg-accent/10 sm:w-auto"
            >
              <BookOpen size={17} />
              {t("hero.ctaCourses")}
            </a>
          </div>

          {/* Jump to the advisor */}
          <a
            href="#advisor"
            className="mt-8 inline-flex items-center gap-2 text-xs text-muted transition hover:text-accent"
          >
            <Sparkles size={13} />
            {ui.chatCta}
            <ArrowRight size={12} className="rotate-90" />
          </a>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-muted/50">
          <div className="h-8 w-5 rounded-full border border-white/20 p-1">
            <div className="h-1.5 w-1 rounded-full bg-accent mx-auto" />
          </div>
        </div>
      </section>

      {/* AI Advisor — 默认加载全部 skill 的对话入口 */}
      <section id="advisor" className="snap-section relative flex items-center overflow-hidden px-6 pt-[96px] pb-16 sm:pb-24">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/4 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-accent/[0.05] blur-[120px]" />
        </div>
        <ChatContent locale={locale} />
      </section>

      {/* Bazi — 主推服务 */}
      <section className="snap-section relative flex items-center overflow-hidden px-6 py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute end-1/4 top-1/3 h-[420px] w-[420px] rounded-full bg-accent/[0.06] blur-[120px]" />
        </div>

        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <p className="mb-4 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-accent">
              <span className="h-px w-6 bg-accent/60" />
              {ui.featured}
            </p>
            <h2 className="font-serif text-3xl font-light tracking-wide sm:text-4xl">{t("bazi.title")}</h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">{t("bazi.subtitle")}</p>

            <ul className="mt-7 space-y-3">
              {baziBullets.map((x) => (
                <li key={x} className="flex items-start gap-3 text-sm text-muted">
                  <Check size={15} className="mt-0.5 shrink-0 text-accent" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>

            <p className="mt-6 text-xs tracking-wide text-muted/55">
              {stats.map((s) => `${s.value} ${s.label}`).join("  ·  ")}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-5">
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-4xl text-accent">{t("bazi.price")}</span>
                <span className="text-xs text-muted">{t("bazi.priceLabel")}</span>
              </div>
              <a
                href={link("/bazi")}
                className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-medium text-background shadow-lg shadow-accent/20 transition hover:bg-accent-light"
              >
                <Sparkles size={16} />
                {ui.startReading}
                <ArrowRight size={14} className="transition group-hover:translate-x-1" />
              </a>
            </div>
          </div>

          <div className="glass rounded-2xl p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.25em] text-accent/70">
                {ui.sampleChart}
              </p>
              <span className="text-[10px] text-muted/40">
                {ui.illustrative}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {pillars.map((c) => (
                <div key={c.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-1.5 py-3 text-center">
                  <p className="text-[10px] text-muted/55">{c.label}</p>
                  <p className="mt-1 text-[10px] text-accent/70">{c.god}</p>
                  <p className="mt-2 font-serif text-2xl leading-none text-accent">{c.gan}</p>
                  <p className="mt-1 font-serif text-2xl leading-none text-foreground/90">{c.zhi}</p>
                  <p className="mt-2 text-[9px] leading-tight text-muted/45">{c.hidden}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3 text-[10px] text-muted/45">
              <span>{ui.sampleDayMaster}</span>
              <span>{ui.pillarsNote}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="snap-section flex items-center px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">{t("features.subtitle")}</p>
            <h2 className="font-serif text-3xl font-light tracking-wide sm:text-4xl">{t("features.title")}</h2>
            <div className="mx-auto mt-6 divider-gold" />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="glass glow-sm rounded-2xl p-6 text-center transition hover:border-accent/30 hover:bg-white/[0.05] sm:p-8">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-accent/20 bg-accent/10">
                  <f.icon size={24} className="text-accent" />
                </div>
                <h3 className="mb-3 font-serif text-xl">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses */}
      <section className="snap-section flex items-center px-6 py-16 sm:py-24 bg-white/[0.01]">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">{t("courses.subtitle")}</p>
              <h2 className="font-serif text-3xl font-light tracking-wide sm:text-4xl">{t("courses.title")}</h2>
              <div className="mt-6 divider-gold" />
            </div>
            <a
              href={link("/courses")}
              className="group inline-flex items-center gap-2 text-sm text-accent transition hover:text-accent-light"
            >
              {t("courses.viewAll")}
              <ArrowRight size={15} className="transition group-hover:translate-x-1" />
            </a>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="group glass glow-sm relative overflow-hidden rounded-2xl p-6 transition hover:border-accent/30 hover:bg-white/[0.05] sm:p-8"
              >
                <div className="absolute end-6 top-6 font-serif text-2xl text-accent/20 transition group-hover:text-accent/40">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mb-3 font-serif text-xl">{tCourse(i, "title")}</h3>
                <p className="mb-8 text-sm leading-relaxed text-muted">{tCourse(i, "desc")}</p>
                <div className="flex items-center justify-between border-t border-white/[0.06] pt-6">
                  <p className="font-serif text-2xl text-accent">
                    {COURSES_OPEN ? tCourse(i, "price") : ui.comingSoon}
                  </p>
                  <a
                    href={link("/courses")}
                    className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-muted transition hover:text-accent"
                  >
                    {t("courses.detail")} <ArrowRight size={12} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="snap-section flex items-center px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl rounded-3xl border border-white/[0.08] bg-gradient-to-br from-accent/10 via-transparent to-transparent p-8 text-center sm:p-16">
          <h2 className="mb-4 font-serif text-3xl font-light tracking-wide sm:text-4xl">{t("cta.title")}</h2>
          <p className="mx-auto mb-8 max-w-xl text-muted">{t("cta.subtitle")}</p>
          <a
            href={link("/bazi")}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-accent px-8 py-4 text-sm font-medium text-background shadow-lg shadow-accent/20 transition hover:bg-accent-light hover:text-background"
          >
            <Sparkles size={17} />
            {t("cta.button")}
            <ArrowRight size={15} className="transition group-hover:translate-x-1" />
          </a>
        </div>
      </section>
    </main>
  );
}
