"use client";

import { createWorkBuddyCloud } from "@tencent-ai/workbuddy-cloud-sdk";
import type { Database } from "./cloud-db";

/**
 * publicConfig returned by the WorkBuddy Cloud Service activation
 * (application wbapp_9pvnTdP5dI1cB9PjsWg1Ou).
 * These are end-user-facing values: the publishable key identifies the app
 * and carries no permissions on its own (server enforces origin match).
 */
export const CLOUD_PUBLIC_CONFIG = {
  endpoint: "https://mingli-club.app.workbuddy.host",
  oauthRelayBaseUrl: "https://www.workbuddy.cn/v2/as/genie-baas/oauth",
  publishableKey: "wbpk_9pvnTdP5dI1cB9PjsWg1Ou_M5lnSU0Mf6S22hwzrcrYK74jwvHMELMu",
};

type CloudClient = ReturnType<typeof createWorkBuddyCloud<Database>>;

let _cloud: CloudClient | null = null;

/**
 * Lazy singleton — the SDK must only be instantiated in the browser
 * (this project is a static export, so modules can be evaluated during
 * prerender where browser APIs are unavailable).
 */
export function getCloud(): CloudClient {
  if (!_cloud) {
    _cloud = createWorkBuddyCloud<Database>({
      endpoint: CLOUD_PUBLIC_CONFIG.endpoint,
      oauthRelayBaseUrl: CLOUD_PUBLIC_CONFIG.oauthRelayBaseUrl,
      publishableKey: CLOUD_PUBLIC_CONFIG.publishableKey,
    });
  }
  return _cloud;
}
