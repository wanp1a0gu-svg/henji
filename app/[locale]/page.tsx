import { Locale, getMessages } from "@/lib/i18n";
import { HomeContent } from "@/components/HomeContent";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const messages = getMessages(locale as Locale);
  return <HomeContent messages={messages} locale={locale as Locale} />;
}
