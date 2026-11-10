"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { FileDown } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { getBaziPdfMessages } from "@/lib/bazi-pdf-i18n";
import {
  getChartMessages,
  shishenLabel,
  shenshaLabel,
  shenshaPosLabel,
  GAN_ELEMENT,
} from "@/lib/chart-i18n";
import type { BaziChartData } from "./BaziChart";
import { SHOP_PRODUCTS } from "@/lib/shop-data";
import { recommendTalismans } from "@/lib/talisman-match";
import { getTalismanMessages, formatFacts, plainFor } from "@/lib/talisman-i18n";

/**
 * 八字命书 · PDF 导出
 *
 * 做法：把命书排成一份 A4 打印稿（封面 + 四柱命盘 + 大运 + 神煞 + 正文），
 * 用 createPortal 挂到 body 上，点按钮调用浏览器打印 → 用户在打印窗口选
 * 「另存为 PDF」就得到矢量文字、可搜索、体积小的真 PDF。
 *
 * 为什么不用 jsPDF/html2canvas：中文字体包动辄 10MB+，canvas 转图又会
 * 糊字、不可选中。打印这条路径零依赖、中文原生渲染，素质反而最好。
 */

const SERIF =
  '"Songti SC", "Source Han Serif SC", "Noto Serif SC", STSong, SimSun, "Times New Roman", serif';
const INK = "#1c1b18";
const MUTED = "#5f5a50";
const LINE = "#d8d2c2";
const GOLD = "#8a6a2f";

export interface BaziPdfLabels {
  name: string;
  gender: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  male: string;
  female: string;
  disclaimer: string;
  reportTitle: string;
}

interface Props {
  locale: Locale;
  labels: BaziPdfLabels;
  form: {
    name?: string;
    birthDate: string;
    birthTime?: string;
    place?: string;
    gender: string;
    focus?: string;
  };
  report: string;
  chart: BaziChartData | null;
  tier: "free" | "full";
}

/** 报告正文里像小标题的行：中文序号 / 【】/ Markdown 标题 */
function isHeading(line: string) {
  return /^([一二三四五六七八九十]+[、.．]|第[一二三四五六七八九十]+[章节]|【|#{1,4}\s|\*\*[^*]{2,30}\*\*\s*$)/.test(
    line
  );
}

/** 去掉正文里的 Markdown 记号，打印稿只留纯文字 */
function cleanLine(line: string) {
  return line
    .replace(/^#{1,6}\s*/, "")
    .replace(/^\*\*(.+?)\*\*\s*$/, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^[-*]\s+/, "· ")
    .trim();
}

export function BaziPdfExport({ locale, labels, form, report, chart, tier }: Props) {
  const pdf = getBaziPdfMessages(locale);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!report) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => window.print()}
        title={pdf.pdfHint}
        className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs text-accent transition hover:bg-accent/20"
      >
        <FileDown size={12} /> {pdf.pdfButton}
      </button>
      {mounted &&
        createPortal(
          <PrintDocument
            locale={locale}
            labels={labels}
            form={form}
            report={report}
            chart={chart}
            tier={tier}
          />,
          document.body
        )}
    </>
  );
}

function PrintDocument({ locale, labels, form, report, chart, tier }: Props) {
  const pdf = getBaziPdfMessages(locale);
  const cm = getChartMessages(locale);
  const generatedAt = new Date().toLocaleDateString(locale === "zh" ? "zh-CN" : locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // 姓名已在封面居中大字显示，信息表里不再重复
  const info: Array<[string, string]> = [];
  info.push([labels.gender, form.gender === "male" ? labels.male : labels.female]);
  if (chart?.solarText) info.push([pdf.solar, chart.solarText]);
  if (chart?.lunarText) info.push([pdf.lunar, chart.lunarText]);
  if (form.place) info.push([labels.birthPlace, form.place]);
  if (chart?.trueSolar?.applied && chart.trueSolar.trueTime) {
    const ts = chart.trueSolar;
    info.push([
      cm.tsTitle,
      (ts.clockTime ? ts.clockTime + " → " + ts.trueTime : ts.trueTime) +
        (ts.matched ? "（" + ts.matched + "）" : ""),
    ]);
  }
  if (chart?.qiyunText) info.push([cm.qiyun, chart.qiyunText]);
  info.push([pdf.generated, generatedAt + (tier === "full" ? "" : " · free")]);

  const pillarKeys: Array<"year" | "month" | "day" | "hour"> = ["year", "month", "day", "hour"];
  const pillarTitles = [cm.colYear, cm.colMonth, cm.colDay, cm.colHour];

  const lines = report
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const tm = getTalismanMessages(locale);
  const talismans = chart
    ? (recommendTalismans(chart, form.focus || "general")
        .map((p) => {
          const product = SHOP_PRODUCTS.find((x) => x.id === p.id);
          return product ? { product, facts: p.facts } : null;
        })
        .filter(Boolean) as Array<{
        product: (typeof SHOP_PRODUCTS)[number];
        facts: any[];
      }>)
    : [];

  const th: CSSProperties = {
    padding: "6px 8px",
    border: "1px solid " + LINE,
    background: "#f6f3ea",
    color: MUTED,
    fontWeight: 400,
    fontSize: "10.5pt",
    textAlign: "center",
    verticalAlign: "middle",
  };
  const td: CSSProperties = {
    padding: "7px 6px",
    border: "1px solid " + LINE,
    textAlign: "center",
    verticalAlign: "middle",
    fontSize: "12pt",
  };

  return (
    <div
      id="bazi-print-doc"
      dir={locale === "ar" ? "rtl" : "ltr"}
      style={{
        fontFamily: SERIF,
        color: INK,
        background: "#fff",
        fontSize: "11pt",
        lineHeight: 1.9,
      }}
    >
      {/* ---------------- 封面 ---------------- */}
      <section className="pdf-cover" style={{ padding: "18mm 0 0" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            borderBottom: "1px solid " + GOLD,
            paddingBottom: 10,
          }}
        >
          <span style={{ letterSpacing: "0.42em", fontSize: "10.5pt", color: GOLD }}>
            {locale === "zh" ? "痕 迹" : "T R A C E S"}
          </span>
          <span style={{ letterSpacing: "0.18em", fontSize: "9pt", color: MUTED }}>
            {tier === "full" ? "FULL READING" : "READING"}
          </span>
        </div>

        <h1
          style={{
            margin: "26mm 0 0",
            fontSize: "34pt",
            fontWeight: 500,
            letterSpacing: "0.22em",
            lineHeight: 1.35,
            textAlign: "center",
          }}
        >
          {pdf.docTitle}
        </h1>
        <p
          style={{
            margin: "4mm 0 0",
            textAlign: "center",
            color: MUTED,
            letterSpacing: "0.28em",
            fontSize: "9.5pt",
          }}
        >
          {pdf.docSubtitle}
        </p>

        {form.name && (
          <p style={{ margin: "12mm 0 0", textAlign: "center", fontSize: "15pt", letterSpacing: "0.1em" }}>
            {form.name}
          </p>
        )}

        <table style={{ margin: "16mm auto 0", borderCollapse: "collapse", fontSize: "10.5pt" }}>
          <tbody>
            {info.map(([k, v], i) => (
              <tr key={i}>
                <td style={{ padding: "4px 18px 4px 0", color: MUTED, whiteSpace: "nowrap", verticalAlign: "top" }}>
                  {k}
                </td>
                <td style={{ padding: "4px 0", color: INK }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p
          style={{
            position: "relative",
            marginTop: "30mm",
            paddingTop: 10,
            borderTop: "1px solid " + LINE,
            fontSize: "8.5pt",
            lineHeight: 1.7,
            color: MUTED,
          }}
        >
          {labels.disclaimer}
        </p>
      </section>

      {/* ---------------- 四柱命盘 ---------------- */}
      {chart && (
        <section style={{ breakBefore: "page", pageBreakBefore: "always" }}>
          <h2 style={{ fontSize: "14pt", fontWeight: 500, letterSpacing: "0.12em", margin: "0 0 4mm" }}>
            {cm.title} · {pdf.docTitle}
          </h2>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              tableLayout: "fixed",
            }}
            className="pdf-keep"
          >
            <thead>
              <tr>
                <th style={{ ...th, width: "18%" }} />
                {pillarTitles.map((t, i) => (
                  <th key={i} style={th}>
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...td, background: "#fbf9f3", color: MUTED, fontSize: "9.5pt" }}>{cm.shishen}</td>
                {pillarKeys.map((k) => (
                  <td key={k} style={{ ...td, fontSize: "10pt", color: MUTED }}>
                    {chart.pillars?.[k] ? shishenLabel(locale, chart.pillars[k].shishen) : "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ ...td, background: "#fbf9f3", fontSize: "26pt", lineHeight: 1.2 }} />
                {pillarKeys.map((k) => (
                  <td key={k} style={{ ...td, fontSize: "24pt", lineHeight: 1.25 }}>
                    {chart.pillars?.[k]?.gan || "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ ...td, background: "#fbf9f3", fontSize: "26pt", lineHeight: 1.2 }} />
                {pillarKeys.map((k) => (
                  <td key={k} style={{ ...td, fontSize: "24pt", lineHeight: 1.25 }}>
                    {chart.pillars?.[k]?.zhi || "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ ...td, background: "#fbf9f3", color: MUTED, fontSize: "9.5pt" }}>{cm.canggan}</td>
                {pillarKeys.map((k) => (
                  <td key={k} style={{ ...td, fontSize: "9.5pt", color: MUTED }}>
                    {chart.pillars?.[k]?.canggan || "—"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          <p style={{ margin: "4mm 0 0", fontSize: "10pt", color: MUTED, lineHeight: 1.9 }}>
            {cm.dayMaster}：{chart.dayMaster?.gan}
            {chart.dayMaster?.element ? "（" + cm.el[chart.dayMaster.element] + "）" : ""}
            {"　·　"}
            {cm.elements}：
            {(["wood", "fire", "earth", "metal", "water"] as const)
              .map((el) => cm.el[el] + " " + (chart.elements?.[el] ?? 0))
              .join(" / ")}
            {"　·　"}
            {chart.currentYear} {chart.currentGz}
            {"　·　"}
            {chart.qiyunText}
          </p>

          {/* 大运 */}
          {chart.dayun && chart.dayun.length > 0 && (
            <div className="pdf-keep" style={{ marginTop: "7mm" }}>
              <h3 style={{ fontSize: "11.5pt", fontWeight: 500, margin: "0 0 2.5mm", letterSpacing: "0.08em" }}>
                {cm.dayun}
              </h3>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <tbody>
                  {[0, 1].map((row) => {
                    const slice = chart.dayun.slice(row * 4, row * 4 + 4);
                    if (!slice.length) return null;
                    return (
                      <tr key={row}>
                        {slice.map((d, i) => (
                          <td key={i} style={{ ...td, padding: "5px 4px", fontSize: "9pt", lineHeight: 1.5 }}>
                            <div style={{ color: MUTED, fontSize: "8pt" }}>{d.ages}</div>
                            <div style={{ fontSize: "12pt" }}>{d.gz}</div>
                            <div style={{ color: MUTED, fontSize: "8pt" }}>{d.seq}</div>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 神煞 */}
          {chart.shensha && chart.shensha.length > 0 && (
            <div className="pdf-keep" style={{ marginTop: "7mm" }}>
              <h3 style={{ fontSize: "11.5pt", fontWeight: 500, margin: "0 0 2.5mm", letterSpacing: "0.08em" }}>
                {cm.ssTitle}
              </h3>
              <div style={{ fontSize: "9.5pt", lineHeight: 1.9, color: INK }}>
                {chart.shensha
                  .map(
                    (s) =>
                      shenshaLabel(locale, s.name) +
                      (s.positions && s.positions.length
                        ? "（" + s.positions.map((p) => shenshaPosLabel(locale, p)).join("、") + "）"
                        : "")
                  )
                  .join("　·　")}
              </div>
            </div>
          )}

          {/* 正文 */}
          <div style={{ marginTop: "8mm" }}>
            <h3 style={{ fontSize: "11.5pt", fontWeight: 500, margin: "0 0 3mm", letterSpacing: "0.08em" }}>
              {labels.reportTitle}
            </h3>
            {lines.map((raw, i) => {
              const line = cleanLine(raw);
              if (!line) return null;
              if (isHeading(raw)) {
                return (
                  <h4
                    key={i}
                    style={{
                      fontSize: "11pt",
                      fontWeight: 600,
                      margin: "5mm 0 2mm",
                      color: GOLD,
                      breakAfter: "avoid",
                    }}
                  >
                    {line}
                  </h4>
                );
              }
              return (
                <p key={i} style={{ margin: "0 0 2.2mm", textAlign: "justify" }}>
                  {line}
                </p>
              );
            })}
          </div>

          {talismans.length > 0 && (
            <div className="pdf-keep" style={{ marginTop: "9mm" }}>
              <h3
                style={{
                  fontSize: "11.5pt",
                  fontWeight: 500,
                  margin: "0 0 3mm",
                  letterSpacing: "0.08em",
                }}
              >
                {tm.title}
              </h3>
              {talismans.map(({ product, facts }, i) => (
                <div
                  key={i}
                  style={{
                    margin: "0 0 3.5mm",
                    padding: "3mm 4mm",
                    border: "1px solid " + LINE,
                    background: "#fbf9f3",
                  }}
                >
                  <div style={{ fontSize: "11pt", fontWeight: 600, letterSpacing: "0.04em" }}>
                    {locale === "zh" ? product.nameZh : product.name}
                  </div>
                  <p style={{ margin: "1.5mm 0 1mm", fontSize: "9.5pt", lineHeight: 1.85 }}>
                    {plainFor(locale, product.id, facts)}
                  </p>
                  <p style={{ margin: 0, fontSize: "8pt", color: MUTED }}>
                    {tm.basis}：{formatFacts(locale, facts)}
                  </p>
                </div>
              ))}
              <p style={{ margin: 0, fontSize: "8pt", color: MUTED, lineHeight: 1.7 }}>{tm.note}</p>
            </div>
          )}

          <p
            style={{
              marginTop: "6mm",
              paddingTop: 8,
              borderTop: "1px solid " + LINE,
              // 别让页脚孤零零掉到新一页
              breakBefore: "avoid",
              pageBreakBefore: "avoid",
              fontSize: "8pt",
              color: MUTED,
              textAlign: "center",
              letterSpacing: "0.08em",
            }}
          >
            {pdf.brandLine} · mingli-club.app.workbuddy.host · {pdf.generated} {generatedAt}
          </p>
        </section>
      )}
    </div>
  );
}
