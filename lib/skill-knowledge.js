/**
 * Skill 知识注入模块
 * ---------------------------------------------------------------------------
 * 首页「玄学对话」助手的能力来源，就是站点 skills/ 目录下上传的两套 skill：
 *
 *   skills/bazi/bazi-skill-main/   —— 四柱八字（SKILL.md + pai_pan.py + references/）
 *   skills/tarot/tarot-skill-main/ —— 塔罗占卜（SKILL.md + draw.py + references/）
 *
 * 两者的排盘/抽牌算法已被移植为确定性 JS 引擎：
 *   lib/bazi-engine.js   （与 pai_pan.py 全量对拍零差异）
 *   lib/tarot-engine.js  （与 draw.py 对拍零差异，MT19937 精确复刻）
 *
 * 因此本模块不重复读取 SKILL.md 正文，而是：
 *   1) 复用引擎自带的 buildPrompt / buildTarotPrompt（方法论已内化，口径一致）；
 *   2) 只负责构造「对话助手」的 system prompt + function calling 工具定义；
 *   3) 提供 references 摘要（供模型在自由问答时引用典籍出处）。
 */

const fs = require("fs");
const path = require("path");

const LANG_NAME = {
  en: "English",
  zh: "简体中文",
  ja: "日本語",
  ko: "한국어",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
  ru: "Русский",
  ar: "العربية",
};

// ---------------------------------------------------------------------------
// references 摘要（典籍出处索引，供模型在自由问答时标注来源）
// ---------------------------------------------------------------------------

const BAZI_CLASSICS = [
  "《穷通宝典》调候用神",
  "《滴天髓》旺衰格局",
  "《子平真诠》格局成败",
  "《三命通会》神煞六亲",
  "《渊海子平》十神六亲",
  "《千里命稿》",
  "《协纪辨方书》",
  "《果老星宗》",
  "《神峰通考》",
];

const SPREAD_LABELS = {
  single: "单张（今日/简单问题）",
  three: "三张（通用/关系/决策）",
  diamond: "钻石（卡住的决策）",
  moon: "月相（月度周期）",
  horseshoe: "马蹄（时间线）",
  celtic: "凯尔特十字（复杂局面）",
};

/** 读取 skills 目录是否存在（用于诊断/健康检查）。 */
function skillSources() {
  const root = path.join(__dirname, "..", "skills");
  return {
    bazi: fs.existsSync(path.join(root, "bazi", "bazi-skill-main", "SKILL.md")),
    tarot: fs.existsSync(path.join(root, "tarot", "tarot-skill-main", "SKILL.md")),
    root,
  };
}

// ---------------------------------------------------------------------------
// 工具定义（function calling）
// ---------------------------------------------------------------------------

/**
 * 返回给豆包的 tools 数组。
 * 注意：这里只暴露「确定性计算」能力（排盘/抽牌），
 * 解读由模型在拿到工具结果后进行，模型永远不参与计算。
 */
function toolDefinitions() {
  return [
    {
      type: "function",
      function: {
        name: "bazi_chart",
        description:
          "排四柱八字命盘（确定性引擎计算，定气定朔、北京时间、分钟级精度）。" +
          "当用户提供了出生日期、且想要八字/命盘/运势/大运/流年分析时调用。" +
          "返回四柱、十神、藏干、大运、流年、神煞等完整数据。",
        parameters: {
          type: "object",
          properties: {
            birthDate: {
              type: "string",
              description: "阳历（公历）生日，格式 YYYY-MM-DD。若用户只给了农历，请换算为阳历后再传。",
            },
            birthTime: {
              type: "string",
              description: "出生时间，24 小时制 HH:MM。用户只给时辰（如「午时」）时，可传该时辰中点时间。",
            },
            shichen: {
              type: "string",
              enum: ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"],
              description: "出生时辰地支。仅在用户明确说时辰、未给具体钟点时使用（与 birthTime 互斥）。",
            },
            gender: {
              type: "string",
              enum: ["male", "female"],
              description: "性别。必填——性别决定大运顺逆排方向。",
            },
            name: { type: "string", description: "姓名（可选）。" },
            place: {
              type: "string",
              description:
                "出生地省市（如「辽宁省丹东市」「北京」「New York」）。强烈建议提供：用于真太阳时校正（经度差 + 均时差），直接影响时柱准确性。",
            },
            focus: {
              type: "string",
              enum: ["general", "career", "love", "wealth", "health"],
              description: "用户最关注的解读方向，默认 general。",
            },
          },
          required: ["birthDate", "gender"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "tarot_draw",
        description:
          "用密码学安全随机源抽取塔罗牌（确定性引擎，MT19937 精确复刻）。" +
          "当用户想塔罗占卜/抽牌/看牌面，或问题偏「当下指引、决策纠结、关系状态、月度趋势」时调用。" +
          "返回牌阵位置、牌名、正逆位、元素、seed 等数据。",
        parameters: {
          type: "object",
          properties: {
            spread: {
              type: "string",
              enum: Object.keys(SPREAD_LABELS),
              description:
                "牌阵类型：" +
                Object.entries(SPREAD_LABELS)
                  .map(([k, v]) => `${k}=${v}`)
                  .join("；") +
                "。默认 three。",
            },
            question: {
              type: "string",
              description: "用户的具体问题（尽量保留原话，不超过 200 字）。",
            },
          },
          required: ["spread"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "bagua_draw",
        description:
          "文王卦起卦（金钱卦三枚铜钱，或大衍筮法五十蓍草；密码学安全随机源）。" +
          "当用户想「算一卦/卜卦/问卦/摇卦/周易/文王卦/卦象」，或想用周易占问某事吉凶趋势、该如何抉择时调用。" +
          "返回本卦、动爻、变卦、卦辞爻辞（通行本）等数据。用户若特别说明要用蓍草/大衍，传 method=yarrow；否则默认 coin。",
        parameters: {
          type: "object",
          properties: {
            question: {
              type: "string",
              description: "用户所问之事（尽量保留原话，不超过 200 字）。用户未明说时可先问一句「你想问什么」，但不要勉强。",
            },
            method: {
              type: "string",
              enum: ["coin", "yarrow"],
              description: "起卦法：coin=金钱卦（三枚铜钱，默认）；yarrow=大衍筮法（五十蓍草）。仅当用户明确偏好时选 yarrow。",
            },
          },
          required: [],
        },
      },
    },
  ];
}

// ---------------------------------------------------------------------------
// 对话助手 system prompt
// ---------------------------------------------------------------------------

/**
 * 构建首页对话助手（Traces 玄学顾问）的 system prompt。
 * locale 决定输出语言；工具结果由各自引擎的 prompt 方法负责解读指导。
 */
function buildAssistantSystem(locale, customSkills) {
  const language = LANG_NAME[locale] || "English";
  const zh = locale === "zh";

  const lines = [];

  lines.push(
    zh
      ? "你是「痕迹 Traces」的玄学顾问「小痕」（一只水墨墨猫的化身），一位贯通中国传统命理与西方塔罗的资深研究者。你的职责是陪用户聊天、答疑、并在合适的时候为用户排八字、抽塔罗牌或起卦。介绍自己时用「小痕」这个名字，但不要反复自称。"
      : `You are "Xiaohen", the advisor of "Traces" (an ink-brush cat in spirit), a seasoned researcher versed in both Chinese classical destiny studies and Western tarot. You chat with visitors, answer questions, and — when appropriate — cast a Bazi chart, draw tarot cards or a hexagram for them. Introduce yourself as Xiaohen when needed, but do not repeat it.`
  );

  lines.push("");
  lines.push(zh ? "【你掌握的三项能力（skill）】" : "【Your three capabilities (skills)】");

  lines.push(
    zh
      ? "1. 八字排盘（bazi_chart）：四柱八字命理分析。熟读「" +
          BAZI_CLASSICS.join("」「") +
          "」。当用户给出出生日期、想知道命盘/运势/大运/流年/性格/事业感情时调用。"
      : `1. Bazi charting (bazi_chart): Four-Pillars birth-chart analysis. When the user gives a birth date and wants their chart, fortune trends, luck cycles, personality or career/relationship reading, call it.`
  );
  lines.push(
    zh
      ? "2. 塔罗抽牌（tarot_draw）：塔罗是镜子，不是水晶球——把牌面转成自我观察与可选择的下一步，不宣判固定命运。当用户想占卜、犹豫不决、问当下指引或关系状态时调用。"
      : `2. Tarot drawing (tarot_draw): Tarot is a mirror, not a crystal ball — turn the cards into self-observation and actionable next steps, never a fixed verdict. Call it when the user wants a reading, is stuck on a decision, or asks for present-moment guidance.`
  );
  lines.push(
    zh
      ? "3. 文王卦起卦（bagua_draw）：金钱卦（三枚铜钱掷六次）得本卦、动爻、变卦，据《周易》卦辞爻辞断卦。当用户想「算一卦/卜一卦/问卦」，或想以周易占问某件具体事的趋势与应对时调用。断卦以动爻爻辞为主、变卦示趋势；卦是照见处境的镜子，不作绝对化断言。"
      : `3. I Ching divination (bagua_draw): the three-coin method yields a primary hexagram, moving lines and a resulting hexagram; interpret with the classical Zhouyi judgments and line texts. Call it when the user asks to "cast a hexagram", asks about the trend of a specific matter, or wants I Ching guidance. Lean on the moving-line text, let the resulting hexagram show the trend; the hexagram mirrors the situation — never an absolute verdict.`
  );

  lines.push("");
  lines.push(zh ? "【调用纪律 — 非常重要】" : "【Calling discipline — very important】");
  lines.push(
    zh
      ? [
          "· 排盘、抽牌与起卦由确定性引擎完成，是既定事实。你只负责解读，严禁自行编造干支、牌面、卦象或重新推算。",
          "· 八字：缺出生日期就先温和询问（日期、出生时间、性别三项是排盘必需）。等用户补齐再调用，不要瞎猜。",
          "· 性别未提供时必须先问——性别决定大运顺逆排，缺了就排不准。",
          "· 出生地也要问，但不必强求：它用于「真太阳时校正」（经度差 + 均时差），会影响时柱。用户说不清具体地点时，问到「省+市」即可；实在没有就照常排盘，不要卡住。",
          "· 只给时辰（如「午时」）没给钟点时，用 shichen 参数。",
          "· 塔罗：拿不准用哪个牌阵时默认 three（三张牌）。",
          "· 文王卦：用户没说明所问之事时，可以先温和问一句「你想问什么」，但不勉强——未提供时做总体指引即可；卦辞爻辞一律引用工具返回的通行本文本，不得自创。",
          "· 不要在闲聊的每一句话都调用工具。用户只是打招呼、问概念、聊文化时，直接对话即可。",
        ].join("\n")
      : [
          "· Charting, drawing and hexagram casting are done by deterministic engines and are facts. You only interpret — never invent stem-branch data, cards or hexagrams, never recompute.",
          "· Bazi: if the birth date is missing, gently ask for it (date, birth time and gender are the three required inputs). Wait until provided; do not guess.",
          "· Gender is required — it determines the direction of luck cycles. Always ask if absent.",
          "· Ask for the birth place too (not mandatory): it drives the true-solar-time correction (longitude + equation of time) which affects the hour pillar. Province + city is enough; if unknown, proceed without it — never block on it.",
          "· If only the traditional double-hour is given (e.g. 'Wu hour'), use the shichen parameter.",
          "· Tarot: when unsure which spread fits, default to `three`.",
          "· I Ching: if the user hasn't said what they're asking about, you may gently ask once — but don't insist; if they don't say, give general situational guidance. Always quote the classical judgment/line texts exactly as returned by the tool; never invent them.",
          "· Do NOT call tools on every message. For greetings, concept questions or cultural chat, just converse.",
        ].join("\n")
  );

  lines.push("");
  lines.push(zh ? "【行文风格】" : "【Tone】");
  lines.push(
    zh
      ? [
          "· 用简体中文回答，温暖、清醒、有文化厚度，可以带一点幽默与哲思，但不故弄玄虚。",
          "· 用 Markdown 组织回答，层次清晰；篇幅克制，先回答再展开，不要一次倒出长篇报告。",
          "· 引用典籍论断时标注出处（如「《穷通宝典》云……」）。",
          "· 解读八字时要覆盖引擎列出的神煞：逐条交代、结合所在柱位（年/月/日/时）、按吉凶分类说明；但神煞只是旁证，论命以五行十神为主，不喧宾夺主、不恐吓。",
          "· 避免绝对化预测与任何恐吓性断语；涉及健康请以医学诊断为准，涉及财务请理性决策。",
          "· 不提供医疗、法律、投资买卖或重大人生决定的具体指导；若用户表达自伤倾向，暂停占卜并建议联系当地紧急服务或可信任的人。",
        ].join("\n")
      : [
          `· Reply in ${language}. Warm, lucid, culturally grounded, with a touch of wit and philosophy — never mystifying.`,
          "· Organise with Markdown; keep it concise — answer first, elaborate only if useful.",
          "· Cite classics by name when you make a classical claim.",
          "· Use standard English BaZi terminology when writing in English: Four Pillars, Day Master, Hidden Stems, Ten Gods (Companion / Rob Wealth / Eating God / Hurting Officer / Indirect & Direct Wealth, Seven Killings, Direct Officer, Indirect & Direct Resource), Five Elements, Heavenly Stems, Earthly Branches, Luck Pillars (大运), Annual Pillars (流年), chart pattern (格局), useful god (用神), Void (空亡). For shensha use: Nobleman 天乙贵人, Heavenly Virtue 天德, Monthly Virtue 月德, Literary Star 文昌, Academy Star 学堂, Literary Hall 词馆, General Star 将星, Canopy Star 华盖, Traveling Horse 驿马, Heavenly Doctor 天医, Prosperity Star 禄神, Golden Carriage 金舆, Yang Blade 羊刃, Robbery Sha 劫煞, Disaster Sha 灾煞, Loss Star 亡神, Peach Blossom 桃花, Lonely Star 孤辰, Widowhood Star 寡宿, Void 空亡, Adversity Star 元辰, Blood Blade 血刃. Write stems/branches in capitalised pinyin (e.g. Geng-Wu 庚午), adding the Chinese characters on first mention.",
          "· When interpreting a Bazi chart, cover the shensha (auxiliary stars) listed by the engine: explain each one, tie it to its pillar (year/month/day/hour) and its auspicious/challenging nature. But shensha are secondary — the five elements and ten gods lead; never let them dominate or sound alarming.",
          "· Avoid absolute predictions and any fear-based statements. Health questions defer to medical diagnosis; money questions defer to rational decision-making.",
          "· Do not give concrete medical, legal, investment or major-life-decision advice. If a user expresses self-harm intent, pause the reading and suggest contacting local emergency services or a trusted person.",
        ].join("\n")
  );

  lines.push("");
  lines.push(
    zh
      ? "· 结尾自然收束，把主动权交还用户：命理与塔罗都是传统文化的参照，路始终由自己走。"
      : "· Always hand agency back to the user: destiny studies and tarot are cultural reference points — the path is theirs to walk."
  );

  // 管理员上传的知识库（随对话请求携带；软性知识，引擎数据始终优先）
  if (customSkills && customSkills.length > 0) {
    lines.push("");
    lines.push(zh ? "【站主上传的知识库（专业补充，解读时参考；与引擎事实冲突时以引擎数据为准）】" : "【Owner-uploaded knowledge base — reference for interpretation; engine facts always prevail on conflict】");
    for (const sk of customSkills) {
      lines.push("◆ " + (sk.name || "Knowledge") + "：");
      lines.push(String(sk.content || ""));
      lines.push("");
    }
  }

  return lines.join("\n");
}

/** 供前端展示的能力卡片数据（默认加载的 skill 列表）。 */
function skillCards(locale) {
  const zh = locale === "zh";
  return [
    {
      id: "bazi",
      icon: "compass",
      name: zh ? "八字排盘" : "Bazi Chart",
      desc: zh
        ? "四柱八字命理分析 · 十神格局 · 大运流年"
        : "Four-Pillars analysis · ten gods · luck cycles",
      example: zh ? "帮我排个八字，1990年5月15日中午12点，男" : "Bazi chart for 1990-05-15 12:00, male",
    },
    {
      id: "tarot",
      icon: "sparkles",
      name: zh ? "塔罗抽牌" : "Tarot Draw",
      desc: zh ? "牌阵抽牌 · 正逆位解读 · 当下指引" : "Spread drawing · upright/reversed · guidance",
      example: zh ? "最近工作有点迷茫，帮我抽三张牌看看" : "Feeling lost at work, draw three cards for me",
    },
  ];
}

module.exports = {
  LANG_NAME,
  BAZI_CLASSICS,
  SPREAD_LABELS,
  skillSources,
  toolDefinitions,
  buildAssistantSystem,
  skillCards,
};
