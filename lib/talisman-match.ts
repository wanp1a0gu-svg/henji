"use client";

import type { ElementKey } from "./chart-i18n";

/**
 * 符纸推荐：从命盘里取出**具体依据**，只推 1-2 个。
 *
 * 与上一版的区别：不再只给「助事业」这种标签，而是写明
 * 「日主甲木 · 财星土×1 · 比劫×3」这类可直接对照命盘的事实，
 * 让用户能自己判断推得对不对。
 *
 * 不用模型推荐：商店是固定 SKU，模型容易编符名或空口吹「最配你」。
 */

export type FactKey =
  | "dayMaster" // 日主
  | "wealthStar" // 财星（日主所克）
  | "officialStar" // 官星（克日主）
  | "sealStar" // 印星（生日主）
  | "peach" // 桃花位
  | "weakSelf" // 日主偏弱
  | "missingEl" // 五行缺
  | "excess" // 某行过旺
  | "clash"; // 流年冲日支

export interface Fact {
  k: FactKey;
  el?: ElementKey;
  n?: number;
  /** 仅 dayMaster 用：天干（甲/乙/…），便于渲染成「甲木」 */
  gan?: string;
}

export interface TalismanAdvice {
  id: string;
  score: number;
  /** 按重要性排序的依据，前端渲染成「命盘依据：…」 */
  facts: Fact[];
}

/** 五行生克：我克者为财，克我者为官，生我者为印，同我者为比劫。 */
const CONTROLS: Record<ElementKey, ElementKey> = {
  wood: "earth",
  earth: "water",
  water: "fire",
  fire: "metal",
  metal: "wood",
};
const GENERATES: Record<ElementKey, ElementKey> = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood",
};

/** 反查：谁克我 / 谁生我。 */
function controlledBy(el: ElementKey): ElementKey {
  return (Object.keys(CONTROLS) as ElementKey[]).find((k) => CONTROLS[k] === el) || "metal";
}
function generatedBy(el: ElementKey): ElementKey {
  return (Object.keys(GENERATES) as ElementKey[]).find((k) => GENERATES[k] === el) || "water";
}

const PEACH_BRANCH = ["子", "午", "卯", "酉"];
const CLASH: Record<string, string> = {
  子: "午", 午: "子", 丑: "未", 未: "丑", 寅: "申", 申: "寅",
  卯: "酉", 酉: "卯", 辰: "戌", 戌: "辰", 巳: "亥", 亥: "巳",
};

function countEl(elements: Record<string, number> | undefined, el: ElementKey): number {
  return Number((elements && elements[el]) || 0);
}

function totalEl(elements: Record<string, number> | undefined): number {
  if (!elements) return 0;
  return Object.values(elements).reduce((a: number, b: any) => a + Number(b || 0), 0);
}

/** 取命盘里最弱的五行（用于「缺」或「过弱」判断）。 */
function weakest(elements: Record<string, number> | undefined): ElementKey | null {
  const order: ElementKey[] = ["metal", "wood", "water", "fire", "earth"];
  let min: ElementKey | null = null;
  let v = Infinity;
  for (const k of order) {
    const n = countEl(elements, k);
    if (n < v) {
      v = n;
      min = k;
    }
  }
  return min;
}

/** 取命盘里最旺的五行。 */
function strongest(elements: Record<string, number> | undefined): ElementKey | null {
  const order: ElementKey[] = ["metal", "wood", "water", "fire", "earth"];
  let max: ElementKey | null = null;
  let v = -1;
  for (const k of order) {
    const n = countEl(elements, k);
    if (n > v) {
      v = n;
      max = k;
    }
  }
  return max;
}

/**
 * 生成 1-2 条推荐。
 * @param chart 八字命盘
 * @param focus 用户选择的关注方向
 */
export function recommendTalismans(chart: any, focus: string): TalismanAdvice[] {
  const elements = (chart && chart.elements) || {};
  const dmEl: ElementKey | null = (chart && chart.dayMaster && chart.dayMaster.element) || null;
  const total = totalEl(elements) || 1;

  if (!dmEl) return [];

  const gan = String((chart.dayMaster && chart.dayMaster.gan) || "");
  const wealthEl = CONTROLS[dmEl];
  const officialEl = controlledBy(dmEl);
  const sealEl = generatedBy(dmEl);

  const wealthN = countEl(elements, wealthEl);
  const officialN = countEl(elements, officialEl);
  const sealN = countEl(elements, sealEl);
  const selfN = countEl(elements, dmEl);
  const supportRatio = (selfN + sealN) / total; // 同类 + 印 = 生扶

  // 桃花：四柱地支里落子午卯酉的数量
  const branches = ["year", "month", "day", "hour"]
    .map((k) => String((chart.pillars && chart.pillars[k] && chart.pillars[k].zhi) || ""))
    .filter(Boolean);
  const peachN = branches.filter((z) => PEACH_BRANCH.includes(z)).length;

  // 流年冲日支
  const dayZhi = String((chart.pillars && chart.pillars.day && chart.pillars.day.zhi) || "");
  const gz = String(chart.currentGz || "");
  const yearZhi = gz.length >= 2 ? gz.slice(1) : "";
  const clash = !!(dayZhi && yearZhi && CLASH[dayZhi] === yearZhi);

  const weak = weakest(elements);
  const strong = strongest(elements);
  const dayFact: Fact = { k: "dayMaster", el: dmEl, gan };

  const picks: { id: string; score: number; facts: Fact[] }[] = [];

  /* ---------- 财：财星弱或比劫夺财 ---------- */
  if (focus === "wealth" || wealthN <= 1) {
    const score = (focus === "wealth" ? 10 : 4) + (wealthN <= 1 ? 3 : 0);
    picks.push({
      id: "caishen",
      score,
      facts: [
        dayFact,
        { k: "wealthStar", el: wealthEl, n: wealthN },
        ...(selfN >= 3 ? ([{ k: "excess", el: dmEl, n: selfN }] as Fact[]) : []),
      ],
    });
  }

  /* ---------- 事业：官星弱 ---------- */
  if (focus === "career" || officialN <= 1) {
    const score = (focus === "career" ? 10 : 3) + (officialN <= 1 ? 3 : 0);
    picks.push({
      id: "shiye",
      score,
      facts: [dayFact, { k: "officialStar", el: officialEl, n: officialN }],
    });
  }

  /* ---------- 感情：桃花少 / 关注感情 ---------- */
  if (focus === "love" || peachN === 0) {
    const score = (focus === "love" ? 10 : 2) + (peachN === 0 ? 3 : 0);
    picks.push({
      id: peachN === 0 ? "zhan-taohua" : "hehe",
      score,
      facts: [dayFact, { k: "peach", n: peachN }],
    });
  }

  /* ---------- 健康：日主偏弱 ---------- */
  if (focus === "health" || supportRatio < 0.34) {
    const score = (focus === "health" ? 10 : 3) + (supportRatio < 0.34 ? 3 : 0);
    picks.push({
      id: "jiankang",
      score,
      facts: [
        dayFact,
        { k: "weakSelf", n: Math.round(supportRatio * 100) },
        ...(weak ? ([{ k: "missingEl", el: weak, n: countEl(elements, weak) }] as Fact[]) : []),
      ],
    });
  }

  /* ---------- 化解：流年冲日支 / 某行过旺 ---------- */
  if (clash || (strong && countEl(elements, strong) / total > 0.4)) {
    picks.push({
      id: "baijie",
      score: clash ? 6 : 2,
      facts: [
        ...(clash ? ([{ k: "clash", el: null as any }] as Fact[]) : []),
        ...(strong ? ([{ k: "excess", el: strong, n: countEl(elements, strong) }] as Fact[]) : []),
      ],
    });
  }

  /* ---------- 兜底：没有明显短板时给转运符 ---------- */
  if (!picks.length) {
    picks.push({
      id: "zhuanyun",
      score: 5,
      facts: [dayFact, ...(weak ? ([{ k: "missingEl", el: weak, n: countEl(elements, weak) }] as Fact[]) : [])],
    });
  }

  return picks
    .filter((p) => p.facts.length > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((p) => ({ id: p.id, score: p.score, facts: p.facts }));
}
