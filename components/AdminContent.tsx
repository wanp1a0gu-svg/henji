"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw, Package, FileText, Wallet, Sparkles, Truck, X, ShieldAlert, BarChart3, Eye, Users, BookOpen, Coins, Globe, RotateCcw, Search, Download, Boxes, DatabaseBackup } from "lucide-react";
import { Locale } from "@/lib/i18n";
import { ADMIN_EMAILS } from "@/lib/site-config";
import { getCloud } from "@/lib/cloud";
import { SHOP_PRODUCTS } from "@/lib/shop-data";
import { useAuth } from "./AuthProvider";
import { SignInGate } from "./SignInGate";
import { notifyOrder, shipToText } from "@/lib/notify";
import { AdminSkills } from "./AdminSkills";
import { AdminWallet } from "./AdminWallet";
import { AdminStock } from "./AdminStock";
import { AdminBackup } from "./AdminBackup";
import { AdminAccessLog } from "./AdminAccessLog";

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
  owner_id?: string | null;
  payer_note?: string | null;
  tracking_number?: string | null;
  carrier?: string | null;
  capture_raw?: any;
}

interface PageView {
  path: string;
  locale: string | null;
  ip: string | null;
  visitor_id: string | null;
  user_agent?: string | null;
  referrer?: string | null;
  user_id?: string | null;
  user_email?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  isp?: string | null;
  ip_kind?: string | null;
  tz?: string | null;
  created_at: string;
}

/** UA → 系统 · 浏览器（够用就好，不引入 UA 解析库） */
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
  const bot = /bot|crawl|spider|headless/.test(s) ? "机器人" : "";
  return [os, br, bot].filter(Boolean).join(" · ") || "其他";
};

/** 来源：站内跳转 / 外部域名 / 直接访问 */
const sourceOf = (ref?: string | null) => {
  if (!ref) return "直接访问";
  try {
    const u = new URL(ref);
    if (u.hostname.indexOf("mingli-club") !== -1 || u.hostname === "localhost") return "站内跳转";
    return u.hostname;
  } catch {
    return String(ref).slice(0, 40);
  }
};

const geoOf = (v: PageView) => {
  const parts = [v.country, v.region, v.city].filter(Boolean);
  return parts.length ? parts.join(" / ") : "—";
};

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
  if (product === "bazi") return "八字测算 $6.80";
  if (product.indexOf("shop:") === 0) {
    const p = SHOP_PRODUCTS.find((x) => x.id === product.slice(5));
    return p ? p.nameZh : product;
  }
  return product;
};

const addrText = (s: any) => {
  if (!s) return "";
  try {
    // 站内下单表单收集的格式 { name, phone, country, province, city, address, zip }
    if (s.name || s.phone || s.address) {
      const place = [s.country, s.province, s.city].filter(Boolean).join(" ");
      return [s.name ? "收件人 " + s.name : "", s.phone, place, s.address, s.zip]
        .filter(Boolean)
        .join(" · ");
    }
    // PayPal 返回的格式（address_line_1 / admin_area_2 ...）
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
  const [tab, setTab] = useState<
    "overview" | "orders" | "stock" | "readings" | "traffic" | "skills" | "wallet" | "backup"
  >("overview");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [readings, setReadings] = useState<Reading[] | null>(null);
  const [views, setViews] = useState<PageView[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [refunding, setRefunding] = useState<number | null>(null);
  const [mailStatus, setMailStatus] = useState<any>(null);
  const [mailBusy, setMailBusy] = useState(false);
  const [openReading, setOpenReading] = useState<Reading | null>(null);
  // 订单筛选（2026-10-29）
  const [oQuery, setOQuery] = useState("");
  const [oStatus, setOStatus] = useState<"all" | "pending" | "shipped" | "refunded" | "digital">("all");
  // 访问明细筛选
  const [vQuery, setVQuery] = useState("");
  // 后台访问日志：每次进入只记一条
  const accessLoggedRef = useRef("");

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
          .select("id,created_at,product,amount,currency,payer_email,owner_id,payer_note,status,fulfillment,shipping_address,paypal_order_id,tracking_number,carrier")
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
          .select("path,locale,ip,visitor_id,user_agent,referrer,user_id,user_email,country,region,city,isp,ip_kind,tz,created_at")
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

  /** 发货 -1 / 退款 +1（只对实体商品；定制款不限量则跳过） */
  const adjustStock = async (product: string | null, delta: number) => {
    if (!product || product.indexOf("shop:") !== 0) return;
    const id = product.slice(5);
    try {
      const { data } = await getCloud()
        .database.from("product_stock")
        .select("stock, unlimited")
        .eq("product", id)
        .limit(1);
      const row: any = data && data[0];
      if (!row || row.unlimited) return;
      const next = Math.max(0, (Number(row.stock) || 0) + delta);
      await getCloud()
        .database.from("product_stock")
        .update({ stock: next, updated_at: new Date().toISOString() })
        .eq("product", id);
    } catch {
      /* 库存不是关键路径，失败不打断发货/退款 */
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
      // 首次标记发货 → 扣一件库存（取消标记则还回去）
      if (next === "shipped") await adjustStock(o.product, -1);
      else if (o.fulfillment === "shipped") await adjustStock(o.product, +1);
    } catch (e: any) {
      setError((e && e.message) || "更新失败");
    }
  };

  // 邮件通道状态（仅在后台展示，失败不影响任何功能）
  // ⚠️ 必须放在上面的门禁 return 之前：hook 一旦写在「提前 return」之后，
  //    登录后从 loading 切到后台时 hook 数量变化 → React #310 整页崩溃（11-02 踩过）
  useEffect(() => {
    fetch("/api/mail/status")
      .then((r) => r.json())
      .then(setMailStatus)
      .catch(() => setMailStatus({ configured: false, hint: "无法获取" }));
  }, []);

  // 后台访问日志：登录态与管理员校验都就绪后记一条（含被拒的尝试）
  // ⚠️ 必须在门禁 return 之前，否则登录后 hook 数变化会崩（React #310）
  useEffect(() => {
    if (loading || !user) return;
    if (adminState === "checking") return;
    const key = String(user.id) + ":" + adminState;
    if (accessLoggedRef.current === key) return;
    accessLoggedRef.current = key;

    (async () => {
      try {
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
          /* 拿不到就留空 */
        }
        const geo = (info && info.geo) || {};
        const cut = (v: any, n: number) => (v ? String(v).slice(0, n) : null);

        await getCloud()
          .database.from("admin_access_log")
          .insert({
            user_id: String(user.id),
            user_email: user.email || null,
            allowed: adminState === "yes",
            path: typeof location !== "undefined" ? location.pathname : null,
            locale,
            ip: info && info.ip ? String(info.ip) : null,
            user_agent: cut(typeof navigator !== "undefined" ? navigator.userAgent : "", 300),
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
      } catch {
        /* 日志失败不影响后台使用 */
      }
    })();
  }, [user, loading, adminState, locale]);

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
            <div className="mt-5 space-y-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-start text-[10px] leading-relaxed text-muted/60">
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
  /** 填写/修改运单号（实体商品） */
  const editTracking = async (o: Order) => {
    const carrier = window.prompt("承运商（如 China Post / 4PX / DHL / YunExpress）", o.carrier || "");
    if (carrier === null) return;
    const num = window.prompt("运单号（留空表示清除）", o.tracking_number || "");
    if (num === null) return;
    const patch = {
      carrier: carrier.trim() || null,
      tracking_number: num.trim() || null,
    };
    try {
      await getCloud().database.from("payment_orders").update(patch).eq("id", o.id);
      setOrders((prev) => (prev || []).map((x) => (x.id === o.id ? { ...x, ...patch } : x)));
      if (patch.tracking_number) {
        notifyOrder("shipped", o.payer_email, "zh", {
          id: o.id,
          product: o.product || "",
          productName: productLabel(o.product),
          tracking: patch.tracking_number,
          carrier: patch.carrier || "",
          shipTo: shipToText(o.shipping_address),
        });
      }
    } catch (e: any) {
      alert("运单号保存失败：" + ((e && e.message) || ""));
    }
  };

  /** 余额支付的退款：调 wallet_grant 退回买家钱包，再把订单标记为已退款 */
  const refundBalance = async (o: Order) => {
    // 老订单可能没记 payer_email，用 owner_id 到钱包账户里反查
    let email = o.payer_email || "";
    if (!email && o.owner_id) {
      try {
        const { data } = await getCloud()
          .database.from("wallet_accounts")
          .select("owner_email")
          .eq("owner_id", o.owner_id)
          .limit(1);
        email = (data && data[0] && data[0].owner_email) || "";
      } catch {
        /* 忽略 */
      }
    }
    if (!email) {
      alert("这笔订单查不到买家邮箱，无法退款。请到「钱包」标签手动处理。");
      return;
    }
    if (!window.confirm("确认把 $" + (o.amount || "?") + " 退回 " + email + " 的钱包？")) return;
    setRefunding(o.id);
    try {
      const { error } = await getCloud().database.rpc("wallet_grant", {
        p_email: email,
        p_amount: Number(o.amount || 0),
        p_note: "订单退款 #" + o.id + " " + (o.product || ""),
      });
      if (error) throw new Error(error.message || "钱包退款失败");

      await getCloud()
        .database.from("payment_orders")
        .update({ status: "refunded", fulfillment: null })
        .eq("id", o.id);
      setOrders((prev) =>
        (prev || []).map((x) => (x.id === o.id ? { ...x, status: "refunded", fulfillment: null } : x))
      );
      // 还没发货就退款 → 货还在手上，库存还回去
      if (o.fulfillment !== "shipped") await adjustStock(o.product, +1);
      notifyOrder("refunded", email, "zh", {
        id: o.id,
        product: o.product || "",
        productName: productLabel(o.product),
        amount: o.amount || "",
        currency: "USD",
        method: "balance",
      });
      alert("已退回买家钱包：" + email + "（退款通知已发送）");
    } catch (e: any) {
      alert("退款失败：" + ((e && e.message) || "未知错误"));
    } finally {
      setRefunding(null);
    }
  };

  /** PayPal 退款：服务端用 ADMIN_REFUND_TOKEN 校验后调 PayPal refundCapture */
  const refundOrder = async (o: Order) => {
    if (!o.paypal_order_id) {
      alert("这笔是余额支付，没有 PayPal 订单号。请到「钱包」标签手动返还余额。");
      return;
    }
    let tk = "";
    try {
      tk = sessionStorage.getItem("traces_refund_token") || "";
    } catch {
      tk = "";
    }
    if (!tk) {
      const input = window.prompt(
        "首次退款需要令牌：server-config.json 里的 ADMIN_REFUND_TOKEN"
      );
      if (!input || !input.trim()) return;
      tk = input.trim();
      try {
        sessionStorage.setItem("traces_refund_token", tk);
      } catch {
        /* 忽略 */
      }
    }
    if (!window.confirm("确认全额退款 $" + (o.amount || "?") + " 给 " + (o.payer_email || "该客户") + "？\n此操作不可撤销。")) {
      return;
    }
    setRefunding(o.id);
    try {
      const r = await fetch("/api/paypal/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: o.paypal_order_id, token: tk }),
      });
      const j = (await r.json()) as { ok?: boolean; refundId?: string; amount?: string; currency?: string; message?: string; error?: string };
      if (!r.ok) throw new Error(j.message || j.error || "退款失败");

      try {
        await getCloud()
          .database.from("payment_orders")
          .update({ status: "refunded", capture_raw: { ...(o.capture_raw || {}), refund: j } })
          .eq("id", o.id);
      } catch {
        /* 状态回写失败不影响已退款事实 */
      }
      setOrders((prev) => (prev || []).map((x) => (x.id === o.id ? { ...x, status: "refunded" } : x)));
      if (o.fulfillment !== "shipped") await adjustStock(o.product, +1);
      notifyOrder("refunded", o.payer_email, "zh", {
        id: o.id,
        product: o.product || "",
        productName: productLabel(o.product),
        amount: j.amount || o.amount || "",
        currency: j.currency || "USD",
        method: "paypal",
      });
      alert("退款成功：" + (j.refundId || "") + "（" + (j.amount || "") + " " + (j.currency || "") + "）");
    } catch (e: any) {
      alert("退款失败：" + ((e && e.message) || "未知错误"));
    } finally {
      setRefunding(null);
    }
  };

  const pendingShip = completed.filter((o) => (o.product || "").indexOf("shop:") === 0 && o.fulfillment !== "shipped");

  /** 关键词能匹配：订单号 / 买家邮箱 / 商品名 / 收货信息 / 运单号 */
  const orderSearchKey = (o: Order) =>
    [
      o.id,
      o.payer_email,
      o.payer_note,
      productLabel(o.product),
      addrText(o.shipping_address),
      o.tracking_number,
      o.carrier,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  const isShop = (o: Order) => (o.product || "").indexOf("shop:") === 0;
  const filteredOrders = allOrders.filter((o) => {
    if (oStatus === "refunded" && o.status !== "refunded") return false;
    if (oStatus !== "refunded" && o.status === "refunded") return false;
    if (oStatus === "pending" && !(isShop(o) && o.fulfillment !== "shipped")) return false;
    if (oStatus === "shipped" && !(isShop(o) && o.fulfillment === "shipped")) return false;
    if (oStatus === "digital" && isShop(o)) return false;
    const q = oQuery.trim().toLowerCase();
    if (!q) return true;
    return orderSearchKey(o).indexOf(q) !== -1;
  });
  const filteredAmount = filteredOrders
    .filter((o) => o.status !== "refunded")
    .reduce((sum, o) => sum + (parseFloat(o.amount || "0") || 0), 0);

  /** 导出当前筛选结果为 CSV（Excel 直接打开不乱码：加 BOM + CRLF） */
  const exportOrdersCsv = () => {
    const head = [
      "订单号",
      "下单时间",
      "商品",
      "金额",
      "币种",
      "买家邮箱",
      "支付方式",
      "PayPal交易号",
      "收货信息",
      "发货状态",
      "运单号",
      "承运商",
      "订单状态",
      "备注",
    ];
    const body = filteredOrders.map((o) => [
      o.id,
      fmtTime(o.created_at),
      productLabel(o.product),
      o.amount || "",
      o.currency || "",
      o.payer_email || "",
      o.paypal_order_id ? "PayPal" : "余额/站内",
      o.paypal_order_id || "",
      addrText(o.shipping_address) || "",
      isShop(o) ? (o.fulfillment === "shipped" ? "已发货" : "待发货") : "数字服务",
      o.tracking_number || "",
      o.carrier || "",
      o.status === "refunded" ? "已退款" : o.status || "",
      o.payer_note || "",
    ]);
    const esc = (v: any) => `"${String(v === null || v === undefined ? "" : v).replace(/"/g, '""')}"`;
    const csv = "\ufeff" + [head, ...body].map((r) => r.map(esc).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `traces-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

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

  // 访问明细：关键词筛选 + 独立 IP 统计
  const vFiltered = allViews.filter((v) => {
    const q = vQuery.trim().toLowerCase();
    if (!q) return true;
    return [v.ip, v.user_email, v.path, v.city, v.region, v.country, v.isp, v.referrer, v.visitor_id]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .indexOf(q) !== -1;
  });
  const uniqueIpCount = new Set(allViews.map((v) => v.ip).filter(Boolean)).size;
  const loggedInViews = allViews.filter((v) => v.user_email).length;

  /** 导出访问明细 CSV（当前筛选结果） */
  const exportViewsCsv = () => {
    const head = [
      "时间", "页面", "语言", "用户", "访客ID", "IP", "国家", "省/州", "城市", "运营商", "设备", "来源",
    ];
    const body = vFiltered.map((v) => [
      fmtTime(v.created_at),
      v.path,
      v.locale || "",
      v.user_email || (v.user_id ? "已登录（无邮箱）" : "游客"),
      v.visitor_id || "",
      v.ip || "",
      v.country || "",
      v.region || "",
      v.city || "",
      v.isp || "",
      deviceOf(v.user_agent),
      sourceOf(v.referrer),
    ]);
    const esc = (x: any) => `"${String(x === null || x === undefined ? "" : x).replace(/"/g, '""')}"`;
    const csv = "\ufeff" + [head, ...body].map((r) => r.map(esc).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `traces-visits-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const TABS = [
    { key: "overview" as const, label: "概览", icon: <Sparkles size={14} /> },
    { key: "orders" as const, label: "订单", icon: <Wallet size={14} /> },
    { key: "stock" as const, label: "库存", icon: <Boxes size={14} /> },
    { key: "wallet" as const, label: "钱包", icon: <Coins size={14} /> },
    { key: "readings" as const, label: "测算记录", icon: <FileText size={14} /> },
    { key: "traffic" as const, label: "流量", icon: <BarChart3 size={14} /> },
    { key: "skills" as const, label: "知识库", icon: <BookOpen size={14} /> },
    { key: "backup" as const, label: "备份", icon: <DatabaseBackup size={14} /> },
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
        <div className="mb-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs transition ${
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
          <div className="space-y-4">
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

            {/* 发信通道状态 */}
            <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4">
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    mailStatus && mailStatus.configured ? "bg-green-400" : "bg-amber-400"
                  }`}
                />
                <span className="text-muted">
                  发信通道：
                  {mailStatus && mailStatus.configured
                    ? (mailStatus.provider === "smtp" ? "SMTP 已配置" : "Resend 已配置") +
                      (mailStatus.from ? " · " + mailStatus.from : "")
                    : "未配置" + (mailStatus && mailStatus.hint ? "（" + mailStatus.hint + "）" : "")}
                </span>
              </div>
              <button
                onClick={async () => {
                  let tk = "";
                  try {
                    tk = sessionStorage.getItem("traces_refund_token") || "";
                  } catch {
                    tk = "";
                  }
                  if (!tk) {
                    const input = window.prompt("发信测试需要令牌：server-config.json 里的 ADMIN_REFUND_TOKEN");
                    if (!input) return;
                    tk = input.trim();
                    try {
                      sessionStorage.setItem("traces_refund_token", tk);
                    } catch {}
                  }
                  const to = window.prompt("发到哪个邮箱？", "");
                  if (!to) return;
                  setMailBusy(true);
                  try {
                    const r = await fetch("/api/mail/test", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ to, token: tk, type: "test", locale: "zh" }),
                    });
                    const j = (await r.json()) as { ok?: boolean; reason?: string; error?: string };
                    if (r.ok && j.ok) alert("测试邮件已发出，请查收（也看看垃圾箱）。");
                    else alert("没发出去：" + (j.reason || j.error || r.status));
                  } catch (e: any) {
                    alert("请求失败：" + ((e && e.message) || ""));
                  } finally {
                    setMailBusy(false);
                  }
                }}
                disabled={mailBusy}
                className="rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-[11px] text-accent transition hover:bg-accent/20 disabled:opacity-50"
              >
                {mailBusy ? "发送中…" : "发送测试邮件"}
              </button>
            </div>
          </div>
        )}

        {/* 订单 */}

        {tab === "orders" && (
          <div>
          <div className="mb-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1">
                <Search size={13} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted/50" />
                <input
                  value={oQuery}
                  onChange={(e) => setOQuery(e.target.value)}
                  placeholder="搜订单号 / 邮箱 / 商品 / 收件人 / 运单号"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 pe-3 ps-8 text-xs text-foreground placeholder:text-muted/40 focus:border-accent/40 focus:outline-none"
                />
              </div>
              <button
                onClick={exportOrdersCsv}
                disabled={filteredOrders.length === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-accent/25 bg-accent/10 px-3.5 py-2 text-xs text-accent transition hover:bg-accent/20 disabled:opacity-40"
              >
                <Download size={13} /> 导出 CSV
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {([
                { k: "all" as const, label: "全部", n: allOrders.filter((o) => o.status !== "refunded").length },
                { k: "pending" as const, label: "待发货", n: allOrders.filter((o) => isShop(o) && o.status !== "refunded" && o.fulfillment !== "shipped").length },
                { k: "shipped" as const, label: "已发货", n: allOrders.filter((o) => isShop(o) && o.status !== "refunded" && o.fulfillment === "shipped").length },
                { k: "digital" as const, label: "数字服务", n: allOrders.filter((o) => !isShop(o) && o.status !== "refunded").length },
                { k: "refunded" as const, label: "已退款", n: allOrders.filter((o) => o.status === "refunded").length },
              ]).map((f) => (
                <button
                  key={f.k}
                  onClick={() => setOStatus(f.k)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] transition ${
                    oStatus === f.k
                      ? "bg-accent text-background"
                      : "border border-white/10 bg-white/[0.03] text-muted hover:border-accent/30"
                  }`}
                >
                  {f.label}
                  <span className={oStatus === f.k ? "text-background/70" : "text-muted/50"}>{f.n}</span>
                </button>
              ))}
              <span className="ms-auto text-[11px] text-muted/60">
                共 {filteredOrders.length} 笔 · 合计 ${filteredAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="glass overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-start text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-[10px] uppercase tracking-wider text-muted/60">
                    <th className="px-4 py-3">时间</th>
                    <th className="px-4 py-3">商品</th>
                    <th className="px-4 py-3">金额</th>
                    <th className="px-4 py-3">买家</th>
                    <th className="px-4 py-3">交易号</th>
                    <th className="px-4 py-3">收货地址</th>
                    <th className="px-4 py-3">发货</th>
                    <th className="px-4 py-3">运单号</th>
                    <th className="px-4 py-3">退款</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-muted/50">
                        {busy ? "加载中…" : allOrders.length === 0 ? "暂无订单" : "没有符合筛选条件的订单"}
                      </td>
                    </tr>
                  )}
                  {filteredOrders.map((o) => (
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
                      <td className="px-4 py-3">
                        {(o.product || "").indexOf("shop:") === 0 ? (
                          <button onClick={() => editTracking(o)} className="text-left">
                            {o.tracking_number ? (
                              <>
                                <span className="block font-mono text-[10px] text-accent">{o.tracking_number}</span>
                                <span className="block text-[9px] text-muted/60">{o.carrier || "—"}</span>
                              </>
                            ) : (
                              <span className="text-[10px] text-muted/50 transition hover:text-accent">填写运单号</span>
                            )}
                          </button>
                        ) : (
                          <span className="text-[10px] text-muted/30">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {o.status === "refunded" ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-muted/50">
                            已退款
                          </span>
                        ) : o.paypal_order_id ? (
                          <button
                            onClick={() => refundOrder(o)}
                            disabled={refunding === o.id}
                            className="inline-flex items-center gap-1 rounded-full border border-red-400/30 bg-red-400/10 px-2.5 py-1 text-[10px] text-red-300 transition hover:bg-red-400/20 disabled:opacity-50"
                          >
                            <RotateCcw size={11} />
                            {refunding === o.id ? "退款中…" : "退款"}
                          </button>
                        ) : (
                          <button
                            onClick={() => refundBalance(o)}
                            disabled={refunding === o.id}
                            className="inline-flex items-center gap-1 rounded-full border border-red-400/30 bg-red-400/10 px-2.5 py-1 text-[10px] text-red-300 transition hover:bg-red-400/20 disabled:opacity-50"
                          >
                            <RotateCcw size={11} />
                            {refunding === o.id ? "退款中…" : "退余额"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        )}

        {/* 测算记录 */}
        {tab === "readings" && (
          <div className="glass overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-start text-xs">
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
            <AdminAccessLog />
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
                记录页面路径、语言、随机访客 ID、公网 IP、IP 归属地、浏览器 UA 与来源页；登录用户额外记邮箱。
                不含后台、账户页与站主本人的访问。UV = 去重访客数（浏览器维度）。
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
                    <span className="w-10 text-end text-[11px] text-accent">{n}</span>
                  </div>
                );
              })}
            </div>

            {/* 访问明细：IP / 归属地 / 用户 / 设备 / 来源 */}
            <div className="glass overflow-hidden rounded-2xl">
              <div className="flex flex-wrap items-center gap-2 px-5 py-4">
                <p className="flex items-center gap-1.5 text-xs text-muted/70">
                  <Globe size={12} /> 访问明细
                  <span className="text-muted/40">
                    （{vFiltered.length} 条 · 独立 IP {uniqueIpCount} · 已登录 {loggedInViews} 次）
                  </span>
                </p>
                <div className="ms-auto flex items-center gap-2">
                  <input
                    value={vQuery}
                    onChange={(e) => setVQuery(e.target.value)}
                    placeholder="搜 IP / 邮箱 / 页面 / 城市"
                    className="w-52 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-foreground placeholder:text-muted/40 focus:border-accent/40 focus:outline-none"
                  />
                  <button
                    onClick={exportViewsCsv}
                    disabled={vFiltered.length === 0}
                    className="inline-flex items-center gap-1 rounded-lg border border-accent/25 bg-accent/10 px-3 py-1.5 text-[11px] text-accent transition hover:bg-accent/20 disabled:opacity-40"
                  >
                    <Download size={11} /> 导出 CSV
                  </button>
                </div>
              </div>

              <div className="max-h-[520px] overflow-auto border-t border-white/[0.06]">
                <table className="w-full min-w-[1040px] text-start text-[11px]">
                  <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur">
                    <tr className="border-b border-white/[0.08] text-[10px] uppercase tracking-wider text-muted/60">
                      <th className="px-4 py-2 font-normal">时间</th>
                      <th className="px-2 py-2 font-normal">页面</th>
                      <th className="px-2 py-2 font-normal">用户</th>
                      <th className="px-2 py-2 font-normal">IP</th>
                      <th className="px-2 py-2 font-normal">归属地</th>
                      <th className="px-2 py-2 font-normal">运营商</th>
                      <th className="px-2 py-2 font-normal">设备</th>
                      <th className="px-2 py-2 font-normal">来源</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vFiltered.slice(0, 300).map((v, i) => (
                      <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                        <td className="whitespace-nowrap px-4 py-2 text-muted">{fmtTime(v.created_at)}</td>
                        <td className="px-2 py-2 font-mono text-foreground/80">{v.path}</td>
                        <td className="max-w-[180px] px-2 py-2">
                          {v.user_email ? (
                            <span className="inline-flex items-center gap-1 text-accent/90">
                              <span className="truncate">{v.user_email}</span>
                            </span>
                          ) : v.user_id ? (
                            <span className="text-sky-300/70">已登录（无邮箱）</span>
                          ) : (
                            <span className="text-muted/50">
                              游客 · {(v.visitor_id || "").slice(0, 8) || "—"}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 font-mono text-accent/80">
                          {v.ip || "—"}
                          {v.ip_kind === "idc" && (
                            <span className="ms-1 rounded border border-amber-400/30 bg-amber-400/10 px-1 py-0.5 text-[9px] text-amber-200/90">
                              机房/代理
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-muted/80">{geoOf(v)}</td>
                        <td className="max-w-[140px] truncate px-2 py-2 text-muted/60">{v.isp || "—"}</td>
                        <td className="whitespace-nowrap px-2 py-2 text-muted/70">{deviceOf(v.user_agent)}</td>
                        <td className="max-w-[150px] truncate px-2 py-2 text-muted/60">{sourceOf(v.referrer)}</td>
                      </tr>
                    ))}
                    {vFiltered.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-5 py-8 text-center text-[11px] text-muted/50">
                          {allViews.length === 0 ? "暂无数据" : "没有符合筛选条件的记录"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <p className="border-t border-white/[0.06] px-5 py-3 text-[10px] leading-relaxed text-muted/40">
                归属地由服务端按 IP 反查（ipwho.is / ip-api），仅供内部参考、不保证精确：中国大陆一般到城市级，
                海外多为国家级；运营商=接入商。登录用户才会记录邮箱，游客只显示匿名访客 ID。仅管理员可见。
              </p>
            </div>
          </div>
        )}

        {/* 知识库 */}
        {tab === "stock" && <AdminStock />}
        {tab === "wallet" && <AdminWallet />}
        {tab === "skills" && <AdminSkills />}
        {tab === "backup" && <AdminBackup />}
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
