/**
 * 打开右下角「小痕」弹窗的统一入口。
 *
 * 为什么要这样：顶栏「对话」、首页按钮、探索页的功能卡都可能是按钮而不是链接，
 * 但真正持有弹窗状态的是常驻的 CatAssistant。用一个 window 事件解耦，
 * 避免把状态提到全局 context，也避免各页面互相 import 组件。
 */
export const OPEN_CAT_EVENT = "traces:open-cat";

export function openCatAssistant() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_CAT_EVENT));
}
