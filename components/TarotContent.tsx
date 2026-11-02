"use client";

import { useEffect, useRef, useState } from "react";
import { Moon, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Locale } from "@/lib/i18n";
import { getTarotMessages, positionLabel, cardName, TAROT_ELEMENT_COLORS } from "@/lib/tarot-i18n";
import { Select } from "./Select";
import { useAuth } from "./AuthProvider";
import { SignInGate } from "./SignInGate";
import { WhenToUse } from "./WhenToUse";
import { getWhen } from "@/lib/when-i18n";

/** 同源 API 优先（server.js），失败回退 Cloudflare Worker。 */
// 只走同源服务端；旧的 Cloudflare Worker 兜底端点已下线（无登录态、无成本保护）
const API_ENDPOINTS = ["/api/tarot"];

interface DrawnCard {
  position: string;
  card: string;
  cardEn: string;
  orientation: string;
  isMajor: boolean;
  element: string;
}

interface DrawData {
  seed: string;
  spread: string;
  spreadName: string;
  question: string;
  timeFactor: string;
  cards: DrawnCard[];
}

/**
 * 轮询异步生成任务：POST 返回 jobId（牌面即时展示）→ GET ?id= 查解读状态。
 * 返回 { reading, draw } 成功；{ error } 失败；null 放弃。
 */
async function pollReading(
  baseUrl: string,
  jobId: string
): Promise<{ reading?: string; draw?: DrawData; error?: string } | null> {
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

export function TarotContent({ locale }: { locale: Locale }) {
  const t = getTarotMessages(locale);
  const { user, openAuth } = useAuth();
  const [form, setForm] = useState({ spread: "three", question: "" });
  const [loading, setLoading] = useState(false);
  const [draw, setDraw] = useState<DrawData | null>(null);
  const [reading, setReading] = useState("");
  const [error, setError] = useState("");
  // 点了按钮才弹登录：登录成功后自动接着跑，不用再点一次
  const pendingRef = useRef(false);

  const spreadOptions = [
    { value: "single", label: t.spreads.single },
    { value: "three", label: t.spreads.three },
    { value: "diamond", label: t.spreads.diamond },
    { value: "moon", label: t.spreads.moon },
    { value: "horseshoe", label: t.spreads.horseshoe },
    { value: "celtic", label: t.spreads.celtic },
  ];

  useEffect(() => {
    if (user && pendingRef.current) {
      pendingRef.current = false;
      handleDraw();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleDraw = async () => {
    // 页面本身对所有人可见（利于索引与转化），但抽牌要登录 —— 解读是 LLM 调用，匿名刷会烧成本
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
      let success: { reading?: string; draw?: DrawData } | null = null;
      let apiError = "";
      for (const url of API_ENDPOINTS) {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ spread: form.spread, question: form.question, locale }),
          });
          const ct = res.headers.get("content-type") || "";
          if (!ct.includes("application/json")) continue;
          const data = (await res.json()) as any;
          // 同步模式（Worker）：直接返回解读
          if (res.ok && data.reading) {
            success = { reading: data.reading, draw: data.draw };
            break;
          }
          // 异步模式（同源 API）：牌面即时返回，解读轮询
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
          <span className="mt-5 inline-block rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[10px] text-accent">
            {t.free}
          </span>
        </div>
      </section>

      {/* 什么时候用 */}
      <WhenToUse copy={getWhen("tarot", locale)} />

      {/* Form */}
      <section className="px-6 pb-24">
        <SignInGate locale={locale} className="mx-auto max-w-2xl">
          <div className="glass glow rounded-2xl p-6 sm:p-10">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/20 bg-accent/10">
                <Moon size={18} className="text-accent" />
              </div>
              <div>
                <h2 className="font-serif text-xl">{t.spreadLabel}</h2>
                <p className="text-xs text-muted">{t.engineNote}</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm text-muted">{t.spreadLabel}</label>
                <Select
                  value={form.spread}
                  onChange={(v) => setForm({ ...form, spread: v })}
                  options={spreadOptions}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted">{t.questionLabel}</label>
                <textarea
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value.slice(0, 200) })}
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
                onClick={handleDraw}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 text-sm font-medium text-background shadow-lg shadow-accent/20 transition hover:bg-accent-light disabled:opacity-70"
              >
                {loading ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
                {loading ? t.drawing : t.draw}
              </button>
            </div>
          </div>
        </SignInGate>

        {/* Cards + Reading */}
        {draw && (
          <div className="mx-auto mt-8 max-w-4xl">
            {/* Card grid */}
            <div className="glass glow rounded-2xl p-6 sm:p-8">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-serif text-xl text-accent">{draw.spreadName}</h3>
                <p className="text-[11px] text-muted/70">
                  seed {draw.seed.length > 12 ? draw.seed.slice(0, 12) + "…" : draw.seed} · {draw.timeFactor}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
                {draw.cards.map((c, i) => {
                  const isRev = c.orientation === "逆位";
                  return (
                    <div
                      key={i}
                      className={`rounded-xl border px-2.5 py-4 text-center transition ${
                        isRev
                          ? "border-white/[0.07] bg-white/[0.015]"
                          : "border-accent/20 bg-accent/[0.03]"
                      }`}
                    >
                      <div className="text-[10px] tracking-widest text-muted">
                        {positionLabel(locale, c.position)}
                      </div>
                      <div
                        className={`mt-3 font-serif text-sm leading-snug sm:text-[15px] ${
                          isRev ? "text-muted" : "text-foreground"
                        }`}
                      >
                        {cardName(locale, c.card, c.cardEn)}
                      </div>
                      <div
                        className={`mx-auto mt-2.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${
                          isRev ? "border-white/10 text-muted/70" : "border-accent/25 text-accent/90"
                        }`}
                      >
                        {isRev ? t.reversed : t.upright}
                      </div>
                      <div className="mt-2.5 flex items-center justify-center gap-1.5">
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{ background: TAROT_ELEMENT_COLORS[c.element] || "#9c958a" }}
                        />
                        {c.isMajor && <span className="text-[9px] tracking-wide text-accent/70">★ MAJOR</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

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
