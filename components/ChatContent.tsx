"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, Send, Loader2, RotateCcw } from "lucide-react";
import { Locale } from "@/lib/i18n";
import { getChatMessages } from "@/lib/chat-i18n";
import { getTarotMessages, positionLabel, cardName, TAROT_ELEMENT_COLORS } from "@/lib/tarot-i18n";
import { BaziChart, BaziChartData } from "./BaziChart";
import { BaguaChart, BaguaDrawData } from "./BaguaChart";
import { getCloud } from "@/lib/cloud";
import { SignInGate } from "./SignInGate";

/** 同源 API（server.js）；对话依赖服务端工具调用，不做跨域回退。 */
const API = "/api/chat";

interface ChatArtifact {
  type: "bazi" | "tarot" | "bagua";
  chart?: BaziChartData;
  /** tarot 牌面 / bagua 卦象（结构随 type 不同） */
  draw?: any;
}

interface Turn {
  role: "user" | "assistant";
  content: string;
  artifacts?: ChatArtifact[];
  tool?: string | null;
  pending?: boolean;
  error?: boolean;
}

/** 站主上传的知识库（模块级缓存，每页面会话拉一次）。 */
let _skillsCache: { name: string; content: string }[] | null = null;
export async function loadCustomSkills(): Promise<{ name: string; content: string }[]> {
  if (_skillsCache) return _skillsCache;
  try {
    const { data } = await getCloud()
      .database.from("skills")
      .select("name,content")
      .eq("enabled", true)
      .order("sort", { ascending: true })
      .limit(8);
    _skillsCache = Array.isArray(data)
      ? (data as any[]).map((x) => ({ name: String(x.name || ""), content: String(x.content || "") }))
      : [];
  } catch {
    _skillsCache = [];
  }
  return _skillsCache;
}

/** 轮询异步对话任务。返回 { reply, artifacts, tool } 或 { error }。 */
async function pollChat(jobId: string): Promise<{
  reply?: string;
  artifacts?: ChatArtifact[] | null;
  tool?: string | null;
  error?: string;
}> {
  const deadline = Date.now() + 240000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2500));
    try {
      const res = await fetch(`${API}?id=${encodeURIComponent(jobId)}`);
      if (res.status === 404) return { error: "expired" };
      if (!res.ok) continue;
      const j = (await res.json()) as any;
      if (j.status === "done") return { reply: j.reply, artifacts: j.artifacts, tool: j.tool };
      if (j.status === "error") return { error: j.error || "error" };
    } catch {
      /* 网络抖动 → 继续轮询 */
    }
  }
  return { error: "timeout" };
}

/** 极简 Markdown 渲染：标题 / 加粗 / 列表 / 段落。 */
export function RichText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-2 text-sm leading-relaxed text-muted">
      {lines.map((raw, i) => {
        const line = raw.trim();
        if (!line) return null;

        // 标题
        const h = /^(#{1,4})\s+(.*)$/.exec(line);
        if (h) {
          const level = h[1].length;
          return (
            <p
              key={i}
              className={
                level <= 2
                  ? "pt-1 font-serif text-base text-accent"
                  : "pt-1 font-serif text-sm text-foreground/90"
              }
            >
              {inline(h[2])}
            </p>
          );
        }

        // 分隔线
        if (/^(-{3,}|\*{3,})$/.test(line)) {
          return <div key={i} className="my-3 h-px bg-white/[0.07]" />;
        }

        // 列表
        const li = /^(?:[-*·•]|\d+[.、)])\s+(.*)$/.exec(line);
        if (li) {
          const mark = /^\d/.test(line) ? line.match(/^\d+/)?.[0] + "." : "·";
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="shrink-0 text-accent/60">{mark}</span>
              <span className="flex-1">{inline(li[1])}</span>
            </div>
          );
        }

        return <p key={i}>{inline(line)}</p>;
      })}
    </div>
  );
}

/** 行内格式：**加粗**、*斜体*、`代码`、《书名》。 */
function inline(s: string) {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) parts.push(s.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) {
      parts.push(
        <strong key={k++} className="font-medium text-foreground">
          {t.slice(2, -2)}
        </strong>
      );
    } else if (t.startsWith("`")) {
      parts.push(
        <code key={k++} className="rounded bg-white/[0.06] px-1 py-0.5 text-[12px] text-accent/90">
          {t.slice(1, -1)}
        </code>
      );
    } else {
      parts.push(
        <em key={k++} className="not-italic text-foreground/85">
          {t.slice(1, -1)}
        </em>
      );
    }
    last = m.index + t.length;
  }
  if (last < s.length) parts.push(s.slice(last));
  return parts.length ? parts : s;
}

export function ChatContent({ locale }: { locale: Locale }) {
  const t = getChatMessages(locale);
  const tt = getTarotMessages(locale);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns]);

  const send = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q || busy) return;
      setInput("");
      setBusy(true);

      const history = turns
        .filter((x) => !x.error)
        .map((x) => ({ role: x.role, content: x.content }));
      const next: Turn[] = [...turns, { role: "user", content: q }];
      const placeholderIdx = next.length;
      next.push({ role: "assistant", content: "", pending: true });
      setTurns(next);

      try {
        const res = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...history, { role: "user", content: q }],
            locale,
            skills: await loadCustomSkills(),
          }),
        });

        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error || String(res.status));
        }
        const { jobId } = (await res.json()) as { jobId?: string };
        if (!jobId) throw new Error("no job");

        const out = await pollChat(jobId);
        setTurns((prev) => {
          const copy = prev.slice();
          if (out.error) {
            copy[placeholderIdx] = { role: "assistant", content: t.errorGeneric, error: true };
          } else {
            copy[placeholderIdx] = {
              role: "assistant",
              content: out.reply || "",
              artifacts: out.artifacts || undefined,
              tool: out.tool || null,
            };
          }
          return copy;
        });
      } catch {
        setTurns((prev) => {
          const copy = prev.slice();
          copy[placeholderIdx] = { role: "assistant", content: t.errorGeneric, error: true };
          return copy;
        });
      } finally {
        setBusy(false);
        requestAnimationFrame(() => taRef.current?.focus());
      }
    },
    [busy, turns, locale, t.errorGeneric]
  );

  const reset = () => {
    setTurns([]);
    setInput("");
    requestAnimationFrame(() => taRef.current?.focus());
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex items-center justify-center gap-3">
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-accent/60" />
          <p className="text-xs uppercase tracking-[0.35em] text-accent">{t.eyebrow}</p>
          <div className="h-px w-8 bg-gradient-to-l from-transparent to-accent/60" />
        </div>
        <h2 className="font-serif text-3xl font-light tracking-wide text-gradient sm:text-4xl">
          {t.title}
        </h2>
      </div>

      {/* Conversation panel */}
      <SignInGate locale={locale}>
      <div className="glass glow overflow-hidden rounded-2xl">
        <div
          ref={scrollRef}
          className="max-h-[560px] min-h-[220px] space-y-5 overflow-y-auto px-4 py-5 sm:px-6"
        >
          {turns.length === 0 && (
            <div className="py-6 text-center">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-accent/20 bg-accent/10">
                <Sparkles size={20} className="text-accent" />
              </div>
              <div className="mx-auto flex max-w-lg flex-col gap-2">
                {t.suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-2.5 text-left text-[13px] text-muted transition hover:border-accent/30 hover:bg-accent/[0.06] hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {turns.map((turn, i) => (
            <div key={i} className="flex gap-3">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                  turn.role === "user"
                    ? "border-white/10 bg-white/[0.05] text-muted"
                    : "border-accent/25 bg-accent/10 text-accent"
                }`}
              >
                {turn.role === "user" ? "·" : <Sparkles size={13} />}
              </div>

              <div className="min-w-0 flex-1">
                <p className="mb-1.5 text-[10px] uppercase tracking-wider text-muted/50">
                  {turn.role === "user" ? t.you : t.assistant}
                </p>

                {turn.pending ? (
                  <div className="flex items-center gap-2 py-1 text-sm text-muted">
                    <Loader2 size={14} className="animate-spin text-accent" />
                    {t.thinking}
                  </div>
                ) : (
                  <div className={turn.error ? "text-sm text-red-300/80" : ""}>
                    {turn.error ? (
                      <p className="text-sm text-red-300/80">{turn.content}</p>
                    ) : (
                      <RichText text={turn.content} />
                    )}
                  </div>
                )}

                {/* Artifacts */}
                {turn.artifacts?.map((a, j) =>
                  a.type === "bazi" && a.chart ? (
                    <div key={j} className="mt-4">
                      <p className="mb-2 text-[10px] uppercase tracking-wider text-accent/70">
                        {t.cardBazi}
                      </p>
                      <BaziChart chart={a.chart} locale={locale} />
                    </div>
                  ) : a.type === "tarot" && a.draw ? (
                    <div key={j} className="mt-4">
                      <p className="mb-2 text-[10px] uppercase tracking-wider text-accent/70">
                        {t.cardTarot}
                      </p>
                      <div className="glass rounded-2xl p-4 sm:p-5">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                          <p className="font-serif text-base text-accent">{a.draw.spreadName}</p>
                          <p className="text-[10px] text-muted/60">
                            seed{" "}
                            {a.draw.seed.length > 12 ? a.draw.seed.slice(0, 12) + "…" : a.draw.seed}{" "}
                            · {a.draw.timeFactor}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {a.draw.cards.map((c: any, k: number) => {
                            const isRev = c.orientation === "逆位";
                            return (
                              <div
                                key={k}
                                className={`rounded-xl border px-2.5 py-3.5 text-center ${
                                  isRev
                                    ? "border-white/[0.07] bg-white/[0.015]"
                                    : "border-accent/20 bg-accent/[0.03]"
                                }`}
                              >
                                <div className="text-[10px] tracking-widest text-muted">
                                  {positionLabel(locale, c.position)}
                                </div>
                                <div
                                  className={`mt-2.5 font-serif text-[13px] leading-snug ${
                                    isRev ? "text-muted" : "text-foreground"
                                  }`}
                                >
                                  {cardName(locale, c.card, c.cardEn)}
                                </div>
                                <div
                                  className={`mx-auto mt-2 inline-flex rounded-full border px-2 py-0.5 text-[9px] ${
                                    isRev
                                      ? "border-white/10 text-muted/70"
                                      : "border-accent/25 text-accent/90"
                                  }`}
                                >
                                  {isRev ? tt.reversed : tt.upright}
                                </div>
                                <div className="mt-2 flex items-center justify-center gap-1.5">
                                  <span
                                    className="inline-block h-1.5 w-1.5 rounded-full"
                                    style={{
                                      background: TAROT_ELEMENT_COLORS[c.element] || "#9c958a",
                                    }}
                                  />
                                  {c.isMajor && (
                                    <span className="text-[9px] text-accent/70">★</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : a.type === "bagua" && a.draw ? (
                    <div key={j} className="mt-4">
                      <p className="mb-2 text-[10px] uppercase tracking-wider text-accent/70">
                        {t.cardBagua}
                      </p>
                      <BaguaChart draw={a.draw} locale={locale} />
                    </div>
                  ) : null
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-white/[0.06] bg-white/[0.015] p-3 sm:p-4">
          <div className="flex items-end gap-2">
            <textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              rows={1}
              placeholder={t.placeholder}
              disabled={busy}
              className="max-h-32 min-h-[46px] flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[16px] text-foreground outline-none transition placeholder:text-[13px] placeholder:text-muted/50 focus:border-accent/50 focus:bg-white/[0.05] disabled:opacity-60 sm:text-sm sm:placeholder:text-sm"
            />
            <button
              onClick={() => send(input)}
              disabled={busy || !input.trim()}
              className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-accent text-background shadow-lg shadow-accent/20 transition hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={t.send}
            >
              {busy ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
            </button>
            {turns.length > 0 && (
              <button
                onClick={reset}
                disabled={busy}
                className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border border-white/10 text-muted transition hover:border-accent/30 hover:text-accent disabled:opacity-40"
                aria-label={t.clear}
                title={t.startOver}
              >
                <RotateCcw size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
      </SignInGate>

      <p className="mx-auto mt-6 max-w-2xl px-2 text-center text-[10px] leading-relaxed text-muted/55">
        {t.disclaimer}
      </p>
    </div>
  );
}
