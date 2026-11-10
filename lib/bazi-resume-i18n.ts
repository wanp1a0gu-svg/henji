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
  /** 解读页 · 生成中的标题 */
  loadingTitle: string;
  /** 解读页 · 找不到任务 */
  missingTitle: string;
  /** 解读页 · 找不到任务的说明 */
  missingDesc: string;
  /** 返回八字测算 */
  backToForm: string;
  /** 已用时 */
  elapsed: string;
}

const ALL: Record<string, BaziResumeMessages> = {
  zh: {
    pending: "通常 1–2 分钟。可以离开这个页面，回来会自动接着显示。",
    resumed: "已恢复上次未完成的测算",
    loadingTitle: "正在排盘撰写…",
    missingTitle: "没有找到这次测算",
    missingDesc: "任务可能已过期（超过 30 分钟），或链接不完整。请返回重新发起。",
    backToForm: "返回八字测算",
    elapsed: "已用时",
  },
  en: {
    pending:
      "Usually 1–2 minutes. You can leave this page; it resumes automatically when you come back.",
    resumed: "Resumed your previous unfinished reading",
    loadingTitle: "Casting your chart and writing the reading…",
    missingTitle: "This reading could not be found",
    missingDesc: "The task may have expired (over 30 minutes) or the link is incomplete. Please start again.",
    backToForm: "Back to BaZi reading",
    elapsed: "Elapsed",
  },
  ja: {
    pending:
      "通常1〜2分。このページを離れても、戻れば自動的に続きが表示されます。",
    resumed: "前回の未完了の鑑定を再開しました",
    loadingTitle: "命式を立てて鑑定書を作成しています…",
    missingTitle: "この鑑定が見つかりません",
    missingDesc: "タスクの有効期限が切れた（30分超）、またはリンクが不完全です。もう一度お試しください。",
    backToForm: "八字鑑定に戻る",
    elapsed: "経過時間",
  },
  ko: {
    pending:
      "보통 1~2분. 이 페이지를 떠나도 다시 오면 자동으로 이어집니다.",
    resumed: "이전에 완료되지 않은 분석을 이어받았습니다",
    loadingTitle: "명반을 세우고 리포트를 작성 중…",
    missingTitle: "이 분석을 찾을 수 없습니다",
    missingDesc: "작업이 만료되었거나(30분 초과) 링크가 불완전합니다. 다시 시작해 주세요.",
    backToForm: "사주 분석으로 돌아가기",
    elapsed: "경과 시간",
  },
  es: {
    pending:
      "Normalmente 1–2 minutos. Puedes salir de esta página; se reanudará sola al volver.",
    resumed: "Se reanudó tu lectura anterior sin terminar",
    loadingTitle: "Preparando tu carta y redactando la lectura…",
    missingTitle: "No se encontró esta lectura",
    missingDesc: "La tarea puede haber caducado (más de 30 minutos) o el enlace está incompleto. Vuelve a empezar.",
    backToForm: "Volver a la lectura BaZi",
    elapsed: "Tiempo transcurrido",
  },
  fr: {
    pending:
      "Généralement 1 à 2 minutes. Vous pouvez quitter la page : elle reprendra automatiquement à votre retour.",
    resumed: "Votre lecture précédente inachevée a été reprise",
    loadingTitle: "Calcul du thème et rédaction de la lecture…",
    missingTitle: "Cette lecture est introuvable",
    missingDesc: "La tâche a peut-être expiré (plus de 30 minutes) ou le lien est incomplet. Veuillez recommencer.",
    backToForm: "Retour à la lecture BaZi",
    elapsed: "Temps écoulé",
  },
  de: {
    pending:
      "Meist 1–2 Minuten. Du kannst die Seite verlassen; beim Zurückkommen geht es automatisch weiter.",
    resumed: "Deine zuvor unfertige Lesung wurde fortgesetzt",
    loadingTitle: "Chart wird berechnet, Lesung wird geschrieben…",
    missingTitle: "Diese Lesung wurde nicht gefunden",
    missingDesc: "Die Aufgabe ist möglicherweise abgelaufen (über 30 Minuten) oder der Link ist unvollständig. Bitte neu starten.",
    backToForm: "Zurück zur BaZi-Lesung",
    elapsed: "Verstrichen",
  },
  pt: {
    pending:
      "Normalmente 1–2 minutos. Pode sair desta página; ela continua sozinha quando voltares.",
    resumed: "A tua leitura anterior por terminar foi retomada",
    loadingTitle: "A montar o mapa e a escrever a leitura…",
    missingTitle: "Esta leitura não foi encontrada",
    missingDesc: "A tarefa pode ter expirado (mais de 30 minutos) ou o link está incompleto. Começa de novo.",
    backToForm: "Voltar à leitura BaZi",
    elapsed: "Tempo decorrido",
  },
  ru: {
    pending:
      "Обычно 1–2 минуты. Можно уйти со страницы: при возвращении всё продолжится автоматически.",
    resumed: "Ваш предыдущий незавершённый разбор возобновлён",
    loadingTitle: "Строим карту и пишем разбор…",
    missingTitle: "Этот разбор не найден",
    missingDesc: "Задача могла истечь (более 30 минут) или ссылка неполная. Начните заново.",
    backToForm: "Назад к чтению Бацзы",
    elapsed: "Прошло",
  },
  ar: {
    pending:
      "عادةً من دقيقة إلى دقيقتين. يمكنك مغادرة الصفحة، وستُستأنف تلقائيًا عند عودتك.",
    resumed: "تم استئناف قراءتك السابقة غير المكتملة",
    loadingTitle: "جارٍ بناء المخطط وكتابة القراءة…",
    missingTitle: "لم يتم العثور على هذه القراءة",
    missingDesc: "قد تكون المهمة قد انتهت صلاحيتها (أكثر من 30 دقيقة) أو الرابط غير مكتمل. يرجى البدء من جديد.",
    backToForm: "العودة إلى قراءة البازي",
    elapsed: "الوقت المنقضي",
  },
};

export function getBaziResumeMessages(locale: Locale | string): BaziResumeMessages {
  return ALL[locale] || ALL.en;
}
