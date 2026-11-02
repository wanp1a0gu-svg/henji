"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getCloud } from "@/lib/cloud";
import { useAuth } from "./AuthProvider";

// 当前登录者信息缓存（每次页面会话查一次服务端）
// 为什么要查：OAuth 会话里的 user 只有 id、没有 email，邮箱和「是否管理员」都得问服务端
let _whoCache: { uid?: string; email?: string; is_admin?: boolean } | null = null;
async function whoamiOnce() {
  if (_whoCache) return _whoCache;
  try {
    const { data } = await getCloud().database.rpc("whoami");
    const row: any = Array.isArray(data) ? data[0] : data;
    _whoCache = row || {};
  } catch {
    _whoCache = {};
  }
  return _whoCache;
}

/**
 * 页面访问统计（PV/UV + 访问明细）。
 * - 每次路由变化上报一次：path、locale、随机访客 ID、公网 IP、
 *   归属地（国家/省/城市/运营商，服务端查）、UA、来源页；登录用户额外记 uid + 邮箱
 * - 不统计 /admin 与 /account 等私有页；不统计站主自己的访问
 * - 静默失败（统计失败绝不影响用户）
 */
export function PageViewTracker({ locale }: { locale: string }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const lastRef = useRef("");

  useEffect(() => {
    if (loading) return; // 等登录态就绪，避免站主未被排除
    if (!pathname) return;
    if (pathname === lastRef.current) return;
    lastRef.current = pathname;

    // 私有页不统计
    if (pathname.indexOf("/admin") !== -1) return;
    if (pathname.indexOf("/account") !== -1) return;

    const insert = async () => {
    try {
      let vid = "";
      try {
        vid = localStorage.getItem("traces_vid") || "";
        if (!vid) {
          vid =
            (typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID()) ||
            Math.random().toString(36).slice(2) + Date.now().toString(36);
          localStorage.setItem("traces_vid", vid);
        }
      } catch {
        vid = "anon";
      }

      // 公网 IP + 归属地：浏览器拿不到自己的出口 IP，由服务端读 X-Forwarded-For
      // 并查归属地后返回。同一次会话缓存，避免每次翻页都请求。
      let info: any = null;
      try {
        const cached = sessionStorage.getItem("traces_ipinfo");
        if (cached) {
          info = JSON.parse(cached);
        } else {
          const r = await fetch("/api/ip", { cache: "no-store" });
          const j: any = await r.json();
          if (j && j.ip) {
            info = j;
            sessionStorage.setItem("traces_ipinfo", JSON.stringify(j));
          }
        }
      } catch {
        /* 拿不到就留空，不影响埋点 */
      }

      const geo = (info && info.geo) || {};
      const cut = (v: any, n: number) => (v ? String(v).slice(0, n) : null);

      // 登录用户：问一次服务端拿到 id / email（会话里的 user 通常没有 email）
      let uid: string | null = null;
      let email: string | null = null;
      if (user) {
        uid = String(user.id);
        const w = await whoamiOnce();
        email = (w && w.email) || (user as any).email || null;
      }

      const p = getCloud()
        .database.from("page_views")
        .insert({
          path: pathname,
          locale,
          visitor_id: vid,
          ip: info && info.ip ? String(info.ip) : null,
          user_agent: cut((info && info.ua) || navigator.userAgent, 300),
          referrer: cut(typeof document !== "undefined" ? document.referrer : "", 300),
          user_id: uid,
          user_email: email,
          country: cut(geo.country, 60),
          region: cut(geo.region, 80),
          city: cut(geo.city, 80),
          isp: cut(geo.isp, 100),
          ip_kind: cut(geo.kind, 10),
          tz: (() => {
            try {
              return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
            } catch {
              return null;
            }
          })(),
        });
      // 必须消费 promise 才会真正发出请求
      Promise.resolve(p).then(
        () => {},
        () => {}
      );
    } catch {
      /* 静默 */
    }
    };

    // 管理员也记录（后台会打「管理员」标签并从 PV/UV 里排除），
    // 这样后台能看到「谁登录了」，而不是清一色游客。
    insert();
  }, [pathname, user, loading, locale]);

  return null;
}
