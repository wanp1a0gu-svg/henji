"use client";

import { useState } from "react";
import { Share2, Check, Loader2 } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { renderShareCard, shareFileName, type ShareCardData } from "@/lib/share-card";
import { SHARE_TARGETS, shareText } from "@/lib/share-targets";

/** 分享按钮的文案（十语言）。 */
const COPY: Record<string, { idle: string; working: string; done: string; fail: string; shared: string }> = {
  zh: { idle: "分享这张结果", working: "生成中…", done: "已保存到下载", fail: "生成失败，请重试", shared: "已调起分享" },
  en: { idle: "Share this result", working: "Rendering…", done: "Saved to downloads", fail: "Failed, try again", shared: "Share sheet opened" },
  ja: { idle: "この結果を共有", working: "生成中…", done: "ダウンロードに保存しました", fail: "失敗しました", shared: "共有を開きました" },
  ko: { idle: "결과 공유", working: "생성 중…", done: "다운로드에 저장됨", fail: "실패했습니다", shared: "공유 열림" },
  es: { idle: "Compartir resultado", working: "Generando…", done: "Guardado en descargas", fail: "Error, reintenta", shared: "Compartir abierto" },
  fr: { idle: "Partager ce résultat", working: "Génération…", done: "Enregistré", fail: "Échec, réessayez", shared: "Partage ouvert" },
  de: { idle: "Ergebnis teilen", working: "Wird erstellt…", done: "Gespeichert", fail: "Fehlgeschlagen", shared: "Teilen geöffnet" },
  pt: { idle: "Compartilhar resultado", working: "A gerar…", done: "Guardado", fail: "Falhou, tenta de novo", shared: "Partilha aberta" },
  ru: { idle: "Поделиться результатом", working: "Готовим…", done: "Сохранено", fail: "Не удалось", shared: "Окно поделиться открыто" },
  ar: { idle: "شارك النتيجة", working: "جارٍ الإنشاء…", done: "تم الحفظ", fail: "فشل، حاول مجددًا", shared: "تم فتح المشاركة" },
};

/**
 * 把测算结果画成一张图并分享。
 * 优先调系统分享面板（手机上直接发微信/相册），不支持就落盘下载。
 */
export function ShareButton({
  data,
  locale,
  className = "",
}: {
  data: ShareCardData;
  locale: Locale;
  className?: string;
}) {
  const c = COPY[locale] || COPY.en;
  const [state, setState] = useState<"idle" | "working" | "done" | "fail">("idle");

  const onClick = async () => {
    if (state === "working") return;
    setState("working");
    const blob = await renderShareCard({ ...data, locale });
    if (!blob) {
      setState("fail");
      setTimeout(() => setState("idle"), 2400);
      return;
    }

    const file = new File([blob], shareFileName(String(data.title)), { type: "image/png" });

    try {
      const nav: any = navigator;
      if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
        await nav.share({ files: [file], title: data.title, text: data.headline });
        setState("done");
        setTimeout(() => setState("idle"), 2000);
        return;
      }
    } catch {
      /* 用户取消或系统不支持，走下载 */
    }

    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setState("done");
      setTimeout(() => setState("idle"), 2400);
    } catch {
      setState("fail");
      setTimeout(() => setState("idle"), 2400);
    }
  };

  const label =
    state === "working" ? c.working : state === "done" ? c.done : state === "fail" ? c.fail : c.idle;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state === "working"}
      className={
        "inline-flex items-center gap-2 rounded-full border border-accent/30 bg-white/[0.03] px-4 py-2 text-xs text-accent transition hover:border-accent/60 hover:bg-accent/10 disabled:opacity-60 " +
        className
      }
    >
      {state === "working" ? (
        <Loader2 size={13} className="animate-spin" />
      ) : state === "done" ? (
        <Check size={13} />
      ) : (
        <Share2 size={13} />
      )}
      {label}
    </button>
  );
}

/**
 * 分享区：一个「存图/系统分享」按钮 + 一排海外平台入口。
 *
 * 桌面浏览器大多没有系统分享面板，所以平台按钮是主力：
 * 点了会开新窗口发文字 + 链接，图片我们已经存到下载目录，用户拖进去即可。
 */
export function ShareBar({
  data,
  locale,
  className = "",
}: {
  data: ShareCardData;
  locale: Locale;
  className?: string;
}) {
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const text = shareText(data.headline);

  return (
    <div className={"flex flex-wrap items-center gap-2 " + className}>
      <ShareButton data={data} locale={locale} />
      {SHARE_TARGETS.map((t) => (
        <a
          key={t.id}
          href={t.build(text, pageUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[11px] text-muted/80 transition hover:border-accent/40 hover:text-accent"
        >
          {t.label}
        </a>
      ))}
    </div>
  );
}
