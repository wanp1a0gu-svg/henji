import type { Locale } from "./i18n";
import type { TalismanReason } from "./talisman-match";

/**
 * 符纸推荐区块的文案（十语言）。
 * 只保留必要的 8 条：标题 / 说明 / 按钮 / 五种推荐理由。
 * 符名和描述直接复用商店数据（已有本地化），不在这里重复维护。
 */
export interface TalismanMessages {
  title: string;
  note: string;
  cta: string;
  reasons: Record<TalismanReason, string>;
}

const T: Record<Locale, TalismanMessages> = {
  en: {
    title: "Charms that match your chart",
    note: "Picked from our collection by your chart and focus — not by sales pitch.",
    cta: "View in shop",
    reasons: {
      wealth: "Strengthen money luck",
      career: "Support career",
      love: "Open up romance",
      health: "Guard health",
      balance: "Clear obstacles",
    },
  },
  zh: {
    title: "与你命盘相合的符",
    note: "依据你的命盘与关注方向挑选，不是硬塞推销。",
    cta: "去商店查看",
    reasons: {
      wealth: "补财气",
      career: "助事业",
      love: "旺感情",
      health: "保健康",
      balance: "化阻碍",
    },
  },
  ja: {
    title: "あなたの命盤に合うお札",
    note: "命盤と関心ごとから選んでいます。売り込みではありません。",
    cta: "ショップで見る",
    reasons: {
      wealth: "金運を補う",
      career: "仕事を後押し",
      love: "縁を引き寄せる",
      health: "健康を守る",
      balance: "障りを払う",
    },
  },
  ko: {
    title: "당신의 명반과 맞는 부적",
    note: "명반과 관심사에 따라 고른 것입니다. 판매 권유가 아닙니다.",
    cta: "상점에서 보기",
    reasons: {
      wealth: "재운 보강",
      career: "사업·직장 지원",
      love: "인연 열기",
      health: "건강 보호",
      balance: "장애 해소",
    },
  },
  es: {
    title: "Talismanes afines a tu carta",
    note: "Elegidos según tu carta y tu interés, no por venta agresiva.",
    cta: "Ver en la tienda",
    reasons: {
      wealth: "Reforzar la fortuna",
      career: "Apoyar la carrera",
      love: "Abrir el romance",
      health: "Proteger la salud",
      balance: "Despejar obstáculos",
    },
  },
  fr: {
    title: "Talismans accordés à votre thème",
    note: "Choisis selon votre thème et votre préoccupation, sans argumentaire de vente.",
    cta: "Voir en boutique",
    reasons: {
      wealth: "Renforcer la fortune",
      career: "Soutenir la carrière",
      love: "Ouvrir l'amour",
      health: "Protéger la santé",
      balance: "Dissiper les obstacles",
    },
  },
  de: {
    title: "Talismane passend zu deinem Chart",
    note: "Ausgewählt nach Chart und Anliegen – kein Verkaufsgeschwätz.",
    cta: "Im Shop ansehen",
    reasons: {
      wealth: "Glückskraft stärken",
      career: "Beruf unterstützen",
      love: "Liebe öffnen",
      health: "Gesundheit schützen",
      balance: "Hindernisse lösen",
    },
  },
  pt: {
    title: "Talismãs afinados com o teu mapa",
    note: "Escolhidos pelo mapa e pelo teu foco, sem conversa de vendedor.",
    cta: "Ver na loja",
    reasons: {
      wealth: "Reforçar a fortuna",
      career: "Apoiar a carreira",
      love: "Abrir o romance",
      health: "Proteger a saúde",
      balance: "Limpar obstáculos",
    },
  },
  ru: {
    title: "Талисманы под вашу карту",
    note: "Подобраны по карте и вашему запросу, без навязывания.",
    cta: "Смотреть в магазине",
    reasons: {
      wealth: "Усилить удачу в деньгах",
      career: "Поддержать карьеру",
      love: "Открыть отношения",
      health: "Защитить здоровье",
      balance: "Убрать препятствия",
    },
  },
  ar: {
    title: "تمائم توافق مخططك",
    note: "اخترناها حسب مخططك واهتمامك، وليس للترويج.",
    cta: "عرض في المتجر",
    reasons: {
      wealth: "تقوية حظ المال",
      career: "دعم المسار المهني",
      love: "فتح باب العلاقة",
      health: "حماية الصحة",
      balance: "إزالة العوائق",
    },
  },
};

export function getTalismanMessages(locale: Locale): TalismanMessages {
  return T[locale] || T.en;
}
