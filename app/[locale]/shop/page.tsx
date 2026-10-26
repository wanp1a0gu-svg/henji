import type { Metadata } from "next";
import { pageAlternates } from "@/lib/seo";
import { Locale } from "@/lib/i18n";
import { getShopMessages } from "@/lib/shop-i18n";
import { ShopContent } from "@/components/ShopContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getShopMessages(locale as Locale);
  return {
    title: (t.title || "Traces") + " — " + (locale === "zh" ? "痕迹" : "Traces"),
    description: t.subtitle || undefined,
    alternates: pageAlternates(locale, "/shop"),
  };
}


export default async function ShopPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <ShopContent locale={locale as Locale} />;
}
