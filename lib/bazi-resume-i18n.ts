/**
 * 八字测算「生成中 / 断点续取」提示文案（10 语言）。
 * 目的：让用户知道等待期间可以离开页面，回来会自动接上——
 * 付费报告不能因为一次刷新就丢掉。
 */
import type { Locale } from "./i18n";

export interface BaziResumeMessages {
  /** 生成中显示的提示：约 1-2 分钟，可离开，回来会自动恢复 */
  pending: string;
  /** 恢复成功后的小提示 */
  resumed: string;
}

const ALL: Record<string, BaziResumeMessages> = {
  zh: {
    pending: "正在排盘并撰写命书，通常 1–2 分钟。可以离开这个页面，回来会自动接着显示。",
    resumed: "已恢复上次未完成的测算",
  },
  en: {
    pending:
      "Casting your chart and writing the reading — usually 1–2 minutes. You can leave this page; it will resume automatically when you come back.",
    resumed: "Resumed your previous unfinished reading",
  },
  ja: {
    pending:
      "命式を立てて鑑定書を作成しています（通常1〜2分）。このページを離れても、戻れば自動的に続きが表示されます。",
    resumed: "前回の未完了の鑑定を再開しました",
  },
  ko: {
    pending:
      "명반을 세우고 리포트를 작성 중입니다(보통 1~2분). 이 페이지를 떠나도 다시 오면 자동으로 이어집니다.",
    resumed: "이전에 완료되지 않은 분석을 이어받았습니다",
  },
  es: {
    pending:
      "Preparando tu carta y redactando la lectura: normalmente 1–2 minutos. Puedes salir de esta página; se reanudará sola al volver.",
    resumed: "Se reanudó tu lectura anterior sin terminar",
  },
  fr: {
    pending:
      "Calcul de votre thème et rédaction de la lecture — généralement 1 à 2 minutes. Vous pouvez quitter la page : elle reprendra automatiquement à votre retour.",
    resumed: "Votre lecture précédente inachevée a été reprise",
  },
  de: {
    pending:
      "Dein Chart wird berechnet und die Lesung geschrieben – meist 1–2 Minuten. Du kannst die Seite verlassen; beim Zurückkommen geht es automatisch weiter.",
    resumed: "Deine zuvor unfertige Lesung wurde fortgesetzt",
  },
  pt: {
    pending:
      "Montando o mapa e escrevendo a leitura — normalmente 1–2 minutos. Pode sair desta página; ela continua sozinha quando voltares.",
    resumed: "A tua leitura anterior por terminar foi retomada",
  },
  ru: {
    pending:
      "Строим карту и пишем разбор — обычно 1–2 минуты. Можно уйти со страницы: при возвращении всё продолжится автоматически.",
    resumed: "Ваш предыдущий незавершённый разбор возобновлён",
  },
  ar: {
    pending:
      "جارٍ بناء مخططك وكتابة القراءة — عادةً من دقيقة إلى دقيقتين. يمكنك مغادرة الصفحة، وستُستأنف تلقائيًا عند عودتك.",
    resumed: "تم استئناف قراءتك السابقة غير المكتملة",
  },
};

export function getBaziResumeMessages(locale: Locale | string): BaziResumeMessages {
  return ALL[locale] || ALL.en;
}
