/**
 * 八字「导出 PDF」专属文案（10 语言）。
 *
 * 只放 PDF 独有的 6 句话 —— 表格里的柱名/十神/藏干/五行/神煞标签
 * 复用 lib/chart-i18n.ts 的 ChartMessages，字段名复用 lib/i18n.ts 的 bazi.*，
 * 避免同一句话在三个地方各维护一份。
 */
import type { Locale } from "./i18n";

export interface BaziPdfMessages {
  /** 按钮文字 */
  pdfButton: string;
  /** 按钮说明（提示在打印窗口里选「另存为 PDF」） */
  pdfHint: string;
  /** 封面主标题 */
  docTitle: string;
  /** 封面副标题 */
  docSubtitle: string;
  /** 「生成于」 */
  generated: string;
  /** 公历标签 */
  solar: string;
  /** 农历标签 */
  lunar: string;
  /** 页脚品牌行 */
  brandLine: string;
}

const ALL: Record<string, BaziPdfMessages> = {
  en: {
    pdfButton: "Save as PDF",
    pdfHint: "In the print dialog, choose “Save as PDF” as the destination.",
    docTitle: "BaZi Reading",
    docSubtitle: "Four Pillars · Ten Gods · Luck Pillars",
    generated: "Generated",
    solar: "Solar",
    lunar: "Lunar",
    brandLine: "Traces · a reference to traditional culture",
  },
  zh: {
    pdfButton: "保存为 PDF",
    pdfHint: "在打印窗口里把目标选成「另存为 PDF」，即可存成文件。",
    docTitle: "八字命书",
    docSubtitle: "四柱 · 十神 · 大运",
    generated: "生成于",
    solar: "公历",
    lunar: "农历",
    brandLine: "痕迹 Traces · 传统文化参照",
  },
  ja: {
    pdfButton: "PDF として保存",
    pdfHint: "印刷ダイアログで「PDF に保存」を選んでください。",
    docTitle: "八字命書",
    docSubtitle: "四柱 · 十神 · 大運",
    generated: "作成日",
    solar: "新暦",
    lunar: "旧暦",
    brandLine: "痕跡 Traces · 伝統文化の参照",
  },
  ko: {
    pdfButton: "PDF로 저장",
    pdfHint: "인쇄 창에서 대상을 「PDF로 저장」으로 선택하세요.",
    docTitle: "사주 명서",
    docSubtitle: "사주 · 십신 · 대운",
    generated: "생성일",
    solar: "양력",
    lunar: "음력",
    brandLine: "흔적 Traces · 전통 문화 참조",
  },
  es: {
    pdfButton: "Guardar como PDF",
    pdfHint: "Elige «Guardar como PDF» como destino en el diálogo de impresión.",
    docTitle: "Lectura BaZi",
    docSubtitle: "Cuatro Pilares · Diez Dioses · Pilares de Suerte",
    generated: "Generado",
    solar: "Solar",
    lunar: "Lunar",
    brandLine: "Traces · referencia cultural tradicional",
  },
  fr: {
    pdfButton: "Enregistrer en PDF",
    pdfHint: "Choisissez « Enregistrer au format PDF » comme destination dans la boîte d'impression.",
    docTitle: "Lecture BaZi",
    docSubtitle: "Quatre Piliers · Dix Dieux · Piliers de Chance",
    generated: "Généré",
    solar: "Solaire",
    lunar: "Lunaire",
    brandLine: "Traces · référence culturelle traditionnelle",
  },
  de: {
    pdfButton: "Als PDF speichern",
    pdfHint: "Wähle im Druckdialog „Als PDF speichern“ als Ziel.",
    docTitle: "BaZi-Lesung",
    docSubtitle: "Vier Säulen · Zehn Götter · Glückssäulen",
    generated: "Erstellt",
    solar: "Solar",
    lunar: "Lunar",
    brandLine: "Traces · traditionelle Kultur als Referenz",
  },
  pt: {
    pdfButton: "Salvar como PDF",
    pdfHint: "Escolha «Salvar como PDF» como destino na janela de impressão.",
    docTitle: "Leitura BaZi",
    docSubtitle: "Quatro Pilares · Dez Deuses · Pilares de Sorte",
    generated: "Gerado",
    solar: "Solar",
    lunar: "Lunar",
    brandLine: "Traces · referência cultural tradicional",
  },
  ru: {
    pdfButton: "Сохранить в PDF",
    pdfHint: "В окне печати выберите «Сохранить как PDF» в качестве принтера.",
    docTitle: "Чтение Бацзы",
    docSubtitle: "Четыре столпа · Десять богов · Столпы удачи",
    generated: "Создано",
    solar: "Солнечный",
    lunar: "Лунный",
    brandLine: "Traces · отсылка к традиционной культуре",
  },
  ar: {
    pdfButton: "حفظ بصيغة PDF",
    pdfHint: "اختر «حفظ بصيغة PDF» كوجهة في نافذة الطباعة.",
    docTitle: "قراءة البازي",
    docSubtitle: "الأعمدة الأربعة · الآلهة العشرة · أعمدة الحظ",
    generated: "أُنشئ في",
    solar: "ميلادي",
    lunar: "قمري",
    brandLine: "Traces · مرجع ثقافي تقليدي",
  },
};

export function getBaziPdfMessages(locale: Locale | string): BaziPdfMessages {
  return ALL[locale] || ALL.en;
}
