import type { Metadata } from "next";
import { pageAlternates } from "@/lib/seo";
import { Locale } from "@/lib/i18n";
import { getFeaturesMessages } from "@/lib/features-i18n";
import { FeaturesContent } from "@/components/FeaturesContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getFeaturesMessages(locale as Locale);
  return {
    title: (t.title || "Traces") + " — " + (locale === "zh" ? "痕迹" : "Traces"),
    description: t.subtitle || undefined,
    alternates: pageAlternates(locale, "/features"),
  };
}

export default async function FeaturesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <FeaturesContent locale={locale as Locale} />;
}
