import { Locale } from "@/lib/i18n";
import { LegalContent } from "@/components/LegalContent";

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LegalContent locale={locale as Locale} docKey="terms" />;
}
