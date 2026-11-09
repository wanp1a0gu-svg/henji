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
  /** 大白话解释的标签 */
  plainLabel: string;
  cta: string;
  /** 按符 id 的通俗解释，{n} 会被替换成命盘里的具体数字 */
  plain: Record<string, string>;
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
    plainLabel: "说白了",
    plain: {
      caishen: "你命里代表收入的那股力只有 {n} 点，还容易被同辈分走——赚得到，但存不住、机会也留不住。财神符管的就是这一块。",
      shiye: "代表职位和话语权的力量只有 {n} 点。常见的样子是：活你干得最多，决定却轮不到你。事业符主攻这里，让你在该被看见时被看见。",
      "zhan-taohua": "你四柱里一个桃花位都没有——不是没人喜欢你，而是缘分来得慢、也容易浅。招桃花符求的是多遇见、早开口。",
      hehe: "你命里桃花有 {n} 个，说明不缺人靠近；问题多出在相处：话说不到一块，小事把感情耗掉。和合符管的是这个。",
      jiankang: "你日主偏弱，生扶只占 {n}%——像底子薄一点，熬一次夜要缓好几天。健康符先保根本，别硬撑。",
      baijie: "今年流年冲你的日支，加上某一行的力量过旺，容易被小事绊住、口舌是非偏多。百解符求的是把这些消耗挡一挡。",
      zhuanyun: "你命局没有明显短板，问题在节奏闷：事情方向是对的，却总差临门一脚。转运符求的是把卡住的地方松一松。",
    },
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
    plainLabel: "In plain words",
    plain: {
      caishen: "The force that carries income in your chart is only {n} points, and peers easily divide it. You can earn, but it doesn't stay. This charm targets exactly that.",
      shiye: "The force behind position and say-so is only {n} points — you often do the most work and still miss the decision. This charm targets that gap.",
      "zhan-taohua": "There is no peach-blossom position in your four pillars: not that nobody likes you, but chances come late and stay shallow. This charm asks for more meetings.",
      hehe: "You have {n} peach-blossom positions — people do come close; the trouble is getting along: words miss, small things drain the bond. This charm targets that.",
      jiankang: "Your day master is on the weak side (support only {n}%). Think of a thinner base — one late night costs you days. This charm guards the foundation.",
      baijie: "This year's branch clashes your day branch, and one element runs too strong — petty friction and talk behind your back. This charm is about blocking that drain.",
      zhuanyun: "Your chart has no obvious weak spot; the timing just feels stuck: the direction is right, the last step never lands. This charm loosens the jam.",
    },
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
    plainLabel: "かみくだくと",
    plain: {
      caishen: "収入を担う力が {n} 点しかなく、同輩に分けられやすい。稼げても残らない。このお札はそこに働きます。",
      shiye: "地位や発言力を支える力が {n} 点だけ。仕事は一番しているのに決定に加われない、という形で出ます。",
      "zhan-taohua": "四柱に桃花位がひとつもありません。好かれないのではなく、縁が遅く浅い。出会いを増やすお札です。",
      hehe: "桃花位が {n} 個あり、人が寄る運はあります。問題は相性：話が噛み合わず、小事で消耗する。そこに働きます。",
      jiankang: "日主がやや弱く、生扶は {n}% だけ。一夜更かすと数日尾を引く底子の薄さ。まず土台を守るお札です。",
      baijie: "今年の支が日支と冲し、さらに一行が旺じすぎ。小さな障りと言葉の諍いが多い年。消耗を防ぐお札です。",
      zhuanyun: "命局に大きな欠けはなく、リズムが詰まっているだけ。方向は合っているのに最後の一歩が出ない。",
    },
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
    plainLabel: "쉽게 말하면",
    plain: {
      caishen: "소득을 담당하는 힘이 {n}점뿐이고 동료에게 쉽게 나뉩니다. 벌어도 남지 않는다는 뜻. 이 부적이 그 부분을 봅니다.",
      shiye: "직책과 발언권을 받치는 힘이 {n}점뿐. 일은 가장 많이 하는데 결정은 못 하는 모습으로 나타납니다.",
      "zhan-taohua": "사주에 도화 자리가 하나도 없습니다. 호감이 없는 게 아니라 인연이 늦고 얕습니다. 만남을 늘리는 부적.",
      hehe: "도화가 {n}개 있어 사람은 모입니다. 문제는 관계: 말이 안 통하고小事로 소모됩니다.",
      jiankang: "일주가 약해 생부가 {n}%뿐입니다. 밤새면 며칠 끌리는 체력. 먼저 기초를 지키는 부적.",
      baijie: "올해 세운이 일지와 충하고 한 오행이 과다합니다. 작은 일에 걸리고 말이 나옵니다. 소모를 막는 부적.",
      zhuanyun: "명반에 큰 결점은 없고 흐름이 답답한 상태. 방향은 맞는데 마지막 한 걸음이 안 나옵니다.",
    },
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
    plainLabel: "En palabras simples",
    plain: {
      caishen: "La fuerza que sostiene tus ingresos solo tiene {n} puntos y se reparte con facilidad. Ganas, pero no se queda. Este talismán apunta ahí.",
      shiye: "La fuerza del puesto y la palabra solo tiene {n} puntos: haces más trabajo y aun así no decides. Apunta a esa brecha.",
      "zhan-taohua": "No hay ninguna posición flor de melocotón: no es que no gustes, es que las oportunidades llegan tarde y superficiales.",
      hehe: "Tienes {n} posiciones de flor de melocotón: la gente se acerca; el problema es la convivencia, las palabras no se encuentran.",
      jiankang: "Tu amo del día es débil (apoyo solo {n}%). Como una base delgada: una noche larga cuesta días. Protege la base.",
      baijie: "La rama del año choca con la del día y un elemento va demasiado fuerte: roces y habladurías. Bloquea ese desgaste.",
      zhuanyun: "Tu carta no tiene un punto débil claro; el ritmo está trabado: la dirección es correcta, falta el último paso.",
    },
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
    plainLabel: "En clair",
    plain: {
      caishen: "La force qui porte vos revenus ne pèse que {n} points et se partage vite. Vous gagnez, mais ça ne reste pas. Ce talisman vise ce point.",
      shiye: "La force du poste et de la parole ne pèse que {n} points : vous faites le plus de travail sans décider. Il vise cet écart.",
      "zhan-taohua": "Aucune position fleur de pêcher : ce n'est pas que l'on ne vous aime pas, les occasions arrivent tard et restent superficielles.",
      hehe: "Vous avez {n} positions fleur de pêcher : les gens s'approchent ; le problème est l'entente, les mots ne se rejoignent pas.",
      jiankang: "Votre maître du jour est faible (soutien {n}% seulement) : une base mince, une nuit blanche coûte des jours.",
      baijie: "La branche de l'année heurte celle du jour et un élément est en excès : frictions et ragots. Ce talisman bloque cette usure.",
      zhuanyun: "Pas de faiblesse nette : le rythme est bloqué, la direction est bonne, il manque le dernier pas.",
    },
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
    plainLabel: "Klartext",
    plain: {
      caishen: "Die Kraft hinter deinem Einkommen hat nur {n} Punkte und wird leicht geteilt. Du verdienst, aber es bleibt nicht. Genau da setzt der Talisman an.",
      shiye: "Die Kraft für Position und Mitsprache hat nur {n} Punkte: du machst die meiste Arbeit, entscheidest aber nicht mit.",
      "zhan-taohua": "Keine Pfirsichblüten-Position in den vier Säulen: nicht, dass dich niemand mag – Gelegenheiten kommen spät und bleiben flach.",
      hehe: "Du hast {n} Pfirsichblüten-Positionen: Menschen kommen nah; das Problem ist das Miteinander, Worte treffen sich nicht.",
      jiankang: "Dein Tagesherr ist schwach (Stütze nur {n}%): dünne Basis, eine lange Nacht kostet Tage.",
      baijie: "Der Jahreszweig stößt auf deinen Tageszweig, ein Element ist zu stark: Reibung und Gerede. Der Talisman blockt diesen Verschleiß.",
      zhuanyun: "Kein klarer Schwachpunkt, nur zäher Rhythmus: Richtung stimmt, der letzte Schritt fehlt.",
    },
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
    plainLabel: "Em palavras simples",
    plain: {
      caishen: "A força que sustenta o rendimento tem só {n} pontos e é facilmente dividida. Ganhas, mas não fica. O talismã actua aí.",
      shiye: "A força do cargo e da palavra tem só {n} pontos: fazes mais trabalho e ainda assim não decides.",
      "zhan-taohua": "Não há nenhuma posição flor de pêssego: não é que ninguém goste, as oportunidades chegam tarde e ficam rasas.",
      hehe: "Tens {n} posições de flor de pêssego: as pessoas aproximam-se; o problema é a convivência, as palavras não se encontram.",
      jiankang: "O senhor do dia é fraco (apoio só {n}%): base fina, uma noite longa custa dias.",
      baijie: "O ramo do ano choca com o do dia e um elemento está em excesso: atritos e falatórios. Bloqueia esse desgaste.",
      zhuanyun: "Sem ponto fraco evidente, só ritmo travado: a direcção está certa, falta o último passo.",
    },
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
    plainLabel: "Проще говоря",
    plain: {
      caishen: "Сила, отвечающая за доход, всего {n} балла и легко делится. Зарабатываете, но не удерживается. Талисман про это.",
      shiye: "Сила должности и права голоса — {n} балла: работы больше всех, а решения не ваши.",
      "zhan-taohua": "Ни одной позиции цветка персика: не то чтобы не нравитесь — возможности приходят поздно и остаются поверхностными.",
      hehe: "У вас {n} позиции цветка персика: люди подходят; проблема в общении — слова не встречаются.",
      jiankang: "Хозяин дня слабый (поддержка лишь {n}%): тонкая база, одна ночь без сна стоит дней.",
      baijie: "Ветвь года сталкивается с дневной, один элемент в избытке: мелкие трения и пересуды. Талисман гасит эту утечку.",
      zhuanyun: "Явных слабых мест нет, просто ритм застрял: направление верное, не хватает последнего шага.",
    },
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
    plainLabel: "ببساطة",
    plain: {
      caishen: "القوة التي تحمل الرزق في مخططك {n} نقاط فقط، ويسهل اقتسامها. تكسب لكن لا يبقى. هذه التميمة تعالج ذلك.",
      shiye: "قوة المنصب والكلمة {n} نقاط فقط: تعمل أكثر الجميع ولا تشارك في القرار.",
      "zhan-taohua": "لا يوجد أي موضع لزهرة الخوخ: ليس أن لا أحد يحبك، بل الفرص تأتي متأخرة وسطحية.",
      hehe: "لديك {n} مواضع لزهرة الخوخ: الناس يقتربون، والمشكلة في العِشرة: الكلام لا يلتقي.",
      jiankang: "سيد اليوم ضعيف (الدعم {n}% فقط): أساس رقيق، ليلة سهر تكلّفك أيامًا.",
      baijie: "فرع السنة يصطدم بفرع اليوم وعنصر واحد مفرط: احتكاك صغير وكلام كثير. التميمة تمنع هذا الاستنزاف.",
      zhuanyun: "لا ضعف واضح، فقط إيقاع متعثر: الاتجاه صحيح وتنقص الخطوة الأخيرة.",
    },
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

/**
 * 取某个符的「大白话」解释，并把命盘里的具体数字填进去。
 * n 从 facts 里挑与该符最相关的那个数（财星数 / 官星数 / 桃花数 / 身弱比）。
 */
export function plainFor(locale: Locale, id: string, facts: Fact[]): string {
  const t = getTalismanMessages(locale);
  const tpl = t.plain[id];
  if (!tpl) return "";

  const find = (k: string) => {
    const f = facts.find((x) => x.k === k);
    return f && typeof f.n === "number" ? f.n : null;
  };

  const n =
    id === "caishen" ? find("wealthStar") :
    id === "shiye" ? find("officialStar") :
    id === "hehe" ? find("peach") :
    id === "jiankang" ? find("weakSelf") :
    find("peach") ?? find("excess") ?? 0;

  return tpl.replace(/\{n\}/g, String(n ?? 0));
}
