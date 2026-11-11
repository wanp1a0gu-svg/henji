/**
 * Traces 痕迹 服务器：静态导出站点 + 八字排盘 API。
 *
 * 静态部分（发布沙箱用）：服务 ./release（优先）或 ./dist。
 * API 部分：
 *   POST /api/bazi
 *     1. 校验输入（日期/时辰/性别/关注方向/语言）
 *     2. lib/bazi-engine.js 确定性排盘（定气定朔，与 pai_pan.py 全量对拍）
 *     3. 把命盘数据交给豆包 LLM 做「纯解读」（AI 不参与排盘）
 *     4. 返回 { report, chart }
 *   配置读取顺序：环境变量 → ./server-config.json（部署沙箱不支持环境变量时的兜底）
 *
 * URL 映射（static export, no trailingSlash）：
 *   /            -> release/index.html   (locale redirect page)
 *   /en          -> release/en.html
 *   /en/courses  -> release/en/courses.html
 *   /_next/...   -> served as-is
 */
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// 启动诊断（发布沙箱会把 stderr 记录到 .sites-app.log，失败时可定位卡点）
console.error(
  "[boot] starting pid=" + process.pid + " node=" + process.version + " cwd=" + process.cwd()
);

let BaziEngine = null;
try {
  BaziEngine = require("./lib/bazi-engine.js");
  console.error("[boot] bazi engine loaded");
} catch (e) {
  console.error("[boot] bazi engine load FAILED:", (e && e.message) || e);
}

let TarotEngine = null;
try {
  TarotEngine = require("./lib/tarot-engine.js");
  console.error("[boot] tarot engine loaded");
} catch (e) {
  console.error("[boot] tarot engine load FAILED:", (e && e.message) || e);
}

// 文王卦引擎（金钱卦起卦 + 周易六十四卦）
let BaguaEngine = null;
try {
  BaguaEngine = require("./lib/bagua-engine.js");
  console.error("[boot] bagua engine loaded (" + BaguaEngine.HEX_COUNT + " hexagrams)");
} catch (e) {
  console.error("[boot] bagua engine load FAILED:", (e && e.message) || e);
}

// PayPal 支付（REST API 客户端）
let PayPal = null;
let SHOP_PRICES = {};
try {
  PayPal = require("./lib/paypal.js");
  console.error("[boot] paypal module loaded (configured=" + PayPal.isConfigured() + ")");
} catch (e) {
  console.error("[boot] paypal module load FAILED:", (e && e.message) || e);
}
// 紫微斗数排盘引擎（零依赖，与 bazi/tarot/bagua 同源思路）
let ZiweiEngine = null;
try {
  ZiweiEngine = require("./lib/ziwei-engine.js");
  console.error("[boot] ziwei engine loaded");
} catch (e) {
  console.error("[boot] ziwei engine load FAILED:", (e && e.message) || e);
}

// 紫微解读提示词（盘由引擎算，模型只负责解读）
let ZiweiReading = null;
try {
  ZiweiReading = require("./lib/ziwei-reading.js");
} catch (e) {
  console.error("[boot] ziwei reading prompt load FAILED:", (e && e.message) || e);
}

// 事务邮件（订单确认 / 发货通知 / 报告就绪）
let Mailer = null;
try {
  Mailer = require("./lib/mailer.js");
  const d = Mailer.describe();
  console.error("[boot] mailer loaded (" + (d.configured ? d.provider + " 已配置" : "未配置，跳过发信") + ")");
} catch (e) {
  console.error("[boot] mailer module load FAILED:", (e && e.message) || e);
  Mailer = null;
}
try {
  SHOP_PRICES = require("./lib/shop-prices.json");
} catch (e) {
  console.error("[boot] shop-prices.json load FAILED:", (e && e.message) || e);
}

// 服务端商品价格表（金额只信服务端，防客户端篡改）
const PAY_PRODUCTS = {
  bazi: { price: 6.8, name: "Bazi Personal Reading (八字个人测算)" },
};

/** 清洗客户端携带的知识库（限制数量与长度，防止超长提示词/控制字符注入）。 */
function sanitizeCustomSkills(input) {
  if (!Array.isArray(input)) return [];
  const out = [];
  let total = 0;
  for (const it of input.slice(0, 8)) {
    if (!it || typeof it.content !== "string") continue;
    const name = String(it.name || "").slice(0, 60);
    const content = it.content
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
      .slice(0, 8000);
    if (!content.trim()) continue;
    if (total + content.length > 24000) break;
    total += content.length;
    out.push({ name, content });
  }
  return out;
}

// PayPal Webhook 事件日志（沙盒磁盘上的 JSONL，供对账/审计）
const PAYPAL_DATA_DIR = path.join(__dirname, "data");
const PAYPAL_EVENTS_FILE = path.join(PAYPAL_DATA_DIR, "paypal-events.jsonl");

function loadServerConfigField(key) {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "server-config.json"), "utf8"));
    return cfg[key] || "";
  } catch {
    return "";
  }
}

/**
 * 小痕（站内猫咪助理）总开关 —— 与前端 lib/cat-status.ts 读的是同一份 cat-status.json。
 * online=false 时 /api/chat 直接返回 503，不进豆包、不写库，省额度。
 * 读不到文件时按「在线」处理，避免配置缺失把功能误杀。
 */
const CAT_STATUS = (() => {
  try {
    const s = JSON.parse(fs.readFileSync(path.join(__dirname, "cat-status.json"), "utf8"));
    return {
      online: s.online !== false,
      notice: (s.offlineNotice && (s.offlineNotice.zh || s.offlineNotice.en)) || "小痕正在打盹，暂时不在线。",
    };
  } catch {
    return { online: true, notice: "" };
  }
})();
if (!CAT_STATUS.online) console.log("[cat] 小痕已下线：/api/chat 返回 503 维护提示");

/** 关键事件摘要（日志/对账用，不含敏感卡号等）。 */
function summarizePayPalEvent(ev) {
  const t = (ev && ev.event_type) || "";
  const r = (ev && ev.resource) || {};
  try {
    if (t.indexOf("PAYMENT.CAPTURE") === 0 || t.indexOf("CHECKOUT.ORDER") === 0) {
      const amount = (r.amount && (r.amount.value)) || (r.purchase_units && r.purchase_units[0] && r.purchase_units[0].amount && r.purchase_units[0].amount.value) || "";
      const custom = r.custom_id || (r.purchase_units && r.purchase_units[0] && r.purchase_units[0].custom_id) || "";
      const payer = (r.payer && r.payer.email_address) || "";
      const ship = (r.shipping && r.shipping.address) || (r.purchase_units && r.purchase_units[0] && r.purchase_units[0].shipping && r.purchase_units[0].shipping.address) || null;
      return { id: r.id || "", amount, custom, payer, status: r.status || "", shipping: ship };
    }
    if (t.indexOf("CUSTOMER.DISPUTE") === 0) {
      return { id: r.dispute_id || "", status: r.status || "", reason: r.reason || "" };
    }
  } catch (_) { /* ignore */ }
  return { id: r.id || "" };
}

/** 追加一条 webhook 事件到日志文件（失败不影响响应）。 */
function appendPayPalEvent(record) {
  try {
    fs.mkdirSync(PAYPAL_DATA_DIR, { recursive: true });
    fs.appendFileSync(PAYPAL_EVENTS_FILE, JSON.stringify(record) + "\n", "utf8");
  } catch (e) {
    console.error("[paypal-webhook] log write failed:", (e && e.message) || e);
  }
}

/** 读取最近 N 条 webhook 事件。 */
function readPayPalEvents(limit) {
  try {
    const raw = fs.readFileSync(PAYPAL_EVENTS_FILE, "utf8").trim();
    if (!raw) return [];
    const lines = raw.split("\n");
    return lines.slice(-limit).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  } catch {
    return [];
  }
}

// 首页「玄学对话」助手：把站点 skills/ 下的八字与塔罗 skill 封装为可调用工具
let SkillKnowledge = null;
let ModelQueue = null;
try {
  SkillKnowledge = require("./lib/skill-knowledge.js");
  ModelQueue = require("./lib/model-queue.js");
  const src = SkillKnowledge.skillSources();
  console.error("[boot] skill knowledge loaded (bazi=" + src.bazi + " tarot=" + src.tarot + ")");
} catch (e) {
  console.error("[boot] skill knowledge load FAILED:", (e && e.message) || e);
}

// 真太阳时校正：出生地经度 + 均时差 → 校正后的日期时间再喂给排盘引擎
let TrueSolar = null;
try {
  TrueSolar = require("./lib/truesolar.js");
  console.error("[boot] true solar module loaded");
} catch (e) {
  console.error("[boot] true solar load FAILED:", (e && e.message) || e);
}

// 神煞扩展（57 条全量判定）：仅做附加判定，不参与排盘与对拍
let ShenshaExtended = null;
try {
  ShenshaExtended = require("./lib/shensha-engine.js");
  console.error("[boot] shensha(extended) module loaded");
} catch (e) {
  console.error("[boot] shensha(extended) load FAILED:", (e && e.message) || e);
}

const PORT = process.env.PORT || 3000;

/**
 * Serve from release/ when present (that copy ships with the app-publishing
 * upload; dist/ is treated as build output and excluded), else dist/ locally.
 */
const RELEASE_ROOT = path.join(__dirname, "release");
const DIST_ROOT = path.join(__dirname, "dist");
const ROOT = fs.existsSync(RELEASE_ROOT) ? RELEASE_ROOT : DIST_ROOT;

/**
 * 静态导出的 <html lang> 只能是 en（根 layout 拿不到 locale）。
 * 用响应头补上语言标记：爬虫、读屏、翻译插件都认这个。
 */
const CONTENT_LANGUAGE_BY_LOCALE = {
  zh: "zh-CN", en: "en", ja: "ja", ko: "ko", es: "es",
  fr: "fr", de: "de", pt: "pt", ru: "ru", ar: "ar",
};
function contentLanguageFor(cleanPath) {
  const seg = String(cleanPath || "").split("/").filter(Boolean)[0] || "";
  return CONTENT_LANGUAGE_BY_LOCALE[seg] || null;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".xml": "application/xml",
  ".pdf": "application/pdf",
};

// ---------------------------------------------------------------------------
// Bazi API 配置与状态
// ---------------------------------------------------------------------------

let fileConfig = {};
try {
  fileConfig = JSON.parse(fs.readFileSync(path.join(__dirname, "server-config.json"), "utf8"));
} catch {
  fileConfig = {};
}

/**
 * 对话模型配置（可切换 provider）。
 *
 * CHAT_PROVIDER=openai → 任意 OpenAI 兼容平台（硅基流动 / 混元 / 通义 …）
 * CHAT_PROVIDER=glm    → 智谱 GLM（OpenAI 兼容，当前默认）
 * 豆包通道已于 2026-11-09 按站主要求移除（火山方舟账号欠费，不再使用）。
 *
 * GLM 免费档有 1 并发限制：同时两个人在聊天，第二个会排队或失败。
 * 所以这里保留 fallback 能力，随时可以切回来。
 */
const CHAT_PROVIDER =
  process.env.CHAT_PROVIDER ||
  fileConfig.CHAT_PROVIDER ||
  (function () {
    // 通用 OpenAI 兼容通道优先（硅基流动 / 混元 / 通义 / 千帆 都能用这一套）
    if (process.env.CHAT_ENDPOINT || fileConfig.CHAT_ENDPOINT) return "openai";
    return "glm";
  })();

/** 任意 OpenAI 兼容平台：端点 + key + 模型名三件套由配置决定。 */
const RAW_ENDPOINT = process.env.CHAT_ENDPOINT || fileConfig.CHAT_ENDPOINT || "";
const RAW_KEY = process.env.CHAT_API_KEY || fileConfig.CHAT_API_KEY || "";
const RAW_MODEL = process.env.CHAT_MODEL || fileConfig.CHAT_MODEL || "";

const GLM_API_KEY = process.env.GLM_API_KEY || fileConfig.GLM_API_KEY || "";
const GLM_MODEL = process.env.GLM_MODEL || fileConfig.GLM_MODEL || "glm-4.7-flash";
const GLM_ENDPOINT =
  process.env.GLM_ENDPOINT || fileConfig.GLM_ENDPOINT || "https://open.bigmodel.cn/api/paas/v4/chat/completions";


/** 当前生效的模型通道。 */
const CHAT =
  CHAT_PROVIDER === "openai"
    ? { provider: "openai", apiKey: RAW_KEY, model: RAW_MODEL, endpoint: RAW_ENDPOINT }
    : { provider: "glm", apiKey: GLM_API_KEY, model: GLM_MODEL, endpoint: GLM_ENDPOINT };
const CHAT_CONFIGURED = !!CHAT.apiKey;
/** 推理强度：GLM-5 系列不支持关闭思考，用 low 把延迟压到可接受范围。 */
const CHAT_REASONING_EFFORT = process.env.CHAT_REASONING_EFFORT || fileConfig.CHAT_REASONING_EFFORT || "";

/**
 * 模型降级链：主模型限流/超时时，依次尝试备用模型（同一平台，换模型名即可）。
 * 例如主用 glm-4.7-flash（质量好但免费池常被打满），
 * 打满时自动降到 glm-4-flash-250414（更快更稳）。
 */
const CHAT_FALLBACK_MODELS = String(
  process.env.CHAT_FALLBACKS || fileConfig.CHAT_FALLBACKS || ""
)
  .split(",")
  .map((x) => x.trim())
  .filter(Boolean);

/**
 * 模型调用闸门：按提交顺序排队，先来先算。
 * 免费档只允许 1 并发，排队比直接报错体验好得多。
 * 可用环境变量/配置覆盖：MODEL_CONCURRENCY / MODEL_QUEUE_MAX / MODEL_QUEUE_WAIT_MS
 */
const MODEL_QUEUE = ModelQueue
  ? ModelQueue.createModelQueue({
      concurrency: process.env.MODEL_CONCURRENCY || fileConfig.MODEL_CONCURRENCY || 1,
      maxQueue: process.env.MODEL_QUEUE_MAX || fileConfig.MODEL_QUEUE_MAX || 30,
      waitMs: process.env.MODEL_QUEUE_WAIT_MS || fileConfig.MODEL_QUEUE_WAIT_MS || 60000,
    })
  : null;
console.error(
  "[boot] chat provider=" + CHAT.provider + " model=" + CHAT.model + " configured=" + CHAT_CONFIGURED +
    " queue=" + JSON.stringify(MODEL_QUEUE ? MODEL_QUEUE.stats() : null)
);

// ---------------------------------------------------------------------------
// 模型用量统计：每次调用累计 tokens（按模型 / 按天），落盘 data/model-usage.json
// 用途：/api/health 随时看资源包烧了多少；进程重启不丢总数。
// 按天只保留最近 30 天，防止文件无限膨胀；模型维度的总数永久保留。
// ---------------------------------------------------------------------------
const USAGE_FILE = path.join(__dirname, "data", "model-usage.json");
const usageState = (() => {
  try {
    const parsed = JSON.parse(fs.readFileSync(USAGE_FILE, "utf8"));
    return { models: parsed.models || {}, days: parsed.days || {} };
  } catch {
    return { models: {}, days: {} };
  }
})();

function recordModelUsage(model, usage, ok) {
  try {
    const day = new Date().toISOString().slice(0, 10);
    const m =
      usageState.models[model] ||
      (usageState.models[model] = {
        calls: 0,
        failures: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        firstCall: null,
        lastCall: null,
      });
    const d =
      usageState.days[day] ||
      (usageState.days[day] = { calls: 0, failures: 0, totalTokens: 0 });
    const now = new Date().toISOString();
    m.calls++;
    m.lastCall = now;
    if (!m.firstCall) m.firstCall = now;
    d.calls++;
    if (ok && usage) {
      const pt = usage.prompt_tokens || 0;
      const ct = usage.completion_tokens || 0;
      const tt = usage.total_tokens || pt + ct;
      m.promptTokens += pt;
      m.completionTokens += ct;
      m.totalTokens += tt;
      d.totalTokens += tt;
    } else {
      m.failures++;
      d.failures++;
    }
    // 天数窗口裁剪
    const dayKeys = Object.keys(usageState.days).sort();
    while (dayKeys.length > 30) {
      delete usageState.days[dayKeys.shift()];
    }
    fs.mkdirSync(path.dirname(USAGE_FILE), { recursive: true });
    fs.writeFileSync(USAGE_FILE, JSON.stringify(usageState, null, 2), "utf8");
  } catch (e) {
    // 统计写不进去不影响业务
    console.warn("[usage] 记录失败：" + String(e && e.message).slice(0, 80));
  }
}

function usageSummary() {
  const today = new Date().toISOString().slice(0, 10);
  const emptyDay = { calls: 0, failures: 0, totalTokens: 0 };
  return {
    today: usageState.days[today] || emptyDay,
    days: usageState.days,
    models: usageState.models,
  };
}

const UPSTREAM_TIMEOUT_MS = 170000; // 神煞详解等长报告约需 90–130s，留足余量（前端轮询 240s）

const FOCUS_VALUES = ["general", "career", "love", "wealth", "health"];
const LOCALES = ["en", "zh", "ja", "ko", "es", "fr", "de", "pt", "ru", "ar"];
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const MAX_BODY_BYTES = 16384;
const RATE_LIMIT_PER_HOUR = 10; // 单 IP
const GLOBAL_LIMIT_PER_HOUR = 300; // 全站保护（防 key 被刷）

// ---------------------------------------------------------------------------
// 异步任务（网关约 60s 超时，生成需 60-90s → POST 返回 jobId，GET ?id= 轮询取结果）
// ---------------------------------------------------------------------------

const _jobs = new Map(); // jobId -> { status, report?, chart?, engine?, error?, createdAt }
const JOB_TTL_MS = 30 * 60 * 1000;

function pruneJobs() {
  const now = Date.now();
  for (const [k, v] of _jobs) {
    if (now - v.createdAt > JOB_TTL_MS) _jobs.delete(k);
  }
}

function newJobId() {
  return "j" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

/**
 * 限流按「用途」分桶：生成报告与下单/报价互不挤占，
 * 避免有人刷生成接口把全站额度耗光、导致付费用户 429。
 */
const RATE_LIMITS = {
  default: { perIp: RATE_LIMIT_PER_HOUR, global: GLOBAL_LIMIT_PER_HOUR },
  bazi: { perIp: 6, global: 200 },
  mail: { perIp: 20, global: 400 },
  ziwei: { perIp: 6, global: 200 },
};

const _rateBuckets = new Map(); // "kind:ip" -> { bucket, count }
const _globalBuckets = new Map(); // kind -> { bucket, count }

/**
 * 取访问者 IP。
 *
 * 现实：站点挂在托管平台上，前面有网关 + 用户自己的代理/VPN。
 * 服务端能看到的永远是「最后一跳」。把常见携带真实 IP 的头都收一遍，
 * 取链条里第一个公网地址，取不到就退回直连地址。
 */
function ipCandidates(req) {
  const h = req.headers || {};
  const out = [];

  const push = (v) => {
    if (!v) return;
    String(v)
      .split(",")
      .forEach((x) => {
        const t = x.trim().replace(/^\[|\]$/g, "");
        if (t) out.push(t);
      });
  };

  push(h["cf-connecting-ip"]);
  push(h["true-client-ip"]);
  push(h["x-real-ip"]);
  push(h["x-forwarded-for"]);
  // RFC 7239: for=1.2.3.4;proto=https, for="[2001:db8::1]"
  if (h["forwarded"]) {
    String(h["forwarded"])
      .split(",")
      .forEach((part) => {
        const m = /for=("?\[?)([^\];,"]+)/i.exec(part);
        if (m && m[2]) out.push(m[2].trim());
      });
  }
  if (req.socket && req.socket.remoteAddress) out.push(req.socket.remoteAddress);

  // 去重，保留顺序
  const seen = new Set();
  return out.filter((ip) => {
    if (seen.has(ip)) return false;
    seen.add(ip);
    return true;
  });
}

/** 挑「最像真实访客」的那个：第一个非内网地址。 */
function pickClientIp(req) {
  const list = ipCandidates(req);
  const isBad = (ip) =>
    !ip ||
    isPrivateIp(ip) ||
    ip === "unknown" ||
    /^(::1|::ffff:127\.0\.0\.1)$/.test(ip) ||
    ip.startsWith("100.") /* 运营商级 NAT 段 */;
  const good = list.find((ip) => !isBad(ip));
  return { ip: good || list[0] || "unknown", chain: list };
}

function clientIp(req) {
  return pickClientIp(req).ip;
}

/**
 * IP 归属地：先用 ipwho.is（HTTPS），失败退回 ip-api.com（HTTP）。
 * 只用于后台「流量」页展示来源地，不参与业务；任何失败一律返回空值，绝不阻塞埋点。
 * 缓存 12 小时（同一 IP 不重复查），上限 2000 条。
 */
const _geoCache = new Map();
const GEO_TTL_MS = 12 * 3600 * 1000;

function isPrivateIp(ip) {
  if (!ip) return true;
  const s = String(ip).replace(/^::ffff:/, "");
  if (s === "::1" || s === "127.0.0.1") return true;
  if (s.startsWith("10.") || s.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(s)) return true;
  if (s.startsWith("169.254.")) return true;
  return false;
}

/**
 * 判断 IP 属于「机房/代理」还是「普通宽带」。
 *
 * 为什么要这个：站主反馈「我人在郑州，为什么显示济南」。查下来是他本机开着代理，
 * 出口落在一台山东机房（AS58540 …JINAN IDC）。这类 IP 的归属地**不是用户所在地**，
 * 必须标出来，否则后台看数据会被误导。
 */
const IDC_HINTS = [
  "idc", "data center", "datacenter", "data-center", "cloud", "hosting", "colo",
  "server", "vpn", "proxy", "dedicated",
  "amazon", "aws", "google", "microsoft", "azure", "oracle", "digitalocean",
  "cloudflare", "linode", "vultr", "ovh", "hetzner", "leaseweb",
  "alibaba", "aliyun", "tencent", "huawei cloud", "ucloud", "kingsoft",
];

function ipKindOf(...texts) {
  const t = texts.filter(Boolean).join(" ").toLowerCase();
  if (!t) return "";
  return IDC_HINTS.some((k) => t.indexOf(k) !== -1) ? "idc" : "resi";
}

async function lookupGeo(ip) {
  const empty = { country: "", region: "", city: "", isp: "", kind: "" };
  if (isPrivateIp(ip)) return empty;

  const hit = _geoCache.get(ip);
  if (hit && Date.now() - hit.at < GEO_TTL_MS) return hit.geo;

  let geo = null;

  // 1) ip-api.com：ISP/ASN 更完整（国内能到"联通/电信 + AS 号"），优先
  try {
    const r = await fetch(
      "http://ip-api.com/json/" +
        encodeURIComponent(ip) +
        "?fields=status,country,regionName,city,isp,org,as&lang=en",
      { signal: AbortSignal.timeout(3500) }
    );
    const j = await r.json();
    if (j && j.status === "success") {
      const asn = j.as ? String(j.as).split(" ")[0] : "";
      geo = {
        country: j.country || "",
        region: j.regionName || "",
        city: j.city || "",
        isp: [j.org || j.isp || "", asn].filter(Boolean).join(" · "),
        kind: ipKindOf(j.as, j.org, j.isp),
      };
    }
  } catch {
    /* 换下一个通道 */
  }

  // 2) ipwho.is：HTTPS，兜底
  if (!geo) {
    try {
      const r = await fetch("https://ipwho.is/" + encodeURIComponent(ip), {
        signal: AbortSignal.timeout(3500),
      });
      const j = await r.json();
      if (j && j.success) {
        geo = {
          country: j.country || "",
          region: j.region || "",
          city: j.city || "",
          isp: (j.connection && j.connection.isp) || "",
          kind: ipKindOf(j.connection && j.connection.isp, j.connection && j.connection.org),
        };
      }
    } catch {
      /* 两个都失败就不带地理信息 */
    }
  }

  geo = geo || empty;
  if (_geoCache.size > 2000) _geoCache.clear();
  _geoCache.set(ip, { at: Date.now(), geo });
  return geo;
}

function checkRateLimit(req, kind) {
  const k = RATE_LIMITS[kind] ? kind : "default";
  const limit = RATE_LIMITS[k];
  const bucket = Math.floor(Date.now() / 3600000);

  const g = _globalBuckets.get(k);
  if (!g || g.bucket !== bucket) _globalBuckets.set(k, { bucket, count: 1 });
  else {
    if (g.count >= limit.global) return false;
    g.count += 1;
  }

  const ip = clientIp(req);
  const key = k + ":" + ip;
  const entry = _rateBuckets.get(key);
  const next = entry && entry.bucket === bucket ? entry.count + 1 : 1;
  _rateBuckets.set(key, { bucket, count: next });
  if (_rateBuckets.size > 5000) {
    for (const [kk, v] of _rateBuckets) {
      if (v.bucket !== bucket) _rateBuckets.delete(kk);
    }
  }
  return next <= limit.perIp;
}

function validateBody(body) {
  const errors = [];
  const birthDate = body && body.birthDate;
  const birthTime = body && body.birthTime;
  const gender = body && body.gender;
  const focus = body && body.focus;
  const locale = body && body.locale;
  const name = body && body.name;
  const place = body && body.place;

  if (!birthDate || !DATE_RE.test(String(birthDate))) errors.push("birthDate");
  if (!gender || ["male", "female"].indexOf(gender) === -1) errors.push("gender");
  if (birthTime && !TIME_RE.test(String(birthTime))) errors.push("birthTime");
  if (name && String(name).length > 50) errors.push("name");
  if (focus && FOCUS_VALUES.indexOf(focus) === -1) errors.push("focus");
  if (locale && LOCALES.indexOf(locale) === -1) errors.push("locale");
  if (place && String(place).length > 80) errors.push("place");

  if (birthDate && DATE_RE.test(String(birthDate))) {
    const year = parseInt(String(birthDate).slice(0, 4), 10);
    if (year < 1900 || year > 2100) errors.push("birthDate");
  }
  return errors;
}

function readBody(req, cb) {
  let size = 0;
  let done = false;
  const chunks = [];
  req.on("data", (c) => {
    if (done) return;
    size += c.length;
    if (size > MAX_BODY_BYTES) {
      done = true;
      cb(new Error("too large"));
      req.destroy();
      return;
    }
    chunks.push(c);
  });
  req.on("end", () => {
    if (done) return;
    done = true;
    cb(null, Buffer.concat(chunks).toString("utf8"));
  });
  req.on("error", (e) => {
    if (done) return;
    done = true;
    cb(e);
  });
}

/** 用 https 模块 POST JSON（不依赖全局 fetch，兼容旧 Node 运行时）。 */
function httpsPostJson(url, headers, bodyObj, timeoutMs) {
  return new Promise((resolve, reject) => {
    const payload = Buffer.from(JSON.stringify(bodyObj), "utf8");
    const target = new URL(url);
    const req = https.request(
      {
        hostname: target.hostname,
        port: target.port || 443,
        path: target.pathname + target.search,
        method: "POST",
        headers: Object.assign(
          {
            "Content-Type": "application/json",
            "Content-Length": payload.length,
          },
          headers
        ),
      },
      (res) => {
        const parts = [];
        res.on("data", (c) => parts.push(c));
        res.on("end", () => resolve({ status: res.statusCode || 0, text: Buffer.concat(parts).toString("utf8") }));
      }
    );
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error("upstream timeout"));
    });
    req.on("error", (e) => reject(e));
    req.end(payload);
  });
}

/**
 * Baseline security headers applied to every response.
 * CSP stays deliberately permissive for inline scripts/styles (Next.js
 * hydration data) while locking down objects, framing rules and origins.
 */
const SECURITY_HEADERS = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // payment=(self)：允许本站使用 Payment Request API（PayPal SDK 需要）
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(self)",
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  // CSP：默认严格；显式放行 PayPal（SDK 脚本 / 连接 / 图片 / 弹窗 / 表单跳转）
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://*.paypal.com https://*.paypalobjects.com",
    "style-src 'self' 'unsafe-inline' https://*.paypal.com https://*.paypalobjects.com",
    "img-src 'self' data: blob: https://*.paypal.com https://*.paypalobjects.com",
    "font-src 'self' data: https://*.paypalobjects.com",
    "connect-src 'self' https://mingli-bazi-api.wanp1a0gu.workers.dev https://*.paypal.com https://*.paypalobjects.com",
    "frame-src https://*.paypal.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://*.paypal.com",
  ].join("; "),
};

function securityHeaders() {
  return Object.assign({}, SECURITY_HEADERS);
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(
    status,
    Object.assign(
      {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
      securityHeaders()
    )
  );
  res.end(body);
}

/* ---------------------------------------------------------------------------
 * 报告付费墙（2026-10-26）
 *
 * 背景：/api/bazi 之前没有任何付款校验，直接 POST 就能拿到完整报告。
 *
 * 两类凭据：
 *   paypal — 服务端调 PayPal 查单，要求 COMPLETED 且金额达标（强校验）
 *   wallet — 客户端余额扣款后，由数据库函数 wallet_receipt_sign 用共享密钥
 *            签一张收据（wallet|txn|amount|ts），服务端用同一密钥验签（强校验）
 * 每张凭据只能换一份报告（内存集合 + data/report-receipts.jsonl 落盘去重）。
 * ------------------------------------------------------------------------- */

const RECEIPT_LEDGER_FILE = path.join(__dirname, "data", "report-receipts.jsonl");
const _usedReceipts = new Set();

function receiptAlreadyUsed(ref) {
  if (_usedReceipts.has(ref)) return true;
  try {
    return fs.readFileSync(RECEIPT_LEDGER_FILE, "utf8").includes('"' + ref + '"');
  } catch {
    return false;
  }
}

function markReceiptUsed(ref) {
  _usedReceipts.add(ref);
  try {
    fs.mkdirSync(path.dirname(RECEIPT_LEDGER_FILE), { recursive: true });
    fs.appendFileSync(
      RECEIPT_LEDGER_FILE,
      JSON.stringify({ ref: ref, at: new Date().toISOString() }) + "\n"
    );
  } catch (e) {
    console.error("[receipt] ledger write failed:", (e && e.message) || e);
  }
}

function receiptSecret() {
  return (
    loadServerConfigField("WALLET_RECHARGE_SECRET") || process.env.WALLET_RECHARGE_SECRET || ""
  );
}

async function verifyReportReceipt(receipt) {
  const price = PAY_PRODUCTS.bazi.price;
  if (!receipt || typeof receipt !== "object") return { ok: false, error: "PAYMENT_REQUIRED" };

  if (receipt.channel === "paypal") {
    const orderId = String(receipt.id || "");
    if (!/^[A-Za-z0-9-]{6,40}$/.test(orderId)) return { ok: false, error: "INVALID_RECEIPT" };
    const ref = "paypal:" + orderId;
    if (receiptAlreadyUsed(ref)) return { ok: false, error: "RECEIPT_USED" };
    let order;
    try {
      order = await PayPal.getOrder(orderId);
    } catch (e) {
      return { ok: false, error: "PAYMENT_LOOKUP_FAILED" };
    }
    if (!order || order.status !== "COMPLETED") return { ok: false, error: "PAYMENT_NOT_COMPLETED" };
    const unit = (order.purchase_units && order.purchase_units[0]) || {};
    const paid = parseFloat((unit.amount && unit.amount.value) || "0");
    if (!(paid >= price - 1e-9)) return { ok: false, error: "AMOUNT_MISMATCH" };
    markReceiptUsed(ref);
    return { ok: true, ref: ref };
  }

  if (receipt.channel === "wallet") {
    const txn = String(receipt.txn || "");
    const amount = String(receipt.amount || "");
    const ts = Number(receipt.ts || 0);
    const sig = String(receipt.sig || "").toLowerCase();
    if (!/^\d+$/.test(txn) || !sig) return { ok: false, error: "INVALID_RECEIPT" };
    const now = Math.floor(Date.now() / 1000);
    if (!ts || Math.abs(now - ts) > 86400) return { ok: false, error: "RECEIPT_EXPIRED" };
    const secret = receiptSecret();
    if (!secret) return { ok: false, error: "SERVER_NOT_CONFIGURED" };
    const expect = crypto
      .createHmac("sha256", secret)
      .update(["wallet", txn, amount, String(ts)].join("|"))
      .digest("hex");
    if (expect !== sig) return { ok: false, error: "BAD_RECEIPT" };
    if (!(parseFloat(amount) >= price - 1e-9)) return { ok: false, error: "AMOUNT_MISMATCH" };
    const ref = "wallet:" + txn;
    if (receiptAlreadyUsed(ref)) return { ok: false, error: "RECEIPT_USED" };
    markReceiptUsed(ref);
    return { ok: true, ref: ref };
  }

  return { ok: false, error: "INVALID_RECEIPT" };
}

/**
 * 邮件接口
 *   GET  /api/mail/status            → 是否已配置
 *   POST /api/mail/order  { to, locale, type:"paid"|"shipped", order:{...} }
 *   POST /api/mail/report { to, locale, name }
 *   POST /api/mail/test   { to, token }   ← 需要 ADMIN_REFUND_TOKEN
 *
 * 没配好发信通道时返回 202 { ok:false, reason:"NOT_CONFIGURED" }，
 * 客户端忽略即可，不影响下单/发货。
 */
function handleMailApi(req, res) {
  if (req.method === "GET") {
    return sendJson(res, 200, Mailer ? Mailer.describe() : { configured: false, provider: "", hint: "mailer 未加载" });
  }
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });

  readBody(req, async (err, raw) => {
    if (err) return sendJson(res, err.message === "too large" ? 413 : 400, { error: "Invalid request body" });

    let body;
    try {
      body = JSON.parse(raw || "{}");
    } catch {
      return sendJson(res, 400, { error: "Invalid JSON body" });
    }

    if (!checkRateLimit(req, "mail")) return sendJson(res, 429, { error: "Too many requests" });

    const to = String(body.to || "").trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return sendJson(res, 400, { error: "INVALID_EMAIL" });

    if (!Mailer) return sendJson(res, 202, { ok: false, reason: "NOT_AVAILABLE" });

    const locale = String(body.locale || "en");
    let tpl;
    if (body.type === "paid") tpl = Mailer.orderPaid({ locale, order: body.order || {} });
    else if (body.type === "shipped") tpl = Mailer.orderShipped({ locale, order: body.order || {} });
    else if (body.type === "refunded") tpl = Mailer.orderRefunded({ locale, order: body.order || {} });
    else if (body.type === "report") tpl = Mailer.reportReady({ locale, name: body.name || "" });
    else if (body.type === "test") {
      const expected = loadServerConfigField("ADMIN_REFUND_TOKEN") || process.env.ADMIN_REFUND_TOKEN || "";
      let okTok = false;
      try {
        const a = Buffer.from(String(body.token || ""));
        const b = Buffer.from(expected);
        okTok = expected && a.length === b.length && crypto.timingSafeEqual(a, b);
      } catch {
        okTok = false;
      }
      if (!okTok) return sendJson(res, 403, { error: "FORBIDDEN" });
      tpl = Mailer.testMail({ locale });
    } else {
      return sendJson(res, 400, { error: "UNKNOWN_TYPE" });
    }

    const result = await Mailer.send({ to, ...tpl });
    if (result.ok) return sendJson(res, 200, result);
    // 没配置或发送失败都不该让业务失败，统一 202 让调用方忽略
    console.error("[mail] not sent:", to, body.type, result.reason);
    return sendJson(res, 202, result);
  });
}

/**
 * POST /api/paypal/refund
 * body: { orderId, amount?, note?, token }
 *
 * 后台「退款」按钮用。管理员身份用一把只存在服务端的令牌校验
 * （ADMIN_REFUND_TOKEN，写在 server-config.json，不入库不外泄）——
 * 因为服务端拿不到用户 JWT 去查 is_admin()。
 *
 * 不传 amount 即全额退款；部分退款传 amount（字符串，如 "6.80"）。
 */
function handlePayPalRefund(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });

  readBody(req, async (err, raw) => {
    if (err) return sendJson(res, err.message === "too large" ? 413 : 400, { error: "Invalid request body" });

    let body;
    try {
      body = JSON.parse(raw || "{}");
    } catch {
      return sendJson(res, 400, { error: "Invalid JSON body" });
    }

    const expected = loadServerConfigField("ADMIN_REFUND_TOKEN") || process.env.ADMIN_REFUND_TOKEN || "";
    if (!expected) {
      return sendJson(res, 503, { error: "Refund is not configured (ADMIN_REFUND_TOKEN missing)" });
    }
    const given = String(body.token || "");
    let okTok = false;
    try {
      const a = Buffer.from(given);
      const b = Buffer.from(expected);
      okTok = a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch {
      okTok = false;
    }
    if (!okTok) return sendJson(res, 403, { error: "FORBIDDEN" });

    const orderId = String(body.orderId || "");
    if (!/^[A-Za-z0-9-]{6,40}$/.test(orderId)) return sendJson(res, 400, { error: "Invalid orderId" });

    if (!checkRateLimit(req, "default")) {
      return sendJson(res, 429, { error: "Too many requests" });
    }

    try {
      const order = await PayPal.getOrder(orderId);
      const cap = PayPal.extractCapture(order, "");
      if (!cap.captureId) return sendJson(res, 400, { error: "NO_CAPTURE", message: "该订单没有已完成的捕获记录" });
      if (cap.status !== "COMPLETED") {
        return sendJson(res, 400, { error: "NOT_REFUNDABLE", message: "捕获状态为 " + cap.status });
      }

      const want = body.amount ? String(body.amount) : "";
      const opts = want ? { amount: want, currency: body.currency || cap.currency } : null;
      const refund = await PayPal.refundCapture(cap.captureId, opts);

      console.error("[paypal] refund ok:", orderId, refund && refund.id, refund && refund.status);
      return sendJson(res, 200, {
        ok: true,
        orderId: orderId,
        captureId: cap.captureId,
        refundId: (refund && refund.id) || "",
        status: (refund && refund.status) || "",
        amount: (refund && refund.amount && refund.amount.value) || cap.amount,
        currency: (refund && refund.amount && refund.amount.currency_code) || cap.currency,
        full: !want,
      });
    } catch (e) {
      const msg = (e && e.message) || "refund failed";
      console.error("[paypal] refund failed:", orderId, msg);
      return sendJson(res, 502, { error: "REFUND_FAILED", message: msg });
    }
  });
}

function handleBaziApi(req, res) {
  if (req.method === "GET") {
    return handleBaziStatus(req, res);
  }
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  readBody(req, async (err, raw) => {
    if (err) {
      const tooLarge = err.message === "too large";
      return sendJson(res, tooLarge ? 413 : 400, {
        error: tooLarge ? "Request body too large" : "Invalid request body",
      });
    }

    let body;
    try {
      body = JSON.parse(raw || "{}");
    } catch {
      return sendJson(res, 400, { error: "Invalid JSON body" });
    }

    const errors = validateBody(body);
    if (errors.length > 0) {
      return sendJson(res, 400, { error: "Invalid fields: " + errors.join(", ") });
    }

    // 分级：有有效付款凭据 → 完整报告；没有（或凭据无效/已用过）→ 只给第①段综合运势
    // 免费档不会生成付费章节，成本可控；付费章节仍严格凭据放行。
    const receiptCheck = await verifyReportReceipt(body.receipt);
    const tier = receiptCheck.ok ? "full" : "free";

    if (!checkRateLimit(req, "bazi")) {
      return sendJson(res, 429, {
        error: "Too many requests. Please try again later. 请求过于频繁，请稍后再试。",
      });
    }

    if (!CHAT_CONFIGURED) {
      return sendJson(res, 500, { error: "Server is not configured yet" });
    }

    if (!BaziEngine) {
      return sendJson(res, 503, { error: "Reading service is temporarily unavailable" });
    }

    // 异步任务：网关约 60s 超时，而生成需 60-90s —— 立即返回 jobId，后台生成，前端轮询
    pruneJobs();
    const jobId = newJobId();
    _jobs.set(jobId, { kind: "bazi", status: "pending", tier, createdAt: Date.now() });
    generateReading(jobId, body, tier === "free");
    return sendJson(res, 200, { jobId, tier });
  });
}

/** GET /api/bazi?id=xxx — 查询异步生成任务状态。 */
function handleBaziStatus(req, res) {
  let id = "";
  try {
    const u = new URL(req.url, "http://localhost");
    id = u.searchParams.get("id") || "";
  } catch {
    id = "";
  }
  if (!id) return sendJson(res, 400, { error: "Missing job id" });
  pruneJobs();
  const job = _jobs.get(id);
  if (!job || job.kind !== "bazi") return sendJson(res, 404, { error: "Job not found or expired" });
  if (job.status === "pending") return sendJson(res, 200, { status: "pending" });
  if (job.status === "error") return sendJson(res, 200, { status: "error", error: job.error });
  return sendJson(res, 200, {
    status: "done",
    tier: job.tier || "full",
    report: job.report,
    chart: job.chart,
    engine: job.engine,
  });
}

/**
 * 统一生成文本（八字 / 塔罗 / 文王卦 / 紫微 共用）。
 *
 * ⚠️ 这里以前写死走豆包，换模型时只改了聊天路径，导致这四个功能全挂在欠费的豆包上。
 * 现在统一走 callChatModel 的候选链（主模型 → 备用模型），
 * 排队、降级、reasoning_effort 全部复用同一套逻辑。
 */
async function generateText(system, user) {
  const messages = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
  const msg = await callChatModel(messages, null, UPSTREAM_TIMEOUT_MS);
  const content = (msg && msg.content) || "";
  if (!content) throw new Error("empty completion");
  return content;
}

/**
 * 真太阳时校正 + 排盘（/api/bazi 与对话工具共用）。
 * 流程：出生地 → 经度/时区 → 校正钟表时间 → 用校正后的日期时间排盘。
 * 返回 { chart, chartBlock, trueSolar } —— chartBlock 已附带校正说明供 AI 解读。
 */
function chartWithTrueSolar(payload) {
  const ts = TrueSolar
    ? TrueSolar.correct({
        birthDate: payload.birthDate,
        birthTime: payload.birthTime,
        place: payload.place,
      })
    : { applied: false, reason: "module_missing" };

  let effective = payload;
  if (ts.applied) {
    effective = Object.assign({}, payload, { birthDate: ts.trueDate, birthTime: ts.trueTime });
  }

  const { chart, chartBlock } = BaziEngine.run(effective);

  // 神煞扩展（57 条）：附加层，失败不影响主流程
  let shenshaBlock = "";
  if (ShenshaExtended) {
    try {
      const fm = ShenshaExtended.detectFromChart(chart);
      if (fm && fm.total > 0) {
        chart.shenshaExtended = fm;
        shenshaBlock = "\n\n" + ShenshaExtended.toPromptBlock(fm);
      }
    } catch (e) {
      console.error("[shensha] extended detect FAILED:", (e && e.message) || e);
    }
  }

  let notice = "";
  if (ts.applied) {
    chart.trueSolar = ts;
    // 引擎在「有出生地且近时辰边界」时会加通用警告；校正已完成后该警告过时，替换为精确信息
    chart.warnings = (chart.warnings || []).filter((w) => w !== "校正后可能跨时辰");
    notice = "\n\n" + TrueSolar.toPromptBlock(ts);
  } else if (payload.place && ts.reason === "place_not_found") {
    chart.trueSolar = { applied: false, place: payload.place, reason: "place_not_found" };
    notice =
      "\n\n【出生地提示】用户填写的出生地「" +
      payload.place +
      "」未能识别，本次未做真太阳时校正。可温和提示用户填写「省份+城市」（如：辽宁省丹东市）或城市英文名。";
  } else if (payload.place && ts.reason === "no_time") {
    notice = "\n\n【出生地提示】用户只提供了时辰、未提供具体时刻，无法进行真太阳时校正（不影响排盘）。";
  }

  return { chart, chartBlock: chartBlock + notice + shenshaBlock, trueSolar: chart.trueSolar || null };
}

/** 后台生成八字解读，结果写入任务表供前端轮询。 */
async function generateReading(jobId, body, overviewOnly) {
  try {
    const { chart, chartBlock } = chartWithTrueSolar(body);
    const prompts = BaziEngine.buildPrompt(body, chartBlock, { overviewOnly: !!overviewOnly });
    const content = await generateText(prompts.system, prompts.user);

    _jobs.set(jobId, {
      kind: "bazi",
      status: "done",
      tier: overviewOnly ? "free" : "full",
      report: content,
      chart,
      engine: BaziEngine.ENGINE_INFO,
      createdAt: Date.now(),
    });
  } catch (e) {
    console.error("[bazi] job failed:", (e && e.message) || e);
    const queued =
      e && (e.code === "QUEUE_TIMEOUT"
        ? "现在同时排盘的人有点多，你的请求排太久没轮到。请过一会儿再试一次。\nToo many requests right now — please try again in a moment."
        : e.code === "QUEUE_FULL"
          ? "现在排队已满，请过几分钟再来。\nThe queue is full — please try again in a few minutes."
          : "");
    _jobs.set(jobId, {
      kind: "bazi",
      status: "error",
      error: queued || "Reading generation failed, please try again later",
      createdAt: Date.now(),
    });
  }
}

// ---------------------------------------------------------------------------
// 塔罗 API（/api/tarot）：抽牌由引擎即时完成（POST 即刻返回牌面），解读异步生成
// ---------------------------------------------------------------------------

function handleTarotApi(req, res) {
  if (req.method === "GET") {
    return handleTarotStatus(req, res);
  }
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  readBody(req, async (err, raw) => {
    if (err) {
      const tooLarge = err.message === "too large";
      return sendJson(res, tooLarge ? 413 : 400, {
        error: tooLarge ? "Request body too large" : "Invalid request body",
      });
    }

    let body;
    try {
      body = JSON.parse(raw || "{}");
    } catch {
      return sendJson(res, 400, { error: "Invalid JSON body" });
    }

    const errors = TarotEngine ? TarotEngine.validatePayload(body) : ["engine"];
    if (errors.length > 0) {
      return sendJson(res, 400, { error: "Invalid fields: " + errors.join(", ") });
    }

    if (!checkRateLimit(req)) {
      return sendJson(res, 429, {
        error: "Too many requests. Please try again later. 请求过于频繁，请稍后再试。",
      });
    }

    if (!CHAT_CONFIGURED) {
      return sendJson(res, 500, { error: "Server is not configured yet" });
    }

    if (!TarotEngine) {
      return sendJson(res, 503, { error: "Reading service is temporarily unavailable" });
    }

    let draw;
    try {
      draw = TarotEngine.drawCards({ spread: body.spread, question: body.question || "" });
    } catch (e) {
      return sendJson(res, 400, { error: "Invalid input: " + ((e && e.message) || e) });
    }

    // 抽牌已完成：立即把牌面返回给前端展示；解读在后台生成，前端轮询
    pruneJobs();
    const jobId = newJobId();
    _jobs.set(jobId, { kind: "tarot", status: "pending", draw, createdAt: Date.now() });
    generateTarotReading(jobId, body, draw);
    return sendJson(res, 200, { jobId, draw });
  });
}

/** GET /api/tarot?id=xxx — 查询塔罗解读生成状态。 */
function handleTarotStatus(req, res) {
  let id = "";
  try {
    const u = new URL(req.url, "http://localhost");
    id = u.searchParams.get("id") || "";
  } catch {
    id = "";
  }
  if (!id) return sendJson(res, 400, { error: "Missing job id" });
  pruneJobs();
  const job = _jobs.get(id);
  if (!job || job.kind !== "tarot") return sendJson(res, 404, { error: "Job not found or expired" });
  if (job.status === "pending") return sendJson(res, 200, { status: "pending", draw: job.draw });
  if (job.status === "error") {
    return sendJson(res, 200, { status: "error", error: job.error, draw: job.draw });
  }
  return sendJson(res, 200, { status: "done", reading: job.reading, draw: job.draw });
}

/** 后台生成塔罗解读（抽牌数据由引擎给定，AI 只解读）。 */
async function generateTarotReading(jobId, payload, draw) {
  try {
    const prompts = TarotEngine.buildTarotPrompt(payload, draw);
    const content = await generateText(prompts.system, prompts.user);
    _jobs.set(jobId, {
      kind: "tarot",
      status: "done",
      reading: content,
      draw,
      createdAt: Date.now(),
    });
  } catch (e) {
    console.error("[tarot] job failed:", (e && e.message) || e);
    _jobs.set(jobId, {
      kind: "tarot",
      status: "error",
      error: "Reading generation failed, please try again later",
      draw,
      createdAt: Date.now(),
    });
  }
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// 紫微斗数 API（/api/ziwei）
//   盘由引擎算（POST 即刻返回，前端立刻能画十二宫）
//   解读异步生成（GET ?id= 轮询），免费
// ---------------------------------------------------------------------------

/**
 * 出生地 → 经度 + 时区偏移（分钟）。
 * 用 TrueSolar 的城市库做匹配；匹配不到就按东八区 / 东经 120° 估算，
 * 并把 level 告诉前端（3 = 没匹配上），让解读里能说明误差。
 */
function resolvePlaceGeo(place, birthDate, birthTime) {
  const fallback = { longitude: 120, tzOffsetMin: 480, matched: "", matchedParent: "", level: 3 };
  if (!TrueSolar || !place) return fallback;
  try {
    const ts = TrueSolar.correct({
      birthDate: birthDate || "2000-01-01",
      birthTime: birthTime || "12:00",
      place,
    });
    if (ts && ts.applied && Number.isFinite(ts.longitude)) {
      return {
        longitude: ts.longitude,
        tzOffsetMin: Number.isFinite(ts.tzOffsetMin) ? ts.tzOffsetMin : 480,
        matched: ts.matched || "",
        matchedParent: ts.matchedParent || "",
        level: typeof ts.level === "number" ? ts.level : 2,
      };
    }
  } catch (e) {
    console.error("[ziwei] place resolve failed:", (e && e.message) || e);
  }
  return fallback;
}

function handleZiweiApi(req, res) {
  if (req.method === "GET") return handleZiweiStatus(req, res);
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });

  readBody(req, (err, raw) => {
    if (err) {
      const tooLarge = err.message === "too large";
      return sendJson(res, tooLarge ? 413 : 400, {
        error: tooLarge ? "Request body too large" : "Invalid request body",
      });
    }

    let body;
    try {
      body = JSON.parse(raw || "{}");
    } catch {
      return sendJson(res, 400, { error: "Invalid JSON body" });
    }

    if (!ZiweiEngine) {
      return sendJson(res, 503, { error: "Zi Wei engine is not available" });
    }

    const date = String(body.birthDate || "").slice(0, 10);
    const time = String(body.birthTime || "").slice(0, 5);
    if (!DATE_RE.test(date)) return sendJson(res, 400, { error: "INVALID_DATE" });
    if (!TIME_RE.test(time)) return sendJson(res, 400, { error: "INVALID_TIME" });

    const place = String(body.birthPlace || "").trim();
    if (!place) return sendJson(res, 400, { error: "PLACE_REQUIRED" });
    if (place.length > 60) return sendJson(res, 400, { error: "PLACE_TOO_LONG" });

    const genderRaw = String(body.gender || "male").toLowerCase();
    if (genderRaw !== "male" && genderRaw !== "female") {
      return sendJson(res, 400, { error: "INVALID_GENDER" });
    }

    if (!checkRateLimit(req, "ziwei")) {
      return sendJson(res, 429, {
        error: "Too many requests. Please try again later. 请求过于频繁，请稍后再试。",
      });
    }
    if (!CHAT_CONFIGURED) return sendJson(res, 500, { error: "Server is not configured yet" });

    const geo = resolvePlaceGeo(place, date, time);

    let chart;
    try {
      chart = ZiweiEngine.generateChart({
        date,
        time,
        gender: genderRaw,
        longitude: geo.longitude,
        utcOffset: geo.tzOffsetMin,
      });
    } catch (e) {
      return sendJson(res, 400, { error: "CHART_FAILED: " + ((e && e.message) || e) });
    }

    // 出生地没匹配上时给前端一个提醒（不阻断排盘）
    if (geo.level === 3) {
      chart.warnings = (chart.warnings || []).concat(["place_unmatched"]);
    }

    pruneJobs();
    const jobId = newJobId();
    _jobs.set(jobId, { kind: "ziwei", status: "pending", chart, createdAt: Date.now() });
    generateZiweiReading(jobId, chart, {
      locale: String(body.locale || "en"),
      gender: genderRaw,
    });

    return sendJson(res, 200, {
      jobId,
      chart,
      place: { matched: geo.matched, level: geo.level },
    });
  });
}

function handleZiweiStatus(req, res) {
  let id = "";
  try {
    const u = new URL(req.url, "http://localhost");
    id = u.searchParams.get("id") || "";
  } catch {
    id = "";
  }
  if (!id) return sendJson(res, 400, { error: "Missing job id" });
  pruneJobs();
  const job = _jobs.get(id);
  if (!job || job.kind !== "ziwei") return sendJson(res, 404, { error: "Job not found or expired" });

  if (job.status === "done") {
    return sendJson(res, 200, { status: "done", reading: job.reading, chart: job.chart });
  }
  if (job.status === "error") {
    return sendJson(res, 200, { status: "error", error: job.error, chart: job.chart });
  }
  return sendJson(res, 200, { status: "pending", chart: job.chart });
}

async function generateZiweiReading(jobId, chart, opts) {
  try {
    if (!ZiweiReading) throw new Error("reading module missing");
    const chartBlock = ZiweiEngine.renderText(chart);
    const prompts = ZiweiReading.buildPrompt({
      chartBlock,
      locale: opts.locale,
      gender: opts.gender === "female" ? "女 / female" : "男 / male",
    });
    const content = await generateText(prompts.system, prompts.user);
    _jobs.set(jobId, { kind: "ziwei", status: "done", reading: content, chart, createdAt: Date.now() });
  } catch (e) {
    console.error("[ziwei] job failed:", (e && e.message) || e);
    _jobs.set(jobId, {
      kind: "ziwei",
      status: "error",
      error: "Reading generation failed, please try again later",
      chart,
      createdAt: Date.now(),
    });
  }
}

// 文王卦 API（/api/bagua）：起卦由引擎即时完成（POST 即刻返回卦象），解读异步生成、免费
// ---------------------------------------------------------------------------

function handleBaguaApi(req, res) {
  if (req.method === "GET") {
    return handleBaguaStatus(req, res);
  }
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  readBody(req, async (err, raw) => {
    if (err) {
      const tooLarge = err.message === "too large";
      return sendJson(res, tooLarge ? 413 : 400, {
        error: tooLarge ? "Request body too large" : "Invalid request body",
      });
    }

    let body;
    try {
      body = JSON.parse(raw || "{}");
    } catch {
      return sendJson(res, 400, { error: "Invalid JSON body" });
    }

    const errors = BaguaEngine ? BaguaEngine.validatePayload(body) : ["engine"];
    if (errors.length > 0) {
      return sendJson(res, 400, { error: "Invalid fields: " + errors.join(", ") });
    }

    if (!checkRateLimit(req)) {
      return sendJson(res, 429, {
        error: "Too many requests. Please try again later. 请求过于频繁，请稍后再试。",
      });
    }

    if (!CHAT_CONFIGURED) {
      return sendJson(res, 500, { error: "Server is not configured yet" });
    }

    if (!BaguaEngine) {
      return sendJson(res, 503, { error: "Reading service is temporarily unavailable" });
    }

    let draw;
    try {
      draw = BaguaEngine.draw({ question: body.question || "", method: body.method });
    } catch (e) {
      return sendJson(res, 400, { error: "Invalid input: " + ((e && e.message) || e) });
    }

    // 起卦已完成：立即把卦象返回给前端展示；解读在后台生成，前端轮询
    pruneJobs();
    const jobId = newJobId();
    _jobs.set(jobId, { kind: "bagua", status: "pending", draw, createdAt: Date.now() });
    generateBaguaReading(jobId, body, draw);
    return sendJson(res, 200, { jobId, draw: BaguaEngine.extractDraw(draw) });
  });
}

/** GET /api/bagua?id=xxx — 查询文王卦解读生成状态。 */
function handleBaguaStatus(req, res) {
  let id = "";
  try {
    const u = new URL(req.url, "http://localhost");
    id = u.searchParams.get("id") || "";
  } catch {
    id = "";
  }
  if (!id) return sendJson(res, 400, { error: "Missing job id" });
  pruneJobs();
  const job = _jobs.get(id);
  if (!job || job.kind !== "bagua") return sendJson(res, 404, { error: "Job not found or expired" });
  const drawView = BaguaEngine ? BaguaEngine.extractDraw(job.draw) : job.draw;
  if (job.status === "pending") return sendJson(res, 200, { status: "pending", draw: drawView });
  if (job.status === "error") {
    return sendJson(res, 200, { status: "error", error: job.error, draw: drawView });
  }
  return sendJson(res, 200, { status: "done", reading: job.reading, draw: drawView });
}

/** 后台生成文王卦解读（卦象由引擎揲出，AI 只解读）。 */
async function generateBaguaReading(jobId, payload, draw) {
  try {
    const prompts = BaguaEngine.buildBaguaPrompt(payload, draw);
    const content = await generateText(prompts.system, prompts.user);
    _jobs.set(jobId, {
      kind: "bagua",
      status: "done",
      reading: content,
      draw,
      createdAt: Date.now(),
    });
  } catch (e) {
    console.error("[bagua] job failed:", (e && e.message) || e);
    _jobs.set(jobId, {
      kind: "bagua",
      status: "error",
      error: "Reading generation failed, please try again later",
      draw,
      createdAt: Date.now(),
    });
  }
}

// ---------------------------------------------------------------------------
// PayPal 支付 API（/api/paypal/*）：金额一律取服务端价格表，客户端金额不被信任
// ---------------------------------------------------------------------------

/** 余额充值可选档位（USD）。前端只能从这些档位里选，金额由服务端定价。 */
const WALLET_TIERS = [10, 20, 50, 100, 200];

/**
 * 充值入账签名：服务端在「PayPal 捕获成功且金额核对通过」后才签发，
 * 客户端拿它调数据库 RPC wallet_recharge 入账。密钥只存在于服务端与数据库函数体内，
 * 用户无法伪造 → 不能凭空给自己加钱。
 */
function walletRechargeSignature(uid, amountText, orderId, ts) {
  const secret =
    loadServerConfigField("WALLET_RECHARGE_SECRET") || process.env.WALLET_RECHARGE_SECRET || "";
  if (!secret) return null;
  const payload = [uid, amountText, orderId, String(ts)].join("|");
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/** 余额支付报价签名：HMAC(uid|product|amount|ts)，供数据库 wallet_spend_signed 验签。 */
function walletPaySignature(uid, product, amountText, ts) {
  const secret =
    loadServerConfigField("WALLET_RECHARGE_SECRET") || process.env.WALLET_RECHARGE_SECRET || "";
  if (!secret) return null;
  const payload = [uid, product, amountText, String(ts)].join("|");
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function resolvePayProduct(product) {
  if (product === "bazi") return PAY_PRODUCTS.bazi;
  if (typeof product === "string" && product.indexOf("wallet:") === 0) {
    const amt = parseFloat(product.slice(7));
    if (Number.isFinite(amt) && WALLET_TIERS.indexOf(amt) !== -1) {
      return { price: amt, name: `Wallet top-up $${amt} (余额充值)`, wallet: true };
    }
    return null;
  }
  if (typeof product === "string" && product.indexOf("shop:") === 0) {
    const id = product.slice(5);
    const p = SHOP_PRICES[id];
    if (p) return { price: p.price, name: p.nameEn };
  }
  return null;
}

function readPayBody(req, res, cb) {
  readBody(req, (err, raw) => {
    if (err) {
      return sendJson(res, err.message === "too large" ? 413 : 400, {
        error: err.message === "too large" ? "Request body too large" : "Invalid request body",
      });
    }
    let body;
    try {
      body = JSON.parse(raw || "{}");
    } catch {
      return sendJson(res, 400, { error: "Invalid JSON body" });
    }
    if (!PayPal || !PayPal.isConfigured()) {
      return sendJson(res, 503, { error: "Payment is not configured yet" });
    }
    if (!checkRateLimit(req)) {
      return sendJson(res, 429, { error: "Too many requests. Please try again later." });
    }
    cb(body);
  });
}

/** POST /api/paypal/create-order { product } — 服务端定价并创建 PayPal 订单。 */
function handlePayPalCreate(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  readPayBody(req, res, async (body) => {
    const product = typeof body.product === "string" ? body.product : "";
    const item = resolvePayProduct(product);
    if (!item) return sendJson(res, 400, { error: "Unknown product" });

    try {
      const order = await PayPal.createOrder({
        amount: item.price.toFixed(2),
        currency: "USD",
        description: item.name,
        custom: product,
      });
      return sendJson(res, 200, { id: order.id, product, amount: item.price, currency: "USD" });
    } catch (e) {
      console.error("[paypal] create failed:", (e && e.message) || e);
      return sendJson(res, 502, { error: "Failed to create payment order" });
    }
  });
}

/**
 * POST /api/wallet/quote { product, uid } — 余额支付报价。
 * 价格一律取服务端价格表，签发 HMAC 凭据后由数据库 RPC 验签扣款，
 * 客户端无法篡改金额（改了就验不过）。
 */
function handleWalletQuote(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  readBody(req, (err, raw) => {
    if (err) {
      return sendJson(res, err.message === "too large" ? 413 : 400, {
        error: err.message === "too large" ? "Request body too large" : "Invalid request body",
      });
    }
    if (!checkRateLimit(req)) {
      return sendJson(res, 429, { error: "Too many requests. Please try again later." });
    }
    let body = {};
    try {
      body = JSON.parse(raw || "{}");
    } catch {
      return sendJson(res, 400, { error: "Invalid JSON body" });
    }
    const product = typeof body.product === "string" ? body.product : "";
    const uid = typeof body.uid === "string" ? body.uid.trim().slice(0, 64) : "";
    if (!uid) return sendJson(res, 400, { error: "Missing uid" });

    const item = resolvePayProduct(product);
    // 充值商品不能用余额买余额
    if (!item || item.wallet) return sendJson(res, 400, { error: "Unknown product" });

    const ts = Math.floor(Date.now() / 1000);
    const amountText = item.price.toFixed(2);
    const sig = walletPaySignature(uid, product, amountText, ts);
    if (!sig) {
      console.error("[wallet] pay secret missing");
      return sendJson(res, 503, { error: "Balance payment is not configured" });
    }
    return sendJson(res, 200, {
      product,
      productName: item.name,
      amount: amountText,
      currency: "USD",
      uid,
      ts,
      sig,
    });
  });
}

/**
 * 捕获订单（带自动重试）。
 * - 网络抖动/临时故障：最多重试 3 次（递增间隔）
 * - ORDER_ALREADY_CAPTURED（重复捕获）：幂等处理——查回既有捕获结果当作成功
 */
async function captureWithRetry(orderId, attempts) {
  const max = attempts || 3;
  let lastErr = null;
  for (let i = 0; i < max; i++) {
    try {
      return await PayPal.captureOrder(orderId);
    } catch (e) {
      const msg = String((e && e.message) || "");
      if (msg.indexOf("ORDER_ALREADY_CAPTURED") !== -1) {
        // 已捕获过（重复请求/重试）→ 查回详情视为成功
        const q = await PayPal.getOrder(orderId);
        console.error("[paypal] already captured, fetched existing:", orderId);
        return q;
      }
      lastErr = e;
      if (i < max - 1) await new Promise((r) => setTimeout(r, 700 * (i + 1)));
    }
  }
  throw lastErr;
}

/** POST /api/paypal/capture-order { orderId } — 捕获订单并核验金额/状态。 */
function handlePayPalCapture(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  readPayBody(req, res, async (body) => {
    const orderId = typeof body.orderId === "string" ? body.orderId : "";
    const uid = typeof body.uid === "string" ? body.uid.trim().slice(0, 64) : "";
    if (!orderId || orderId.length > 64) return sendJson(res, 400, { error: "Missing order id" });

    try {
      const cap = await captureWithRetry(orderId);
      const info = PayPal.extractCapture(cap, "");
      const item = resolvePayProduct(info.product);
      const amountNum = parseFloat(info.amount || "0");
      const amountOk = item && Math.abs(amountNum - item.price) < 0.01;

      if (info.status !== "COMPLETED") {
        console.error("[paypal] capture not completed:", info.status, orderId);
        return sendJson(res, 200, { status: info.status || "UNKNOWN", orderId, product: info.product });
      }
      if (!amountOk) {
        // 金额与服务端价格不符：记录待人工核对（正常流程不会发生）
        console.error("[paypal] amount mismatch:", orderId, info.amount, "expected", item && item.price);
      }
      // 余额充值：捕获成功 + 金额核对通过 → 签发入账凭据（前端拿去调 wallet_recharge）
      let recharge = null;
      if (item && item.wallet) {
        if (!amountOk) {
          console.error("[paypal] wallet recharge amount mismatch:", orderId, info.amount, item.price);
        } else if (!uid) {
          return sendJson(res, 400, { error: "Missing uid for wallet recharge" });
        } else {
          const ts = Math.floor(Date.now() / 1000);
          const amountText = item.price.toFixed(2);
          const refId = info.paypalOrderId || orderId;
          const sig = walletRechargeSignature(uid, amountText, refId, ts);
          if (!sig) {
            console.error("[paypal] wallet recharge secret missing");
            return sendJson(res, 503, { error: "Wallet recharge is not configured" });
          }
          recharge = { uid, amount: amountText, orderId: refId, ts, sig };
        }
      }

      return sendJson(res, 200, {
        status: "COMPLETED",
        orderId: info.paypalOrderId,
        product: info.product,
        productName: item ? item.name : info.description,
        amount: info.amount,
        currency: info.currency,
        payerEmail: info.payerEmail,
        payerName: info.payerName,
        shipping: info.shipping,
        amountVerified: amountOk,
        recharge,
      });
    } catch (e) {
      console.error("[paypal] capture failed:", (e && e.message) || e);
      return sendJson(res, 502, { error: "Failed to capture payment" });
    }
  });
}

/** POST /api/paypal/webhook — PayPal 交易事件通知（付款/退款/争议实时推送）。
 *  验签（防伪造）→ 记录事件日志 → 200。事件日志供对账审计（GET /api/paypal/events）。 */
function handlePayPalWebhook(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  readBody(req, async (err, raw) => {
    if (err) return sendJson(res, 400, { error: "Invalid body" });
    let event = null;
    try {
      event = JSON.parse(raw || "{}");
    } catch {
      return sendJson(res, 400, { error: "Invalid JSON" });
    }
    const webhookId = loadServerConfigField("PAYPAL_WEBHOOK_ID") || process.env.PAYPAL_WEBHOOK_ID || "";
    const record = {
      at: new Date().toISOString(),
      type: (event && event.event_type) || "",
      verified: false,
      summary: summarizePayPalEvent(event),
    };
    // 验签（配置了 webhook_id 时必验；验证失败仍记录，但标记 unverified）
    if (PayPal && webhookId) {
      try {
        record.verified = await PayPal.verifyWebhookSignature(req.headers, event, webhookId);
      } catch (e) {
        record.verifyError = String((e && e.message) || e).slice(0, 200);
      }
    } else {
      record.verifyError = "webhook_id_not_configured";
    }
    appendPayPalEvent(record);
    console.error("[paypal-webhook]", record.type, "verified=" + record.verified, JSON.stringify(record.summary));
    return sendJson(res, 200, { ok: true });
  });
}

/** GET /api/paypal/events?token=xxx — 读取最近事件（对账用，token 保护）。 */
function handlePayPalEvents(req, res) {
  let token = "";
  let limit = 50;
  try {
    const u = new URL(req.url, "http://localhost");
    token = u.searchParams.get("token") || "";
    limit = Math.min(parseInt(u.searchParams.get("limit") || "50", 10) || 50, 500);
  } catch { /* noop */ }
  const expected = loadServerConfigField("PAYPAL_EVENTS_TOKEN") || process.env.PAYPAL_EVENTS_TOKEN || "";
  if (!expected || token !== expected) return sendJson(res, 403, { error: "Forbidden" });
  const events = readPayPalEvents(limit);
  return sendJson(res, 200, { count: events.length, events });
}

// ---------------------------------------------------------------------------
// 玄学对话 API（/api/chat）：多轮对话 + 自动调用 bazi / tarot / bagua skill
//
// 流程（与 bazi/tarot 相同的异步任务模式，承接网关 ~60s 超时）：
//   POST /api/chat  { messages:[{role,content}], locale, id? }
//     → 立即返回 { jobId }
//     → 后台：调豆包（带 tools）→ 若返回 tool_calls 则由引擎计算 → 结果回传 → 模型解读
//   GET /api/chat?id=xxx → { status, reply, tool?, messages }
// ---------------------------------------------------------------------------

const CHAT_MAX_MESSAGES = 24; // 保留的对话轮次上限（含 system 之外）
const CHAT_MAX_CHARS = 4000; // 单条消息字符上限
const CHAT_MAX_STEPS = 3; // 工具调用循环上限，防止死循环

function validateChatBody(body) {
  const errors = [];
  const messages = body && body.messages;
  const locale = body && body.locale;
  if (!Array.isArray(messages) || messages.length === 0) errors.push("messages");
  if (messages && messages.length > CHAT_MAX_MESSAGES) errors.push("messages(too many)");
  if (locale && LOCALES.indexOf(locale) === -1) errors.push("locale");
  if (Array.isArray(messages)) {
    for (const m of messages) {
      if (!m || (m.role !== "user" && m.role !== "assistant")) {
        errors.push("messages(role)");
        break;
      }
      if (typeof m.content !== "string" || m.content.length === 0 || m.content.length > CHAT_MAX_CHARS) {
        errors.push("messages(content)");
        break;
      }
    }
  }
  return errors;
}

function handleChatApi(req, res) {
  if (req.method === "GET") {
    return handleChatStatus(req, res);
  }
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  readBody(req, async (err, raw) => {
    if (err) {
      const tooLarge = err.message === "too large";
      return sendJson(res, tooLarge ? 413 : 400, {
        error: tooLarge ? "Request body too large" : "Invalid request body",
      });
    }

    let body;
    try {
      body = JSON.parse(raw || "{}");
    } catch {
      return sendJson(res, 400, { error: "Invalid JSON body" });
    }

    const errors = validateChatBody(body);
    if (errors.length > 0) {
      return sendJson(res, 400, { error: "Invalid fields: " + errors.join(", ") });
    }

    if (!checkRateLimit(req)) {
      return sendJson(res, 429, {
        error: "Too many requests. Please try again later. 请求过于频繁，请稍后再试。",
      });
    }

    if (!CHAT_CONFIGURED) {
      return sendJson(res, 500, { error: "Server is not configured yet" });
    }

    if (!SkillKnowledge || !BaziEngine || !TarotEngine) {
      return sendJson(res, 503, { error: "Assistant is temporarily unavailable" });
    }

    pruneJobs();
    const jobId = newJobId();
    _jobs.set(jobId, { kind: "chat", status: "pending", createdAt: Date.now() });
    runChat(jobId, body);
    return sendJson(res, 200, { jobId });
  });
}

/** GET /api/chat?id=xxx — 查询对话生成状态。 */
function handleChatStatus(req, res) {
  let id = "";
  try {
    const u = new URL(req.url, "http://localhost");
    id = u.searchParams.get("id") || "";
  } catch {
    id = "";
  }
  if (!id) return sendJson(res, 400, { error: "Missing job id" });
  pruneJobs();
  const job = _jobs.get(id);
  if (!job || job.kind !== "chat") return sendJson(res, 404, { error: "Job not found or expired" });
  if (job.status === "pending") return sendJson(res, 200, { status: "pending" });
  if (job.status === "error") return sendJson(res, 200, { status: "error", error: job.error });
  return sendJson(res, 200, {
    status: "done",
    reply: job.reply,
    tool: job.tool || null,
    artifacts: job.artifacts || null,
  });
}

/**
 * 调用对话模型，返回完整 message（含 tool_calls）。
 * 走 CHAT 里配置的 provider（glm / 任意 OpenAI 兼容平台）。
 */
async function callModelOnce(cfg, messages, tools, timeoutMs) {
  const payload = {
    model: cfg.model,
    messages,
    temperature: 0.7,
    max_tokens: 4000,
  };
  // 只在配置了才带（老模型不认这个字段，带了会 400）
  if (CHAT_REASONING_EFFORT) payload.reasoning_effort = CHAT_REASONING_EFFORT;
  if (tools && tools.length) payload.tools = tools;

  const upstream = await httpsPostJson(
    cfg.endpoint,
    { Authorization: "Bearer " + cfg.apiKey },
    payload,
    timeoutMs
  );

  if (upstream.status < 200 || upstream.status >= 300) {
    const err = new Error("upstream error " + upstream.status + " " + String(upstream.text).slice(0, 300));
    err.status = upstream.status;
    throw err;
  }

  const data = JSON.parse(upstream.text);
  const msg = data.choices && data.choices[0] && data.choices[0].message;
  if (!msg) throw new Error("empty completion");
  // 成功调用：累计 tokens（没有 usage 字段的老平台记 0，只记次数）
  recordModelUsage(cfg.model, data.usage || null, true);
  return msg;
}

/**
 * 调用对话模型。
 *
 * GLM 免费档只有 1 个并发：两个人同时聊天，第二个会拿到 429。
 * 所以当主通道（glm）失败且配了豆包 key 时，自动回退一次豆包，
 * 让用户拿到答案而不是错误页。
 */
async function callChatModel(messages, tools, timeoutMs) {
  // 候选链：主模型 → 备用模型（同一平台）→ 豆包（若还配着）
  const chain = [{ ...CHAT }];
  for (const m of CHAT_FALLBACK_MODELS) {
    if (m && m !== CHAT.model) chain.push({ ...CHAT, model: m });
  }

  let lastErr = null;
  for (let i = 0; i < chain.length; i++) {
    const cfg = chain[i];
    const invoke = () => callModelOnce(cfg, messages, tools, timeoutMs);
    try {
      return MODEL_QUEUE ? await MODEL_QUEUE.run(invoke) : await invoke();
    } catch (e) {
      // 排队满 / 排队超时：直接抛出去，让上层给出「人太多」的提示
      if (e && (e.code === "QUEUE_FULL" || e.code === "QUEUE_TIMEOUT")) throw e;
      // 模型本身失败（限流/超时/欠费）：计入该模型的失败次数
      recordModelUsage(cfg.model, null, false);
      lastErr = e;
      const more = i + 1 < chain.length;
      console.warn(
        "[chat] " + (cfg.model || cfg.provider) + " 失败" + (more ? "，降级下一个：" : "：") +
          String(e && e.message).slice(0, 100)
      );
    }
  }
  throw lastErr || new Error("no chat model available");
}

/**
 * 执行一次工具调用（本地确定性引擎，不消耗 LLM）。
 * 返回 { content, artifact } —— content 回传给模型，artifact 供前端渲染卡片。
 */
function executeToolCall(name, argsRaw) {
  let args = {};
  try {
    args = JSON.parse(argsRaw || "{}");
  } catch {
    return { content: "错误：工具参数不是合法 JSON。", artifact: null };
  }

  // 八字是付费功能：对话接口已不再提供 bazi_chart。
  // 即便老版本前端或伪造请求送上来，也在这里直接挡掉，杜绝绕过付费墙。
  if (name === "bazi_chart") {
    return {
      content:
        "八字排盘是付费功能，对话里无法排盘。请到站内「八字测算」页下单后获取完整命书；想先聊聊可以用紫微、塔罗或起卦。",
      artifact: null,
    };
  }

  if (name === "tarot_draw") {
    const spread = TarotEngine.SPREAD_KEYS.indexOf(args.spread) !== -1 ? args.spread : "three";
    const question = typeof args.question === "string" ? args.question.slice(0, 200) : "";
    try {
      const draw = TarotEngine.drawCards({ spread, question });
      const ext = TarotEngine.extractDraw(draw);
      const lines = draw.cards
        .map(
          (c, i) =>
            i +
            1 +
            ". " +
            c.position +
            "：" +
            c.card +
            " (" +
            c.cardEn +
            ") — " +
            c.orientation +
            "（" +
            c.element +
            "元素" +
            (c.isMajor ? "，大阿卡纳" : "") +
            "）"
        )
        .join("\n");
      return {
        content:
          "【塔罗抽牌结果 — 密码学安全随机源抽出，为既定事实，请据此解读】\n" +
          "牌阵：" +
          draw.spreadName +
          "（" +
          draw.spread +
          "）\nseed：" +
          draw.seed +
          "｜时段因子：" +
          draw.timeFactor +
          "\n" +
          lines,
        artifact: { type: "tarot", draw: ext },
      };
    } catch (e) {
      return { content: "抽牌失败：" + ((e && e.message) || e), artifact: null };
    }
  }

  if (name === "bagua_draw") {
    const question = typeof args.question === "string" ? args.question.slice(0, 200) : "";
    const method = ["coin", "yarrow"].indexOf(args.method) !== -1 ? args.method : "coin";
    try {
      const draw = BaguaEngine.draw({ question, method });
      const ext = BaguaEngine.extractDraw(draw);
      const lineStr = draw.lines
        .map((l) => {
          const vname = { 9: "老阳○", 7: "少阳", 8: "少阴", 6: "老阴×" }[l.value];
          const how =
            draw.method === "yarrow"
              ? "蓍草 " + l.stalks.join("→") + "，得 " + l.value
              : l.coins.join("") + " → " + vname;
          return "第" + l.pos + "爻：" + how + (l.moving ? "（动）" : "");
        })
        .join("\n");
      const parts = [
        "【文王卦起卦结果 — " + (draw.method === "yarrow" ? "大衍筮法（五十蓍草）" : "金钱卦（三枚铜钱）") + "真实揲出，为既定事实，请据此解读】",
        "起卦方式：" + (draw.method === "yarrow" ? "大衍筮法（五十蓍草，三变一爻）" : "金钱卦（三枚铜钱掷六次）") + "（自下而上）",
        lineStr,
        "",
        "本卦：" + draw.ben.n + ". " + draw.ben.full + "（" + draw.ben.name + "，上" + draw.ben.up + "下" + draw.ben.lo + "）",
        "卦辞：" + draw.ben.gua,
        "大象：" + draw.ben.xiang,
      ];
      if (draw.movingYao.length > 0) {
        parts.push("", "动爻爻辞：");
        for (const y of draw.movingYao) parts.push("- " + y.title + "：" + y.text);
      } else {
        parts.push("", "（无动爻，以卦辞断）");
      }
      if (draw.oddUse) parts.push("用九/用六：" + draw.oddUse.title + "：" + draw.oddUse.text);
      if (draw.bian) {
        parts.push(
          "",
          "变卦：" + draw.bian.n + ". " + draw.bian.full + "（" + draw.bian.name + "）",
          "变卦卦辞：" + draw.bian.gua
        );
      }
      return {
        content: parts.join("\n"),
        artifact: { type: "bagua", draw: ext },
      };
    } catch (e) {
      return { content: "起卦失败：" + ((e && e.message) || e), artifact: null };
    }
  }

  if (name === "ziwei_chart") {
    if (!ZiweiEngine) return { content: "紫微引擎未加载，排盘不可用。", artifact: null };

    const date = String(args.birthDate || "").slice(0, 10);
    if (!DATE_RE.test(date)) {
      return {
        content: "排盘失败：缺少有效的阳历生日（格式 YYYY-MM-DD）。请向用户询问出生日期。",
        artifact: null,
      };
    }

    const genderMap2 = { male: "male", female: "female", 男: "male", 女: "female" };
    const gender =
      genderMap2[args.gender] || (String(args.gender || "").indexOf("fe") === 0 ? "female" : "male");

    const time =
      args.birthTime && TIME_RE.test(String(args.birthTime)) ? String(args.birthTime) : null;

    const lng = Number(args.longitude);
    const off = Number(args.utcOffset);

    try {
      const chart = ZiweiEngine.generateChart({
        date,
        time: time || undefined,
        gender,
        longitude: isFinite(lng) && lng !== 0 ? lng : undefined,
        utcOffset: isFinite(off) && off !== 0 ? off : 480,
      });
      const text = ZiweiEngine.renderText(chart);
      return {
        content:
          "【紫微斗数命盘 — 由确定性引擎计算，为既定事实，请原样采信并据此解读】\n" +
          text +
          "\n（解读时请区分命宫/身宫、主星庙旺落陷、四化落宫、当前大限；不确定处如实说明。）",
        artifact: null,
      };
    } catch (e) {
      return {
        content:
          "排盘失败：" + ((e && e.message) || e) + "。请检查出生日期/时间是否有效，必要时向用户确认。",
        artifact: null,
      };
    }
  }

  return { content: "未知工具：" + name, artifact: null };
}

/** 时辰地支 → 该时辰中点时间（用户只说「午时」时的兜底）。 */
function shichenToTime(shichen) {
  const idx = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"].indexOf(
    String(shichen || "").trim()
  );
  if (idx === -1) return "";
  // 子时 23:00 起，每个时辰 2 小时；取中点
  const startHour = idx === 0 ? 23 : idx * 2 - 1;
  const mid = (startHour + 1) % 24;
  return String(mid).padStart(2, "0") + ":00";
}

/** 后台执行多轮对话（含工具调用循环），结果写入任务表。 */
async function runChat(jobId, body) {
  try {
    const locale = body.locale || "en";
    const system = SkillKnowledge.buildAssistantSystem(locale, sanitizeCustomSkills(body.skills), body.facts);
    const tools = SkillKnowledge.toolDefinitions();

    // 只保留最近的若干轮，避免上下文过长 / 费用失控
    const history = body.messages.slice(-CHAT_MAX_MESSAGES);
    const messages = [{ role: "system", content: system }].concat(
      history.map((m) => ({ role: m.role, content: String(m.content) }))
    );

    let artifacts = [];
    let usedTools = [];
    let reply = "";

    for (let step = 0; step < CHAT_MAX_STEPS; step++) {
      const msg = await callChatModel(messages, tools, UPSTREAM_TIMEOUT_MS);
      const toolCalls = msg.tool_calls || [];

      if (!toolCalls.length) {
        reply = msg.content || "";
        break;
      }

      // 把助手发起的工具调用追加进历史
      messages.push({
        role: "assistant",
        content: msg.content || "",
        tool_calls: toolCalls.map((tc) => ({
          id: tc.id,
          type: "function",
          function: { name: tc.function.name, arguments: tc.function.arguments },
        })),
      });

      // 依次执行工具，回填结果
      let producedArtifact = false;
      for (const tc of toolCalls) {
        const name = tc.function && tc.function.name;
        const result = executeToolCall(name, tc.function && tc.function.arguments);
        usedTools.push(name);
        if (result.artifact) {
          artifacts.push(result.artifact);
          producedArtifact = true;
        }
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: result.content,
        });
      }

      // 工具已产生可渲染卡片时，不再继续追加调用，直接进入解读轮
      if (step === CHAT_MAX_STEPS - 1) {
        reply = producedArtifact
          ? "（已为你完成计算，请查看下方结果卡片。）"
          : "抱歉，我暂时没能完成这次解读，请再试一次。";
      }
    }

    if (!reply) reply = "（没有生成内容，请再试一次。）";

    _jobs.set(jobId, {
      kind: "chat",
      status: "done",
      reply,
      tool: usedTools.length ? usedTools[usedTools.length - 1] : null,
      artifacts: artifacts.length ? artifacts : null,
      createdAt: Date.now(),
    });
  } catch (e) {
    console.error("[chat] job failed:", (e && e.message) || e);
    // 排队相关错误单独给一句人话，别让用户以为是网站坏了
    const queued =
      e && (e.code === "QUEUE_TIMEOUT"
        ? "现在同时用的人有点多，你的请求排太久没轮到。请过一会儿再试一次。\nToo many requests right now — please try again in a moment."
        : e.code === "QUEUE_FULL"
          ? "现在排队的人已满，请过几分钟再来。\nThe queue is full — please try again in a few minutes."
          : "");
    _jobs.set(jobId, {
      kind: "chat",
      status: "error",
      error: queued || "Assistant is busy, please try again later",
      createdAt: Date.now(),
    });
  }
}

// ---------------------------------------------------------------------------
// 静态服务
// ---------------------------------------------------------------------------

function safeJoin(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  } catch {
    return null;
  }
  const p = path.normalize(path.join(ROOT, decoded));
  if (!p.startsWith(ROOT)) return null;
  return p;
}

function isFile(p) {
  try {
    return fs.statSync(p).isFile() ? p : null;
  } catch {
    return null;
  }
}

const server = http.createServer((req, res) => {
  const urlPath = req.url || "/";
  const clean = urlPath.split("?")[0].split("#")[0];

  if (clean === "/api/bazi") {
    return handleBaziApi(req, res);
  }

  if (clean === "/api/tarot") {
    return handleTarotApi(req, res);
  }

  if (clean === "/api/ziwei") {
    return handleZiweiApi(req, res);
  }
  if (clean === "/api/bagua") {
    return handleBaguaApi(req, res);
  }

  if (clean === "/api/paypal/config") {
    return sendJson(res, 200, PayPal ? PayPal.publicConfig() : { configured: false });
  }
  if (clean === "/api/wallet/quote") {
    return handleWalletQuote(req, res);
  }
  if (clean === "/api/paypal/create-order") {
    return handlePayPalCreate(req, res);
  }
  if (clean === "/api/paypal/capture-order") {
    return handlePayPalCapture(req, res);
  }
  if (clean === "/api/paypal/webhook") {
    return handlePayPalWebhook(req, res);
  }
  if (clean === "/api/paypal/events") {
    return handlePayPalEvents(req, res);
  }
  if (clean === "/api/paypal/refund") {
    return handlePayPalRefund(req, res);
  }
  // 健康检查：用来判断「服务是不是刚重启 / 冷启动」
  if (clean === "/api/health") {
    const up = Math.round(process.uptime());
    return sendJson(res, 200, {
      ok: true,
      uptimeSec: up,
      startedAt: new Date(Date.now() - up * 1000).toISOString(),
      pid: process.pid,
      node: process.version,
      mail: Mailer ? Mailer.isConfigured() : false,
      ziwei: !!ZiweiEngine,
      // 当前对话模型通道（切换 provider 后可直接看这里确认）
      chat: { provider: CHAT.provider, model: CHAT.model, configured: CHAT_CONFIGURED },
      modelQueue: MODEL_QUEUE ? MODEL_QUEUE.stats() : null,
      // 对话模型用量：today 是当天，models 是各模型历史累计（tokens 口径 = 上游 usage 字段）
      usage: usageSummary(),
    });
  }

  if (clean === "/api/mail/status" || clean === "/api/mail/order" || clean === "/api/mail/report" || clean === "/api/mail/test") {
    return handleMailApi(req, res);
  }

  if (clean === "/api/chat") {
    // 小痕下线：一律 503 维护提示，请求不进豆包、不落库
    if (!CAT_STATUS.online) {
      return sendJson(res, 503, {
        error: "cat_offline",
        code: "CAT_OFFLINE",
        message: CAT_STATUS.notice || "小痕正在打盹，暂时不在线。",
      });
    }
    return handleChatApi(req, res);
  }

  // 访客 IP：埋点由浏览器写库，客户端拿不到自己的公网 IP，
  // 由服务端读 X-Forwarded-For 回给前端（不经过任何第三方接口）
  // 诊断用：把这个请求里所有跟来源有关的头原样吐出来，判断真实 IP 是否可得
  if (clean === "/api/ip-debug") {
    const h = req.headers || {};
    const picked = pickClientIp(req);
    return sendJson(res, 200, {
      picked: picked.ip,
      chain: picked.chain,
      socketRemote: (req.socket && req.socket.remoteAddress) || null,
      headers: {
        "x-forwarded-for": h["x-forwarded-for"] || null,
        "x-real-ip": h["x-real-ip"] || null,
        "cf-connecting-ip": h["cf-connecting-ip"] || null,
        "true-client-ip": h["true-client-ip"] || null,
        forwarded: h["forwarded"] || null,
        via: h["via"] || null,
        "x-forwarded-proto": h["x-forwarded-proto"] || null,
        "x-forwarded-host": h["x-forwarded-host"] || null,
        "cf-ipcountry": h["cf-ipcountry"] || null,
      },
      ua: h["user-agent"] || null,
      at: new Date().toISOString(),
    });
  }

  if (clean === "/api/ip") {
    const picked = pickClientIp(req);
    const ip = picked.ip;
    lookupGeo(ip)
      .then((geo) => sendJson(res, 200, { ip, ipChain: picked.chain, ua: req.headers["user-agent"] || "", geo }))
      .catch(() => sendJson(res, 200, { ip, ipChain: picked.chain, ua: req.headers["user-agent"] || "", geo: null }));
    return;
  }

  // 默认语言（英文）：HTTP 级重定向到 /en。
  // 静态导出的 index.html 只含前端 JS 跳转（无 JS 环境/爬虫不可靠），此处直接 302。
  if (clean === "/" || clean === "/index.html") {
    res.writeHead(302, { Location: "/en", ...securityHeaders() });
    return res.end();
  }
  if (clean === "/links") {
    res.writeHead(302, { Location: "/en/links", ...securityHeaders() });
    return res.end();
  }

  const target = safeJoin(urlPath);
  if (!target) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8", ...securityHeaders() });
    return res.end("Bad request");
  }

  const bare = clean.replace(/\/+$/, "");

  const file =
    isFile(target) ||
    isFile(target + ".html") ||
    isFile(path.join(target, "index.html")) ||
    (bare ? isFile(path.join(ROOT, bare + ".html")) : null) ||
    (bare ? isFile(path.join(ROOT, bare, "index.html")) : null);

  if (!file) {
    const notFound = isFile(path.join(ROOT, "404.html"));
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8", ...securityHeaders() });
    return res.end(notFound ? fs.readFileSync(notFound) : "Not found");
  }

  const ext = path.extname(file).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  const immutable = clean.startsWith("/_next/") || clean.startsWith("/assets");
  const isVideo = ext === ".mp4" || ext === ".webm";

  // Video files: support HTTP Range requests (required for seeking and
  // progressive playback in Safari / Chrome) with long-lived caching.
  if (isVideo) {
    const fileSize = fs.statSync(file).size;
    const rangeHeader = req.headers.range;
    if (rangeHeader) {
      const m = /^bytes=(\d*)-(\d*)$/.exec(String(rangeHeader).trim());
      let start = 0;
      let end = fileSize - 1;
      if (m) {
        if (m[1] === "" && m[2] !== "") {
          start = Math.max(0, fileSize - parseInt(m[2], 10)); // suffix range
        } else {
          start = m[1] ? parseInt(m[1], 10) : 0;
          if (m[2]) end = Math.min(parseInt(m[2], 10), fileSize - 1);
        }
      }
      if (start > end || start >= fileSize) {
        res.writeHead(416, {
          "Content-Range": "bytes */" + fileSize,
          ...securityHeaders(),
        });
        return res.end();
      }
      res.writeHead(206, {
        "Content-Type": type,
        "Content-Range": "bytes " + start + "-" + end + "/" + fileSize,
        "Accept-Ranges": "bytes",
        "Content-Length": end - start + 1,
        "Cache-Control": "public, max-age=604800",
        ...securityHeaders(),
      });
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, {
      "Content-Type": type,
      "Content-Length": fileSize,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=604800",
      ...securityHeaders(),
    });
    return fs.createReadStream(file).pipe(res);
  }

  const langTag = type.startsWith("text/html") ? contentLanguageFor(clean) : null;
  res.writeHead(200, {
    "Content-Type": type,
    ...(langTag ? { "Content-Language": langTag } : {}),
    "Cache-Control": immutable
      ? "public, max-age=31536000, immutable"
      : "no-cache",
    ...securityHeaders(),
  });
  fs.createReadStream(file).pipe(res);
});

server.on("error", (e) => {
  console.error("[boot] server error:", (e && e.stack) || e);
});

server.listen(PORT, "0.0.0.0", () => {
  console.error(
    "[boot] listening on 0.0.0.0:" + PORT + " chatProvider=" + CHAT.provider + " bazi=" + (BaziEngine ? "ok" : "missing") + " tarot=" + (TarotEngine ? "ok" : "missing") + " chat=" + (SkillKnowledge ? "ok" : "missing") + " truesolar=" + (TrueSolar ? "ok" : "missing") + " shensha=" + (ShenshaExtended ? "ok" : "missing")
  );
  console.log(`Traces server listening on 0.0.0.0:${PORT} (chat: ${CHAT.provider} / ${CHAT.model})`);
});
