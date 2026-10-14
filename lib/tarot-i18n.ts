import { Locale } from "./i18n";

/**
 * 塔罗页面文案（10 语言）。
 * 牌名显示：中文用中文名，其他语言用英文标准牌名（塔罗圈通用）。
 * 位置标签：中文用原文，其他语言用英文。
 */

export interface TarotMessages {
  eyebrow: string;
  title: string;
  subtitle: string;
  questionLabel: string;
  questionPlaceholder: string;
  spreadLabel: string;
  draw: string;
  drawing: string;
  readingPending: string;
  reportTitle: string;
  reset: string;
  upright: string;
  reversed: string;
  engineNote: string;
  error: string;
  ctaBazi: string;
  disclaimer: string;
  spreads: {
    single: string;
    three: string;
    diamond: string;
    moon: string;
    horseshoe: string;
    celtic: string;
  };
}

const zh: TarotMessages = {
  eyebrow: "TAROT · 塔罗",
  title: "塔罗占卜",
  subtitle: "塔罗是镜子，不是水晶球——把牌面转成自我观察与可选择的下一步。",
  questionLabel: "你的问题（可选）",
  questionPlaceholder: "例如：这段关系会如何发展？",
  spreadLabel: "选择牌阵",
  draw: "抽牌",
  drawing: "抽牌中…",
  readingPending: "牌已抽出，解读生成中（约 1-2 分钟）…",
  reportTitle: "你的塔罗解读",
  reset: "重新抽牌",
  upright: "正位",
  reversed: "逆位",
  engineNote: "密码学安全随机抽牌 · AI 按专业塔罗方法论解读",
  error: "生成失败，请稍后重试",
  ctaBazi: "想看更深层的命理格局？试试八字测算 →",
  disclaimer: "仅供文化参考与娱乐用途，不构成医疗、法律或金融建议。",
  spreads: {
    single: "单张牌",
    three: "三牌阵",
    diamond: "五牌阵",
    moon: "月亮牌阵",
    horseshoe: "马蹄形",
    celtic: "凯尔特十字",
  },
};

const en: TarotMessages = {
  eyebrow: "TAROT",
  title: "Tarot Reading",
  subtitle: "Tarot is a mirror, not a crystal ball — turn the cards into self-reflection and your next step.",
  questionLabel: "Your question (optional)",
  questionPlaceholder: "e.g. Where is this relationship heading?",
  spreadLabel: "Choose a spread",
  draw: "Draw Cards",
  drawing: "Drawing…",
  readingPending: "Cards drawn — generating your reading (1-2 min)…",
  reportTitle: "Your Reading",
  reset: "New Reading",
  upright: "Upright",
  reversed: "Reversed",
  engineNote: "Cryptographically random draw · interpreted with professional tarot methodology",
  error: "Generation failed, please try again",
  ctaBazi: "Want a deeper destiny analysis? Try Bazi Reading →",
  disclaimer: "For cultural interest and entertainment only — not medical, legal, or financial advice.",
  spreads: {
    single: "Single Card",
    three: "Three Card",
    diamond: "Five Card (Diamond)",
    moon: "Moon Spread",
    horseshoe: "Horseshoe",
    celtic: "Celtic Cross",
  },
};

const ja: TarotMessages = {
  eyebrow: "TAROT",
  title: "タロット占い",
  subtitle: "タロットは鏡であり、水晶玉ではありません——カードを自己観察と次の一歩に変えましょう。",
  questionLabel: "質問（任意）",
  questionPlaceholder: "例：この関係はどう進みますか？",
  spreadLabel: "スプレッドを選択",
  draw: "カードを引く",
  drawing: "抽選中…",
  readingPending: "カードを引きました。リーディング生成中（1〜2分）…",
  reportTitle: "あなたのリーディング",
  reset: "もう一度引く",
  upright: "正位置",
  reversed: "逆位置",
  engineNote: "暗号論的乱数で抽選 · 専門タロット方法論に基づくAIリーディング",
  error: "生成に失敗しました。もう一度お試しください",
  ctaBazi: "より深い運命分析をご希望ですか？八字鑑定もどうぞ →",
  disclaimer: "文化・娯楽目的のみ。医療・法律・金融のアドバイスではありません。",
  spreads: {
    single: "一枚引き",
    three: "スリーカード",
    diamond: "ファイブカード",
    moon: "ムーンスプレッド",
    horseshoe: "ホースシュー",
    celtic: "ケルト十字",
  },
};

const ko: TarotMessages = {
  eyebrow: "TAROT",
  title: "타로 리딩",
  subtitle: "타로는 거울이지 수정구슬이 아닙니다 — 카드를 자기 성찰과 다음 행동으로 바꿔보세요.",
  questionLabel: "질문 (선택)",
  questionPlaceholder: "예: 이 관계는 어떻게 흘러갈까요?",
  spreadLabel: "스프레드 선택",
  draw: "카드 뽑기",
  drawing: "뽑는 중…",
  readingPending: "카드를 뽑았습니다. 리딩 생성 중 (1-2분)…",
  reportTitle: "당신의 리딩",
  reset: "다시 뽑기",
  upright: "정방향",
  reversed: "역방향",
  engineNote: "암호학적 난수로 추첨 · 전문 타로 방법론에 따른 AI 리딩",
  error: "생성 실패, 다시 시도해 주세요",
  ctaBazi: "더 깊은 운명 분석을 원하시나요? 사주 분석도 해보세요 →",
  disclaimer: "문화 및 오락 목적 전용이며, 의료·법률·금융 조언이 아닙니다.",
  spreads: {
    single: "원 카드",
    three: "쓰리 카드",
    diamond: "파이브 카드",
    moon: "문 스프레드",
    horseshoe: "호스슈",
    celtic: "켈트 십자",
  },
};

const es: TarotMessages = {
  eyebrow: "TAROT",
  title: "Lectura de Tarot",
  subtitle: "El tarot es un espejo, no una bola de cristal: convierte las cartas en reflexión y próximos pasos.",
  questionLabel: "Tu pregunta (opcional)",
  questionPlaceholder: "p. ej. ¿Hacia dónde va esta relación?",
  spreadLabel: "Elige una tirada",
  draw: "Sacar cartas",
  drawing: "Sacando…",
  readingPending: "Cartas sacadas: generando tu lectura (1-2 min)…",
  reportTitle: "Tu lectura",
  reset: "Nueva tirada",
  upright: "Al derecho",
  reversed: "Invertida",
  engineNote: "Sorteo criptográficamente aleatorio · interpretado con metodología tarot profesional",
  error: "Error de generación, inténtalo de nuevo",
  ctaBazi: "¿Quieres un análisis más profundo? Prueba la Lectura Bazi →",
  disclaimer: "Solo con fines culturales y de entretenimiento; no es asesoramiento médico, legal ni financiero.",
  spreads: {
    single: "Carta Única",
    three: "Tres Cartas",
    diamond: "Cinco Cartas (Diamante)",
    moon: "Tirada de la Luna",
    horseshoe: "Herradura",
    celtic: "Cruz Celta",
  },
};

const fr: TarotMessages = {
  eyebrow: "TAROT",
  title: "Tirage de Tarot",
  subtitle: "Le tarot est un miroir, pas une boule de cristal — transformez les cartes en introspection et en prochaines étapes.",
  questionLabel: "Votre question (facultatif)",
  questionPlaceholder: "ex. Où va cette relation ?",
  spreadLabel: "Choisissez un tirage",
  draw: "Tirer les cartes",
  drawing: "Tirage…",
  readingPending: "Cartes tirées — génération de votre lecture (1-2 min)…",
  reportTitle: "Votre lecture",
  reset: "Nouveau tirage",
  upright: "À l'endroit",
  reversed: "Renversée",
  engineNote: "Tirage aléatoire cryptographique · interprété selon la méthodologie tarot professionnelle",
  error: "Échec de génération, veuillez réessayer",
  ctaBazi: "Envie d'une analyse plus profonde ? Essayez la Lecture Bazi →",
  disclaimer: "À des fins culturelles et de divertissement uniquement — pas un conseil médical, juridique ou financier.",
  spreads: {
    single: "Carte Unique",
    three: "Trois Cartes",
    diamond: "Cinq Cartes (Diamant)",
    moon: "Tirage de la Lune",
    horseshoe: "Fer à Cheval",
    celtic: "Croix Celtique",
  },
};

const de: TarotMessages = {
  eyebrow: "TAROT",
  title: "Tarot-Lesung",
  subtitle: "Tarot ist ein Spiegel, keine Glaskugel — verwandle die Karten in Selbstreflexion und nächste Schritte.",
  questionLabel: "Deine Frage (optional)",
  questionPlaceholder: "z. B. Wohin entwickelt sich diese Beziehung?",
  spreadLabel: "Legung wählen",
  draw: "Karten ziehen",
  drawing: "Ziehen…",
  readingPending: "Karten gezogen — Lesung wird erstellt (1-2 Min.)…",
  reportTitle: "Deine Lesung",
  reset: "Neue Legung",
  upright: "Aufrecht",
  reversed: "Umgekehrt",
  engineNote: "Kryptografisch zufällige Ziehung · interpretiert nach professioneller Tarot-Methodik",
  error: "Erstellung fehlgeschlagen, bitte erneut versuchen",
  ctaBazi: "Lust auf eine tiefere Analyse? Probiere die Bazi-Lesung →",
  disclaimer: "Nur für kulturelle und Unterhaltungszwecke — keine medizinische, rechtliche oder finanzielle Beratung.",
  spreads: {
    single: "Einzelkarte",
    three: "Drei Karten",
    diamond: "Fünf Karten (Diamant)",
    moon: "Mondlegung",
    horseshoe: "Hufeisen",
    celtic: "Keltisches Kreuz",
  },
};

const pt: TarotMessages = {
  eyebrow: "TAROT",
  title: "Leitura de Tarot",
  subtitle: "O tarot é um espelho, não uma bola de cristal — transforme as cartas em reflexão e próximos passos.",
  questionLabel: "Sua pergunta (opcional)",
  questionPlaceholder: "ex.: Para onde vai este relacionamento?",
  spreadLabel: "Escolha uma tiragem",
  draw: "Tirar cartas",
  drawing: "Tirando…",
  readingPending: "Cartas tiradas — gerando sua leitura (1-2 min)…",
  reportTitle: "Sua leitura",
  reset: "Nova tiragem",
  upright: "Em pé",
  reversed: "Invertida",
  engineNote: "Sorteio criptograficamente aleatório · interpretado com metodologia profissional de tarot",
  error: "Falha na geração, tente novamente",
  ctaBazi: "Quer uma análise mais profunda? Experimente a Leitura Bazi →",
  disclaimer: "Apenas para fins culturais e de entretenimento — não é aconselhamento médico, jurídico ou financeiro.",
  spreads: {
    single: "Carta Única",
    three: "Três Cartas",
    diamond: "Cinco Cartas (Diamante)",
    moon: "Tiragem da Lua",
    horseshoe: "Ferradura",
    celtic: "Cruz Celta",
  },
};

const ru: TarotMessages = {
  eyebrow: "ТАРО",
  title: "Расклад Таро",
  subtitle: "Таро — это зеркало, а не хрустальный шар: превратите карты в самонаблюдение и следующий шаг.",
  questionLabel: "Ваш вопрос (необязательно)",
  questionPlaceholder: "напр. Куда движутся эти отношения?",
  spreadLabel: "Выберите расклад",
  draw: "Вытянуть карты",
  drawing: "Тянем…",
  readingPending: "Карты вытянуты — готовим расклад (1–2 мин)…",
  reportTitle: "Ваш расклад",
  reset: "Новый расклад",
  upright: "Прямое",
  reversed: "Перевёрнутое",
  engineNote: "Криптографически случайная вытяжка · интерпретация по профессиональной методике таро",
  error: "Не удалось сгенерировать, попробуйте ещё раз",
  ctaBazi: "Хотите более глубокий анализ? Попробуйте разбор Бацзы →",
  disclaimer: "Только в культурных и развлекательных целях — не является медицинской, юридической или финансовой консультацией.",
  spreads: {
    single: "Одна карта",
    three: "Три карты",
    diamond: "Пять карт (Алмаз)",
    moon: "Расклад Луны",
    horseshoe: "Подкова",
    celtic: "Кельтский крест",
  },
};

const ar: TarotMessages = {
  eyebrow: "التاروت",
  title: "قراءة التاروت",
  subtitle: "التاروت مرآة وليس كرة بلورية — حوّل البطاقات إلى تأمل وخطوتك التالية.",
  questionLabel: "سؤالك (اختياري)",
  questionPlaceholder: "مثال: إلى أين تتجه هذه العلاقة؟",
  spreadLabel: "اختر الانتشار",
  draw: "اسحب البطاقات",
  drawing: "جارٍ السحب…",
  readingPending: "تم سحب البطاقات — جارٍ إنشاء القراءة (1-2 دقيقة)…",
  reportTitle: "قراءتك",
  reset: "قراءة جديدة",
  upright: "معتدلة",
  reversed: "مقلوبة",
  engineNote: "سحب عشوائي مشفّر · تفسير وفق منهجية التاروت الاحترافية",
  error: "فشل الإنشاء، حاول مرة أخرى",
  ctaBazi: "تريد تحليلاً أعمق؟ جرّب قراءة البازي →",
  disclaimer: "للأغراض الثقافية والترفيهية فقط — ليست نصيحة طبية أو قانونية أو مالية.",
  spreads: {
    single: "بطاقة واحدة",
    three: "ثلاث بطاقات",
    diamond: "خمس بطاقات (الماسة)",
    moon: "انتشار القمر",
    horseshoe: "حدوة الحصان",
    celtic: "الصليب السلتي",
  },
};

const TAROT_MESSAGES: Record<Locale, TarotMessages> = { zh, en, ja, ko, es, fr, de, pt, ru, ar };

export function getTarotMessages(locale: Locale): TarotMessages {
  return TAROT_MESSAGES[locale] || en;
}

// ---------------------------------------------------------------------------
// 位置标签（中文原文 → 英文；其他语言回退英文）
// ---------------------------------------------------------------------------

const POSITION_EN: Record<string, string> = {
  当前指引: "Current Guidance",
  过去: "Past",
  现在: "Present",
  未来: "Future",
  核心: "Core",
  根源: "Root",
  阻力: "Obstacle",
  潜力: "Potential",
  建议: "Advice",
  新月: "New Moon",
  上弦: "First Quarter",
  满月: "Full Moon",
  下弦: "Last Quarter",
  远期过去: "Distant Past",
  近期过去: "Recent Past",
  当前: "Present",
  近期未来: "Near Future",
  外部影响: "External Influences",
  结果: "Outcome",
  交叉: "Crossing",
  意识目标: "Conscious Goal",
  根基过去: "Foundation",
  自我: "Self",
  环境: "Environment",
  希望与恐惧: "Hopes & Fears",
};

export function positionLabel(locale: Locale, zhName: string): string {
  if (locale === "zh") return zhName;
  return POSITION_EN[zhName] || zhName;
}

/** 牌名：中文用中文名，其他语言用英文标准牌名。 */
export function cardName(locale: Locale, zh: string, en: string): string {
  return locale === "zh" ? zh : en || zh;
}

/** 元素配色（火/水/风/土） */
export const TAROT_ELEMENT_COLORS: Record<string, string> = {
  火: "#e08a6d",
  水: "#7fa8d9",
  风: "#d8c9a3",
  土: "#cbb26a",
};
