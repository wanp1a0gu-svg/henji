/**
 * MingLi CLUB — API Worker（Cloudflare）。
 *
 * 路由：
 *   POST /api/tarot  塔罗：引擎即时抽牌 + 豆包只解读（同步返回 { reading, draw }）
 *   其他 POST        八字：引擎排盘 + 豆包只解读（同步返回 { report, chart }）
 *
 * 「AI 不运算、只解读」：四柱/抽牌由 lib/bazi-engine.js、lib/tarot-engine.js
 * 精确计算后交给 LLM 解读。两个引擎均与本地 Python 原版全量对拍一致。
 *
 * 防护：Per-IP 限流（KV，未绑定则跳过）、CORS 白名单、严格输入校验、
 * 豆包 Key 只读加密 secret。
 *
 * 注意：本文件由 wrangler 打包部署（import 会被 esbuild 内联）。
 * 主站同源 API 在 server.js（异步任务模式）；本 Worker 是海外兜底通道（同步模式）。
 */
import BaziEngine from "../lib/bazi-engine.js";
import TarotEngine from "../lib/tarot-engine.js";

const DOUBAO_MODEL = "ep-m-20260408172909-vsfqd";
const DOUBAO_ENDPOINT = "https://ark.cn-beijing.volces.com/api/v3/chat/completions";

const ALLOWED_ORIGINS = [
  "https://mingli-club.app.workbuddy.host",
  "https://mingli-club.pages.dev",
  "http://localhost:3000",
];

const RATE_LIMIT_PER_HOUR = 10;

const FOCUS_VALUES = ["general", "career", "love", "wealth", "health"];
const LOCALES = ["en", "zh", "ja", "ko", "es", "fr", "de", "pt", "ru", "ar"];
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^\d{2}:\d{2}$/;

function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  const headers = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function json(data, status, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(request) },
  });
}

function validateBaziBody(body) {
  const errors = [];
  const name = body && body.name;
  const birthDate = body && body.birthDate;
  const birthTime = body && body.birthTime;
  const gender = body && body.gender;
  const focus = body && body.focus;
  const locale = body && body.locale;

  if (!birthDate || !DATE_RE.test(String(birthDate))) errors.push("birthDate");
  if (!gender || !["male", "female"].includes(gender)) errors.push("gender");
  if (birthTime && !TIME_RE.test(String(birthTime))) errors.push("birthTime");
  if (name && String(name).length > 50) errors.push("name");
  if (focus && !FOCUS_VALUES.includes(focus)) errors.push("focus");
  if (locale && !LOCALES.includes(locale)) errors.push("locale");

  if (birthDate && DATE_RE.test(String(birthDate))) {
    const year = parseInt(String(birthDate).slice(0, 4), 10);
    if (year < 1900 || year > 2100) errors.push("birthDate");
  }
  return errors;
}

async function checkRateLimit(env, ip) {
  if (!env.RATE_LIMIT) return { ok: true }; // KV binding not provisioned yet
  const bucket = Math.floor(Date.now() / 3600000);
  const key = `rl:${ip}:${bucket}`;
  try {
    const current = parseInt((await env.RATE_LIMIT.get(key)) || "0", 10);
    if (current >= RATE_LIMIT_PER_HOUR) return { ok: false };
    await env.RATE_LIMIT.put(key, String(current + 1), { expirationTtl: 7200 });
    return { ok: true };
  } catch (err) {
    console.error("[rate-limit] KV error:", err && err.message);
    return { ok: true };
  }
}

/** 调用豆包生成文本（bazi / tarot 共用）。 */
async function callDoubao(env, system, user) {
  const apiKey = env.DOUBAO_API_KEY;
  if (!apiKey) throw new Error("no-api-key");

  const response = await fetch(DOUBAO_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.DOUBAO_MODEL || DOUBAO_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error("upstream " + response.status + " " + errorText.slice(0, 200));
  }
  const data = await response.json();
  const content =
    (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
  if (!content) throw new Error("empty completion");
  return content;
}

async function guard(env, request) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const rate = await checkRateLimit(env, ip);
  if (!rate.ok) {
    return {
      error: json(
        { error: "Too many requests. Please try again later. 请求过于频繁，请稍后再试。" },
        429,
        request
      ),
    };
  }
  if (!env.DOUBAO_API_KEY) {
    return { error: json({ error: "Server is not configured yet" }, 500, request) };
  }
  return { ip };
}

/** 八字（同步模式：引擎排盘 + 豆包解读） */
async function handleBazi(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400, request);
  }

  const errors = validateBaziBody(body);
  if (errors.length > 0) {
    return json({ error: `Invalid fields: ${errors.join(", ")}` }, 400, request);
  }

  const g = await guard(env, request);
  if (g.error) return g.error;

  try {
    const { chart, chartBlock } = BaziEngine.run(body);
    const prompts = BaziEngine.buildPrompt(body, chartBlock);
    const content = await callDoubao(env, prompts.system, prompts.user);
    return json({ report: content, chart, engine: BaziEngine.ENGINE_INFO }, 200, request);
  } catch (err) {
    const msg = String((err && err.message) || err);
    if (/birthDate|gender|birthTime/i.test(msg)) {
      return json({ error: `Invalid input: ${msg}` }, 400, request);
    }
    console.error("[bazi] failed:", msg);
    return json({ error: "Reading generation failed, please try again later" }, 502, request);
  }
}

/** 塔罗（同步模式：引擎即时抽牌 + 豆包解读） */
async function handleTarot(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400, request);
  }

  const errors = TarotEngine.validatePayload(body);
  if (errors.length > 0) {
    return json({ error: `Invalid fields: ${errors.join(", ")}` }, 400, request);
  }

  const g = await guard(env, request);
  if (g.error) return g.error;

  try {
    const draw = TarotEngine.drawCards({ spread: body.spread, question: body.question || "" });
    const prompts = TarotEngine.buildTarotPrompt(body, draw);
    const reading = await callDoubao(env, prompts.system, prompts.user);
    return json({ reading, draw, engine: TarotEngine.ENGINE_INFO }, 200, request);
  } catch (err) {
    const msg = String((err && err.message) || err);
    if (/spread|question|locale/i.test(msg)) {
      return json({ error: `Invalid input: ${msg}` }, 400, request);
    }
    console.error("[tarot] failed:", msg);
    return json({ error: "Reading generation failed, please try again later" }, 502, request);
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    // Reject browser calls from foreign origins outright.
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return json({ error: "Origin not allowed" }, 403, request);
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, request);
    }

    const url = new URL(request.url);
    if (url.pathname === "/api/tarot" || url.pathname === "/tarot") {
      return handleTarot(request, env);
    }
    return handleBazi(request, env);
  },
};
