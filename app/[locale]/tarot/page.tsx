import type { Metadata } from "next";
import { pageAlternates } from "@/lib/seo";
import { Locale } from "@/lib/i18n";
import { getTarotMessages } from "@/lib/tarot-i18n";
import { TarotContent } from "@/components/TarotContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTarotMessages(locale as Locale);
  return {
    title: (t.title || "Traces") + " — " + (locale === "zh" ? "痕迹" : "Traces"),
    description: t.subtitle || undefined,
    alternates: pageAlternates(locale, "/tarot"),
  };
}


export default async function TarotPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <TarotContent locale={locale as Locale} />;
}
