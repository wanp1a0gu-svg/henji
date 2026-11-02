import { Locale } from "./i18n";

/** 「命理知识」页面文案（10 语言）。 */

export interface LearnMessages {
  eyebrow: string;
  title: string;
  subtitle: string;
  videoNote: string;
  aboutTitle: string;
  aboutText: string;
  pointsTitle: string;
  points: string[];
  ctaTitle: string;
  ctaBazi: string;
  ctaTarot: string;
  ctaMore: string;
}

const LEARN: Record<Locale, LearnMessages> = {
  en: {
    eyebrow: "Learn",
    title: "An Introduction to Chinese Bazi Studies",
    subtitle:
      "A lecture by Prof. Wang Defeng (Fudan University) — understand the basic concepts of Chinese fate studies, its philosophical roots, and the wisdom of \"knowing one's destiny.\"",
    videoNote: "Lecture recording · Chinese & English subtitles · ~24 min",
    aboutTitle: "About the Lecturer",
    aboutText:
      "Wang Defeng is a professor at the School of Philosophy, Fudan University. Known for lectures that bridge Chinese and Western thought, he is affectionately called the \"Prince of Philosophy\" by his students.",
    pointsTitle: "What You Will Learn",
    points: [
      "What \"fate studies\" is: how ancient Chinese understood ming (命) and yun (运)",
      "Confucius and \"knowing destiny\": the Confucian view of fate",
      "The philosophical foundations behind Bazi reasoning",
      "How to approach fate studies today: culture, reflection and personal choice",
    ],
    ctaTitle: "After the Lecture, Try It Yourself",
    ctaBazi: "Bazi Reading",
    ctaTarot: "Tarot Reading",
    ctaMore: "Open the knowledge library",
  },
  zh: {
    eyebrow: "命理知识",
    title: "中国古代命理学 · 概述",
    subtitle:
      "复旦大学王德峰教授讲座——从哲学视角理解中国命理学的基本概念、思想渊源，以及「知命」的智慧。",
    videoNote: "讲座录像 · 中英文字幕 · 约 24 分钟",
    aboutTitle: "关于讲师",
    aboutText:
      "王德峰，复旦大学哲学学院教授，长期从事哲学与中国传统文化研究，讲课贯通中西、深入浅出，被学生誉为「哲学王子」。",
    pointsTitle: "讲座内容",
    points: [
      "什么是命理学：中国古人对「命」与「运」的理解",
      "孔子与「知命」：儒家如何看待命运",
      "八字命理背后的哲学根基与思维方式",
      "现代人如何理性看待命理文化：文化、反思与选择",
    ],
    ctaTitle: "看完讲座，亲身体验一下",
    ctaBazi: "八字测算",
    ctaTarot: "塔罗占卜",
    ctaMore: "去知识库看完整讲座",
  },
  ja: {
    eyebrow: "学び",
    title: "中国古代命理学入門",
    subtitle:
      "復旦大学・王徳峰教授の講義——中国命理学の基本概念、思想的ルーツ、そして「命を知る」智慧を哲学の視点から理解します。",
    videoNote: "講義録画 · 中国語・英語字幕 · 約24分",
    aboutTitle: "講師について",
    aboutText:
      "王徳峰（ワン・ドゥフォン）——復旦大学哲学学院教授。東洋と西洋の思想を架橋する講義で人気を集め、学生から「哲学の王子」と呼ばれています。",
    pointsTitle: "講義の内容",
    points: [
      "命理学とは何か：「命」と「運」への古人の理解",
      "孔子と「命を知る」：儒家の運命観",
      "八字命理の思想的基盤と思考法",
      "現代人が命理文化とどう向き合うか：文化・内省・選択",
    ],
    ctaTitle: "講義を見たら、体験してみましょう",
    ctaBazi: "八字鑑定",
    ctaTarot: "タロット占い",
    ctaMore: "知識ライブラリで見る",
  },
  ko: {
    eyebrow: "배움",
    title: "중국 고대 명리학 입문",
    subtitle:
      "푸단대학 왕더펑 교수 강연 — 중국 명리학의 기본 개념과 사상적 뿌리, 그리고 '명을 아는 지혜'를 철학적 관점에서 이해합니다.",
    videoNote: "강연 영상 · 중영어 자막 · 약 24분",
    aboutTitle: "강연자 소개",
    aboutText:
      "왕더펑 — 푸단대학 철학과 교수. 동서양을 넘나드는 강의로 학생들에게 '철학의 왕자'라 불립니다.",
    pointsTitle: "강연 내용",
    points: [
      "명리학이란 무엇인가: '명(命)'과 '운(運)'에 대한 고대인의 이해",
      "공자와 '명을 앎': 유가의 운명관",
      "사주 명리의 사상적 기초와 사고방식",
      "현대인이 명리 문화를 대하는 법: 문화, 성찰, 선택",
    ],
    ctaTitle: "강연을 봤다면, 직접 체험해 보세요",
    ctaBazi: "사주 분석",
    ctaTarot: "타로 리딩",
    ctaMore: "지식 라이브러리에서 보기",
  },
  es: {
    eyebrow: "Aprender",
    title: "Introducción al Estudio del Bazi Chino",
    subtitle:
      "Conferencia del Prof. Wang Defeng (Universidad de Fudan) — comprende los conceptos básicos del estudio del destino chino, sus raíces filosóficas y la sabiduría de «conocer el propio destino».",
    videoNote: "Grabación de conferencia · Subtítulos en chino e inglés · ~24 min",
    aboutTitle: "Sobre el profesor",
    aboutText:
      "Wang Defeng es profesor de la Facultad de Filosofía de la Universidad de Fudan. Conocido por conferencias que unen el pensamiento chino y occidental, sus estudiantes lo llaman el «Príncipe de la Filosofía».",
    pointsTitle: "Lo que aprenderás",
    points: [
      "Qué es el estudio del destino: cómo los antiguos chinos entendían el ming (命) y el yun (运)",
      "Confucio y «conocer el destino»: la visión confuciana del hado",
      "Los fundamentos filosóficos del razonamiento Bazi",
      "Cómo acercarse hoy: cultura, reflexión y elección personal",
    ],
    ctaTitle: "Después de la conferencia, pruébalo tú mismo",
    ctaBazi: "Lectura Bazi",
    ctaTarot: "Tarot",
    ctaMore: "Abrir la biblioteca",
  },
  fr: {
    eyebrow: "Apprendre",
    title: "Introduction à l'étude du Bazi chinois",
    subtitle:
      "Conférence du Pr. Wang Defeng (Université Fudan) — comprendre les concepts de base de l'étude du destin en Chine, ses racines philosophiques et la sagesse de « connaître son destin ».",
    videoNote: "Enregistrement de conférence · Sous-titres chinois et anglais · ~24 min",
    aboutTitle: "À propos du conférencier",
    aboutText:
      "Wang Defeng est professeur à la Faculté de philosophie de l'Université Fudan. Ses cours, qui relient pensée chinoise et occidentale, lui ont valu le surnom de « Prince de la philosophie ».",
    pointsTitle: "Au programme",
    points: [
      "Qu'est-ce que l'étude du destin : la compréhension ancienne du ming (命) et du yun (运)",
      "Confucius et « connaître le destin » : la vision confucéenne",
      "Les fondements philosophiques du raisonnement Bazi",
      "Comment aborder cette culture aujourd'hui : culture, réflexion et choix personnel",
    ],
    ctaTitle: "Après la conférence, essayez vous-même",
    ctaBazi: "Lecture Bazi",
    ctaTarot: "Tarot",
    ctaMore: "Ouvrir la bibliothèque",
  },
  de: {
    eyebrow: "Wissen",
    title: "Einführung in die chinesische Bazi-Lehre",
    subtitle:
      "Ein Vortrag von Prof. Wang Defeng (Fudan-Universität) — Grundbegriffe der chinesischen Schicksalslehre, ihre philosophischen Wurzeln und die Weisheit des «Erkennens des eigenen Schicksals».",
    videoNote: "Vortragsaufzeichnung · Chinesische & englische Untertitel · ca. 24 Min.",
    aboutTitle: "Über den Referenten",
    aboutText:
      "Wang Defeng ist Professor an der Philosophischen Fakultät der Fudan-Universität. Seine Vorlesungen verbinden chinesisches und westliches Denken — Studierende nennen ihn den «Prinzen der Philosophie».",
    pointsTitle: "Inhalte des Vortrags",
    points: [
      "Was Schicksalslehre ist: das alte Verständnis von ming (命) und yun (运)",
      "Konfuzius und das «Erkennen des Schicksals»: die konfuzianische Sicht",
      "Die philosophischen Grundlagen der Bazi-Deutung",
      "Wie man dieser Kultur heute begegnet: Kultur, Reflexion, eigene Wahl",
    ],
    ctaTitle: "Nach dem Vortrag: selbst ausprobieren",
    ctaBazi: "Bazi-Lesung",
    ctaTarot: "Tarot",
    ctaMore: "Zur Wissensbibliothek",
  },
  pt: {
    eyebrow: "Aprender",
    title: "Introdução ao Estudo do Bazi Chinês",
    subtitle:
      "Palestra do Prof. Wang Defeng (Universidade Fudan) — entenda os conceitos básicos do estudo do destino chinês, suas raízes filosóficas e a sabedoria de «conhecer o próprio destino».",
    videoNote: "Gravação da palestra · Legendas em chinês e inglês · ~24 min",
    aboutTitle: "Sobre o palestrante",
    aboutText:
      "Wang Defeng é professor da Faculdade de Filosofia da Universidade Fudan. Conhecido por palestras que unem o pensamento chinês e ocidental, é chamado pelos alunos de «Príncipe da Filosofia».",
    pointsTitle: "O que você vai aprender",
    points: [
      "O que é o estudo do destino: como os antigos chineses entendiam ming (命) e yun (运)",
      "Confúcio e «conhecer o destino»: a visão confuciana",
      "Os fundamentos filosóficos da leitura Bazi",
      "Como encarar essa cultura hoje: cultura, reflexão e escolha pessoal",
    ],
    ctaTitle: "Depois da palestra, experimente você mesmo",
    ctaBazi: "Leitura Bazi",
    ctaTarot: "Tarot",
    ctaMore: "Abrir a biblioteca",
  },
  ru: {
    eyebrow: "Знания",
    title: "Введение в китайскую науку Бацзы",
    subtitle:
      "Лекция профессора Ван Дэфэна (Университет Фудань) — основные понятия китайского учения о судьбе, его философские корни и мудрость «знания своей судьбы».",
    videoNote: "Запись лекции · Китайские и английские субтитры · ~24 мин",
    aboutTitle: "О лекторе",
    aboutText:
      "Ван Дэфэн — профессор философского факультета Университета Фудань. Его лекции соединяют китайскую и западную мысль; студенты называют его «принцем философии».",
    pointsTitle: "Содержание лекции",
    points: [
      "Что такое учение о судьбе: как древние китайцы понимали мин (命) и юнь (运)",
      "Конфуций и «знание судьбы»: конфуцианский взгляд",
      "Философские основы толкования Бацзы",
      "Как относиться к этой культуре сегодня: культура, размышление, выбор",
    ],
    ctaTitle: "После лекции попробуйте сами",
    ctaBazi: "Чтение Бацзы",
    ctaTarot: "Таро",
    ctaMore: "Открыть библиотеку знаний",
  },
  ar: {
    eyebrow: "تعلّم",
    title: "مقدمة في علم البازي الصيني",
    subtitle:
      "محاضرة للأستاذ وانغ ديفنغ (جامعة فودان) — فهم المفاهيم الأساسية لعلم المصير الصيني وجذوره الفلسفية وحكمة «معرفة القدر».",
    videoNote: "تسجيل المحاضرة · ترجمة بالصينية والإنجليزية · حوالي 24 دقيقة",
    aboutTitle: "عن المحاضر",
    aboutText:
      "وانغ ديفنغ أستاذ في كلية الفلسفة بجامعة فودان. تُعرف محاضراته بالجمع بين الفكر الصيني والغربي، ويلقبه طلابه بـ «أمير الفلسفة».",
    pointsTitle: "محتوى المحاضرة",
    points: [
      "ما هو علم المصير: فهم القدماء الصينيين لـ«مينغ» (命) و«يون» (运)",
      "كونفوشيوس و«معرفة القدر»: النظرة الكونفوشية",
      "الأساس الفلسفي وراء تفسير البازي",
      "كيف نتعامل مع هذه الثقافة اليوم: ثقافة وتأمل واختيار",
    ],
    ctaTitle: "بعد المحاضرة، جرّب بنفسك",
    ctaBazi: "قراءة البازي",
    ctaTarot: "قراءة التاروت",
    ctaMore: "افتح مكتبة المعرفة",
  },
};

export function getLearnMessages(locale: Locale): LearnMessages {
  return LEARN[locale] || LEARN.en;
}
