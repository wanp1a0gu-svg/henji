import { Locale } from "./i18n";

/** 商城页面文案（10 语言）。商品名/描述在 shop-data.ts（英文+中文）。 */

export interface ShopMessages {
  eyebrow: string;
  title: string;
  subtitle: string;
  badgeBest: string;
  badgePremium: string;
  badgeNew: string;
  buy: string;
  comingSoon: string;
  shipping: string;
  natural: string;
  ctaTitle: string;
  ctaBazi: string;
  disclaimer: string;
}

const SHOP: Record<Locale, ShopMessages> = {
  en: {
    eyebrow: "Shop",
    title: "Our Collection",
    subtitle: "Natural crystal, jade and amber pieces — chosen for their beauty and meaning.",
    badgeBest: "Bestseller",
    badgePremium: "Premium",
    badgeNew: "New",
    buy: "Buy with PayPal",
    comingSoon: "Checkout is opening soon — we're finalizing payment setup.",
    shipping: "Free worldwide shipping · Ships from China · Delivery in 2–4 weeks",
    natural: "Each piece is natural stone — slight variations in color and texture are normal.",
    ctaTitle: "Looking for something deeper?",
    ctaBazi: "Try a Bazi Reading →",
    disclaimer: "Items and content are for cultural interest and enjoyment only — not professional advice.",
  },
  zh: {
    eyebrow: "精选商城",
    title: "灵石信物",
    subtitle: "天然水晶、玉石与琥珀——为美感与寓意而精选。",
    badgeBest: "热卖",
    badgePremium: "典藏",
    badgeNew: "新品",
    buy: "PayPal 购买",
    comingSoon: "结算通道即将开通，正在完成支付配置。",
    shipping: "全球包邮 · 中国发货 · 约 2–4 周送达",
    natural: "均为天然石材，颜色纹理略有差异属正常现象。",
    ctaTitle: "想要一份专属解读？",
    ctaBazi: "试试八字测算 →",
    disclaimer: "商品与内容仅供文化兴趣与佩戴欣赏，不构成任何专业建议。",
  },
  ja: {
    eyebrow: "セレクトショップ",
    title: "ストーン・コレクション",
    subtitle: "天然水晶・翡翠・琥珀から、美しさと意味を基準に選んだアイテム。",
    badgeBest: "人気",
    badgePremium: "プレミアム",
    badgeNew: "新着",
    buy: "PayPal で購入",
    comingSoon: "決済準備中です。まもなくご利用いただけます。",
    shipping: "全世界送料無料 · 中国発送 · 2〜4週間でお届け",
    natural: "天然石のため、色や模様に多少の個体差があります。",
    ctaTitle: "もっと深い鑑定をお求めですか？",
    ctaBazi: "八字鑑定を試す →",
    disclaimer: "商品とコンテンツは文化・娯楽目的のみであり、専門的助言ではありません。",
  },
  ko: {
    eyebrow: "셀렉트 숍",
    title: "스톤 컬렉션",
    subtitle: "천연 수정, 옥, 호박 — 아름다움과 의미를 기준으로 고른 아이템.",
    badgeBest: "베스트",
    badgePremium: "프리미엄",
    badgeNew: "신상품",
    buy: "PayPal로 구매",
    comingSoon: "결제 시스템을 준비 중입니다. 곧 열립니다.",
    shipping: "전 세계 무료배송 · 중국 발송 · 2~4주 소요",
    natural: "천연석 특성상 색과 무늬에 차이가 있을 수 있습니다.",
    ctaTitle: "더 깊은 분석을 원하시나요?",
    ctaBazi: "사주 분석 체험하기 →",
    disclaimer: "상품과 콘텐츠는 문화 및 오락 목적이며 전문적 조언이 아닙니다.",
  },
  es: {
    eyebrow: "Tienda",
    title: "Colección de Piedras",
    subtitle: "Piezas de cristal, jade y ámbar naturales — elegidas por su belleza y significado.",
    badgeBest: "Más vendido",
    badgePremium: "Premium",
    badgeNew: "Nuevo",
    buy: "Comprar con PayPal",
    comingSoon: "El pago estará disponible muy pronto — estamos finalizando la configuración.",
    shipping: "Envío mundial gratuito · Desde China · Entrega en 2–4 semanas",
    natural: "Cada pieza es piedra natural — pequeñas variaciones de color y textura son normales.",
    ctaTitle: "¿Buscas algo más profundo?",
    ctaBazi: "Prueba una Lectura Bazi →",
    disclaimer: "Los artículos y el contenido son solo para interés cultural y disfrute — no constituyen asesoramiento profesional.",
  },
  fr: {
    eyebrow: "Boutique",
    title: "Collection de Pierres",
    subtitle: "Pièces en cristal, jade et ambre naturels — choisies pour leur beauté et leur sens.",
    badgeBest: "Best-seller",
    badgePremium: "Premium",
    badgeNew: "Nouveau",
    buy: "Acheter avec PayPal",
    comingSoon: "Le paiement ouvrira bientôt — nous finalisons la configuration.",
    shipping: "Livraison mondiale offerte · Depuis la Chine · 2 à 4 semaines",
    natural: "Chaque pièce est en pierre naturelle — de légères variations de couleur sont normales.",
    ctaTitle: "Envie d'une lecture plus profonde ?",
    ctaBazi: "Essayez une Lecture Bazi →",
    disclaimer: "Les articles et contenus sont à visée culturelle et de divertissement — pas un conseil professionnel.",
  },
  de: {
    eyebrow: "Shop",
    title: "Stein-Kollektion",
    subtitle: "Stücke aus natürlichem Kristall, Jade und Bernstein — ausgewählt für Schönheit und Bedeutung.",
    badgeBest: "Bestseller",
    badgePremium: "Premium",
    badgeNew: "Neu",
    buy: "Mit PayPal kaufen",
    comingSoon: "Der Checkout öffnet bald — wir schließen die Zahlungseinrichtung ab.",
    shipping: "Weltweiter Gratisversand · Versand aus China · Lieferung in 2–4 Wochen",
    natural: "Jedes Stück ist Naturstein — leichte Farb- und Texturabweichungen sind normal.",
    ctaTitle: "Lust auf eine tiefere Lesung?",
    ctaBazi: "Bazi-Lesung ausprobieren →",
    disclaimer: "Artikel und Inhalte dienen nur kulturellem Interesse und Unterhaltung — keine professionelle Beratung.",
  },
  pt: {
    eyebrow: "Loja",
    title: "Coleção de Pedras",
    subtitle: "Peças de cristal, jade e âmbar naturais — escolhidas pela beleza e significado.",
    badgeBest: "Mais vendido",
    badgePremium: "Premium",
    badgeNew: "Novo",
    buy: "Comprar com PayPal",
    comingSoon: "O pagamento abrirá em breve — estamos finalizando a configuração.",
    shipping: "Frete grátis mundial · Enviado da China · Entrega em 2–4 semanas",
    natural: "Cada peça é pedra natural — pequenas variações de cor e textura são normais.",
    ctaTitle: "Procurando algo mais profundo?",
    ctaBazi: "Experimente uma Leitura Bazi →",
    disclaimer: "Itens e conteúdo são apenas para interesse cultural e entretenimento — não é aconselhamento profissional.",
  },
  ru: {
    eyebrow: "Магазин",
    title: "Коллекция камней",
    subtitle: "Изделия из натурального хрусталя, нефрита и янтаря — выбраны за красоту и смысл.",
    badgeBest: "Хит продаж",
    badgePremium: "Премиум",
    badgeNew: "Новинка",
    buy: "Купить через PayPal",
    comingSoon: "Оплата скоро откроется — мы завершаем настройку.",
    shipping: "Бесплатная доставка по миру · Из Китая · 2–4 недели",
    natural: "Каждое изделие — натуральный камень; небольшие различия в цвете нормальны.",
    ctaTitle: "Хотите более глубокий разбор?",
    ctaBazi: "Попробовать чтение Бацзы →",
    disclaimer: "Товары и контент — только для культурного интереса и развлечения, не профессиональная консультация.",
  },
  ar: {
    eyebrow: "المتجر",
    title: "مجموعة الأحجار",
    subtitle: "قطع من الكريستال واليشب والكهرمان الطبيعي — مختارة لجمالها ومعناها.",
    badgeBest: "الأكثر مبيعاً",
    badgePremium: "مميز",
    badgeNew: "جديد",
    buy: "الشراء عبر PayPal",
    comingSoon: "سيتوفر الدفع قريباً — نعمل على إنهاء إعداد الدفع.",
    shipping: "شحن مجاني عالمي · الشحن من الصين · التوصيل خلال 2-4 أسابيع",
    natural: "كل قطعة حجر طبيعي — الاختلافات البسيطة في اللون والملمس طبيعية.",
    ctaTitle: "تبحث عن قراءة أعمق؟",
    ctaBazi: "جرّب قراءة البازي →",
    disclaimer: "المنتجات والمحتوى للاهتمام الثقافي والترفيهي فقط — وليست نصيحة مهنية.",
  },
};

export function getShopMessages(locale: Locale): ShopMessages {
  return SHOP[locale] || SHOP.en;
}
