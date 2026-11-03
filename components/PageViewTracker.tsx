"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getCloud } from "@/lib/cloud";
import { deviceFingerprint } from "@/lib/fingerprint";
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
/**
 * 访客 ID：localStorage → cookie → sessionStorage 三级兜底。
 *
 * 为什么要 cookie：无痕模式、Safari 严格模式或隐私插件常把 localStorage 禁掉，
 * 那样每次访问都会生成新 ID，同一个人被算成多个访客，UV 直接虚高
 * （今天就发生过：一台 Mac 的 4 次访问记成了 4 个不同游客）。
 * 三级都写不进去时退回 "anon"，UV 统计会跳过它，宁可少算也不虚高。
 */
const VID_KEY = "traces_vid";
const VID_MAX_AGE = 60 * 60 * 24 * 365;

function readCookie(name: string): string {
  try {
    const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]+)"));
    return m ? decodeURIComponent(m[1]) : "";
  } catch {
    return "";
  }
}

function writeCookie(name: string, value: string) {
  try {
    document.cookie =
      name + "=" + encodeURIComponent(value) + "; max-age=" + VID_MAX_AGE + "; path=/; SameSite=Lax";
  } catch {
    /* cookie 也被禁就算了 */
  }
}

function newId(): string {
  return (
    (typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID()) ||
    Math.random().toString(36).slice(2) + Date.now().toString(36)
  );
}

function getVisitorId(): string {
  // 1) localStorage 有就直接用，顺手补齐 cookie
  try {
    const ls = localStorage.getItem(VID_KEY);
    if (ls) {
      if (readCookie(VID_KEY) !== ls) writeCookie(VID_KEY, ls);
      return ls;
    }
  } catch {
    /* 继续往下试 */
  }

  // 2) cookie 有（比如 localStorage 被清过），回填 localStorage
  const ck = readCookie(VID_KEY);
  if (ck) {
    try {
      localStorage.setItem(VID_KEY, ck);
    } catch {
      /* 写不进也无妨，至少这次认得出来 */
    }
    return ck;
  }

  // 3) 都没有：新建一个，尽量存住
  const id = newId();
  let saved = false;
  try {
    localStorage.setItem(VID_KEY, id);
    saved = true;
  } catch {
    /* 试 cookie */
  }
  writeCookie(VID_KEY, id);
  if (!saved && readCookie(VID_KEY) === id) saved = true;
  if (!saved) {
    try {
      sessionStorage.setItem(VID_KEY, id);
      saved = true;
    } catch {
      /* 全禁 */
    }
  }
  if (saved) return id;

  // 存储全被禁（无痕模式 / 隐私插件）：退回设备指纹。
  // 这样同一个人反复访问只算一个访客，不会每次生成新 ID 把 UV 冲高。
  const fp = deviceFingerprint();
  return fp ? "fp:" + fp : "anon";
}

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
      const vid = getVisitorId();

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
