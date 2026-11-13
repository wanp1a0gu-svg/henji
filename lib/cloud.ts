"use client";

import { createWorkBuddyCloud } from "@tencent-ai/workbuddy-cloud-sdk";
import type { Database } from "./cloud-db";
import { createSupabaseCloud, type CloudLike } from "./cloud-supabase";

/**
 * 云服务入口。
 *
 * 两条通道共存，由环境变量决定走哪条：
 *   · 配了 NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY → Supabase
 *   · 都没配                                                        → 旧的 WorkBuddy 云
 *
 * 这样可以先在本地/预览环境用 Supabase 联调，线上保持原样，
 * 等验收通过再切环境变量，代码不用动第二遍。
 */

/** 旧通道的 publicConfig（application wbapp_9pvnTdP5dI1cB9PjsWg1Ou）。 */
export const CLOUD_PUBLIC_CONFIG = {
  endpoint: "https://mingli-club.app.workbuddy.host",
  oauthRelayBaseUrl: "https://www.workbuddy.cn/v2/as/genie-baas/oauth",
  publishableKey: "wbpk_9pvnTdP5dI1cB9PjsWg1Ou_M5lnSU0Mf6S22hwzrcrYK74jwvHMELMu",
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/** 当前是否走 Supabase 通道。 */
export const USING_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

type AnyCloud = CloudLike | ReturnType<typeof createWorkBuddyCloud<Database>>;

let _cloud: AnyCloud | null = null;

/**
 * Lazy singleton —— SDK 只能在浏览器里实例化
 * （本站是静态导出，预渲染阶段没有浏览器 API）。
 */
export function getCloud(): any {
  if (!_cloud) {
    _cloud = USING_SUPABASE
      ? createSupabaseCloud(SUPABASE_URL, SUPABASE_ANON_KEY)
      : createWorkBuddyCloud<Database>({
          endpoint: CLOUD_PUBLIC_CONFIG.endpoint,
          oauthRelayBaseUrl: CLOUD_PUBLIC_CONFIG.oauthRelayBaseUrl,
          publishableKey: CLOUD_PUBLIC_CONFIG.publishableKey,
        });
  }
  return _cloud;
}
