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
 * 匿名页面访问统计（PV/UV）。
 * - 每次路由变化上报一次：path + locale + 随机访客ID（localStorage，无 IP/设备信息）
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

      // 公网 IP：浏览器拿不到自己的出口 IP，由服务端读 X-Forwarded-For 返回
      // （不经过第三方接口）。同一次会话缓存，避免每次翻页都请求。
      let ip: string | null = null;
      try {
        const cached = sessionStorage.getItem("traces_ip");
        if (cached) {
          ip = cached;
        } else {
          const r = await fetch("/api/ip", { cache: "no-store" });
          const j = (await r.json()) as { ip?: string };
          if (j && j.ip) {
            ip = String(j.ip);
            sessionStorage.setItem("traces_ip", ip);
          }
        }
      } catch {
        /* 拿不到 IP 就留空，不影响埋点 */
      }

      const p = getCloud()
        .database.from("page_views")
        .insert({ path: pathname, locale, visitor_id: vid, ip });
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
