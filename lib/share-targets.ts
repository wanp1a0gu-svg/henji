"use client";

/**
 * 海外社交平台的分享入口。
 *
 * 为什么不用各自的 SDK：要申请 App、走审核、拿 token，而且多数平台已经不支持
 * 直接发图（Web Intent 只能带文字 + 链接）。所以走标准 Intent 链接：
 * 免登录、免审核、点了就开，图片让用户自己上传（我们先帮他存好）。
 */

export type ShareTarget = {
  id: string;
  label: string;
  /** 生成分享链接 */
  build: (text: string, url: string) => string;
};

const enc = (s: string) => encodeURIComponent(s);

export const SHARE_TARGETS: ShareTarget[] = [
  {
    id: "x",
    label: "X",
    build: (text, url) => `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`,
  },
  {
    id: "facebook",
    label: "Facebook",
    build: (_text, url) => `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    build: (text, url) => `https://wa.me/?text=${enc(text + " " + url)}`,
  },
  {
    id: "telegram",
    label: "Telegram",
    build: (text, url) => `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`,
  },
  {
    id: "reddit",
    label: "Reddit",
    build: (text, url) => `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(text)}`,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    build: (_text, url) => `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
  },
  {
    id: "pinterest",
    label: "Pinterest",
    build: (text, url) => `https://pinterest.com/pin/create/button/?url=${enc(url)}&description=${enc(text)}`,
  },
  {
    id: "weibo",
    label: "微博",
    build: (text, url) => `https://service.weibo.com/share/share.php?url=${enc(url)}&title=${enc(text)}`,
  },
];

/** 分享文案：一句结果 + 站点名，控制在 100 字内，避免被平台截断。 */
export function shareText(headline: string, siteName = "痕迹 Traces"): string {
  const h = String(headline || "").trim();
  return h ? `${h} · ${siteName}` : siteName;
}
