"use client";

/**
 * 紫微斗数十二宫命盘（4×4 传统布局）。
 *
 * 位置固定按地支排（不是按数据顺序）：
 *   巳 午 未 申
 *   辰 中 中 酉
 *   卯 中 中 戌
 *   寅 丑 子 亥
 * 中间 2×2 放基本信息（性别 / 五行局 / 命主身主 / 农历 / 真太阳时）。
 *
 * 手机上格子太密，做横向滚动（min-w 680px），不硬压成两列——十二宫的位置关系
 * 本身就是信息，重排会让懂盘的人看着别扭。
 */

import { Locale } from "@/lib/i18n";
import { getZiweiMessages, palaceLabel, starGloss } from "@/lib/ziwei-i18n";

export type ZiweiStar = { name: string; type: string; brightness?: string };
export type ZiweiPalace = {
  index: number;
  branch: string;
  stem: string;
  name: string;
  isMingGong: boolean;
  isShenGong: boolean;
  stars: string[];
  daxian: number[];
  starDetail: ZiweiStar[];
};
export type ZiweiChartData = {
  trueSolar?: { corrected?: boolean; timeText?: string; totalCorrection?: number };
  lunarText?: string;
  yearGZ?: string;
  timeZhi?: string;
  yinYangGender?: string;
  wuxingJu?: string;
  mingZhu?: string;
  shenZhu?: string;
  soulPalace?: { branch?: string };
  bodyPalace?: { branch?: string };
  palaces: ZiweiPalace[];
};

/** 地支 → 4×4 网格位置（行, 列） */
const GRID: Record<string, { r: number; c: number }> = {
  巳: { r: 1, c: 1 },
  午: { r: 1, c: 2 },
  未: { r: 1, c: 3 },
  申: { r: 1, c: 4 },
  辰: { r: 2, c: 1 },
  酉: { r: 2, c: 4 },
  卯: { r: 3, c: 1 },
  戌: { r: 3, c: 4 },
  寅: { r: 4, c: 1 },
  丑: { r: 4, c: 2 },
  子: { r: 4, c: 3 },
  亥: { r: 4, c: 4 },
};

const BRIGHT_GOOD = new Set(["庙", "旺"]);
const BRIGHT_WEAK = new Set(["平", "陷"]);

export function ZiweiChart({ chart, locale }: { chart: ZiweiChartData; locale: Locale }) {
  const t = getZiweiMessages(locale);
  const palaces = chart.palaces || [];

  return (
    <div className="w-full overflow-x-auto">
      <div className="mx-auto grid w-[700px] grid-cols-4 grid-rows-4 gap-1.5 sm:w-[820px] sm:gap-2">
        {palaces.map((p) => {
          const pos = GRID[p.branch] || { r: 1, c: 1 };
          const main = (p.starDetail || []).filter((s) => s.type === "主星");
          const aux = (p.starDetail || []).filter((s) => s.type !== "主星");
          return (
            <div
              key={p.branch + p.name}
              style={{ gridRow: pos.r, gridColumn: pos.c }}
              className={`relative min-h-[112px] rounded-lg border p-2 sm:min-h-[126px] sm:p-2.5 ${
                p.isMingGong
                  ? "border-accent/45 bg-accent/[0.07]"
                  : "border-white/[0.07] bg-white/[0.02]"
              }`}
            >
              {/* 宫名 + 干支 */}
              <div className="flex items-baseline justify-between gap-1">
                <span className={`text-[11.5px] ${p.isMingGong ? "text-accent" : "text-muted/85"}`}>
                  {palaceLabel(locale, p.name)}
                  {p.isMingGong && <span className="ms-1 text-[9px] text-accent/70">◆</span>}
                  {p.isShenGong && <span className="ms-1 text-[9px] text-sky-300/80">◎</span>}
                </span>
                <span className="font-mono text-[9px] text-muted/40">
                  {p.stem}
                  {p.branch}
                </span>
              </div>

              {/* 主星 */}
              <div className="mt-1 space-y-0.5">
                {main.map((s) => (
                  <div key={"m" + s.name} className="flex items-baseline gap-1">
                    <span
                      className={`text-[12px] sm:text-[13px] ${
                        BRIGHT_GOOD.has(s.brightness || "")
                          ? "text-accent"
                          : BRIGHT_WEAK.has(s.brightness || "")
                            ? "text-muted/65"
                            : "text-foreground/90"
                      }`}
                    >
                      {s.name}
                      {s.brightness && (
                        <span
                          className={`ms-0.5 text-[10px] ${
                            BRIGHT_GOOD.has(s.brightness)
                              ? "text-accent/70"
                              : BRIGHT_WEAK.has(s.brightness)
                                ? "text-muted/45"
                                : "text-foreground/50"
                          }`}
                        >
                          {s.brightness}
                        </span>
                      )}
                    </span>
                    {starGloss(locale, s.name) && (
                      <span className="text-[8.5px] text-muted/35">{starGloss(locale, s.name)}</span>
                    )}
                  </div>
                ))}
                {main.length === 0 && <span className="text-[10px] text-muted/35">—</span>}
              </div>

              {/* 辅星：吉星偏金、煞星偏琥珀 */}
              <div className="mt-1 flex flex-wrap gap-x-1.5 gap-y-0.5">
                {aux.map((s) => (
                  <span
                    key={"a" + s.name}
                    className={`text-[10px] sm:text-[10.5px] ${
                      s.type === "煞" ? "text-amber-300/75" : "text-sky-200/65"
                    }`}
                  >
                    {s.name}
                  </span>
                ))}
              </div>

              {/* 大限 */}
              {p.daxian && p.daxian.length === 2 && (
                <span className="absolute bottom-1 end-1.5 font-mono text-[9.5px] text-muted/40">
                  {p.daxian[0]}–{p.daxian[1]}
                </span>
              )}
            </div>
          );
        })}

        {/* 中间：基本信息 */}
        <div
          style={{ gridRow: "2 / span 2", gridColumn: "2 / span 2" }}
          className="flex flex-col justify-center gap-1.5 rounded-lg border border-accent/15 bg-accent/[0.03] p-3 text-center sm:p-4"
        >
          <p className="font-serif text-lg text-accent">
            {chart.yinYangGender || ""}
          </p>
          <p className="text-[12px] text-foreground/85">{chart.wuxingJu}</p>
          <div className="mx-auto mt-0.5 h-px w-10 bg-accent/25" />
          <p className="text-[11.5px] text-muted">
            {t.soulStar} {chart.mingZhu} · {t.bodyStar} {chart.shenZhu}
          </p>
          <p className="text-[11.5px] text-muted/70">
            {t.lunarDate} {chart.lunarText}
          </p>
          {chart.trueSolar && chart.trueSolar.corrected && (
            <p className="text-[11.5px] text-muted/60">
              {t.trueSolar} {chart.trueSolar.timeText}
            </p>
          )}
          <p className="mt-1 text-[10.5px] text-muted/50">
            {t.yearGZ} {chart.yearGZ} · {t.hourZhi} {chart.timeZhi}
          </p>
          <p className="mt-1 text-[10px] text-muted/45">◆ {t.lifePalace} · ◎ {t.bodyPalace}</p>
        </div>
      </div>
    </div>
  );
}
