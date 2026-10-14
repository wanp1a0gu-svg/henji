"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Package, FileText, Wallet, Sparkles, Truck, X, ShieldAlert, BarChart3, Eye, Users, BookOpen } from "lucide-react";
import { Locale } from "@/lib/i18n";
import { ADMIN_EMAILS } from "@/lib/site-config";
import { getCloud } from "@/lib/cloud";
import { SHOP_PRODUCTS } from "@/lib/shop-data";
import { useAuth } from "./AuthProvider";
import { SignInGate } from "./SignInGate";
import { AdminSkills } from "./AdminSkills";

interface Order {
  id: number;
  created_at: string;
  product: string | null;
  amount: string | null;
  currency: string | null;
  payer_email: string | null;
  status: string | null;
  fulfillment: string | null;
  shipping_address: any;
  paypal_order_id: string | null;
}

interface PageView {
  path: string;
  visitor_id: string | null;
  created_at: string;
}

interface Reading {
  id: number;
  created_at: string;
  name: string | null;
  birth_date: string;
  birth_time: string | null;
  gender: string;
  focus: string;
  locale: string;
  owner_id: string;
  report?: string;
}

const productLabel = (product: string | null) => {
  if (!product) return "—";
  if (product === "bazi") return "八字测算 $68";
  if (product.indexOf("shop:") === 0) {
    const p = SHOP_PRODUCTS.find((x) => x.id === product.slice(5));
    return p ? p.nameZh : product;
  }
  return product;
};

const addrText = (s: any) => {
  if (!s) return "";
  try {
    return [
      s.address_line_1, s.address_line_2, s.admin_area_2, s.admin_area_1, s.postal_code, s.country_code,
    ].filter(Boolean).join(", ");
  } catch {
    return "";
  }
};

const FOCUS_ZH: Record<string, string> = {
  general: "综合",
  career: "事业财运",
  love: "婚恋",
  wealth: "财运",
  health: "健康",
};

const fmtTime = (t: string) => {
  try {
    return new Date(t).toLocaleString("zh-CN", { hour12: false, timeZone: "Asia/Shanghai" });
  } catch {
    return t;
  }
};

export function AdminContent({ locale }: { locale: Locale }) {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<"overview" | "orders" | "readings" | "traffic" | "skills">("overview");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [readings, setReadings] = useState<Reading[] | null>(null);
  const [views, setViews] = useState<PageView[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [openReading, setOpenReading] = useState<Reading | null>(null);

  // 身份判断走服务端（is_admin RPC，读登录凭证；与数据库 RLS 同一逻辑）
  const [adminState, setAdminState] = useState<"checking" | "yes" | "no">("checking");
  const [diag, setDiag] = useState<any>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) return; // 未登录由下方门禁处理
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getCloud().database.rpc("is_admin");
        if (!cancelled) setAdminState(data === true ? "yes" : "no");
      } catch {
        if (!cancelled) setAdminState("no");
      }
      try {
        const { data: w } = await getCloud().database.rpc("whoami");
        const row: any = Array.isArray(w) ? w[0] : w;
        if (!cancelled) setDiag(row || null);
      } catch {
        /* 诊断失败忽略 */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const db = getCloud().database;
      const [o, r] = await Promise.all([
        db
          .from("payment_orders")
          .select("id,created_at,product,amount,currency,payer_email,status,fulfillment,shipping_address,paypal_order_id")
          .order("created_at", { ascending: false })
          .limit(300),
        db
          .from("readings")
          .select("id,name,birth_date,birth_time,gender,focus,locale,owner_id,created_at")
          .order("created_at", { ascending: false })
          .limit(300),
      ]);
      if (o.error) throw new Error(o.error.message || JSON.stringify(o.error));
      if (r.error) throw new Error(r.error.message || JSON.stringify(r.error));
      setOrders((o.data as Order[]) || []);
      setReadings((r.data as Reading[]) || []);
      // 流量：近 7 天访问明细（聚合在前端做，量级可控）
      try {
        const since = new Date(Date.now() - 7 * 86400000).toISOString();
        const v = await db
          .from("page_views")
          .select("path,visitor_id,created_at")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(5000);
        if (!v.error) setViews((v.data as PageView[]) || []);
      } catch {
        /* 流量表缺失时不影响其余面板 */
      }
    } catch (e: any) {
      setError((e && e.message) || "加载失败");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (adminState === "yes") load();
  }, [adminState, load]);

  const openReport = async (r: Reading) => {
    setOpenReading({ ...r, report: "" });
    try {
      const { data } = await getCloud().database.from("readings").select("report").eq("id", r.id).limit(1);
      const row: any = Array.isArray(data) ? data[0] : null;
      setOpenReading({ ...r, report: (row && row.report) || "（无报告内容）" });
    } catch {
      setOpenReading({ ...r, report: "（报告加载失败）" });
    }
  };

  const toggleShipped = async (o: Order) => {
    try {
      const next = o.fulfillment === "shipped" ? null : "shipped";
      const { error: err } = await getCloud()
        .database.from("payment_orders")
        .update({ fulfillment: next })
        .eq("id", o.id);
      if (err) throw new Error(err.message || JSON.stringify(err));
      setOrders((prev) => (prev || []).map((x) => (x.id === o.id ? { ...x, fulfillment: next } : x)));
    } catch (e: any) {
      setError((e && e.message) || "更新失败");
    }
  };

  // ---- 门禁 ----
  if (loading) {
    return (
      <main className="flex-1 pt-[72px]">
        <div className="flex items-center justify-center py-24">
          <Loader2 size={20} className="animate-spin text-accent/70" />
        </div>
      </main>
    );
  }
  if (!user) {
    return (
      <main className="flex-1 pt-[72px]">
        <div className="px-6 py-16">
          <SignInGate locale={locale}>
            <div />
          </SignInGate>
        </div>
      </main>
    );
  }
  if (adminState === "checking") {
    return (
      <main className="flex-1 pt-[72px]">
        <div className="flex items-center justify-center py-24">
          <Loader2 size={20} className="animate-spin text-accent/70" />
        </div>
      </main>
    );
  }
  if (adminState === "no") {
    return (
      <main className="flex-1 pt-[72px]">
        <div className="mx-auto max-w-md px-6 py-24 text-center">
          <div className="glass rounded-2xl px-8 py-12">
            <ShieldAlert size={22} className="mx-auto mb-4 text-red-300/80" />
            <p className="text-sm text-muted">无权访问 · 此页面仅限管理员</p>
            <div className="mt-5 space-y-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-left text-[10px] leading-relaxed text-muted/60">
              <p>会话邮箱：{user.email || "（空）"}</p>
              <p>服务端识别 uid：{diag && diag.uid ? diag.uid : "（空）"}</p>
              <p>服务端识别 email：{diag && diag.email ? diag.email : "（空）"}</p>
              <p className="pt-1 text-muted/40">把本卡片截图发给你的 AI 助手即可修复</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ---- 统计 ----
  const allOrders = orders || [];
  const allReadings = readings || [];
  const completed = allOrders.filter((o) => o.status === "completed");
  const revenue = completed.reduce((s, o) => s + (parseFloat(o.amount || "0") || 0), 0);
  const pendingShip = completed.filter((o) => (o.product || "").indexOf("shop:") === 0 && o.fulfillment !== "shipped");

  // ---- 流量统计（近 7 天，时区 Asia/Shanghai）----
  const allViews = views || [];
  const dayKey = (t: string) => new Date(t).toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });
  const todayKey = dayKey(new Date().toISOString());
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    days.push(dayKey(new Date(Date.now() - i * 86400000).toISOString()));
  }
  const byDay = new Map<string, { pv: number; uv: Set<string> }>();
  for (const d of days) byDay.set(d, { pv: 0, uv: new Set() });
  const uv7 = new Set<string>();
  const uvToday = new Set<string>();
  let todayPv = 0;
  const byPath = new Map<string, number>();
  for (const v of allViews) {
    const k = dayKey(v.created_at);
    const rec = byDay.get(k);
    if (rec) {
      rec.pv += 1;
      if (v.visitor_id) rec.uv.add(v.visitor_id);
    }
    if (k === todayKey) {
      todayPv += 1;
      if (v.visitor_id && v.visitor_id !== "anon") uvToday.add(v.visitor_id);
    }
    if (v.visitor_id && v.visitor_id !== "anon") uv7.add(v.visitor_id);
    byPath.set(v.path, (byPath.get(v.path) || 0) + 1);
  }
  const maxDayPv = Math.max(1, ...days.map((d) => (byDay.get(d) || { pv: 0 }).pv));
  const topPages = Array.from(byPath.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const TABS = [
    { key: "overview" as const, label: "概览", icon: <Sparkles size={14} /> },
    { key: "orders" as const, label: "订单", icon: <Wallet size={14} /> },
    { key: "readings" as const, label: "测算记录", icon: <FileText size={14} /> },
    { key: "traffic" as const, label: "流量", icon: <BarChart3 size={14} /> },
    { key: "skills" as const, label: "知识库", icon: <BookOpen size={14} /> },
  ];

  return (
    <main className="flex-1 pt-[72px]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* 头部 */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl text-foreground">管理后台</h1>
            <p className="mt-1 text-xs text-muted/70">
              痕迹 Traces · {user.email || (diag && diag.email) || "管理员"}
            </p>
          </div>
          <button
            onClick={load}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl border border-accent/25 bg-accent/10 px-4 py-2 text-xs text-accent transition hover:bg-accent/20 disabled:opacity-60"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} 刷新
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs transition ${
                tab === t.key
                  ? "bg-accent text-background"
                  : "border border-white/10 bg-white/[0.03] text-muted hover:border-accent/30"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* 概览 */}
        {tab === "overview" && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "今日访问", value: String(todayPv) },
              { label: "今日访客", value: String(uvToday.size) },
              { label: "近7日访问", value: String(allViews.length) },
              { label: "总订单", value: String(allOrders.length) },
              { label: "已收款金额", value: "$" + revenue.toFixed(2) },
              { label: "待发货（商品）", value: String(pendingShip.length) },
            ].map((c) => (
              <div key={c.label} className="glass rounded-2xl p-5">
                <p className="text-[11px] text-muted/70">{c.label}</p>
                <p className="mt-2 font-serif text-2xl text-accent">{c.value}</p>
              </div>
            ))}
            <div className="col-span-2 mt-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-[11px] leading-relaxed text-muted/70 sm:col-span-4">
              数据实时来自云端数据库；每笔 PayPal 交易另有事件台账（服务器已自动记录，含验签）。
              商品需发货时在「订单」页点「标记已发货」。
            </div>
          </div>
        )}

        {/* 订单 */}
        {tab === "orders" && (
          <div className="glass overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-[10px] uppercase tracking-wider text-muted/60">
                    <th className="px-4 py-3">时间</th>
                    <th className="px-4 py-3">商品</th>
                    <th className="px-4 py-3">金额</th>
                    <th className="px-4 py-3">买家</th>
                    <th className="px-4 py-3">交易号</th>
                    <th className="px-4 py-3">收货地址</th>
                    <th className="px-4 py-3">发货</th>
                  </tr>
                </thead>
                <tbody>
                  {allOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-muted/50">
                        {busy ? "加载中…" : "暂无订单"}
                      </td>
                    </tr>
                  )}
                  {allOrders.map((o) => (
                    <tr key={o.id} className="border-b border-white/[0.04] align-top">
                      <td className="whitespace-nowrap px-4 py-3 text-muted">{fmtTime(o.created_at)}</td>
                      <td className="px-4 py-3 text-foreground/90">{productLabel(o.product)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-accent">
                        ${o.amount || "—"} {o.currency || ""}
                      </td>
                      <td className="px-4 py-3 text-muted">{o.payer_email || "—"}</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-muted/70">{o.paypal_order_id || "—"}</td>
                      <td className="max-w-[220px] px-4 py-3 text-[11px] leading-relaxed text-muted/80">
                        {addrText(o.shipping_address) || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {(o.product || "").indexOf("shop:") === 0 ? (
                          <button
                            onClick={() => toggleShipped(o)}
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] transition ${
                              o.fulfillment === "shipped"
                                ? "border-green-500/30 bg-green-500/10 text-green-300"
                                : "border-amber-400/30 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20"
                            }`}
                          >
                            <Truck size={11} /> {o.fulfillment === "shipped" ? "已发货" : "标记已发货"}
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted/50">
                            <Package size={11} /> 数字服务
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 测算记录 */}
        {tab === "readings" && (
          <div className="glass overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-[10px] uppercase tracking-wider text-muted/60">
                    <th className="px-4 py-3">时间</th>
                    <th className="px-4 py-3">姓名</th>
                    <th className="px-4 py-3">生日 / 时辰</th>
                    <th className="px-4 py-3">性别</th>
                    <th className="px-4 py-3">焦点</th>
                    <th className="px-4 py-3">语言</th>
                    <th className="px-4 py-3">报告</th>
                  </tr>
                </thead>
                <tbody>
                  {allReadings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-muted/50">
                        {busy ? "加载中…" : "暂无测算记录"}
                      </td>
                    </tr>
                  )}
                  {allReadings.map((r) => (
                    <tr key={r.id} className="border-b border-white/[0.04]">
                      <td className="whitespace-nowrap px-4 py-3 text-muted">{fmtTime(r.created_at)}</td>
                      <td className="px-4 py-3 text-foreground/90">{r.name || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">
                        {r.birth_date} {r.birth_time || ""}
                      </td>
                      <td className="px-4 py-3 text-muted">{r.gender === "male" ? "男" : "女"}</td>
                      <td className="px-4 py-3 text-muted">{FOCUS_ZH[r.focus] || r.focus}</td>
                      <td className="px-4 py-3 text-muted/70">{r.locale}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openReport(r)}
                          className="rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-[10px] text-accent transition hover:bg-accent/20"
                        >
                          查看
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 流量 */}
        {tab === "traffic" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "今日访问（PV）", value: String(todayPv) },
                { label: "今日访客（UV）", value: String(uvToday.size) },
                { label: "近7日访问（PV）", value: String(allViews.length) },
                { label: "近7日访客（UV）", value: String(uv7.size) },
              ].map((c) => (
                <div key={c.label} className="glass rounded-2xl p-5">
                  <p className="text-[11px] text-muted/70">{c.label}</p>
                  <p className="mt-2 font-serif text-2xl text-accent">{c.value}</p>
                </div>
              ))}
            </div>

            {/* 7 日柱状图 */}
            <div className="glass rounded-2xl p-5">
              <p className="mb-4 flex items-center gap-1.5 text-xs text-muted/70">
                <Eye size={12} /> 近 7 天访问（PV）
              </p>
              <div className="flex items-end gap-2" style={{ height: 140 }}>
                {days.map((d) => {
                  const rec = byDay.get(d) || { pv: 0, uv: new Set<string>() };
                  const h = Math.round((rec.pv / maxDayPv) * 100);
                  return (
                    <div key={d} className="flex flex-1 flex-col items-center justify-end gap-1.5" style={{ height: "100%" }}>
                      <span className="text-[10px] text-muted/70">{rec.pv}</span>
                      <div
                        className="w-full rounded-t bg-accent/60"
                        style={{ height: Math.max(2, h) + "%" }}
                        title={d + " · PV " + rec.pv + " · UV " + rec.uv.size}
                      />
                      <span className="text-[9px] text-muted/50">{d.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-[10px] leading-relaxed text-muted/50">
                统计为匿名访问（无 IP/设备信息）；不含后台、账户页与站主本人的访问。UV = 去重访客数（浏览器维度）。
              </p>
            </div>

            {/* 热门页面 */}
            <div className="glass rounded-2xl p-5">
              <p className="mb-3 flex items-center gap-1.5 text-xs text-muted/70">
                <Users size={12} /> 热门页面（近 7 天）
              </p>
              {topPages.length === 0 && (
                <p className="py-5 text-center text-[11px] text-muted/50">暂无数据</p>
              )}
              {topPages.map(([p, n]) => {
                const max = topPages[0][1] || 1;
                return (
                  <div key={p} className="mb-2.5 flex items-center gap-3">
                    <span className="w-44 truncate font-mono text-[11px] text-muted">{p}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded bg-white/[0.04]">
                      <div className="h-full rounded bg-accent/60" style={{ width: Math.round((n / max) * 100) + "%" }} />
                    </div>
                    <span className="w-10 text-right text-[11px] text-accent">{n}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 知识库 */}
        {tab === "skills" && <AdminSkills />}
      </div>

      {/* 报告查看弹层 */}
      {openReading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setOpenReading(null)}>
          <div
            className="glass max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-lg text-accent">
                {openReading.name || "未具名"} · {openReading.birth_date} {openReading.birth_time || ""}
              </h3>
              <button onClick={() => setOpenReading(null)} className="text-muted transition hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="whitespace-pre-wrap text-xs leading-relaxed text-muted">
              {openReading.report === "" ? (
                <span className="inline-flex items-center gap-2"><Loader2 size={13} className="animate-spin" /> 加载中…</span>
              ) : (
                openReading.report
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
