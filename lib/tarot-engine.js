/**
 * Traces 痕迹 — 塔罗抽牌引擎（零依赖 JS）。
 *
 * 由 skills/tarot/tarot-skill-main/scripts/draw.py 1:1 移植：
 *   - Python random.Random(MT19937) 精确复刻（同 seed + time_factor 结果完全一致）
 *   - 位置权重（大阿卡纳在关键位 60/28 加权、时段因子元素/大牌 1.08 加权）
 *   - 正逆位概率（关键位 70% 正位，其余 60%）、不重复抽牌
 *   - 密码学安全随机源生成 seed
 *
 * 移植后经 scripts/engine-parity/tarot_parity.py 与 Python 原版对拍（多 seed × 全牌阵零差异）。
 * 本文件同时运行于 Node（server.js require）与 Cloudflare Worker（wrangler 打包）。
 * 纯计算模块：不依赖任何 Node/浏览器 API（仅 Web Crypto getRandomValues），禁止引入环境依赖。
 */

"use strict";

// ---------------------------------------------------------------------------
// 牌面数据（顺序与 draw.py 一致，顺序影响抽牌结果，勿改）
// ---------------------------------------------------------------------------

const MAJORS = [
  "愚者", "魔术师", "女祭司", "女皇", "皇帝", "教皇", "恋人", "战车",
  "力量", "隐士", "命运之轮", "正义", "倒吊人", "死神", "节制", "恶魔",
  "高塔", "星星", "月亮", "太阳", "审判", "世界",
];

const MAJOR_EN = {
  愚者: "The Fool", 魔术师: "The Magician", 女祭司: "The High Priestess", 女皇: "The Empress",
  皇帝: "The Emperor", 教皇: "The Hierophant", 恋人: "The Lovers", 战车: "The Chariot",
  力量: "Strength", 隐士: "The Hermit", 命运之轮: "Wheel of Fortune", 正义: "Justice",
  倒吊人: "The Hanged Man", 死神: "Death", 节制: "Temperance", 恶魔: "The Devil",
  高塔: "The Tower", 星星: "The Star", 月亮: "The Moon", 太阳: "The Sun",
  审判: "Judgement", 世界: "The World",
};

const SUITS = { 权杖: "火", 圣杯: "水", 宝剑: "风", 星币: "土" };
const SUIT_EN = { 权杖: "Wands", 圣杯: "Cups", 宝剑: "Swords", 星币: "Pentacles" };
const RANKS = ["Ace", "二", "三", "四", "五", "六", "七", "八", "九", "十", "侍从", "骑士", "皇后", "国王"];
const RANK_EN = { Ace: "Ace", 二: "Two", 三: "Three", 四: "Four", 五: "Five", 六: "Six", 七: "Seven", 八: "Eight", 九: "Nine", 十: "Ten", 侍从: "Page", 骑士: "Knight", 皇后: "Queen", 国王: "King" };

const MINORS = [];
for (const s of Object.keys(SUITS)) {
  for (const r of RANKS) MINORS.push(s + r);
}

const CARDS = MAJORS.concat(MINORS); // 78 张，顺序 = draw.py 顺序

// 元素映射（与 draw.py 完全一致）
const MAJOR_ELEMENTS = ["风", "风", "水", "土", "火", "土", "风", "水", "火", "土", "火", "风", "水", "水", "火", "土", "火", "风", "水", "火", "火", "土"];
const ELEMENTS = {};
MAJORS.forEach((c, i) => {
  ELEMENTS[c] = MAJOR_ELEMENTS[i];
});
for (const c of MINORS) ELEMENTS[c] = SUITS[c.slice(0, 2)];

function cardEn(name) {
  if (MAJOR_EN[name]) return MAJOR_EN[name];
  const suit = name.slice(0, 2);
  const rank = name.slice(2);
  if (SUIT_EN[suit] && RANK_EN[rank]) {
    return rank === "Ace" ? "Ace of " + SUIT_EN[suit] : RANK_EN[rank] + " of " + SUIT_EN[suit];
  }
  return name;
}

// ---------------------------------------------------------------------------
// 牌阵（位置顺序与权重键值 = draw.py 完全一致）
// positions: [位置名, 关键位(1/0), 正位概率(0.7/0.6 的选择位)]
// ---------------------------------------------------------------------------

const SPREADS = {
  single: { name: "单张牌", positions: [["当前指引", 1, 0]] },
  three: { name: "三牌阵", positions: [["过去", 0, 0], ["现在", 1, 0], ["未来", 0, 1]] },
  diamond: { name: "五牌阵", positions: [["核心", 1, 0], ["根源", 0, 0], ["阻力", 0, 0], ["潜力", 0, 0], ["建议", 1, 1]] },
  moon: { name: "月亮牌阵", positions: [["新月", 1, 0], ["上弦", 0, 0], ["满月", 1, 0], ["下弦", 0, 0]] },
  horseshoe: {
    name: "马蹄形",
    positions: [["远期过去", 0, 0], ["近期过去", 0, 0], ["当前", 1, 0], ["近期未来", 0, 0], ["外部影响", 1, 0], ["建议", 0, 1], ["结果", 1, 1]],
  },
  celtic: {
    name: "凯尔特十字",
    positions: [["核心", 1, 0], ["交叉", 0, 0], ["意识目标", 0, 0], ["根基过去", 0, 0], ["近期过去", 1, 0], ["近期未来", 0, 0], ["自我", 0, 0], ["环境", 0, 0], ["希望与恐惧", 0, 0], ["结果", 1, 1]],
  },
};

const SPREAD_KEYS = Object.keys(SPREADS);

const TIME = { morning: ["火", "风"], afternoon: ["水", "土"], night: ["major"] };

// ---------------------------------------------------------------------------
// Python random.Random 精确复刻（MT19937 + init_by_array 种子初始化 + res53）
// ---------------------------------------------------------------------------

const MT_N = 624;
const MT_M = 397;
const MT_MATRIX_A = 0x9908b0df;
const MT_UPPER_MASK = 0x80000000;
const MT_LOWER_MASK = 0x7fffffff;

/** 把 BigInt 种子 → uint32 数组（小端字节序列，零填充到 4 字节倍数） */
function seedToKey(seedBig) {
  let v = seedBig < 0n ? -seedBig : seedBig;
  const bytes = [];
  while (v > 0n) {
    bytes.push(Number(v & 0xffn));
    v >>= 8n;
  }
  if (bytes.length === 0) bytes.push(0); // seed=0 → 单字节 0
  const words = [];
  for (let i = 0; i < bytes.length; i += 4) {
    words.push(((bytes[i] || 0) | ((bytes[i + 1] || 0) << 8) | ((bytes[i + 2] || 0) << 16) | ((bytes[i + 3] || 0) << 24)) >>> 0);
  }
  return words;
}

class PyRandom {
  constructor(seedBig) {
    this.mt = new Uint32Array(MT_N);
    this.mti = MT_N;
    this._initByArray(seedToKey(seedBig));
  }

  _initGenrand(s) {
    const mt = this.mt;
    mt[0] = s >>> 0;
    for (let i = 1; i < MT_N; i++) {
      const prev = mt[i - 1];
      mt[i] = (Math.imul(1812433253, prev ^ (prev >>> 30)) + i) >>> 0;
    }
    this.mti = MT_N;
  }

  _initByArray(key) {
    const mt = this.mt;
    const keyLength = key.length;
    this._initGenrand(19650218);
    let i = 1;
    let j = 0;
    let k = Math.max(MT_N, keyLength);
    for (; k; k--) {
      const prev = mt[i - 1];
      mt[i] = (((mt[i] ^ Math.imul(prev ^ (prev >>> 30), 1664525)) >>> 0) + key[j] + j) >>> 0;
      i++;
      j++;
      if (i >= MT_N) {
        mt[0] = mt[MT_N - 1];
        i = 1;
      }
      if (j >= keyLength) j = 0;
    }
    for (k = MT_N - 1; k; k--) {
      const prev = mt[i - 1];
      mt[i] = (((mt[i] ^ Math.imul(prev ^ (prev >>> 30), 1566083941)) >>> 0) - i) >>> 0;
      i++;
      if (i >= MT_N) {
        mt[0] = mt[MT_N - 1];
        i = 1;
      }
    }
    mt[0] = MT_UPPER_MASK;
  }

  _genrandInt32() {
    const mt = this.mt;
    let y;
    if (this.mti >= MT_N) {
      let kk;
      for (kk = 0; kk < MT_N - MT_M; kk++) {
        y = ((mt[kk] & MT_UPPER_MASK) | (mt[kk + 1] & MT_LOWER_MASK)) >>> 0;
        mt[kk] = (mt[kk + MT_M] ^ (y >>> 1) ^ (y & 1 ? MT_MATRIX_A : 0)) >>> 0;
      }
      for (; kk < MT_N - 1; kk++) {
        y = ((mt[kk] & MT_UPPER_MASK) | (mt[kk + 1] & MT_LOWER_MASK)) >>> 0;
        mt[kk] = (mt[kk + (MT_M - MT_N)] ^ (y >>> 1) ^ (y & 1 ? MT_MATRIX_A : 0)) >>> 0;
      }
      y = ((mt[MT_N - 1] & MT_UPPER_MASK) | (mt[0] & MT_LOWER_MASK)) >>> 0;
      mt[MT_N - 1] = (mt[MT_M - 1] ^ (y >>> 1) ^ (y & 1 ? MT_MATRIX_A : 0)) >>> 0;
      this.mti = 0;
    }
    y = mt[this.mti++];
    y ^= y >>> 11;
    y = (y ^ ((y << 7) & 0x9d2c5680)) >>> 0;
    y = (y ^ ((y << 15) & 0xefc60000)) >>> 0;
    y ^= y >>> 18;
    return y >>> 0;
  }

  /** 与 Python random.random()（genrand_res53）一致 */
  random() {
    const a = this._genrandInt32() >>> 5;
    const b = this._genrandInt32() >>> 6;
    return (a * 67108864.0 + b) * (1.0 / 9007199254740992.0);
  }
}

// ---------------------------------------------------------------------------
// 抽牌逻辑（与 draw.py 一致）
// ---------------------------------------------------------------------------

function weight(card, key, boosted) {
  const major = MAJORS.indexOf(card) !== -1;
  const base = key * (major ? 1 : 0) ? 60 / 28 : 1.0;
  const hit = (boosted.indexOf("major") !== -1 && major ? 1 : 0) + (boosted.indexOf(ELEMENTS[card]) !== -1 ? 1 : 0);
  return base * (hit ? 1.08 : 1.0);
}

/** 与 python random.choices(pool, weights=w, k=1) 一致：一次 random() 调用 + bisect_right */
function pyChoices(rng, pool, weights) {
  let acc = 0;
  const cum = [];
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i];
    cum.push(acc);
  }
  const total = acc + 0.0;
  const x = rng.random() * total;
  let lo = 0;
  let hi = cum.length - 1; // python: bisect(cum, x, 0, n-1)
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= x) lo = mid + 1;
    else hi = mid;
  }
  return pool[lo];
}

function getTimeFactor(hour) {
  const h = hour === undefined || hour === null ? new Date().getUTCHours() + 8 : hour; // 默认按北京时间
  const hh = ((h % 24) + 24) % 24;
  if (hh >= 6 && hh < 12) return "morning";
  if (hh < 18) return "afternoon";
  return "night";
}

/** 密码学安全随机 seed（64 位十进制字符串） */
function makeSeed() {
  const bytes = new Uint8Array(8);
  let ok = false;
  try {
    if (typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.getRandomValues) {
      globalThis.crypto.getRandomValues(bytes);
      ok = true;
    }
  } catch {
    ok = false;
  }
  if (!ok) {
    try {
      const nodeCrypto = require("crypto"); // eslint-disable-line global-require
      const b = nodeCrypto.randomBytes(8);
      for (let i = 0; i < 8; i++) bytes[i] = b[i];
    } catch {
      for (let i = 0; i < 8; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  let seed = 0n;
  for (let i = 7; i >= 0; i--) seed = (seed << 8n) | BigInt(bytes[i]);
  seed ^= BigInt(Date.now()) << 16n;
  return seed === 0n ? 1n : seed;
}

/**
 * 抽牌。
 * opts: { spread, question?, seed?(string|number|bigint), timeFactor? }
 * 返回 { seed, spread, spreadName, question, timeFactor, cards: [{position, card, cardEn, orientation, isMajor, element}] }
 */
function drawCards(opts) {
  const spreadKey = opts && opts.spread;
  const sp = SPREADS[spreadKey];
  if (!sp) throw new Error("unknown spread: " + spreadKey);
  const question = (opts && opts.question) || "";

  const rawSeed = opts && opts.seed;
  const finalSeed =
    rawSeed === undefined || rawSeed === null || rawSeed === "" ? makeSeed() : BigInt(String(rawSeed));
  const finalFactor =
    opts && opts.timeFactor && TIME[opts.timeFactor] ? opts.timeFactor : getTimeFactor(opts && opts.hour);

  const rng = new PyRandom(finalSeed);
  const pool = CARDS.slice();
  const boosted = TIME[finalFactor];
  const cards = [];

  for (const [posName, key, uprightP] of sp.positions) {
    const weights = pool.map((c) => weight(c, key, boosted));
    const picked = pyChoices(rng, pool, weights);
    pool.splice(pool.indexOf(picked), 1);
    const isUpright = rng.random() < (uprightP ? 0.7 : 0.6);
    cards.push({
      position: posName,
      card: picked,
      cardEn: cardEn(picked),
      orientation: isUpright ? "正位" : "逆位",
      isMajor: MAJORS.indexOf(picked) !== -1,
      element: ELEMENTS[picked],
    });
  }

  return {
    seed: finalSeed.toString(),
    spread: spreadKey,
    spreadName: sp.name,
    question,
    timeFactor: finalFactor,
    cards,
  };
}

// ---------------------------------------------------------------------------
// 输入校验 + 解读提示词（方法论来自 SKILL.md 与 references/）
// ---------------------------------------------------------------------------

const LANG_NAME = { en: "English", zh: "简体中文", ja: "日本語", ko: "한국어", es: "Español", fr: "Français", de: "Deutsch", pt: "Português", ru: "Русский", ar: "العربية" };

function validatePayload(payload) {
  const errors = [];
  const spread = payload && payload.spread;
  const question = payload && payload.question;
  const locale = payload && payload.locale;
  if (!spread || SPREAD_KEYS.indexOf(spread) === -1) errors.push("spread");
  if (question && String(question).length > 200) errors.push("question");
  if (locale && !LANG_NAME[locale]) errors.push("locale");
  return errors;
}

/** 构建 LLM 消息（抽牌已由引擎完成，AI 只解读）。 */
function buildTarotPrompt(payload, draw) {
  const locale = (payload && payload.locale) || "en";
  const language = LANG_NAME[locale] || "English";

  const system = [
    "你是「痕迹 Traces」的塔罗解读师，严格遵循以下专业塔罗方法论（来源：专业塔罗 skill）。",
    "",
    "【总原则】塔罗是镜子，不是水晶球：把牌面转成自我观察和可选择的下一步，不宣判固定命运。主权归用户。",
    "【抽牌数据】牌面由密码学安全随机源抽出，牌阵位置、牌名、正逆位均为既定事实——禁止更改、补牌或重新抽牌。",
    "",
    "【逐牌解读】每张牌选 1-2 个透镜展开：镜子=当前状态；窗户=盲点/潜意识；门=行动；锚=固定信念。",
    "牌义纪律：花色（权杖=行动/创造、圣杯=情感/关系、宝剑=思维/冲突、星币=身体/金钱/技能）；数字（Ace 是种子 → 十是完成/过载）；大阿卡纳按愚人之旅（0-7 建身份、8-14 内在修正、15-21 阴影/崩塌/疗愈/整合）；逆位读作阻塞、过度、内化、延迟或反转。",
    "",
    "【牌间关系（多于一张时必须分析）】",
    "- 花色/元素分布：3 张以上同花色为主导；缺席花色提示被忽视的能量（火风互助、水土互助、火水蒸发、风土僵化、火土需落地、水风易情绪化思考）。",
    "- 大阿卡纳比例：>50% 重大转折；30-50% 命运与选择并存；<30% 日常选择主导，强调主动权。",
    "- 相邻牌标注关系：因果 / 对话 / 递进 / 转折（依据：愚人之旅、数字旅程、牌性、对位牌、宫廷牌、数字共振）。",
    "- 经典组合参考：死神+星星=结束后的疗愈；高塔+星星=崩塌后重建；月亮+太阳=幻象被照亮；恶魔+力量=驯化阴影；隐士+恋人=独处影响连接；高塔+宝剑十=旧结构彻底结束。",
    "",
    "【综合解读】按「起点 → 张力 → 转折 → 出口 → 回响」串联叙事；出口必须是本周可执行的具体动作（例如「今天 15:00 前发那条消息」）。",
    "【反巴纳姆】禁止「注意沟通、保持平衡、相信直觉、一切都会好」等空话；建议必须具体到时间/动作。",
    "【安全边界】不做医疗、法律、投资买卖、重大人生决定的指导；若用户表达自伤倾向，暂停占卜并建议联系当地紧急服务或可信任的人。",
    "",
    "【输出格式】Markdown，层次清晰：",
    "① 整体能量概览",
    "② 牌面展示（位置 · 牌名 · 正逆位 · seed · 时段因子）",
    "③ 逐牌解读（关键词 + 透镜解读 + 深层讯息）",
    "④ 牌间关系分析（单张牌时省略）",
    "⑤ 综合解读（起点/张力/转折/出口/回响）",
    "⑥ 3-4 字能量总结词",
    "⑦ 开放式问题收尾，把主权交还用户",
    "全程使用" + language + "输出，温暖但清醒，约 600-900 词。",
  ].join("\n");

  const cardLines = draw.cards
    .map((c, i) => {
      const en = locale === "zh" ? "" : " (" + c.cardEn + ")";
      return i + 1 + ". " + c.position + "：" + c.card + en + " — " + c.orientation +
        "（" + c.element + "元素" + (c.isMajor ? "，大阿卡纳" : "") + "）";
    })
    .join("\n");

  const majorCount = draw.cards.filter((c) => c.isMajor).length;

  const user = [
    "【本次抽牌（密码学安全随机源抽出，为既定事实）】",
    "牌阵：" + draw.spreadName + "（" + draw.spread + "）",
    "seed：" + draw.seed + "｜时段因子：" + draw.timeFactor,
    cardLines,
    "大阿卡纳： " + majorCount + " / " + draw.cards.length,
    "",
    payload && payload.question
      ? "用户问题：" + payload.question
      : "用户未提供具体问题，请做一般性指引。",
    "",
    "请按方法论输出完整塔罗解读（" + language + "，Markdown 格式）。",
  ].join("\n");

  return { system, user };
}

/** 从 draw 提取前端展示用 JSON（去掉内部字段；原样返回即可）。 */
function extractDraw(draw) {
  return {
    seed: draw.seed,
    spread: draw.spread,
    spreadName: draw.spreadName,
    question: draw.question,
    timeFactor: draw.timeFactor,
    cards: draw.cards.map((c) => ({
      position: c.position,
      card: c.card,
      cardEn: c.cardEn,
      orientation: c.orientation,
      isMajor: c.isMajor,
      element: c.element,
    })),
  };
}

module.exports = {
  ENGINE_INFO: { name: "mingli-tarot-engine", version: "1.0.0", basis: "与 draw.py 对拍一致（MT19937 精确复刻）" },
  SPREADS,
  SPREAD_KEYS,
  drawCards,
  extractDraw,
  validatePayload,
  buildTarotPrompt,
  cardEn,
  // 测试用导出
  PyRandom,
  seedToKey,
  getTimeFactor,
  CARDS,
};
