"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Shield, FileText, Loader2, RefreshCw, CheckCircle2, CloudUpload, Lock } from "lucide-react";
import { Locale, Messages } from "@/lib/i18n";
import { getAuthMessages } from "@/lib/auth-i18n";
import { getPayMessages } from "@/lib/pay-i18n";
import { getBaziResumeMessages } from "@/lib/bazi-resume-i18n";
import { getUiMessages } from "@/lib/ui-i18n";
import { notifyReport } from "@/lib/notify";
import { getCloud } from "@/lib/cloud";
import { useAuth } from "./AuthProvider";
import { SignInGate } from "./SignInGate";
import { ShareBar } from "./ShareButton";
import { TalismanAdvice } from "./TalismanAdvice";
import { PayPalButton } from "./PayPalButton";
import { BalancePayButton } from "./BalancePayButton";
import { Select } from "./Select";
import { BaziChart, type BaziChartData } from "./BaziChart";
import { BaziPdfExport } from "./BaziPdfExport";

/**
 * 未完成的测算任务存本地：付费报告生成要 90–130 秒，用户中途刷新/关页时
 * jobId 不能丢，否则凭据已被消费、任务还在服务端跑，用户却拿不到报告。
 * 30 分钟与服务端 _jobs 的 TTL 对齐。
 */
const PENDING_KEY = "traces_bazi_pending_v1";
const PENDING_TTL_MS = 30 * 60 * 1000;

type PendingJob = { jobId: string; createdAt: number; form: Record<string, string> };

function readPendingJob(): PendingJob | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PendingJob;
    if (!p || !p.jobId || !p.form) return null;
    if (Date.now() - Number(p.createdAt || 0) > PENDING_TTL_MS) {
      localStorage.removeItem(PENDING_KEY);
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

function writePendingJob(jobId: string, form: Record<string, string>) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ jobId, createdAt: Date.now(), form }));
  } catch {
    /* 隐私模式等场景禁写 localStorage：不影响本次流程 */
  }
}

function clearPendingJob() {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* 忽略 */
  }
}

/** 同源 API 优先（workbuddy 域名下的 server.js），失败时回退 Cloudflare Worker。 */
// 只走同源服务端：付费校验在这里，不能再保留任何绕过端点
const API_ENDPOINTS = ["/api/bazi"];

/**
 * 轮询异步生成任务（同源 API 模式：POST 返回 jobId → GET ?id= 查状态）。
 * 返回 { report, chart } 成功；{ error } 任务失败；null 超时/不存在。
 */
async function pollReading(
  baseUrl: string,
  jobId: string
): Promise<{ report?: string; chart?: any; tier?: string; error?: string } | null> {
  const deadline = Date.now() + 240000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000));
    try {
      const res = await fetch(`${baseUrl}?id=${encodeURIComponent(jobId)}`);
      if (res.status === 404) return null;
      if (!res.ok) continue;
      const j = (await res.json()) as any;
      if (j.status === "done") return { report: j.report, chart: j.chart, tier: j.tier };
      if (j.status === "error") return { error: j.error || "" };
    } catch {
      /* 网络抖动 → 继续轮询 */
    }
  }
  return null;
}

export function BaziContent({ messages, locale }: { messages: Messages; locale: Locale }) {
  const ui = getUiMessages(locale);
  const t = (key: string) => {
    const parts = key.split(".");
    let value: any = messages;
    for (const part of parts) value = value?.[part];
    return value || key;
  };
  const a = getAuthMessages(locale);
  const pay = getPayMessages(locale);
  const { user, openAuth } = useAuth();

  const [form, setForm] = useState({
    name: "",
    birthDate: "",
    birthTime: "",
    place: "",
    gender: "",
    focus: "general",
  });
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");
  const [chart, setChart] = useState<BaziChartData | null>(null);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [paid, setPaid] = useState(false); // 本会话已完成支付
  const [receipt, setReceipt] = useState<any>(null); // 付款凭据（服务端据此放行）
  const [tier, setTier] = useState<"free" | "full">("free"); // 当前报告档位
  const [payHint, setPayHint] = useState("");
  const [resumedNotice, setResumedNotice] = useState(false); // 本次报告是刷新后自动接回来的
  const resumeMsg = getBaziResumeMessages(locale);

  const saveReading = async (
    reportText: string,
    chartData: BaziChartData | null = chart,
    birthPlace: string = form.place,
    tierValue: "free" | "full" = tier,
    snapshot: Record<string, string> = form as unknown as Record<string, string>
  ) => {
    if (!user) return;
    setSaveState("saving");
    try {
      const { error: saveErr } = await getCloud()
        .database.from("readings")
        .insert({
          name: snapshot.name || null,
          birth_date: snapshot.birthDate,
          birth_time: snapshot.birthTime || null,
          gender: snapshot.gender,
          focus: snapshot.focus,
          locale,
          report: reportText,
          // 存命盘/出生地/档位：个人中心导出 PDF 时能把四柱、大运、神煞一起画回去
          place: birthPlace || null,
          chart: chartData || null,
          tier: tierValue,
        });
      setSaveState(saveErr ? "error" : "saved");
    } catch {
      setSaveState("error");
    }
  };

  /** 拿到报告后的统一收尾：上屏 → 发信 → 存档（正常生成与断点恢复共用） */
  const applySuccess = (result: any, snapshot: Record<string, string>, isResumed = false) => {
    setReport(result.report);
    setChart(result.chart || null);
    setTier(result.tier === "full" ? "full" : "free");
    setResumedNotice(isResumed);
    // 只有付过款的完整报告才发信；免费档不打扰用户
    if (result.tier === "full" && user && user.email) {
      notifyReport(user.email, locale, snapshot.name || "");
    }
    saveReading(
      result.report,
      result.chart || null,
      snapshot.place || "",
      result.tier === "full" ? "full" : "free",
      snapshot
    );
  };

  // 游客付费时报告只存在浏览器里：登录后自动补存，避免"关掉页面就没了"
  useEffect(() => {
    if (user && report && saveState === "idle") {
      saveReading(report);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, report, saveState]);

  /**
   * 断点续取：上次生成到一半就刷新/关页了，这里把没做完的任务接回来。
   * 付费凭据是一次性的，报告丢了没法重跑，所以这一步是兜底。
   */
  const resumeTried = useRef(false);
  useEffect(() => {
    // 不依赖登录态：会话短暂未就绪时也能先把任务接回来（存档仍等登录后补写）
    if (resumeTried.current) return;
    const pending = readPendingJob();
    if (!pending) return;
    resumeTried.current = true;
    setForm(pending.form as any);
    setLoading(true);
    setError("");
    (async () => {
      const polled = await pollReading("/api/bazi", pending.jobId);
      if (polled && polled.report) {
        applySuccess(
          { report: polled.report, chart: polled.chart, tier: polled.tier },
          pending.form,
          true
        );
        clearPendingJob();
      } else {
        // 任务过期/不存在：清掉标记，让用户重新发起
        clearPendingJob();
        setError(polled && polled.error ? polled.error : t("bazi.error"));
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (rc: any = receipt) => {
    if (!form.birthDate || !form.gender) {
      setError(t("bazi.required"));
      return;
    }
    setLoading(true);
    setError("");
    setReport("");
    setChart(null);
    setSaveState("idle");
    setResumedNotice(false);
    try {
      let success: any = null;
      let apiError = "";
      let hardFailure = false; // 任务报错 or 未付款：断点不再重试
      for (const url of API_ENDPOINTS) {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, locale, receipt: rc }),
          });
          const ct = res.headers.get("content-type") || "";
          // 非 JSON 响应（静态主机的 404 页等）→ 尝试下一个端点
          if (!ct.includes("application/json")) continue;
          const data = (await res.json()) as any;
          // 付费墙：未付款/凭据无效，不再尝试其他端点
          if (res.status === 402) {
            apiError = pay.baziNeedPay;
            hardFailure = true;
            break;
          }
          // 同步模式：直接返回报告
          if (res.ok && data.report) {
            success = data;
            break;
          }
          // 异步任务模式（同源 API）：先拿 jobId，再轮询结果
          if (res.ok && data.jobId) {
            // 先落本地：生成要 1-2 分钟，用户此时刷新也能续上
            writePendingJob(data.jobId, form as unknown as Record<string, string>);
            const polled = await pollReading(url, data.jobId);
            if (polled && polled.report) {
              success = { report: polled.report, chart: polled.chart, tier: polled.tier };
              break;
            }
            if (polled && polled.error) {
              apiError = polled.error;
              hardFailure = true;
            }
            continue;
          }
          if (data.error) apiError = data.error;
        } catch {
          /* 网络异常 → 尝试下一个端点 */
        }
      }
      if (success) {
        clearPendingJob();
        applySuccess(success, form as unknown as Record<string, string>);
      } else {
        // 只有「任务本身报错 / 未付款」才清断点；纯超时、网络抖动保留，
        // 用户刷新回来还能把已经生成好的报告接走。
        if (hardFailure) clearPendingJob();
        setError(apiError || t("bazi.error"));
      }
    } catch (e) {
      setError(t("bazi.error"));
    } finally {
      setLoading(false);
    }
  };

  const focuses = [
    { value: "general", label: t("bazi.focusGeneral") },
    { value: "career", label: t("bazi.focusCareer") },
    { value: "love", label: t("bazi.focusLove") },
    { value: "wealth", label: t("bazi.focusWealth") },
    { value: "health", label: t("bazi.focusHealth") },
  ];

  return (
    <main className="flex-1 pt-[72px]">
      <section className="relative overflow-hidden px-6 py-14 sm:py-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-accent/[0.06] blur-[120px]" />
        </div>

        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">{t("bazi.subtitle")}</p>
          <h1 className="mb-6 font-serif text-4xl font-light tracking-wide text-gradient sm:text-5xl">
            {t("bazi.title")}
          </h1>
          <p className="mx-auto max-w-xl text-muted">{t("bazi.intro")}</p>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Form：未登录显示登录卡片（功能需登录，页面本身仍可被搜索引擎收录） */}
          <SignInGate locale={locale} className="lg:col-span-3">
            <div className="glass glow rounded-2xl p-6 sm:p-10">
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/20 bg-accent/10">
                  <Sparkles size={18} className="text-accent" />
                </div>
                <div>
                  <h2 className="font-serif text-xl">{t("bazi.formTitle")}</h2>
                  <p className="text-xs text-muted">{t("bazi.formSubtitle")}</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm text-muted">{t("bazi.name")}</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={t("bazi.namePlaceholder")}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted/50 focus:border-accent/50 focus:bg-white/[0.05]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-muted">{t("bazi.birthDate")} *</label>
                    <input
                      type="date"
                      value={form.birthDate}
                      onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent/50 focus:bg-white/[0.05]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-muted">{t("bazi.birthTime")}</label>
                    <input
                      type="time"
                      value={form.birthTime}
                      onChange={(e) => setForm({ ...form, birthTime: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent/50 focus:bg-white/[0.05]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-muted">{t("bazi.birthPlace")}</label>
                  <input
                    type="text"
                    value={form.place}
                    onChange={(e) => setForm({ ...form, place: e.target.value })}
                    placeholder={t("bazi.birthPlacePlaceholder")}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted/50 focus:border-accent/50 focus:bg-white/[0.05]"
                  />
                  <p className="mt-2 text-[11px] leading-relaxed text-muted/60">{t("bazi.birthPlaceTip")}</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-muted">{t("bazi.gender")} *</label>
                  <div className="grid grid-cols-2 gap-4">
                    {["male", "female"].map((g) => (
                      <button
                        key={g}
                        onClick={() => setForm({ ...form, gender: g })}
                        className={`rounded-xl border px-4 py-3 text-sm transition ${
                          form.gender === g
                            ? "border-accent bg-accent/15 text-accent"
                            : "border-white/10 bg-white/[0.03] text-muted hover:border-accent/30"
                        }`}
                      >
                        {t(`bazi.${g}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-muted">{t("bazi.focus")}</label>
                  <Select
                    value={form.focus}
                    onChange={(v) => setForm({ ...form, focus: v })}
                    options={focuses}
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                <button
                  onClick={() => {
                    setPayHint("");
                    handleSubmit();
                  }}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 text-sm font-medium text-background shadow-lg shadow-accent/20 transition hover:bg-accent-light disabled:opacity-70"
                >
                  {loading ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
                  {loading ? t("bazi.generating") : t("bazi.submit")}
                </button>
                {loading && (
                  <p className="rounded-xl border border-accent/15 bg-accent/[0.04] px-4 py-3 text-center text-xs leading-relaxed text-muted">
                    {resumeMsg.pending}
                  </p>
                )}
                {payHint && !paid && (
                  <p className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-center text-xs text-amber-200/90">
                    {payHint}
                  </p>
                )}
              </div>
            </div>
          </SignInGate>

          {/* Info / Price */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass glow-sm rounded-2xl p-6 sm:p-8">
              <p className="mb-2 text-sm text-muted">{t("bazi.priceLabel")}</p>
              <p className="mb-6 font-serif text-5xl text-accent">{t("bazi.price")}</p>
              <ul className="space-y-3 text-sm text-muted">
                <li className="flex items-start gap-3">
                  <FileText size={16} className="mt-0.5 text-accent" />
                  {t("bazi.includes.report")}
                </li>
                <li className="flex items-start gap-3">
                  <Shield size={16} className="mt-0.5 text-accent" />
                  {t("bazi.includes.privacy")}
                </li>
              </ul>

              <div id="pay-card" className="mt-8 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                {!user ? (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-4 text-center">
                    <p className="mb-3 text-[11px] leading-relaxed text-muted">
                      {ui.payLoginHint}
                    </p>
                    <button
                      onClick={openAuth}
                      className="rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs text-accent transition hover:bg-accent/20"
                    >
                      {a.gateCta}
                    </button>
                  </div>
                ) : (
                <>
                <PayPalButton
                  product="bazi"
                  locale={locale}
                  note={pay.baziNote}
                  onSuccess={async (order: any) => {
                    const rc = { channel: "paypal", id: order.orderId };
                    setReceipt(rc);
                    setPaid(true);
                    setPayHint("");
                    // 订单入库（失败不阻塞生成）
                    try {
                      await getCloud().database.from("payment_orders").insert({
                        owner_id: user ? user.id : null,
                        method: "paypal",
                        amount: order.amount || "6.80",
                        currency: order.currency || "USD",
                        product: order.product || "bazi",
                        status: "completed",
                        paypal_order_id: order.orderId || null,
                        payer_email: order.payerEmail || null,
                        contact: order.payerEmail || null,
                        capture_raw: order,
                      });
                    } catch (e) {
                      // 入库失败不阻塞用户，但必须留痕：订单可能在后台丢失
                      console.error("[order] bazi insert failed", e);
                      try {
                        localStorage.setItem(
                          "traces_pending_order",
                          JSON.stringify({ order, form, at: new Date().toISOString() })
                        );
                      } catch {}
                    }
                    handleSubmit(rc);
                  }}
                />
                {user && (
                  <BalancePayButton
                    product="bazi"
                    locale={locale}
                    onSuccess={(order: any) => {
                      const rc = order && order.receipt ? order.receipt : null;
                      setReceipt(rc);
                      setPaid(true);
                      setPayHint("");
                      handleSubmit(rc);
                    }}
                  />
                )}
                <p className="mt-4 text-center text-[10px] leading-relaxed text-muted/60">
                  {t("bazi.disclaimer")}
                </p>
                </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Report */}
        {report && (
          <div className="mx-auto mt-8 max-w-6xl">
            <div className="glass glow rounded-2xl p-6 sm:p-10">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-serif text-2xl text-accent">{t("bazi.reportTitle")}</h3>
                  {resumedNotice && (
                    <p className="mt-1 text-[11px] text-green-300/80">{resumeMsg.resumed}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {report && (
                    <BaziPdfExport
                      locale={locale}
                      labels={{
                        name: t("bazi.name"),
                        gender: t("bazi.gender"),
                        birthDate: t("bazi.birthDate"),
                        birthTime: t("bazi.birthTime"),
                        birthPlace: t("bazi.birthPlace"),
                        male: t("bazi.male"),
                        female: t("bazi.female"),
                        disclaimer: t("bazi.disclaimer"),
                        reportTitle: t("bazi.reportTitle"),
                      }}
                      form={form}
                      report={report}
                      chart={chart}
                      tier={tier}
                    />
                  )}
                  {/* save status */}
                  {user ? (
                    saveState === "saving" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                        <Loader2 size={12} className="animate-spin" /> …
                      </span>
                    ) : saveState === "saved" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-green-300">
                        <CheckCircle2 size={13} /> {a.savedToAccount}
                      </span>
                    ) : saveState === "error" ? (
                      <button
                        onClick={() => saveReading(report)}
                        className="inline-flex items-center gap-1.5 text-xs text-red-300 underline underline-offset-2 transition hover:text-red-200"
                      >
                        {a.saveFailed}
                      </button>
                    ) : null
                  ) : (
                    <button
                      onClick={openAuth}
                      className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs text-accent transition hover:bg-accent/20"
                    >
                      <CloudUpload size={12} /> {a.saveToAccount}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      // 用户主动重来：连未完成任务的断点一起清掉，别下次又"恢复"出来
                      clearPendingJob();
                      setResumedNotice(false);
                      setReport("");
                      setChart(null);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-muted transition hover:text-accent"
                  >
                    <RefreshCw size={12} /> {t("bazi.reset")}
                  </button>
                </div>
              </div>
              {!user && report && (
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-4 py-3">
                  <p className="text-xs leading-relaxed text-amber-200/90">
                    {locale === "zh"
                      ? "这份报告还没保存。登录即可存入账户，随时回看——免费。"
                      : "This report isn't saved yet. Sign in to keep it in your account for later — free."}
                  </p>
                  <button
                    onClick={openAuth}
                    className="rounded-full border border-amber-300/40 bg-amber-300/10 px-3.5 py-1.5 text-[11px] text-amber-100 transition hover:bg-amber-300/20"
                  >
                    {locale === "zh" ? "登录保存" : "Sign in to save"}
                  </button>
                </div>
              )}
              {chart && <BaziChart chart={chart} locale={locale} />}
              {chart && (
                <div className="mt-4">
                  <ShareBar
                    locale={locale}
                    data={{
                      title: t("bazi.title"),
                      headline: ["year", "month", "day", "hour"]
                        .map((k) => {
                          const p = (chart.pillars as any)[k];
                          return p ? p.gan + p.zhi : "";
                        })
                        .filter(Boolean)
                        .join(" "),
                      rows: [
                        { label: "日主", value: chart.dayMaster.gan + (chart.dayMaster.element ? " · " + chart.dayMaster.element : "") },
                        { label: "生肖", value: chart.shichenText || "-" },
                        { label: "大运", value: (chart.dayun && chart.dayun[0] && chart.dayun[0].gz) || "-" },
                        { label: "流年", value: chart.currentYear + " " + (chart.currentGz || "") },
                      ],
                      note: chart.lunarText,
                    }}
                  />
                </div>
              )}
              <div className="prose prose-invert max-w-none text-sm leading-relaxed text-muted">
                {report.split("\n").map((line, i) => (
                  <p key={i} className="mb-3">{line}</p>
                ))}
              </div>
              {chart && (
                <TalismanAdvice chart={chart} focus={form.focus || "general"} locale={locale} />
              )}

              {tier === "free" && (
                <div className="mt-8 rounded-2xl border border-accent/25 bg-accent/[0.04] p-5">
                  <p className="mb-1.5 flex items-center gap-2 text-sm font-medium text-accent">
                    <Lock size={14} />
                    {ui.baziLockedTitle}
                  </p>
                  <p className="mb-4 text-xs leading-relaxed text-muted">
                    {ui.baziLockedHint}
                  </p>
                  <ul className="mb-5 space-y-2">
                    {[ui.lock1, ui.lock2, ui.lock3, ui.lock4, ui.lock5].map((x) => (
                      <li key={x} className="flex items-start gap-2 text-xs leading-relaxed text-muted/85">
                        <Lock size={11} className="mt-0.5 shrink-0 text-accent/60" />
                        <span>{x}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap items-center gap-4 border-t border-accent/15 pt-4">
                    <span className="font-serif text-2xl text-accent">{t("bazi.price")}</span>
                    <button
                      onClick={() =>
                        document
                          .getElementById("pay-card")
                          ?.scrollIntoView({ behavior: "smooth", block: "center" })
                      }
                      className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-xs font-medium text-background transition hover:bg-accent-light"
                    >
                      <Sparkles size={13} />
                      {ui.baziUnlockCta}
                    </button>
                  </div>
                </div>
              )}
              {!user && (
                <p className="mt-6 rounded-xl border border-accent/15 bg-accent/[0.05] px-4 py-3 text-center text-xs text-muted">
                  <button
                    onClick={openAuth}
                    className="text-accent underline underline-offset-2"
                  >
                    {a.signIn}
                  </button>{" "}
                  — {a.needSignInHint}
                </p>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
