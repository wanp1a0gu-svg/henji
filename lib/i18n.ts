export type Locale = 'en' | 'zh' | 'ja' | 'ko' | 'es' | 'fr' | 'de' | 'pt' | 'ru' | 'ar';
export type Messages = any;

export const locales: Locale[] = ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'pt', 'ru', 'ar'];
export const defaultLocale: Locale = 'en';

export const labels: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  ru: 'Русский',
  ar: 'العربية',
};

const messages: Record<Locale, any> = {
  en: {
    nav: { home: "Home", advisor: "Advisor", courses: "Courses", shop: "Shop", bazi: "Bazi Reading", tarot: "Tarot Reading", bagua: "I Ching", learn: "Learn", about: "About" },
    hero: {
      eyebrow: "Eastern Wisdom Meets Modern Life",
      title: "Traces",
      subtitle: "Discover your life path through ancient Chinese metaphysics. Courses, readings, and personal guidance for the modern seeker.",
      ctaCourses: "Explore Courses",
      ctaReading: "Book a Reading"
    },
    stats: { years: "Years of Study", students: "Students Served", readings: "Readings Delivered" },
    features: {
      subtitle: "Why Traces",
      title: "Guidance for Modern Life",
      personal: { title: "Personalized", desc: "Every reading is tailored to your unique birth chart, not a generic horoscope." },
      wisdom: { title: "Ancient Wisdom", desc: "Rooted in classical Chinese metaphysics: Bazi, Five Elements, and Ten Gods." },
      clarity: { title: "Clear Direction", desc: "Get practical insights on career, relationships, wealth, and life timing." }
    },
    courses: {
      title: "Courses",
      subtitle: "Learn at your own pace",
      intro: "Structured programs that take you from curious beginner to confident interpreter of Chinese destiny science.",
      viewAll: "View all courses",
      detail: "Details",
      items: [
        { title: "Bazi Fundamentals", desc: "Master the ten heavenly stems, twelve earthly branches, and the five elements in 8 lessons.", price: "$49" },
        { title: "Relationship Compatibility", desc: "Understand love, marriage, and partnership through the lens of Chinese astrology.", price: "$79" },
        { title: "Career & Wealth Destiny", desc: "Read your chart for career direction, wealth timing, and life opportunities.", price: "$99" }
      ],
      highlights: { video: "HD Video Lessons", lifetime: "Lifetime Access", community: "Private Community" },
      lessons: "lessons",
      certificate: "Certificate",
      enroll: "Enroll Now"
    },
    cta: {
      title: "Ready to understand your destiny?",
      subtitle: "Book a personal Bazi reading and receive a detailed report written just for you.",
      button: "Get Your Reading"
    },
    bazi: {
      title: "Personal Bazi Reading",
      subtitle: "A detailed report written just for you",
      intro: "Provide your birth date and time. Our system combines classical Chinese metaphysics with modern AI to craft your personal reading.",
      formTitle: "Your Birth Information",
      formSubtitle: "All fields are kept strictly confidential",
      name: "Your Name",
      namePlaceholder: "How should we address you?",
      birthDate: "Birth Date",
      birthTime: "Birth Time",
      birthPlace: "Birth Place",
      birthPlacePlaceholder: "e.g. Dandong, Liaoning / Beijing / New York",
      birthPlaceTip: "Used for true solar time correction (longitude difference + equation of time) to improve the accuracy of the hour pillar.",
      gender: "Gender",
      male: "Male",
      female: "Female",
      focus: "What would you like to focus on?",
      focusGeneral: "General Life Reading",
      focusCareer: "Career & Wealth",
      focusLove: "Love & Marriage",
      focusWealth: "Wealth Timing",
      focusHealth: "Health & Wellness",
      price: "$68",
      priceLabel: "Personal reading",
      submit: "Generate My Reading",
      generating: "Analyzing your chart...",
      required: "Please enter your birth date and select gender.",
      error: "Could not generate reading. Please try again.",
      reportTitle: "Your Bazi Reading",
      reset: "Start Over",
      includes: {
        report: "Detailed PDF-style written report",
        time: "Delivered within 48 hours",
        privacy: "Strict confidentiality guaranteed"
      },
      secureNote: "Secure checkout via PayPal",
      disclaimer: "For cultural interest and entertainment only — not medical, legal, or financial advice.",
      note: "Secure checkout via PayPal. All readings are confidential."
    },
    paypal: { success: "Payment successful! We will send your reading to your PayPal email.", error: "Payment could not be completed. Please try again." },
    footer: { copyright: "© 2026 Traces. All rights reserved.", tagline: "Guidance rooted in tradition, delivered with care." }
  },
  zh: {
    nav: { home: "首页", advisor: "对话", courses: "课程", shop: "商店", bazi: "八字测算", tarot: "塔罗占卜", bagua: "文王卦", learn: "命理知识", about: "关于" },
    hero: {
      eyebrow: "东方智慧，现代生活",
      title: "痕迹",
      subtitle: "通过古老的中国命理学，发现属于你的人生路径。课程、测算、个人指引，为现代探索者而生。",
      ctaCourses: "浏览课程",
      ctaReading: "预约测算"
    },
    stats: { years: "年研习", students: "服务学员", readings: "完成测算" },
    features: {
      subtitle: "为什么选择痕迹",
      title: "为现代生活提供指引",
      personal: { title: "专属定制", desc: "每一次测算都基于你的独特命盘，而非通用星座运势。" },
      wisdom: { title: "古老智慧", desc: "根植于中国古典命理：八字、五行、十神体系。" },
      clarity: { title: "清晰方向", desc: "在事业、感情、财运与人生时机上获得切实可行的洞见。" }
    },
    courses: {
      title: "精品课程",
      subtitle: "按自己的节奏学习",
      intro: "系统化的课程体系，带你从好奇入门到自信解读命理科学。",
      viewAll: "查看全部课程",
      detail: "详情",
      items: [
        { title: "八字入门", desc: "掌握十天干、十二地支与五行生克，8节课建立系统框架。", price: "$49" },
        { title: "感情合婚", desc: "从命理角度理解爱情、婚姻与亲密关系。", price: "$79" },
        { title: "事业财运", desc: "解读命局中的事业方向、财富时机与人生机遇。", price: "$99" }
      ],
      highlights: { video: "高清视频课", lifetime: "终身访问", community: "私密社群" },
      lessons: "节课",
      certificate: "结业证书",
      enroll: "立即报名"
    },
    cta: {
      title: "准备好了解自己的命运了吗？",
      subtitle: "预约个人八字测算，获取专为你撰写的详细命盘报告。",
      button: "获取我的测算"
    },
    bazi: {
      title: "八字个人测算",
      subtitle: "为你量身撰写的详细命盘报告",
      intro: "提供你的出生年月日时，我们结合中国古典命理与现代 AI，为你生成专属解读。",
      formTitle: "出生信息",
      formSubtitle: "所有信息严格保密",
      name: "你的姓名",
      namePlaceholder: "希望我们怎么称呼你？",
      birthDate: "出生日期",
      birthTime: "出生时间",
      birthPlace: "出生地",
      birthPlacePlaceholder: "如：辽宁省丹东市 / 北京 / New York",
      birthPlaceTip: "用于真太阳时校正（经度差 + 均时差），可显著提高时柱准确度。",
      gender: "性别",
      male: "男",
      female: "女",
      focus: "你最想了解的方面？",
      focusGeneral: "综合运势",
      focusCareer: "事业财运",
      focusLove: "感情婚姻",
      focusWealth: "财富时机",
      focusHealth: "健康养生",
      price: "$68",
      priceLabel: "个人测算",
      submit: "生成我的测算",
      generating: "正在分析命盘...",
      required: "请填写出生日期并选择性别。",
      error: "测算生成失败，请重试。",
      reportTitle: "你的八字测算",
      reset: "重新开始",
      includes: {
        report: "详细的 PDF 式书面报告",
        time: "48 小时内交付",
        privacy: "严格保密"
      },
      secureNote: "通过 PayPal 安全支付",
      disclaimer: "仅供文化参考与娱乐用途，不构成医疗、法律或金融建议。",
      note: "通过 PayPal 安全支付。所有测算内容严格保密。"
    },
    paypal: { success: "支付成功！我们会将报告发送到你的 PayPal 邮箱。", error: "支付未完成，请重试。" },
    footer: { copyright: "© 2026 痕迹 · 保留所有权利。", tagline: "根植传统，用心传递。" }
  },
  ja: {
    nav: { home: "ホーム", advisor: "対話", courses: "講座", shop: "ショップ", bazi: "八字鑑定", tarot: "タロット占い", bagua: "文王卦", learn: "学び", about: "概要" },
    hero: { eyebrow: "東洋の叡智と現代生活", title: "Traces", subtitle: "古代中国の命理学を通じて、あなた自身の人生の道を見つけましょう。", ctaCourses: "講座を見る", ctaReading: "鑑定を予約" },
    stats: { years: "研究年数", students: "受講生", readings: "鑑定数" },
    features: {
      subtitle: "なぜ Traces か",
      title: "現代生活への指針",
      personal: { title: "パーソナライズ", desc: "一般的な占いではなく、あなただけの命式に基づいた鑑定。" },
      wisdom: { title: "古代の叡智", desc: "八字、五行、十神を軸とした中国古典命理学に根ざしています。" },
      clarity: { title: "明確な方向性", desc: "キャリア、人間関係、財運、人生のタイミングに実用的な洞察を。" }
    },
    courses: { title: "講座", subtitle: "自分のペースで学ぶ", intro: "好奇心旺盛な初心者から自信を持って命式を読めるようになるまで。", viewAll: "すべての講座", detail: "詳細", items: [
      { title: "八字入門", desc: "十天干・十二支・五行をマスターする8回レッスン。", price: "$49" },
      { title: "相性鑑定", desc: "中国占星術の視点から恋愛・結婚・パートナーシップを理解する。", price: "$79" },
      { title: "事業運・財運", desc: "命式から適職・金運のタイミング・人生の機会を読み解く。", price: "$99" }
    ], highlights: { video: "HD動画レッスン", lifetime: "生涯アクセス", community: "プライベートコミュニティ" }, lessons: "レッスン", certificate: "修了証", enroll: "今すぐ受講" },
    cta: { title: "運命を理解する準備はできましたか？", subtitle: "パーソナル八字鑑定を予約し、あなただけの詳細レポートを受け取りましょう。", button: "鑑定を予約" },
    bazi: { title: "個人八字鑑定", subtitle: "あなただけの詳細レポート", intro: "生年月日時を入力すると、中国古典命理学と現代AIを組み合わせた鑑定を生成します。", formTitle: "出生情報", formSubtitle: "すべての情報は厳密に管理されます", name: "お名前", namePlaceholder: "お名前を入力してください", birthDate: "生年月日", birthTime: "出生時刻", birthPlace: "出生地", birthPlacePlaceholder: "例：遼寧省丹東市／北京／東京", birthPlaceTip: "真太陽時補正（経度差＋均時差）に使用し、時柱の精度を高めます。", gender: "性別", male: "男性", female: "女性", focus: "特に知りたいことは？", focusGeneral: "総合運", focusCareer: "仕事・財運", focusLove: "恋愛・結婚", focusWealth: "財運のタイミング", focusHealth: "健康", price: "$68", priceLabel: "個人鑑定", submit: "鑑定を生成", generating: "命式を分析中...", required: "生年月日と性別を入力してください。", error: "鑑定の生成に失敗しました。もう一度お試しください。", reportTitle: "あなたの八字鑑定", reset: "最初から", includes: { report: "詳細なPDF形式の書面レポート", time: "48時間以内に配信", privacy: "厳重な秘密保持" }, secureNote: "PayPalで安全に決済", disclaimer: "文化・娯楽目的のみ。医療・法律・金融のアドバイスではありません。", note: "PayPal で安全に決済。すべての鑑定内容は厳密に守られます。" },
    paypal: { success: "お支払いが完了しました。PDFレポートをメールでお送りします。", error: "お支払いに失敗しました。もう一度お試しください。" },
    footer: { copyright: "© 2026 Traces. All rights reserved.", tagline: "伝統に根ざし、真心を込めて。" }
  },
  ko: {
    nav: { home: "홈", advisor: "대화", courses: "강의", shop: "상점", bazi: "사주 분석", tarot: "타로 리딩", bagua: "주역", learn: "배움", about: "소개" },
    hero: { eyebrow: "동양의 지혜와 현대 생활", title: "Traces", subtitle: "고대 중국 명리학을 통해 당신만의 인생 길을 발견하세요.", ctaCourses: "강의 둘러보기", ctaReading: "분석 예약" },
    stats: { years: "연구 기간", students: "수강생", readings: "분석 완료" },
    features: { subtitle: "Traces를 선택하는 이유", title: "현대 생활을 위한 안내", personal: { title: "맞춤형", desc: "일반적인 운세가 아닌 당신만의 사주를 바탕으로 합니다." }, wisdom: { title: "고대의 지혜", desc: "사주, 오행, 십신을 중심으로 한 중국 고전 명리학." }, clarity: { title: "명확한 방향", desc: "직업, 인간관계, 재물, 인생 시기에 실용적인 통찰을 드립니다." } },
    courses: { title: "강의", subtitle: "나만의 속도로 배우기", intro: "호기심 많은 초보자에서 자신 있게 사주를 해석할 수 있도록。", viewAll: "모든 강의 보기", detail: "자세히", items: [
      { title: "사주 기초", desc: "10천간, 12지지, 오행을 마스터하는 8개 레슨.", price: "$49" },
      { title: "연애 궁합", desc: "중국 점성술로 사랑, 결혼, 관계를 이해합니다.", price: "$79" },
      { title: "직업운·재물운", desc: "사주로 직업 방향과 재물 시기를 풀이합니다.", price: "$99" }
    ], highlights: { video: "HD 동영상 강의", lifetime: "평생 접근", community: "비공개 커뮤니티" }, lessons: "레슨", certificate: "수료증", enroll: "수강하기" },
    cta: { title: "울명을 이해할 준비가 되셨나요?", subtitle: "개인 사주 분석을 예약하고 당신만의 상세 보고서를 받아보세요.", button: "분석 받기" },
    bazi: { title: "개인 사주 분석", subtitle: "당신만을 위한 상세 보고서", intro: "생년월일시를 입력하면 중국 고전 명리학과 현대 AI를 결합한 분석을 생성합니다.", formTitle: "출생 정보", formSubtitle: "모든 정보는 엄격히 보호됩니다", name: "이름", namePlaceholder: "이름을 입력하세요", birthDate: "생년월일", birthTime: "출생 시간", birthPlace: "출생지", birthPlacePlaceholder: "예: 랴오닝성 단둥시 / 베이징 / 서울", birthPlaceTip: "진태양시 보정(경도차 + 균시차)에 사용되어 시주 정확도를 높입니다.", gender: "성별", male: "남성", female: "여성", focus: "가장 궁금한 부분은?", focusGeneral: "종합 운세", focusCareer: "직업·재물", focusLove: "연애·결혼", focusWealth: "재물 시기", focusHealth: "건강", price: "$68", priceLabel: "개인 분석", submit: "분석 생성", generating: "사주를 분석 중...", required: "생년월일과 성별을 입력해 주세요.", error: "분석 생성에 실패했습니다. 다시 시도해 주세요.", reportTitle: "당신의 사주 분석", reset: "다시 시작", includes: { report: "상세한 PDF 형식의 보고서", time: "48시간 이내 전달", privacy: "엄격한 비밀 보장" }, secureNote: "PayPal로 안전하게 결제", disclaimer: "문화 및 오락 목적 전용이며, 의료·법률·금융 조언이 아닙니다.", note: "PayPal로 안전하게 결제됩니다. 모든 분석 내용은 비밀 유지됩니다." },
    paypal: { success: "결제가 완료되었습니다. PDF 보고서를 이메일로 볂니다.", error: "결제를 완료할 수 없습니다. 다시 시도해 주세요." },
    footer: { copyright: "© 2026 Traces. All rights reserved.", tagline: "전통에 뿌리를 두고 정성을 담아." }
  },
  es: {
    nav: { home: "Inicio", advisor: "Asesor", courses: "Cursos", shop: "Tienda", bazi: "Lectura Bazi", tarot: "Tarot", bagua: "I Ching", learn: "Aprender", about: "Nosotros" },
    hero: { eyebrow: "Sabiduría Oriental para la Vida Moderna", title: "Traces", subtitle: "Descubre tu camino a través de la metafísica china ancestral. Cursos, lecturas y guía personal.", ctaCourses: "Ver Cursos", ctaReading: "Reservar Lectura" },
    stats: { years: "Años de estudio", students: "Estudiantes", readings: "Lecturas" },
    features: { subtitle: "Por qué Traces", title: "Orientación para la vida moderna", personal: { title: "Personalizado", desc: "Cada lectura se adapta a tu carta natal única." }, wisdom: { title: "Sabiduría ancestral", desc: "Basado en Bazi, los Cinco Elementos y los Diez Dioses." }, clarity: { title: "Dirección clara", desc: "Consejos prácticos sobre carrera, relaciones, riqueza y momentos de vida." } },
    courses: { title: "Cursos", subtitle: "Aprende a tu ritmo", intro: "Programas estructurados desde principiante hasta intérprete confiado.", viewAll: "Ver todos", detail: "Detalles", items: [
      { title: "Fundamentos del Bazi", desc: "Domina los diez troncos celestes, las doce ramas terrestres y los cinco elementos en 8 lecciones.", price: "$49" },
      { title: "Compatibilidad de Pareja", desc: "Entiende el amor, el matrimonio y la pareja desde la astrología china.", price: "$79" },
      { title: "Carrera y Riqueza", desc: "Lee tu carta para encontrar dirección profesional, momentos de riqueza y oportunidades.", price: "$99" }
    ], highlights: { video: "Lecciones en HD", lifetime: "Acceso de por vida", community: "Comunidad privada" }, lessons: "lecciones", certificate: "Certificado", enroll: "Inscribirme" },
    cta: { title: "¿Listo para entender tu destino?", subtitle: "Reserva una lectura Bazi personal y recibe un informe detallado escrito para ti.", button: "Obtener lectura" },
    bazi: { title: "Lectura Personal Bazi", subtitle: "Un informe detallado escrito solo para ti", intro: "Proporciona tu fecha y hora de nacimiento. Combinamos metafísica clásica china con IA moderna.", formTitle: "Tu información", formSubtitle: "Toda la información se mantiene estrictamente confidencial", name: "Tu Nombre", namePlaceholder: "¿Cómo deberíamos llamarte?", birthDate: "Fecha de Nacimiento", birthTime: "Hora de Nacimiento", birthPlace: "Lugar de Nacimiento", birthPlacePlaceholder: "Ej.: Dandong, Liaoning / Pekín / Madrid", birthPlaceTip: "Se usa para la corrección del tiempo solar verdadero (longitud + ecuación de tiempo) y mejora la precisión de la hora.", gender: "Género", male: "Hombre", female: "Mujer", focus: "¿Sobre qué te gustaría centrarte?", focusGeneral: "Lectura general", focusCareer: "Carrera y riqueza", focusLove: "Amor y matrimonio", focusWealth: "Momentos de riqueza", focusHealth: "Salud", price: "$68", priceLabel: "Lectura personal", submit: "Generar mi lectura", generating: "Analizando tu carta...", required: "Por favor ingresa tu fecha de nacimiento y selecciona género.", error: "No se pudo generar la lectura. Inténtalo de nuevo.", reportTitle: "Tu lectura Bazi", reset: "Empezar de nuevo", includes: { report: "Informe escrito detallado en PDF", time: "Entrega en 48 horas", privacy: "Confidencialidad garantizada" }, secureNote: "Pago seguro mediante PayPal", disclaimer: "Solo con fines culturales y de entretenimiento; no es asesoramiento médico, legal ni financiero.", note: "Pago seguro mediante PayPal. Todas las lecturas son confidenciales." },
    paypal: { success: "¡Pago exitoso! Enviaremos tu informe al correo de PayPal.", error: "No se pudo completar el pago. Por favor, inténtalo de nuevo." },
    footer: { copyright: "© 2026 Traces. Todos los derechos reservados.", tagline: "Guía arraigada en la tradición, entregada con cuidado." }
  },
  fr: {
    nav: { home: "Accueil", advisor: "Conseiller", courses: "Cours", shop: "Boutique", bazi: "Lecture Bazi", tarot: "Tarot", bagua: "Yi Jing", learn: "Apprendre", about: "À propos" },
    hero: { eyebrow: "Sagesse Orientale et Vie Moderne", title: "Traces", subtitle: "Découvrez votre chemin de vie à travers la métaphysique chinoise ancienne.", ctaCourses: "Explorer les Cours", ctaReading: "Réserver une Lecture" },
    stats: { years: "Années d'étude", students: "Étudiants", readings: "Lectures" },
    features: { subtitle: "Pourquoi Traces", title: "Orientation pour la vie moderne", personal: { title: "Personnalisé", desc: "Chaque lecture est adaptée à votre thème natal unique." }, wisdom: { title: "Sagesse ancienne", desc: "Enraciné dans le Bazi, les Cinq Éléments et les Dix Dieux." }, clarity: { title: "Direction claire", desc: "Des perspectives pratiques sur carrière, relations, richesse et timing." } },
    courses: { title: "Cours", subtitle: "Apprenez à votre rythme", intro: "Des programmes structurés du débutant curieux à l'interprète confiant.", viewAll: "Voir tous les cours", detail: "Détails", items: [
      { title: "Fondamentaux du Bazi", desc: "Maîtrisez les dix troncs célestes, les douze branches terrestres et les cinq éléments en 8 leçons.", price: "$49" },
      { title: "Compatibilité Relationnelle", desc: "Comprenez l'amour, le mariage et le partenariat à travers l'astrologie chinoise.", price: "$79" },
      { title: "Destinée Carrière et Richesse", desc: "Lisez votre carte pour la direction de carrière, le timing de la richesse et les opportunités.", price: "$99" }
    ], highlights: { video: "Leçons vidéo HD", lifetime: "Accès à vie", community: "Communauté privée" }, lessons: "leçons", certificate: "Certificat", enroll: "S'inscrire" },
    cta: { title: "Prêt à comprendre votre destin?", subtitle: "Réservez une lecture Bazi personnelle et recevez un rapport détaillé rédigé pour vous.", button: "Obtenir ma lecture" },
    bazi: { title: "Lecture Bazi Personnelle", subtitle: "Un rapport détaillé rédigé juste pour vous", intro: "Fournissez votre date et heure de naissance. Nous combinons la métaphysique chinoise classique et l'IA moderne.", formTitle: "Vos informations", formSubtitle: "Toutes les informations sont strictement confidentielles", name: "Votre Nom", namePlaceholder: "Comment devrions-nous vous appeler?", birthDate: "Date de Naissance", birthTime: "Heure de Naissance", birthPlace: "Lieu de Naissance", birthPlacePlaceholder: "Ex. : Dandong, Liaoning / Pékin / Paris", birthPlaceTip: "Utilisé pour la correction du temps solaire vrai (longitude + équation du temps), améliore la précision de l'heure.", gender: "Genre", male: "Homme", female: "Femme", focus: "Sur quoi souhaitez-vous vous concentrer?", focusGeneral: "Lecture générale", focusCareer: "Carrière et richesse", focusLove: "Amour et mariage", focusWealth: "Timing de richesse", focusHealth: "Santé", price: "$68", priceLabel: "Lecture personnelle", submit: "Générer ma lecture", generating: "Analyse de votre thème...", required: "Veuillez entrer votre date de naissance et sélectionner le genre.", error: "Impossible de générer la lecture. Veuillez réessayer.", reportTitle: "Votre lecture Bazi", reset: "Recommencer", includes: { report: "Rapport écrit détaillé en PDF", time: "Livraison sous 48 heures", privacy: "Confidentialité strictement garantie" }, secureNote: "Paiement sécurisé via PayPal", disclaimer: "À des fins culturelles et de divertissement uniquement — pas un conseil médical, juridique ou financier.", note: "Paiement sécurisé via PayPal. Toutes les lectures sont confidentielles." },
    paypal: { success: "Paiement réussi ! Nous enverrons votre lecture à votre adresse PayPal.", error: "Le paiement n'a pas pu être effectué. Veuillez réessayer." },
    footer: { copyright: "© 2026 Traces. Tous droits réservés.", tagline: "Un guide ancré dans la tradition, offert avec soin." }
  },
  de: {
    nav: { home: "Startseite", advisor: "Berater", courses: "Kurse", shop: "Shop", bazi: "Bazi-Lesung", tarot: "Tarot", bagua: "I Ging", learn: "Wissen", about: "Über uns" },
    hero: { eyebrow: "Östliche Weisheit trifft modernes Leben", title: "Traces", subtitle: "Entdecke deinen Lebensweg durch die uralte chinesische Metaphysik.", ctaCourses: "Kurse entdecken", ctaReading: "Lesung buchen" },
    stats: { years: "Studienjahre", students: "Schüler", readings: "Lesungen" },
    features: { subtitle: "Warum Traces", title: "Orientierung für das moderne Leben", personal: { title: "Personalisiert", desc: "Jede Lesung ist auf dein einzigartiges Geburtshoroskop zugeschnitten." }, wisdom: { title: "Uralte Weisheit", desc: "Verwurzelt in Bazi, den Fünf Elementen und den Zehn Göttern." }, clarity: { title: "Klarheit", desc: "Praktische Einblicke zu Karriere, Beziehungen, Reichtum und Lebenszeitpunkt." } },
    courses: { title: "Kurse", subtitle: "Lerne in deinem eigenen Tempo", intro: "Strukturierte Programme vom neugierigen Anfänger zum selbstsicheren Interpreten.", viewAll: "Alle Kurse", detail: "Details", items: [
      { title: "Bazi-Grundlagen", desc: "Beherrsche die zehn Himmelsstämme, zwölf Erdzweige und die fünf Elemente in 8 Lektionen.", price: "$49" },
      { title: "Beziehungskompatibilität", desc: "Verstehe Liebe, Ehe und Partnerschaft durch die chinesische Astrologie.", price: "$79" },
      { title: "Karriere & Wohlstand", desc: "Lies dein Diagramm für Karriererichtung, Vermögenstiming und Lebenschancen.", price: "$99" }
    ], highlights: { video: "HD-Videolektionen", lifetime: "Lebenslanger Zugang", community: "Private Community" }, lessons: "Lektionen", certificate: "Zertifikat", enroll: "Einschreiben" },
    cta: { title: "Bereit, dein Schicksal zu verstehen?", subtitle: "Buche eine persönliche Bazi-Lesung und erhalte einen detaillierten Bericht nur für dich.", button: "Meine Lesung" },
    bazi: { title: "Persönliche Bazi-Lesung", subtitle: "Ein detaillierter Bericht nur für dich", intro: "Gib dein Geburtsdatum und deine Geburtszeit an. Wir kombinieren klassische chinesische Metaphysik mit moderner KI.", formTitle: "Deine Daten", formSubtitle: "Alle Angaben werden streng vertraulich behandelt", name: "Dein Name", namePlaceholder: "Wie sollen wir dich nennen?", birthDate: "Geburtsdatum", birthTime: "Geburtszeit", birthPlace: "Geburtsort", birthPlacePlaceholder: "Z. B.: Dandong, Liaoning / Peking / Berlin", birthPlaceTip: "Wird für die Wahre-Sonnenzeit-Korrektur (Längengrad + Zeitgleichung) verwendet und verbessert die Genauigkeit der Stundensäule.", gender: "Geschlecht", male: "Männlich", female: "Weiblich", focus: "Worauf möchtest du dich konzentrieren?", focusGeneral: "Allgemeine Lesung", focusCareer: "Karriere & Wohlstand", focusLove: "Liebe & Ehe", focusWealth: "Wohlstandstiming", focusHealth: "Gesundheit", price: "$68", priceLabel: "Persönliche Lesung", submit: "Meine Lesung erstellen", generating: "Analysiere dein Diagramm...", required: "Bitte Geburtsdatum eingeben und Geschlecht auswählen.", error: "Lesung konnte nicht erstellt werden. Bitte versuche es erneut.", reportTitle: "Deine Bazi-Lesung", reset: "Neu starten", includes: { report: "Detaillierter PDF-Bericht", time: "Lieferung innerhalb von 48 Stunden", privacy: "Strikte Vertraulichkeit" }, secureNote: "Sichere Bezahlung via PayPal", disclaimer: "Nur für kulturelle und Unterhaltungszwecke — keine medizinische, rechtliche oder finanzielle Beratung.", note: "Sichere Bezahlung via PayPal. Alle Lesungen sind vertraulich." },
    paypal: { success: "Zahlung erfolgreich! Wir senden deine Lesung an deine PayPal-E-Mail.", error: "Zahlung konnte nicht abgeschlossen werden. Bitte versuche es erneut." },
    footer: { copyright: "© 2026 Traces. Alle Rechte vorbehalten.", tagline: "In der Tradition verwurzelte Führung, mit Sorge übermittelt." }
  },
  pt: {
    nav: { home: "Início", advisor: "Conselheiro", courses: "Cursos", shop: "Loja", bazi: "Leitura Bazi", tarot: "Tarot", bagua: "I Ching", learn: "Aprender", about: "Sobre" },
    hero: { eyebrow: "Sabedoria Oriental para a Vida Moderna", title: "Traces", subtitle: "Descubra seu caminho através da metafísica chinesa ancestral.", ctaCourses: "Explorar Cursos", ctaReading: "Agendar Leitura" },
    stats: { years: "Anos de estudo", students: "Alunos", readings: "Leituras" },
    features: { subtitle: "Por que Traces", title: "Orientação para a vida moderna", personal: { title: "Personalizado", desc: "Cada leitura é adaptada ao seu mapa natal único." }, wisdom: { title: "Sabedoria antiga", desc: "Baseado em Bazi, Cinco Elementos e Dez Deuses." }, clarity: { title: "Direção clara", desc: "Insights práticos sobre carreira, relacionamentos, riqueza e timing." } },
    courses: { title: "Cursos", subtitle: "Aprenda no seu ritmo", intro: "Programas estruturados do iniciante curioso ao intérprete confiante.", viewAll: "Ver todos", detail: "Detalhes", items: [
      { title: "Fundamentos do Bazi", desc: "Domine os dez troncos celestes, os doze ramos terrestres e os cinco elementos em 8 aulas.", price: "$49" },
      { title: "Compatibilidade de Relacionamento", desc: "Entenda amor, casamento e parceria pela astrologia chinesa.", price: "$79" },
      { title: "Destino Profissional e Riqueza", desc: "Leia seu mapa para direção de carreira, timing de riqueza e oportunidades.", price: "$99" }
    ], highlights: { video: "Aulas em HD", lifetime: "Acesso vitalício", community: "Comunidade privada" }, lessons: "aulas", certificate: "Certificado", enroll: "Matricular-me" },
    cta: { title: "Pronto para entender seu destino?", subtitle: "Agende uma leitura Bazi pessoal e receba um relatório detalhado feito para você.", button: "Fazer leitura" },
    bazi: { title: "Leitura Bazi Pessoal", subtitle: "Um relatório detalhado escrito apenas para você", intro: "Forneça sua data e hora de nascimento. Combinamos metafísica chinesa clássica com IA moderna.", formTitle: "Suas informações", formSubtitle: "Todas as informações são estritamente confidenciais", name: "Seu Nome", namePlaceholder: "Como devemos chamá-lo?", birthDate: "Data de Nascimento", birthTime: "Hora de Nascimento", birthPlace: "Local de Nascimento", birthPlacePlaceholder: "Ex.: Dandong, Liaoning / Pequim / Lisboa", birthPlaceTip: "Usado para a correção do tempo solar verdadeiro (longitude + equação do tempo), melhora a precisão da hora.", gender: "Gênero", male: "Masculino", female: "Feminino", focus: "Sobre o que gostaria de focar?", focusGeneral: "Leitura geral", focusCareer: "Carreira e riqueza", focusLove: "Amor e casamento", focusWealth: "Timing de riqueza", focusHealth: "Saúde", price: "$68", priceLabel: "Leitura pessoal", submit: "Gerar minha leitura", generating: "Analisando seu mapa...", required: "Por favor, insira sua data de nascimento e selecione o gênero.", error: "Não foi possível gerar a leitura. Tente novamente.", reportTitle: "Sua leitura Bazi", reset: "Recomeçar", includes: { report: "Relatório escrito detalhado em PDF", time: "Entrega em 48 horas", privacy: "Confidencialidade garantida" }, secureNote: "Pagamento seguro via PayPal", disclaimer: "Apenas para fins culturais e de entretenimento — não é aconselhamento médico, jurídico ou financeiro.", note: "Pagamento seguro via PayPal. Todas as leituras são confidenciais." },
    paypal: { success: "Pagamento bem-sucedido! Enviaremos sua leitura para o e-mail do PayPal.", error: "O pagamento não pôde ser concluído. Tente novamente." },
    footer: { copyright: "© 2026 Traces. Todos os direitos reservados.", tagline: "Orientação enraizada na tradição, entregue com cuidado." }
  },
  ru: {
    nav: { home: "Главная", advisor: "Советник", courses: "Курсы", shop: "Магазин", bazi: "Чтение Бацзы", tarot: "Таро", bagua: "И цзин", learn: "Знания", about: "О нас" },
    hero: { eyebrow: "Восточная мудрость и современная жизнь", title: "Traces", subtitle: "Откройте свой жизненный путь через древнюю китайскую метафизику.", ctaCourses: "Смотреть курсы", ctaReading: "Забронировать чтение" },
    stats: { years: "Лет изучения", students: "Учеников", readings: "Чтений" },
    features: { subtitle: "Почему Traces", title: "Руководство для современной жизни", personal: { title: "Персонализировано", desc: "Каждое чтение адаптировано к вашей уникальной карте рождения." }, wisdom: { title: "Древняя мудрость", desc: "Основано на Бацзы, Пяти Элементах и Десяти Богах." }, clarity: { title: "Ясное направление", desc: "Практические идеи по карьере, отношениям, богатству и времени." } },
    courses: { title: "Курсы", subtitle: "Учитесь в своем темпе", intro: "Структурированные программы от любопытного новичка до уверенного интерпретатора.", viewAll: "Все курсы", detail: "Подробнее", items: [
      { title: "Основы Бацзы", desc: "Освойте десять небесных стволов, двенадцать земных ветвей и пять элементов за 8 уроков.", price: "$49" },
      { title: "Совместимость в отношениях", desc: "Поймите любовь, брак и партнерство через призму китайской астрологии.", price: "$79" },
      { title: "Карьера и богатство", desc: "Прочтите свою карту для направления карьеры, времени богатства и возможностей.", price: "$99" }
    ], highlights: { video: "Видеоуроки в HD", lifetime: "Пожизненный доступ", community: "Закрытое сообщество" }, lessons: "уроков", certificate: "Сертификат", enroll: "Записаться" },
    cta: { title: "Готовы понять свою судьбу?", subtitle: "Забронируйте персональное чтение Бацзы и получите подробный отчет.", button: "Получить чтение" },
    bazi: { title: "Персональное чтение Бацзы", subtitle: "Подробный отчет, написанный специально для вас", intro: "Укажите дату и время рождения. Мы сочетаем классическую китайскую метафизику с современным ИИ.", formTitle: "Ваша информация", formSubtitle: "Вся информация строго конфиденциальна", name: "Ваше имя", namePlaceholder: "Как к вам обращаться?", birthDate: "Дата рождения", birthTime: "Время рождения", birthPlace: "Место рождения", birthPlacePlaceholder: "Напр.: Даньдун, Ляонин / Пекин / Москва", birthPlaceTip: "Используется для поправки на истинное солнечное время (долгота + уравнение времени), повышает точность часового столпа.", gender: "Пол", male: "Мужской", female: "Женский", focus: "На чем вы хотели бы сосредоточиться?", focusGeneral: "Общее чтение", focusCareer: "Карьера и богатство", focusLove: "Любовь и брак", focusWealth: "Время богатства", focusHealth: "Здоровье", price: "$68", priceLabel: "Персональное чтение", submit: "Создать мое чтение", generating: "Анализирую вашу карту...", required: "Пожалуйста, введите дату рождения и выберите пол.", error: "Не удалось создать чтение. Попробуйте еще раз.", reportTitle: "Ваше чтение Бацзы", reset: "Начать сначала", includes: { report: "Подробный письменный отчет в PDF", time: "Доставка в течение 48 часов", privacy: "Гарантия конфиденциальности" }, secureNote: "Безопасная оплата через PayPal", disclaimer: "Только в культурных и развлекательных целях — не является медицинской, юридической или финансовой консультацией.", note: "Безопасная оплата через PayPal. Все чтения конфиденциальны." },
    paypal: { success: "Оплата прошла успешно! Мы отправим ваше чтение на вашу почту PayPal.", error: "Оплату не удалось завершить. Пожалуйста, попробуйте еще раз." },
    footer: { copyright: "© 2026 Traces. Все права защищены.", tagline: "Руководство, укорененное в традиции, с заботой доставленное." }
  },
  ar: {
    nav: { home: "الرئيسية", advisor: "المستشار", courses: "الدورات", shop: "المتجر", bazi: "قراءة البازي", tarot: "قراءة التاروت", bagua: "أنا تشينغ", learn: "تعلّم", about: "من نحن" },
    hero: { eyebrow: "حكمة شرقية للحياة الحديثة", title: "Traces", subtitle: "اكتشف مسار حياتك من خلال الميتافيزيقا الصينية القديمة.", ctaCourses: "استعراض الدورات", ctaReading: "حجز قراءة" },
    stats: { years: "سنوات الدراسة", students: "الطلاب", readings: "القراءات" },
    features: { subtitle: "لماذا Traces", title: "إرشاد للحياة الحديثة", personal: { title: "مخصص", desc: "كل قراءة مخصصة لخريطة ميلادك الفريدة." }, wisdom: { title: "حكمة قديمة", desc: "مستمد من البازي والعناصر الخمسة والآلهة العشرة." }, clarity: { title: "اتجاه واضح", desc: "رؤى عملية حول المسار المهني والعلاقات والثروة وتوقيت الحياة." } },
    courses: { title: "الدورات", subtitle: "تعلم بوتيرتك الخاصة", intro: "برامج منظمة من المبتدئ الفضولي إلى المترجم الواثق.", viewAll: "عرض جميع الدورات", detail: "التفاصيل", items: [
      { title: "أساسيات البازي", desc: "أتقن السيقان السماوية العشرة والفروع الأرضية الاثنتي عشرة والعناصر الخمسة في 8 دروس.", price: "$49" },
      { title: "توافق العلاقات", desc: "افهم الحب والزواج والشراكة من خلال علم التنجيم الصيني.", price: "$79" },
      { title: "المسار المهني والثروة", desc: "اقرأ خريطتك لتحديد اتجاهك المهني وتوقيت الثروة والفرص.", price: "$99" }
    ], highlights: { video: "دروس فيديو HD", lifetime: "وصول مدى الحياة", community: "مجتمع خاص" }, lessons: "دروس", certificate: "شهادة", enroll: "سجّل الآن" },
    cta: { title: "هل أنت مستعد لفهم مصيرك؟", subtitle: "احجز قراءة بازي شخصية واحصل على تقرير مفصل مكتوب خصيصاً لك.", button: "احصل على قراءتك" },
    bazi: { title: "قراءة البازي الشخصية", subtitle: "تقرير مفصل مكتوب خصيصاً لك", intro: "قدّم تاريخ ومكان ميلادك. نجمع بين الميتافيزيقا الصينية الكلاسيكية والذكاء الاصطناعي الحديث.", formTitle: "معلوماتك", formSubtitle: "جميع المعلومات سرية تماماً", name: "اسمك", namePlaceholder: "كيف يجب أن نناديك؟", birthDate: "تاريخ الميلاد", birthTime: "وقت الميلاد", birthPlace: "مكان الولادة", birthPlacePlaceholder: "مثال: داندونغ، لياونينغ / بكين / القاهرة", birthPlaceTip: "يُستخدم لتصحيح التوقيت الشمسي الحقيقي (فرق خط الطول + معادلة الزمن) لتحسين دقة العمود الساعي.", gender: "الجنس", male: "ذكر", female: "أنثى", focus: "ما الذي تريد التركيز عليه؟", focusGeneral: "قراءة عامة", focusCareer: "المسار المهني والثروة", focusLove: "الحب والزواج", focusWealth: "توقيت الثروة", focusHealth: "الصحة", price: "$68", priceLabel: "قراءة شخصية", submit: "إنشاء قراءتي", generating: "جارٍ تحليل خريطتك...", required: "يرجى إدخال تاريخ الميلاد واختيار الجنس.", error: "تعذر إنشاء القراءة. يرجى المحاولة مرة أخرى.", reportTitle: "قراءة البازي الخاصة بك", reset: "ابدأ من جديد", includes: { report: "تقرير مكتوب مفصل بصيغة PDF", time: "التوصيل خلال 48 ساعة", privacy: "خصوصية مضمونة" }, secureNote: "دفع آمن عبر PayPal", disclaimer: "للأغراض الثقافية والترفيهية فقط — ليست نصيحة طبية أو قانونية أو مالية.", note: "دفع آمن عبر PayPal. جميع القراءات سرية." },
    paypal: { success: "تم الدفع بنجاح! سنرسل قراءتك إلى بريد PayPal الخاص بك.", error: "تعذر إتمام الدفع. يرجى المحاولة مرة أخرى." },
    footer: { copyright: "© 2026 Traces. جميع الحقوق محفوظة.", tagline: "إرشاد متجذر في التقليد، يُقدّم بعناية." }
  }
};

export function getMessages(locale: Locale) {
  return messages[locale] || messages[defaultLocale];
}
