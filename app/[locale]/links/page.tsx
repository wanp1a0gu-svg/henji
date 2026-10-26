import type { Metadata } from "next";
import { Locale } from "@/lib/i18n";
import { pageAlternates } from "@/lib/seo";
import { LinksContent } from "@/components/LinksContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: (locale === "zh" ? "链接" : "Links") + " — " + (locale === "zh" ? "痕迹" : "Traces"),
    alternates: pageAlternates(locale, "/links"),
  };
}

export default async function LinksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LinksContent locale={locale as Locale} />;
}
