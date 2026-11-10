"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, CheckCircle2, CloudUpload, RefreshCw } from "lucide-react";
import type { Locale, Messages } from "@/lib/i18n";
import { getBaziResumeMessages } from "@/lib/bazi-resume-i18n";
import { getAuthMessages } from "@/lib/auth-i18n";
import {
  readPendingJob,
  clearPendingJob,
  hasSavedReading,
  markReadingSaved,
} from "@/lib/bazi-pending";
import { getCloud } from "@/lib/cloud";
import { notifyReport } from "@/lib/notify";
import { useAuth } from "./AuthProvider";
import { BaziChart, type BaziChartData } from "./BaziChart";
import { BaziPdfExport } from "./BaziPdfExport";
import { ShareBar } from "./ShareButton";
import { TalismanAdvice } from "./TalismanAdvice";

/**
 * 八字解读页（/bazi/reading?id=jobId）
 *
 * 用户在八字页点「生成测算」后直接跳到这里：
 * 生成中显示进度（可离开、回来续上），完成后展示命盘 + 正文 + 符纸推荐 + PDF。
 * 任务号通过 URL 的 ?id= 传递，刷新、分享链接都能重新拉取（30 分钟内有效）。
 */

type Phase = "loading" | "ready" | "error" | "missing";

/** 轮询任务：5s 一次，最多约 240s（与服务端 170s 超时 + 余量对齐） */
async function pollJob(id: string): Promise<any | null> {
  for (let i = 0; i < 48; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 5000));
    try {
      const res = await fetch("/api/bazi?id=" + encodeURIComponent(id));
      // 任务不存在/已过期（服务端 404）：别让用户白等 4 分钟，直接给失败态
      if (res.status === 404) return { status: "error" };
      if (!res.ok) continue;
      const j = (await res.json()) as any;
      if (j.status === "done" || j.status === "error") return j;
    } catch {
      /* 网络抖动 → 继续轮询 */
    }
  }
  return null;
}

export function BaziReadingView({ messages, locale }: { messages: Messages; locale: Locale }) {
  const t = (key: string) => {
    const parts = key.split(".");
    let value: any = messages;
    for (const part of parts) value = value?.[part];
    return value || key;
  };
  const msg = getBaziResumeMessages(locale);
  const a = getAuthMessages(locale);
  const { user, openAuth } = useAuth();

  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState("");
  const [report, setReport] = useState("");
  const [chart, setChart] = useState<BaziChartData | null>(null);
  const [tier, setTier] = useState<"free" | "full">("free");
  const [jobId, setJobId] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});
  const [resumed, setResumed] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const started = useRef(false);
  const savedOnce = useRef(false);

  // 计时器：生成中显示已用时，让等待有实感
  useEffect(() => {
    if (phase !== "loading") return;
    const timer = setInterval(() => setElapsed((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  // 解析任务号 → 拉取结果
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("id") || "";
    const fresh = params.get("fresh") === "1"; // 刚从八字页提交过来，不是"恢复"
    // fresh 只在落地这一次有效：清掉它，之后刷新才会正确显示"已恢复"
    if (fresh) {
      const q = params.toString().replace(/(^|&)fresh=1/, "").replace(/^&/, "");
      window.history.replaceState(null, "", window.location.pathname + (q ? "?" + q : ""));
    }
    const pending = readPendingJob();
    const id = fromUrl || (pending ? pending.jobId : "");

    if (!id) {
      setPhase("missing");
      return;
    }
    setJobId(id);
    if (pending && pending.jobId === id) {
      setForm(pending.form);
      // 只有不是刚提交过来的，才算"恢复上次的测算"
      setResumed(!fresh);
    }

    (async () => {
      const job = await pollJob(id);
      if (!job) {
        setError(t("bazi.error"));
        setPhase("error");
        return;
      }
      if (job.status === "error" || !job.report) {
        setError(job.error || t("bazi.error"));
        setPhase("error");
        clearPendingJob();
        return;
      }
      setReport(job.report);
      setChart(job.chart || null);
      setTier(job.tier === "full" ? "full" : "free");
      setPhase("ready");
      clearPendingJob();
      // 完整报告发一封「报告就绪」邮件（免费档不打扰）
      if (job.tier === "full" && user && user.email) {
        notifyReport(user.email, locale, (pending && pending.form.name) || "");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 登录后自动存档（同一份报告只存一次）
  useEffect(() => {
    if (phase !== "ready" || !user || !report || savedOnce.current) return;
    if (jobId && hasSavedReading(jobId)) {
      setSaveState("saved");
      return;
    }
    savedOnce.current = true;
    (async () => {
      setSaveState("saving");
      try {
        const birthDate = form.birthDate || (chart?.solarText || "").slice(0, 10);
        const gender = form.gender || (chart?.sex === "女" ? "female" : "male");
        const { error: err } = await getCloud()
          .database.from("readings")
          .insert({
            name: form.name || null,
            birth_date: birthDate,
            birth_time: form.birthTime || null,
            gender,
            focus: form.focus || "general",
            locale,
            report,
            place: form.place || null,
            chart: chart || null,
            tier,
          });
        if (err) {
          setSaveState("error");
        } else {
          setSaveState("saved");
          if (jobId) markReadingSaved(jobId);
        }
      } catch {
        setSaveState("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, user, report]);

  // PDF 封面的信息：优先用提交时的表单快照，刷新后从命盘反推
  const pdfForm = {
    name: form.name || "",
    birthDate: form.birthDate || (chart?.solarText || "").slice(0, 10),
    birthTime: form.birthTime || "",
    place: form.place || "",
    gender: form.gender || (chart?.sex === "女" ? "female" : "male"),
    focus: form.focus || "general",
  };

  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 pt-28 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={"/" + locale + "/bazi"}
          className="inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-accent"
        >
          <ArrowLeft size={13} /> {msg.backToForm}
        </Link>
        {phase === "ready" && (
          <div className="flex flex-wrap items-center gap-3">
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
              form={pdfForm}
              report={report}
              chart={chart}
              tier={tier}
            />
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
                <span className="text-xs text-red-300">{a.saveFailed}</span>
              ) : null
            ) : (
              <button
                onClick={openAuth}
                className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs text-accent transition hover:bg-accent/20"
              >
                <CloudUpload size={12} /> {a.saveToAccount}
              </button>
            )}
          </div>
        )}
      </div>

      {phase === "loading" && (
        <section className="glass glow rounded-2xl px-6 py-16 text-center sm:px-10">
          <Loader2 size={26} className="mx-auto mb-5 animate-spin text-accent" />
          <h1 className="mb-3 font-serif text-xl text-foreground sm:text-2xl">{msg.loadingTitle}</h1>
          <p className="mx-auto max-w-md text-xs leading-relaxed text-muted">{msg.pending}</p>
          <p className="mt-4 text-[11px] tracking-wide text-muted/60">
            {msg.elapsed} {elapsed}s
          </p>
          <div className="mx-auto mt-8 h-1 w-40 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-accent/60 transition-all duration-1000"
              style={{ width: Math.min(96, 8 + elapsed * 1.1) + "%" }}
            />
          </div>
        </section>
      )}

      {phase === "missing" && (
        <section className="glass rounded-2xl px-6 py-14 text-center sm:px-10">
          <h1 className="mb-3 font-serif text-xl text-foreground">{msg.missingTitle}</h1>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted">{msg.missingDesc}</p>
          <Link
            href={"/" + locale + "/bazi"}
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-background transition hover:bg-accent-light"
          >
            <RefreshCw size={14} /> {msg.backToForm}
          </Link>
        </section>
      )}

      {phase === "error" && (
        <section className="glass rounded-2xl px-6 py-14 text-center sm:px-10">
          <h1 className="mb-3 font-serif text-xl text-foreground">{t("bazi.error")}</h1>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-red-300/90">{error}</p>
          <Link
            href={"/" + locale + "/bazi"}
            className="mt-7 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-6 py-3 text-sm text-accent transition hover:bg-accent/20"
          >
            <RefreshCw size={14} /> {msg.backToForm}
          </Link>
        </section>
      )}

      {phase === "ready" && (
        <>
          <header className="mb-6">
            <h1 className="font-serif text-2xl text-accent sm:text-3xl">{t("bazi.reportTitle")}</h1>
            {resumed && <p className="mt-1.5 text-[11px] text-green-300/80">{msg.resumed}</p>}
          </header>

          <div className="glass glow rounded-2xl p-6 sm:p-9">
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
                      {
                        label: "日主",
                        value:
                          chart.dayMaster.gan +
                          (chart.dayMaster.element ? " · " + chart.dayMaster.element : ""),
                      },
                      { label: "生肖", value: chart.shichenText || "-" },
                      { label: "大运", value: (chart.dayun && chart.dayun[0] && chart.dayun[0].gz) || "-" },
                      {
                        label: "流年",
                        value: chart.currentYear + " " + (chart.currentGz || ""),
                      },
                    ],
                    note: chart.lunarText,
                  }}
                />
              </div>
            )}

            <div className="prose prose-invert mt-6 max-w-none text-sm leading-relaxed text-muted">
              {report.split("\n").map((line, i) => (
                <p key={i} className="mb-3">
                  {line}
                </p>
              ))}
            </div>

            {chart && <TalismanAdvice chart={chart} focus={pdfForm.focus} locale={locale} />}

            <p className="mt-8 border-t border-white/[0.06] pt-5 text-[11px] leading-relaxed text-muted/60">
              {t("bazi.disclaimer")}
            </p>
          </div>
        </>
      )}
    </main>
  );
}
