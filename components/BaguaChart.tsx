"use client";

import { Locale } from "@/lib/i18n";
import { getBaguaMessages, hexName, trigramLine, yaoPosLabel, BaguaHex } from "@/lib/bagua-i18n";

export interface BaguaLine {
  pos: number;
  value: number;
  yang: boolean;
  moving: boolean;
  coins: string[] | null;
  stalks?: number[] | null;
}

export interface BaguaDrawData {
  question?: string;
  method?: string;
  lines: BaguaLine[];
  ben: BaguaHex;
  bian: BaguaHex | null;
  movingYao: { pos: number; posName: string; title: string; text: string; value: number }[];
  oddUse: { title: string; text: string } | null;
}

/** 一行的六爻横线（阳=整条；阴=断开；动爻右侧标 ○/×）。 */
function LineBar({ yang, tone }: { yang: boolean; tone: "accent" | "muted" }) {
  const cls = tone === "accent" ? "bg-accent/70" : "bg-muted/45";
  if (yang) return <div className={`h-[7px] flex-1 rounded-[2px] ${cls}`} />;
  return (
    <div className="flex flex-1 gap-[9px]">
      <div className={`h-[7px] flex-1 rounded-[2px] ${cls}`} />
      <div className={`h-[7px] flex-1 rounded-[2px] ${cls}`} />
    </div>
  );
}

/** 文王卦象卡片（页面与对话共用）。 */
export function BaguaChart({ draw, locale }: { draw: BaguaDrawData; locale: Locale }) {
  const m = getBaguaMessages(locale);
  const hasBian = !!draw.bian;
  // 自上而下渲染（上爻在最上）
  const benRows = draw.lines.slice().reverse();

  return (
    <div className="glass glow rounded-2xl p-5 sm:p-6">
      {/* 起卦法 */}
      <div className="mb-3 text-[10px] tracking-wide text-muted/55">
        {m.methodLabel} · {draw.method === "yarrow" ? m.methodYarrow : m.methodCoin}
      </div>

      {/* 卦名区：本卦（+ 变卦） */}
      <div className={`grid gap-4 ${hasBian ? "grid-cols-2" : "grid-cols-1"}`}>
        <div className="rounded-xl border border-accent/20 bg-accent/[0.03] p-4">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
            <span className="text-[10px] tracking-widest text-accent/80">{m.ben}</span>
            <span className="text-[10px] text-muted/60">{trigramLine(locale, draw.ben)}</span>
          </div>
          <div className="mb-3 flex items-center gap-3">
            <span className="font-serif text-3xl leading-none text-accent">{draw.ben.sym}</span>
            <span className="font-serif text-lg leading-tight text-foreground">{hexName(locale, draw.ben)}</span>
          </div>
          <div className="space-y-[6px]">
            {benRows.map((l) => (
              <div
                key={l.pos}
                className="flex items-center gap-2"
                title={
                  yaoPosLabel(locale, l.pos) +
                  " · " +
                  (l.stalks
                    ? l.stalks.join("→") + " → " + l.value
                    : (l.coins || []).join(" ")) +
                  (l.moving ? " · " + m.movingTag : "")
                }
              >
                <LineBar yang={l.yang} tone="accent" />
                <span className="w-3 shrink-0 text-center text-[11px] leading-none text-amber-300/90">
                  {l.moving ? l.value === 9 ? "○" : "×" : <span className="opacity-0">·</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        {hasBian && draw.bian && (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
              <span className="text-[10px] tracking-widest text-muted/70">{m.bian}</span>
              <span className="text-[10px] text-muted/50">{trigramLine(locale, draw.bian)}</span>
            </div>
            <div className="mb-3 flex items-center gap-3">
              <span className="font-serif text-3xl leading-none text-muted">{draw.bian.sym}</span>
              <span className="font-serif text-lg leading-tight text-muted">{hexName(locale, draw.bian)}</span>
            </div>
            <div className="space-y-[6px]">
              {benRows.map((l) => (
                <div key={l.pos} className="flex items-center gap-2">
                  <LineBar yang={l.moving ? !l.yang : l.yang} tone="muted" />
                  <span className="w-3 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 卦辞 / 大象 */}
      <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-4 text-sm leading-relaxed">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="rounded-md border border-accent/20 bg-accent/[0.05] px-1.5 py-0.5 text-[10px] text-accent/80">
            {m.guaCi}
          </span>
          <span className="text-foreground/90">{draw.ben.gua}</span>
        </div>
        {draw.ben.xiang && (
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="rounded-md border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-muted/70">
              {m.daXiang}
            </span>
            <span className="text-muted">{draw.ben.xiang}</span>
          </div>
        )}
        {hasBian && draw.bian?.gua && (
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="rounded-md border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-muted/70">
              {m.bian} · {m.guaCi}
            </span>
            <span className="text-muted">{draw.bian.gua}</span>
          </div>
        )}
      </div>

      {/* 动爻爻辞 */}
      <div className="mt-3 border-t border-white/[0.06] pt-4">
        {draw.movingYao.length > 0 ? (
          <div className="space-y-2">
            <div className="text-[10px] tracking-widest text-amber-300/70">
              {m.dongYao} · {draw.movingYao.length}
            </div>
            {draw.movingYao.map((y) => (
              <div key={y.pos} className="text-sm leading-relaxed">
                <span className="mr-2 text-[11px] text-amber-200/80">{y.title || y.posName}</span>
                <span className="text-foreground/85">{y.text}</span>
              </div>
            ))}
            {draw.oddUse && (
              <div className="text-sm leading-relaxed">
                <span className="mr-2 rounded-md border border-amber-400/20 px-1.5 py-0.5 text-[10px] text-amber-200/80">
                  {m.oddUse}
                </span>
                <span className="text-foreground/85">
                  {draw.oddUse.title}：{draw.oddUse.text}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-[11px] text-muted/70">{m.noMoving}</div>
        )}
      </div>
    </div>
  );
}
