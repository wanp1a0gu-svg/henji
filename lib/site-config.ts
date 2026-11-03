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
/**
 * Google Search Console 的验证码。
 *
 * 取值位置：GSC → 添加资源 → 选「网址前缀」→ 填 https://mingli-club.app.workbuddy.host/
 * → 验证方式选「HTML 标记」→ 复制 content="..." 里那串（形如 abc123...）。
 * 填到这里，下次构建会在 <head> 输出 google-site-verification，回 GSC 点「验证」即可。
 * 留空则不输出该标签。
 */
export const GOOGLE_SITE_VERIFICATION = "";

export const ADMIN_EMAILS = ["wanp1a0gu@gmail.com", "501183563@qq.com"];

/**
 * WhatsApp contact number — international format, digits only
 * (e.g. "+1 555 123 4567" → "15551234567"; "+86 138 0013 8000" → "8613800138000").
 *
 * Leave empty ("") to hide the floating WhatsApp button.
 */
/**
 * 课程是否已上架可售。
 * false 时：课程页与首页不显示报名按钮，避免"标价但买不了"造成的信任损失。
 * 真正上架需：课程 SKU 进 server.js 价格表 + 交付流程（内容/有效期/退款）。
 */
export const COURSES_OPEN = false;

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
