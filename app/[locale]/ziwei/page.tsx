import type { Metadata } from "next";
import { pageAlternates } from "@/lib/seo";
import { Locale } from "@/lib/i18n";
import { getZiweiMessages } from "@/lib/ziwei-i18n";
import { ZiweiContent } from "@/components/ZiweiContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getZiweiMessages(locale as Locale);
  return {
    title: (t.title || "Traces") + " — " + (locale === "zh" ? "痕迹" : "Traces"),
    description: t.subtitle || undefined,
    alternates: pageAlternates(locale, "/ziwei"),
  };
}

export default async function ZiweiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <ZiweiContent locale={locale as Locale} />;
}
