import { Locale } from "./i18n";

/**
 * 功能总览页（/features）文案。
 *
 * 目的：一页把站点所有能力讲清楚，按「免费 → 微付费 → 重付费」分组，
 * 每张卡片整块可点，直接进详情页。
 *
 * 约定：标题复用导航里的叫法（对话/塔罗/文王卦…），描述控制在 20–40 字，
 * 只说「这是什么、能拿到什么」，不写夸大形容词。
 */

export type FeatureItem = {
  key: string;
  title: string;
  desc: string;
  badge: string;
  href: string;
  /** 高亮推荐（免费那几张） */
  hot?: boolean;
};

export interface FeaturesMessages {
  eyebrow: string;
  title: string;
  subtitle: string;
  sectionFree: string;
  sectionMid: string;
  sectionHigh: string;
  cta: string;
  loginNote: string;
  freeNote: string;
  items: FeatureItem[];
}

const ZH: FeaturesMessages = {
  eyebrow: "全部功能",
  title: "这里有你能用的所有东西",
  subtitle:
    "先挑免费的把玩，觉得对味再往下走。每一项都能点进详情页，不需要先决定什么。",
  sectionFree: "免费 · 登录后即可使用",
  sectionMid: "微付费 · $6.80",
  sectionHigh: "重付费 · $66 起",
  cta: "进入",
  loginNote: "所有功能都需要登录后使用；页面本身可以直接浏览。",
  freeNote: "免费功能不消耗你的余额，也不要求付款信息。",
  items: [
    { key: "advisor", title: "AI 对话助手", desc: "用大白话提问，AI 自动选合适的引擎排盘，再把盘面讲给你听。", badge: "免费", href: "/#advisor" },
    { key: "tarot", title: "塔罗占卜", desc: "抽三张牌，看当下的处境、卡住的地方，以及可以怎么走。", badge: "免费", href: "/tarot" },
    { key: "bagua", title: "文王卦", desc: "为一件事掷六次铜钱起卦，看它接下来的走向与变爻。", badge: "免费", href: "/bagua" },
    { key: "ziwei", title: "紫微斗数", desc: "十二宫命盘：十四主星、四化落宫、大限流转，一眼看全局。", badge: "免费", href: "/ziwei" },
    { key: "learn", title: "命理知识", desc: "讲座视频与基础概念，先把底子打牢，再决定要不要深入。", badge: "免费", href: "/learn" },
    { key: "bazi", title: "八字测算", desc: "900–1200 词完整命书：事业、财运、感情与关键时机。", badge: "$6.80", href: "/bazi" },
    { key: "shop", title: "朱砂符纸", desc: "手绘朱砂符纸 16 款，也接私人定制；带收货信息直接下单。", badge: "$66 起", href: "/shop" },
    { key: "courses", title: "系统课程", desc: "从零基础到能自己读盘，按节奏学，配练习与答疑。", badge: "即将开放", href: "/courses" },
  ],
};

const EN: FeaturesMessages = {
  eyebrow: "Everything here",
  title: "All the tools on this site",
  subtitle:
    "Start with the free ones. Each card opens the full page — nothing to decide before you look.",
  sectionFree: "Free · sign in to use",
  sectionMid: "Light paid · $6.80",
  sectionHigh: "Premium · from $66",
  cta: "Open",
  loginNote: "Every tool needs a sign-in to use; the pages themselves stay open to browse.",
  freeNote: "Free tools never touch your balance and never ask for payment details.",
  items: [
    { key: "advisor", title: "AI Advisor", desc: "Ask in plain language; the model picks the right engine and explains the chart it gets back.", badge: "Free", href: "/#advisor" },
    { key: "tarot", title: "Tarot", desc: "Three cards for the situation you are in right now — what blocks it, what to try.", badge: "Free", href: "/tarot" },
    { key: "bagua", title: "I Ching", desc: "Toss coins six times for one question, and read how it is likely to move.", badge: "Free", href: "/bagua" },
    { key: "ziwei", title: "Zi Wei Dou Shu", desc: "The twelve-palace chart: fourteen major stars, four transformations, decade cycles.", badge: "Free", href: "/ziwei" },
    { key: "learn", title: "Knowledge Library", desc: "Lecture videos and core concepts, so you can judge the rest for yourself.", badge: "Free", href: "/learn" },
    { key: "bazi", title: "BaZi Reading", desc: "A 900–1,200 word written report: career, wealth, relationships and timing.", badge: "$6.80", href: "/bazi" },
    { key: "shop", title: "Paper Talismans", desc: "Sixteen hand-brushed cinnabar talismans, plus bespoke pieces made to order.", badge: "from $66", href: "/shop" },
    { key: "courses", title: "Courses", desc: "Structured lessons from first principles to reading a chart on your own.", badge: "Coming soon", href: "/courses" },
  ],
};

const JA: FeaturesMessages = {
  eyebrow: "機能一覧",
  title: "このサイトで使えるもの全部",
  subtitle: "まずは無料のものから。カードを押せば詳細ページへ移動します。",
  sectionFree: "無料・ログインで利用",
  sectionMid: "ライト課金・$6.80",
  sectionHigh: "プレミアム・$66 から",
  cta: "開く",
  loginNote: "すべての機能はログインが必要です（ページ自体は閲覧できます）。",
  freeNote: "無料機能は残高を消費せず、支払い情報も求めません。",
  items: [
    { key: "advisor", title: "AI 対話", desc: "普通の言葉で質問すると、AI が適切なエンジンを選んで盤を読み解きます。", badge: "無料", href: "/#advisor" },
    { key: "tarot", title: "タロット", desc: "3 枚引いて、今の状況と行き詰まり、進む方向を見ます。", badge: "無料", href: "/tarot" },
    { key: "bagua", title: "文王卦", desc: "ひとつの問いのために硬貨を 6 回投げ、これからの展開を読みます。", badge: "無料", href: "/bagua" },
    { key: "ziwei", title: "紫微斗数", desc: "十二宮の命盤：十四主星・四化・大限の流れを一目で。", badge: "無料", href: "/ziwei" },
    { key: "learn", title: "知識ライブラリ", desc: "講義動画と基礎概念。まず土台を作ってから判断できます。", badge: "無料", href: "/learn" },
    { key: "bazi", title: "八字鑑定", desc: "900〜1200 語の鑑定書：仕事・財運・恋愛とタイミング。", badge: "$6.80", href: "/bazi" },
    { key: "shop", title: "朱砂の護符", desc: "手描きの護符 16 種、オーダーメイドも可能。", badge: "$66 から", href: "/shop" },
    { key: "courses", title: "講座", desc: "基礎から自分で盤を読めるまで、順を追って学べます。", badge: "近日公開", href: "/courses" },
  ],
};

const KO: FeaturesMessages = {
  eyebrow: "전체 기능",
  title: "이 사이트에서 쓸 수 있는 모든 것",
  subtitle: "무료부터 시작해 보세요. 카드를 누르면 상세 페이지로 이동합니다.",
  sectionFree: "무료 · 로그인 후 사용",
  sectionMid: "소액 결제 · $6.80",
  sectionHigh: "프리미엄 · $66부터",
  cta: "열기",
  loginNote: "모든 기능은 로그인이 필요합니다. 페이지 자체는 둘러볼 수 있습니다.",
  freeNote: "무료 기능은 잔액을 쓰지 않고 결제 정보도 요구하지 않습니다.",
  items: [
    { key: "advisor", title: "AI 대화", desc: "평범한 말로 물으면 AI가 알맞은 엔진으로 명반을 세우고 해석합니다.", badge: "무료", href: "/#advisor" },
    { key: "tarot", title: "타로", desc: "세 장을 뽑아 지금의 상황과 막힌 지점, 나아갈 방향을 봅니다.", badge: "무료", href: "/tarot" },
    { key: "bagua", title: "주역", desc: "한 가지 질문에 동전을 여섯 번 던져 앞으로의 흐름을 읽습니다.", badge: "무료", href: "/bagua" },
    { key: "ziwei", title: "자미두수", desc: "십이궁 명반: 십사주성, 사화, 대한의 흐름을 한눈에.", badge: "무료", href: "/ziwei" },
    { key: "learn", title: "지식 라이브러리", desc: "강의 영상과 기본 개념으로 토대를 먼저 다집니다.", badge: "무료", href: "/learn" },
    { key: "bazi", title: "사주 분석", desc: "900~1200단어 리포트: 직업, 재물, 관계와 시기.", badge: "$6.80", href: "/bazi" },
    { key: "shop", title: "주사 부적", desc: "손으로 그린 부적 16종, 맞춤 제작도 가능합니다.", badge: "$66부터", href: "/shop" },
    { key: "courses", title: "강의", desc: "기초부터 직접 명반을 읽을 수 있을 때까지 단계적으로.", badge: "곧 공개", href: "/courses" },
  ],
};

const ES: FeaturesMessages = {
  eyebrow: "Todo lo que hay",
  title: "Todas las herramientas del sitio",
  subtitle: "Empieza por las gratuitas. Cada tarjeta abre su página completa.",
  sectionFree: "Gratis · tras iniciar sesión",
  sectionMid: "Pago ligero · $6.80",
  sectionHigh: "Premium · desde $66",
  cta: "Abrir",
  loginNote: "Todas las herramientas requieren iniciar sesión; las páginas se pueden visitar.",
  freeNote: "Las herramientas gratuitas no tocan tu saldo ni piden datos de pago.",
  items: [
    { key: "advisor", title: "Asesor IA", desc: "Pregunta con tus palabras: el modelo elige el motor adecuado y explica la carta.", badge: "Gratis", href: "/#advisor" },
    { key: "tarot", title: "Tarot", desc: "Tres cartas para tu situación actual: qué bloquea y qué probar.", badge: "Gratis", href: "/tarot" },
    { key: "bagua", title: "I Ching", desc: "Seis tiradas de monedas para una pregunta concreta y su evolución.", badge: "Gratis", href: "/bagua" },
    { key: "ziwei", title: "Zi Wei Dou Shu", desc: "La carta de doce palacios: catorce estrellas mayores, cuatro transformaciones, décadas.", badge: "Gratis", href: "/ziwei" },
    { key: "learn", title: "Biblioteca", desc: "Vídeos y conceptos básicos para juzgar el resto por ti mismo.", badge: "Gratis", href: "/learn" },
    { key: "bazi", title: "Lectura BaZi", desc: "Informe de 900–1.200 palabras: carrera, dinero, relaciones y tiempos.", badge: "$6.80", href: "/bazi" },
    { key: "shop", title: "Talismanes", desc: "Dieciséis talismanes de cinabrio pintados a mano, también a medida.", badge: "desde $66", href: "/shop" },
    { key: "courses", title: "Cursos", desc: "Lecciones estructuradas, desde cero hasta leer una carta solo.", badge: "Próximamente", href: "/courses" },
  ],
};

const FR: FeaturesMessages = {
  eyebrow: "Tout ce qui existe",
  title: "Tous les outils du site",
  subtitle: "Commencez par le gratuit. Chaque carte ouvre sa page complète.",
  sectionFree: "Gratuit · après connexion",
  sectionMid: "Petit prix · $6.80",
  sectionHigh: "Premium · dès $66",
  cta: "Ouvrir",
  loginNote: "Tous les outils demandent une connexion ; les pages restent consultables.",
  freeNote: "Les outils gratuits ne touchent pas à votre solde et ne demandent aucun moyen de paiement.",
  items: [
    { key: "advisor", title: "Conseiller IA", desc: "Posez la question simplement : le modèle choisit le bon moteur et explique la carte.", badge: "Gratuit", href: "/#advisor" },
    { key: "tarot", title: "Tarot", desc: "Trois cartes pour votre situation : ce qui bloque, ce qu'il faut tenter.", badge: "Gratuit", href: "/tarot" },
    { key: "bagua", title: "Yi Jing", desc: "Six lancers de pièces pour une question précise et son évolution.", badge: "Gratuit", href: "/bagua" },
    { key: "ziwei", title: "Zi Wei Dou Shu", desc: "La carte des douze palais : quatorze étoiles majeures, quatre transformations, décennies.", badge: "Gratuit", href: "/ziwei" },
    { key: "learn", title: "Bibliothèque", desc: "Vidéos et notions de base pour vous faire votre propre idée.", badge: "Gratuit", href: "/learn" },
    { key: "bazi", title: "Lecture BaZi", desc: "Un rapport de 900 à 1 200 mots : carrière, argent, relations, timing.", badge: "$6.80", href: "/bazi" },
    { key: "shop", title: "Talismans", desc: "Seize talismans au cinabre peints à la main, et des pièces sur mesure.", badge: "dès $66", href: "/shop" },
    { key: "courses", title: "Cours", desc: "Des leçons structurées, de zéro jusqu'à lire une carte soi-même.", badge: "Bientôt", href: "/courses" },
  ],
};

const DE: FeaturesMessages = {
  eyebrow: "Alles hier",
  title: "Alle Werkzeuge dieser Seite",
  subtitle: "Fang mit dem Kostenlosen an. Jede Karte öffnet die volle Seite.",
  sectionFree: "Kostenlos · nach dem Login",
  sectionMid: "Günstig · $6.80",
  sectionHigh: "Premium · ab $66",
  cta: "Öffnen",
  loginNote: "Alle Werkzeuge brauchen einen Login; die Seiten selbst sind frei zugänglich.",
  freeNote: "Kostenlose Werkzeuge berühren dein Guthaben nicht und verlangen keine Zahlungsdaten.",
  items: [
    { key: "advisor", title: "KI-Berater", desc: "Einfach fragen: das Modell wählt die passende Engine und erklärt die Karte.", badge: "Kostenlos", href: "/#advisor" },
    { key: "tarot", title: "Tarot", desc: "Drei Karten für deine Lage: was blockiert, was du versuchen kannst.", badge: "Kostenlos", href: "/tarot" },
    { key: "bagua", title: "I Ging", desc: "Sechs Münzwürfe für eine konkrete Frage und ihre Entwicklung.", badge: "Kostenlos", href: "/bagua" },
    { key: "ziwei", title: "Zi Wei Dou Shu", desc: "Die Zwölf-Palast-Karte: vierzehn Hauptsterne, vier Wandlungen, Dekaden.", badge: "Kostenlos", href: "/ziwei" },
    { key: "learn", title: "Wissensbibliothek", desc: "Vorträge und Grundbegriffe, damit du den Rest selbst einschätzen kannst.", badge: "Kostenlos", href: "/learn" },
    { key: "bazi", title: "BaZi-Lesung", desc: "Ein Bericht mit 900–1.200 Wörtern: Beruf, Geld, Beziehungen, Timing.", badge: "$6.80", href: "/bazi" },
    { key: "shop", title: "Talismane", desc: "Sechzehn handgemalte Zinnober-Talismane, auch nach Maß.", badge: "ab $66", href: "/shop" },
    { key: "courses", title: "Kurse", desc: "Strukturierte Lektionen, von null bis zum eigenen Kartenlesen.", badge: "Bald", href: "/courses" },
  ],
};

const PT: FeaturesMessages = {
  eyebrow: "Tudo aqui",
  title: "Todas as ferramentas do site",
  subtitle: "Começa pelas gratuitas. Cada cartão abre a página completa.",
  sectionFree: "Grátis · após iniciar sessão",
  sectionMid: "Preço baixo · $6.80",
  sectionHigh: "Premium · desde $66",
  cta: "Abrir",
  loginNote: "Todas as ferramentas exigem sessão iniciada; as páginas ficam abertas para ver.",
  freeNote: "As ferramentas grátis não mexem no teu saldo nem pedem dados de pagamento.",
  items: [
    { key: "advisor", title: "Conselheiro IA", desc: "Pergunta com as tuas palavras: o modelo escolhe o motor certo e explica a carta.", badge: "Grátis", href: "/#advisor" },
    { key: "tarot", title: "Tarot", desc: "Três cartas para a tua situação: o que trava e o que tentar.", badge: "Grátis", href: "/tarot" },
    { key: "bagua", title: "I Ching", desc: "Seis lançamentos de moedas para uma pergunta concreta e o seu rumo.", badge: "Grátis", href: "/bagua" },
    { key: "ziwei", title: "Zi Wei Dou Shu", desc: "A carta dos doze palácios: catorze estrelas maiores, quatro transformações, décadas.", badge: "Grátis", href: "/ziwei" },
    { key: "learn", title: "Biblioteca", desc: "Vídeos e conceitos base, para julgares o resto por ti.", badge: "Grátis", href: "/learn" },
    { key: "bazi", title: "Leitura BaZi", desc: "Relatório de 900–1.200 palavras: carreira, dinheiro, relações e timing.", badge: "$6.80", href: "/bazi" },
    { key: "shop", title: "Talismãs", desc: "Dezasseis talismãs de cinábrio pintados à mão, e peças à medida.", badge: "desde $66", href: "/shop" },
    { key: "courses", title: "Cursos", desc: "Lições estruturadas, do zero até leres uma carta sozinho.", badge: "Em breve", href: "/courses" },
  ],
};

const RU: FeaturesMessages = {
  eyebrow: "Всё, что есть",
  title: "Все инструменты сайта",
  subtitle: "Начните с бесплатного. Каждая карточка открывает свою страницу.",
  sectionFree: "Бесплатно · после входа",
  sectionMid: "Недорого · $6.80",
  sectionHigh: "Премиум · от $66",
  cta: "Открыть",
  loginNote: "Для всех инструментов нужен вход; сами страницы открыты для просмотра.",
  freeNote: "Бесплатные инструменты не трогают баланс и не требуют платёжных данных.",
  items: [
    { key: "advisor", title: "ИИ-советник", desc: "Спросите обычными словами: модель выберет движок и объяснит карту.", badge: "Бесплатно", href: "/#advisor" },
    { key: "tarot", title: "Таро", desc: "Три карты о вашей ситуации: что мешает и что попробовать.", badge: "Бесплатно", href: "/tarot" },
    { key: "bagua", title: "И цзин", desc: "Шесть бросков монет на один вопрос и его развитие.", badge: "Бесплатно", href: "/bagua" },
    { key: "ziwei", title: "Цзы Вэй Доу Шу", desc: "Карта двенадцати дворцов: четырнадцать главных звёзд, превращения, декады.", badge: "Бесплатно", href: "/ziwei" },
    { key: "learn", title: "Библиотека знаний", desc: "Лекции и базовые понятия — чтобы судить обо всём остальном самому.", badge: "Бесплатно", href: "/learn" },
    { key: "bazi", title: "Разбор Бацзы", desc: "Отчёт на 900–1200 слов: карьера, деньги, отношения и сроки.", badge: "$6.80", href: "/bazi" },
    { key: "shop", title: "Талисманы", desc: "Шестнадцать талисманов киноварью, а также на заказ.", badge: "от $66", href: "/shop" },
    { key: "courses", title: "Курсы", desc: "Структурные уроки: с нуля до самостоятельного чтения карты.", badge: "Скоро", href: "/courses" },
  ],
};

const AR: FeaturesMessages = {
  eyebrow: "كل ما هو متاح",
  title: "جميع أدوات الموقع",
  subtitle: "ابدأ بالمجاني. كل بطاقة تفتح صفحتها الكاملة.",
  sectionFree: "مجاني · بعد تسجيل الدخول",
  sectionMid: "مدفوع بسيط · $6.80",
  sectionHigh: "متقدم · من $66",
  cta: "افتح",
  loginNote: "كل الأدوات تتطلب تسجيل الدخول، أما الصفحات فهي مفتوحة للتصفح.",
  freeNote: "الأدوات المجانية لا تخصم من رصيدك ولا تطلب بيانات دفع.",
  items: [
    { key: "advisor", title: "المستشار الذكي", desc: "اسأل بكلماتك العادية: يختار النموذج المحرك المناسب ويشرح الخريطة.", badge: "مجاني", href: "/#advisor" },
    { key: "tarot", title: "التاروت", desc: "ثلاث بطاقات لحالتك الآن: ما يعيقك وما يمكن تجربته.", badge: "مجاني", href: "/tarot" },
    { key: "bagua", title: "إي تشينغ", desc: "ست رميات عملة لسؤال واحد ومسار تطوره.", badge: "مجاني", href: "/bagua" },
    { key: "ziwei", title: "تسي وي دوشو", desc: "خريطة الأبراج الاثني عشر: أربعة عشر نجماً رئيسياً والتحولات والعقود.", badge: "مجاني", href: "/ziwei" },
    { key: "learn", title: "مكتبة المعرفة", desc: "محاضرات ومفاهيم أساسية لتحكم على الباقي بنفسك.", badge: "مجاني", href: "/learn" },
    { key: "bazi", title: "قراءة البازي", desc: "تقرير من 900 إلى 1200 كلمة: العمل والمال والعلاقات والتوقيت.", badge: "$6.80", href: "/bazi" },
    { key: "shop", title: "تمائم ورقية", desc: "ستة عشر تميمة زنجفر مرسومة يدويًا، مع إمكانية الطلب الخاص.", badge: "من $66", href: "/shop" },
    { key: "courses", title: "الدورات", desc: "دروس منظمة من الصفر حتى قراءة الخريطة بنفسك.", badge: "قريبًا", href: "/courses" },
  ],
};

const FEATURES: Record<Locale, FeaturesMessages> = {
  en: EN, zh: ZH, ja: JA, ko: KO, es: ES, fr: FR, de: DE, pt: PT, ru: RU, ar: AR,
};

export function getFeaturesMessages(locale: Locale): FeaturesMessages {
  return FEATURES[locale] || FEATURES.en;
}

/** 分组：按价格梯度（免费 / 微付费 / 重付费） */
export const FREE_KEYS = ["advisor", "tarot", "bagua", "ziwei", "learn"];
export const MID_KEYS = ["bazi"];
export const HIGH_KEYS = ["shop", "courses"];
