"use client";

import { PlayCircle, ArrowRight, Lock } from "lucide-react";
import { Locale } from "@/lib/i18n";
import { getLearnMessages } from "@/lib/learn-i18n";
import { useAuth } from "./AuthProvider";

const VIDEO_SRC = "/videos/mingli-basics.mp4";
const VIDEO_POSTER = "/videos/mingli-basics-poster.jpg";

/**
 * 首页第二屏：命理知识 + 讲座视频。
 *
 * 视频是 114MB，所以 preload="metadata"（只读海报和时间轴，不下载正片）。
 * 未登录时不渲染 <video>，只给海报 + 「登录后观看」，避免直接把视频地址摆在首页。
 */
export function HomeKnowledge({ locale }: { locale: Locale }) {
  const l = getLearnMessages(locale);
  const { user, loading, openAuth } = useAuth();
  const link = (p: string) => `/${locale}${p}`;

  return (
    <section className="snap-section relative flex items-center overflow-hidden px-6 py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute start-1/4 top-1/4 h-[420px] w-[420px] rounded-full bg-accent/[0.05] blur-[120px]" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
        {/* 左：为什么要懂一点 */}
        <div>
          <p className="mb-4 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-accent">
            <span className="h-px w-6 bg-accent/60" />
            {l.eyebrow}
          </p>
          <h2 className="font-serif text-3xl font-light tracking-wide sm:text-4xl">{l.title}</h2>
          <p className="mt-5 text-sm leading-relaxed text-muted sm:text-[15px]">{l.subtitle}</p>

          <ul className="mt-6 space-y-2.5">
            {l.points.slice(0, 3).map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-muted">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent/70" />
                {p}
              </li>
            ))}
          </ul>

          <a
            href={link("/learn")}
            className="mt-7 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-white/[0.03] px-5 py-2.5 text-xs text-accent transition hover:border-accent/60 hover:bg-accent/10"
          >
            {l.ctaMore}
            <ArrowRight size={13} />
          </a>
        </div>

        {/* 右：讲座视频 */}
        <div>
          <div className="glass glow overflow-hidden rounded-2xl">
            {loading ? (
              <div className="aspect-video w-full animate-pulse bg-white/[0.03]" />
            ) : user ? (
              <video controls preload="metadata" poster={VIDEO_POSTER} className="aspect-video w-full bg-black">
                <source src={VIDEO_SRC} type="video/mp4" />
              </video>
            ) : (
              <button
                type="button"
                onClick={openAuth}
                className="group relative block aspect-video w-full overflow-hidden bg-black"
                aria-label={l.videoNote}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={VIDEO_POSTER} alt="" className="h-full w-full object-cover opacity-70 transition group-hover:opacity-85" />
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-accent/40 bg-black/50 backdrop-blur-sm transition group-hover:border-accent/70">
                    <PlayCircle size={26} className="text-accent" />
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[11px] text-muted backdrop-blur-sm">
                    <Lock size={11} className="text-accent/80" />
                    {l.videoNote}
                  </span>
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
