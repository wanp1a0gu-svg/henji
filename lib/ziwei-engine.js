#!/usr/bin/env node
/**
 * 紫微斗数排盘引擎 · 零依赖
 * ===========================================================================
 * 算法口径对齐 github.com/Renhuai123/ziwei-doushu（MIT）的默认设置，其又基于
 * iztro@2.5.8（MIT）。本文件是独立重写，不引入任何 npm 依赖。
 *
 * 对齐的关键口径（与主流排盘软件一致）：
 *   · 换年：正月初一换年（不是立春）——影响五行局、命主身主、四化、紫微定位
 *   · 命宫：寅起正月，顺数至生月，逆数生时；身宫顺数生时
 *   · 五行局：纳音取数法
 *   · 起紫微：局数除日数，凑整除，偶数偏移顺行、奇数逆行
 *   · 四化：庚年取「阳武阴同」（主流默认；另有 4 种变体，见 references/schools.md）
 *   · 闰月：月中分界（前 15 天归本月，后 15 天归下月）
 *
 * 农历数据：1900–2100 编码表，取自 solarlunar（ISC, © Ajing/JJonline.Cn）的通行
 *           lunarInfo 表，转换逻辑按其 solar2lunar 重写。
 * 亮度表：全书派 QS 表，取自上述仓库 school-data.ts；仅作参考（庙旺表流派分歧大）。
 * ===========================================================================
 */

'use strict';

// ─── 基础常量 ───────────────────────────────────────────────────────────────

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/** 十二宫名（从命宫起，逆时针） */
const PALACE_NAMES = ['命宫', '兄弟宫', '夫妻宫', '子女宫', '财帛宫', '疾厄宫',
  '迁移宫', '交友宫', '官禄宫', '田宅宫', '福德宫', '父母宫'];

/** 五虎遁：年干 → 寅宫天干（甲己丙、乙庚戊、丙辛庚、丁壬壬、戊癸甲） */
const TIGER_RULE = ['丙', '戊', '庚', '壬', '甲'];

/** 五行局：纳音取数 1木 2金 3水 4火 5土 */
const JU_BY_NUM = { 1: '木三局', 2: '金四局', 3: '水二局', 4: '火六局', 5: '土五局' };
const JU_COUNT = { 木三局: 3, 金四局: 4, 水二局: 2, 火六局: 6, 土五局: 5 };

/** 四化表：年干索引 → [化禄, 化权, 化科, 化忌]（庚年取阳武阴同） */
const SIHUA = [
  ['廉贞', '破军', '武曲', '太阳'], // 甲
  ['天机', '天梁', '紫微', '太阴'], // 乙
  ['天同', '天机', '文昌', '廉贞'], // 丙
  ['太阴', '天同', '天机', '巨门'], // 丁
  ['贪狼', '太阴', '右弼', '天机'], // 戊
  ['武曲', '贪狼', '天梁', '文曲'], // 己
  ['太阳', '武曲', '太阴', '天同'], // 庚 ← 阳武阴同
  ['巨门', '太阳', '文曲', '文昌'], // 辛
  ['天梁', '紫微', '左辅', '武曲'], // 壬
  ['破军', '巨门', '太阴', '贪狼'], // 癸
];

/** 命主：按命宫地支（子起） */
const MING_ZHU = ['贪狼', '巨门', '禄存', '文曲', '廉贞', '武曲',
  '破军', '武曲', '廉贞', '文曲', '禄存', '巨门'];

/** 身主：按年支（子起） */
const SHEN_ZHU = ['火星', '天相', '天梁', '天同', '文昌', '天机',
  '火星', '天相', '天梁', '天同', '文昌', '天机'];

/** 主星亮度（全书派 QS 表，列序 子→亥；1庙 2旺 3得 4利 5平 6不 7陷） */
const BRIGHTNESS = {
  紫微: [5, 1, 2, 2, 3, 2, 1, 1, 2, 2, 3, 2],
  天机: [1, 7, 3, 2, 4, 5, 1, 7, 3, 2, 4, 5],
  太阳: [7, 6, 2, 1, 2, 2, 2, 3, 3, 5, 6, 7],
  武曲: [2, 1, 3, 4, 1, 5, 2, 1, 3, 4, 1, 5],
  天同: [2, 6, 4, 5, 5, 1, 7, 6, 2, 5, 5, 1],
  廉贞: [5, 4, 1, 5, 4, 7, 5, 4, 1, 5, 4, 7],
  天府: [1, 1, 1, 3, 1, 3, 2, 1, 3, 2, 1, 3],
  太阴: [1, 1, 2, 7, 7, 7, 6, 6, 4, 2, 2, 1],
  贪狼: [2, 1, 5, 4, 1, 7, 2, 1, 5, 4, 1, 7],
  巨门: [2, 6, 1, 1, 7, 2, 2, 6, 1, 1, 7, 2],
  天相: [1, 1, 1, 7, 3, 3, 1, 3, 1, 7, 3, 3],
  天梁: [1, 2, 1, 1, 1, 3, 1, 2, 7, 3, 1, 7],
  七杀: [2, 1, 1, 2, 1, 5, 2, 1, 1, 2, 1, 5],
  破军: [1, 2, 3, 7, 2, 5, 1, 2, 3, 7, 2, 5],
};
const BR_CN = { 1: '庙', 2: '旺', 3: '得', 4: '利', 5: '平', 6: '不', 7: '陷' };

/** 农历 1900–2100 闰月大小编码表（solarlunar, ISC） */
const LUNAR_INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
  0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a4d0, 0x0d150, 0x0f252,
  0x0d520,
];

// ─── 小工具 ─────────────────────────────────────────────────────────────────

const mod = (v, n = 12) => ((v % n) + n) % n;
const pad2 = (n) => String(n).padStart(2, '0');

/** 地支名 → 宫位索引（寅=0；命盘十二宫自寅起排） */
const P = (branchName) => mod(BRANCHES.indexOf(branchName) - 2);
/** 宫位索引 → 地支名 */
const BR = (palaceIdx) => BRANCHES[mod(palaceIdx + 2)];

// ─── 农历转换 ───────────────────────────────────────────────────────────────

function lYearDays(y) {
  let sum = 348;
  for (let i = 0x8000; i > 0x8; i >>= 1) sum += (LUNAR_INFO[y - 1900] & i) ? 1 : 0;
  return sum + leapDays(y);
}
function leapMonth(y) { return LUNAR_INFO[y - 1900] & 0xf; }
function leapDays(y) { return leapMonth(y) ? ((LUNAR_INFO[y - 1900] & 0x10000) ? 30 : 29) : 0; }
function monthDays(y, m) { return (LUNAR_INFO[y - 1900] & (0x10000 >> m)) ? 30 : 29; }

/**
 * 公历 → 农历。
 * @returns {{lYear:number,lMonth:number,lDay:number,isLeap:boolean}|null}
 */
function solar2lunar(y, m, d) {
  if (y < 1900 || y > 2100) return null;
  if (y === 1900 && m === 1 && d < 31) return null;
  let offset = (Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 31)) / 86400000;
  let i, temp = 0;
  for (i = 1900; i < 2101 && offset > 0; i++) { temp = lYearDays(i); offset -= temp; }
  if (offset < 0) { offset += temp; i--; }
  const lYear = i;
  const leap = leapMonth(i);
  let isLeap = false;
  for (i = 1; i < 13 && offset > 0; i++) {
    if (leap > 0 && i === leap + 1 && isLeap === false) { --i; isLeap = true; temp = leapDays(lYear); }
    else { temp = monthDays(lYear, i); }
    if (isLeap === true && i === leap + 1) isLeap = false;
    offset -= temp;
  }
  if (offset === 0 && leap > 0 && i === leap + 1) {
    if (isLeap) isLeap = false;
    else { isLeap = true; --i; }
  }
  if (offset < 0) { offset += temp; --i; }
  return { lYear, lMonth: i, lDay: offset + 1, isLeap };
}

// ─── 真太阳时 ───────────────────────────────────────────────────────────────

/** NOAA 均时差（分钟）：真太阳时 − 平太阳时 */
function equationOfTime(y, m, d, hh, mm) {
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const doy = Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86400000);
  const gamma = (2 * Math.PI / (leap ? 366 : 365)) * (doy - 1 + (hh + mm / 60 - 12) / 24);
  return 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
}

/**
 * 钟表时间 → 真太阳时。
 * @param {number} lng 出生地经度（东经正）；不传则不做校正
 * @param {number} utcOffset 钟表时区的标准偏移（分钟，东八区=480）
 */
function toTrueSolar(y, m, d, hh, mm, lng, utcOffset) {
  const meridian = (utcOffset === undefined ? 480 : utcOffset) / 4;
  const corrected = typeof lng === 'number' && isFinite(lng);
  const lngMin = corrected ? (lng - meridian) * 4 : 0;
  const eot = corrected ? equationOfTime(y, m, d, hh, mm) : 0;
  const total = lngMin + eot;
  const rawSec = Math.round((hh * 60 + mm + total) * 60);
  const dayOffset = Math.floor(rawSec / 86400);
  const secOfDay = mod(rawSec, 86400);
  const hour = Math.floor(secOfDay / 3600);
  const minute = Math.floor((secOfDay % 3600) / 60);
  return {
    corrected, lngCorrection: Math.round(lngMin * 10) / 10, eot: Math.round(eot * 10) / 10,
    totalCorrection: Math.round(total * 10) / 10,
    hour, minute, dayOffset,
    timeText: `${pad2(hour)}:${pad2(minute)}`,
  };
}

/** 真太阳时 → 时辰索引（子=0…亥=11；23:00 起算子时） */
function branchOfTime(hour, minute) {
  const mins = hour * 60 + minute;
  if (mins >= 1380 || mins < 60) return 0;
  return Math.floor((mins - 60) / 120) + 1;
}

// ─── 主排盘 ─────────────────────────────────────────────────────────────────

/**
 * @param {object} input
 * @param {string} input.date     公历生日 'YYYY-MM-DD'
 * @param {string} [input.time]   'HH:MM'；不给则按子时处理并标记 unknownTime
 * @param {'male'|'female'} input.gender
 * @param {number} [input.longitude] 出生地经度
 * @param {number} [input.utcOffset] 钟表时区偏移（分钟），默认 480
 * @param {'split'|'next-month'|'prev-month'} [input.leapPolicy] 闰月口径，默认 split
 */
function generateChart(input) {
  const m0 = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.date || '');
  if (!m0) throw new Error('date 必须是 YYYY-MM-DD');
  const y = +m0[1], mo = +m0[2], da = +m0[3];
  const probe = new Date(Date.UTC(y, mo - 1, da));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== da) {
    throw new Error(`公历日期不存在：${input.date}`);
  }

  const unknownTime = !input.time;
  const tm = unknownTime ? [12, 0] : (input.time || '').split(':').map(Number);
  if (!unknownTime && (isNaN(tm[0]) || isNaN(tm[1]) || tm[0] > 23 || tm[1] > 59)) {
    throw new Error(`时间格式错误：${input.time}`);
  }

  // 1) 真太阳时
  const solar = toTrueSolar(y, mo, da, tm[0], tm[1], input.longitude, input.utcOffset);
  const eff = new Date(Date.UTC(y, mo - 1, da + solar.dayOffset));
  const eY = eff.getUTCFullYear(), eM = eff.getUTCMonth() + 1, eD = eff.getUTCDate();

  // 2) 农历
  const lunar0 = solar2lunar(eY, eM, eD);
  if (!lunar0) throw new Error('农历换算超出 1900–2100 范围');

  // 3) 闰月口径
  let lMonth = lunar0.lMonth, lDay = lunar0.lDay, isLeap = lunar0.isLeap;
  const policy = input.leapPolicy || 'split';
  if (isLeap) {
    if (policy === 'split') { if (lDay > 15) lMonth = lMonth + 1; }
    else if (policy === 'next-month') lMonth = lMonth + 1;
  }
  let lYear = lunar0.lYear;
  if (lMonth > 12) { lMonth = 1; lYear += 1; }

  // 4) 年干支（正月初一换年 = 农历年）
  const yearGZIdx = mod(lYear - 4, 60);
  const yearStem = yearGZIdx % 10;
  const yearBranch = yearGZIdx % 12;

  // 5) 时辰索引
  const timeIdx = unknownTime ? 0 : branchOfTime(solar.hour, solar.minute);

  // 6) 命宫 / 身宫（寅=0）
  const monthIdx = lMonth - 1;
  const soulIdx = mod(monthIdx - timeIdx);
  const bodyIdx = mod(monthIdx + timeIdx);

  // 7) 五虎遁：寅宫天干起
  const tigerStart = STEMS.indexOf(TIGER_RULE[yearStem % 5]);
  const palaceStem = (p) => STEMS[(tigerStart + p) % 10];

  // 8) 五行局
  const soulStemIdx = (tigerStart + soulIdx) % 10;
  const soulBranchIdx = BRANCHES.indexOf(BR(soulIdx));
  const stemNum = Math.floor(soulStemIdx / 2) + 1;
  const branchNum = Math.floor(mod(soulBranchIdx, 6) / 2) + 1;
  let juNum = stemNum + branchNum;
  while (juNum > 5) juNum -= 5;
  const juName = JU_BY_NUM[juNum];
  const ju = JU_COUNT[juName];

  // 9) 起紫微（寅=0）
  const dayForZiwei = lDay === 0 ? 1 : lDay;
  let offset = -1, quotient, remainder;
  do {
    offset++;
    const divisor = dayForZiwei + offset;
    quotient = Math.floor(divisor / ju);
    remainder = divisor % ju;
  } while (remainder !== 0);
  quotient %= 12;
  let ziweiIdx = quotient - 1;
  ziweiIdx = offset % 2 === 0 ? ziweiIdx + offset : ziweiIdx - offset;
  ziweiIdx = mod(ziweiIdx);
  const tianfuIdx = mod(12 - ziweiIdx);

  // 10) 十二宫骨架
  const palaces = [];
  for (let i = 0; i < 12; i++) {
    palaces.push({
      index: i,
      branch: BR(i),
      stem: palaceStem(i),
      name: PALACE_NAMES[mod(soulIdx - i)],
      isMingGong: i === soulIdx,
      isShenGong: i === bodyIdx,
      stars: [],
    });
  }
  const at = (p) => palaces[mod(p)];

  // 11) 十四主星
  const ZIWEI_GROUP = ['紫微', '天机', '', '太阳', '武曲', '天同', '', '', '廉贞'];
  const TIANFU_GROUP = ['天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '', '', '', '破军'];
  const addStar = (pIdx, name, type) => {
    const p = at(pIdx);
    if (!p || p.stars.some((s) => s.name === name)) return;
    const b = BRIGHTNESS[name];
    const bv = b ? b[BRANCHES.indexOf(BR(pIdx))] : 0;
    p.stars.push({
      name, type,
      ...(bv ? { brightness: BR_CN[bv] } : {}),
    });
  };
  ZIWEI_GROUP.forEach((s, i) => { if (s) addStar(ziweiIdx - i, s, '主星'); });
  TIANFU_GROUP.forEach((s, i) => { if (s) addStar(tianfuIdx + i, s, '主星'); });

  // 12) 六吉六煞 + 常用辅星
  const sanheOf = (b) => (['寅', '午', '戌'].includes(b) ? '寅午戌'
    : ['申', '子', '辰'].includes(b) ? '申子辰'
      : ['巳', '酉', '丑'].includes(b) ? '巳酉丑' : '亥卯未');
  const yb = BRANCHES[yearBranch];

  // 禄存 / 擎羊 / 陀罗
  const LU = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0]; // 甲寅 乙卯 丙巳 丁午 戊巳 己午 庚申 辛酉 壬亥 癸子
  const luBranch = LU[yearStem];
  addStar(P(BRANCHES[luBranch]), '禄存', '吉');
  addStar(P(BRANCHES[mod(luBranch + 1)]), '擎羊', '煞');
  addStar(P(BRANCHES[mod(luBranch - 1)]), '陀罗', '煞');

  // 天马
  const MA = { 寅午戌: '申', 申子辰: '寅', 巳酉丑: '亥', 亥卯未: '巳' };
  addStar(P(MA[sanheOf(yb)]), '天马', '吉');

  // 天魁 / 天钺
  const KUI_YUE = [
    ['丑', '未'], ['子', '申'], ['亥', '酉'], ['亥', '酉'], ['丑', '未'],
    ['子', '申'], ['丑', '未'], ['午', '寅'], ['卯', '巳'], ['卯', '巳'],
  ];
  addStar(P(KUI_YUE[yearStem][0]), '天魁', '吉');
  addStar(P(KUI_YUE[yearStem][1]), '天钺', '吉');

  // 左辅 / 右弼（按农历月）
  addStar(P('辰') + (lMonth - 1), '左辅', '吉');
  addStar(P('戌') - (lMonth - 1), '右弼', '吉');

  // 文昌 / 文曲（按时支）
  addStar(P('戌') - timeIdx, '文昌', '吉');
  addStar(P('辰') + timeIdx, '文曲', '吉');

  // 地空 / 地劫
  addStar(P('亥') - timeIdx, '地空', '煞');
  addStar(P('亥') + timeIdx, '地劫', '煞');

  // 火星 / 铃星
  const HL = {
    寅午戌: ['丑', '卯'], 申子辰: ['寅', '戌'], 巳酉丑: ['卯', '戌'], 亥卯未: ['酉', '戌'],
  }[sanheOf(yb)];
  addStar(P(HL[0]) + timeIdx, '火星', '煞');
  addStar(P(HL[1]) + timeIdx, '铃星', '煞');

  // 红鸾 / 天喜（按年支）：卯上起子逆数
  const hongLuan = mod(P('卯') - yearBranch);
  addStar(hongLuan, '红鸾', '吉');
  addStar(hongLuan + 6, '天喜', '吉');

  // 华盖 / 咸池（按年支三合）
  const HG_XC = { 寅午戌: ['戌', '卯'], 申子辰: ['辰', '酉'], 巳酉丑: ['丑', '午'], 亥卯未: ['未', '子'] }[sanheOf(yb)];
  addStar(P(HG_XC[0]), '华盖', '吉');
  addStar(P(HG_XC[1]), '咸池', '煞');

  // 孤辰 / 寡宿（按年支三合）
  const GU_GUA = { 寅卯辰: ['巳', '丑'], 巳午未: ['申', '辰'], 申酉戌: ['亥', '未'], 亥子丑: ['寅', '戌'] }[
    ['寅', '卯', '辰'].includes(yb) ? '寅卯辰'
      : ['巳', '午', '未'].includes(yb) ? '巳午未'
        : ['申', '酉', '戌'].includes(yb) ? '申酉戌' : '亥子丑'];
  addStar(P(GU_GUA[0]), '孤辰', '煞');
  addStar(P(GU_GUA[1]), '寡宿', '煞');

  // 13) 四化（本命，按年干）
  const mutations = SIHUA[yearStem];
  const MUT_NAMES = ['禄', '权', '科', '忌'];
  palaces.forEach((p) => p.stars.forEach((s) => {
    const k = mutations.indexOf(s.name);
    if (k >= 0) s.sihua = MUT_NAMES[k];
  }));

  // 14) 大限：起于命宫，起运岁 = 局数，阳男阴女顺、阴男阳女逆
  const yangYear = yearStem % 2 === 0;
  const male = input.gender === 'male';
  const forward = (yangYear && male) || (!yangYear && !male);
  for (let i = 0; i < 12; i++) {
    const idx = mod(forward ? soulIdx + i : soulIdx - i);
    palaces[idx].daxian = [ju + i * 10, ju + i * 10 + 9];
  }

  // 15) 汇总
  const YANG_YIN = ['阳', '阴'];
  const warnings = [];
  if (unknownTime) {
    warnings.push('出生时间未知，已按子时排盘。命宫、身宫、时系星（昌曲、空劫、火铃）均依赖时辰，结果可能大幅偏差，解读时须明确告知用户。');
  }
  if (lunar0.isLeap && policy !== 'split' && lMonth !== lunar0.lMonth) {
    warnings.push(`生于闰${lunar0.lMonth}月，按「${policy}」口径归入${lMonth}月。若用户另有师承口径，可切换 leapPolicy 重排。`);
  }
  if (solar.corrected && Math.abs(solar.totalCorrection) > 30) {
    warnings.push(`真太阳时校正达 ${solar.totalCorrection} 分钟，已跨时辰的可能性较高，建议与用户核对出生地经度是否正确。`);
  }
  const effMonthIsLeap = lunar0.isLeap && lMonth === lunar0.lMonth;

  return {
    input: {
      date: input.date, time: input.time || null, gender: input.gender,
      longitude: input.longitude ?? null, unknownTime,
    },
    trueSolar: solar,
    lunar: { year: lYear, month: lMonth, day: lDay, isLeap: effMonthIsLeap, policy },
    lunarText: `${lYear}年${effMonthIsLeap ? '闰' : ''}${lMonth}月${lDay}日`,
    warnings,
    yearGZ: STEMS[yearStem] + BRANCHES[yearBranch],
    timeZhi: BRANCHES[timeIdx],
    yinYangGender: YANG_YIN[yearStem % 2] + (male ? '男' : '女'),
    soulPalace: { index: soulIdx, branch: BR(soulIdx), stem: palaceStem(soulIdx) },
    bodyPalace: { index: bodyIdx, branch: BR(bodyIdx), stem: palaceStem(bodyIdx) },
    wuxingJu: juName,
    mingZhu: MING_ZHU[soulBranchIdx],
    shenZhu: SHEN_ZHU[yearBranch],
    ziweiIndex: ziweiIdx,
    ziweiBranch: BR(ziweiIdx),
    palaces: palaces.map((p) => ({
      ...p,
      stars: p.stars.map((s) => s.name + (s.brightness ? `(${s.brightness})` : '') + (s.sihua ? `化${s.sihua}` : '')),
      starDetail: p.stars,
    })),
  };
}

// ─── 渲染 ───────────────────────────────────────────────────────────────────

/** 生成等宽文本命盘 */
function renderText(chart) {
  const L = [];
  const B = '│';
  L.push(`公历 ${chart.input.date} ${chart.input.time || '（时辰未知）'}  ${chart.input.gender === 'male' ? '男' : '女'}`);
  if (chart.trueSolar.corrected) {
    L.push(`真太阳时 ${chart.trueSolar.timeText}（经度修正 ${chart.trueSolar.lngCorrection} 分 + 均时差 ${chart.trueSolar.eot} 分）`);
  }
  L.push(`农历 ${chart.lunarText}　${chart.yearGZ}年　${chart.timeZhi}时　${chart.yinYangGender}`);
  L.push(`命宫 ${chart.soulPalace.stem}${chart.soulPalace.branch}　身宫 ${chart.bodyPalace.stem}${chart.bodyPalace.branch}　${chart.wuxingJu}`);
  L.push(`命主 ${chart.mingZhu}　身主 ${chart.shenZhu}　紫微在${chart.ziweiBranch}`);
  if (chart.warnings && chart.warnings.length) {
    L.push('');
    chart.warnings.forEach((w) => L.push('⚠ ' + w));
  }
  L.push('');
  for (const p of chart.palaces) {
    const tag = (p.isMingGong ? '【命】' : '') + (p.isShenGong ? '【身】' : '');
    L.push(`${(p.name + tag).padEnd(10)} ${p.stem}${p.branch}  大限 ${p.daxian[0]}-${p.daxian[1]}  ${p.stars.join(' ') || '（空宫）'}`);
  }
  return L.join('\n');
}

// ─── CLI ────────────────────────────────────────────────────────────────────

function parseArgv(argv) {
  const o = {};
  for (let i = 2; i < argv.length; i++) {
    const raw = argv[i];
    if (typeof raw !== 'string' || !raw.startsWith('--')) continue;
    const k = raw.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) { o[k] = true; }
    else { o[k] = next; i++; }
  }
  return o;
}

if (require.main === module) {
  const a = parseArgv(process.argv);
  if (!a.date || a.date === true) {
    console.error('用法: node ziwei.js --date 1990-06-15 --time 14:30 --gender male [--lng 116.41] [--utc 480] [--leap split] [--json]');
    process.exit(1);
  }
  try {
    const chart = generateChart({
      date: a.date,
      time: a.time === true ? undefined : a.time,
      gender: a.gender === 'female' ? 'female' : 'male',
      longitude: a.lng !== undefined && a.lng !== true ? Number(a.lng) : undefined,
      utcOffset: a.utc !== undefined && a.utc !== true ? Number(a.utc) : undefined,
      leapPolicy: a.leap === true ? undefined : a.leap,
    });
    if (a.json) console.log(JSON.stringify(chart, null, 2));
    else console.log(renderText(chart));
  } catch (e) {
    console.error('排盘失败：' + e.message);
    process.exit(1);
  }
}

module.exports = { generateChart, renderText, solar2lunar, toTrueSolar, equationOfTime, branchOfTime };
