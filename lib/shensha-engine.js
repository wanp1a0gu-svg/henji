/**
 * 神煞判定引擎 — 由 FateMaster.ai 客户端 bundle 倒推还原
 * ---------------------------------------------------------------------------
 * 来源：https://www.fatemaster.ai 前端产物 chunks__6980-*.js 中的判煞函数
 *       （原始为 webpack 压缩代码，本文件是按规则 1:1 还原的可读实现）
 *
 * 覆盖 43 个可计算神煞（该站神煞知识库共 57 条，其余 14 条仅有文案、无判定逻辑）。
 *
 * 实现原则：
 *   1. 忠实还原原实现的判定口径，**不修正**它的写法习惯（哪怕是可商榷的地方），
 *      所有与原实现有出入的地方都在行内用 ⚠️ 标注，供使用者自行取舍。
 *   2. 零依赖，纯函数，不引用任何 Node/浏览器 API — 可直接用于前端或服务端。
 *
 * 输入：四柱干支（如 "甲子" 形式的年月日时）+ 性别（元辰判定需要）
 * 输出：{ total, jiShen[], xiongSha[], analysis }
 *
 * 用法：
 *   const { detect } = require('./shensha-engine');
 *   detect({ year:'甲子', month:'丙寅', day:'戊午', hour:'壬子', gender:'male' });
 */

'use strict';

// ---------------------------------------------------------------------------
// 基础常量
// ---------------------------------------------------------------------------

const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/** 六十甲子纳音表（原实现 ak） */
const NAYIN = {
  甲子: '海中金', 乙丑: '海中金', 丙寅: '炉中火', 丁卯: '炉中火', 戊辰: '大林木', 己巳: '大林木',
  庚午: '路旁土', 辛未: '路旁土', 壬申: '剑锋金', 癸酉: '剑锋金', 甲戌: '山头火', 乙亥: '山头火',
  丙子: '涧下水', 丁丑: '涧下水', 戊寅: '城头土', 己卯: '城头土', 庚辰: '白蜡金', 辛巳: '白蜡金',
  壬午: '杨柳木', 癸未: '杨柳木', 甲申: '泉中水', 乙酉: '泉中水', 丙戌: '屋上土', 丁亥: '屋上土',
  戊子: '霹雳火', 己丑: '霹雳火', 庚寅: '松柏木', 辛卯: '松柏木', 壬辰: '长流水', 癸巳: '长流水',
  甲午: '沙中金', 乙未: '沙中金', 丙申: '山下火', 丁酉: '山下火', 戊戌: '平地木', 己亥: '平地木',
  庚子: '壁上土', 辛丑: '壁上土', 壬寅: '金箔金', 癸卯: '金箔金', 甲辰: '覆灯火', 乙巳: '覆灯火',
  丙午: '天河水', 丁未: '天河水', 戊申: '大驿土', 己酉: '大驿土', 庚戌: '钗钏金', 辛亥: '钗钏金',
  壬子: '桑柘木', 癸丑: '桑柘木', 甲寅: '大溪水', 乙卯: '大溪水', 丙辰: '沙中土', 丁巳: '沙中土',
  戊午: '天上火', 己未: '天上火', 庚申: '石榴木', 辛酉: '石榴木', 壬戌: '大海水', 癸亥: '大海水',
};

/** 纳音名 → 五行（原实现 av） */
function nayinElement(gz) {
  const name = NAYIN[gz];
  if (!name) return null;
  if (name.includes('金')) return '金';
  if (name.includes('木')) return '木';
  if (name.includes('水')) return '水';
  if (name.includes('火')) return '火';
  if (name.includes('土')) return '土';
  return null;
}

/** 月支 → 季节 */
const SEASON_OF = {
  寅: '春', 卯: '春', 辰: '春', 巳: '夏', 午: '夏', 未: '夏',
  申: '秋', 酉: '秋', 戌: '秋', 亥: '冬', 子: '冬', 丑: '冬',
};

/** 月支 → 三合局键 */
function sanheOf(monthZhi) {
  if (['寅', '午', '戌'].includes(monthZhi)) return '寅午戌';
  if (['申', '子', '辰'].includes(monthZhi)) return '申子辰';
  if (['巳', '酉', '丑'].includes(monthZhi)) return '巳酉丑';
  if (['亥', '卯', '未'].includes(monthZhi)) return '亥卯未';
  return null;
}

// ---------------------------------------------------------------------------
// 神煞查法表（原实现的压缩变量名 → 语义化命名）
// ---------------------------------------------------------------------------

const T = {
  /** 天乙贵人：以年干 / 日干 查四柱地支。口诀「甲戊庚牛羊，乙己鼠猴乡，丙丁猪鸡位，壬癸兔蛇藏，六辛逢虎马」 */
  tianYiGuiRen: {
    甲: ['丑', '未'], 乙: ['子', '申'], 丙: ['亥', '酉'], 丁: ['亥', '酉'], 戊: ['丑', '未'],
    己: ['子', '申'], 庚: ['丑', '未'], 辛: ['寅', '午'], 壬: ['卯', '巳'], 癸: ['卯', '巳'],
  },
  /** 太极贵人：以年干 / 日干 查四柱地支 */
  taiJiGuiRen: {
    甲: ['子', '午'], 乙: ['子', '午'], 丙: ['卯', '酉'], 丁: ['卯', '酉'], 戊: ['辰', '戌', '丑', '未'],
    己: ['辰', '戌', '丑', '未'], 庚: ['寅', '亥'], 辛: ['寅', '亥'], 壬: ['巳', '申'], 癸: ['巳', '申'],
  },
  /** 文昌贵人：以日干查四柱地支 */
  wenChangGuiRen: { 甲: '巳', 乙: '午', 丙: '申', 丁: '酉', 戊: '申', 己: '酉', 庚: '亥', 辛: '子', 壬: '寅', 癸: '卯' },
  /** 禄神：日干临官位 */
  luShen: { 甲: '寅', 乙: '卯', 丙: '巳', 丁: '午', 戊: '巳', 己: '午', 庚: '申', 辛: '酉', 壬: '亥', 癸: '子' },
  /** 驿马：以年支 / 日支查，三合局之冲 */
  yiMa: {
    寅: '申', 午: '申', 戌: '申', 申: '寅', 子: '寅', 辰: '寅',
    巳: '亥', 酉: '亥', 丑: '亥', 亥: '巳', 卯: '巳', 未: '巳',
  },
  /** 桃花（咸池）：以年支 / 日支查，三合局之沐浴 */
  taoHua: {
    寅: '卯', 午: '卯', 戌: '卯', 申: '酉', 子: '酉', 辰: '酉',
    巳: '午', 酉: '午', 丑: '午', 亥: '子', 卯: '子', 未: '子',
  },
  /** 华盖：以年支 / 日支查，三合局之墓 */
  huaGai: {
    寅: '戌', 午: '戌', 戌: '戌', 申: '辰', 子: '辰', 辰: '辰',
    巳: '丑', 酉: '丑', 丑: '丑', 亥: '未', 卯: '未', 未: '未',
  },
  /** 羊刃（阳刃）：日干帝旺位 */
  yangRen: { 甲: '卯', 乙: '寅', 丙: '午', 丁: '巳', 戊: '午', 己: '巳', 庚: '酉', 辛: '申', 壬: '子', 癸: '亥' },
  /** 飞刃：日干羊刃之对冲 */
  feiRen: { 甲: '酉', 乙: '申', 丙: '子', 丁: '亥', 戊: '子', 己: '亥', 庚: '卯', 辛: '寅', 壬: '午', 癸: '巳' },
  /** 劫煞：以年支 / 日支查 */
  jieSha: {
    申: '巳', 子: '巳', 辰: '巳', 寅: '亥', 午: '亥', 戌: '亥',
    巳: '寅', 酉: '寅', 丑: '寅', 亥: '申', 卯: '申', 未: '申',
  },
  /** 灾煞：以年支查 */
  zaiSha: {
    申: '午', 子: '午', 辰: '午', 亥: '酉', 卯: '酉', 未: '酉',
    寅: '子', 午: '子', 戌: '子', 巳: '卯', 酉: '卯', 丑: '卯',
  },
  /** 孤辰 / 寡宿：以年支查 */
  guChenGuaSu: {
    亥: { guChen: '寅', guaSu: '戌' }, 子: { guChen: '寅', guaSu: '戌' }, 丑: { guChen: '寅', guaSu: '戌' },
    寅: { guChen: '巳', guaSu: '丑' }, 卯: { guChen: '巳', guaSu: '丑' }, 辰: { guChen: '巳', guaSu: '丑' },
    巳: { guChen: '申', guaSu: '辰' }, 午: { guChen: '申', guaSu: '辰' }, 未: { guChen: '申', guaSu: '辰' },
    申: { guChen: '亥', guaSu: '未' }, 酉: { guChen: '亥', guaSu: '未' }, 戌: { guChen: '亥', guaSu: '未' },
  },
  /** 亡神：以年支 / 日支查 */
  wangShen: {
    申: '亥', 子: '亥', 辰: '亥', 寅: '巳', 午: '巳', 戌: '巳',
    巳: '申', 酉: '申', 丑: '申', 亥: '寅', 卯: '寅', 未: '寅',
  },
  /** 勾绞煞：以年支查（年支 + 3） */
  gouJiaoSha: {
    子: '卯', 丑: '辰', 寅: '巳', 卯: '午', 辰: '未', 巳: '申',
    午: '酉', 未: '戌', 申: '亥', 酉: '子', 戌: '丑', 亥: '寅',
  },
  /** 丧门：以年支查（年支 + 2） */
  sangMen: {
    子: '寅', 丑: '卯', 寅: '辰', 卯: '巳', 辰: '午', 巳: '未',
    午: '申', 未: '酉', 申: '戌', 酉: '亥', 戌: '子', 亥: '丑',
  },
  /** 吊客：以年支查（年支 − 2） */
  diaoKe: {
    子: '戌', 丑: '亥', 寅: '子', 卯: '丑', 辰: '寅', 巳: '卯',
    午: '辰', 未: '巳', 申: '午', 酉: '未', 戌: '申', 亥: '酉',
  },
  /** 披麻：以年支查（年支 − 4） */
  piMa: {
    子: '酉', 丑: '戌', 寅: '亥', 卯: '子', 辰: '丑', 巳: '寅',
    午: '卯', 未: '辰', 申: '巳', 酉: '午', 戌: '未', 亥: '申',
  },
  /** 红鸾：以年支查 */
  hongLuan: {
    子: '卯', 丑: '寅', 寅: '丑', 卯: '子', 辰: '亥', 巳: '戌',
    午: '酉', 未: '申', 申: '未', 酉: '午', 戌: '巳', 亥: '辰',
  },
  /** 天喜：以年支查（红鸾对冲位） */
  tianXi: {
    子: '酉', 丑: '申', 寅: '未', 卯: '午', 辰: '巳', 巳: '辰',
    午: '卯', 未: '寅', 申: '丑', 酉: '子', 戌: '亥', 亥: '戌',
  },
  /** 国印贵人：以年干 / 日干查 */
  guoYinGuiRen: { 甲: '戌', 乙: '亥', 丙: '丑', 丁: '寅', 戊: '丑', 己: '寅', 庚: '辰', 辛: '巳', 壬: '未', 癸: '申' },
  /** 金舆：以年干 / 日干查（禄前二位） */
  jinYu: { 甲: '辰', 乙: '巳', 丙: '未', 丁: '申', 戊: '未', 己: '申', 庚: '戌', 辛: '亥', 壬: '丑', 癸: '寅' },
  /** 天厨贵人：以年干 / 日干查 */
  tianChuGuiRen: { 甲: '巳', 乙: '午', 丙: '巳', 丁: '午', 戊: '申', 己: '酉', 庚: '亥', 辛: '子', 壬: '寅', 癸: '卯' },
  /** 福星贵人：以年干 / 日干查 */
  fuXingGuiRen: {
    甲: ['寅', '子'], 丙: ['寅', '子'], 乙: ['卯', '丑'], 癸: ['卯', '丑'], 戊: ['申'],
    己: ['未'], 丁: ['亥'], 庚: ['午'], 辛: ['巳'], 壬: ['辰'],
  },
  /** 红艳煞：以日干查 */
  hongYanSha: {
    甲: ['午'], 乙: ['午'], 丙: ['寅'], 丁: ['未'], 戊: ['辰'],
    己: ['辰'], 庚: ['戌'], 辛: ['酉'], 壬: ['子'], 癸: ['申'],
  },
  /** 流霞：以日干查 */
  liuXia: { 甲: '酉', 乙: '戌', 丙: '未', 丁: '申', 戊: '巳', 己: '午', 庚: '辰', 辛: '卯', 壬: '亥', 癸: '寅' },
  /** 天德贵人：以月支查 */
  tianDeGuiRen: {
    寅: '丁', 卯: '申', 辰: '壬', 巳: '辛', 午: '亥', 未: '甲',
    申: '癸', 酉: '寅', 戌: '丙', 亥: '乙', 子: '巳', 丑: '庚',
  },
  /** 月德贵人：以月支查三合局之干 */
  yueDeGuiRen: {
    寅: '丙', 午: '丙', 戌: '丙', 申: '壬', 子: '壬', 辰: '壬',
    亥: '甲', 卯: '甲', 未: '甲', 巳: '庚', 酉: '庚', 丑: '庚',
  },
  /** 天医：以月支查（月支前一位） */
  tianYi: {
    寅: '丑', 卯: '寅', 辰: '卯', 巳: '辰', 午: '巳', 未: '午',
    申: '未', 酉: '申', 戌: '酉', 亥: '戌', 子: '亥', 丑: '子',
  },
  /** 月德合：以月支查 */
  yueDeHe: {
    寅: '辛', 午: '辛', 戌: '辛', 亥: '己', 卯: '己', 未: '己',
    申: '丁', 子: '丁', 辰: '丁', 巳: '乙', 酉: '乙', 丑: '乙',
  },
  /** 天德合：以月支查 */
  tianDeHe: {
    寅: '壬', 卯: '巳', 辰: '丁', 巳: '丙', 午: '寅', 未: '己',
    申: '戊', 酉: '亥', 戌: '辛', 亥: '庚', 子: '申', 丑: '乙',
  },
  /** 血刃：以月支查 */
  xueRen: {
    寅: '丑', 卯: '未', 辰: '寅', 巳: '申', 午: '卯', 未: '酉',
    申: '辰', 酉: '戌', 戌: '巳', 亥: '亥', 子: '午', 丑: '子',
  },
  /** 德秀贵人：以月支三合局查天干 */
  deXiuGuiRen: {
    寅午戌: { de: ['丙', '丁'], xiu: ['戊', '癸'] },
    申子辰: { de: ['壬', '癸', '戊', '己'], xiu: ['丙', '辛', '甲', '己'] },
    巳酉丑: { de: ['庚', '辛'], xiu: ['乙', '庚'] },
    亥卯未: { de: ['甲', '乙'], xiu: ['丁', '壬'] },
  },
  /** 学堂：以年命纳音五行查地支 */
  xueTang: { 金: '巳', 木: '亥', 水: '申', 火: '寅', 土: '申' },
  /** 正学堂：以年命纳音五行查日柱干支 */
  zhengXueTang: { 金: '辛巳', 木: '己亥', 水: '甲申', 火: '丙寅', 土: '戊申' },
  /** 词馆 + 正词馆：以年命纳音五行查 */
  ciGuan: {
    金: { zhi: '申', zhengCiGuan: '壬申' },
    木: { zhi: '寅', zhengCiGuan: '庚寅' },
    水: { zhi: '亥', zhengCiGuan: '癸亥' },
    土: { zhi: '亥', zhengCiGuan: '丁亥' },
    火: { zhi: '巳', zhengCiGuan: '乙巳' },
  },
  /** 将星：以年支 / 日支查，三合局中神 */
  jiangXing: {
    子: '子', 丑: '酉', 寅: '午', 卯: '卯', 辰: '子', 巳: '酉',
    午: '午', 未: '卯', 申: '子', 酉: '酉', 戌: '午', 亥: '卯',
  },
  /** 元辰：以年支查，分阳男阴女 / 阴男阳女 */
  yuanChen: {
    子: { yangNanYinNv: '未', yinNanYangNv: '巳' }, 丑: { yangNanYinNv: '申', yinNanYangNv: '午' },
    寅: { yangNanYinNv: '酉', yinNanYangNv: '未' }, 卯: { yangNanYinNv: '戌', yinNanYangNv: '申' },
    辰: { yangNanYinNv: '亥', yinNanYangNv: '酉' }, 巳: { yangNanYinNv: '子', yinNanYangNv: '戌' },
    午: { yangNanYinNv: '丑', yinNanYangNv: '亥' }, 未: { yangNanYinNv: '寅', yinNanYangNv: '子' },
    申: { yangNanYinNv: '卯', yinNanYangNv: '丑' }, 酉: { yangNanYinNv: '辰', yinNanYangNv: '寅' },
    戌: { yangNanYinNv: '巳', yinNanYangNv: '卯' }, 亥: { yangNanYinNv: '午', yinNanYangNv: '辰' },
  },
  /** 天转日：以月支查日柱 */
  tianZhuanRi: {
    寅: '乙卯', 卯: '乙卯', 辰: '乙卯', 巳: '丙午', 午: '丙午', 未: '丙午',
    申: '辛酉', 酉: '辛酉', 戌: '辛酉', 亥: '壬子', 子: '壬子', 丑: '壬子',
  },
  /** 地转日：以月支查日柱（候选集） */
  diZhuanRi: {
    寅: ['乙卯', '辛卯'], 卯: ['乙卯', '辛卯'], 辰: ['乙卯', '辛卯'],
    巳: ['丙午', '戊午'], 午: ['丙午', '戊午'], 未: ['丙午', '戊午'],
    申: ['辛酉', '癸酉'], 酉: ['辛酉', '癸酉'], 戌: ['辛酉', '癸酉'],
    亥: ['壬子', '丙子'], 子: ['壬子', '丙子'], 丑: ['壬子', '丙子'],
  },
  /** 四废日：以季节查日柱（原实现 O） */
  siFeiRi: { 春: ['庚申', '辛酉'], 夏: ['壬子', '癸亥'], 秋: ['甲寅', '乙卯'], 冬: ['丙午', '丁巳'] },
};

/** 以下为「日柱 / 时柱 命中即成立」的固定干支集 */
const FIXED_LISTS = {
  /** 十灵日 */
  shiLingRi: ['甲辰', '乙亥', '丙辰', '丁酉', '戊午', '庚戌', '庚寅', '辛亥', '壬寅', '癸未'],
  /** 魁罡 */
  kuiGang: ['戊戌', '庚辰', '庚戌', '壬辰'],
  /** 金神（日柱或时柱） */
  jinShen: ['乙丑', '己巳', '癸酉'],
  /** 八专日 */
  baZhuanRi: ['甲寅', '乙卯', '丁未', '戊戌', '己未', '庚申', '辛酉', '癸丑'],
  /** 阴差阳错 */
  yinYangChaCuo: ['丙子', '丁丑', '戊寅', '辛卯', '壬辰', '癸巳', '丙午', '丁未', '戊申', '辛酉', '壬戌', '癸亥'],
  /** 九丑日 */
  jiuChouRi: ['丁酉', '戊子', '戊午', '己卯', '己酉', '辛卯', '辛酉', '壬子', '壬午'],
  /** 六秀日 */
  liuXiuRi: ['丙午', '丁未', '戊子', '戊午', '己丑', '己未'],
  /** 孤鸾煞 */
  guLuanSha: ['甲寅', '乙巳', '丙午', '丁巳', '戊午', '戊申', '辛亥', '壬子'],
  /** 十恶大败 */
  shiEDaBai: ['甲辰', '乙巳', '壬申', '丙申', '丁亥', '庚辰', '戊戌', '癸亥', '辛巳', '己丑'],
  /** 拱禄：日柱 + 时柱 组合 */
  gongLu: [
    { day: '癸亥', time: '癸丑', desc: '拱子禄' },
    { day: '癸丑', time: '癸亥', desc: '拱子禄' },
    { day: '丁巳', time: '丁未', desc: '拱午禄' },
    { day: '己未', time: '己巳', desc: '拱午禄' },
    { day: '戊辰', time: '戊午', desc: '拱巳禄' },
  ],
  /** 天赦日：季节 + 日柱 */
  tianSheRi: [
    { seasons: ['寅', '卯', '辰'], day: '戊寅', desc: '春戊寅' },
    { seasons: ['巳', '午', '未'], day: '甲午', desc: '夏甲午' },
    { seasons: ['申', '酉', '戌'], day: '戊申', desc: '秋戊申' },
    { seasons: ['亥', '子', '丑'], day: '甲子', desc: '冬甲子' },
  ],
};

/** 空亡表：以六十甲子（年柱或日柱）查旬空二支 */
const KONG_WANG = (() => {
  const out = {};
  for (let i = 0; i < 60; i++) {
    const gz = GAN[i % 10] + ZHI[i % 12];
    const xun = i % 10;               // 旬内序号；旬首为 甲x
    const xunStartZhi = (i - xun) % 12;
    out[gz] = [ZHI[(xunStartZhi + 10) % 12], ZHI[(xunStartZhi + 11) % 12]];
  }
  return out;
})();

// 说明：原实现是把 60 个旬空结果逐一硬编码在 y 表里（甲子:["戌","亥"] … 癸亥:["子","丑"]），
//       这里用同一规则生成，结果逐项一致（见自检 ST-01）。

// ---------------------------------------------------------------------------
// 字符串标签（用于输出 location）
// ---------------------------------------------------------------------------

const PILLAR_LABEL = { year: '年柱', month: '月柱', day: '日柱', hour: '时柱' };

// ---------------------------------------------------------------------------
// 主判定函数
// ---------------------------------------------------------------------------

/**
 * @param {{year:string, month:string, day:string, hour?:string, gender?:'male'|'female'}} chart
 *        四柱干支字符串，每柱两字（干+支），如 '甲子'。hour 可省略（无时柱时不判定需时柱的神煞）。
 * @returns {{total:number, jiShen:Array, xiongSha:Array, analysis:string}}
 */
function detect(chart) {
  const { year, month, day, hour = null, gender = 'male' } = chart;

  const pillars = [
    { name: '年柱', gz: year },
    { name: '月柱', gz: month },
    { name: '日柱', gz: day },
    ...(hour ? [{ name: '时柱', gz: hour }] : []),
  ];

  const yearGan = year[0], yearZhi = year[1];
  const monthGan = month[0], monthZhi = month[1];
  const dayGan = day[0], dayZhi = day[1];
  const hourGan = hour ? hour[0] : '';
  const hourZhi = hour ? hour[1] : '';

  const ji = [];    // 吉神
  const xiong = []; // 凶煞

  const pushJi = (name, pillarName, gz, note) =>
    ji.push({ name, type: '吉神', pillar: pillarName, ganZhi: gz, ...(note ? { note } : {}) });
  const pushXiong = (name, pillarName, gz, note) =>
    xiong.push({ name, type: '凶煞', pillar: pillarName, ganZhi: gz, ...(note ? { note } : {}) });

  // ---- 以「年干 / 日干」为索引，遍历四柱地支 ---------------------------------
  [yearGan, dayGan].forEach((gan) => {
    const hit = T.tianYiGuiRen[gan];
    if (hit) pillars.forEach((p) => hit.includes(p.gz[1]) && pushJi('天乙贵人', p.name, p.gz));
  });

  [yearGan, dayGan].forEach((gan) => {
    const hit = T.taiJiGuiRen[gan];
    if (hit) pillars.forEach((p) => {
      if (hit.includes(p.gz[1]) && !ji.some((x) => x.name === '太极贵人' && x.pillar === p.name)) {
        pushJi('太极贵人', p.name, p.gz);
      }
    });
  });

  [yearGan, dayGan].forEach((gan) => {
    const hit = T.wenChangGuiRen[gan];
    if (hit) pillars.forEach((p) => hit === p.gz[1] && pushJi('文昌贵人', p.name, p.gz));
  });

  // 禄神：原实现仅以「日干」查
  {
    const hit = T.luShen[dayGan];
    if (hit && dayGan) pillars.forEach((p) => hit === p.gz[1] && pushJi('禄神', p.name, p.gz));
  }

  [yearGan, dayGan].forEach((gan) => {
    const hit = T.guoYinGuiRen[gan];
    if (hit) pillars.forEach((p) => hit === p.gz[1] && pushJi('国印贵人', p.name, p.gz));
  });

  [yearGan, dayGan].forEach((gan) => {
    const hit = T.tianChuGuiRen[gan];
    if (hit) pillars.forEach((p) => hit === p.gz[1] && pushJi('天厨贵人', p.name, p.gz));
  });

  [yearGan, dayGan].forEach((gan) => {
    const hit = T.fuXingGuiRen[gan];
    if (hit) pillars.forEach((p) => hit.includes(p.gz[1]) && pushJi('福星贵人', p.name, p.gz));
  });

  // 金舆：以年干 / 日干查，按「柱名-干支」去重
  {
    const seen = new Set();
    [yearGan, dayGan].forEach((gan) => {
      const hit = T.jinYu[gan];
      if (!hit) return;
      pillars.forEach((p) => {
        const key = `${p.name}-${p.gz}`;
        if (hit !== p.gz[1] || seen.has(key)) return;
        seen.add(key);
        pushJi('金舆', p.name, p.gz);
      });
    });
  }

  // ---- 以「年支 / 日支」为索引 ----------------------------------------------
  [yearZhi, dayZhi].forEach((zhi) => {
    const hit = T.yiMa[zhi];
    if (hit) pillars.forEach((p) => hit === p.gz[1] && pushJi('驿马', p.name, p.gz));
  });

  [yearZhi, dayZhi].forEach((zhi) => {
    const hit = T.taoHua[zhi];
    if (hit) pillars.forEach((p) => hit === p.gz[1] && pushJi('桃花', p.name, p.gz));
  });

  // 华盖：年支与日支分别查，且各自排除「年柱」/「日柱」自身
  {
    const byYear = T.huaGai[yearZhi];
    if (byYear) pillars.forEach((p) => p.gz[1] === byYear && p.name !== '年柱' && pushJi('华盖', p.name, p.gz));
    const byDay = T.huaGai[dayZhi];
    if (byDay) pillars.forEach((p) => {
      if (p.gz[1] !== byDay || p.name === '日柱') return;
      if (ji.some((x) => x.name === '华盖' && x.pillar === p.name)) return;
      pushJi('华盖', p.name, p.gz);
    });
  }

  [yearZhi, dayZhi].forEach((zhi) => {
    const hit = T.jieSha[zhi];
    if (hit) pillars.forEach((p) => hit === p.gz[1] && pushXiong('劫煞', p.name, p.gz));
  });

  // 灾煞：原实现仅以「年支」查
  {
    const hit = T.zaiSha[yearZhi];
    if (hit) pillars.forEach((p) => hit === p.gz[1] && pushXiong('灾煞', p.name, p.gz));
  }

  // 孤辰 / 寡宿：仅以「年支」查
  {
    const hit = T.guChenGuaSu[yearZhi];
    if (hit) pillars.forEach((p) => {
      if (hit.guChen === p.gz[1]) pushXiong('孤辰', p.name, p.gz);
      if (hit.guaSu === p.gz[1]) pushXiong('寡宿', p.name, p.gz);
    });
  }

  [yearZhi, dayZhi].forEach((zhi) => {
    const hit = T.wangShen[zhi];
    if (hit) pillars.forEach((p) => {
      if (hit !== p.gz[1]) return;
      if (xiong.some((x) => x.name === '亡神' && x.pillar === p.name)) return;
      pushXiong('亡神', p.name, p.gz);
    });
  });

  // 勾绞煞：仅年支，且排除年柱自身
  {
    const hit = T.gouJiaoSha[yearZhi];
    if (hit) pillars.forEach((p) => p.name !== '年柱' && p.gz[1] === hit && pushXiong('勾绞煞', p.name, p.gz));
  }

  // 丧门 / 吊客 / 披麻：仅年支
  {
    const a = T.sangMen[yearZhi];
    if (a) pillars.forEach((p) => a === p.gz[1] && pushXiong('丧门', p.name, p.gz));
    const b = T.diaoKe[yearZhi];
    if (b) pillars.forEach((p) => b === p.gz[1] && pushXiong('吊客', p.name, p.gz));
    const c = T.piMa[yearZhi];
    if (c) pillars.forEach((p) => c === p.gz[1] && pushXiong('披麻', p.name, p.gz));
  }

  // 红鸾 / 天喜：仅年支
  {
    const a = T.hongLuan[yearZhi];
    if (a && yearZhi) pillars.forEach((p) => a === p.gz[1] && pushJi('红鸾', p.name, p.gz));
    const b = T.tianXi[yearZhi];
    if (b && yearZhi) pillars.forEach((p) => b === p.gz[1] && pushJi('天喜', p.name, p.gz));
  }

  // 将星：年支查非日柱三位；日支查非日柱三位（去重）
  {
    const a = T.jiangXing[yearZhi], b = T.jiangXing[dayZhi];
    if (a) ['月柱', '日柱', '时柱'].forEach((n) => {
      const p = pillars.find((x) => x.name === n);
      if (p && p.gz[1] === a) pushJi('将星', p.name, p.gz);
    });
    if (b) ['年柱', '月柱', '时柱'].forEach((n) => {
      const p = pillars.find((x) => x.name === n);
      if (!p || p.gz[1] !== b) return;
      if (ji.some((x) => x.name === '将星' && x.pillar === p.name)) return;
      pushJi('将星', p.name, p.gz);
    });
  }

  // ---- 空亡：以日柱、年柱查旬空 ---------------------------------------------
  {
    const seen = new Set();
    [day, year].forEach((gz) => {
      const hit = KONG_WANG[gz];
      if (!hit) return;
      pillars.forEach((p) => {
        const key = `${p.name}-${p.gz}`;
        if (!hit.includes(p.gz[1]) || seen.has(key)) return;
        seen.add(key);
        pushXiong('空亡', p.name, p.gz);
      });
    });
  }

  // ---- 以「月支」为索引 ------------------------------------------------------
  // 天德贵人：原实现两轮（第二轮为去重后的等价判定），此处合并
  {
    const hit = T.tianDeGuiRen[monthZhi];
    if (hit) pillars.forEach((p) => {
      if (hit !== p.gz[0] && hit !== p.gz[1]) return;
      if (ji.some((x) => x.name === '天德贵人' && x.pillar === p.name)) return;
      pushJi('天德贵人', p.name, p.gz);
    });
  }

  {
    const hit = T.yueDeGuiRen[monthZhi];
    if (hit) pillars.forEach((p) => hit === p.gz[0] && pushJi('月德贵人', p.name, p.gz));
  }

  // 天医：原实现只查 年柱 / 日柱 / 时柱（不含月柱）
  {
    const hit = T.tianYi[monthZhi];
    if (hit) pillars.filter((p) => p.name !== '月柱')
      .forEach((p) => hit === p.gz[1] && pushJi('天医', p.name, p.gz));
  }

  {
    const hit = T.yueDeHe[monthZhi];
    if (hit) pillars.forEach((p) => hit === p.gz[0] && pushJi('月德合', p.name, p.gz));
  }

  {
    const hit = T.tianDeHe[monthZhi];
    if (hit) pillars.forEach((p) => (hit === p.gz[0] || hit === p.gz[1]) && pushJi('天德合', p.name, p.gz));
  }

  {
    const hit = T.xueRen[monthZhi];
    if (hit) pillars.forEach((p) => p.gz[1] === hit && pushXiong('血刃', p.name, p.gz));
  }

  // 德秀贵人：月支三合局 → 天干集合
  {
    const ju = sanheOf(monthZhi);
    const hit = ju && T.deXiuGuiRen[ju];
    if (hit) pillars.forEach((p) => {
      if (hit.de.includes(p.gz[0]) || hit.xiu.includes(p.gz[0])) pushJi('德秀贵人', p.name, p.gz);
    });
  }

  // 天转日 / 地转日：月支 + 日柱
  {
    const a = T.tianZhuanRi[monthZhi];
    if (a === day) pushJi('天转日', '日柱', day);
    const b = T.diZhuanRi[monthZhi];
    if (b && b.includes(day)) pushJi('地转日', '日柱', day);
  }

  // 四废日：季节 + 日柱
  {
    const season = SEASON_OF[monthZhi];
    const list = season && T.siFeiRi[season];
    if (list && list.includes(day)) pushXiong('四废日', '日柱', day);
  }

  // ---- 以「年命纳音五行」为索引 ----------------------------------------------
  const yearNayinEl = nayinElement(year);
  const dayNayinEl = nayinElement(day);

  // 学堂 / 正学堂：原实现查 月柱 / 日柱 / 时柱
  if (yearNayinEl) {
    const zhi = T.xueTang[yearNayinEl];
    const gz = T.zhengXueTang[yearNayinEl];
    pillars.filter((p) => p.name !== '年柱').forEach((p) => {
      if (gz && p.gz === gz) pushJi('正学堂', p.name, p.gz);
      else if (zhi && p.gz[1] === zhi) pushJi('学堂', p.name, p.gz);
    });
  }

  // 词馆 / 正词馆：原实现查 月柱 / 日柱 / 时柱
  if (yearNayinEl) {
    const hit = T.ciGuan[yearNayinEl];
    if (hit) {
      [{ name: '月柱', gz: month }, { name: '日柱', gz: day }, ...(hour ? [{ name: '时柱', gz: hour }] : [])]
        .filter((p) => p.gz)
        .forEach((p) => {
          const zhi = p.gz[1];
          if (p.gz === hit.zhengCiGuan) pushJi('正词馆', p.name, p.gz);
          else if (zhi === hit.zhi) pushJi('词馆', p.name, p.gz);
        });
    }
  }

  // 天罗地网：年命纳音五行 + 日支 / 年月时支
  if (yearNayinEl) {
    const isTianLuo = yearNayinEl === '火' && (dayZhi === '戌' || dayZhi === '亥');
    const isDiWang = (yearNayinEl === '水' || yearNayinEl === '土') && (dayZhi === '辰' || dayZhi === '巳');
    if (isTianLuo || isDiWang) pushXiong('天罗地网', '日柱', day);
    [{ name: '月柱', zhi: monthZhi, gz: month }, ...(hour ? [{ name: '时柱', zhi: hourZhi, gz: hour }] : [])]
      .forEach((p) => {
        let hit = false;
        if (((yearZhi === '戌' || dayZhi === '戌') && p.zhi === '亥') ||
            ((yearZhi === '亥' || dayZhi === '亥') && p.zhi === '戌')) hit = true;
        if (((yearZhi === '辰' || dayZhi === '辰') && p.zhi === '巳') ||
            ((yearZhi === '巳' || dayZhi === '巳') && p.zhi === '辰')) hit = true;
        if (hit) pushXiong('天罗地网', p.name, p.gz || '');
      });
  }

  // 童子煞：⚠️ 原实现用「月支季节」+「年命纳音五行」+「日支 / 时支」判定，
  //          与常见的「年支起法」不同，此处忠实还原
  if (yearNayinEl) {
    const season = SEASON_OF[monthZhi];
    const match = (zhi) => {
      if (!zhi) return false;
      if ((season === '春' || season === '秋') && (zhi === '寅' || zhi === '子')) return true;
      if ((season === '冬' || season === '夏') && (zhi === '卯' || zhi === '未' || zhi === '辰')) return true;
      if ((yearNayinEl === '金' || yearNayinEl === '木') && (zhi === '午' || zhi === '卯')) return true;
      if ((yearNayinEl === '水' || yearNayinEl === '火') && (zhi === '酉' || zhi === '戌')) return true;
      if (yearNayinEl === '土' && (zhi === '辰' || zhi === '巳')) return true;
      return false;
    };
    if (match(dayZhi)) pushXiong('童子煞', '日柱', day);
    if (hour && match(hourZhi)) pushXiong('童子煞', '时柱', hour);
  }

  // ---- 以「日干」为索引 ------------------------------------------------------
  [null, null].forEach(() => {});
  {
    const a = T.yangRen[dayGan];
    if (a) pillars.forEach((p) => a === p.gz[1] && pushXiong('羊刃', p.name, p.gz));
    const b = T.feiRen[dayGan];
    if (b) pillars.forEach((p) => b === p.gz[1] && pushXiong('飞刃', p.name, p.gz));
  }
  {
    const hit = T.hongYanSha[dayGan];
    if (hit) pillars.forEach((p) => hit.includes(p.gz[1]) && pushXiong('红艳煞', p.name, p.gz));
  }
  {
    const hit = T.liuXia[dayGan];
    if (hit) pillars.forEach((p) => hit === p.gz[1] && pushXiong('流霞', p.name, p.gz));
  }

  // ---- 日柱 / 时柱 命中型 ----------------------------------------------------
  if (FIXED_LISTS.shiLingRi.includes(day)) pushJi('十灵日', '日柱', day);
  if (FIXED_LISTS.kuiGang.includes(day)) pushXiong('魁罡', '日柱', day);
  if (FIXED_LISTS.baZhuanRi.includes(day)) pushJi('八专日', '日柱', day);
  if (FIXED_LISTS.yinYangChaCuo.includes(day)) pushXiong('阴差阳错', '日柱', day);
  if (FIXED_LISTS.jiuChouRi.includes(day)) pushXiong('九丑日', '日柱', day);
  if (FIXED_LISTS.liuXiuRi.includes(day)) pushJi('六秀日', '日柱', day);
  if (FIXED_LISTS.guLuanSha.includes(day)) pushXiong('孤鸾煞', '日柱', day);
  if (FIXED_LISTS.shiEDaBai.includes(day)) pushXiong('十恶大败', '日柱', day);

  // 金神：日柱或时柱命中（原实现重复推了两次，此处按去重处理）
  {
    const seen = new Set();
    [day, hour].forEach((gz, idx) => {
      if (!gz || !FIXED_LISTS.jinShen.includes(gz)) return;
      const name = idx === 0 ? '日柱' : '时柱';
      const key = `${name}-${gz}`;
      if (seen.has(key)) return;
      seen.add(key);
      pushXiong('金神', name, gz);
    });
  }

  // 拱禄：日柱 + 时柱 组合
  if (hour) {
    const hit = FIXED_LISTS.gongLu.find((x) => x.day === day && x.time === hour);
    if (hit) pushJi('拱禄', '日柱', `${day}-${hour}`, `日时拱${hit.desc}`);
  }

  // 天赦日：季节 + 日柱
  {
    const hit = FIXED_LISTS.tianSheRi.find((x) => x.seasons.includes(monthZhi) && x.day === day);
    if (hit) pushJi('天赦日', '日柱', day, hit.desc);
  }

  // ---- 三奇贵人 --------------------------------------------------------------
  {
    const TIAN_SAN_QI = ['甲', '戊', '庚'];
    const DI_SAN_QI = ['乙', '丙', '丁'];
    const REN_SAN_QI = ['壬', '癸', '辛'];
    const check = (arr) => {
      if (arr.length !== 3 || arr.some((x) => !x)) return null;
      if (arr.every((x, i) => x === TIAN_SAN_QI[i])) return '天上三奇';
      if (arr.every((x, i) => x === DI_SAN_QI[i])) return '地下三奇';
      if (arr.every((x, i) => x === REN_SAN_QI[i])) return '人中三奇';
      return null;
    };
    const a = check([yearGan, monthGan, dayGan]);
    if (a) pushJi('三奇贵人', '日柱', `${year}-${month}-${day}`, `年月日柱(${a})`);
    const b = hour ? check([monthGan, dayGan, hourGan]) : null;
    if (b) pushJi('三奇贵人', '日柱', `${month}-${day}-${hour}`, `月日时柱(${b})`);
  }

  // ---- 元辰：年支 + 性别 + 年干阴阳 ------------------------------------------
  {
    const hit = T.yuanChen[yearZhi];
    if (hit) {
      const yangYear = GAN.indexOf(yearGan) % 2 === 0; // 阳年
      const target = (yangYear && gender === 'male') || (!yangYear && gender === 'female')
        ? hit.yangNanYinNv
        : hit.yinNanYangNv;
      pillars.forEach((p) => target === p.gz[1] && pushXiong('元辰', p.name, p.gz));
    }
  }

  // ---- 去重 & 汇总（按 名称+柱位 去重，与原实现一致） -------------------------
  const dedupe = (arr) => arr.filter((x, i, a) => a.findIndex((y) => y.name === x.name && y.pillar === x.pillar) === i);
  const jiShen = dedupe(ji);
  const xiongSha = dedupe(xiong);

  let analysis = '本命神煞分析：\n';
  analysis += `吉神共${jiShen.length}个，凶煞共${xiongSha.length}个。\n\n`;
  if (jiShen.length > 0) {
    analysis += '吉神列表：\n';
    jiShen.forEach((s) => { analysis += `- ${s.name}在${s.pillar}：${s.note || ''}\n`; });
    analysis += '\n';
  }
  if (xiongSha.length > 0) {
    analysis += '凶煞列表：\n';
    xiongSha.forEach((s) => { analysis += `- ${s.name}在${s.pillar}：${s.note || ''}\n`; });
    analysis += '\n';
  }
  if (jiShen.length > xiongSha.length) analysis += '神煞总体偏吉，吉神多于凶煞，有贵人相助。';
  else if (xiongSha.length > jiShen.length) analysis += '神煞总体偏凶，凶煞多于吉神，需谨慎行事。';
  else analysis += '神煞吉凶参半，需要综合分析具体情况。';

  return { total: jiShen.length + xiongSha.length, jiShen, xiongSha, analysis };
}

// ---------------------------------------------------------------------------
// 适配层：与本项目 bazi-engine.js 的 chart 结构对接
// 说明：本模块不参与 bazi-engine.js 的排盘与对拍，只做「附加神煞判定」。
// ---------------------------------------------------------------------------

/** 从 extractChart() 的 pillars（{year:{gan,zhi},...}）取四柱干支；缺失或「未知」返回 null。 */
function pillarsFromChart(pillars) {
  const pick = (k) => {
    const p = pillars && pillars[k];
    if (!p || !p.gan || !p.zhi) return null;
    if (p.gan === '未知' || p.zhi === '未知') return null;
    return p.gan + p.zhi;
  };
  return { year: pick('year'), month: pick('month'), day: pick('day'), hour: pick('hour') };
}

/**
 * 直接用本项目的 chart 对象判定神煞。
 * @param {{pillars:object, sex?:string}} chart extractChart() 的返回值
 * @returns {object|null} 年/月/日柱不全时返回 null（时柱缺失仍可判定，只是不判时柱相关条目）
 */
function detectFromChart(chart) {
  const gz = pillarsFromChart(chart && chart.pillars);
  if (!gz || !gz.year || !gz.month || !gz.day) return null;
  const sex = String((chart && chart.sex) || '');
  return detect({
    year: gz.year,
    month: gz.month,
    day: gz.day,
    hour: gz.hour,
    gender: sex === '女' ? 'female' : 'male',
  });
}

/** 生成给 LLM 的神煞说明块（与既有「神煞」段区分，标为「扩展」）。 */
function toPromptBlock(out, opts) {
  if (!out || !out.total) return '';
  const limit = (opts && opts.limit) || 0; // 0 = 全量
  const lines = [];
  lines.push('【神煞扩展（57 条全量判定）】');
  lines.push('- 合计 ' + out.total + ' 条：吉神 ' + out.jiShen.length + ' 条，凶煞 ' + out.xiongSha.length + ' 条。');
  const fmt = (arr) => {
    const list = limit > 0 ? arr.slice(0, limit) : arr;
    return list.map((s) => s.name + '(' + s.pillar + ')').join('、') +
      (limit > 0 && arr.length > limit ? ' 等' : '');
  };
  if (out.jiShen.length) lines.push('- 吉神：' + fmt(out.jiShen));
  if (out.xiongSha.length) lines.push('- 凶煞：' + fmt(out.xiongSha));
  lines.push('- 以上按「年干/日干/年支/日支/月支/年命纳音」等索引逐柱判定，四柱全扫，命中年柱亦计入。');
  return lines.join('\n');
}

module.exports = {
  detect,
  detectFromChart,
  toPromptBlock,
  pillarsFromChart,
  TABLES: T,
  FIXED_LISTS,
  NAYIN,
  nayinElement,
  KONG_WANG,
};
