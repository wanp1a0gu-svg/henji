"use client";

import { useEffect, useRef, useState } from "react";
import { Compass, Loader2, Sparkles } from "lucide-react";
import { Locale } from "@/lib/i18n";
import { getZiweiMessages } from "@/lib/ziwei-i18n";
import { ZiweiChart, type ZiweiChartData } from "./ZiweiChart";
import { Select } from "./Select";
import { useAuth } from "./AuthProvider";
import { SignInGate } from "./SignInGate";
import { WhenToUse } from "./WhenToUse";
import { getWhen } from "@/lib/when-i18n";

/** 异步任务模式：POST 返回 {jobId, chart}（盘立即可看），GET ?id= 取解读 */
const API = "/api/ziwei";

async function pollReading(
  jobId: string
): Promise<{ reading?: string; chart?: ZiweiChartData; error?: string } | null> {
  const deadline = Date.now() + 240000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000));
    try {
      const res = await fetch(`${API}?id=${encodeURIComponent(jobId)}`);
      if (res.status === 404) return null;
      if (!res.ok) continue;
      const j = (await res.json()) as any;
      if (j.status === "done") return { reading: j.reading, chart: j.chart };
      if (j.status === "error") return { error: j.error || "" };
    } catch {
      /* 网络抖动 → 继续轮询 */
    }
  }
  return null;
}

export function ZiweiContent({ locale }: { locale: Locale }) {
  const t = getZiweiMessages(locale);
  const { user, openAuth } = useAuth();
  const [form, setForm] = useState({ birthDate: "", birthTime: "", birthPlace: "", gender: "male" });
  const [loading, setLoading] = useState(false);
  const [chart, setChart] = useState<ZiweiChartData | null>(null);
  const [reading, setReading] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);

  const genderOptions = [
    { value: "male", label: t.male },
    { value: "female", label: t.female },
  ];

  useEffect(() => {
    if (user && pendingRef.current) {
      pendingRef.current = false;
      submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const submit = async () => {
    if (!user) {
      pendingRef.current = true;
      openAuth();
      return;
    }
    // 本地先挡一遍，省一次往返
    if (!form.birthDate || !form.birthTime || !form.birthPlace.trim()) {
      setError(t.errRequired);
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.birthDate)) {
      setError(t.errDate);
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(form.birthTime)) {
      setError(t.errTime);
      return;
    }

    setLoading(true);
    setPending(true);
    setError("");
    setReading("");
    setChart(null);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, locale }),
      });
      const j = (await res.json()) as any;
      if (!res.ok) {
        setError(j.error || t.errNetwork);
        return;
      }
      setChart(j.chart || null);
      setLoading(false);
      const out = await pollReading(j.jobId);
      if (!out) {
        setError(t.errNetwork);
      } else if (out.error) {
        setError(out.error);
      } else {
        setReading(out.reading || "");
        if (out.chart) setChart(out.chart);
      }
    } catch {
      setError(t.errNetwork);
    } finally {
      setLoading(false);
      setPending(false);
    }
  };

  return (
    <main className="flex-1 pt-[72px]">
      <div className="mx-auto max-w-5xl px-4 pb-12 sm:px-6">
        {/* 标题：和塔罗 / 文王卦保持同一套字号与节奏 */}
        <div className="relative overflow-hidden px-2 py-14 text-center sm:py-20">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-accent/[0.06] blur-[120px]" />
          </div>
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">{t.eyebrow}</p>
          <h1 className="mb-6 font-serif text-4xl font-light tracking-wide text-gradient sm:text-5xl">
            {t.title}
          </h1>
          <p className="mx-auto max-w-xl text-muted">{t.subtitle}</p>
          <span className="mt-5 inline-block rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[10px] text-accent">
            {t.free}
          </span>
        </div>

        {/* 什么时候用 */}
        <WhenToUse copy={getWhen("ziwei", locale)} />

        {/* 表单：未登录显示登录卡片 */}
        <SignInGate locale={locale} className="mx-auto mt-8 max-w-2xl">
        <div className="glass glow rounded-2xl p-6 sm:p-10">
          <h2 className="mb-5 flex items-center gap-2 font-serif text-base text-foreground">
            <Compass size={15} className="text-accent/70" /> {t.formTitle}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs text-muted">{t.birthDate}</label>
              <input
                type="date"
                value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-foreground focus:border-accent/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs text-muted">{t.birthTime}</label>
              <input
                type="time"
                value={form.birthTime}
                onChange={(e) => setForm({ ...form, birthTime: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-foreground focus:border-accent/40 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-xs text-muted">{t.birthPlace}</label>
            <input
              value={form.birthPlace}
              onChange={(e) => setForm({ ...form, birthPlace: e.target.value })}
              placeholder={t.birthPlacePh}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-foreground placeholder:text-muted/40 focus:border-accent/40 focus:outline-none"
            />
            <p className="mt-2 text-[11px] leading-relaxed text-muted/55">{t.birthPlaceTip}</p>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-xs text-muted">{t.gender}</label>
            <Select
              value={form.gender}
              onChange={(v) => setForm({ ...form, gender: v })}
              options={genderOptions}
            />
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-[11px] text-red-300">
              {error}
            </p>
          )}

          {!user && <p className="mt-4 text-[11px] leading-relaxed text-muted/50">{t.loginHint}</p>}

          <button
            onClick={submit}
            disabled={loading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-sm font-medium text-background shadow-lg shadow-accent/20 transition hover:bg-accent-light disabled:opacity-70"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {loading ? t.submitting : t.submit}
          </button>
        </div>
        </SignInGate>

        {/* 命盘 */}
        {chart && (
          <div className="mt-10">
            <h2 className="mb-4 text-center font-serif text-lg text-foreground">{t.chartTitle}</h2>
            <ZiweiChart chart={chart} locale={locale} />
          </div>
        )}

        {/* 解读 */}
        {(pending || reading) && (
          <div className="glass mx-auto mt-8 max-w-3xl rounded-2xl p-6">
            <h2 className="mb-3 font-serif text-base text-foreground">{t.readingTitle}</h2>
            {reading ? (
              <div className="whitespace-pre-wrap text-[13px] leading-[1.9] text-foreground/85">{reading}</div>
            ) : (
              <p className="flex items-center gap-2 text-xs text-muted">
                <Loader2 size={13} className="animate-spin text-accent/70" /> {t.readingWait}
              </p>
            )}
          </div>
        )}

        <p className="mx-auto mt-10 max-w-2xl text-center text-[11px] leading-relaxed text-muted/40">
          {t.disclaimer}
        </p>
      </div>
    </main>
  );
}
