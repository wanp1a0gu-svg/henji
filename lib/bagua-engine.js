/**
 * 文王卦引擎（金钱卦 / 三枚铜钱起卦）
 * ===========================================================================
 * 起卦法：三枚铜钱掷六次，自下而上成卦（初爻在下，上爻在上）：
 *   三正 → 老阳（9，动爻，变阴）
 *   两正一反 → 少阳（7，静）
 *   一正两反 → 少阴（8，静）
 *   三反 → 老阴（6，动爻，变阳）
 * 动爻即变：本卦 → 变卦，示事态走向。
 *
 * 断卦传统（周易筮法）：
 *   无动爻 → 以本卦卦辞断
 *   一爻动 → 以动爻爻辞为主
 *   多爻动 → 以动爻爻辞为主、卦辞为辅，变卦示趋势
 *
 * 数据：lib/bagua-data.json（六十四卦：卦辞/大象/爻辞，通行本；含英/韩/拼音，
 *       多源交叉校验 + 逐条人工裁定，见 scripts/build-bagua-db.py）
 *
 * 抽签随机性：密码学安全随机源（crypto.randomInt），每次掷币独立。
 */
const crypto = require("crypto");
const DATA = require("./bagua-data.json");

// 索引：二进制卦码（自下而上，1=阳）→ 卦数据
const BY_BIN = {};
const BY_N = {};
for (const h of DATA.hex) {
  const item = {
    n: h[0], name: h[1], full: h[2], sym: h[3], bin: h[4],
    up: h[5], lo: h[6], gua: h[7], xiang: h[8], yao: h[9],
    en: h[10], py: h[11], ko: h[12],
  };
  BY_BIN[item.bin] = item;
  BY_N[item.n] = item;
}

const LANG_NAME = { en: "English", zh: "简体中文", ja: "日本語", ko: "한국어", es: "Español", fr: "Français", de: "Deutsch", pt: "Português", ru: "Русский", ar: "العربية" };

// 起卦法
const METHODS = ["coin", "yarrow"];
const METHOD_ZH = { coin: "金钱卦（三枚铜钱掷六次）", yarrow: "大衍筮法（五十蓍草，三变一爻、十八变一卦）" };

// 爻位名（用于动爻标注）
const YAO_POS = ["初", "二", "三", "四", "五", "上"];

// ---------------------------------------------------------------------------
// 起卦
// ---------------------------------------------------------------------------

function coin() {
  return crypto.randomInt(0, 2); // 1 = 正面（阳面）
}

/** 金钱卦一爻：三枚铜钱 → 6/7/8/9（三正=老阳9、两正=少阳7、一正=少阴8、三反=老阴6）。 */
function coinLine() {
  const coins = [coin(), coin(), coin()];
  const heads = coins.reduce((a, b) => a + b, 0);
  const value = heads === 3 ? 9 : heads === 2 ? 7 : heads === 1 ? 8 : 6;
  return { value, coins: coins.map((c) => (c === 1 ? "正" : "背")), stalks: null };
}

/**
 * 大衍筮法一变：分二 → 挂一 → 揲四 → 归奇。
 * 49（或余数 n）分左右二堆，右堆挂一，左右各以四计数、余数（1-4）归奇。
 *
 * 概率说明：经典模型假设「揲四余数的四种组合等概率」（左余数均匀 1-4，
 * 右余数由 L+(R-1)≡(n-1) 的同余关系唯一确定）——这是通行本筮法的标准
 * 概率模型，恰给出著名的 6:1/16、7:5/16、8:7/16、9:3/16 分布。
 * （若逐根模拟分割，取值范围非 4 的倍数会产生 ~2% 的偏差，不符合古籍模型。）
 */
function oneChange(n) {
  const rl = 1 + crypto.randomInt(0, 4); // 左堆揲四余数 1-4，均匀
  const rr = ((n - 1 - rl) % 4 + 4) % 4 || 4; // 右堆余数（同余关系决定）
  return n - (1 + rl + rr); // 去五或九（一变）/ 去四或八（二、三变）
}

/** 大衍筮法一爻：三变定一爻，余数 ÷4 = 6/7/8/9。
 *  理论分布：6:1/16、7:5/16、8:7/16、9:3/16（与金钱卦不同）。 */
function yarrowLine() {
  const stalks = [49];
  let n = 49;
  for (let i = 0; i < 3; i++) {
    n = oneChange(n);
    stalks.push(n);
  }
  const value = n / 4; // 6/7/8/9
  return { value, coins: null, stalks };
}

/**
 * 掷一卦：六爻（自下而上）。金钱卦三枚铜钱 ×6 或大衍筮法十八变。
 * opts: { question, method: "coin"|"yarrow" }
 */
function draw(opts) {
  const question = opts && opts.question ? String(opts.question).slice(0, 200) : "";
  const method = opts && METHODS.indexOf(opts.method) !== -1 ? opts.method : "coin";

  const lines = [];
  for (let i = 0; i < 6; i++) {
    const l = method === "yarrow" ? yarrowLine() : coinLine();
    lines.push({
      pos: i + 1,
      value: l.value,
      yang: l.value === 7 || l.value === 9,
      moving: l.value === 6 || l.value === 9,
      coins: l.coins,
      stalks: l.stalks,
    });
  }

  const bin = lines.map((l) => (l.yang ? "1" : "0")).join("");
  const movingIdx = lines.map((l, i) => (l.moving ? i : -1)).filter((i) => i >= 0);
  const bianBin = lines
    .map((l) => {
      if (!l.moving) return l.yang ? "1" : "0";
      return l.yang ? "0" : "1"; // 老阳变阴、老阴变阳
    })
    .join("");

  const ben = BY_BIN[bin];
  const bian = movingIdx.length > 0 ? BY_BIN[bianBin] : null;
  if (!ben) throw new Error("起卦失败：未知卦码 " + bin);

  // 动爻爻辞
  const movingYao = movingIdx.map((i) => ({
    pos: i + 1,
    posName: YAO_POS[i] + (lines[i].yang ? "九" : "六"),
    title: ben.yao[i][0],
    text: ben.yao[i][1],
    value: lines[i].value,
  }));

  // 乾坤六爻皆动 → 用九/用六
  let oddUse = null;
  if (movingIdx.length === 6 && (ben.name === "乾" || ben.name === "坤")) {
    const last = ben.yao[6];
    if (last) oddUse = { title: last[0], text: last[1] };
  }

  return { question, method, lines, bin, ben, bian, movingIdx, movingYao, oddUse };
}

/** 从 draw 提取前端展示用 JSON。 */
function extractDraw(d) {
  return {
    question: d.question,
    method: d.method || "coin",
    lines: d.lines.map((l) => ({
      pos: l.pos, value: l.value, yang: l.yang, moving: l.moving,
      coins: l.coins || null, stalks: l.stalks || null,
    })),
    ben: {
      n: d.ben.n, name: d.ben.name, full: d.ben.full, sym: d.ben.sym,
      up: d.ben.up, lo: d.ben.lo, gua: d.ben.gua, xiang: d.ben.xiang,
      en: d.ben.en, py: d.ben.py, ko: d.ben.ko,
    },
    bian: d.bian
      ? {
          n: d.bian.n, name: d.bian.name, full: d.bian.full, sym: d.bian.sym,
          up: d.bian.up, lo: d.bian.lo, gua: d.bian.gua,
          en: d.bian.en, py: d.bian.py, ko: d.bian.ko,
        }
      : null,
    movingYao: d.movingYao,
    oddUse: d.oddUse,
  };
}

// ---------------------------------------------------------------------------
// 提示词
// ---------------------------------------------------------------------------

function buildBaguaPrompt(payload, d) {
  const locale = (payload && payload.locale) || "en";
  const language = LANG_NAME[locale] || "English";

  const system = [
    "你是「痕迹 Traces」的文王卦解读师，精通《周易》六十四卦与金钱卦（六爻）断卦传统。",
    "",
    "【总原则】卦是照见处境的镜子，不是命运的判决书：把卦象转成对当下处境的理解与可选择的下一步，把主权交还用户。",
    "【起卦数据】卦象由密码学安全随机源真实揲出（金钱卦三枚铜钱掷六次，或大衍筮法五十蓍草三变一爻），本卦、动爻、变卦、卦辞爻辞均为既定事实——禁止更改、补卦或重新起卦；禁止自创、改写卦辞爻辞（一律引用引擎给出的通行本文本）。",
    "",
    "【断卦方法（周易筮法）】",
    "- 无动爻：以本卦卦辞、卦象断当前处境与应对。",
    "- 一爻动：以该动爻爻辞为核心断辞，卦辞为辅。",
    "- 多爻动：动爻爻辞为主、卦辞为辅，兼观变卦走向（事态演变之象）。",
    "- 六爻皆动（乾坤）：参用「用九」「用六」。",
    "- 本卦=当下处境与事物本质；动爻=变化的关键与着力点；变卦=发展趋势与结果倾向。",
    "- 简要说卦象（上下卦自然象，如「水雷屯」= 坎水在上、震雷在下，云雷交动之象），让用户看见画面感。",
    "",
    "【输出格式】Markdown，层次清晰：",
    "① 卦象总览（本卦名、上下卦之象、卦辞要义）",
    "② 动爻启示（有动爻时逐爻解读爻辞；无动爻则说明以卦辞为断）",
    "③ 变卦与趋势（有变卦时；无动爻则省略）",
    "④ 针对所问事项的具体建议（可执行的下一步）",
    "⑤ 一句箴言式总结",
    "全程使用" + language + "输出，约 500-800 词；语气平实清正，不故弄玄虚，不恐吓，不作绝对化预测。",
    "涉及健康以医学诊断为准、涉及财务请理性决策；不提供医疗、法律、投资买卖或重大人生决定的具体指导。",
    "若用户提出具体问题，解读须紧扣该问题；未提供问题时给出总体性的处境指引。",
  ].join("\n");

  const lineStr = d.lines
    .map((l) => {
      const vname = { 9: "老阳○", 7: "少阳", 8: "少阴", 6: "老阴×" }[l.value];
      const how =
        d.method === "yarrow"
          ? "蓍草 " + l.stalks.join("→") + "，得 " + l.value
          : l.coins.join("") + " → " + vname;
      return "第" + l.pos + "爻（" + YAO_POS[l.pos - 1] + "爻）：" + how + (l.moving ? "（动）" : "");
    })
    .join("\n");

  const benYao = d.movingYao.length
    ? d.movingYao.map((y) => "- " + y.title + "：" + y.text).join("\n")
    : "（无动爻，以卦辞断）";

  const user = [
    "【本次起卦（密码学安全随机源揲出，为既定事实）】",
    "起卦方式：" + (METHOD_ZH[d.method] || METHOD_ZH.coin) + "（自下而上）",
    lineStr,
    "",
    "【本卦】" + d.ben.n + ". " + d.ben.full + "（" + d.ben.name + " " + d.ben.sym + "，上" + d.ben.up + "下" + d.ben.lo + "）",
    "卦辞：" + d.ben.gua,
    "大象：" + d.ben.xiang,
    "",
    "【动爻爻辞】",
    benYao,
    ...(d.oddUse ? ["【用九/用六】" + d.oddUse.title + "：" + d.oddUse.text] : []),
    "",
    d.bian
      ? "【变卦】" + d.bian.n + ". " + d.bian.full + "（" + d.bian.name + " " + d.bian.sym + "，上" + d.bian.up + "下" + d.bian.lo + "）\n变卦卦辞：" + d.bian.gua
      : "【变卦】无动爻，本卦不变。",
    "",
    d.question ? "用户所问：" + d.question : "用户未提供具体问题，请给出总体性的处境指引。",
    "",
    "请按断卦方法输出完整解读（" + language + "，Markdown 格式）。",
  ].join("\n");

  return { system, user };
}

/** 轻量校验（与 tarot 同风格）。 */
function validatePayload(payload) {
  const errors = [];
  if (payload && payload.question && String(payload.question).length > 200) errors.push("question");
  if (payload && payload.locale && !LANG_NAME[payload.locale]) errors.push("locale");
  if (payload && payload.method && METHODS.indexOf(payload.method) === -1) errors.push("method");
  return errors;
}

module.exports = {
  ENGINE_INFO: { name: "mingli-bagua-engine", version: "1.1.0", basis: "金钱卦（三枚铜钱掷六次）+ 大衍筮法（五十蓍草）· 通行本《周易》卦辞爻辞" },
  METHODS,
  draw,
  extractDraw,
  buildBaguaPrompt,
  validatePayload,
  YAO_POS,
  HEX_COUNT: DATA.hex.length,
};
