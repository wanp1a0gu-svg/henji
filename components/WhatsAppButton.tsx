"use client";

import { Locale } from "@/lib/i18n";
import { WHATSAPP_NUMBER } from "@/lib/site-config";

const labels: Record<Locale, string> = {
  en: "Chat on WhatsApp",
  zh: "WhatsApp 咨询",
  ja: "WhatsApp 相談",
  ko: "WhatsApp 상담",
  es: "Hablar por WhatsApp",
  fr: "Discuter sur WhatsApp",
  de: "Chat auf WhatsApp",
  pt: "Falar no WhatsApp",
  ru: "Чат в WhatsApp",
  ar: "تواصل عبر واتساب",
};

const prefills: Record<Locale, string> = {
  en: "Hi Traces! I'd like to ask about a Bazi reading.",
  zh: "你好，我想咨询八字测算。",
  ja: "こんにちは。八字鑑定について相談したいです。",
  ko: "안녕하세요. 사주 분석에 대해 문의하고 싶습니다.",
  es: "Hola, quiero consultar sobre una lectura Bazi.",
  fr: "Bonjour, je souhaite me renseigner sur une lecture Bazi.",
  de: "Hallo, ich möchte mich über eine Bazi-Lesung informieren.",
  pt: "Olá! Gostaria de saber mais sobre uma leitura Bazi.",
  ru: "Здравствуйте! Хочу узнать о чтении Бацзы.",
  ar: "مرحباً، أرغب في الاستفسار عن قراءة البازي.",
};

/**
 * Floating WhatsApp contact button (bottom-right, all pages).
 * Renders nothing when WHATSAPP_NUMBER is empty.
 */
export function WhatsAppButton({ locale }: { locale: Locale }) {
  const number = WHATSAPP_NUMBER.replace(/\D/g, "");
  if (!number) return null;

  const href = `https://wa.me/${number}?text=${encodeURIComponent(
    prefills[locale] || prefills.en
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={labels[locale] || labels.en}
      className="group fixed bottom-5 end-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] py-3 ps-3.5 pe-3.5 sm:pe-5 text-white shadow-lg shadow-[#25D366]/30 transition hover:bg-[#1ebe5b] hover:shadow-[#25D366]/50 sm:bottom-6 sm:end-6"
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="currentColor"
        aria-hidden="true"
        className="shrink-0"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
      <span className="hidden text-sm font-medium tracking-wide sm:inline">
        {labels[locale] || labels.en}
      </span>
    </a>
  );
}
