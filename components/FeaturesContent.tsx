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
import { openCatAssistant } from "@/lib/cat-open";
import { CAT_ONLINE } from "@/lib/cat-status";

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
 * 功能总览：列表式左右排。
 *
 * 一行一个功能：左边 序号 + 图标 + 名字 + 价格角标；右边 简介（悬停才出现）+ 箭头。
 *
 * 为什么不用网格卡片：8 个功能分三档，网格会空出好几格（免费 5 个占 3 列 → 空 1 格，
 * 微付费只有 1 个 → 空 2 格），看上去像没做完。列表没有空格子，数量怎么变都不会失衡。
 *
 * 触屏没有 hover：简介在名字下方常显（见 globals.css 里 .feat-desc-side 的 @media 规则）。
 */
export function FeaturesContent({ locale }: { locale: Locale }) {
  const t = getFeaturesMessages(locale);
  const link = (p: string) => `/${locale}${p}`;

  let index = 0;

  const row = (item: FeatureItem, hot: boolean) => {
    const Icon = ICONS[item.key] || Sparkles;
    index += 1;
    const no = String(index).padStart(2, "0");
    // 对话没有独立页面：这一行点开右下角小痕弹窗
    const isCat = item.key === "advisor";
    const Tag: any = isCat ? "button" : "a";
    return (
      <Tag
        key={item.key}
        {...(isCat
          ? { type: "button", onClick: openCatAssistant }
          : { href: link(item.href) })}
        className="feat-row group relative flex items-start gap-4 border-s-2 border-transparent px-3 py-5 transition-all duration-300 hover:border-accent/60 hover:bg-accent/[0.045] hover:ps-5 sm:items-center"
      >
        {/* 序号 */}
        <span className="w-5 shrink-0 pt-1 font-mono text-[11px] text-muted/30 transition-colors group-hover:text-accent/50 sm:pt-0">
          {no}
        </span>

        {/* 图标 */}
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent/15 bg-accent/[0.07] transition-colors duration-300 group-hover:border-accent/45 group-hover:bg-accent/15">
          <Icon size={15} className="text-accent" />
        </span>

        {/* 左半：名字 + 角标（手机上简介也在这里） */}
        <span className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-none sm:basis-[220px]">
          <span className="flex flex-wrap items-center gap-2.5">
            <span className="font-serif text-[17px] text-foreground transition-colors duration-300 group-hover:text-accent">
              {item.title}
            </span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${
                hot ? "border border-accent/30 bg-accent/10 text-accent" : "border border-white/10 text-muted/60"
              }`}
            >
              {item.badge}
            </span>
          </span>
          <span className="block text-[12px] leading-relaxed text-muted sm:hidden">{item.desc}</span>
        </span>

        {/* 右半：简介（悬停从左滑入）+ 箭头 */}
        <span className="feat-desc-side hidden min-w-0 flex-1 translate-x-2 text-end text-[12.5px] leading-relaxed text-muted opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100 sm:block">
          {item.desc}
        </span>

        <ArrowRight
          size={14}
          className="mt-1.5 shrink-0 text-accent/25 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-accent sm:mt-0"
        />
      </Tag>
    );
  };

  // 小痕下线时不列出来（序号仍会自动重排，不会留空档）
  const byKeys = (keys: string[]) =>
    t.items.filter((i) => keys.indexOf(i.key) !== -1 && (CAT_ONLINE || i.key !== "advisor"));

  const block = (label: string, keys: string[], hot: boolean) => (
    <section className="mt-6 first:mt-0">
      <div className="mb-1 flex items-center gap-3 px-3">
        <h2 className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-muted/55">{label}</h2>
        <span className="h-px flex-1 bg-white/[0.06]" />
      </div>
      <div className="divide-y divide-white/[0.04]">{byKeys(keys).map((i) => row(i, hot))}</div>
    </section>
  );

  return (
    <main className="flex-1 pt-[72px]">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-[0.24em] text-accent/60">{t.eyebrow}</p>
          <h1 className="mx-auto mt-4 max-w-3xl font-serif text-3xl leading-tight text-gradient sm:text-4xl">
            {t.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted">{t.subtitle}</p>
        </div>

        <div className="mt-12 rounded-2xl border border-white/[0.07] bg-white/[0.015] px-2 py-4 sm:px-4">
          {block(t.sectionFree, FREE_KEYS, true)}
          {block(t.sectionMid, MID_KEYS, false)}
          {block(t.sectionHigh, HIGH_KEYS, false)}
        </div>

        <div className="mx-auto mt-8 max-w-2xl space-y-2 text-center">
          <p className="text-[11px] leading-relaxed text-muted/70">{t.freeNote}</p>
          <p className="text-[11px] leading-relaxed text-muted/50">{t.loginNote}</p>
        </div>
      </div>
    </main>
  );
}
