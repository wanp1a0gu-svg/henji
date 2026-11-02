/**
 * 站内事务邮件（订单确认 / 发货通知 / 报告就绪）。
 *
 * 两个通道，按配置自动选择：
 *   1) SMTP（推荐国人用 QQ / 163 邮箱，不需要自己的域名）
 *   2) Resend HTTP API（需要已验证的发件域名）
 *
 * 配置写在 server-config.json（或同名环境变量，环境变量优先）：
 *   MAIL_PROVIDER      smtp | resend        默认 smtp
 *   MAIL_FROM          no-reply@example.com 发件地址（必填）
 *   MAIL_FROM_NAME     痕迹 Traces           发件人显示名
 *   MAIL_REPLY_TO      回复到（可选）
 *   SMTP_HOST          smtp.qq.com
 *   SMTP_PORT          465
 *   SMTP_USER          501183563@qq.com
 *   SMTP_PASS          邮箱授权码（不是登录密码）
 *   RESEND_API_KEY     re_xxx
 *
 * 没配置时 isConfigured() 返回 false，send() 直接返回 {ok:false, reason:"NOT_CONFIGURED"}，
 * 调用方据此跳过——不会让下单/发货流程失败。
 */

const fs = require("fs");
const path = require("path");

const SITE = "https://mingli-club.app.workbuddy.host";

function cfg(key) {
  if (process.env[key]) return String(process.env[key]);
  try {
    const raw = fs.readFileSync(path.join(__dirname, "..", "server-config.json"), "utf8");
    const j = JSON.parse(raw);
    return j[key] ? String(j[key]) : "";
  } catch {
    return "";
  }
}

function provider() {
  return (cfg("MAIL_PROVIDER") || "smtp").toLowerCase();
}

function fromAddress() {
  const name = cfg("MAIL_FROM_NAME") || "痕迹 Traces";
  const addr = cfg("MAIL_FROM");
  if (!addr) return "";
  return `"${name}" <${addr}>`;
}

function isConfigured() {
  if (!cfg("MAIL_FROM")) return false;
  if (provider() === "resend") return !!cfg("RESEND_API_KEY");
  return !!(cfg("SMTP_HOST") && cfg("SMTP_USER") && cfg("SMTP_PASS"));
}

function describe() {
  if (!isConfigured()) {
    return { configured: false, provider: provider(), hint: "缺 MAIL_FROM 或通道凭证" };
  }
  return {
    configured: true,
    provider: provider(),
    from: cfg("MAIL_FROM"),
    host: provider() === "smtp" ? cfg("SMTP_HOST") : "api.resend.com",
  };
}

/** 发一封邮件。成功返回 {ok:true, id}，失败返回 {ok:false, reason, detail}，不抛异常。 */
async function send({ to, subject, html, text }) {
  if (!to || !subject) return { ok: false, reason: "MISSING_ARGS" };
  if (!isConfigured()) return { ok: false, reason: "NOT_CONFIGURED" };

  try {
    if (provider() === "resend") return await sendResend({ to, subject, html, text });
    return await sendSmtp({ to, subject, html, text });
  } catch (e) {
    console.error("[mail] send failed:", (e && e.message) || e);
    return { ok: false, reason: "SEND_FAILED", detail: (e && e.message) || String(e) };
  }
}

async function sendResend({ to, subject, html, text }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + cfg("RESEND_API_KEY"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [to],
      subject,
      html,
      text: text || undefined,
      reply_to: cfg("MAIL_REPLY_TO") || undefined,
    }),
  });
  const body = await res.text();
  if (!res.ok) return { ok: false, reason: "RESEND_" + res.status, detail: body.slice(0, 300) };
  let id = "";
  try {
    id = JSON.parse(body).id || "";
  } catch {
    /* 忽略 */
  }
  return { ok: true, id, provider: "resend" };
}

let _smtp = null;
function smtpTransport() {
  if (_smtp) return _smtp;
  // 延迟 require，没装 nodemailer 时不至于整个服务起不来
  const nodemailer = require("nodemailer");
  const port = Number(cfg("SMTP_PORT") || 465);
  _smtp = nodemailer.createTransport({
    host: cfg("SMTP_HOST"),
    port,
    secure: port === 465, // 465 隐式 TLS；587 走 STARTTLS
    auth: { user: cfg("SMTP_USER"), pass: cfg("SMTP_PASS") },
  });
  return _smtp;
}

async function sendSmtp({ to, subject, html, text }) {
  const info = await smtpTransport().sendMail({
    from: fromAddress(),
    to,
    subject,
    html,
    text: text || undefined,
    replyTo: cfg("MAIL_REPLY_TO") || undefined,
  });
  return { ok: true, id: info.messageId || "", provider: "smtp" };
}

// ---------------------------------------------------------------------------
// 模板（中英双语；其余语言先用英文，避免半成品）
// ---------------------------------------------------------------------------

const T = {
  zh: {
    brand: "痕迹 Traces",
    paidSubject: "订单确认 · 痕迹 Traces",
    paidTitle: "已收到你的订单",
    paidIntro: "感谢下单。我们已确认你的付款，正在安排制作与发货。",
    shippedSubject: "你的符已寄出 · 痕迹 Traces",
    shippedTitle: "已发货",
    shippedIntro: "你的订单已寄出，物流信息如下。",
    refundSubject: "订单已取消并退款 · 痕迹 Traces",
    refundTitle: "订单已取消",
    refundIntro: "你的订单已取消，款项已退回站内钱包。你可以在「账户」页查看余额与流水明细。",
    refundMethod: "退款方式",
    refundToWallet: "退回站内钱包",
    refundToPaypal: "退回 PayPal",
    reportSubject: "你的八字报告已生成 · 痕迹 Traces",
    reportTitle: "报告已就绪",
    reportIntro: "你的完整八字解读已经生成，登录后可在「账户」页随时查看。",
    orderNo: "订单号",
    product: "商品",
    amount: "金额",
    tracking: "运单号",
    carrier: "承运商",
    shipTo: "收件信息",
    viewOrder: "查看我的订单",
    viewReport: "查看我的报告",
    footer: "此邮件由系统自动发送。如有疑问请直接回复本邮件。",
    disclaimer: "命理内容为传统文化参考，不构成医疗、法律或投资建议。",
  },
  en: {
    brand: "Traces",
    paidSubject: "Order confirmed · Traces",
    paidTitle: "We've received your order",
    paidIntro: "Thank you. Your payment is confirmed and we're preparing your item for shipment.",
    shippedSubject: "Your talisman has shipped · Traces",
    shippedTitle: "Shipped",
    shippedIntro: "Your order is on its way. Tracking details below.",
    refundSubject: "Order cancelled and refunded · Traces",
    refundTitle: "Order cancelled",
    refundIntro: "Your order has been cancelled and the amount has been returned to your wallet. You can review the balance and history on your account page.",
    refundMethod: "Refund method",
    refundToWallet: "Returned to wallet",
    refundToPaypal: "Returned via PayPal",
    reportSubject: "Your BaZi report is ready · Traces",
    reportTitle: "Report ready",
    reportIntro: "Your full reading is ready. Sign in to view it any time from your account page.",
    orderNo: "Order",
    product: "Item",
    amount: "Amount",
    tracking: "Tracking",
    carrier: "Carrier",
    shipTo: "Ship to",
    viewOrder: "View my orders",
    viewReport: "View my report",
    footer: "This is an automated email. Just reply if you need help.",
    disclaimer: "For cultural and entertainment purposes only — not medical, legal or financial advice.",
  },
};

function lang(locale) {
  return locale === "zh" ? "zh" : "en";
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrap(locale, title, intro, rows, cta) {
  const t = T[lang(locale)];
  const rowHtml = rows
    .filter((r) => r && r[1])
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 0;color:#8a8175;font-size:13px;width:120px">${escapeHtml(
          k
        )}</td><td style="padding:6px 0;color:#2b2621;font-size:13px">${escapeHtml(v)}</td></tr>`
    )
    .join("");
  const ctaHtml = cta
    ? `<p style="margin:26px 0 0"><a href="${cta.href}" style="display:inline-block;background:#c9a87c;color:#1a1613;text-decoration:none;padding:11px 22px;border-radius:999px;font-size:13px">${escapeHtml(
        cta.label
      )}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f3ee;font-family:-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#fffdf9;border:1px solid #eae2d6;border-radius:16px;padding:28px">
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#c9a87c">${escapeHtml(
      t.brand
    )}</p>
    <h1 style="margin:0 0 14px;font-size:20px;color:#2b2621;font-weight:600">${escapeHtml(title)}</h1>
    <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#4a423a">${escapeHtml(intro)}</p>
    ${rowHtml ? `<table style="width:100%;border-collapse:collapse">${rowHtml}</table>` : ""}
    ${ctaHtml}
    <p style="margin:24px 0 0;font-size:11px;line-height:1.7;color:#9a9084">${escapeHtml(t.footer)}</p>
    <p style="margin:6px 0 0;font-size:11px;line-height:1.7;color:#b3a999">${escapeHtml(t.disclaimer)}</p>
  </div>
</body></html>`;
}

/** 订单已付款 */
function orderPaid({ locale, order }) {
  const t = T[lang(locale)];
  const rows = [
    [t.orderNo, order.id ? "#" + order.id : ""],
    [t.product, order.productName || order.product || ""],
    [t.amount, order.amount ? "$" + order.amount + " " + (order.currency || "USD") : ""],
    [t.shipTo, order.shipTo || ""],
  ];
  return {
    subject: t.paidSubject,
    html: wrap(locale, t.paidTitle, t.paidIntro, rows, {
      href: SITE + "/" + (locale || "en") + "/account",
      label: t.viewOrder,
    }),
    text: `${t.paidTitle}\n${t.paidIntro}\n${rows.map((r) => r[0] + ": " + r[1]).join("\n")}`,
  };
}

/** 已发货 */
function orderShipped({ locale, order }) {
  const t = T[lang(locale)];
  const rows = [
    [t.orderNo, order.id ? "#" + order.id : ""],
    [t.product, order.productName || order.product || ""],
    [t.tracking, order.tracking || ""],
    [t.carrier, order.carrier || ""],
    [t.shipTo, order.shipTo || ""],
  ];
  return {
    subject: t.shippedSubject,
    html: wrap(locale, t.shippedTitle, t.shippedIntro, rows, {
      href: SITE + "/" + (locale || "en") + "/account",
      label: t.viewOrder,
    }),
    text: `${t.shippedTitle}\n${t.shippedIntro}\n${rows.map((r) => r[0] + ": " + r[1]).join("\n")}`,
  };
}

/** 订单取消并退款 */
function orderRefunded({ locale, order }) {
  const t = T[lang(locale)];
  const rows = [
    [t.orderNo, order.id ? "#" + order.id : ""],
    [t.product, order.productName || order.product || ""],
    [t.amount, order.amount ? "$" + order.amount + " " + (order.currency || "USD") : ""],
    [
      t.refundMethod,
      (order.method === "paypal" ? t.refundToPaypal : t.refundToWallet) || "",
    ],
  ];
  return {
    subject: t.refundSubject,
    html: wrap(locale, t.refundTitle, t.refundIntro, rows, {
      href: SITE + "/" + (locale || "en") + "/account",
      label: t.viewOrder,
    }),
    text: `${t.refundTitle}\n${t.refundIntro}\n${rows.map((r) => r[0] + ": " + r[1]).join("\n")}`,
  };
}

/** 八字报告就绪 */
function reportReady({ locale, name }) {
  const t = T[lang(locale)];
  const rows = [[t.product, name ? name : "BaZi"]];
  return {
    subject: t.reportSubject,
    html: wrap(locale, t.reportTitle, t.reportIntro, rows, {
      href: SITE + "/" + (locale || "en") + "/account",
      label: t.viewReport,
    }),
    text: `${t.reportTitle}\n${t.reportIntro}`,
  };
}

/** 后台自测用 */
function testMail({ locale }) {
  const t = T[lang(locale)];
  return {
    subject: "[TEST] " + t.brand + " 邮件通道自测",
    html: wrap(locale, "邮件通道正常", "如果你收到这封邮件，说明发信配置可用。", [], null),
    text: "邮件通道正常",
  };
}

/** 通用通知信：给管理员/客户发更新说明（标题 + 一段话 + 条目 + 按钮） */
function notice({ locale = "zh", title, intro, bullets = [], cta = null }) {
  const t = T[lang(locale)];
  const listHtml = bullets.length
    ? `<ul style="margin:18px 0 0;padding-left:19px">` +
      bullets
        .map(
          (b) =>
            `<li style="margin:0 0 9px;font-size:13.5px;line-height:1.75;color:#4a423a">${escapeHtml(b)}</li>`
        )
        .join("") +
      `</ul>`
    : "";
  const ctaHtml = cta
    ? `<p style="margin:26px 0 0"><a href="${cta.href}" style="display:inline-block;background:#c9a87c;color:#1a1613;text-decoration:none;padding:11px 22px;border-radius:999px;font-size:13px">${escapeHtml(
        cta.label
      )}</a></p>`
    : "";
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f3ee;font-family:-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#fffdf9;border:1px solid #eae2d6;border-radius:16px;padding:28px">
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#c9a87c">${escapeHtml(
      t.brand
    )}</p>
    <h1 style="margin:0 0 14px;font-size:20px;color:#2b2621;font-weight:600">${escapeHtml(title)}</h1>
    <p style="margin:0 0 4px;font-size:14px;line-height:1.7;color:#4a423a">${escapeHtml(intro)}</p>
    ${listHtml}
    ${ctaHtml}
    <p style="margin:24px 0 0;font-size:11px;line-height:1.7;color:#9a9084">${escapeHtml(t.footer)}</p>
  </div>
</body></html>`;
  return {
    subject: title,
    html,
    text: title + "\n\n" + intro + "\n\n" + bullets.map((b, i) => i + 1 + ". " + b).join("\n"),
  };
}

module.exports = {
  isConfigured,
  describe,
  send,
  orderPaid,
  orderShipped,
  orderRefunded,
  reportReady,
  testMail,
  notice,
};
