import type { Metadata } from "next";
import { Locale } from "@/lib/i18n";
import { AdminContent } from "@/components/AdminContent";

/** 管理后台：不进搜索引擎。 */
export const metadata: Metadata = {
  title: "管理后台 — 痕迹",
  robots: { index: false, follow: false },
};

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <AdminContent locale={locale as Locale} />;
}
