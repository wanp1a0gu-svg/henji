/**
 * Site-wide configuration constants.
 */

/**
 * 站点正式地址（用于 SEO：canonical / og:url / sitemap）。
 * ⚠️ 绑定自定义域名后，改这一处即可（sitemap 由 scripts/build-sitemap.py 重新生成）。
 */
export const SITE_URL = "https://mingli-club.app.workbuddy.host";

/**
 * 管理后台（/admin）管理员邮箱白名单。
 * ⚠️ 前端仅做界面控制；真正的数据权限在数据库 RLS 策略里（auth.email() 白名单），
 *    改这里的同时必须同步更新 payment_orders / readings 的 *_select_admin 策略。
 */
export const ADMIN_EMAILS = ["wanp1a0gu@gmail.com", "501183563@qq.com"];

/**
 * WhatsApp contact number — international format, digits only
 * (e.g. "+1 555 123 4567" → "15551234567"; "+86 138 0013 8000" → "8613800138000").
 *
 * Leave empty ("") to hide the floating WhatsApp button.
 */
export const WHATSAPP_NUMBER = "";

/**
 * 微信支付 / 支付宝收款码图片路径。
 *
 * 用法：把收款码图片放到 `public/payment/` 目录，然后在这里填入路径：
 *   wechat: "/payment/wechat-qr.png"
 *   alipay: "/payment/alipay-qr.png"
 *
 * 留空 ("") 时，对应支付方式会显示「收款码准备中」提示（不展示二维码）。
 */
export const PAYMENT_QR = {
  wechat: "",
  alipay: "",
};

/**
 * Linktree 跳转页（/links）外链配置。
 *
 * 填入完整 URL 后对应按钮自动显示；留空 ("") 则隐藏。
 * email 填邮箱地址（如 "support@mingli.club"），会生成 mailto 链接。
 */
export const LINKS = {
  instagram: "",
  tiktok: "",
  youtube: "",
  x: "",
  facebook: "",
  xiaohongshu: "",
  email: "",
};
