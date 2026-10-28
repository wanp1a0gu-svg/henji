/**
 * Traces 痕迹 — 四柱八字确定性排盘引擎（零依赖 JS）。
 *
 * 由 skills/bazi/bazi-skill-main/scripts/pai_pan.py（1:1 算法对齐）移植：
 *   - 时区一律北京时间 UTC+8（不用本机时区）
 *   - 节气：太阳视黄经定气（Meeus 简式，立春=315°），二分搜索定位精确时刻
 *   - 农历：定朔（Meeus 第 49 章）+ 冬至十一月 + 无中气置闰
 *   - 日柱：JDN 锚点 1990-05-15=庚辰；23:00 起用次日日柱（夜子时）
 *   - 年柱以立春时刻分界；月柱以十二节分界；时柱五鼠遁元
 *   - 大运：阳年男/阴年女顺排，起运=距节天数÷3
 *
 * 移植后经 scripts/engine-parity 与 Python 原版全量对拍（280+ 用例零差异）。
 * 本文件同时运行于 Node（server.js require）与 Cloudflare Worker（wrangler 打包）。
 * 纯计算模块：不依赖任何 Node/浏览器 API，禁止在此文件引入环境依赖。
 */

"use strict";

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

const BJ_OFFSET_MS = 8 * 3600 * 1000; // 北京时间偏移
const J2000 = 2451545.0;
const UNIX_JD = 2440587.5; // 1970-01-01 00:00 UTC

const GAN = "甲乙丙丁戊己庚辛壬癸";
const ZHI = "子丑寅卯辰巳午未申酉戌亥";
const GAN_LIST = GAN.split("");
const ZHI_LIST = ZHI.split("");

const GAN_WUXING = "木木火火土土金金水水"; // 天干五行（索引对齐）
const GAN_ELEMENT = { 甲: "wood", 乙: "wood", 丙: "fire", 丁: "fire", 戊: "earth", 己: "earth", 庚: "metal", 辛: "metal", 壬: "water", 癸: "water" };
const ZHI_ELEMENT = { 子: "water", 丑: "earth", 寅: "wood", 卯: "wood", 辰: "earth", 巳: "fire", 午: "fire", 未: "earth", 申: "metal", 酉: "metal", 戌: "earth", 亥: "water" };

// 十二节：黄经、名称、月支下标（寅=2 … 丑=1）
const JIE_DEFS = [
  [315, "立春", 2],
  [345, "惊蛰", 3],
  [15, "清明", 4],
  [45, "立夏", 5],
  [75, "芒种", 6],
  [105, "小暑", 7],
  [135, "立秋", 8],
  [165, "白露", 9],
  [195, "寒露", 10],
  [225, "立冬", 11],
  [255, "大雪", 0],
  [285, "小寒", 1],
];
const ZHONGQI_LONGS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

// 年上起月：寅月天干（键=年干索引）甲己丙、乙庚戊、丙辛庚、丁壬壬、戊癸甲
const YUE_GAN_YIN = { 0: 2, 5: 2, 1: 4, 6: 4, 2: 6, 7: 6, 3: 8, 8: 8, 4: 0, 9: 0 };
// 五鼠遁元：日干 → 子时天干
const ZI_SHI_GAN = { 0: 0, 5: 0, 1: 2, 6: 2, 2: 4, 7: 4, 3: 6, 8: 6, 4: 8, 9: 8 };

// 地支藏干（本气、中气、余气）
const CANGGAN = {
  子: [["癸", "水"]],
  丑: [["己", "土"], ["癸", "水"], ["辛", "金"]],
  寅: [["甲", "木"], ["丙", "火"], ["戊", "土"]],
  卯: [["乙", "木"]],
  辰: [["戊", "土"], ["乙", "木"], ["癸", "水"]],
  巳: [["丙", "火"], ["庚", "金"], ["戊", "土"]],
  午: [["丁", "火"], ["己", "土"]],
  未: [["己", "土"], ["丁", "火"], ["乙", "木"]],
  申: [["庚", "金"], ["壬", "水"], ["戊", "土"]],
  酉: [["辛", "金"]],
  戌: [["戊", "土"], ["辛", "金"], ["丁", "火"]],
  亥: [["壬", "水"], ["甲", "木"]],
};

// 十神：rel = (他干五行 - 日干五行) % 5；同阴阳查 SAME，异阴阳查 DIFF
const SHISHEN_SAME = ["比肩", "食神", "偏财", "偏官", "偏印"];
const SHISHEN_DIFF = ["劫财", "伤官", "正财", "正官", "正印"];

// 神煞表（与 references/shensha-table.md 同源）
const TIANYI = { 甲: ["丑", "未"], 戊: ["丑", "未"], 乙: ["子", "申"], 己: ["子", "申"], 丙: ["亥", "酉"], 丁: ["亥", "酉"], 壬: ["卯", "巳"], 癸: ["卯", "巳"], 庚: ["丑", "未", "寅", "午"], 辛: ["寅", "午"] };
const TIANDE = { 寅: ["gan", "丁"], 卯: ["zhi", "申"], 辰: ["gan", "壬"], 巳: ["gan", "辛"], 午: ["zhi", "亥"], 未: ["gan", "甲"], 申: ["gan", "癸"], 酉: ["zhi", "寅"], 戌: ["gan", "丙"], 亥: ["gan", "乙"], 子: ["gan", "己"], 丑: ["gan", "庚"] };
const YUEDE = { 寅: "丙", 午: "丙", 戌: "丙", 申: "壬", 子: "壬", 辰: "壬", 亥: "甲", 卯: "甲", 未: "甲", 巳: "庚", 酉: "庚", 丑: "庚" };
const WENCHANG = { 甲: "巳", 乙: "午", 丙: "申", 丁: "酉", 戊: "申", 己: "酉", 庚: "亥", 辛: "子", 壬: "寅", 癸: "卯" };
const XUETANG = { 甲: "亥", 乙: "午", 丙: "寅", 丁: "酉", 戊: "寅", 己: "酉", 庚: "巳", 辛: "子", 壬: "申", 癸: "卯" };
const CIGUAN = { 甲: "寅", 乙: "卯", 丙: "巳", 丁: "午", 戊: "巳", 己: "午", 庚: "申", 辛: "酉", 壬: "亥", 癸: "子" };
const SANHE = { 寅: "火", 午: "火", 戌: "火", 申: "水", 子: "水", 辰: "水", 巳: "金", 酉: "金", 丑: "金", 亥: "木", 卯: "木", 未: "木" };
const JIANGXING = { 火: "午", 水: "子", 金: "酉", 木: "卯" };
const HUAGAI = { 火: "戌", 水: "辰", 金: "丑", 木: "未" };
const YIMA = { 火: "申", 水: "寅", 金: "亥", 木: "巳" };
const JIESHA = { 水: "巳", 火: "亥", 金: "寅", 木: "申" };
const ZAISHA = { 水: "午", 火: "子", 金: "卯", 木: "酉" };
const WANGSHEN = { 水: "亥", 火: "巳", 金: "申", 木: "寅" };
const TAOHUA = { 火: "卯", 水: "酉", 金: "午", 木: "子" };
const GUCHEN = { 亥: "寅", 子: "寅", 丑: "寅", 寅: "巳", 卯: "巳", 辰: "巳", 巳: "申", 午: "申", 未: "申", 申: "亥", 酉: "亥", 戌: "亥" };
const GUASU = { 亥: "戌", 子: "戌", 丑: "戌", 寅: "丑", 卯: "丑", 辰: "丑", 巳: "辰", 午: "辰", 未: "辰", 申: "未", 酉: "未", 戌: "未" };
const JINYU = { 甲: "辰", 乙: "巳", 丙: "未", 丁: "申", 戊: "未", 己: "申", 庚: "戌", 辛: "亥", 壬: "丑", 癸: "寅" };
const YANGBLADE = { 甲: "卯", 乙: "寅", 丙: "午", 丁: "巳", 戊: "午", 己: "巳", 庚: "酉", 辛: "子", 壬: "子", 癸: "亥" };
const YUANCHEN_FORWARD = { 子: "未", 丑: "申", 寅: "酉", 卯: "戌", 辰: "亥", 巳: "子", 午: "丑", 未: "寅", 申: "卯", 酉: "辰", 戌: "巳", 亥: "午" };
const YUANCHEN_REVERSE = { 子: "巳", 丑: "午", 寅: "未", 卯: "申", 辰: "酉", 巳: "戌", 午: "亥", 未: "子", 申: "丑", 酉: "寅", 戌: "卯", 亥: "辰" };
const XUEREN = { 寅: "午", 卯: "未", 辰: "申", 巳: "酉", 午: "戌", 未: "亥", 申: "子", 酉: "丑", 戌: "寅", 亥: "卯", 子: "辰", 丑: "巳" };

const GAN_LABELS = ["年干", "月干", "日干", "时干"];
const ZHI_LABELS = ["年支", "月支", "日支", "时支"];
const MDH_ZHI_LABELS = ["月支", "日支", "时支"];

// 神煞吉凶分级（口径同 references/shensha-table.md 的「吉凶」字段）
const SHENSHA_LEVEL = {
  天乙贵人: "good", 天德: "good", 月德: "good", 文昌: "good", 学堂: "good", 词馆: "good",
  将星: "good", 华盖: "good", 驿马: "good", 天医: "good", 禄神: "good", 金舆: "good",
  羊刃: "neutral", "桃花/咸池": "neutral", "空亡/旬空": "neutral",
  劫煞: "bad", 灾煞: "bad", 亡神: "bad", 孤辰: "bad", 寡宿: "bad", 元辰: "bad", 血刃: "bad",
};

// 时辰中点（无钟点、仅时辰时用于节气比较与起运）
const SHICHEN_MID = { 子: [0, 0], 丑: [2, 0], 寅: [4, 0], 卯: [6, 0], 辰: [8, 0], 巳: [10, 0], 午: [12, 0], 未: [14, 0], 申: [16, 0], 酉: [18, 0], 戌: [20, 0], 亥: [22, 0] };
// 时辰整点边界（北京钟表分钟数）
const SHICHEN_BOUNDARIES_MIN = [60, 180, 300, 420, 540, 660, 780, 900, 1020, 1140, 1260, 1380];

const LUNAR_DAY_NAMES = { 1: "初一", 2: "初二", 3: "初三", 4: "初四", 5: "初五", 6: "初六", 7: "初七", 8: "初八", 9: "初九", 10: "初十", 11: "十一", 12: "十二", 13: "十三", 14: "十四", 15: "十五", 16: "十六", 17: "十七", 18: "十八", 19: "十九", 20: "二十", 21: "廿一", 22: "廿二", 23: "廿三", 24: "廿四", 25: "廿五", 26: "廿六", 27: "廿七", 28: "廿八", 29: "廿九", 30: "三十" };
const LUNAR_MONTH_NAMES = { 1: "正月", 2: "二月", 3: "三月", 4: "四月", 5: "五月", 6: "六月", 7: "七月", 8: "八月", 9: "九月", 10: "十月", 11: "十一月", 12: "十二月" };

const ENGINE_INFO = { name: "mingli-bazi-engine", version: "1.0.0", basis: "定气定朔 · 北京时间 · 与 pai_pan.py 全量对拍" };

// ---------------------------------------------------------------------------
// 工具
// ---------------------------------------------------------------------------

function pmod(a, n) {
  return ((a % n) + n) % n;
}
function rad(deg) {
  return (deg * Math.PI) / 180.0;
}
/** 公历日期 → 以 UTC 零点表示的毫秒（日期代数用） */
function civilMs(y, m, d) {
  return Date.UTC(y, m - 1, d);
}
function civilParts(ms) {
  const dt = new Date(ms);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}
/** 北京钟表时间 → 时刻毫秒 */
function beijingMs(y, m, d, h, mi, s) {
  return Date.UTC(y, m - 1, d, h || 0, mi || 0, s || 0) - BJ_OFFSET_MS;
}
function beijingParts(ms) {
  const dt = new Date(ms + BJ_OFFSET_MS);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate(), h: dt.getUTCHours(), mi: dt.getUTCMinutes(), s: dt.getUTCSeconds() };
}
function addDays(ms, days) {
  return ms + days * 86400000;
}
function diffDays(a, b) {
  return Math.round((a - b) / 86400000);
}
function pad2(n) {
  return (n < 10 ? "0" : "") + n;
}

// ---------------------------------------------------------------------------
// 儒略日 / ΔT / 太阳视黄经 / 定气
// ---------------------------------------------------------------------------

function deltaTSeconds(year) {
  const y = year;
  const t = y - 2000.0;
  if (y < 1920) {
    const t1 = y - 1900.0;
    return -2.79 + 1.494119 * t1 - 0.0598939 * t1 * t1 + 0.0061966 * t1 * t1 * t1 - 0.000197 * t1 * t1 * t1 * t1;
  }
  if (y < 1941) {
    const t1 = y - 1920.0;
    return 21.2 + 0.84493 * t1 - 0.0761 * t1 * t1 + 0.0020936 * t1 * t1 * t1;
  }
  if (y < 1961) {
    const t1 = y - 1950.0;
    return 29.07 + 0.407 * t1 - (t1 * t1) / 233.0 + (t1 * t1 * t1) / 2547.0;
  }
  if (y < 1986) {
    const t1 = y - 1975.0;
    return 45.45 + 1.067 * t1 - (t1 * t1) / 260.0 - (t1 * t1 * t1) / 718.0;
  }
  if (y < 2005) {
    const t1 = y - 2000.0;
    return 63.86 + 0.3345 * t1 - 0.060374 * t1 * t1 + 0.0017275 * t1 * t1 * t1 + 0.000651814 * t1 * t1 * t1 * t1 + 0.00002373599 * t1 * t1 * t1 * t1 * t1;
  }
  if (y < 2050) {
    return 62.92 + 0.32217 * t + 0.005589 * t * t;
  }
  return -20.0 + 32.0 * Math.pow((y - 1820.0) / 100.0, 2) - 0.5628 * (2150.0 - y);
}

function jdFromMs(ms) {
  return UNIX_JD + ms / 86400000.0;
}
function msFromJd(jd) {
  return (jd - UNIX_JD) * 86400000.0;
}
/** 力学时 JD → 时刻毫秒（含 ΔT 修正） */
function jdTTToMs(jdTT) {
  const year = 2000.0 + (jdTT - J2000) / 365.242189;
  const utcJd = jdTT - deltaTSeconds(year) / 86400.0;
  return msFromJd(utcJd);
}

/** 太阳视黄经（度）。Meeus AA ch.25 简式，1900–2100 约 0.01°（十余分钟）以内。 */
function sunApparentLongitude(jdTT) {
  const T = (jdTT - J2000) / 36525.0;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const mr = rad(M);
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(mr) +
    (0.019993 - 0.000101 * T) * Math.sin(2.0 * mr) +
    0.000289 * Math.sin(3.0 * mr);
  const omega = 125.04 - 1934.136 * T;
  const lam = L0 + C - 0.00569 - 0.00478 * Math.sin(rad(omega));
  return pmod(lam, 360.0);
}

function lonDelta(actual, target) {
  return pmod(actual - target + 180.0, 360.0) - 180.0;
}

const _solarTermCache = new Map();
/** 给定公历年、目标黄经，返回该年对应定气的 TT 儒略日。立春=315°。 */
function solarTermJd(year, longitude) {
  year = Math.trunc(year);
  longitude = pmod(longitude, 360.0);
  const key = year + "|" + longitude;
  if (_solarTermCache.has(key)) return _solarTermCache.get(key);
  const deltaLon = pmod(longitude - 280.46646, 360.0);
  const jd0 = J2000 + (year - 2000) * 365.242189 + deltaLon / 0.98564736;
  let lo = jd0 - 8.0;
  let hi = jd0 + 8.0;
  for (let i = 0; i < 52; i++) {
    const mid = (lo + hi) / 2.0;
    if (lonDelta(sunApparentLongitude(mid), longitude) < 0) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  const res = (lo + hi) / 2.0;
  _solarTermCache.set(key, res);
  return res;
}

/** 定气北京时刻（毫秒） */
function solarTermBeijing(year, longitude) {
  return jdTTToMs(solarTermJd(year, longitude));
}

/** year-1 … year+1 的十二节，按北京时间排序 */
function jieEventsAround(year) {
  const events = [];
  for (const y of [year - 1, year, year + 1]) {
    for (const [lon, name, zhiI] of JIE_DEFS) {
      events.push({ dt: solarTermBeijing(y, lon), name, zhiI, lon, y });
    }
  }
  events.sort((a, b) => a.dt - b.dt);
  return events;
}

// ---------------------------------------------------------------------------
// 定朔（Meeus ch.49）
// ---------------------------------------------------------------------------

function newMoonJde(k) {
  const T = k / 1236.85;
  let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T * T - 0.00000015 * T * T * T + 0.00000000073 * T * T * T * T;
  const E = 1.0 - 0.002516 * T - 0.0000074 * T * T;
  const M = rad(2.5534 + 29.1053567 * k - 0.0000014 * T * T - 0.00000011 * T * T * T);
  const Mp = rad(201.5643 + 385.81693528 * k + 0.0107582 * T * T + 0.00001238 * T * T * T - 0.000000058 * T * T * T * T);
  const F = rad(160.7108 + 390.67050284 * k - 0.0016118 * T * T - 0.00000227 * T * T * T + 0.000000011 * T * T * T * T);
  const omega = rad(124.7746 - 1.56375588 * k + 0.0020672 * T * T + 0.00000215 * T * T * T);
  const args = [
    Mp,
    M,
    2 * Mp,
    2 * F,
    Mp - M,
    Mp + M,
    2 * M,
    Mp - 2 * F,
    Mp + 2 * F,
    2 * Mp + M,
    3 * Mp,
    M + 2 * F,
    M - 2 * F,
    2 * Mp - M,
    omega,
    Mp + 2 * M,
    2 * Mp - 2 * F,
    3 * M,
    Mp + M - 2 * F,
    2 * Mp + 2 * F,
    Mp + M + 2 * F,
    Mp - M + 2 * F,
    Mp - M - 2 * F,
    3 * Mp + M,
    4 * Mp,
  ];
  const coef = [
    -0.4072,
    0.17241 * E,
    0.01608,
    0.01039,
    0.00739 * E,
    -0.00514 * E,
    0.00208 * E * E,
    -0.00111,
    -0.00057,
    0.00056 * E,
    -0.00042,
    0.00042 * E,
    0.00038 * E,
    -0.00024 * E,
    -0.00017,
    -0.00007,
    0.00004,
    0.00004,
    0.00003,
    0.00003,
    -0.00003,
    0.00003,
    -0.00002,
    -0.00002,
    0.00002,
  ];
  let sum = 0;
  for (let i = 0; i < coef.length; i++) sum += coef[i] * Math.sin(args[i]);
  jde += sum;
  const A = [
    299.77 + 0.107408 * k - 0.009173 * T * T,
    251.88 + 0.016321 * k,
    251.83 + 26.651886 * k,
    349.42 + 36.412478 * k,
    84.66 + 18.206239 * k,
    141.74 + 53.303771 * k,
    207.14 + 2.453732 * k,
    154.84 + 7.30686 * k,
    34.52 + 27.261239 * k,
    207.19 + 0.121824 * k,
    291.34 + 1.844379 * k,
    161.72 + 24.198154 * k,
    239.56 + 25.513099 * k,
    331.55 + 3.592518 * k,
  ];
  const Ac = [325, 165, 164, 126, 110, 62, 60, 56, 47, 42, 40, 37, 35, 23];
  let sum2 = 0;
  for (let i = 0; i < Ac.length; i++) sum2 += Ac[i] * 1e-6 * Math.sin(rad(A[i]));
  jde += sum2;
  return jde;
}

function kNear(jd) {
  return Math.round((jd - 2451550.09766) / 29.530588861);
}

function lastNewMoonKOnOrBefore(jdTT) {
  let k = kNear(jdTT);
  while (newMoonJde(k) > jdTT) k -= 1;
  while (newMoonJde(k + 1) <= jdTT) k += 1;
  return k;
}

// ---------------------------------------------------------------------------
// 农历（冬至十一月 + 无中气置闰）
// ---------------------------------------------------------------------------

function zhongqiJds(year) {
  const out = [];
  for (const y of [year - 1, year, year + 1]) {
    for (const lon of ZHONGQI_LONGS) out.push(solarTermJd(y, lon));
  }
  return out;
}

const _lunarMonthCache = new Map();
/** 从「dongzhiYear 的冬至所在十一月」起到下一年冬至月之前的各农历月。 */
function lunarMonthsBetweenDongzhi(dongzhiYear) {
  const y = Math.trunc(dongzhiYear);
  const key = "dz" + y;
  if (_lunarMonthCache.has(key)) return _lunarMonthCache.get(key);
  const dz0 = solarTermJd(y, 270);
  const dz1 = solarTermJd(y + 1, 270);
  const k0 = lastNewMoonKOnOrBefore(dz0);
  const k1 = lastNewMoonKOnOrBefore(dz1);
  const moons = [];
  for (let k = k0; k <= k1; k++) moons.push(newMoonJde(k));
  const n = moons.length - 1;
  const zhong = zhongqiJds(y);
  let leapIndex = null;
  if (n === 13) {
    for (let i = 0; i < n; i++) {
      let has = false;
      for (const z of zhong) {
        if (moons[i] <= z && z < moons[i + 1]) {
          has = true;
          break;
        }
      }
      if (!has) {
        leapIndex = i;
        break;
      }
    }
  }
  const months = [];
  let monthNum = 11;
  let lunarYear = y;
  for (let i = 0; i < n; i++) {
    const isLeap = leapIndex !== null && i === leapIndex;
    if (i > 0 && !isLeap) {
      monthNum += 1;
      if (monthNum === 13) {
        monthNum = 1;
        lunarYear = y + 1;
      }
    }
    const sp = beijingParts(jdTTToMs(moons[i]));
    const np = beijingParts(jdTTToMs(moons[i + 1]));
    const start = civilMs(sp.y, sp.m, sp.d);
    const next = civilMs(np.y, np.m, np.d);
    months.push({ year: lunarYear, month: monthNum, leap: isLeap, start, days: diffDays(next, start), shuoJd: moons[i] });
  }
  _lunarMonthCache.set(key, months);
  return months;
}

function lunarMonthsCoveringSolarYear(solarYear) {
  const a = lunarMonthsBetweenDongzhi(solarYear - 1);
  const b = lunarMonthsBetweenDongzhi(solarYear);
  const seen = new Set();
  const out = [];
  for (const m of a.concat(b)) {
    const k = m.start + "|" + m.year + "|" + m.month + "|" + m.leap;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(m);
  }
  out.sort((x, y2) => x.start - y2.start);
  return out;
}

/** 公历日 → [农历年, 月, 日, 是否闰月] */
function solarToLunar(y, m, d) {
  const target = civilMs(y, m, d);
  let months = lunarMonthsCoveringSolarYear(y);
  if (y - 1 >= 1890) {
    months = lunarMonthsBetweenDongzhi(y - 2).concat(months);
  }
  for (const info of months) {
    const start = info.start;
    const end = addDays(start, info.days);
    if (start <= target && target < end) {
      return [info.year, info.month, diffDays(target, start) + 1, info.leap];
    }
  }
  throw new Error("无法把 " + pad4(y) + "-" + pad2(m) + "-" + pad2(d) + " 换成农历（超出推算范围）");
}

function pad4(n) {
  return String(n).padStart(4, "0");
}

function formatLunar(ly, lm, ld, leap) {
  return ly + "年" + (leap ? "闰" : "") + (LUNAR_MONTH_NAMES[lm] || lm + "月") + (LUNAR_DAY_NAMES[ld] || ld);
}

// ---------------------------------------------------------------------------
// 干支 / 十神 / 藏干
// ---------------------------------------------------------------------------

function gzFromIndexArr(idx) {
  idx = pmod(idx, 60);
  return [GAN_LIST[idx % 10], ZHI_LIST[idx % 12]];
}
function gzFromIndex(idx) {
  const gz = gzFromIndexArr(idx);
  return gz[0] + gz[1];
}
function yearGzIndex(year) {
  return pmod(year - 4, 60);
}

function jdn(year, month, day) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function dayGzIndex(year, month, day) {
  return pmod(jdn(year, month, day) + 49, 60);
}

function shishenOf(dayGan, otherGan) {
  if (otherGan === null || otherGan === undefined) return "—";
  const rel = pmod(Math.floor(otherGan / 2) - Math.floor(dayGan / 2), 5);
  if (dayGan % 2 === otherGan % 2) return SHISHEN_SAME[rel];
  return SHISHEN_DIFF[rel];
}

function formatCanggan(zhi) {
  const parts = CANGGAN[zhi] || [];
  return parts.map(([g, wx]) => g + wx).join("、");
}

function shenshaPositions(needles, values, labels) {
  const need = needles instanceof Set ? needles : new Set(Array.isArray(needles) ? needles : [needles]);
  const out = [];
  for (let i = 0; i < values.length; i++) {
    const val = values[i];
    if (val !== null && val !== undefined && need.has(val)) out.push(labels[i]);
  }
  return out;
}

function sanheNeedles(yearZhi, dayZhi, table) {
  return new Set([table[SANHE[yearZhi]], table[SANHE[dayZhi]]]);
}

/** 日柱所在旬的两个空亡地支。甲子旬戌亥，余旬依次前移。 */
function kongwangZhi(dayGan, dayZhi) {
  const start = pmod(ZHI_LIST.indexOf(dayZhi) - GAN_LIST.indexOf(dayGan), 12);
  return [ZHI_LIST[pmod(start - 2, 12)], ZHI_LIST[pmod(start - 1, 12)]];
}

/**
 * 命中的神煞（口径同 references/shensha-table.md；时柱未知则 hour* 为 null）。
 * 返回 { lines, items }：lines 为报告文本行（formatReport / chartBlock 用，逐字不变），
 * items 为结构化数据（前端命盘卡片用）：{ name, positions, method, level }。
 */
function computeShensha(yearGan, yearZhi, monthGan, monthZhi, dayGan, dayZhi, hourGan, hourZhi, sex) {
  const gans = [yearGan, monthGan, dayGan, hourGan];
  const zhis = [yearZhi, monthZhi, dayZhi, hourZhi];
  const mdhZhis = [monthZhi, dayZhi, hourZhi];
  const lines = [];
  const items = [];
  const add = (name, positions, method) => {
    if (positions.length > 0) {
      lines.push("- " + name + " — 见于" + positions.join("、") + " — " + method);
      items.push({ name, positions: positions.slice(), method, level: SHENSHA_LEVEL[name] || "neutral" });
    }
  };

  const tianyiNeed = new Set(TIANYI[yearGan]);
  for (const z of TIANYI[dayGan]) tianyiNeed.add(z);
  add("天乙贵人", shenshaPositions(tianyiNeed, zhis, ZHI_LABELS), "年干/日干查地支");

  const [tdKind, tdWord] = TIANDE[monthZhi];
  if (tdKind === "gan") {
    add("天德", shenshaPositions(tdWord, gans, GAN_LABELS), "月支查天干");
  } else {
    add("天德", shenshaPositions(tdWord, zhis, ZHI_LABELS), "月支查地支");
  }

  add("月德", shenshaPositions(YUEDE[monthZhi], gans, GAN_LABELS), "月支三合");

  add("文昌", shenshaPositions(new Set([WENCHANG[yearGan], WENCHANG[dayGan]]), zhis, ZHI_LABELS), "年干/日干查地支");
  add("学堂", shenshaPositions(XUETANG[dayGan], zhis, ZHI_LABELS), "日干长生");
  add("词馆", shenshaPositions(CIGUAN[dayGan], zhis, ZHI_LABELS), "日干临官");

  add("将星", shenshaPositions(sanheNeedles(yearZhi, dayZhi, JIANGXING), zhis, ZHI_LABELS), "年支/日支三合");
  add("华盖", shenshaPositions(sanheNeedles(yearZhi, dayZhi, HUAGAI), zhis, ZHI_LABELS), "年支/日支");
  add("驿马", shenshaPositions(sanheNeedles(yearZhi, dayZhi, YIMA), zhis, ZHI_LABELS), "年支/日支");

  const tianyiPrev = ZHI_LIST[pmod(ZHI_LIST.indexOf(monthZhi) - 1, 12)];
  add("天医", shenshaPositions(tianyiPrev, zhis, ZHI_LABELS), "月支前一位");
  add("禄神", shenshaPositions(CIGUAN[dayGan], zhis, ZHI_LABELS), "日干");
  add("金舆", shenshaPositions(JINYU[dayGan], zhis, ZHI_LABELS), "日干");
  add("羊刃", shenshaPositions(YANGBLADE[dayGan], zhis, ZHI_LABELS), "日干");
  add("劫煞", shenshaPositions(sanheNeedles(yearZhi, dayZhi, JIESHA), zhis, ZHI_LABELS), "年支/日支");
  add("灾煞", shenshaPositions(sanheNeedles(yearZhi, dayZhi, ZAISHA), zhis, ZHI_LABELS), "年支/日支");
  add("亡神", shenshaPositions(sanheNeedles(yearZhi, dayZhi, WANGSHEN), zhis, ZHI_LABELS), "年支/日支");
  add("桃花/咸池", shenshaPositions(sanheNeedles(yearZhi, dayZhi, TAOHUA), zhis, ZHI_LABELS), "年支/日支");
  add("孤辰", shenshaPositions(GUCHEN[yearZhi], zhis, ZHI_LABELS), "年支");
  add("寡宿", shenshaPositions(GUASU[yearZhi], zhis, ZHI_LABELS), "年支");
  add("空亡/旬空", shenshaPositions(kongwangZhi(dayGan, dayZhi), zhis, ZHI_LABELS), "日柱旬空");

  const yangYear = GAN_LIST.indexOf(yearGan) % 2 === 0;
  const yuanMap = yangYear === (sex === "男") ? YUANCHEN_FORWARD : YUANCHEN_REVERSE;
  add("元辰", shenshaPositions(yuanMap[yearZhi], mdhZhis, MDH_ZHI_LABELS), "年支阴阳男女");
  add("血刃", shenshaPositions(XUEREN[monthZhi], zhis, ZHI_LABELS), "月支");
  return { lines, items };
}

// ---------------------------------------------------------------------------
// 时辰 / 四柱
// ---------------------------------------------------------------------------

/** 钟点 → 时支。23:00–01:00 子，其后每两小时一支。 */
function hourToShichen(hour, minute) {
  const total = hour * 60 + minute;
  if (total >= 23 * 60 || total < 60) return "子";
  return ZHI_LIST[Math.floor((hour + 1) / 2) % 12];
}

function nearShichenBoundary(hour, minute) {
  const total = hour * 60 + minute;
  for (const b of SHICHEN_BOUNDARIES_MIN) {
    if (Math.abs(total - b) <= 15) return true;
  }
  return false;
}

/** 立春时刻分年。1990-02-03 10:00 → 己巳。 */
function resolveYearPillar(birthMs) {
  const calYear = beijingParts(birthMs).y;
  const lichunMs = solarTermBeijing(calYear, 315);
  const yearNum = birthMs >= lichunMs ? calYear : calYear - 1;
  const [gan, zhi] = gzFromIndexArr(yearGzIndex(yearNum));
  return { yearNum, gan, zhi, lichunMs };
}

/** 十二节分月 + 年上起月。 */
function resolveMonthPillar(birthMs, yearGanIdx) {
  const events = jieEventsAround(beijingParts(birthMs).y);
  let current = null;
  let nextJie = null;
  let prevJie = null;
  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    if (ev.dt <= birthMs) {
      current = ev;
    } else {
      nextJie = ev;
      if (i >= 1) prevJie = events[i - 1];
      break;
    }
  }
  if (current === null) throw new Error("找不到出生时刻之前的节气");
  if (prevJie === null) {
    prevJie = current;
    const later = jieEventsAround(beijingParts(birthMs).y + 1);
    for (const ev of later) {
      if (ev.dt > birthMs) {
        nextJie = ev;
        break;
      }
    }
  }
  const zhiI = current.zhiI;
  const yueZhi = ZHI_LIST[zhiI];
  const step = pmod(zhiI - 2, 12);
  const yueGan = GAN_LIST[pmod(YUE_GAN_YIN[yearGanIdx] + step, 10)];
  return { yueGan, yueZhi, jieName: current.name, jieLon: current.lon, prevJieMs: prevJie.dt, nextJieMs: nextJie ? nextJie.dt : null };
}

/** 早晚子时日界。返回 { gan, zhi, idx, usedMs, zishi }。 */
function resolveDayPillar(solarDateMs, hour, minute) {
  let used = solarDateMs;
  let zishi = "无";
  if (hour !== null && hour !== undefined) {
    if (hour >= 23) {
      used = addDays(used, 1);
      zishi = "夜子时";
    } else if (hour === 0) {
      zishi = "早子时";
    }
  }
  const parts = civilParts(used);
  const idx = dayGzIndex(parts.y, parts.m, parts.d);
  const [gan, zhi] = gzFromIndexArr(idx);
  return { gan, zhi, idx, usedMs: used, zishi };
}

function resolveHourPillar(dayGanIdx, shichen) {
  if (!shichen) return [null, null];
  const zhiI = ZHI_LIST.indexOf(shichen);
  const ganI = pmod(ZI_SHI_GAN[dayGanIdx] + zhiI, 10);
  return [GAN_LIST[ganI], ZHI_LIST[zhiI]];
}

/** 天数 ÷ 3 = 岁；余 1 天≈4 个月，余 2 天≈8 个月。不足一天按比例折月。 */
function qiyunFromDays(days) {
  days = Math.abs(days);
  const whole = Math.trunc(days);
  const frac = days - whole;
  let years = Math.floor(whole / 3);
  const rem = whole % 3;
  let months = rem * 4 + Math.round(frac * 4);
  if (months >= 12) {
    years += Math.floor(months / 12);
    months = months % 12;
  }
  return [years, months];
}

/** 从月柱下一柱（顺）或上一柱（逆）起排。月柱本身是起运前小运。 */
function buildDayun(monthGan, monthZhi, forward, qiyunYears, qiyunMonths, steps) {
  steps = steps || 8;
  let gi = GAN_LIST.indexOf(monthGan);
  let zi = ZHI_LIST.indexOf(monthZhi);
  const delta = forward ? 1 : -1;
  const rows = [];
  const startAge = qiyunYears;
  if (qiyunYears > 0 || qiyunMonths > 0) {
    const preEnd = qiyunMonths === 0 ? qiyunYears + "岁" : qiyunYears + "岁" + qiyunMonths + "个月";
    rows.push(["起运前", "0岁-" + preEnd, monthGan + monthZhi + "（小运）"]);
  }
  for (let n = 1; n <= steps; n++) {
    gi = pmod(gi + delta, 10);
    zi = pmod(zi + delta, 12);
    const a0 = startAge + (n - 1) * 10;
    const a1 = a0 + 9;
    rows.push([String(n), a0 + "-" + a1 + "岁", GAN_LIST[gi] + ZHI_LIST[zi]]);
  }
  return rows;
}

function liunianGz(year) {
  return gzFromIndex(yearGzIndex(year));
}

// ---------------------------------------------------------------------------
// 核心排盘
// ---------------------------------------------------------------------------

/**
 * 核心排盘。
 * args: { y, m, d, hour|null, minute|null, shichen|null, sex:"男"|"女", place, nowMs }
 */
function compute(args) {
  const warnings = [];
  let hour = args.hour === undefined ? null : args.hour;
  let minute = args.minute === undefined ? null : args.minute;
  let shichen = args.shichen || null;
  const sex = args.sex;
  const place = args.place || null;
  const nowMs = args.nowMs === undefined || args.nowMs === null ? Date.now() : args.nowMs;
  const clockKnown = hour !== null;
  const shichenKnown = !!shichen;

  if (clockKnown) {
    shichen = hourToShichen(hour, minute || 0);
  } else if (shichenKnown) {
    const mid = SHICHEN_MID[shichen];
    hour = mid[0];
    minute = mid[1];
  } else {
    hour = 12;
    minute = 0;
    warnings.push("时辰未知");
  }

  const birthMs = beijingMs(args.y, args.m, args.d, hour, minute);

  const yearP = resolveYearPillar(birthMs);
  const monthP = resolveMonthPillar(birthMs, GAN_LIST.indexOf(yearP.gan));

  let dayP;
  if (clockKnown) {
    dayP = resolveDayPillar(civilMs(args.y, args.m, args.d), hour, minute);
  } else if (shichenKnown && shichen === "子") {
    dayP = resolveDayPillar(civilMs(args.y, args.m, args.d), 0, 0);
    warnings.push("未提供具体时刻，子时按早子时（当日日柱）处理");
  } else {
    dayP = resolveDayPillar(civilMs(args.y, args.m, args.d), null, null);
  }

  const dayGanIdx = GAN_LIST.indexOf(dayP.gan);
  let hGan = null;
  let hZhi = null;
  let hourUnknown;
  if (clockKnown || shichenKnown) {
    [hGan, hZhi] = resolveHourPillar(dayGanIdx, shichen);
    hourUnknown = false;
  } else {
    hourUnknown = true;
    dayP.zishi = "无";
  }

  const yearGanIdx = GAN_LIST.indexOf(yearP.gan);
  const pillars = {
    year: [yearP.gan, yearP.zhi, shishenOf(dayGanIdx, yearGanIdx), formatCanggan(yearP.zhi)],
    month: [monthP.yueGan, monthP.yueZhi, shishenOf(dayGanIdx, GAN_LIST.indexOf(monthP.yueGan)), formatCanggan(monthP.yueZhi)],
    day: [dayP.gan, dayP.zhi, "—", formatCanggan(dayP.zhi)],
    hour: hourUnknown
      ? ["未知", "未知", "未知", "未知"]
      : [hGan, hZhi, shishenOf(dayGanIdx, GAN_LIST.indexOf(hGan)), formatCanggan(hZhi)],
  };

  // 大运方向：年干甲丙戊庚壬为阳年；阳年男/阴年女顺排
  const yangYear = yearGanIdx % 2 === 0;
  const forward = sex === "男" ? yangYear : !yangYear;

  const jieForQiyun = forward ? monthP.nextJieMs : monthP.prevJieMs;
  if (jieForQiyun === null || jieForQiyun === undefined) throw new Error("无法定位起运所用的节");
  const deltaSec = (jieForQiyun - birthMs) / 1000;
  const qiyunDays = Math.abs(deltaSec) / 86400.0;
  const [qy, qm] = qiyunFromDays(qiyunDays);
  const dayunRows = buildDayun(monthP.yueGan, monthP.yueZhi, forward, qy, qm);

  // 节气交界 / 立春前后：距节或立春 24 小时内
  if (monthP.nextJieMs !== null && Math.abs((birthMs - monthP.nextJieMs) / 1000) <= 86400) {
    warnings.push("节气交界");
  }
  if (Math.abs((birthMs - monthP.prevJieMs) / 1000) <= 86400) {
    if (warnings.indexOf("节气交界") === -1) warnings.push("节气交界");
  }
  if (Math.abs((birthMs - yearP.lichunMs) / 1000) <= 86400) {
    warnings.push("立春前后");
  } else {
    for (const y of [args.y - 1, args.y + 1]) {
      const lc = solarTermBeijing(y, 315);
      if (Math.abs((birthMs - lc) / 1000) <= 86400) {
        warnings.push("立春前后");
        break;
      }
    }
  }

  if (place && clockKnown && nearShichenBoundary(hour, minute || 0)) {
    warnings.push("校正后可能跨时辰");
  }

  const currentYear = beijingParts(nowMs).y;
  const endYear = Math.max(currentYear, args.y);

  let lunarText = null;
  try {
    const [ly, lm, ld, leap] = solarToLunar(args.y, args.m, args.d);
    lunarText = formatLunar(ly, lm, ld, leap);
  } catch (exc) {
    lunarText = "未知";
    warnings.push(String(exc && exc.message ? exc.message : exc));
  }

  let solarText;
  let shichenText;
  if (clockKnown) {
    solarText = pad4(args.y) + "-" + pad2(args.m) + "-" + pad2(args.d) + " " + pad2(hour) + ":" + pad2(minute);
    shichenText = shichen + " / " + pad2(hour) + ":" + pad2(minute);
  } else if (shichenKnown) {
    solarText = pad4(args.y) + "-" + pad2(args.m) + "-" + pad2(args.d);
    shichenText = shichen;
  } else {
    solarText = pad4(args.y) + "-" + pad2(args.m) + "-" + pad2(args.d);
    shichenText = "未知";
  }

  const qiyunText = qm ? qy + "岁" + qm + "个月" : qy + "岁";

  const shensha = computeShensha(yearP.gan, yearP.zhi, monthP.yueGan, monthP.yueZhi, dayP.gan, dayP.zhi, hGan, hZhi, sex);
  const shenshaLines = shensha.lines;

  return {
    birthYear: args.y,
    solarText,
    lunarText,
    shichenText,
    sex,
    place,
    zishi: dayP.zishi,
    pillars,
    forward,
    qiyunText,
    qiyunYears: qy,
    qiyunMonths: qm,
    dayunRows,
    currentYear,
    currentGz: liunianGz(currentYear),
    endYear,
    warnings,
    hourUnknown,
    yearNum: yearP.yearNum,
    jieName: monthP.jieName,
    birthMs,
    shenshaLines,
    shenshaItems: shensha.items,
  };
}

// ---------------------------------------------------------------------------
// 报告 / 图表输出
// ---------------------------------------------------------------------------

/** 完整报告文本（与 pai_pan.py format_report 完全一致，用于对拍）。 */
function formatReport(result) {
  const p = result.pillars;
  const lines = [];
  lines.push("## 输入");
  lines.push("- 阳历：" + result.solarText);
  lines.push("- 农历：" + result.lunarText);
  lines.push("- 时辰：" + result.shichenText);
  lines.push("- 性别：" + result.sex);
  if (result.place) lines.push("- 出生地：" + result.place);
  lines.push("- 子时：" + result.zishi);
  lines.push("");
  lines.push("## 四柱");
  lines.push("| | 年柱 | 月柱 | 日柱 | 时柱 |");
  lines.push("|---|---|---|---|---|");
  lines.push("| 天干 | " + p.year[0] + " | " + p.month[0] + " | " + p.day[0] + " | " + p.hour[0] + " |");
  lines.push("| 地支 | " + p.year[1] + " | " + p.month[1] + " | " + p.day[1] + " | " + p.hour[1] + " |");
  lines.push("| 十神 | " + p.year[2] + " | " + p.month[2] + " | " + p.day[2] + " | " + p.hour[2] + " |");
  lines.push("| 藏干 | " + p.year[3] + " | " + p.month[3] + " | " + p.day[3] + " | " + p.hour[3] + " |");
  lines.push("");
  lines.push("## 大运");
  lines.push("- 方向：" + (result.forward ? "顺排" : "逆排"));
  lines.push("- 起运：" + result.qiyunText);
  lines.push("| 大运序 | 年龄范围 | 干支 |");
  lines.push("|---|---|---|");
  for (const row of result.dayunRows) {
    lines.push("| " + row[0] + " | " + row[1] + " | " + row[2] + " |");
  }
  lines.push("");
  lines.push("## 流年");
  lines.push("- 当前：" + result.currentYear + "年" + result.currentGz);
  for (let y = result.birthYear; y <= result.endYear; y++) {
    lines.push("- " + y + "年" + liunianGz(y));
  }
  lines.push("");
  lines.push("## 神煞");
  for (const s of result.shenshaLines) lines.push(s);
  lines.push("");
  lines.push("## 警告");
  if (result.warnings.length > 0) {
    const seen = new Set();
    for (const w of result.warnings) {
      if (seen.has(w)) continue;
      seen.add(w);
      lines.push("- " + w);
    }
  } else {
    lines.push("- 无");
  }
  lines.push("");
  return lines.join("\n");
}

/** 给 LLM 的命盘数据块（完整、紧凑；含流年裁剪）。 */
function buildChartBlock(result) {
  const p = result.pillars;
  const lines = [];
  lines.push("## 基本信息");
  lines.push("- 公历：" + result.solarText + "（北京时间）");
  lines.push("- 农历：" + result.lunarText);
  lines.push("- 时辰：" + result.shichenText);
  lines.push("- 性别：" + result.sex);
  lines.push("- 子时：" + result.zishi);
  lines.push("");
  lines.push("## 四柱（排盘引擎计算结果）");
  lines.push("| | 年柱 | 月柱 | 日柱 | 时柱 |");
  lines.push("|---|---|---|---|---|");
  lines.push("| 天干 | " + p.year[0] + " | " + p.month[0] + " | " + p.day[0] + " | " + p.hour[0] + " |");
  lines.push("| 地支 | " + p.year[1] + " | " + p.month[1] + " | " + p.day[1] + " | " + p.hour[1] + " |");
  lines.push("| 十神 | " + p.year[2] + " | " + p.month[2] + " | " + p.day[2] + " | " + p.hour[2] + " |");
  lines.push("| 藏干 | " + p.year[3] + " | " + p.month[3] + " | " + p.day[3] + " | " + p.hour[3] + " |");
  lines.push("");
  lines.push("## 大运");
  lines.push("- 方向：" + (result.forward ? "顺排" : "逆排") + "；起运：" + result.qiyunText);
  lines.push("- " + result.dayunRows.map((r) => r[1] + "：" + r[2]).join("；"));
  lines.push("");
  lines.push("## 流年（当前前后三年）");
  const ys = [];
  for (let y = result.currentYear - 2; y <= result.currentYear + 3; y++) {
    if (y >= result.birthYear) ys.push(y + "年" + liunianGz(y));
  }
  lines.push("- 当前：" + result.currentYear + "年" + result.currentGz + "；参考：" + ys.join("，"));
  lines.push("");
  // 给 LLM 的排盘数据块：神煞附准确统计（AI 自行计数会出错）
  const ssItems = result.shenshaItems || [];
  const ssGood = ssItems.filter((s) => s.level === "good").length;
  const ssBad = ssItems.filter((s) => s.level === "bad").length;
  const ssNeu = ssItems.filter((s) => s.level === "neutral").length;
  lines.push(
    "## 神煞（共 " +
      ssItems.length +
      " 条：吉神 " +
      ssGood +
      "、凶煞 " +
      ssBad +
      (ssNeu ? "、中性 " + ssNeu : "") +
      "）"
  );
  if (result.shenshaLines.length > 0) {
    for (const s of result.shenshaLines) lines.push(s);
  } else {
    lines.push("- 无");
  }
  lines.push("");
  lines.push("## 提示");
  if (result.warnings.length > 0) {
    const seen = new Set();
    for (const w of result.warnings) {
      if (seen.has(w)) continue;
      seen.add(w);
      lines.push("- " + w);
    }
  } else {
    lines.push("- 无");
  }
  lines.push("");
  lines.push("> 以上命盘由确定性排盘引擎精确计算（定气定朔），是本次解读的唯一数据依据。");
  return lines.join("\n");
}

/** 前端展示用命盘 JSON（无函数、无内部浮点）。 */
function extractChart(result) {
  const p = result.pillars;
  const pk = (k) => ({ gan: p[k][0], zhi: p[k][1], shishen: p[k][2], canggan: p[k][3] });
  const counts = { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 };
  for (const k of ["year", "month", "day", "hour"]) {
    const g = p[k][0];
    const z = p[k][1];
    if (g && g !== "未知" && GAN_ELEMENT[g]) counts[GAN_ELEMENT[g]] += 1;
    if (z && z !== "未知" && ZHI_ELEMENT[z]) counts[ZHI_ELEMENT[z]] += 1;
  }
  return {
    engine: ENGINE_INFO,
    solarText: result.solarText,
    lunarText: result.lunarText,
    shichenText: result.shichenText,
    sex: result.sex,
    zishi: result.zishi,
    forward: result.forward,
    qiyunText: result.qiyunText,
    currentYear: result.currentYear,
    currentGz: result.currentGz,
    dayMaster: { gan: p.day[0], element: GAN_ELEMENT[p.day[0]] || null },
    pillars: { year: pk("year"), month: pk("month"), day: pk("day"), hour: pk("hour") },
    elements: counts,
    dayun: result.dayunRows.slice(0, 8).map((r) => ({ seq: r[0], ages: r[1], gz: r[2] })),
    warnings: result.warnings.slice(),
    shensha: (result.shenshaItems || []).map((s) => ({
      name: s.name,
      positions: s.positions,
      method: s.method,
      level: s.level,
    })),
  };
}

// ---------------------------------------------------------------------------
// 输入校验 + 编排
// ---------------------------------------------------------------------------

const LANG_NAME = { en: "English", zh: "简体中文", ja: "日本語", ko: "한국어", es: "Español", fr: "Français", de: "Deutsch", pt: "Português", ru: "Русский", ar: "العربية" };
const FOCUS_GLOSS = {
  general: "综合（general）",
  career: "事业与成就（career）",
  love: "感情与婚恋（love & relationships）",
  wealth: "财富与财运（wealth）",
  health: "健康与身心（health）",
};

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^\d{2}:\d{2}$/;

/**
 * 校验 + 排盘。输入：{ birthDate:"YYYY-MM-DD", birthTime?:"HH:MM", gender?:"male"|"female", sex?:"男"|"女", nowMs? }
 * 返回 { result, chart, chartBlock }
 */
function run(payload) {
  const birthDate = String((payload && payload.birthDate) || "");
  const m = DATE_RE.exec(birthDate);
  if (!m) throw new Error("birthDate must be YYYY-MM-DD");
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const d = parseInt(m[3], 10);
  if (y < 1900 || y > 2100) throw new Error("birthDate year must be 1900-2100");
  const rt = new Date(Date.UTC(y, mo - 1, d));
  if (rt.getUTCFullYear() !== y || rt.getUTCMonth() !== mo - 1 || rt.getUTCDate() !== d) {
    throw new Error("birthDate is not a real calendar date");
  }

  let hour = null;
  let minute = null;
  const rawTime = payload && payload.birthTime ? String(payload.birthTime).trim() : "";
  if (rawTime) {
    if (!TIME_RE.test(rawTime)) throw new Error("birthTime must be HH:MM");
    hour = parseInt(rawTime.slice(0, 2), 10);
    minute = parseInt(rawTime.slice(3, 5), 10);
    if (hour > 23 || minute > 59) throw new Error("birthTime out of range");
  }

  let sex = payload && payload.sex ? payload.sex : null;
  if (!sex && payload && payload.gender) {
    sex = payload.gender === "male" ? "男" : payload.gender === "female" ? "女" : null;
  }
  if (sex !== "男" && sex !== "女") throw new Error("gender must be male or female");

  const result = compute({ y, m: mo, d, hour, minute, sex, nowMs: payload && payload.nowMs });
  const chart = extractChart(result);
  const chartBlock = buildChartBlock(result);
  return { result, chart, chartBlock };
}

/**
 * 构建 LLM 消息（解读模式：引擎已排盘，AI 只解读）。
 */
function buildPrompt(payload, chartBlock, opts) {
  // overviewOnly=true：只生成第①段「命盘总览」（免费部分），不生成付费章节
  const overviewOnly = !!(opts && opts.overviewOnly);
  const locale = (payload && payload.locale) || "en";
  const language = LANG_NAME[locale] || "English";
  const focus = FOCUS_GLOSS[(payload && payload.focus) || "general"] || FOCUS_GLOSS.general;
  const name = (payload && payload.name) || "";
  const genderZh = payload && payload.gender === "female" ? "女" : "男";

  const system = [
    "你是「痕迹 Traces」的专业四柱八字解读师，精通子平命理体系（穷通宝典、滴天髓、子平真诠、三命通会等）。",
    "",
    "【最重要的规则】",
    "1. 命主的四柱、十神、藏干、大运等数据由确定性排盘引擎（定气定朔、北京时间、分钟级精度）精确计算，是既定事实。",
    "2. 你只负责解读，严禁重新排盘、修改或质疑引擎给出的任何干支数据。",
    "3. 若时柱显示「未知」，请如实说明出生时间缺失导致信息不全，并温和提示补充出生时间可获得更完整的解读；绝对不得臆造时柱。",
    "",
    ...(overviewOnly
      ? [
          "报告结构（Markdown）：",
          "① 【命盘总览】日主特性与格局气象",
          "",
          "【本次只输出第①段】不要输出五行、十神、神煞、大运、建议等任何其他章节；",
          "篇幅 300 字左右：点出日主特性与格局气象，让读者有整体感，但不替代完整解读；",
          "不要在正文里推销或提及付费。",
          "",
        ]
      : [
          "报告结构（Markdown，层次清晰）：",
          "① 【命盘总览】日主特性与格局气象",
          "② 【五行与平衡】五行强弱分布、喜用神倾向",
          "③ 【十神与性格】性格特质、天赋优势与潜在盲点",
          "④ 【神煞详解】命局所带神煞逐一解读（要求见下）",
          "⑤ 【大运与近况】当前所处大运的主题、近三年流年提示",
          "⑥ 【重点建议】围绕用户关注方向，给出具体、可执行的建议",
          "",
        ]),
    ...(overviewOnly ? [] : [
    "【神煞详解要求（重要）】",
    "- 引擎「## 神煞」列出的每一条都要交代，不得只挑天乙贵人、桃花、驿马等常见条目；",
    "- 先归类再展开：吉神（天乙、天德、月德、文昌、学堂、词馆、将星、华盖、驿马、天医、禄神、金舆）说明其助力所在；凶煞（羊刃、劫煞、灾煞、亡神、孤辰、寡宿、空亡、元辰、血刃）说明其表现倾向与化解方向，语气中性、不恐吓；桃花/咸池等中性条目客观陈述；",
    "- 每条结合所在柱位说明影响领域：年支主早年根基与长辈、月支主事业环境与父母、日支主婚姻与内在性格、时支主晚景与子女；只泛泛罗列神煞名称而不结合柱位的解读视为不合格；",
    "- 神煞是旁证：论命以日主旺衰、格局、用神为主，神煞只作辅助佐证，不得喧宾夺主；",
    "- 神煞条目较多时，可先总述吉凶格局（如「贵人护身、亦带两煞」），再逐条展开；若提及条数，必须与「## 神煞」标题中的引擎统计完全一致（不得自行计数、不得遗漏任何一条）；",
    "",
    ]),
    // 英文（及西语/法语/德语/葡语/俄语/阿语等）报告附标准术语表，保证译名统一
    ...(locale === "zh" || locale === "ja" || locale === "ko"
      ? []
      : [
          "【English terminology — use these exact terms throughout】",
          "- 四柱 Four Pillars · 命盘 Natal Chart · 日主 Day Master · 十神 Ten Gods · 藏干 Hidden Stems · 五行 Five Elements",
          "- 五行: Wood 木 · Fire 火 · Earth 土 · Metal 金 · Water 水",
          "- 天干 Heavenly Stems: Jia 甲 · Yi 乙 · Bing 丙 · Ding 丁 · Wu 戊 · Ji 己 · Geng 庚 · Xin 辛 · Ren 壬 · Gui 癸",
          "- 地支 Earthly Branches: Zi 子 · Chou 丑 · Yin 寅 · Mao 卯 · Chen 辰 · Si 巳 · Wu 午 · Wei 未 · Shen 申 · You 酉 · Xu 戌 · Hai 亥",
          "- 干支写为「拼音大写 + 中文原字」，如 Jia-Zi 甲子、Geng-Wu 庚午（首次出现附中文，之后可只用拼音）",
          "- 十神: Companion 比肩 · Rob Wealth 劫财 · Eating God 食神 · Hurting Officer 伤官 · Indirect Wealth 偏财 · Direct Wealth 正财 · Seven Killings 偏官 · Direct Officer 正官 · Indirect Resource 偏印 · Direct Resource 正印",
          "- 大运 Luck Pillars (ten-year cycles) · 流年 Annual Pillars · 起运 luck start age · 格局 chart pattern · 用神 useful god · 喜用神 favourable elements · 忌神 unfavourable elements · 空亡 Void · 节气 solar terms · 真太阳时 true solar time",
          "- 神煞 Auxiliary Stars（统一用以下名称）: 天乙贵人 Nobleman · 天德 Heavenly Virtue · 月德 Monthly Virtue · 文昌 Literary Star · 学堂 Academy Star · 词馆 Literary Hall · 将星 General Star · 华盖 Canopy Star · 驿马 Traveling Horse · 天医 Heavenly Doctor · 禄神 Prosperity Star · 金舆 Golden Carriage · 羊刃 Yang Blade · 劫煞 Robbery Sha · 灾煞 Disaster Sha · 亡神 Loss Star · 桃花/咸池 Peach Blossom · 孤辰 Lonely Star · 寡宿 Widowhood Star · 空亡/旬空 Void · 元辰 Adversity Star · 血刃 Blood Blade",
          "- 以上为行业标准译名，不得自创；神煞名首次出现时可在括号内附中文原字（如 Nobleman 天乙贵人）。",
          "",
        ]),
    "写作要求：",
    overviewOnly
      ? "- 全程使用" + language + "输出，约 300 字（英文约 200 words），只写第①段。"
      : "- 全程使用" + language + "输出，约 900–1200 词（英文报告不超过 1200 words）；其中神煞部分逐条 1–2 句、简明扼要，不必展开成长篇；",
    "- 语气专业、温和、有建设性，避免绝对化预测与任何恐吓性断语；",
    "- 结尾附一句温和提示：命理为传统文化参考，人生的方向始终由自己掌握。",
  ].join("\n");

  const user = [
    "【命盘数据 — 由排盘引擎精确计算，请原样采用】",
    chartBlock,
    "",
    "【命主信息】",
    "- 姓名：" + (name || "未提供"),
    "- 性别：" + genderZh,
    "- 关注方向：" + focus,
    "",
    overviewOnly
      ? "请基于以上命盘，只输出第①段【命盘总览】（" + language + "，Markdown 格式，约 300 字）。"
      : "请基于以上命盘输出完整解读报告（" + language + "，Markdown 格式）。",
  ].join("\n");

  return { system, user };
}

module.exports = {
  ENGINE_INFO,
  compute,
  run,
  formatReport,
  buildChartBlock,
  extractChart,
  buildPrompt,
  // 以下导出便于测试与对拍
  dayGzIndex,
  yearGzIndex,
  liunianGz,
  solarTermBeijing,
  deltaTSeconds,
  jdn,
};
