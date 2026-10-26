import type { Metadata } from "next";
import { pageAlternates } from "@/lib/seo";
import { Locale, getMessages } from "@/lib/i18n";
import { BaziContent } from "@/components/BaziContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = (getMessages(locale as Locale) || {}).bazi || {};
  return {
    title: (t.title || "Traces") + " — " + (locale === "zh" ? "痕迹" : "Traces"),
    description: t.subtitle || undefined,
    alternates: pageAlternates(locale, "/bazi"),
  };
}


export default async function BaziPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const messages = getMessages(locale as Locale);
  return <BaziContent messages={messages} locale={locale as Locale} />;
}
