"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Loader2, RefreshCw, Compass } from "lucide-react";
import { Locale } from "@/lib/i18n";
import { getBaguaMessages } from "@/lib/bagua-i18n";
import { BaguaChart, BaguaDrawData } from "./BaguaChart";
import { Select } from "./Select";
import { useAuth } from "./AuthProvider";

/** 同源 API（server.js 异步任务模式）。 */
const API_ENDPOINTS = ["/api/bagua"];

/**
 * 轮询异步生成任务：POST 返回 jobId（卦象即时展示）→ GET ?id= 查解读状态。
 */
async function pollReading(
  baseUrl: string,
  jobId: string
): Promise<{ reading?: string; draw?: BaguaDrawData; error?: string } | null> {
  const deadline = Date.now() + 240000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000));
    try {
      const res = await fetch(`${baseUrl}?id=${encodeURIComponent(jobId)}`);
      if (res.status === 404) return null;
      if (!res.ok) continue;
      const j = (await res.json()) as any;
      if (j.status === "done") return { reading: j.reading, draw: j.draw };
      if (j.status === "error") return { error: j.error || "" };
    } catch {
      /* 网络抖动 → 继续轮询 */
    }
  }
  return null;
}

export function BaguaContent({ locale }: { locale: Locale }) {
  const t = getBaguaMessages(locale);
  const { user, openAuth } = useAuth();
  const [method, setMethod] = useState("coin");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [draw, setDraw] = useState<BaguaDrawData | null>(null);
  const [reading, setReading] = useState("");
  const [error, setError] = useState("");
  // 点了按钮才弹登录：登录成功后自动接着跑，不用再点一次
  const pendingRef = useRef(false);

  const methodOptions = [
    { value: "coin", label: t.methodCoin },
    { value: "yarrow", label: t.methodYarrow },
  ];

  useEffect(() => {
    if (user && pendingRef.current) {
      pendingRef.current = false;
      handleCast();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleCast = async () => {
    // 页面本身对所有人可见（利于索引），但起卦要登录 —— 解读是 LLM 调用，匿名刷会烧成本
    if (!user) {
      pendingRef.current = true;
      openAuth();
      return;
    }
    setLoading(true);
    setError("");
    setReading("");
    setDraw(null);
    try {
      let success: { reading?: string; draw?: BaguaDrawData } | null = null;
      let apiError = "";
      for (const url of API_ENDPOINTS) {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question, method, locale }),
          });
          const ct = res.headers.get("content-type") || "";
          if (!ct.includes("application/json")) continue;
          const data = (await res.json()) as any;
          if (res.ok && data.jobId && data.draw) {
            setDraw(data.draw);
            const polled = await pollReading(url, data.jobId);
            if (polled && polled.reading) {
              success = { reading: polled.reading, draw: polled.draw || data.draw };
              break;
            }
            if (polled && polled.error) apiError = polled.error;
            continue;
          }
          if (data.error) apiError = data.error;
        } catch {
          /* 网络异常 → 尝试下一个端点 */
        }
      }
      if (success) {
        if (success.draw) setDraw(success.draw);
        setReading(success.reading || "");
      } else {
        setError(apiError || t.error);
      }
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setDraw(null);
    setReading("");
    setError("");
  };

  return (
    <main className="flex-1 pt-[72px]">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-14 sm:py-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-accent/[0.06] blur-[120px]" />
        </div>
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">{t.eyebrow}</p>
          <h1 className="mb-6 font-serif text-4xl font-light tracking-wide text-gradient sm:text-5xl">
            {t.title}
          </h1>
          <p className="mx-auto max-w-xl text-muted">{t.subtitle}</p>
        </div>
      </section>

      {/* Form */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-2xl">
          <div className="glass glow rounded-2xl p-6 sm:p-10">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/20 bg-accent/10">
                <Compass size={18} className="text-accent" />
              </div>
              <div>
                <h2 className="font-serif text-xl">{t.formTitle}</h2>
                <p className="text-xs text-muted">{method === "yarrow" ? t.engineNoteYarrow : t.engineNote}</p>
              </div>
              <span className="ms-auto rounded-full border border-accent/25 bg-accent/[0.06] px-2.5 py-1 text-[10px] text-accent">
                {t.free}
              </span>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm text-muted">{t.methodLabel}</label>
                <Select value={method} onChange={setMethod} options={methodOptions} />
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted">{t.questionLabel}</label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value.slice(0, 200))}
                  placeholder={t.questionPlaceholder}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted/50 focus:border-accent/50 focus:bg-white/[0.05]"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                onClick={handleCast}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 text-sm font-medium text-background shadow-lg shadow-accent/20 transition hover:bg-accent-light disabled:opacity-70"
              >
                {loading ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
                {loading ? t.casting : t.cast}
              </button>
            </div>
          </div>
        </div>

        {/* Hexagram + Reading */}
        {draw && (
          <div className="mx-auto mt-8 max-w-3xl">
            <BaguaChart draw={draw} locale={locale} />

            {/* Reading */}
            <div className="glass glow mt-6 rounded-2xl p-6 sm:p-10">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-serif text-2xl text-accent">{t.reportTitle}</h3>
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-1 text-xs text-muted transition hover:text-accent"
                >
                  <RefreshCw size={12} /> {t.reset}
                </button>
              </div>

              {reading ? (
                <div className="prose prose-invert max-w-none text-sm leading-relaxed text-muted">
                  {reading.split("\n").map((line, i) => (
                    <p key={i} className="mb-3">
                      {line}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3 py-10 text-sm text-muted">
                  <Loader2 size={16} className="animate-spin text-accent" />
                  {t.readingPending}
                </div>
              )}

              {reading && (
                <p className="mt-8 rounded-xl border border-accent/15 bg-accent/[0.05] px-4 py-3 text-center text-xs text-muted">
                  <a href={`/${locale}/bazi`} className="text-accent underline underline-offset-2">
                    {t.ctaBazi}
                  </a>
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      <div className="px-6 pb-12">
        <p className="mx-auto max-w-2xl text-center text-[10px] leading-relaxed text-muted/60">
          {t.disclaimer}
        </p>
      </div>
    </main>
  );
}
