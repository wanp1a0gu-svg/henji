/**
 * 首页「玄学对话」助手 —— 10 语言文案。
 * 结构与用法：getChatMessages(locale) 返回 ChatMessages。
 */

import { Locale } from "./i18n";

export interface ChatMessages {
  eyebrow: string;
  title: string;
  subtitle: string;
  intro: string;
  skillsTitle: string;
  skillsHint: string;
  placeholder: string;
  send: string;
  thinking: string;
  you: string;
  assistant: string;
  clear: string;
  startOver: string;
  suggestions: string[];
  disclaimer: string;
  errorGeneric: string;
  poweredBy: string;
  cardBazi: string;
  cardTarot: string;
  cardBagua: string;
  catTitle: string;
  catIntro: string;
  catBubble: string;
  catPlaceholder: string;
}

const zh: ChatMessages = {
  eyebrow: "玄学对话",
  title: "和小痕聊聊",
  subtitle: "AI 顾问",
  intro:
    "直接说人话就行。助手已加载八字与塔罗两套能力，会自己判断该排盘、该抽牌，还是先陪你把话聊清楚。",
  skillsTitle: "已加载的能力",
  skillsHint: "无需选择，助手会自动调用",
  placeholder: "比如：帮我排个八字，1990年5月15日中午12点，男；或 最近很迷茫，抽三张牌看看",
  send: "发送",
  thinking: "正在推演…",
  you: "你",
  assistant: "痕迹",
  clear: "清空",
  startOver: "重新开始",
  suggestions: [
    "帮我排个八字，1990年5月15日中午12点，男",
    "最近工作很迷茫，抽三张牌看看方向",
    "八字和塔罗有什么区别？",
    "帮我算一卦，看看最近的事业运势",
    "帮我排个紫微斗数盘，1990年5月20日 10:30，男，北京",
  ],
  disclaimer:
    "本内容基于传统文化与西方占卜体系，仅供参考与娱乐（for cultural and entertainment purposes），不构成医疗、法律、投资或人生决策建议。请理性看待，路始终由自己走。",
  errorGeneric: "助手暂时无法回应，请稍后再试。",
  poweredBy: "由确定性排盘引擎与 AI 解读共同驱动",
  cardBazi: "八字排盘结果",
  cardTarot: "塔罗牌阵",
  cardBagua: "文王卦象",
  catTitle: "小痕 · 命理助手",
  catIntro: "你好，我是小痕。想聊点什么？",
  catBubble: "我是小痕，快来和我聊天！",
  catPlaceholder: "想说点什么？",
};

const en: ChatMessages = {
  eyebrow: "Oracle Chat",
  title: "Talk to Xiaohen",
  subtitle: "AI Advisor",
  intro:
    "Just speak naturally. Both the Bazi and Tarot skills are already loaded — the advisor decides on its own whether to cast a chart, draw cards, or simply talk it through with you first.",
  skillsTitle: "Loaded skills",
  skillsHint: "No need to choose — the advisor calls them automatically",
  placeholder: "e.g. Chart my Bazi: 1990-05-15 12:00, male — or Draw three cards about my career",
  send: "Send",
  thinking: "Deliberating…",
  you: "You",
  assistant: "Traces",
  clear: "Clear",
  startOver: "Start over",
  suggestions: [
    "Chart my Bazi: 1990-05-15 12:00, male",
    "I feel lost at work — draw three cards for direction",
    "What's the difference between Bazi and Tarot?",
    "Cast a hexagram for me about my career",
    "Cast my Zi Wei Dou Shu chart: 1990-05-20 10:30, male, Beijing",
  ],
  disclaimer:
    "This content draws on traditional Chinese destiny studies and Western divination for cultural and entertainment purposes only. It is not medical, legal, financial or life-decision advice. The path is yours to walk.",
  errorGeneric: "The advisor is unavailable right now. Please try again later.",
  poweredBy: "Powered by a deterministic charting engine plus AI interpretation",
  cardBazi: "Bazi chart",
  cardTarot: "Tarot spread",
  cardBagua: "Hexagram",
  catTitle: "Xiaohen · Fortune Guide",
  catIntro: "Hi, I'm Xiaohen. What would you like to know?",
  catBubble: "I'm Xiaohen — come chat with me!",
  catPlaceholder: "Say anything…",
};

const ja: ChatMessages = {
  eyebrow: "占いチャット",
  title: "小痕と話す",
  subtitle: "占いアドバイザー",
  intro:
    "自然な言葉でどうぞ。八字とタロットの二つの能力がすでに読み込まれており、助手が自分で判断して命盤を出したりカードを引いたりします。",
  skillsTitle: "読み込み済みの能力",
  skillsHint: "選択は不要、助手が自動で呼び出します",
  placeholder: "例：1990年5月15日12時、男性の八字を見てください／仕事のことで三枚引いてください",
  send: "送信",
  thinking: "鑑定中…",
  you: "あなた",
  assistant: "痕跡",
  clear: "クリア",
  startOver: "最初から",
  suggestions: [
    "1990年5月15日12時、男性の八字を見てください",
    "仕事に迷っています。三枚引いて方向性を見て",
    "八字とタロットの違いは何ですか？",
    "最近の仕事運を占ってください",
    "紫微斗数の命盤を出してください：1990年5月20日 10:30、男性、北京",
  ],
  disclaimer:
    "本内容は伝統文化と西洋占術に基づくもので、参考および娯楽目的（for cultural and entertainment purposes）に限られます。医療・法律・投資・人生の決断に関する助言ではありません。",
  errorGeneric: "ただいま応答できません。しばらくしてからお試しください。",
  poweredBy: "決定論的鑑定エンジンと AI 解読による",
  cardBazi: "八字命盤",
  cardTarot: "タロットスプレッド",
  cardBagua: "文王卦象",
  catTitle: "小痕・運命アシスタント",
  catIntro: "こんにちは、小痕です。何でも聞いてくださいね。",
  catBubble: "小痕です。おしゃべりしましょう！",
  catPlaceholder: "何でも聞いてください",
};

const ko: ChatMessages = {
  eyebrow: "운세 대화",
  title: "샤오헨과 대화하기",
  subtitle: "운세 상담사",
  intro:
    "편하게 말씀하세요. 사주와 타로 두 가지 능력이 이미 로드되어 있으며, 어드바이저가 스스로 판단해 명반을 세우거나 카드를 뽑습니다.",
  skillsTitle: "로드된 능력",
  skillsHint: "선택할 필요 없이 자동으로 호출됩니다",
  placeholder: "예: 1990년 5월 15일 12시 남성 사주를 봐주세요 / 진로가 막막한데 세 장 뽑아주세요",
  send: "보내기",
  thinking: "풀이 중…",
  you: "나",
  assistant: "흔적",
  clear: "지우기",
  startOver: "다시 시작",
  suggestions: [
    "1990년 5월 15일 12시 남성 사주를 봐주세요",
    "직장 고민이 있어요. 세 장 뽑아 방향을 봐주세요",
    "사주와 타로의 차이가 뭔가요?",
    "최근 사업운을 점쳐줘",
    "자미두수 명반을 뽑아주세요: 1990-05-20 10:30, 남성, 베이징",
  ],
  disclaimer:
    "본 내용은 전통 문화와 서양 점술에 기반한 참고 및 오락용(for cultural and entertainment purposes)이며, 의료·법률·투자·인생 결정에 대한 조언이 아닙니다.",
  errorGeneric: "지금은 응답할 수 없습니다. 잠시 후 다시 시도해 주세요.",
  poweredBy: "결정론적 명반 엔진과 AI 해석으로 구동",
  cardBazi: "사주 명반",
  cardTarot: "타로 배열",
  cardBagua: "문왕괘",
  catTitle: "샤오헨 · 운세 도우미",
  catIntro: "안녕하세요, 샤오헨이에요. 궁금한 것을 물어보세요.",
  catBubble: "샤오헨이에요. 같이 얘기해요!",
  catPlaceholder: "무엇이든 물어보세요",
};

const es: ChatMessages = {
  eyebrow: "Chat del oráculo",
  title: "Habla con Xiaohen",
  subtitle: "Asesor del oráculo",
  intro:
    "Habla con naturalidad. Las habilidades de Bazi y Tarot ya están cargadas: el asesor decide por sí mismo si traza una carta, extrae tarot o simplemente conversa contigo.",
  skillsTitle: "Habilidades cargadas",
  skillsHint: "No hace falta elegir — el asesor las invoca solo",
  placeholder: "Ej.: Traza mi Bazi: 1990-05-15 12:00, hombre — o extrae tres cartas sobre mi carrera",
  send: "Enviar",
  thinking: "Deliberando…",
  you: "Tú",
  assistant: "Traces",
  clear: "Limpiar",
  startOver: "Empezar de nuevo",
  suggestions: [
    "Traza mi Bazi: 1990-05-15 12:00, hombre",
    "Me siento perdido en el trabajo — extrae tres cartas",
    "¿Cuál es la diferencia entre Bazi y Tarot?",
    "Lanza un hexagrama sobre mi carrera",
    "Hazme una carta Zi Wei Dou Shu: 1990-05-20 10:30, hombre, Pekín",
  ],
  disclaimer:
    "Este contenido se basa en estudios tradicionales del destino y la adivinación occidental, solo con fines culturales y de entretenimiento (for cultural and entertainment purposes). No constituye asesoramiento médico, legal, financiero ni de vida.",
  errorGeneric: "El asesor no está disponible ahora. Inténtalo más tarde.",
  poweredBy: "Impulsado por un motor determinista y interpretación de IA",
  cardBazi: "Carta Bazi",
  cardTarot: "Tirada de tarot",
  cardBagua: "Hexagrama",
  catTitle: "Xiaohen · Guía de Fortuna",
  catIntro: "Hola, soy Xiaohen. ¿Qué te gustaría saber?",
  catBubble: "¡Soy Xiaohen, ven a charlar conmigo!",
  catPlaceholder: "Dime lo que quieras",
};

const fr: ChatMessages = {
  eyebrow: "Chat de l'oracle",
  title: "Parlez à Xiaohen",
  subtitle: "Conseiller de l'oracle",
  intro:
    "Parlez naturellement. Les compétences Bazi et Tarot sont déjà chargées : le conseiller décide seul s'il dresse une carte, tire des tarots ou échange d'abord avec vous.",
  skillsTitle: "Compétences chargées",
  skillsHint: "Aucun choix nécessaire — le conseiller les appelle seul",
  placeholder: "Ex. : Dresse mon Bazi : 1990-05-15 12h00, homme — ou tire trois cartes sur ma carrière",
  send: "Envoyer",
  thinking: "Délibération…",
  you: "Vous",
  assistant: "Traces",
  clear: "Effacer",
  startOver: "Recommencer",
  suggestions: [
    "Dresse mon Bazi : 1990-05-15 12h00, homme",
    "Je me sens perdu au travail — tire trois cartes",
    "Quelle est la différence entre Bazi et Tarot ?",
    "Tire un hexagramme sur ma carrière",
    "Dressez ma carte Zi Wei Dou Shu : 1990-05-20 10:30, homme, Pékin",
  ],
  disclaimer:
    "Ce contenu s'appuie sur les études traditionnelles du destin et la divination occidentale, à des fins culturelles et de divertissement uniquement (for cultural and entertainment purposes). Il ne constitue pas un conseil médical, juridique, financier ou de vie.",
  errorGeneric: "Le conseiller est indisponible. Réessayez plus tard.",
  poweredBy: "Propulsé par un moteur déterministe et une interprétation IA",
  cardBazi: "Carte Bazi",
  cardTarot: "Tirage de tarot",
  cardBagua: "Hexagramme",
  catTitle: "Xiaohen · Guide de Fortune",
  catIntro: "Bonjour, je suis Xiaohen. Que voulez-vous savoir ?",
  catBubble: "Je suis Xiaohen — venez discuter avec moi !",
  catPlaceholder: "Dites-moi ce que vous voulez",
};

const de: ChatMessages = {
  eyebrow: "Orakel-Chat",
  title: "Sprich mit Xiaohen",
  subtitle: "Orakel-Berater",
  intro:
    "Sprich einfach natürlich. Die Fähigkeiten Bazi und Tarot sind bereits geladen — der Berater entscheidet selbst, ob er ein Chart erstellt, Karten zieht oder zunächst mit dir spricht.",
  skillsTitle: "Geladene Fähigkeiten",
  skillsHint: "Keine Auswahl nötig — der Berater ruft sie selbst auf",
  placeholder: "z. B.: Erstelle mein Bazi: 1990-05-15 12:00, männlich — oder ziehe drei Karten zu meiner Karriere",
  send: "Senden",
  thinking: "Wird erwogen…",
  you: "Du",
  assistant: "Traces",
  clear: "Löschen",
  startOver: "Neu starten",
  suggestions: [
    "Erstelle mein Bazi: 1990-05-15 12:00, männlich",
    "Ich bin beruflich ratlos — ziehe drei Karten",
    "Was ist der Unterschied zwischen Bazi und Tarot?",
    "Wirf ein Hexagramm zu meiner Karriere",
    "Erstelle mein Zi-Wei-Dou-Shu-Horoskop: 1990-05-20 10:30, männlich, Peking",
  ],
  disclaimer:
    "Diese Inhalte beruhen auf traditioneller Schicksalskunde und westlicher Wahrsagerei, ausschließlich zu kulturellen und Unterhaltungszwecken (for cultural and entertainment purposes). Sie sind keine medizinische, rechtliche, finanzielle oder Lebensberatung.",
  errorGeneric: "Der Berater ist derzeit nicht verfügbar. Bitte später erneut versuchen.",
  poweredBy: "Angetrieben von einer deterministischen Engine und KI-Deutung",
  cardBazi: "Bazi-Chart",
  cardTarot: "Tarot-Legung",
  cardBagua: "Hexagramm",
  catTitle: "Xiaohen · Schicksalsberater",
  catIntro: "Hallo, ich bin Xiaohen. Was möchtest du wissen?",
  catBubble: "Ich bin Xiaohen – komm, plaudere mit mir!",
  catPlaceholder: "Frag mich einfach",
};

const pt: ChatMessages = {
  eyebrow: "Chat do oráculo",
  title: "Fala com o Xiaohen",
  subtitle: "Consultor do oráculo",
  intro:
    "Fale naturalmente. As habilidades de Bazi e Tarô já estão carregadas — o conselheiro decide sozinho se traça um mapa, tira cartas ou apenas conversa com você.",
  skillsTitle: "Habilidades carregadas",
  skillsHint: "Não precisa escolher — o conselheiro as chama sozinho",
  placeholder: "Ex.: Traça meu Bazi: 1990-05-15 12:00, homem — ou tire três cartas sobre minha carreira",
  send: "Enviar",
  thinking: "Deliberando…",
  you: "Você",
  assistant: "Traces",
  clear: "Limpar",
  startOver: "Recomeçar",
  suggestions: [
    "Traça meu Bazi: 1990-05-15 12:00, homem",
    "Estou perdido no trabalho — tire três cartas",
    "Qual a diferença entre Bazi e Tarô?",
    "Lance um hexagrama sobre minha carreira",
    "Faça minha carta Zi Wei Dou Shu: 1990-05-20 10:30, homem, Pequim",
  ],
  disclaimer:
    "Este conteúdo baseia-se em estudos tradicionais do destino e adivinhação ocidental, apenas para fins culturais e de entretenimento (for cultural and entertainment purposes). Não constitui aconselhamento médico, jurídico, financeiro ou de vida.",
  errorGeneric: "O conselheiro está indisponível. Tente novamente mais tarde.",
  poweredBy: "Impulsionado por um motor determinístico e interpretação de IA",
  cardBazi: "Mapa Bazi",
  cardTarot: "Tiragem de tarô",
  cardBagua: "Hexagrama",
  catTitle: "Xiaohen · Guia de Fortuna",
  catIntro: "Olá, sou Xiaohen. O que você quer saber?",
  catBubble: "Sou o Xiaohen — venha conversar comigo!",
  catPlaceholder: "Diz o que quiseres",
};

const ru: ChatMessages = {
  eyebrow: "Чат с оракулом",
  title: "Поговорите с Сяо Хэнем",
  subtitle: "Консультант-оракул",
  intro:
    "Говорите свободно. Навыки Бацзы и Таро уже загружены — советник сам решит, составить карту, вытянуть карты или сначала просто поговорить с вами.",
  skillsTitle: "Загруженные навыки",
  skillsHint: "Выбирать не нужно — советник вызывает их сам",
  placeholder: "Напр.: Составь мою Бацзы: 1990-05-15 12:00, мужчина — или вытяни три карты о карьере",
  send: "Отправить",
  thinking: "Размышляю…",
  you: "Вы",
  assistant: "Traces",
  clear: "Очистить",
  startOver: "Начать заново",
  suggestions: [
    "Составь мою Бацзы: 1990-05-15 12:00, мужчина",
    "Я запутался в работе — вытяни три карты",
    "В чём разница между Бацзы и Таро?",
    "Брось гексаграмму о моей карьере",
    "Постройте мою карту Цзы Вэй Доу Шу: 1990-05-20 10:30, мужчина, Пекин",
  ],
  disclaimer:
    "Этот контент основан на традиционных учениях о судьбе и западных гаданиях исключительно в культурных и развлекательных целях (for cultural and entertainment purposes). Он не является медицинским, юридическим, финансовым или жизненным советом.",
  errorGeneric: "Советник сейчас недоступен. Попробуйте позже.",
  poweredBy: "На основе детерминированного движка и интерпретации ИИ",
  cardBazi: "Карта Бацзы",
  cardTarot: "Расклад Таро",
  cardBagua: "Гексаграмма",
  catTitle: "Сяохэнь · Гид судьбы",
  catIntro: "Привет, я Сяохэнь. Спрашивайте о чём угодно.",
  catBubble: "Я Сяохэнь — давайте поболтаем!",
  catPlaceholder: "Спросите что угодно",
};

const ar: ChatMessages = {
  eyebrow: "محادثة العرّاف",
  title: "تحدّث مع شياوهن",
  subtitle: "مستشار العرافة",
  intro:
    "تحدّث بعفوية. مهارتا البازي والتاروت محمّلتان مسبقًا — يقرّر المستشار بنفسه إن كان سيرسم مخططًا أو يسحب بطاقات أو يتحاور معك أولًا.",
  skillsTitle: "المهارات المحمّلة",
  skillsHint: "لا حاجة للاختيار — يستدعيها المستشار تلقائيًا",
  placeholder: "مثال: ارسم مخطط البازي: 1990-05-15 12:00، ذكر — أو اسحب ثلاث بطاقات عن مسيرتي",
  send: "إرسال",
  thinking: "جارٍ التأمل…",
  you: "أنت",
  assistant: "آثار",
  clear: "مسح",
  startOver: "البدء من جديد",
  suggestions: [
    "ارسم مخطط البازي: 1990-05-15 12:00، ذكر",
    "أشعر بالضياع في عملي — اسحب ثلاث بطاقات",
    "ما الفرق بين البازي والتاروت؟",
    "ارمِ سداسية عن مسيرتي المهنية",
    "ارسم لي خريطة تسي وي دوشو: 1990-05-20 10:30، ذكر، بكين",
  ],
  disclaimer:
    "يستند هذا المحتوى إلى الدراسات التقليدية للمصير والعرافة الغربية لأغراض ثقافية وترفيهية فقط. وهو ليس نصيحة طبية أو قانونية أو مالية أو قرارًا حياتيًا.",
  errorGeneric: "المستشار غير متاح الآن. يرجى المحاولة لاحقًا.",
  poweredBy: "مدعوم بمحرّك حسابي حتمي وتفسير بالذكاء الاصطناعي",
  cardBazi: "مخطط البازي",
  cardTarot: "نشر التاروت",
  cardBagua: "السداسية",
  catTitle: "شياوهن · مرشد الحظ",
  catIntro: "مرحباً، أنا شياوهن. اسألني ما تشاء.",
  catBubble: "أنا شياوهن — تعال تحدّث معي!",
  catPlaceholder: "اسأل ما تشاء",
};

const ALL: Record<Locale, ChatMessages> = { en, zh, ja, ko, es, fr, de, pt, ru, ar };

export function getChatMessages(locale: Locale): ChatMessages {
  return ALL[locale] || ALL.en;
}
