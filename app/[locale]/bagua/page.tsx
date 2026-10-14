import type { Metadata } from "next";
import { Locale } from "@/lib/i18n";
import { getBaguaMessages } from "@/lib/bagua-i18n";
import { BaguaContent } from "@/components/BaguaContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getBaguaMessages(locale as Locale);
  return {
    title: (t.title || "Traces") + " — " + (locale === "zh" ? "痕迹" : "Traces"),
    description: t.subtitle || undefined,
  };
}


export default async function BaguaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <BaguaContent locale={locale as Locale} />;
}
