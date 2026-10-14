/**
 * 文王卦页面的多语言文案（10 语言）。
 * 卦名本地化：zh/ja 用「乾为天」/「乾為天」，ko 用韩文卦名，其余用 Wilhelm 英文卦名。
 */
import { Locale } from "./i18n";

export interface BaguaMessages {
  eyebrow: string;
  title: string;
  subtitle: string;
  formTitle: string;
  engineNote: string;
  methodLabel: string;
  methodCoin: string;
  methodYarrow: string;
  engineNoteYarrow: string;
  questionLabel: string;
  questionPlaceholder: string;
  cast: string;
  casting: string;
  readingPending: string;
  reportTitle: string;
  reset: string;
  error: string;
  disclaimer: string;
  ctaBazi: string;
  ben: string;
  bian: string;
  dongYao: string;
  guaCi: string;
  daXiang: string;
  oddUse: string;
  noMoving: string;
  movingTag: string;
  coinZheng: string;
  coinBei: string;
  upTrigram: string;
  loTrigram: string;
  free: string;
}

const zh: BaguaMessages = {
  eyebrow: "周易 · 金钱卦",
  title: "文王卦",
  subtitle: "三枚铜钱，掷出六爻：观本卦之象、察动爻之机、推变卦之势。免费体验，一卦一问。",
  formTitle: "摇卦问事",
  engineNote: "三枚铜钱掷六次 · 六十四卦通行本卦辞爻辞",
  methodLabel: "起卦方式",
  methodCoin: "金钱卦 · 三枚铜钱",
  methodYarrow: "大衍筮法 · 五十蓍草",
  engineNoteYarrow: "五十蓍草三变一爻 · 十八变一卦",
  questionLabel: "你想问什么？（可留空）",
  questionPlaceholder: "如：这份新工作是否值得去？",
  cast: "摇 卦",
  casting: "正在揲卦…",
  readingPending: "正在为你解卦…",
  reportTitle: "卦象解读",
  reset: "再摇一卦",
  error: "解卦失败，请稍后再试。",
  disclaimer: "卦象解读仅供传统文化参考与娱乐，不作为医疗、法律、投资或重大人生决定的依据。",
  ctaBazi: "想更全面？试试八字排盘 →",
  ben: "本卦",
  bian: "变卦",
  dongYao: "动爻",
  guaCi: "卦辞",
  daXiang: "大象",
  oddUse: "用九 · 用六",
  noMoving: "无动爻 · 以卦辞断",
  movingTag: "动",
  coinZheng: "正",
  coinBei: "背",
  upTrigram: "上卦",
  loTrigram: "下卦",
  free: "免费",
};

const en: BaguaMessages = {
  eyebrow: "I Ching · Three-Coin Method",
  title: "I Ching Reading",
  subtitle: "Three coins, six throws: read the primary hexagram, the moving lines and the resulting hexagram. Free, one question per casting.",
  formTitle: "Cast a Hexagram",
  engineNote: "Three coins thrown six times · classical Zhouyi judgments and line texts",
  methodLabel: "Casting method",
  methodCoin: "Three coins",
  methodYarrow: "Yarrow stalks",
  engineNoteYarrow: "Fifty yarrow stalks, three changes per line · classical Zhouyi texts",
  questionLabel: "What would you like to ask? (optional)",
  questionPlaceholder: "e.g. Is this new job worth taking?",
  cast: "Cast",
  casting: "Casting…",
  readingPending: "Interpreting your hexagram…",
  reportTitle: "Interpretation",
  reset: "Cast again",
  error: "Reading failed, please try again later.",
  disclaimer: "Readings are for cultural reference and entertainment only — not a basis for medical, legal, financial or major life decisions.",
  ctaBazi: "Want the full picture? Try a Bazi chart →",
  ben: "Primary",
  bian: "Resulting",
  dongYao: "Moving lines",
  guaCi: "Judgment",
  daXiang: "Image",
  oddUse: "Use of Nine / Six",
  noMoving: "No moving lines · judged by the Judgment",
  movingTag: "moving",
  coinZheng: "H",
  coinBei: "T",
  upTrigram: "Above",
  loTrigram: "Below",
  free: "Free",
};

const ja: BaguaMessages = {
  eyebrow: "易経 · 金銭卦",
  title: "文王卦",
  subtitle: "三枚の銅銭を六回投げて六爻を得る。本卦の象、動爻の機、変卦の勢いを読みます。無料、一卦一問。",
  formTitle: "卦を立てる",
  engineNote: "銅銭三枚×六回 · 六十四卦通行本の卦辞・爻辞",
  methodLabel: "起卦法",
  methodCoin: "金銭卦・三枚の銅銭",
  methodYarrow: "大衍筮法・五十本の蓍草",
  engineNoteYarrow: "蓍草五十本・三変で一爻 · 六十四卦通行本",
  questionLabel: "何を問いますか？（空欄可）",
  questionPlaceholder: "例：この新しい仕事は受けるべきか？",
  cast: "卦を立てる",
  casting: "揲筮中…",
  readingPending: "卦を解読しています…",
  reportTitle: "卦象解読",
  reset: "もう一度",
  error: "解読に失敗しました。しばらくしてからお試しください。",
  disclaimer: "占いは伝統文化の参考・娯楽目的のみ。医療・法律・投資・重大な人生決定の根拠とはなりません。",
  ctaBazi: "より詳しくは八字鑑定を →",
  ben: "本卦",
  bian: "変卦",
  dongYao: "動爻",
  guaCi: "卦辞",
  daXiang: "大象",
  oddUse: "用九・用六",
  noMoving: "動爻なし · 卦辞で断ず",
  movingTag: "動",
  coinZheng: "表",
  coinBei: "裏",
  upTrigram: "上卦",
  loTrigram: "下卦",
  free: "無料",
};

const ko: BaguaMessages = {
  eyebrow: "주역 · 금전괘",
  title: "문왕괘",
  subtitle: "동전 세 개를 여섯 번 던져 육효를 얻습니다. 본괘의 상, 동효의 기, 변괘의 흐름을 읽습니다. 무료, 한 번에 한 가지 질문.",
  formTitle: "괘를 뽑다",
  engineNote: "동전 세 개 × 여섯 번 · 주역 통행본 괘사·효사",
  methodLabel: "괘 뽑는 법",
  methodCoin: "금전괘 · 동전 세 개",
  methodYarrow: "대연서법 · 시초 50개",
  engineNoteYarrow: "시초 50개 · 삼변일효 · 주역 통행본",
  questionLabel: "무엇을 묻겠습니까? (비워둘 수 있습니다)",
  questionPlaceholder: "예: 이 새 직장을 가야 할까?",
  cast: "괘 뽑기",
  casting: "점치는 중…",
  readingPending: "괘를 풀이하는 중…",
  reportTitle: "괘象 풀이",
  reset: "다시 뽑기",
  error: "풀이에 실패했습니다. 잠시 후 다시 시도해 주세요.",
  disclaimer: "풀이는 전통문화 참고 및 오락용이며, 의료·법률·투자·중대한 인생 결정의 근거가 아닙니다.",
  ctaBazi: "더 자세히는 사주 분석을 →",
  ben: "본괘",
  bian: "변괘",
  dongYao: "동효",
  guaCi: "괘사",
  daXiang: "대상",
  oddUse: "용구 · 용육",
  noMoving: "동효 없음 · 괘사로 판단",
  movingTag: "동",
  coinZheng: "앞",
  coinBei: "뒤",
  upTrigram: "상괘",
  loTrigram: "하괘",
  free: "무료",
};

const es: BaguaMessages = {
  eyebrow: "I Ching · Método de las tres monedas",
  title: "Lectura del I Ching",
  subtitle: "Tres monedas, seis lanzamientos: lee el hexagrama principal, las líneas móviles y el hexagrama resultante. Gratis, una pregunta por tirada.",
  formTitle: "Lanza un hexagrama",
  engineNote: "Tres monedas lanzadas seis veces · textos clásicos del Zhouyi",
  methodLabel: "Método de tirada",
  methodCoin: "Tres monedas",
  methodYarrow: "Varillas de milenrama",
  engineNoteYarrow: "Cincuenta varillas, tres cambios por línea · textos clásicos",
  questionLabel: "¿Qué quieres preguntar? (opcional)",
  questionPlaceholder: "p. ej. ¿Vale la pena aceptar este nuevo trabajo?",
  cast: "Lanzar",
  casting: "Lanzando…",
  readingPending: "Interpretando tu hexagrama…",
  reportTitle: "Interpretación",
  reset: "Lanzar de nuevo",
  error: "La lectura falló, inténtalo más tarde.",
  disclaimer: "Las lecturas son solo referencia cultural y entretenimiento; no son base para decisiones médicas, legales, financieras o vitales.",
  ctaBazi: "¿Quieres el panorama completo? Prueba la carta Bazi →",
  ben: "Principal",
  bian: "Resultante",
  dongYao: "Líneas móviles",
  guaCi: "Sentencia",
  daXiang: "Imagen",
  oddUse: "Uso del Nueve / Seis",
  noMoving: "Sin líneas móviles · se juzga por la Sentencia",
  movingTag: "móvil",
  coinZheng: "C",
  coinBei: "X",
  upTrigram: "Arriba",
  loTrigram: "Abajo",
  free: "Gratis",
};

const fr: BaguaMessages = {
  eyebrow: "Yi Jing · Méthode des trois pièces",
  title: "Lecture du Yi Jing",
  subtitle: "Trois pièces, six lancers : lisez l'hexagramme principal, les lignes mobiles et l'hexagramme résultant. Gratuit, une question par tirage.",
  formTitle: "Tirer un hexagramme",
  engineNote: "Trois pièces lancées six fois · textes classiques du Zhouyi",
  methodLabel: "Méthode de tirage",
  methodCoin: "Trois pièces",
  methodYarrow: "Tiges d'achillée",
  engineNoteYarrow: "Cinquante tiges, trois changements par ligne · textes classiques",
  questionLabel: "Que souhaitez-vous demander ? (facultatif)",
  questionPlaceholder: "ex. Ce nouveau poste vaut-il la peine ?",
  cast: "Lancer",
  casting: "Tirage en cours…",
  readingPending: "Interprétation de votre hexagramme…",
  reportTitle: "Interprétation",
  reset: "Relancer",
  error: "La lecture a échoué, veuillez réessayer plus tard.",
  disclaimer: "Les lectures relèvent de la référence culturelle et du divertissement ; elles ne servent pas de base à des décisions médicales, juridiques, financières ou de vie.",
  ctaBazi: "Pour une vue complète, essayez la carte Bazi →",
  ben: "Principal",
  bian: "Résultant",
  dongYao: "Lignes mobiles",
  guaCi: "Jugement",
  daXiang: "Image",
  oddUse: "Usage du Neuf / Six",
  noMoving: "Aucune ligne mobile · jugé par le Jugement",
  movingTag: "mobile",
  coinZheng: "F",
  coinBei: "P",
  upTrigram: "Haut",
  loTrigram: "Bas",
  free: "Gratuit",
};

const de: BaguaMessages = {
  eyebrow: "I Ging · Drei-Münzen-Methode",
  title: "I-Ging-Lesung",
  subtitle: "Drei Münzen, sechs Würfe: das Haupthexagramm, die bewegten Linien und das Wandelhexagramm lesen. Kostenlos, eine Frage pro Wurf.",
  formTitle: "Hexagramm werfen",
  engineNote: "Drei Münzen, sechs Würfe · klassische Zhouyi-Texte",
  methodLabel: "Wurfmethode",
  methodCoin: "Drei Münzen",
  methodYarrow: "Schafgarbenstängel",
  engineNoteYarrow: "Fünfzig Stängel, drei Wandlungen pro Linie · klassische Texte",
  questionLabel: "Was möchtest du fragen? (optional)",
  questionPlaceholder: "z. B. Lohnt sich diese neue Stelle?",
  cast: "Werfen",
  casting: "Wird geworfen…",
  readingPending: "Dein Hexagramm wird gedeutet…",
  reportTitle: "Deutung",
  reset: "Neu werfen",
  error: "Lesung fehlgeschlagen, bitte später erneut versuchen.",
  disclaimer: "Lesungen dienen kultureller Orientierung und Unterhaltung — keine Grundlage für medizinische, rechtliche, finanzielle oder Lebensentscheidungen.",
  ctaBazi: "Für das ganze Bild: Bazi-Chart ausprobieren →",
  ben: "Haupt",
  bian: "Wandel",
  dongYao: "Bewegte Linien",
  guaCi: "Urteil",
  daXiang: "Bild",
  oddUse: "Neun / Sechs",
  noMoving: "Keine bewegten Linien · Urteil entscheidet",
  movingTag: "bewegt",
  coinZheng: "K",
  coinBei: "Z",
  upTrigram: "Oben",
  loTrigram: "Unten",
  free: "Kostenlos",
};

const pt: BaguaMessages = {
  eyebrow: "I Ching · Método das três moedas",
  title: "Leitura do I Ching",
  subtitle: "Três moedas, seis lançamentos: leia o hexagrama principal, as linhas móveis e o hexagrama resultante. Grátis, uma pergunta por vez.",
  formTitle: "Lançar um hexagrama",
  engineNote: "Três moedas lançadas seis vezes · textos clássicos do Zhouyi",
  methodLabel: "Método de lançamento",
  methodCoin: "Três moedas",
  methodYarrow: "Varetas de milefólio",
  engineNoteYarrow: "Cinquenta varetas, três mudanças por linha · textos clássicos",
  questionLabel: "O que deseja perguntar? (opcional)",
  questionPlaceholder: "ex.: Vale a pena aceitar este novo emprego?",
  cast: "Lançar",
  casting: "Lançando…",
  readingPending: "Interpretando seu hexagrama…",
  reportTitle: "Interpretação",
  reset: "Lançar de novo",
  error: "A leitura falhou, tente novamente mais tarde.",
  disclaimer: "As leituras são apenas referência cultural e entretenimento; não servem de base para decisões médicas, jurídicas, financeiras ou de vida.",
  ctaBazi: "Quer o quadro completo? Experimente o mapa Bazi →",
  ben: "Principal",
  bian: "Resultante",
  dongYao: "Linhas móveis",
  guaCi: "Julgamento",
  daXiang: "Imagem",
  oddUse: "Uso do Nove / Seis",
  noMoving: "Sem linhas móveis · julgado pelo Julgamento",
  movingTag: "móvel",
  coinZheng: "C",
  coinBei: "X",
  upTrigram: "Acima",
  loTrigram: "Abaixo",
  free: "Grátis",
};

const ru: BaguaMessages = {
  eyebrow: "И цзин · метод трёх монет",
  title: "Чтение И цзин",
  subtitle: "Три монеты, шесть бросков: главная гексаграмма, движущиеся черты и гексаграмма перемен. Бесплатно, один вопрос за раз.",
  formTitle: "Бросить гексаграмму",
  engineNote: "Три монеты брошены шесть раз · классические тексты Чжоу и",
  methodLabel: "Способ гадания",
  methodCoin: "Три монеты",
  methodYarrow: "Стебли тысячелистника",
  engineNoteYarrow: "Пятьдесят стеблей, три перемены на черту · классические тексты",
  questionLabel: "Что вы хотите спросить? (необязательно)",
  questionPlaceholder: "напр. Стоит ли соглашаться на новую работу?",
  cast: "Бросить",
  casting: "Бросаем…",
  readingPending: "Толкуем вашу гексаграмму…",
  reportTitle: "Толкование",
  reset: "Бросить снова",
  error: "Не удалось получить чтение, попробуйте позже.",
  disclaimer: "Чтения носят культурно-справочный и развлекательный характер и не являются основанием для медицинских, юридических, финансовых или жизненных решений.",
  ctaBazi: "Хотите полную картину? Попробуйте карту Бацзы →",
  ben: "Главная",
  bian: "Перемен",
  dongYao: "Движущиеся черты",
  guaCi: "Приговор",
  daXiang: "Образ",
  oddUse: "Девятка / Шестёрка",
  noMoving: "Нет движущихся черт · судим по Приговору",
  movingTag: "движ.",
  coinZheng: "О",
  coinBei: "Р",
  upTrigram: "Сверху",
  loTrigram: "Снизу",
  free: "Бесплатно",
};

const ar: BaguaMessages = {
  eyebrow: "أنا تشينغ · طريقة العملات الثلاث",
  title: "قراءة الأنا تشينغ",
  subtitle: "ثلاث عملات وست رَميات: اقرأ السداسية الأساسية والخطوط المتحركة والسداسية الناتجة. مجاناً، سؤال واحد لكل مرة.",
  formTitle: "ارمِ سداسية",
  engineNote: "ثلاث عملات تُرمى ست مرات · نصوص تشو يي الكلاسيكية",
  methodLabel: "طريقة الرمي",
  methodCoin: "ثلاث عملات",
  methodYarrow: "أعواد الألفية",
  engineNoteYarrow: "خمسون عوداً، ثلاث تغييرات لكل خط · نصوص تشو يي الكلاسيكية",
  questionLabel: "ماذا تريد أن تسأل؟ (اختياري)",
  questionPlaceholder: "مثال: هل تستحق هذه الوظيفة الجديدة؟",
  cast: "ارمِ",
  casting: "جارٍ الرمي…",
  readingPending: "جارٍ تفسير سداسيتك…",
  reportTitle: "التفسير",
  reset: "ارمِ مرة أخرى",
  error: "فشلت القراءة، حاول لاحقاً.",
  disclaimer: "القراءات للمرجعية الثقافية والترفيه فقط؛ وليست أساساً لقرارات طبية أو قانونية أو مالية أو حياتية.",
  ctaBazi: "تريد الصورة الكاملة؟ جرّب خريطة البازي →",
  ben: "الأساسية",
  bian: "الناتجة",
  dongYao: "الخطوط المتحركة",
  guaCi: "الحكم",
  daXiang: "الصورة",
  oddUse: "استخدام التسعة / الستة",
  noMoving: "لا خطوط متحركة · يُحكم بالحكم",
  movingTag: "متحرك",
  coinZheng: "و",
  coinBei: "خ",
  upTrigram: "أعلى",
  loTrigram: "أسفل",
  free: "مجاني",
};

const MESSAGES: Record<Locale, BaguaMessages> = { zh, en, ja, ko, es, fr, de, pt, ru, ar };

export function getBaguaMessages(locale: Locale): BaguaMessages {
  return MESSAGES[locale] || en;
}

/** 八卦的自然象（英文语境用 "Water over Thunder" 这类经典表述）。 */
const TRIGRAM_EN: Record<string, string> = {
  乾: "Heaven", 兑: "Lake", 离: "Fire", 震: "Thunder",
  巽: "Wind", 坎: "Water", 艮: "Mountain", 坤: "Earth",
};

export interface BaguaHex {
  n: number;
  name: string;
  full: string;
  sym: string;
  up: string;
  lo: string;
  en: string;
  py?: string;
  ko?: string;
  gua?: string;
  xiang?: string;
}

/** 卦名本地化：zh/ja 原字（ja 用「為」），ko 韩文，其余 Wilhelm 英文名。 */
export function hexName(locale: Locale, hex: BaguaHex): string {
  if (locale === "zh") return hex.full;
  if (locale === "ja") return hex.full.replace(/为/g, "為");
  if (locale === "ko") return hex.ko || hex.full;
  return hex.en;
}

/** 上下卦表述：中文「上坎下震」，英文「Water over Thunder」。 */
export function trigramLine(locale: Locale, hex: BaguaHex): string {
  if (locale === "zh" || locale === "ja" || locale === "ko") {
    const m = getBaguaMessages(locale);
    return m.upTrigram + " " + hex.up + " · " + m.loTrigram + " " + hex.lo;
  }
  return (TRIGRAM_EN[hex.up] || hex.up) + " over " + (TRIGRAM_EN[hex.lo] || hex.lo);
}

/** 爻位标签：「第 4 爻」/「Line 4」。 */
export function yaoPosLabel(locale: Locale, pos: number): string {
  if (locale === "zh") return "第" + pos + "爻";
  if (locale === "ja") return "第" + pos + "爻";
  if (locale === "ko") return "제" + pos + "효";
  return "Line " + pos;
}
