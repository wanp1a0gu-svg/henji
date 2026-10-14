/**
 * 真太阳时（True Solar Time）校正模块
 * ===========================================================================
 * 传统命理排盘采用出生地的**真太阳时**定时柱（时辰），而非钟表时间：
 *
 *   真太阳时 = 出生地钟表时间 + 经度时差 + 均时差，其中：
 *
 *   ① 经度时差 =（出生地经度 − 当地时区标准经线）× 4 分钟
 *      · 中国（东八区，标准经线 120°E）：如丹东 124.36°E → +17.4 分钟
 *      · 海外按出生地 IANA 时区计算（自动处理夏令时），如纽约 -74°E（EDT）→ −56 分钟
 *   ② 均时差（Equation of Time）= 真太阳时 − 平太阳时，全年约 −14 ~ +16 分钟，
 *      由地球轨道偏心率与黄赤交角引起（NOAA 公式，精度 ±0.1 分钟）
 *
 * 校正会影响时柱（时辰）；若校正后跨过 23:00 或 0:00，日柱亦随之变化。
 *
 * 数据：lib/cities-data.json（中国省市县 3363 条 + 世界城市 5653 条，含时区）
 *   中国数据来源：laiwz/city（民政部/统计局行政区划 + 坐标）
 *   世界数据来源：GeoNames cities15000（CC-BY 4.0）+ 非拉丁文别名
 *   繁简转换：OpenCC TSCharacters（lib/trad2simp.json）
 *
 * ⚠️ 本模块不修改 bazi-engine.js（保持与 pai_pan.py 的对拍一致性），
 *    而是在 API 层将「校正后的日期时间」喂给引擎。
 */
const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// 数据加载与索引
// ---------------------------------------------------------------------------

let DATA = null;
let INDEX = null; // normalizedKey -> [entry,...]，entry = { name, lng, level, parent, aliases, pop }
let TRAD2SIMP = null;

const CN_SUFFIXES = [
  "特别行政区", "维吾尔自治区", "壮族自治区", "回族自治区", "自治区",
  "自治州", "地区", "盟", "省", "市", "县", "区",
];

function toSimp(s) {
  if (!TRAD2SIMP) {
    try {
      TRAD2SIMP = JSON.parse(fs.readFileSync(path.join(__dirname, "trad2simp.json"), "utf8"));
    } catch {
      TRAD2SIMP = {};
    }
  }
  let out = "";
  for (const ch of String(s || "")) out += TRAD2SIMP[ch] || ch;
  return out;
}

/** 归一化：繁→简、小写、去空白与常见标点（CJK 保持原样）。 */
function normalize(s) {
  return toSimp(String(s || ""))
    .toLowerCase()
    .replace(/[\s\u3000.,'’·\-_()（）]/g, "")
    .trim();
}

function stripSuffix(name) {
  for (const suf of CN_SUFFIXES) {
    if (name.length > suf.length && name.endsWith(suf)) return name.slice(0, -suf.length);
  }
  return name;
}

function loadData() {
  if (DATA) return DATA;
  const file = path.join(__dirname, "cities-data.json");
  DATA = JSON.parse(fs.readFileSync(file, "utf8"));
  return DATA;
}

function buildIndex() {
  if (INDEX) return INDEX;
  const data = loadData();
  INDEX = new Map();
  const add = (key, entry) => {
    const k = normalize(key);
    if (!k || k.length < 2) return;
    const bucket = INDEX.get(k);
    if (bucket) {
      if (!bucket.entries.includes(entry)) bucket.entries.push(entry);
    } else {
      INDEX.set(k, { orig: String(key), entries: [entry] });
    }
  };

  for (const row of data.cn) {
    const entry = { name: row[0], lng: row[1], level: row[2], parent: row[3], aliases: row[4] || [] };
    add(entry.name, entry);
    const stripped = stripSuffix(entry.name);
    if (stripped !== entry.name) add(stripped, entry);
    for (const a of entry.aliases) add(a, entry);
  }
  for (const row of data.world) {
    const entry = { name: row[0], lng: row[1], level: 0, parent: row[2], aliases: row[4] || [], pop: row[5] || 0, tz: row[6] || "" };
    add(entry.name, entry);
    for (const a of entry.aliases) add(a, entry);
  }
  return INDEX;
}

// ---------------------------------------------------------------------------
// 出生地 → 经度
// ---------------------------------------------------------------------------

/**
 * 查询出生地经度。
 * 匹配策略：① 纯数字视为经度 ② 繁转简归一化后统一评分：
 *    完全匹配 > 输入含地名 > 地名含输入；并结合父级地名、行政层级、城市人口消解歧义。
 * 返回 { lng, name, level, parent, matchedKey } 或 null。
 */
function lookupLongitude(place) {
  const raw = String(place || "").trim();
  if (!raw) return null;

  // ① 直接给经度：如 "116.4" / "116.4E" / "东经116.4" / "-74.0"
  const lngRe = /^(?:[eE东](?:经)?\s*)?(-?\d{1,3}(?:\.\d+)?)\s*(?:°|度)?\s*[eE东]?$/;
  const lngMatch = lngRe.exec(raw);
  if (lngMatch) {
    const v = parseFloat(lngMatch[1]);
    if (v >= -180 && v <= 180) {
      return { lng: v, name: raw, level: -1, parent: "", matchedKey: raw };
    }
  }

  // ② 统一评分匹配（完全 / 输入含地名 / 地名含输入，同名歧义由评分规则消解）
  //    查询变体：整串 + 按逗号切分的段（处理 "New York, USA" 这类写法）
  const index = buildIndex();
  const hasCJK = /[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(raw);
  const variants = [raw];
  for (const part of raw.split(/[,，;；、]/)) {
    if (part.trim() && part.trim() !== raw.trim()) variants.push(part.trim());
  }

  let best = null;
  for (let vi = 0; vi < variants.length; vi++) {
    const v = variants[vi];
    const q = normalize(v);
    if (!q || q.length < 2) continue;
    const penalty = vi * 3; // 切分后的片段略降权，整串始终优先

    for (const [key, bucket] of index) {
      let rel = key === q || key.includes(q);
      if (!rel && q.includes(key)) {
        // 拉丁文地名：要求词边界（防止 california 命中 cali 这类误配）
        rel = hasCJK ? true : containsAsWord(v, bucket.orig);
      }
      if (!rel) continue;
      for (const e of bucket.entries) {
        const s = scoreMatch(e, key, q, v, hasCJK) - penalty;
        if (!best || s > best.score) best = { entry: e, key, score: s };
      }
    }
  }
  return best ? toResult(best.entry, best.key) : null;
}

/** s 是否以「单词」形式出现在 hay 中（两侧为词边界）。 */
function containsAsWord(hay, s) {
  if (!s) return false;
  const h = String(hay).toLowerCase();
  const n = String(s).toLowerCase();
  let i = h.indexOf(n);
  while (i >= 0) {
    const before = i === 0 || !/[a-z0-9]/.test(h[i - 1]);
    const after = i + n.length >= h.length || !/[a-z0-9]/.test(h[i + n.length]);
    if (before && after) return true;
    i = h.indexOf(n, i + 1);
  }
  return false;
}

/**
 * 匹配评分（越高越可信）：
 *  - 完全匹配 300；输入⊃地名 / 地名⊃输入 100 + 覆盖率×80
 *  - 查询覆盖率×60：地名能解释多少比例的输入（New York → New York City 优于 York）
 *  - 全名在输入中出现 +50（仅 CJK：拉丁文由覆盖率处理，避免 York 沾 New York 的光）
 *  - 父级地名也在输入中出现 +50（仅行政层级，世界城市父级是国家代码，不参与）
 *  - 行政层级向「地级市」收敛；中文地址命中越靠后（越具体）越优先
 *  - 世界城市按人口加权（New York 胜过 York）
 */
function scoreMatch(e, key, q, raw, hasCJK) {
  let s = 0;
  if (q === key) {
    s += 300;
  } else if (q.includes(key)) {
    s += 100 + (key.length / Math.max(q.length, 1)) * 80;
  } else {
    s += 100 + (q.length / Math.max(key.length, 1)) * 80;
  }

  s += (Math.min(key.length, q.length) / Math.max(q.length, 1)) * 60;

  if (hasCJK) {
    const full = normalize(e.name);
    if (full.length >= 2 && q.includes(full)) s += 50;
  } else if (q === key) {
    s += 30; // 拉丁文完全匹配的额外确认
  }

  if (e.parent && e.level >= 1) {
    const p = normalize(e.parent);
    if (p && q.includes(p)) s += 50 + Math.min(e.level, 3) * 8;
  }

  // 中文地址「省→市→区」从粗到细书写：命中位置越靠后越具体
  if (hasCJK) {
    const pos = q.lastIndexOf(key);
    if (pos > 0) s += (pos / q.length) * 25;
  }

  s += e.level === 2 ? 12 : e.level === 1 || e.level === 3 ? 6 : 0;

  if (e.pop) s += Math.min(40, Math.log10(e.pop + 1) * 5);

  return s;
}

function toResult(e, key) {
  return { lng: e.lng, name: e.name, level: e.level, parent: e.parent, matchedKey: key, tz: e.tz || "" };
}

// ---------------------------------------------------------------------------
// 均时差（Equation of Time，NOAA 公式）
// ---------------------------------------------------------------------------

function dayOfYear(y, m, d) {
  const start = Date.UTC(y, 0, 1);
  const cur = Date.UTC(y, m - 1, d);
  return Math.round((cur - start) / 86400000) + 1;
}

/** 均时差（分钟）：真太阳时 − 平太阳时。2 月约 −14 分，11 月约 +16 分。 */
function equationOfTimeMin(y, m, d) {
  const n = dayOfYear(y, m, d);
  const gamma = ((2 * Math.PI) / 365) * (n - 1);
  const eq =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));
  return eq;
}

// ---------------------------------------------------------------------------
// 时区处理
// ---------------------------------------------------------------------------

/**
 * 某时刻在指定 IANA 时区的 UTC 偏移（分钟，含夏令时）。
 * 通过 Intl 实现；环境不支持时返回 null。
 */
function tzOffsetMinutes(tz, utcMs) {
  if (!tz) return null;
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const m = {};
    for (const p of dtf.formatToParts(new Date(utcMs))) m[p.type] = p.value;
    const hour = m.hour === "24" ? 0 : parseInt(m.hour, 10);
    const asUtc = Date.UTC(
      parseInt(m.year, 10),
      parseInt(m.month, 10) - 1,
      parseInt(m.day, 10),
      hour,
      parseInt(m.minute, 10),
      parseInt(m.second, 10)
    );
    return Math.round((asUtc - utcMs) / 60000);
  } catch {
    return null;
  }
}

/**
 * 出生地时区的 UTC 偏移（分钟）。
 *  - 中国（含港澳台）：固定 +480（东八区）。中国 1986–1991 年曾行夏令时，
 *    但排盘惯例以北京时间（钟表时间）为准，此处不自动加夏令时，另行提示。
 *  - 海外：按 IANA 时区 + 出生时刻计算（自动处理夏令时）。
 *  - 兜底：按经度取自然时区 round(lng/15)*15。
 */
function localityOffsetMinutes(entry, utcMs) {
  if (entry.level >= 1) return 480; // 中国行政区划
  const off = tzOffsetMinutes(entry.tz, utcMs);
  if (off !== null) return off;
  return Math.round(entry.lng / 15) * 15 * 4; // 兜底：自然时区
}

/** 中国 1986–1991 年夏令时窗口（仅用于提示用户核对）。 */
const CN_DST_WINDOWS = [
  ["1986-05-04", "1986-09-14"],
  ["1987-04-12", "1987-09-13"],
  ["1988-04-10", "1988-09-11"],
  ["1989-04-16", "1989-09-17"],
  ["1990-04-15", "1990-09-16"],
  ["1991-04-14", "1991-09-15"],
];

function inCnDst(dateStr) {
  return CN_DST_WINDOWS.some(([a, b]) => dateStr >= a && dateStr <= b);
}

// ---------------------------------------------------------------------------
// 校正主逻辑
// ---------------------------------------------------------------------------

const ZHICHEN = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

/** 小时（0-23 + 分钟）→ 时辰地支（23:00-00:59 为子时）。 */
function hourToZhi(hour, minute) {
  const total = (hour * 60 + minute + 60) % 1440; // 23:00 归入次日 0 点体系，此处仅用于取支
  const idx = Math.floor(total / 120) % 12;
  return ZHICHEN[idx];
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function fmtDate(ms) {
  const dt = new Date(ms);
  return dt.getUTCFullYear() + "-" + pad2(dt.getUTCMonth() + 1) + "-" + pad2(dt.getUTCDate());
}

function fmtTime(ms) {
  const dt = new Date(ms);
  return pad2(dt.getUTCHours()) + ":" + pad2(dt.getUTCMinutes());
}

/**
 * 计算真太阳时校正。
 * input: { birthDate:'YYYY-MM-DD', birthTime:'HH:MM'|null|undefined, place }
 * 返回对象（applied=false 时 reason 说明原因）。
 */
function correct(input) {
  const birthDate = String((input && input.birthDate) || "");
  const birthTime = input && input.birthTime ? String(input.birthTime) : "";
  const place = String((input && input.place) || "").trim();

  const base = { applied: false, place, reason: null };
  if (!place) {
    base.reason = "no_place";
    return base;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    base.reason = "bad_date";
    return base;
  }
  if (!/^\d{2}:\d{2}$/.test(birthTime)) {
    base.reason = "no_time";
    return base;
  }

  const loc = lookupLongitude(place);
  if (!loc) {
    base.reason = "place_not_found";
    return base;
  }

  const y = parseInt(birthDate.slice(0, 4), 10);
  const m = parseInt(birthDate.slice(5, 7), 10);
  const d = parseInt(birthDate.slice(8, 10), 10);
  const hh = parseInt(birthTime.slice(0, 2), 10);
  const mm = parseInt(birthTime.slice(3, 5), 10);
  if (hh > 23 || mm > 59) {
    base.reason = "bad_time";
    return base;
  }

  // 出生地时区偏移（两次迭代收敛，正确处理夏令时）
  let tzOffsetMin = 480;
  for (let i = 0; i < 2; i++) {
    const utcMs = Date.UTC(y, m - 1, d, hh, mm) - tzOffsetMin * 60000;
    tzOffsetMin = localityOffsetMinutes(loc, utcMs);
  }

  // 真太阳时偏移 =（出生地经度 − 时区标准经线）× 4 分钟 + 均时差
  //              = 4 × 经度 − 时区偏移（分钟）+ 均时差
  const lngOffsetMin = loc.lng * 4 - tzOffsetMin;
  const eotMin = equationOfTimeMin(y, m, d);
  const totalOffsetMin = lngOffsetMin + eotMin;

  const clockMs = Date.UTC(y, m - 1, d, hh, mm);
  const trueMs = clockMs + Math.round(totalOffsetMin * 60000);

  const trueDate = fmtDate(trueMs);
  const trueTime = fmtTime(trueMs);

  const zhiFrom = hourToZhi(hh, mm);
  const zhiTo = hourToZhi(
    parseInt(trueTime.slice(0, 2), 10),
    parseInt(trueTime.slice(3, 5), 10)
  );

  return {
    applied: true,
    place,
    matched: loc.name,
    matchedParent: loc.parent,
    level: loc.level,
    longitude: Math.round(loc.lng * 100) / 100,
    tzOffsetMin,
    lngOffsetMin: Math.round(lngOffsetMin * 10) / 10,
    eotMin: Math.round(eotMin * 10) / 10,
    totalOffsetMin: Math.round(totalOffsetMin * 10) / 10,
    clockDate: birthDate,
    clockTime: birthTime,
    trueDate,
    trueTime,
    zhiFrom,
    zhiTo,
    dateShifted: trueDate !== birthDate,
    zhiShifted: zhiFrom !== zhiTo,
    cnDstHint: loc.level >= 1 && inCnDst(birthDate),
  };
}

/** 生成给 LLM 的说明块（附在排盘数据之后）。 */
function toPromptBlock(ts) {
  if (!ts || !ts.applied) return "";
  const lines = [];
  lines.push("【真太阳时校正】");
  lines.push(
    "- 出生地：" + ts.place + "（已识别：" + ts.matched + (ts.matchedParent ? "，" + ts.matchedParent : "") +
      "，东经 " + ts.longitude + "°）"
  );
  lines.push(
    "- 钟表时间（出生地当地时间）：" + ts.clockDate + " " + ts.clockTime +
      " → 真太阳时：" + ts.trueDate + " " + ts.trueTime
  );
  lines.push(
    "- 校正量：经度时差 " + signed(ts.lngOffsetMin) + " 分 + 均时差 " + signed(ts.eotMin) +
      " 分 = " + signed(ts.totalOffsetMin) + " 分钟"
  );
  if (ts.zhiShifted) {
    lines.push(
      "- ⚠️ 校正后时辰由「" + ts.zhiFrom + "时」变为「" + ts.zhiTo + "时」（" +
        (ts.dateShifted ? "且日期变化，日柱随之调整；" : "") +
        "排盘四柱已按真太阳时计算，请以引擎结果为准）"
    );
  }
  if (ts.cnDstHint) {
    lines.push("- 提示：该年份中国曾实行夏令时，若出生时间按夏令时钟表记录，建议提示用户核对（当前按北京时间标准时处理）。");
  }
  lines.push("- 提示：排盘四柱、大运、流年等均已按真太阳时结果输出，解读时可直接说明此为校正后结果。");
  return lines.join("\n");
}

function signed(v) {
  const r = Math.round(v * 10) / 10;
  return (r >= 0 ? "+" : "") + r;
}

module.exports = {
  lookupLongitude,
  equationOfTimeMin,
  correct,
  toPromptBlock,
  hourToZhi,
  // 测试用
  normalize,
  stripSuffix,
};
