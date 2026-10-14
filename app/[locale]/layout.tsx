import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, Locale, getMessages } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site-config";
import "../globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { AuthProvider } from "@/components/AuthProvider";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { PageViewTracker } from "@/components/PageViewTracker";
import { CatAssistant } from "@/components/CatAssistant";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const OG_LOCALE: Record<string, string> = {
  en: "en_US", zh: "zh_CN", ja: "ja_JP", ko: "ko_KR", es: "es_ES",
  fr: "fr_FR", de: "de_DE", pt: "pt_PT", ru: "ru_RU", ar: "ar_AR",
};

/** 多语言 SEO：文件名/描述/OG 卡片/canonical + hreflang。 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = locales.includes(locale as Locale) ? getMessages(locale as Locale) : getMessages("en");
  const hero = (messages && messages.hero) || {};
  const title =
    hero.title && hero.eyebrow
      ? hero.title + " — " + hero.eyebrow
      : "Traces — Eastern Wisdom for Modern Life";
  const description =
    hero.subtitle || "Courses and personal readings in Chinese metaphysics.";

  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = "/" + l;
  languages["x-default"] = "/en";

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: { canonical: "/" + locale, languages },
    openGraph: {
      type: "website",
      siteName: "Traces",
      title,
      description,
      url: "/" + locale,
      locale: OG_LOCALE[locale] || "en_US",
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "痕迹 Traces" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = getMessages(locale as Locale);

  return (
    <AuthProvider locale={locale as Locale}>
      {/*
        根布局（app/layout.tsx）负责 <html lang="en"> 与 <body>（英文为默认语言）。
        <html>/<body> 只能由根布局渲染——此前这里再渲染一次会产生嵌套的
        <html> 标签（无效 HTML，内层 lang 被浏览器忽略）。
        非英文页面在此用脚本把语言标记修正为当前语言。
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: "document.documentElement.lang=" + JSON.stringify(locale) + ";",
        }}
      />
      <PageViewTracker locale={locale} />
      <Nav messages={messages} locale={locale as Locale} />
      {children}
      <Footer messages={messages} locale={locale as Locale} />
      <WhatsAppButton locale={locale as Locale} />
      <CatAssistant locale={locale as Locale} />
    </AuthProvider>
  );
}
