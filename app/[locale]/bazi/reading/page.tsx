import type { Metadata } from "next";
import { Locale, getMessages } from "@/lib/i18n";
import { BaziReadingView } from "@/components/BaziReadingView";

/**
 * 解读页：/bazi/reading?id=jobId
 * 私有内容（含个人出生信息与命盘），不进搜索引擎索引。
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = (getMessages(locale as Locale) || {}).bazi || {};
  return {
    title: t.reportTitle || "BaZi Reading",
    robots: { index: false, follow: false },
  };
}

export default async function BaziReadingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = getMessages(locale as Locale);
  return <BaziReadingView messages={messages} locale={locale as Locale} />;
}
