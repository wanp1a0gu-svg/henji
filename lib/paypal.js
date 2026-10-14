/**
 * PayPal REST API 客户端（零依赖，Node 18+ 内置 fetch）。
 * ===========================================================================
 * 配置来源（优先环境变量，其次 server-config.json）：
 *   PAYPAL_CLIENT_ID / PAYPAL_SECRET / PAYPAL_ENV（sandbox | live）
 *
 * 能力：
 *   - isConfigured()                 是否已配置
 *   - publicConfig()                 前端用配置（clientId 属公开信息）
 *   - createOrder({...})             创建订单（intent=CAPTURE）
 *   - captureOrder(orderId)          捕获订单（真实扣款）
 *   - getOrder(orderId)              查询订单（对账/核验）
 *
 * 金额安全：金额一律由服务端根据商品表给出，客户端传的 amount 不被信任。
 */
"use strict";

const fs = require("fs");
const path = require("path");

let _cfg = null;

function loadFileConfig() {
  try {
    const p = path.join(__dirname, "..", "server-config.json");
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return {};
  }
}

function config() {
  if (_cfg) return _cfg;
  const file = loadFileConfig();
  const env = process.env.PAYPAL_ENV || file.PAYPAL_ENV || "sandbox";
  const useSandbox = env === "sandbox";
  _cfg = {
    env,
    clientId:
      process.env.PAYPAL_CLIENT_ID ||
      (useSandbox
        ? file.PAYPAL_SANDBOX_CLIENT_ID || file.PAYPAL_CLIENT_ID
        : file.PAYPAL_CLIENT_ID),
    secret:
      process.env.PAYPAL_SECRET ||
      (useSandbox
        ? file.PAYPAL_SANDBOX_SECRET || file.PAYPAL_SECRET
        : file.PAYPAL_SECRET),
  };
  return _cfg;
}

/** 配置热更新后调用（例如测试时切换环境）。 */
function resetCache() {
  _cfg = null;
}

function isConfigured() {
  const c = config();
  return Boolean(c.clientId && c.secret);
}

/** 前端需要的公开配置（clientId 本来就是公开的，密钥绝不外发）。 */
function publicConfig() {
  const c = config();
  return {
    configured: isConfigured(),
    clientId: c.clientId,
    env: c.env, // sandbox / live（前端仅用于显示“沙盒模式”提示）
    currency: "USD",
  };
}

function apiBase() {
  return config().env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

// OAuth2 token 缓存（有效期约 9 小时）
let _token = { value: "", expireAt: 0 };

async function getToken() {
  const c = config();
  if (!isConfigured()) throw new Error("paypal_not_configured");
  if (_token.value && Date.now() < _token.expireAt) return _token.value;

  const basic = Buffer.from(c.clientId + ":" + c.secret).toString("base64");
  const res = await fetch(apiBase() + "/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + basic,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.access_token) {
    throw new Error("paypal_auth_failed: " + res.status + " " + (j.error_description || j.error || ""));
  }
  _token = {
    value: j.access_token,
    expireAt: Date.now() + Math.max(60, (j.expires_in || 32400) - 600) * 1000,
  };
  return _token.value;
}

/** 统一请求封装。 */
async function api(method, apiPath, body) {
  const token = await getToken();
  const res = await fetch(apiBase() + apiPath, {
    method,
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = j.message || (j.details && j.details[0] && j.details[0].description) || res.status;
    const err = new Error("paypal_api_failed: " + res.status + " " + msg);
    err.detail = j;
    throw err;
  }
  return j;
}

/**
 * 创建订单。金额由调用方（server.js）按服务端价格表给出。
 * custom: 透传字段（订单入库时用于关联商品/来源）。
 */
async function createOrder({ amount, currency, description, custom }) {
  return api("POST", "/v2/checkout/orders", {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: { currency_code: currency || "USD", value: String(amount) },
        description: (description || "").slice(0, 127),
        custom_id: (custom || "").slice(0, 127),
      },
    ],
    application_context: {
      shipping_preference: "GET_FROM_FILE", // 实物商品需要收货地址；虚拟品不受影响
      user_action: "PAY_NOW",
    },
  });
}

/** 捕获订单（真实扣款，幂等性由 PayPal 保证：重复捕获会被拒绝）。 */
async function captureOrder(orderId) {
  return api("POST", "/v2/checkout/orders/" + encodeURIComponent(orderId) + "/capture", {});
}

/** 查询订单（用于服务端核验金额与状态）。 */
async function getOrder(orderId) {
  return api("GET", "/v2/checkout/orders/" + encodeURIComponent(orderId), null);
}

/** 全额/部分退款（captureId 来自捕获响应；测试退款/售后用）。 */
async function refundCapture(captureId, opts) {
  const body = {};
  if (opts && opts.amount) {
    body.amount = { value: String(opts.amount), currency_code: opts.currency || "USD" };
  }
  return api("POST", "/v2/payments/captures/" + encodeURIComponent(captureId) + "/refund", body);
}

/** 从捕获响应中提取关键信息（订单入库用）。 */
function extractCapture(capture, fallbackProduct) {
  const unit = (capture.purchase_units && capture.purchase_units[0]) || {};
  const pay = (unit.payments && unit.payments.captures && unit.payments.captures[0]) || {};
  const payer = capture.payer || {};
  return {
    paypalOrderId: capture.id || "",
    captureId: pay.id || "",
    status: pay.status || capture.status || "",
    amount: (pay.amount && pay.amount.value) || (unit.amount && unit.amount.value) || "",
    currency: (pay.amount && pay.amount.currency_code) || "USD",
    payerEmail: payer.email_address || "",
    payerName: [payer.name && payer.name.given_name, payer.name && payer.name.surname].filter(Boolean).join(" "),
    shipping: (unit.shipping || (pay.shipping)) || null,
    product: unit.custom_id || fallbackProduct || "",
    description: unit.description || "",
  };
}

// ---------------------------------------------------------------------------
// Webhook（交易事件反向通知）
// ---------------------------------------------------------------------------

/** 创建 webhook 订阅（url 必须是公网可达的 HTTPS 地址）。 */
async function createWebhook(url, eventTypes) {
  return api("POST", "/v1/notifications/webhooks", {
    url,
    event_types: eventTypes.map((name) => ({ name })),
  });
}

/** 列出已有 webhook 订阅（用于查重/获取 webhook_id）。 */
async function listWebhooks() {
  return api("GET", "/v1/notifications/webhooks", null);
}

/** 用官方模拟器发送一个真实签名事件到已注册的 webhook（仅测试用）。 */
async function simulateEvent(webhookId, eventType) {
  return api("POST", "/v1/notifications/simulate-event", {
    webhook_id: webhookId,
    event_type: eventType,
  });
}

/** 用 PayPal 官方接口验证 webhook 签名（防伪造通知）。 */
async function verifyWebhookSignature(headers, event, webhookId) {
  const r = await api("POST", "/v1/notifications/verify-webhook-signature", {
    auth_algo: headers["paypal-auth-algo"],
    cert_url: headers["paypal-cert-url"],
    transmission_id: headers["paypal-transmission-id"],
    transmission_sig: headers["paypal-transmission-sig"],
    transmission_time: headers["paypal-transmission-time"],
    webhook_id: webhookId,
    webhook_event: event,
  });
  return r.verification_status === "SUCCESS";
}

module.exports = {
  isConfigured,
  publicConfig,
  resetCache,
  createOrder,
  captureOrder,
  getOrder,
  refundCapture,
  extractCapture,
  createWebhook,
  listWebhooks,
  simulateEvent,
  verifyWebhookSignature,
};
