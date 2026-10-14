"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { Locale } from "@/lib/i18n";
import { getChatMessages } from "@/lib/chat-i18n";
import { positionLabel, cardName } from "@/lib/tarot-i18n";
import { useAuth } from "./AuthProvider";
import { SignInGate } from "./SignInGate";
import { RichText, loadCustomSkills } from "./ChatContent";
import { BaziChart } from "./BaziChart";
import { BaguaChart } from "./BaguaChart";

const API = "/api/chat";

interface CatTurn {
  role: "user" | "assistant";
  content: string;
  artifacts?: any[];
  pending?: boolean;
  error?: boolean;
}

/** 轮询对话任务。 */
async function poll(jobId: string): Promise<any> {
  const deadline = Date.now() + 240000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2500));
    try {
      const res = await fetch(API + "?id=" + encodeURIComponent(jobId));
      if (res.status === 404) return null;
      if (!res.ok) continue;
      const j = (await res.json()) as any;
      if (j.status === "done") return j;
      if (j.status === "error") return { error: j.error || "" };
    } catch {
      /* 抖动继续 */
    }
  }
  return null;
}

/**
 * 「小痕」浮动助手：右下角墨猫按钮，点击弹出对话窗。
 * 全站可用；复用 /api/chat 与知识库链路；未登录时展示登录引导。
 */
export function CatAssistant({ locale }: { locale: Locale }) {
  const t = getChatMessages(locale);
  const { user, loading } = useAuth();
  // peek=探头躲在右边；resting=落地待命；open=对话打开
  const [mode, setMode] = useState<"peek" | "resting" | "open">("peek");
  const [bubbleOn, setBubbleOn] = useState(false);
  const [landed, setLanded] = useState(false);
  // 拖拽（位置持久化到 localStorage）
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ px: number; py: number; bx: number; by: number } | null>(null);
  const movedRef = useRef(false);
  const posRef = useRef({ x: 0, y: 0 }); // 最新位置（拖拽期间 state 可能未及时刷新）
  const [onLeft, setOnLeft] = useState(false); // 猫是否在屏幕左半边（决定探头方向/气泡方向）

  const computeOnLeft = (next: { x: number }) => {
    try {
      const centerX = window.innerWidth - 58 + next.x;
      setOnLeft(centerX < window.innerWidth / 2);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("traces_cat_pos");
      if (raw) {
        const p = JSON.parse(raw);
        if (p && typeof p.x === "number" && typeof p.y === "number") {
          setPos(p);
          posRef.current = p;
          computeOnLeft(p);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const onDragDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) {
      // 按钮区域也允许拖拽（pointer 捕获在容器上）
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { px: e.clientX, py: e.clientY, bx: pos.x, by: pos.y };
    movedRef.current = false;
    setDragging(true);
  };
  const onDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.px;
    const dy = e.clientY - d.py;
    if (!movedRef.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) movedRef.current = true;
    if (!movedRef.current) return;
    const maxX = Math.max(0, window.innerWidth - 150);
    const maxY = Math.max(0, window.innerHeight - 200);
    const next = {
      x: Math.max(-maxX, Math.min(maxX, d.bx + dx)),
      y: Math.max(-maxY, Math.min(maxY, d.by + dy)),
    };
    posRef.current = next;
    setPos(next);
    computeOnLeft(next);
  };
  const onDragUp = () => {
    if (dragRef.current) {
      try {
        localStorage.setItem("traces_cat_pos", JSON.stringify(posRef.current));
      } catch {
        /* ignore */
      }
    }
    dragRef.current = null;
    setDragging(false);
  };
  const [turns, setTurns] = useState<CatTurn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const open = mode === "open";

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, open]);

  // 视口尺寸变化时重算左右
  useEffect(() => {
    const onResize = () => computeOnLeft(posRef.current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // 气泡：探头一会儿后冒出来（开聊时隐去）
  useEffect(() => {
    setBubbleOn(false);
    if (mode === "open") return;
    const t = setTimeout(() => setBubbleOn(true), mode === "peek" ? 2200 : 900);
    return () => clearTimeout(t);
  }, [mode]);

  // 待命 13 秒没人理 → 缩回边上
  useEffect(() => {
    if (mode !== "resting") return;
    const t = setTimeout(() => setMode("peek"), 13000);
    return () => clearTimeout(t);
  }, [mode]);

  // 点击小猫：探头 → 跳下来落地 → 开聊；开聊中点击 → 收起并待命
  const handleCatClick = () => {
    if (movedRef.current) {
      movedRef.current = false;
      return; // 拖拽后不触发点击
    }
    if (mode === "open") {
      setMode("resting");
      return;
    }
    if (mode === "peek") {
      setMode("resting"); // 触发「跳下来」过渡
      setLanded(true);
      setTimeout(() => setLanded(false), 520);
      setTimeout(() => setMode("open"), 800);
      return;
    }
    setMode("open");
  };

  const send = async (q: string) => {
    const text = q.trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);
    const history = turns.filter((x) => !x.error).map((x) => ({ role: x.role, content: x.content }));
    setTurns((prev) => [
      ...prev,
      { role: "user", content: text },
      { role: "assistant", content: "", pending: true },
    ]);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...history, { role: "user", content: text }],
          locale,
          skills: await loadCustomSkills(),
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as any;
        throw new Error(j.error || String(res.status));
      }
      const { jobId } = (await res.json()) as any;
      if (!jobId) throw new Error("no job");
      const out = await poll(jobId);
      setTurns((prev) => {
        const copy = prev.slice();
        const idx = copy.length - 1;
        if (out && out.reply) {
          copy[idx] = { role: "assistant", content: out.reply, artifacts: out.artifacts || undefined };
        } else {
          copy[idx] = { role: "assistant", content: (out && out.error) || t.errorGeneric, error: true };
        }
        return copy;
      });
    } catch (e: any) {
      setTurns((prev) => {
        const copy = prev.slice();
        copy[copy.length - 1] = { role: "assistant", content: (e && e.message) || t.errorGeneric, error: true };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* 浮动小猫：可拖拽（位置记忆）｜探头态只露歪头，落地/待命显示全身 */}
      <div className="pointer-events-none fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6">
        <div
          style={{
            transform: "translate(" + pos.x + "px, " + pos.y + "px)",
            transition: dragging ? "none" : "transform 0.5s cubic-bezier(0.28, 1.5, 0.5, 1)",
          }}
        >
          <div
            className={"pointer-events-auto relative h-[76px] w-[76px] " + (mode === "peek" ? "cat-peeking" : "") + (landed ? " cat-landed" : "")}
            style={{ touchAction: "none", cursor: dragging ? "grabbing" : "grab" }}
            onPointerDown={onDragDown}
            onPointerMove={onDragMove}
            onPointerUp={onDragUp}
            onPointerCancel={onDragUp}
          >
            {/* 头（探头态）：脖子靠屏幕边缘（身体藏屏外），脸朝页面内部看 */}
            <div
              className="pointer-events-none absolute bottom-2 right-0 w-[88px]"
              style={{
                transform:
                  mode === "peek"
                    ? "translateX(" + (onLeft ? "-30%" : "30%") + ") rotate(" + (onLeft ? "6deg" : "-6deg") + ")"
                    : "translateX(0%) rotate(0deg)",
                opacity: mode === "peek" ? 1 : 0,
                transformOrigin: "50% 84%",
                transition: "transform 0.7s cubic-bezier(0.28, 1.5, 0.5, 1), opacity 0.35s ease",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={onLeft ? "/brand/xiaohen-head-right.png" : "/brand/xiaohen-head-left.png"}
                alt="小痕"
                className="cat-head-img w-full object-contain"
                style={{ filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.55))" }}
              />
            </div>

            {/* 全身（落地/待命/开聊） */}
            <button
              onClick={handleCatClick}
              aria-label={t.catTitle}
              title={t.catTitle}
              className="absolute inset-0 block"
            >
              <img
                src="/brand/xiaohen.png"
                alt="小痕"
                className="cat-full-img h-full w-full object-contain"
                style={{
                  transform: mode === "peek" ? "translateY(-64px) scale(0.82)" : "translateY(0) scale(1)",
                  opacity: mode === "peek" ? 0 : 1,
                  filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.55))",
                  transition: "transform 0.7s cubic-bezier(0.28, 1.5, 0.5, 1), opacity 0.3s ease 0.12s",
                }}
              />
            </button>

            {/* 交互气泡（跟随拖拽位置） */}
            {bubbleOn && (
              <button
                onClick={handleCatClick}
                className={
                  "cat-bubble pointer-events-auto absolute bottom-4 w-max max-w-[210px] border border-accent/25 bg-[#141109]/95 px-3.5 py-2.5 text-left text-xs leading-relaxed text-foreground/90 shadow-lg shadow-black/40 backdrop-blur-sm " +
                  (onLeft ? "left-full ml-3 rounded-2xl rounded-bl-md" : "right-full mr-3 rounded-2xl rounded-br-md")
                }
              >
                {t.catBubble}
                <span
                  className={
                    "absolute -bottom-0 h-2.5 w-2.5 rotate-45 bg-[#141109]/95 " +
                    (onLeft ? "left-2 border-b border-l border-accent/25" : "right-2 border-b border-r border-accent/25")
                  }
                />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 对话弹窗 */}
      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex h-[560px] max-h-[calc(100vh-7.5rem)] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d0b09]/[0.97] shadow-2xl shadow-black/60 backdrop-blur-xl sm:right-6">
          {/* 头部 */}
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/xiaohen.png" alt="" className="h-9 w-9 object-contain" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-foreground">{t.catTitle}</p>
              <p className="flex items-center gap-1.5 text-[10px] text-green-300/80">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Online
              </p>
            </div>
            <button onClick={() => setMode("resting")} className="text-muted transition hover:text-foreground" aria-label="close">
              <X size={16} />
            </button>
          </div>

          {user ? (
            <>
              {/* 消息区 */}
              <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
                {turns.length === 0 && (
                  <div className="py-3 text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/brand/xiaohen.png" alt="" className="mx-auto mb-3 h-20 w-20 object-contain" />
                    <p className="mb-4 text-sm text-muted">{t.catIntro}</p>
                    <div className="mx-auto flex max-w-[290px] flex-col gap-2">
                      {t.suggestions.slice(0, 4).map((s) => (
                        <button
                          key={s}
                          onClick={() => send(s)}
                          className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-[11px] leading-relaxed text-muted transition hover:border-accent/40 hover:text-foreground"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {turns.map((turn, i) => (
                  <div key={i}>
                    {turn.role === "user" ? (
                      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-accent/15 px-3.5 py-2 text-sm text-foreground/90">
                        {turn.content}
                      </div>
                    ) : (
                      <div className="max-w-[94%]">
                        {turn.pending ? (
                          <span className="inline-flex items-center gap-2 text-xs text-muted">
                            <Loader2 size={13} className="animate-spin text-accent" /> {t.thinking}
                          </span>
                        ) : turn.error ? (
                          <p className="text-xs text-red-300/80">{turn.content}</p>
                        ) : (
                          <RichText text={turn.content} />
                        )}
                      </div>
                    )}

                    {turn.artifacts?.map((a: any, j: number) =>
                      a.type === "bazi" && a.chart ? (
                        <div key={j} className="mt-3">
                          <BaziChart chart={a.chart} locale={locale} />
                        </div>
                      ) : a.type === "bagua" && a.draw ? (
                        <div key={j} className="mt-3">
                          <BaguaChart draw={a.draw} locale={locale} />
                        </div>
                      ) : a.type === "tarot" && a.draw ? (
                        <div key={j} className="mt-3 grid grid-cols-2 gap-1.5">
                          {a.draw.cards.map((c: any, k: number) => {
                            const isRev = c.orientation === "逆位";
                            return (
                              <div
                                key={k}
                                className={`rounded-lg border px-2 py-2.5 text-center ${
                                  isRev ? "border-white/[0.07] bg-white/[0.015]" : "border-accent/20 bg-accent/[0.03]"
                                }`}
                              >
                                <div className="text-[9px] tracking-wide text-muted">
                                  {positionLabel(locale, c.position)}
                                </div>
                                <div className={`mt-1 text-[11px] leading-snug ${isRev ? "text-muted" : "text-foreground/85"}`}>
                                  {cardName(locale, c.card, c.cardEn)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : null
                    )}
                  </div>
                ))}
              </div>

              {/* 输入区 */}
              <div className="border-t border-white/[0.06] p-2.5">
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send(input);
                      }
                    }}
                    rows={1}
                    placeholder={t.placeholder}
                    disabled={busy}
                    className="max-h-24 min-h-[40px] flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[16px] text-foreground outline-none transition placeholder:text-[13px] placeholder:text-muted/50 focus:border-accent/50 disabled:opacity-60 sm:text-sm sm:placeholder:text-sm"
                  />
                  <button
                    onClick={() => send(input)}
                    disabled={busy || !input.trim()}
                    className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-xl bg-accent text-background transition hover:bg-accent-light disabled:opacity-40"
                    aria-label={t.send}
                  >
                    {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center overflow-y-auto p-4">
              {loading ? (
                <Loader2 size={18} className="animate-spin text-accent/70" />
              ) : (
                <SignInGate locale={locale}>
                  <span />
                </SignInGate>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
