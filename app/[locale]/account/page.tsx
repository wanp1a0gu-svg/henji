import { Locale, getMessages } from "@/lib/i18n";
import { AccountContent } from "@/components/AccountContent";

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const messages = getMessages(locale as Locale);
  return <AccountContent messages={messages} locale={locale as Locale} />;
}
