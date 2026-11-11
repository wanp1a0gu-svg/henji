import status from "@/cat-status.json";
import type { Locale } from "@/lib/i18n";

/**
 * 小痕（站内猫咪助理）是否在线。
 *
 * 唯一开关在项目根目录 `cat-status.json`，前端与 server.js 读的是同一份，
 * 不会出现"按钮藏了但接口还能调"的错位。
 *
 * 下线时：
 *   - layout 不再渲染 <CatAssistant />（悬浮猫 + 弹窗一起消失）
 *   - 导航 / 首页 / 功能页里所有 openCatAssistant 入口不渲染
 *   - /api/chat 直接返回 503 维护提示，不调用豆包
 */
export const CAT_ONLINE: boolean = status.online;

/** 下线文案：中文站用中文，其余语言统一用英文（避免 10 套翻译只为一句话）。 */
export function catOfflineNotice(locale: Locale | string): string {
  const n = status.offlineNotice;
  return locale === "zh" ? n.zh : n.en;
}
