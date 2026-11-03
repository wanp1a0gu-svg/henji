"use client";

/**
 * 设备指纹：在没有 cookie / localStorage 的浏览器里（无痕模式、隐私插件）
 * 仍然能认出「这是同一台设备」。
 *
 * 为什么需要：IP 全是机房出口（访客都挂着代理），用 IP 判人会把人认错；
 * 靠 cookie 则一进无痕就失效。指纹取的是「这台设备 + 这个浏览器」的稳定特征组合，
 * 换网络、换 IP、清缓存都还在。
 *
 * 限制（必须知道）：
 * - 同一台机器的不同浏览器（Chrome / Safari）算不同指纹，这是对的
 * - 系统升级、换显示器、装字体都可能改变指纹——它是概率识别，不是身份认证
 * - 只用于站内访问统计，不参与登录与支付
 */

/** 32 位 FNV-1a，输出 8 位十六进制，够短又不容易撞。 */
function fnv1a(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/** canvas 文本渲染差异：不同 GPU / 字体栈画出来的像素不一样。 */
function canvasDigest(): string {
  try {
    const c = document.createElement("canvas");
    c.width = 220;
    c.height = 40;
    const ctx = c.getContext("2d");
    if (!ctx) return "";
    ctx.textBaseline = "top";
    ctx.font = "16px 'Arial'";
    ctx.fillStyle = "#f60";
    ctx.fillRect(0, 0, 120, 24);
    ctx.fillStyle = "#069";
    ctx.fillText("痕迹 Traces 命理", 2, 4);
    ctx.fillStyle = "rgba(102,204,0,0.7)";
    ctx.fillText("痕迹 Traces 命理", 4, 12);
    return c.toDataURL().slice(-96);
  } catch {
    return "";
  }
}

let _cached: string | null = null;

/** 计算一次指纹，进程内缓存（同一页面不重复算）。 */
export function deviceFingerprint(): string {
  if (_cached) return _cached;
  if (typeof window === "undefined") return "";
  try {
    const nav: any = window.navigator || {};
    const scr: any = window.screen || {};
    const parts = [
      nav.userAgent || "",
      nav.platform || "",
      nav.language || "",
      (nav.languages || []).join(","),
      nav.hardwareConcurrency || "",
      nav.deviceMemory || "",
      nav.maxTouchPoints || "",
      scr.width || "",
      scr.height || "",
      scr.colorDepth || "",
      window.devicePixelRatio || "",
      Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      new Date().getTimezoneOffset(),
      canvasDigest(),
    ];
    _cached = fnv1a(parts.join("|"));
  } catch {
    _cached = "";
  }
  return _cached || "";
}

/** 给后台看的短标识，例如 "a1b2c3d4"。 */
export function fingerprintShort(): string {
  return deviceFingerprint();
}
