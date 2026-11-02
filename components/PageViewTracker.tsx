"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getCloud } from "@/lib/cloud";
import { useAuth } from "./AuthProvider";

// 管理员身份缓存（每页面会话查一次服务端）
let _adminCache: boolean | null = null;
async function isAdminSession(): Promise<boolean> {
  if (_adminCache !== null) return _adminCache;
  try {
    const { data } = await getCloud().database.rpc("is_admin");
    _adminCache = data === true;
  } catch {
    _adminCache = false;
  }
  return _adminCache;
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

      const p = getCloud()
        .database.from("page_views")
        .insert({
          path: pathname,
          locale,
          visitor_id: vid,
          ip: info && info.ip ? String(info.ip) : null,
          user_agent: cut((info && info.ua) || navigator.userAgent, 300),
          referrer: cut(typeof document !== "undefined" ? document.referrer : "", 300),
          user_id: user ? String(user.id) : null,
          user_email: user && user.email ? String(user.email) : null,
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

    // 站主自己的访问不统计（服务端判断，避免会话字段差异）
    if (user) {
      isAdminSession().then((isAdmin) => {
        if (!isAdmin) insert();
      });
    } else {
      insert();
    }
  }, [pathname, user, loading, locale]);

  return null;
}
