/**
 * 紫微斗数解读提示词（服务端）。
 *
 * 为什么要单独一个文件：
 * - 盘由 lib/ziwei-engine.js 算（确定性，绝不手排）
 * - 解读由模型写，必须**只依据盘上的星**，不许自由发挥
 * - 页面是 10 语言的，提示词要跟着语言走；非中日韩语言附术语对照
 */

const LANGUAGE_NAME = {
  zh: "Simplified Chinese",
  en: "English",
  ja: "Japanese",
  ko: "Korean",
  es: "Spanish",
  fr: "French",
  de: "German",
  pt: "Portuguese",
  ru: "Russian",
  ar: "Arabic",
};

/** 非中日韩语言用的术语对照（与 chart-i18n / 页面文案口径一致） */
const GLOSSARY = `【English terminology — use these renderings consistently】
命宫 Life Palace / 身宫 Body Palace / 兄弟 Siblings / 夫妻 Spouse / 子女 Children / 财帛 Wealth /
疾厄 Health / 迁移 Travel / 交友 Friends / 官禄 Career / 田宅 Property / 福德 Fortune / 父母 Parents
十四主星: 紫微 Zi Wei / 天机 Tian Ji / 太阳 Tai Yang / 武曲 Wu Qu / 天同 Tian Tong / 廉贞 Lian Zhen /
天府 Tian Fu / 太阴 Tai Yin / 贪狼 Tan Lang / 巨门 Ju Men / 天相 Tian Xiang / 天梁 Tian Liang /
七杀 Qi Sha / 破军 Po Jun
四化: 化禄 (Lu, prosperity) / 化权 (Quan, authority) / 化科 (Ke, reputation) / 化忌 (Ji, obstruction)
亮度: 庙 Miao (brightest) / 旺 Wang / 得 De / 利 Li / 平 Ping / 不 Bu / 陷 Xian (dimmest)
大限 Decade / 五行局 Five-element bureau / 命主 Life star / 身主 Body star`;

function buildPrompt({ chartBlock, locale = "en", gender = "" }) {
  const lang = LANGUAGE_NAME[locale] || "English";
  const cjk = locale === "zh" || locale === "ja" || locale === "ko";

  const system = [
    "你是紫微斗数命理师，专长是把盘面讲成人听得懂的话。",
    "",
    "【硬规矩】",
    "1. 只依据用户提供的盘解读。盘上没有的星曜不许编，不确定的宫位就说「此宫星曜较少，判断依据有限」。",
    "2. 亮度要看：庙旺的星力量足、落陷的星易显其短，同一颗星在庙与陷的判断可以相反。",
    "3. 四化（禄权科忌）落在哪一宫、哪一颗星上，比星曜本身更能说明「事情发生在哪里」。",
    "4. 身宫代表后天用力的方向，和命宫不一致时要说清「先天与后天不同调」。",
    "5. 不给医疗、法律、投资的具体承诺；不写「必发财」「必离婚」这类断语，写倾向与条件。",
    "6. 结构固定：① 命身宫与主星格局 ② 三方四正（对宫与三合）③ 四化落宫 ④ 当前大限与下一步 ⑤ 三条可执行建议。",
    "7. 全文 700–900 字（非中文语言同义字数），不要用markdown大标题，用短段落，必要时用「①②③」编号。",
    "",
    "【术语纪律】紫微斗数的星名、宫名是专名，不要意译成别的体系（不要把七杀说成「战神」）。",
    "",
    cjk
      ? `【输出语言】${lang}。全篇只用 ${lang}，星名宫名直接写原字，**不要**夹英文括号注释（例如写「命宫七杀旺」，不要写「命宫（Life Palace）」）。`
      : `【输出语言】${lang}。正文用 ${lang}，星名宫名给出中文原字并在括号里附上对照译名。`,
  ].join("\n");

  const user = [
    cjk ? "" : GLOSSARY + "\n",
    "【命盘数据（由引擎计算，为既定事实，请原样采信）】",
    chartBlock,
    "",
    gender ? `求测者性别：${gender}` : "",
    "",
    "请按系统提示的结构写解读。",
  ]
    .filter((x) => x !== "")
    .join("\n");

  return { system, user };
}

module.exports = { buildPrompt };
