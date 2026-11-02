"use client";

import { HelpCircle, Minus } from "lucide-react";
import type { WhenCopy } from "@/lib/when-i18n";

/**
 * 「什么时候该用这个功能」说明块。
 *
 * 塔罗 / 文王卦 / 紫微三页共用，保证排版完全一致：
 * 一个浅卡片，标题 + 3 条适用场景 + 1 条不适用提醒。
 * 放在标题区和表单之间——用户还没开始填，先知道自己来对地方了没。
 */
export function WhenToUse({ copy }: { copy: WhenCopy }) {
  return (
    <section className="px-6 pb-2 pt-1">
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/[0.07] bg-white/[0.015] px-5 py-4 sm:px-6 sm:py-5">
        <p className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-accent/70">
          <HelpCircle size={12} />
          {copy.title}
        </p>

        <ul className="space-y-1.5">
          {copy.items.map((item) => (
            <li key={item} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-muted">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent/70" />
              {item}
            </li>
          ))}
        </ul>

        {copy.notFor && (
          <p className="mt-3 flex items-start gap-2 border-t border-white/[0.06] pt-3 text-[11.5px] leading-relaxed text-muted/55">
            <Minus size={12} className="mt-0.5 shrink-0 text-muted/40" />
            {copy.notFor}
          </p>
        )}
      </div>
    </section>
  );
}
