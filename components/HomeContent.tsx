"use client";

import { Sparkles, BookOpen, Compass, Star, ArrowRight } from "lucide-react";
import { Locale, Messages } from "@/lib/i18n";
import { ChatContent } from "./ChatContent";

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

  const tCourse = t("courses.items") as (i: number, k: string) => string;
  const link = (path: string) => `/${locale}${path}`;

  const stats = [
    { label: t("stats.years"), value: "10+" },
    { label: t("stats.students"), value: "2,000+" },
    { label: t("stats.readings"), value: "500+" },
  ];

  const features = [
    { icon: Compass, title: t("features.personal.title"), desc: t("features.personal.desc") },
    { icon: Star, title: t("features.wisdom.title"), desc: t("features.wisdom.desc") },
    { icon: Sparkles, title: t("features.clarity.title"), desc: t("features.clarity.desc") },
  ];

  return (
    <main className="flex-1 snap-page">
      {/* Hero */}
      <section className="snap-section relative flex flex-col items-center justify-center overflow-hidden px-6 pt-[72px] pb-16 text-center">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-accent/[0.07] blur-[120px]" />
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_75%)]" />
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
              href={link("/courses")}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-8 py-4 text-sm font-medium text-background shadow-lg shadow-accent/20 transition hover:bg-accent-light hover:text-background sm:w-auto"
            >
              <BookOpen size={17} />
              {t("hero.ctaCourses")}
              <ArrowRight size={15} className="transition group-hover:translate-x-1" />
            </a>
            <a
              href={link("/bazi")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-accent/30 bg-white/[0.03] px-8 py-4 text-sm font-medium text-accent backdrop-blur-sm transition hover:border-accent/60 hover:bg-accent/10 sm:w-auto"
            >
              <Sparkles size={17} />
              {t("hero.ctaReading")}
            </a>
          </div>

          {/* Jump to the advisor */}
          <a
            href="#advisor"
            className="mt-8 inline-flex items-center gap-2 text-xs text-muted transition hover:text-accent"
          >
            <Sparkles size={13} />
            {locale === "zh" ? "先和助手聊两句" : "Chat with the advisor first"}
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

      {/* Stats */}
      <section className="snap-section flex items-center border-y border-white/[0.06] bg-white/[0.02]">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-px divide-y divide-white/[0.06] bg-white/[0.03] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {stats.map((item) => (
            <div key={item.label} className="px-6 py-9 text-center sm:py-12">
              <p className="font-serif text-4xl text-accent sm:text-5xl">{item.value}</p>
              <p className="mt-2 text-sm tracking-wide text-muted">{item.label}</p>
            </div>
          ))}
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
                <div className="absolute right-6 top-6 font-serif text-2xl text-accent/20 transition group-hover:text-accent/40">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mb-3 font-serif text-xl">{tCourse(i, "title")}</h3>
                <p className="mb-8 text-sm leading-relaxed text-muted">{tCourse(i, "desc")}</p>
                <div className="flex items-center justify-between border-t border-white/[0.06] pt-6">
                  <p className="font-serif text-2xl text-accent">{tCourse(i, "price")}</p>
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
