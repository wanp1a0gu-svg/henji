import { BookOpen, GraduationCap, Sparkles, PlayCircle } from "lucide-react";
import { Locale } from "@/lib/i18n";
import { getLearnMessages } from "@/lib/learn-i18n";

const VIDEO_SRC = "/videos/mingli-basics.mp4";
const VIDEO_POSTER = "/videos/mingli-basics-poster.jpg";

export function LearnContent({ locale }: { locale: Locale }) {
  const l = getLearnMessages(locale);
  const link = (path: string) => `/${locale}${path}`;

  return (
    <main className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative px-6 pb-10 pt-16 text-center sm:pb-14 sm:pt-24">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-accent/[0.06] blur-[120px]" />
        </div>
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">{l.eyebrow}</p>
        <h1 className="mx-auto mb-5 max-w-3xl font-serif text-3xl font-light leading-tight text-gradient sm:text-4xl md:text-5xl">
          {l.title}
        </h1>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          {l.subtitle}
        </p>
      </section>

      {/* Video */}
      <section className="px-6 pb-6">
        <div className="mx-auto max-w-4xl">
          <div className="glass glow overflow-hidden rounded-2xl">
            <video
              controls
              preload="metadata"
              poster={VIDEO_POSTER}
              className="aspect-video w-full bg-black"
            >
              <source src={VIDEO_SRC} type="video/mp4" />
            </video>
          </div>
          <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted">
            <PlayCircle size={13} className="text-accent" />
            {l.videoNote}
          </p>
        </div>
      </section>

      {/* About + Points */}
      <section className="px-6 py-12 sm:py-16">
        <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2">
          <div className="glass rounded-2xl p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/20 bg-accent/10">
                <GraduationCap size={18} className="text-accent" />
              </div>
              <h2 className="font-serif text-lg sm:text-xl">{l.aboutTitle}</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted">{l.aboutText}</p>
          </div>

          <div className="glass rounded-2xl p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/20 bg-accent/10">
                <BookOpen size={18} className="text-accent" />
              </div>
              <h2 className="font-serif text-lg sm:text-xl">{l.pointsTitle}</h2>
            </div>
            <ul className="space-y-3">
              {l.points.map((p, i) => (
                <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-muted">
                  <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-accent" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-4xl rounded-3xl border border-white/[0.08] bg-gradient-to-br from-accent/10 via-transparent to-transparent p-8 text-center sm:p-12">
          <h2 className="mb-6 font-serif text-2xl font-light sm:text-3xl">{l.ctaTitle}</h2>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={link("/bazi")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-medium text-background shadow-lg shadow-accent/20 transition hover:bg-accent-light sm:w-auto"
            >
              <Sparkles size={16} />
              {l.ctaBazi}
            </a>
            <a
              href={link("/tarot")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-accent/30 bg-white/[0.03] px-7 py-3.5 text-sm font-medium text-accent transition hover:border-accent/60 hover:bg-accent/10 sm:w-auto"
            >
              {l.ctaTarot}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
