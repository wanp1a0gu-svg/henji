"use client";

/**
 * 后台访问日志（admin_access_log）。
 *
 * 为什么单独一张表：普通流量统计**故意排除**管理员和 /admin 路径，
 * 否则站主自己刷两下就把 PV 搅浑了。但「谁什么时候进过后台」是安全信息，
 * 必须有据可查 —— 所以单独记一份，包含**被拒绝的尝试**（非管理员账号打开后台）。
 *
 * RLS：只有 is_admin() 能读；写入时 user_id 必须等于 auth.uid()（不能替别人记账）。
 */

import { useEffect, useState } from "react";
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { getCloud } from "@/lib/cloud";

export type AccessRow = {
  id?: number;
  created_at: string;
  user_id?: string | null;
  user_email?: string | null;
  allowed?: boolean | null;
  path?: string | null;
  locale?: string | null;
  ip?: string | null;
  user_agent?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  isp?: string | null;
  ip_kind?: string | null;
  tz?: string | null;
};

const fmt = (t: string) => {
  try {
    return new Date(t).toLocaleString("zh-CN", { hour12: false, timeZone: "Asia/Shanghai" });
  } catch {
    return t;
  }
};

const deviceOf = (ua?: string | null) => {
  const s = (ua || "").toLowerCase();
  if (!s) return "—";
  const os = s.includes("windows")
    ? "Windows"
    : s.includes("android")
      ? "Android"
      : /iphone|ipad|ipod/.test(s)
        ? "iOS"
        : s.includes("mac os")
          ? "macOS"
          : s.includes("linux")
            ? "Linux"
            : "";
  const br = s.includes("micromessenger")
    ? "微信"
    : s.includes("edg/")
      ? "Edge"
      : s.includes("firefox")
        ? "Firefox"
        : s.includes("chrome")
          ? "Chrome"
          : s.includes("safari")
            ? "Safari"
            : "";
  return [os, br].filter(Boolean).join(" · ") || "其他";
};

const geoOf = (r: AccessRow) => {
  const parts = [r.country, r.region, r.city].filter(Boolean);
  return parts.length ? parts.join(" / ") : "—";
};

export function AdminAccessLog({ initialRows }: { initialRows?: AccessRow[] } = {}) {
  const [rows, setRows] = useState<AccessRow[] | null>(initialRows ?? null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (initialRows) return;
    let alive = true;
    (async () => {
      try {
        const { data, error } = await getCloud()
          .database.from("admin_access_log")
          .select("id,created_at,user_id,user_email,allowed,path,locale,ip,user_agent,country,region,city,isp,ip_kind,tz")
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw new Error(error.message || "读取失败");
        if (alive) setRows((data as AccessRow[]) || []);
      } catch (e: any) {
        if (alive) {
          setRows([]);
          setErr((e && e.message) || "读取失败");
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [initialRows]);

  if (!rows) {
    return (
      <div className="glass flex items-center justify-center rounded-2xl py-10">
        <Loader2 size={16} className="animate-spin text-accent/70" />
      </div>
    );
  }

  const lastOk = rows.find((r) => r.allowed);
  const denied = rows.filter((r) => r.allowed === false).length;

  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="flex flex-wrap items-center gap-2 px-5 py-4">
        <p className="flex items-center gap-1.5 text-xs text-muted/70">
          <ShieldCheck size={12} /> 后台访问日志
          <span className="text-muted/40">
            （最近 {rows.length} 次{denied > 0 ? ` · 被拒 ${denied} 次` : ""}）
          </span>
        </p>
        <span className="ms-auto text-[11px] text-muted/60">
          最近一次成功进入：{lastOk ? fmt(lastOk.created_at) : "无记录"}
        </span>
      </div>

      {err && <p className="border-t border-white/[0.06] px-5 py-2 text-[11px] text-amber-300/80">{err}</p>}

      <div className="max-h-[320px] overflow-auto border-t border-white/[0.06]">
        <table className="w-full min-w-[880px] text-start text-[11px]">
          <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur">
            <tr className="border-b border-white/[0.08] text-[10px] uppercase tracking-wider text-muted/60">
              <th className="px-4 py-2 font-normal">时间</th>
              <th className="px-2 py-2 font-normal">账号</th>
              <th className="px-2 py-2 font-normal">结果</th>
              <th className="px-2 py-2 font-normal">IP</th>
              <th className="px-2 py-2 font-normal">归属地</th>
              <th className="px-2 py-2 font-normal">设备</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id ?? i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="whitespace-nowrap px-4 py-2 text-muted">{fmt(r.created_at)}</td>
                <td className="max-w-[200px] truncate px-2 py-2 text-foreground/85">{r.user_email || r.user_id || "—"}</td>
                <td className="whitespace-nowrap px-2 py-2">
                  {r.allowed ? (
                    <span className="inline-flex items-center gap-1 text-green-400/90">
                      <ShieldCheck size={11} /> 通过
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-300/90">
                      <ShieldAlert size={11} /> 被拒
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-2 py-2 font-mono text-accent/80">
                  {r.ip || "—"}
                  {r.ip_kind === "idc" && (
                    <span className="ms-1 rounded border border-amber-400/30 bg-amber-400/10 px-1 py-0.5 text-[9px] text-amber-200/90">
                      机房/代理
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-muted/80">{geoOf(r)}</td>
                <td className="whitespace-nowrap px-2 py-2 text-muted/70">{deviceOf(r.user_agent)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-[11px] text-muted/50">
                  还没有记录 —— 下次打开后台时会产生第一条
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="border-t border-white/[0.06] px-5 py-3 text-[10px] leading-relaxed text-muted/40">
        记录每次打开后台的时间、账号、IP、归属地与设备；非管理员账号的尝试会标为「被拒」。
        只记一次进入（每次打开页面算一次），不会记录你在后台点了什么。仅管理员可见。
      </p>
    </div>
  );
}
