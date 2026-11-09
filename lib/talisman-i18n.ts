import type { Locale } from "./i18n";
import type { Fact } from "./talisman-match";
import type { ElementKey } from "./chart-i18n";
import { getChartMessages } from "./chart-i18n";

/**
 * 符纸推荐的文案（十语言）。
 *
 * 只保留必要项：标题 / 依据前缀 / 八种依据类型 / 按钮。
 * 具体数字和五行名从命盘数据来，这里只提供词。
 */
export interface TalismanMessages {
  title: string;
  note: string;
  basis: string;
  cta: string;
  terms: {
    dayMaster: string;
    wealthStar: string;
    officialStar: string;
    sealStar: string;
    peach: string;
    weakSelf: string;
    missingEl: string;
    excess: string;
    clash: string;
  };
}

const T: Record<Locale, TalismanMessages> = {
  zh: {
    title: "为你推荐这一款",
    note: "依据你命盘里这几处信息，不是套话。",
    basis: "命盘依据",
    cta: "去商店查看",
    terms: {
      dayMaster: "日主",
      wealthStar: "财星",
      officialStar: "官星",
      sealStar: "印星",
      peach: "桃花位",
      weakSelf: "身弱（同类占比）",
      missingEl: "五行缺",
      excess: "过旺",
      clash: "流年冲日支",
    },
  },
  en: {
    title: "One charm that fits your chart",
    note: "Based on these specific points in your chart — not a sales line.",
    basis: "Chart basis",
    cta: "View in shop",
    terms: {
      dayMaster: "Day master",
      wealthStar: "Wealth star",
      officialStar: "Officer star",
      sealStar: "Resource star",
      peach: "Peach-blossom positions",
      weakSelf: "Weak self (share)",
      missingEl: "Missing element",
      excess: "Excess",
      clash: "Year branch clashes day branch",
    },
  },
  ja: {
    title: "あなたに合うお札はこれ",
    note: "命盤のこの点を根拠にしています。決まり文句ではありません。",
    basis: "命盤の根拠",
    cta: "ショップで見る",
    terms: {
      dayMaster: "日主",
      wealthStar: "財星",
      officialStar: "官星",
      sealStar: "印星",
      peach: "桃花位",
      weakSelf: "身弱（同類の割合）",
      missingEl: "五行に欠ける",
      excess: "旺じすぎ",
      clash: "今年の支が日支と冲",
    },
  },
  ko: {
    title: "당신의 명반에 맞는 부적",
    note: "명반의 다음 지점을 근거로 골랐습니다.",
    basis: "명반 근거",
    cta: "상점에서 보기",
    terms: {
      dayMaster: "일주",
      wealthStar: "재성",
      officialStar: "관성",
      sealStar: "인성",
      peach: "도화",
      weakSelf: "신약(동류 비율)",
      missingEl: "오행 결여",
      excess: "과다",
      clash: "세운이 일지와 충",
    },
  },
  es: {
    title: "Un talismán que encaja con tu carta",
    note: "Basado en estos puntos concretos de tu carta, no en una frase de venta.",
    basis: "Base de la carta",
    cta: "Ver en la tienda",
    terms: {
      dayMaster: "Amo del día",
      wealthStar: "Estrella de riqueza",
      officialStar: "Estrella de autoridad",
      sealStar: "Estrella de recurso",
      peach: "Posiciones flor de melocotón",
      weakSelf: "Yo débil (proporción)",
      missingEl: "Elemento ausente",
      excess: "Exceso",
      clash: "La rama anual choca con la del día",
    },
  },
  fr: {
    title: "Un talisman accordé à votre thème",
    note: "Fondé sur ces points précis de votre thème, pas sur un argumentaire.",
    basis: "Base du thème",
    cta: "Voir en boutique",
    terms: {
      dayMaster: "Maître du jour",
      wealthStar: "Étoile de richesse",
      officialStar: "Étoile d'autorité",
      sealStar: "Étoile de ressource",
      peach: "Positions fleur de pêcher",
      weakSelf: "Soi faible (part)",
      missingEl: "Élément absent",
      excess: "Excès",
      clash: "La branche annuelle heurte celle du jour",
    },
  },
  de: {
    title: "Ein Talisman, der zu deinem Chart passt",
    note: "Begründet mit diesen konkreten Punkten deines Charts – kein Verkaufssatz.",
    basis: "Grundlage im Chart",
    cta: "Im Shop ansehen",
    terms: {
      dayMaster: "Tagesherr",
      wealthStar: "Reichtumsstern",
      officialStar: "Amtsstern",
      sealStar: "Ressourcenstern",
      peach: "Pfirsichblüten-Positionen",
      weakSelf: "Schwaches Selbst (Anteil)",
      missingEl: "Fehlendes Element",
      excess: "Übermaß",
      clash: "Jahreszweig stößt auf Tageszweig",
    },
  },
  pt: {
    title: "Um talismã que combina com o teu mapa",
    note: "Baseado nestes pontos concretos do teu mapa, não em conversa de venda.",
    basis: "Base do mapa",
    cta: "Ver na loja",
    terms: {
      dayMaster: "Senhor do dia",
      wealthStar: "Estrela da riqueza",
      officialStar: "Estrela da autoridade",
      sealStar: "Estrela do recurso",
      peach: "Posições flor de pêssego",
      weakSelf: "Eu fraco (proporção)",
      missingEl: "Elemento ausente",
      excess: "Excesso",
      clash: "Ramo anual choca com o do dia",
    },
  },
  ru: {
    title: "Талисман под вашу карту",
    note: "Основано на этих конкретных точках карты, а не на рекламной фразе.",
    basis: "Основание в карте",
    cta: "Смотреть в магазине",
    terms: {
      dayMaster: "Хозяин дня",
      wealthStar: "Звезда богатства",
      officialStar: "Звезда власти",
      sealStar: "Звезда ресурса",
      peach: "Позиции цветка персика",
      weakSelf: "Слабое «я» (доля)",
      missingEl: "Недостаёт элемента",
      excess: "Избыток",
      clash: "Годовая ветвь в столкновении с дневной",
    },
  },
  ar: {
    title: "تميمة تناسب مخططك",
    note: "مبنية على هذه النقاط المحددة في مخططك، لا على عبارة ترويجية.",
    basis: "أساس المخطط",
    cta: "عرض في المتجر",
    terms: {
      dayMaster: "سيد اليوم",
      wealthStar: "نجم المال",
      officialStar: "نجم السلطة",
      sealStar: "نجم المورد",
      peach: "مواضع زهرة الخوخ",
      weakSelf: "ذات ضعيفة (النسبة)",
      missingEl: "عنصر مفقود",
      excess: "زيادة مفرطة",
      clash: "فرع السنة يصطدم بفرع اليوم",
    },
  },
};

export function getTalismanMessages(locale: Locale): TalismanMessages {
  return T[locale] || T.en;
}

/** 把命盘依据拼成一句话，例如「日主甲木 · 财星土×1 · 比劫木×3」。 */
export function formatFacts(locale: Locale, facts: Fact[]): string {
  const t = getTalismanMessages(locale);
  const chart = getChartMessages(locale);
  const elName = (el?: ElementKey) => (el ? chart.el[el] : "");
  const zhLike = ["zh", "ja", "ko"].indexOf(locale) >= 0;

  const parts: string[] = [];
  for (const f of facts) {
    switch (f.k) {
      case "dayMaster":
        parts.push(
          zhLike
            ? `${t.terms.dayMaster}${(f.gan || "") + elName(f.el)}`
            : `${t.terms.dayMaster} ${elName(f.el)}`
        );
        break;
      case "wealthStar":
      case "officialStar":
      case "sealStar": {
        const term =
          f.k === "wealthStar" ? t.terms.wealthStar : f.k === "officialStar" ? t.terms.officialStar : t.terms.sealStar;
        parts.push(zhLike ? `${term}${elName(f.el)}×${f.n ?? 0}` : `${term} ${elName(f.el)} ×${f.n ?? 0}`);
        break;
      }
      case "peach":
        parts.push(zhLike ? `${t.terms.peach}×${f.n ?? 0}` : `${t.terms.peach} ×${f.n ?? 0}`);
        break;
      case "weakSelf":
        parts.push(zhLike ? `${t.terms.weakSelf}${f.n ?? 0}%` : `${t.terms.weakSelf} ${f.n ?? 0}%`);
        break;
      case "missingEl":
        parts.push(zhLike ? `${t.terms.missingEl}${elName(f.el)}` : `${t.terms.missingEl}: ${elName(f.el)}`);
        break;
      case "excess":
        parts.push(zhLike ? `${elName(f.el)}${t.terms.excess}×${f.n ?? 0}` : `${elName(f.el)} ${t.terms.excess} ×${f.n ?? 0}`);
        break;
      case "clash":
        parts.push(t.terms.clash);
        break;
    }
  }
  return parts.filter(Boolean).join(" · ");
}
