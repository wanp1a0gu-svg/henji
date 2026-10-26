"use client";

import { BookOpen, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { COURSES_OPEN } from "@/lib/site-config";
import { Locale, Messages } from "@/lib/i18n";

export function CoursesContent({ messages, locale }: { messages: Messages; locale: Locale }) {
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

  const highlights = [
    t("courses.highlights.video"),
    t("courses.highlights.lifetime"),
    t("courses.highlights.community"),
  ];

  return (
    <main className="flex-1 pt-[72px]">
      <section className="relative overflow-hidden px-6 py-14 text-center sm:py-24">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.06] blur-[100px]" />
        </div>

        <div className="mx-auto max-w-3xl">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">{t("courses.subtitle")}</p>
          <h1 className="mb-6 font-serif text-4xl font-light tracking-wide text-gradient sm:text-5xl">
            {t("courses.title")}
          </h1>
          <p className="mx-auto max-w-xl text-muted">{t("courses.intro")}</p>
          <div className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-muted">
            {highlights.map((h) => (
              <span key={h} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                <CheckCircle2 size={12} className="text-accent" /> {h}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16 sm:pb-24">
        <div className="mx-auto max-w-6xl grid grid-cols-1 gap-6 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="group glass glow-sm relative flex flex-col overflow-hidden rounded-2xl transition hover:border-accent/30 hover:bg-white/[0.05]"
            >
              <div className="relative h-44 bg-gradient-to-br from-accent/15 via-accent/5 to-transparent p-8">
                <div className="absolute right-6 top-6 font-serif text-5xl text-accent/20">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-accent/20 bg-accent/10">
                  <BookOpen size={22} className="text-accent" />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-6 sm:p-8">
                <h3 className="mb-3 font-serif text-xl">{tCourse(i, "title")}</h3>
                <p className="mb-6 flex-1 text-sm leading-relaxed text-muted">{tCourse(i, "desc")}</p>
                <div className="mb-6 flex items-center gap-4 text-xs text-muted">
                  <span className="inline-flex items-center gap-1"><Clock size={12} /> 8 {t("courses.lessons")}</span>
                  <span className="inline-flex items-center gap-1"><CheckCircle2 size={12} /> {t("courses.certificate")}</span>
                </div>
                <div className="flex items-center justify-between border-t border-white/[0.06] pt-6">
                  <p className="font-serif text-3xl text-accent">
                    {COURSES_OPEN ? tCourse(i, "price") : locale === "zh" ? "—" : "—"}
                  </p>
                  {COURSES_OPEN ? (
                    <a
                      href={link("/courses")}
                      className="inline-flex items-center gap-1 rounded-full bg-accent px-5 py-2 text-sm font-medium text-background transition hover:bg-accent-light"
                    >
                      {t("courses.enroll")} <ArrowRight size={14} />
                    </a>
                  ) : (
                    <div className="flex flex-col items-end gap-2">
                      <span className="rounded-full border border-white/10 px-4 py-2 text-xs text-muted/70">
                        {locale === "zh" ? "即将开放" : "Coming soon"}
                      </span>
                      <a
                        href={link("/bazi")}
                        className="inline-flex items-center gap-1 text-xs text-accent transition hover:underline"
                      >
                        {locale === "zh" ? "先做一次八字解读" : "Try a reading first"} <ArrowRight size={12} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
