import type { Metadata } from "next";
import { pageAlternates } from "@/lib/seo";
import { Locale } from "@/lib/i18n";
import { getLearnMessages } from "@/lib/learn-i18n";
import { LearnContent } from "@/components/LearnContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getLearnMessages(locale as Locale);
  return {
    title: (t.title || "Traces") + " — " + (locale === "zh" ? "痕迹" : "Traces"),
    description: t.subtitle || undefined,
    alternates: pageAlternates(locale, "/learn"),
  };
}


export default async function LearnPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LearnContent locale={locale as Locale} />;
}
