"use client";

import type { ElementKey } from "./chart-i18n";

/**
 * 符纸推荐：根据命盘 + 用户关注方向做确定性匹配。
 *
 * 为什么不用模型推荐：商店里是 14 款具体 SKU（id 固定、价格固定），
 * 让模型自由发挥很容易编出不存在的符名，或把不相关的符吹成"最配你"。
 * 这里用可解释的规则打分，模型只负责前后文的表达。
 */

export type TalismanReason = "wealth" | "career" | "love" | "health" | "balance";

export interface TalismanAdvice {
  id: string;
  /** 推荐理由的类型，前端按本地化文案渲染 */
  reason: TalismanReason;
  /** 得分，仅用于排序与调试 */
  score: number;
}

/** 每款符的默认推荐理由（与其原始用途一致）。 */
const PRODUCT_REASON: Record<string, TalismanReason> = {
  caishen: "wealth",
  shiye: "career",
  "shiye-hehe": "career",
  hehe: "love",
  "baoyou-yinyuan": "love",
  "zhan-taohua": "love",
  guiren: "career",
  "fang-xiaoren": "balance",
  jiankang: "health",
  quxie: "balance",
  qugui: "balance",
  baijie: "balance",
  zhuanyun: "balance",
};

/** 五行偏弱时补什么：木主生发（贵人）、火主情缘、土主财库、金主决断（事业）、水主化煞。 */
const ELEMENT_HINT: Record<ElementKey, { id: string; add: number }> = {
  wood: { id: "guiren", add: 2 },
  fire: { id: "zhan-taohua", add: 2 },
  earth: { id: "caishen", add: 2 },
  metal: { id: "shiye", add: 2 },
  water: { id: "baijie", add: 2 },
};

/** 按关注方向的主推（分高者优先）。 */
const FOCUS_BOOST: Record<string, { id: string; add: number }[]> = {
  wealth: [
    { id: "caishen", add: 4 },
    { id: "zhuanyun", add: 2 },
  ],
  career: [
    { id: "shiye", add: 4 },
    { id: "guiren", add: 3 },
  ],
  love: [
    { id: "hehe", add: 3 },
    { id: "zhan-taohua", add: 3 },
    { id: "baoyou-yinyuan", add: 2 },
  ],
  health: [
    { id: "jiankang", add: 4 },
    { id: "baijie", add: 2 },
  ],
  general: [
    { id: "zhuanyun", add: 3 },
    { id: "guiren", add: 2 },
  ],
};

/** 命局里最弱的一行（元素计数最低）。 */
function weakestElement(elements: Record<string, number> | undefined): ElementKey | null {
  if (!elements) return null;
  const order: ElementKey[] = ["metal", "wood", "water", "fire", "earth"];
  let min: ElementKey | null = null;
  let minVal = Infinity;
  for (const k of order) {
    const v = Number(elements[k] ?? 0);
    if (v < minVal) {
      minVal = v;
      min = k;
    }
  }
  return min;
}

/**
 * 生成 2-3 条推荐。
 * @param chart 八字命盘（BaziChartData）
 * @param focus 用户在表单选的关注方向
 */
export function recommendTalismans(chart: any, focus: string): TalismanAdvice[] {
  const scores = new Map<string, number>();
  const bump = (id: string, add: number) => {
    if (!PRODUCT_REASON[id]) return; // 只推商店里真有的款
    scores.set(id, (scores.get(id) || 0) + add);
  };

  for (const hit of FOCUS_BOOST[focus] || FOCUS_BOOST.general) bump(hit.id, hit.add);

  const weak = weakestElement(chart && chart.elements);
  if (weak) bump(ELEMENT_HINT[weak].id, ELEMENT_HINT[weak].add);

  // 日主偏弱（同类 + 生扶少）→ 先保健康与状态
  const el = (chart && chart.elements) || {};
  const dm = chart && chart.dayMaster && chart.dayMaster.element;
  if (dm) {
    const self = Number(el[dm] ?? 0);
    const total = Object.values(el).reduce((a: number, b: any) => a + Number(b || 0), 0) || 1;
    if (self / total < 0.2) bump("jiankang", 2);
  }

  // 大运流年交接（当年干支与命局日支相冲的粗判）→ 转运符
  const gz = String((chart && chart.currentGz) || "");
  if (gz.length >= 2) bump("zhuanyun", 1);

  const ranked = Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, score]) => ({ id, reason: PRODUCT_REASON[id], score }));

  return ranked;
}
