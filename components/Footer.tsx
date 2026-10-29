import { Messages, Locale } from "@/lib/i18n";
import { getSecurityMessages } from "@/lib/security-i18n";
import { BrandMark } from "./BrandMark";

export function Footer({ messages, locale }: { messages: Messages; locale: Locale }) {
  const t = (key: string) => {
    const parts = key.split(".");
    let value: any = messages;
    for (const part of parts) value = value?.[part];
    return value || key;
  };
  const s = getSecurityMessages(locale);

  return (
    <footer className="border-t border-white/[0.06] bg-white/[0.02] py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <BrandMark className="h-8 w-8" />
            <span className="font-serif text-lg tracking-[0.08em]">
              {locale === "zh" ? "痕迹" : "Traces"}
            </span>
          </div>

          <p className="text-center text-sm text-muted">{t("footer.tagline")}</p>

          <p className="text-xs text-muted/60">{t("footer.copyright")}</p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 border-t border-white/[0.04] pt-6">
          <a
            href={`/${locale}/bazi`}
            className="text-xs text-muted transition hover:text-accent"
          >
            {t("nav.bazi")}
          </a>
          <span className="text-white/10">·</span>
          <a
            href={`/${locale}/tarot`}
            className="text-xs text-muted transition hover:text-accent"
          >
            {t("nav.tarot")}
          </a>
          <span className="text-white/10">·</span>
          <a
            href={`/${locale}/ziwei`}
            className="text-xs text-muted transition hover:text-accent"
          >
            {t("nav.ziwei")}
          </a>
          <span className="text-white/10">·</span>
          <a
            href={`/${locale}/privacy`}
            className="text-xs text-muted transition hover:text-accent"
          >
            {s.privacy}
          </a>
          <span className="text-white/10">·</span>
          <a
            href={`/${locale}/terms`}
            className="text-xs text-muted transition hover:text-accent"
          >
            {s.terms}
          </a>
        </div>
      </div>
    </footer>
  );
}
