import type { Metadata } from "next";
import { pageAlternates } from "@/lib/seo";
import { Locale, getMessages } from "@/lib/i18n";
import { CoursesContent } from "@/components/CoursesContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = (getMessages(locale as Locale) || {}).courses || {};
  return {
    title: (t.title || "Traces") + " — " + (locale === "zh" ? "痕迹" : "Traces"),
    description: t.subtitle || undefined,
    alternates: pageAlternates(locale, "/courses"),
  };
}


export default async function CoursesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const messages = getMessages(locale as Locale);
  return <CoursesContent messages={messages} locale={locale as Locale} />;
}
