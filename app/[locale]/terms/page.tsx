import type { Metadata } from "next";
import { Locale } from "@/lib/i18n";
import { getLegalDoc } from "@/lib/legal";
import { pageAlternates } from "@/lib/seo";
import { LegalContent } from "@/components/LegalContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const doc = getLegalDoc("terms", locale as Locale);
  return {
    title: (doc.title || "Traces") + " — " + (locale === "zh" ? "痕迹" : "Traces"),
    alternates: pageAlternates(locale, "/terms"),
  };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LegalContent locale={locale as Locale} docKey="terms" />;
}
