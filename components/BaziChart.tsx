"use client";

import { Sparkles } from "lucide-react";
import { Locale } from "@/lib/i18n";
import {
  getChartMessages,
  shishenLabel,
  shenshaLabel,
  shenshaPosLabel,
  GAN_ELEMENT,
  ZHI_ELEMENT,
  ELEMENT_COLORS,
  ElementKey,
} from "@/lib/chart-i18n";

export interface BaziTrueSolar {
  applied: boolean;
  place?: string;
  reason?: string;
  matched?: string;
  matchedParent?: string;
  longitude?: number;
  lngOffsetMin?: number;
  eotMin?: number;
  totalOffsetMin?: number;
  clockTime?: string;
  trueTime?: string;
  trueDate?: string;
  clockDate?: string;
  zhiFrom?: string;
  zhiTo?: string;
  dateShifted?: boolean;
  zhiShifted?: boolean;
  cnDstHint?: boolean;
}

export interface BaziShenshaItem {
  name: string;
  positions: string[];
  method: string;
  level: "good" | "neutral" | "bad" | string;
}

export interface BaziChartData {
  solarText: string;
  lunarText: string;
  shichenText: string;
  sex: string;
  zishi: string;
  forward: boolean;
  qiyunText: string;
  currentYear: number;
  currentGz: string;
  dayMaster: { gan: string; element: ElementKey | null };
  pillars: Record<"year" | "month" | "day" | "hour", { gan: string; zhi: string; shishen: string; canggan: string }>;
  elements: Record<ElementKey, number>;
  dayun: { seq: string; ages: string; gz: string }[];
  warnings?: string[];
  trueSolar?: BaziTrueSolar | null;
  shensha?: BaziShenshaItem[];
}

const PILLAR_ORDER: ("year" | "month" | "day" | "hour")[] = ["year", "month", "day", "hour"];
const EL_ORDER: ElementKey[] = ["metal", "wood", "water", "fire", "earth"];
const UNKNOWN = "未知";

export function BaziChart({ chart, locale }: { chart: BaziChartData; locale: Locale }) {
  const c = getChartMessages(locale);
  const fmt = (v?: string) => (!v || v === UNKNOWN ? "—" : v);
  const elColor = (ch: string, kind: "gan" | "zhi") => {
    const key = kind === "gan" ? GAN_ELEMENT[ch] : ZHI_ELEMENT[ch];
    return key ? ELEMENT_COLORS[key] : undefined;
  };
  const colLabels = { year: c.colYear, month: c.colMonth, day: c.colDay, hour: c.colHour };
  const hourUnknown = chart.pillars.hour.gan === UNKNOWN;
  const showBoundary = (chart.warnings || []).some(
    (w) => w.indexOf("节气") !== -1 || w.indexOf("立春") !== -1
  );

  return (
    <div className="mb-8 rounded-2xl border border-accent/15 bg-white/[0.015] p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-accent/20 bg-accent/10">
            <Sparkles size={15} className="text-accent" />
          </div>
          <div>
            <h4 className="font-serif text-lg text-accent">{c.title}</h4>
            <p className="text-[11px] text-muted">{c.note}</p>
          </div>
        </div>
        <p className="text-[11px] text-muted">
          {chart.solarText} · {chart.lunarText}
        </p>
      </div>

      {/* 真太阳时校正信息 */}
      {(() => {
        const ts = chart.trueSolar;
        if (!ts) return null;
        if (!ts.applied) {
          return ts.reason === "place_not_found" ? (
            <div className="mb-4 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5 text-[11px] leading-relaxed text-muted/70">
              {c.tsNotFound}
            </div>
          ) : null;
        }
        const sign = (v?: number) => {
          const r = Math.round((v || 0) * 10) / 10;
          return (r >= 0 ? "+" : "") + r;
        };
        const lngText =
          ts.longitude === undefined || ts.longitude === null
            ? ""
            : Math.abs(ts.longitude).toFixed(2) + (ts.longitude >= 0 ? "°E" : "°W");
        return (
          <div className="mb-4 rounded-xl border border-accent/12 bg-accent/[0.03] px-3.5 py-3 text-[11px] leading-relaxed">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-accent/90">{c.tsTitle}</span>
              <span className="text-muted/40">·</span>
              <span className="text-muted">
                {c.tsClock} {ts.clockTime} → {c.tsTrue}{" "}
                <span className="text-foreground/90">
                  {ts.trueDate && ts.trueDate !== ts.clockDate ? ts.trueDate + " " : ""}
                  {ts.trueTime}
                </span>
              </span>
              {lngText && (
                <span className="text-muted/50">
                  （{ts.matched}
                  {lngText ? " " + lngText : ""}）
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted/70">
              <span>
                {c.tsLng} {sign(ts.lngOffsetMin)}
                {c.tsMin}
              </span>
              <span>+</span>
              <span>
                {c.tsEot} {sign(ts.eotMin)}
                {c.tsMin}
              </span>
              <span>·</span>
              <span>
                {c.tsShift}: {ts.zhiFrom} → {ts.zhiTo}
              </span>
            </div>
            {ts.cnDstHint && <div className="mt-1 text-amber-300/70">{c.tsDst}</div>}
          </div>
        );
      })()}

      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {PILLAR_ORDER.map((k) => {
          const p = chart.pillars[k];
          const isDay = k === "day";
          return (
            <div
              key={k}
              className={`rounded-xl border px-1.5 py-2.5 text-center sm:px-2 sm:py-3 ${
                isDay
                  ? "border-accent/25 bg-accent/[0.04]"
                  : "border-white/[0.07] bg-white/[0.02]"
              }`}
            >
              <div className="text-[10px] tracking-widest text-muted">{colLabels[k]}</div>
              <div
                className="mt-2 font-serif text-xl leading-none sm:text-3xl"
                style={{ color: elColor(p.gan, "gan") }}
              >
                {fmt(p.gan)}
              </div>
              <div
                className="mt-1.5 font-serif text-xl leading-none sm:text-3xl"
                style={{ color: elColor(p.zhi, "zhi") }}
              >
                {fmt(p.zhi)}
              </div>
              <div className="mt-2 text-[10px] text-accent/90">{shishenLabel(locale, p.shishen)}</div>
              <div className="mt-1.5 text-[10px] leading-snug text-muted/70">{fmt(p.canggan)}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/[0.06] pt-4 text-xs text-muted sm:gap-x-6">
        <span>
          {c.dayMaster}:{" "}
          <span className="text-foreground">{chart.dayMaster.gan}</span>
          {chart.dayMaster.element && (
            <span className="ms-1" style={{ color: ELEMENT_COLORS[chart.dayMaster.element] }}>
              {c.el[chart.dayMaster.element]}
            </span>
          )}
        </span>
        <span>
          {c.qiyun}: <span className="text-foreground">{chart.qiyunText}</span>
          <span className="ms-1 text-muted/70">({chart.forward ? c.forward : c.reverse})</span>
        </span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {c.elements}:
          {EL_ORDER.map((k) =>
            chart.elements[k] > 0 ? (
              <span key={k} className="inline-flex items-center gap-1">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: ELEMENT_COLORS[k] }}
                />
                <span>
                  {c.el[k]} {chart.elements[k]}
                </span>
              </span>
            ) : null
          )}
        </span>
      </div>

      {chart.dayun && chart.dayun.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-[11px] text-muted">{c.dayun}</div>
          <div className="flex flex-wrap gap-2">
            {chart.dayun.map((d, i) => (
              <span
                key={i}
                className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-2.5 py-1 text-[11px] text-muted"
              >
                <span className="font-serif text-foreground/90">{d.gz}</span>
                <span className="ms-1.5 text-muted/70">{d.ages}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 神煞（按吉凶分组；悬停查看柱位与查法） */}
      {chart.shensha && chart.shensha.length > 0 && (() => {
        const groups = [
          {
            key: "good",
            label: c.ssGood,
            labelCls: "text-accent/80",
            chipCls: "border-accent/20 bg-accent/[0.05] text-accent/90",
          },
          {
            key: "neutral",
            label: c.ssNeutral,
            labelCls: "text-muted/60",
            chipCls: "border-white/[0.09] bg-white/[0.025] text-muted",
          },
          {
            key: "bad",
            label: c.ssBad,
            labelCls: "text-amber-300/60",
            chipCls: "border-amber-400/20 bg-amber-400/[0.04] text-amber-200/80",
          },
        ]
          .map((g) => ({ ...g, items: chart.shensha!.filter((s) => s.level === g.key) }))
          .filter((g) => g.items.length > 0);
        if (!groups.length) return null;
        const isCJK = locale === "zh" || locale === "ja" || locale === "ko";
        return (
          <div className="mt-4">
            <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[11px] text-muted">
              <span>{c.ssTitle}</span>
              <span className="text-[10px] text-muted/50">· {c.ssNote}</span>
            </div>
            <div className="space-y-1.5">
              {groups.map((g) => (
                <div key={g.key} className="flex flex-wrap items-center gap-1.5">
                  <span className={`w-8 shrink-0 text-[10px] ${g.labelCls}`}>{g.label}</span>
                  {g.items.map((s, i) => {
                    const pos = s.positions.map((p) => shenshaPosLabel(locale, p)).join("、");
                    const tip = isCJK ? pos + " · " + s.method : pos;
                    return (
                      <span
                        key={i}
                        title={tip}
                        className={`rounded-md border px-2 py-0.5 text-[11px] ${g.chipCls}`}
                      >
                        {shenshaLabel(locale, s.name)}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {hourUnknown && <p className="mt-4 text-[11px] text-amber-300/80">{c.hourUnknown}</p>}
      {showBoundary && <p className="mt-2 text-[11px] text-muted/70">{c.boundary}</p>}
    </div>
  );
}
