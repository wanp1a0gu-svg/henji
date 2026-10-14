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

    const insert = () => {
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
      const p = getCloud()
        .database.from("page_views")
        .insert({ path: pathname, locale, visitor_id: vid });
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
