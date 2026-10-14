import { Locale } from "./i18n";

/**
 * 命盘展示卡片的多语言文案（10 语言）。
 * 十神术语：中文/日文沿用原字，韩文用韩文对应词，其余语言用英文标准译名。
 */

export type ElementKey = "metal" | "wood" | "water" | "fire" | "earth";

export interface ChartMessages {
  title: string;
  note: string;
  colYear: string;
  colMonth: string;
  colDay: string;
  colHour: string;
  shishen: string;
  canggan: string;
  dayMaster: string;
  qiyun: string;
  dayun: string;
  elements: string;
  forward: string;
  reverse: string;
  hourUnknown: string;
  boundary: string;
  el: Record<ElementKey, string>;
  // 真太阳时校正（10-13 新增）
  tsTitle: string;
  tsClock: string;
  tsTrue: string;
  tsLng: string;
  tsEot: string;
  tsMin: string;
  tsShift: string;
  tsNotFound: string;
  tsDst: string;
  // 神煞
  ssTitle: string;
  ssGood: string;
  ssNeutral: string;
  ssBad: string;
  ssNote: string;
}

const zh: ChartMessages = {
  title: "命盘",
  note: "由排盘引擎精确计算（定气定朔）· AI 仅作解读",
  colYear: "年柱",
  colMonth: "月柱",
  colDay: "日柱",
  colHour: "时柱",
  shishen: "十神",
  canggan: "藏干",
  dayMaster: "日主",
  qiyun: "起运",
  dayun: "大运",
  elements: "五行",
  forward: "顺排",
  reverse: "逆排",
  hourUnknown: "未提供出生时间，时柱暂缺",
  boundary: "出生时间接近节气交界，已按精确时刻计算",
  el: { metal: "金", wood: "木", water: "水", fire: "火", earth: "土" },
  tsTitle: "真太阳时校正",
  tsClock: "钟表时间",
  tsTrue: "真太阳时",
  tsLng: "经度差",
  tsEot: "均时差",
  tsMin: "分",
  tsShift: "校正后时辰",
  tsNotFound: "未能识别出生地，本次未做真太阳时校正",
  tsDst: "该年份中国曾实行夏令时（1986–1991），若出生时间按夏令时记录请核对",
  ssTitle: "神煞",
  ssGood: "吉神",
  ssNeutral: "中性",
  ssBad: "凶煞",
  ssNote: "神煞为辅，论命以五行十神为主",
};

const en: ChartMessages = {
  title: "Natal Chart",
  note: "Precisely computed by the charting engine · AI interprets only",
  colYear: "Year",
  colMonth: "Month",
  colDay: "Day",
  colHour: "Hour",
  shishen: "Ten God",
  canggan: "Hidden Stems",
  dayMaster: "Day Master",
  qiyun: "Luck begins",
  dayun: "Luck Pillars",
  elements: "Elements",
  forward: "Forward",
  reverse: "Reverse",
  hourUnknown: "Birth time not provided — hour pillar unavailable",
  boundary: "Birth time is near a solar-term boundary; computed to the exact instant",
  el: { metal: "Metal", wood: "Wood", water: "Water", fire: "Fire", earth: "Earth" },
  tsTitle: "True Solar Time",
  tsClock: "Clock",
  tsTrue: "True Solar",
  tsLng: "Longitude",
  tsEot: "Equation of Time",
  tsMin: "min",
  tsShift: "Corrected hour",
  tsNotFound: "Birth place not recognized — no true-solar-time correction applied",
  tsDst: "China observed daylight saving time in 1986–1991; verify if the recorded time was DST",
  ssTitle: "Auxiliary Stars",
  ssGood: "Auspicious",
  ssNeutral: "Neutral",
  ssBad: "Challenging",
  ssNote: "Shensha are auxiliary — the five elements and ten gods lead the reading",
};

const ja: ChartMessages = {
  title: "命盤",
  note: "排盤エンジンによる精密計算（定気定朔）· AIは解釈のみ",
  colYear: "年柱",
  colMonth: "月柱",
  colDay: "日柱",
  colHour: "時柱",
  shishen: "十神",
  canggan: "蔵干",
  dayMaster: "日主",
  qiyun: "起運",
  dayun: "大運",
  elements: "五行",
  forward: "順行",
  reverse: "逆行",
  hourUnknown: "出生時刻が未入力のため、時柱は算出されていません",
  boundary: "出生時刻が節気の境界に近いため、正確な瞬間で計算しています",
  el: { metal: "金", wood: "木", water: "水", fire: "火", earth: "土" },
  tsTitle: "真太陽時補正",
  tsClock: "時計時間",
  tsTrue: "真太陽時",
  tsLng: "経度差",
  tsEot: "均時差",
  tsMin: "分",
  tsShift: "補正後の時辰",
  tsNotFound: "出生地を認識できず、真太陽時補正は適用されていません",
  tsDst: "1986〜1991年の中国は夏時間を実施。夏時間で記録された場合はご確認ください",
  ssTitle: "神煞",
  ssGood: "吉神",
  ssNeutral: "中性",
  ssBad: "凶煞",
  ssNote: "神煞は補助。論命は五行・十神が主",
};

const ko: ChartMessages = {
  title: "명반",
  note: "만세력 엔진으로 정밀 계산 · AI는 해석만 담당",
  colYear: "년주",
  colMonth: "월주",
  colDay: "일주",
  colHour: "시주",
  shishen: "십신",
  canggan: "지장간",
  dayMaster: "일간",
  qiyun: "대운 시작",
  dayun: "대운",
  elements: "오행",
  forward: "순행",
  reverse: "역행",
  hourUnknown: "출생 시간이 없어 시주를 계산할 수 없습니다",
  boundary: "출생 시간이 절기 경계에 가까워 정확한 시각으로 계산했습니다",
  el: { metal: "금", wood: "목", water: "수", fire: "화", earth: "토" },
  tsTitle: "진태양시 보정",
  tsClock: "시계 시간",
  tsTrue: "진태양시",
  tsLng: "경도차",
  tsEot: "균시차",
  tsMin: "분",
  tsShift: "보정 후 시진",
  tsNotFound: "출생지를 인식하지 못해 진태양시 보정이 적용되지 않았습니다",
  tsDst: "1986~1991년 중국은 서머타임을 시행했습니다. 해당 경우 확인해 주세요",
  ssTitle: "신살",
  ssGood: "길신",
  ssNeutral: "중성",
  ssBad: "흉신",
  ssNote: "신살은 보조이며, 오행·십신이 주가 됩니다",
};

const es: ChartMessages = {
  title: "Carta Natal",
  note: "Calculada con precisión por el motor de cartas · La IA solo interpreta",
  colYear: "Año",
  colMonth: "Mes",
  colDay: "Día",
  colHour: "Hora",
  shishen: "Dios",
  canggan: "Tallos Ocultos",
  dayMaster: "Amo del Día",
  qiyun: "Inicio de Suerte",
  dayun: "Ciclos de Suerte",
  elements: "Elementos",
  forward: "Directo",
  reverse: "Inverso",
  hourUnknown: "Sin hora de nacimiento: pilar de la hora no disponible",
  boundary: "La hora de nacimiento está cerca de un límite solar; calculado al instante exacto",
  el: { metal: "Metal", wood: "Madera", water: "Agua", fire: "Fuego", earth: "Tierra" },
  tsTitle: "Tiempo solar verdadero",
  tsClock: "Reloj",
  tsTrue: "Solar verdadero",
  tsLng: "Longitud",
  tsEot: "Ecuación de tiempo",
  tsMin: "min",
  tsShift: "Hora corregida",
  tsNotFound: "Lugar de nacimiento no reconocido; no se aplicó corrección solar",
  tsDst: "China aplicó horario de verano en 1986–1991; verifíquelo si corresponde",
  ssTitle: "Estrellas auxiliares",
  ssGood: "Benévolas",
  ssNeutral: "Neutras",
  ssBad: "Inquietantes",
  ssNote: "Las estrellas auxiliares complementan a los cinco elementos y los diez dioses",
};

const fr: ChartMessages = {
  title: "Thème Natal",
  note: "Calculé avec précision par le moteur · L'IA interprète uniquement",
  colYear: "Année",
  colMonth: "Mois",
  colDay: "Jour",
  colHour: "Heure",
  shishen: "Dieu",
  canggan: "Tiges Cachées",
  dayMaster: "Maître du Jour",
  qiyun: "Début du Destin",
  dayun: "Cycles du Destin",
  elements: "Éléments",
  forward: "Direct",
  reverse: "Inverse",
  hourUnknown: "Heure de naissance non fournie — pilier de l'heure indisponible",
  boundary: "Naissance proche d'une limite solaire ; calculé à l'instant exact",
  el: { metal: "Métal", wood: "Bois", water: "Eau", fire: "Feu", earth: "Terre" },
  tsTitle: "Temps solaire vrai",
  tsClock: "Horloge",
  tsTrue: "Solaire vrai",
  tsLng: "Longitude",
  tsEot: "Équation du temps",
  tsMin: "min",
  tsShift: "Heure corrigée",
  tsNotFound: "Lieu de naissance non reconnu — pas de correction solaire appliquée",
  tsDst: "La Chine a appliqué l'heure d'été en 1986–1991 ; vérifiez si l'heure enregistrée en tient compte",
  ssTitle: "Étoiles auxiliaires",
  ssGood: "Bénéfiques",
  ssNeutral: "Neutres",
  ssBad: "Défiantes",
  ssNote: "Les étoiles auxiliaires complètent les cinq éléments et les dix dieux",
};

const de: ChartMessages = {
  title: "Geburtskarte",
  note: "Präzise berechnet von der Chart-Engine · KI interpretiert nur",
  colYear: "Jahr",
  colMonth: "Monat",
  colDay: "Tag",
  colHour: "Stunde",
  shishen: "Gottheit",
  canggan: "Verborgene Stämme",
  dayMaster: "Tagesmeister",
  qiyun: "Glücksbeginn",
  dayun: "Glückszyklen",
  elements: "Elemente",
  forward: "Vorwärts",
  reverse: "Rückwärts",
  hourUnknown: "Geburtszeit fehlt — Stundenpfeiler nicht verfügbar",
  boundary: "Geburt nahe einer Sonnenbegrenzung; exakt berechnet",
  el: { metal: "Metall", wood: "Holz", water: "Wasser", fire: "Feuer", earth: "Erde" },
  tsTitle: "Wahre Sonnenzeit",
  tsClock: "Uhrzeit",
  tsTrue: "Wahre Sonnenzeit",
  tsLng: "Längengrad",
  tsEot: "Zeitgleichung",
  tsMin: "Min.",
  tsShift: "Korrigierte Stunde",
  tsNotFound: "Geburtsort nicht erkannt – keine Sonnenzeit-Korrektur angewendet",
  tsDst: "China hatte 1986–1991 Sommerzeit; bitte prüfen, ob die Uhrzeit entsprechend war",
  ssTitle: "Hilfssterne",
  ssGood: "Günstig",
  ssNeutral: "Neutral",
  ssBad: "Ungünstig",
  ssNote: "Hilfssterne ergänzen die fünf Elemente und zehn Götter",
};

const pt: ChartMessages = {
  title: "Mapa Natal",
  note: "Calculado com precisão pelo motor · A IA apenas interpreta",
  colYear: "Ano",
  colMonth: "Mês",
  colDay: "Dia",
  colHour: "Hora",
  shishen: "Deus",
  canggan: "Troncos Ocultos",
  dayMaster: "Mestre do Dia",
  qiyun: "Início da Sorte",
  dayun: "Ciclos da Sorte",
  elements: "Elementos",
  forward: "Direto",
  reverse: "Reverso",
  hourUnknown: "Hora de nascimento não informada — pilar da hora indisponível",
  boundary: "Nascimento próximo de um limite solar; calculado no instante exato",
  el: { metal: "Metal", wood: "Madeira", water: "Água", fire: "Fogo", earth: "Terra" },
  tsTitle: "Tempo solar verdadeiro",
  tsClock: "Relógio",
  tsTrue: "Solar verdadeiro",
  tsLng: "Longitude",
  tsEot: "Equação do tempo",
  tsMin: "min",
  tsShift: "Hora corrigida",
  tsNotFound: "Local de nascimento não reconhecido — sem correção solar aplicada",
  tsDst: "A China adotou horário de verão em 1986–1991; verifique se o horário registrado considera isso",
  ssTitle: "Estrelas auxiliares",
  ssGood: "Benéficas",
  ssNeutral: "Neutras",
  ssBad: "Desafiadoras",
  ssNote: "As estrelas auxiliares complementam os cinco elementos e os dez deuses",
};

const ru: ChartMessages = {
  title: "Карта Бацзы",
  note: "Рассчитано движком с высокой точностью · ИИ только интерпретирует",
  colYear: "Год",
  colMonth: "Месяц",
  colDay: "День",
  colHour: "Час",
  shishen: "Дух",
  canggan: "Скрытые стволы",
  dayMaster: "Хозяин дня",
  qiyun: "Начало удачи",
  dayun: "Циклы удачи",
  elements: "Элементы",
  forward: "Прямой ход",
  reverse: "Обратный ход",
  hourUnknown: "Время рождения не указано — столп часа недоступен",
  boundary: "Время рождения близко к границе сезона; расчёт по точному моменту",
  el: { metal: "Металл", wood: "Дерево", water: "Вода", fire: "Огонь", earth: "Земля" },
  tsTitle: "Истинное солнечное время",
  tsClock: "Часы",
  tsTrue: "Истинное солнечное",
  tsLng: "Долгота",
  tsEot: "Уравнение времени",
  tsMin: "мин",
  tsShift: "Скорректированный час",
  tsNotFound: "Место рождения не распознано — поправка не применена",
  tsDst: "В Китае в 1986–1991 гг. действовало летнее время; проверьте запись при необходимости",
  ssTitle: "Вспомогательные звёзды",
  ssGood: "Благие",
  ssNeutral: "Нейтральные",
  ssBad: "Неблагоприятные",
  ssNote: "Вспомогательные звёзды дополняют пять элементов и десять богов",
};

const ar: ChartMessages = {
  title: "خريطة الميلاد",
  note: "حساب دقيق بواسطة محرك الأبراج · الذكاء الاصطناعي يفسّر فقط",
  colYear: "السنة",
  colMonth: "الشهر",
  colDay: "اليوم",
  colHour: "الساعة",
  shishen: "الإله",
  canggan: "الجذوع الخفية",
  dayMaster: "سيد اليوم",
  qiyun: "بداية الحظ",
  dayun: "دورات الحظ",
  elements: "العناصر",
  forward: "تدفق طبيعي",
  reverse: "تدفق عكسي",
  hourUnknown: "لم يُذكر وقت الميلاد — عمود الساعة غير متاح",
  boundary: "وقت الميلاد قريب من حد فصلي؛ تم الحساب بدقة",
  el: { metal: "معدن", wood: "خشب", water: "ماء", fire: "نار", earth: "تراب" },
  tsTitle: "التوقيت الشمسي الحقيقي",
  tsClock: "ساعة الحائط",
  tsTrue: "التوقيت الشمسي",
  tsLng: "فرق الطول",
  tsEot: "معادلة الزمن",
  tsMin: "دقيقة",
  tsShift: "العمود الساعي بعد التصحيح",
  tsNotFound: "لم يتم التعرف على مكان الولادة — لم يُطبَّق تصحيح التوقيت الشمسي",
  tsDst: "طبّقت الصين التوقيت الصيفي خلال 1986–1991؛ تحقق إن سُجّل الوقت بالتوقيت الصيفي",
  ssTitle: "النجوم المساعدة",
  ssGood: "سعيدة",
  ssNeutral: "محايدة",
  ssBad: "عصيبة",
  ssNote: "النجوم المساعدة ثانوية؛ العناصر الخمسة والعشرة آلهة هي الأساس",
};

const CHART_MESSAGES: Record<Locale, ChartMessages> = { zh, en, ja, ko, es, fr, de, pt, ru, ar };

export function getChartMessages(locale: Locale): ChartMessages {
  return CHART_MESSAGES[locale] || en;
}

// ---------------------------------------------------------------------------
// 十神本地化
// ---------------------------------------------------------------------------

const SHISHEN_EN: Record<string, string> = {
  比肩: "Companion",
  劫财: "Rob Wealth",
  食神: "Eating God",
  伤官: "Hurting Officer",
  偏财: "Indirect Wealth",
  正财: "Direct Wealth",
  偏官: "Seven Killings",
  正官: "Direct Officer",
  偏印: "Indirect Resource",
  正印: "Direct Resource",
};

const SHISHEN_KO: Record<string, string> = {
  比肩: "비견",
  劫财: "겁재",
  食神: "식신",
  伤官: "상관",
  偏财: "편재",
  正财: "정재",
  偏官: "편관",
  正官: "정관",
  偏印: "편인",
  正印: "정인",
};

export function shishenLabel(locale: Locale, value: string): string {
  if (!value || value === "—" || value === "未知") return value;
  if (locale === "zh" || locale === "ja") return value;
  if (locale === "ko") return SHISHEN_KO[value] || SHISHEN_EN[value] || value;
  return SHISHEN_EN[value] || value;
}

// ---------------------------------------------------------------------------
// 神煞（shénshà）：名称与柱位标签的本地化
// 模式同十神：zh/ja 保留原字，ko 用韩文对应词，其余语言用英文标准译名。
// ---------------------------------------------------------------------------

const SHENSHA_EN: Record<string, string> = {
  天乙贵人: "Nobleman",
  天德: "Heavenly Virtue",
  月德: "Monthly Virtue",
  文昌: "Literary Star",
  学堂: "Academy Star",
  词馆: "Literary Hall",
  将星: "General Star",
  华盖: "Canopy Star",
  驿马: "Traveling Horse",
  天医: "Heavenly Doctor",
  禄神: "Prosperity Star",
  金舆: "Golden Carriage",
  羊刃: "Yang Blade",
  劫煞: "Robbery Sha",
  灾煞: "Disaster Sha",
  亡神: "Loss Star",
  "桃花/咸池": "Peach Blossom",
  孤辰: "Lonely Star",
  寡宿: "Widowhood Star",
  "空亡/旬空": "Void",
  元辰: "Adversity Star",
  血刃: "Blood Blade",
};

const SHENSHA_KO: Record<string, string> = {
  天乙贵人: "천을귀인",
  天德: "천덕",
  月德: "월덕",
  文昌: "문창",
  学堂: "학당",
  词馆: "사관",
  将星: "장성",
  华盖: "화개",
  驿马: "역마",
  天医: "천의",
  禄神: "녹신",
  金舆: "금여",
  羊刃: "양인",
  劫煞: "겁살",
  灾煞: "재살",
  亡神: "망신",
  "桃花/咸池": "도화/함지",
  孤辰: "고진",
  寡宿: "과숙",
  "空亡/旬空": "공망/순공",
  元辰: "원진",
  血刃: "혈인",
};

export function shenshaLabel(locale: Locale, value: string): string {
  if (!value) return value;
  if (locale === "zh" || locale === "ja") return value;
  if (locale === "ko") return SHENSHA_KO[value] || SHENSHA_EN[value] || value;
  return SHENSHA_EN[value] || value;
}

/** 神煞柱位标签（年支 / 月干 等）。 */
const POS_EN: Record<string, string> = {
  年干: "Year stem", 月干: "Month stem", 日干: "Day stem", 时干: "Hour stem",
  年支: "Year branch", 月支: "Month branch", 日支: "Day branch", 时支: "Hour branch",
};
const POS_KO: Record<string, string> = {
  年干: "년간", 月干: "월간", 日干: "일간", 时干: "시간",
  年支: "년지", 月支: "월지", 日支: "일지", 时支: "시지",
};

export function shenshaPosLabel(locale: Locale, value: string): string {
  if (!value) return value;
  if (locale === "zh" || locale === "ja") return value;
  if (locale === "ko") return POS_KO[value] || value;
  return POS_EN[value] || value;
}

// ---------------------------------------------------------------------------
// 五行颜色与天干/地支五行映射（与引擎表保持一致）
// ---------------------------------------------------------------------------

export const GAN_ELEMENT: Record<string, ElementKey> = {
  甲: "wood",
  乙: "wood",
  丙: "fire",
  丁: "fire",
  戊: "earth",
  己: "earth",
  庚: "metal",
  辛: "metal",
  壬: "water",
  癸: "water",
};

export const ZHI_ELEMENT: Record<string, ElementKey> = {
  子: "water",
  丑: "earth",
  寅: "wood",
  卯: "wood",
  辰: "earth",
  巳: "fire",
  午: "fire",
  未: "earth",
  申: "metal",
  酉: "metal",
  戌: "earth",
  亥: "water",
};

/** 五行主题色（暗色背景上的可读版本） */
export const ELEMENT_COLORS: Record<ElementKey, string> = {
  metal: "#d8c9a3",
  wood: "#8fbf7f",
  water: "#7fa8d9",
  fire: "#e08a6d",
  earth: "#cbb26a",
};
