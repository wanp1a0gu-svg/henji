import { Locale } from "@/lib/i18n";
import { LinksContent } from "@/components/LinksContent";

export default async function LinksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LinksContent locale={locale as Locale} />;
}
