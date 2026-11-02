"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { Locale } from "@/lib/i18n";
import { getChatMessages } from "@/lib/chat-i18n";
import { positionLabel, cardName } from "@/lib/tarot-i18n";
import { useAuth } from "./AuthProvider";
import { OPEN_CAT_EVENT } from "@/lib/cat-open";
import { SignInGate } from "./SignInGate";
import { RichText, loadCustomSkills } from "./ChatContent";
import { BaziChart } from "./BaziChart";
import { BaguaChart } from "./BaguaChart";

const API = "/api/chat";

/* ── 小桌宠物理与节奏参数 ── */
const GRAVITY = 2600; // 下落重力 px/s²
const BOUNCE = 0.42; // 落地反弹系数
const MIN_BOUNCE = 90; // 落地速度低于此值就稳住（不再弹）
const SLEEP_AFTER = 75000; // 无互动 75 秒后打盹
const CAT_W = 90; // 钳制用近似宽度

/** 各小动作的持续时间（毫秒） */
const MICRO_MS: Record<string, number> = {
  look: 2000,
  hop: 960,
  stretch: 1800,
  alert: 620,
  squash: 520,
};

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
 * 「小痕」小桌宠：常驻屏幕角落，自己做小动作（呼吸 / 歪头 / 蹦跳 / 打盹）。
 * 可以拎起来拖走，松手受重力落到屏幕底部、弹一下；点它开聊。
 */
export function CatAssistant({ locale }: { locale: Locale }) {
  const t = getChatMessages(locale);
  const { user, loading } = useAuth();
  /** 本地预览：构建时带 NEXT_PUBLIC_PREVIEW_MODE=1 才生效，正式构建为 false */
  const PREVIEW = process.env.NEXT_PUBLIC_PREVIEW_MODE === "1";

  /* ── 桌宠状态 ── */
  const [chatOpen, setChatOpen] = useState(false);
  const [asleep, setAsleep] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [micro, setMicro] = useState(""); // 当前小动作
  const [bubbleOn, setBubbleOn] = useState(false);
  const [x, setX] = useState(0); // 水平偏移（右锚点为 0，负值向左）
  const [lift, setLift] = useState(0); // 离地高度（0 = 站在屏幕底部）
  const [onLeft, setOnLeft] = useState(false);
  const [activeTick, setActiveTick] = useState(0);

  // 外部（顶栏「对话」、首页按钮、探索页卡片）要求打开弹窗
  useEffect(() => {
    const onOpen = () => {
      setChatOpen(true);
      setBubbleOn(false);
    };
    window.addEventListener(OPEN_CAT_EVENT, onOpen as EventListener);
    return () => window.removeEventListener(OPEN_CAT_EVENT, onOpen as EventListener);
  }, []);

  const xRef = useRef(0);
  const liftRef = useRef(0);
  const vyRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const microTimer = useRef<number | null>(null);
  const asleepRef = useRef(false);
  const dragRef = useRef<{
    px: number;
    py: number;
    bx: number;
    bl: number;
    ly: number;
    lt: number;
    vy: number;
  } | null>(null);
  const movedRef = useRef(false);
  const lastDragEndRef = useRef(0);

  const [turns, setTurns] = useState<CatTurn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* ── 工具函数 ── */

  const clampX = (v: number) => {
    const vw = typeof window === "undefined" ? 1200 : window.innerWidth;
    return Math.max(-(vw - 140), Math.min(0, v));
  };
  const clampLift = (v: number) => {
    const vh = typeof window === "undefined" ? 800 : window.innerHeight;
    return Math.max(0, Math.min(v, vh - 180));
  };
  const computeOnLeft = (nx: number) => {
    try {
      const vw = window.innerWidth;
      const narrow = vw <= 640;
      const cw = narrow ? 76 : 84;
      const rightOff = narrow ? 20 : 24;
      setOnLeft(vw - rightOff - cw / 2 + nx < vw / 2);
    } catch {
      /* ignore */
    }
  };

  const flashMicro = (m: string, dur?: number) => {
    setMicro(m);
    if (microTimer.current !== null) clearTimeout(microTimer.current);
    microTimer.current = window.setTimeout(() => setMicro(""), dur ?? MICRO_MS[m] ?? 1200);
  };

  const poke = () => setActiveTick((v) => v + 1);

  /* ── 物理：下落 + 落地反弹 ── */
  const runFall = (v0: number) => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    let v = v0; // px/s，向下为正
    let last = performance.now();
    const maxLift = clampLift(Infinity);
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.032);
      last = now;
      v += GRAVITY * dt;
      let l = liftRef.current - v * dt;
      if (l <= 0) {
        l = 0;
        if (v > MIN_BOUNCE) {
          v = -v * BOUNCE; // 反弹
          flashMicro("squash");
        } else {
          liftRef.current = 0;
          vyRef.current = 0;
          setLift(0);
          rafRef.current = null;
          return;
        }
      } else if (l > maxLift) {
        l = maxLift;
        if (v < 0) v = 0;
      }
      liftRef.current = l;
      vyRef.current = v;
      setLift(l);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  };

  /* ── 拎起来 / 拖动 ── */
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      px: e.clientX,
      py: e.clientY,
      bx: xRef.current,
      bl: liftRef.current,
      ly: e.clientY,
      lt: performance.now(),
      vy: 0,
    };
    movedRef.current = false;
    if (asleepRef.current) {
      setAsleep(false);
      flashMicro("alert");
    }
    poke();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.px;
    const dy = e.clientY - d.py;
    if (!movedRef.current) {
      if (Math.abs(dx) <= 5 && Math.abs(dy) <= 5) return;
      // 真正开始拖动，才进入「被拎起」状态
      movedRef.current = true;
      setDragging(true);
      setBubbleOn(false);
    }

    const nx = clampX(d.bx + dx);
    const nl = clampLift(d.bl - dy); // 往上拖 = 离地更高
    xRef.current = nx;
    liftRef.current = nl;
    setX(nx);
    setLift(nl);
    computeOnLeft(nx);

    // 记录手指/鼠标瞬时速度，松手时用于「甩」的初速度
    const now = performance.now();
    const dt = Math.max((now - d.lt) / 1000, 0.008);
    const inst = (e.clientY - d.ly) / dt; // px/s，向下为正
    d.vy = d.vy * 0.5 + inst * 0.5;
    d.ly = e.clientY;
    d.lt = now;
  };

  const onPointerUp = () => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    if (movedRef.current) {
      setDragging(false);
      try {
        localStorage.setItem("traces_cat_pos", JSON.stringify({ x: xRef.current }));
      } catch {
        /* ignore */
      }
      runFall(Math.max(-1800, Math.min(2400, d.vy)));
      lastDragEndRef.current = Date.now(); // 拖拽刚结束时忽略随后的 click
    }
  };

  /* ── 点击：唤醒 / 开合对话窗 ── */
  const handleCatClick = () => {
    if (Date.now() - lastDragEndRef.current < 320) return; // 拖拽尾声的点击不算
    poke();
    if (asleepRef.current) {
      setAsleep(false);
      flashMicro("alert");
    }
    setChatOpen((o) => !o);
  };

  /* ── 读回保存的水平位置 ── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("traces_cat_pos");
      if (raw) {
        const p = JSON.parse(raw);
        if (p && typeof p.x === "number") {
          const nx = clampX(p.x);
          xRef.current = nx;
          setX(nx);
          computeOnLeft(nx);
        }
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── 睡眠逻辑：无互动一段时间后打盹 ── */
  useEffect(() => {
    if (chatOpen || dragging) {
      setAsleep(false);
      return;
    }
    const id = window.setTimeout(() => setAsleep(true), SLEEP_AFTER);
    return () => clearTimeout(id);
  }, [chatOpen, dragging, activeTick]);

  useEffect(() => {
    asleepRef.current = asleep;
    if (asleep) setMicro("");
  }, [asleep]);

  /* ── 小动作调度：清醒且空闲时随机做点事 ── */
  useEffect(() => {
    if (asleep || dragging || chatOpen) return;
    let timer: number;
    let cancelled = false;
    const schedule = () => {
      timer = window.setTimeout(
        () => {
          if (cancelled) return;
          const pick = (["look", "look", "hop", "stretch"] as const)[Math.floor(Math.random() * 4)];
          flashMicro(pick);
          schedule();
        },
        6000 + Math.random() * 11000
      );
    };
    schedule();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asleep, dragging, chatOpen]);

  /* ── 气泡：偶尔冒出来喊人聊天 ── */
  useEffect(() => {
    if (chatOpen || dragging || asleep) {
      setBubbleOn(false);
      return;
    }
    let showTimer: number;
    let hideTimer: number;
    let cancelled = false;
    const schedule = (delay: number, dur: number) => {
      showTimer = window.setTimeout(() => {
        if (cancelled) return;
        setBubbleOn(true);
        hideTimer = window.setTimeout(() => {
          if (cancelled) return;
          setBubbleOn(false);
          schedule(65000 + Math.random() * 55000, 9000);
        }, dur);
      }, delay);
    };
    schedule(2500, 11000);
    return () => {
      cancelled = true;
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [chatOpen, dragging, asleep]);

  /* ── 视口变化时重新钳制 ── */
  useEffect(() => {
    const onResize = () => {
      const nx = clampX(xRef.current);
      xRef.current = nx;
      setX(nx);
      const nl = clampLift(liftRef.current);
      liftRef.current = nl;
      setLift(nl);
      computeOnLeft(nx);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── 卸载清理 ── */
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (microTimer.current !== null) clearTimeout(microTimer.current);
    };
  }, []);

  /* ── 对话 ── */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, chatOpen]);

  /** 打开弹窗后自动聚焦输入框：少点一下，更容易开口 */
  useEffect(() => {
    if (!chatOpen) return;
    const id = setTimeout(() => taRef.current?.focus(), 260);
    return () => clearTimeout(id);
  }, [chatOpen]);

  const taRef = useRef<HTMLTextAreaElement>(null);

  const send = async (q: string) => {
    const text = q.trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);
    poke();
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

  /* ── 渲染辅助 ── */
  const microCls = [
    micro === "look" ? "cat-looking" : "",
    micro === "hop" ? "cat-hopping" : "",
    micro === "stretch" ? "cat-stretching" : "",
    micro === "alert" ? "cat-alert" : "",
    micro === "squash" ? "cat-squash" : "",
    dragging ? "cat-held" : "",
    asleep ? "cat-doze" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const glowScale = Math.max(0.42, 1 - lift / 520);
  const glowOpacity = Math.max(0.12, 1 - lift / 460);

  return (
    <>
      {/* ── 小桌宠 ── */}
      <div className="pointer-events-none fixed bottom-5 end-5 z-50 h-[76px] w-[76px] sm:bottom-6 sm:end-6 sm:h-[84px] sm:w-[84px]">
        {/* 地面光晕（贴着屏幕底部，猫被拎起来时会变小变淡） */}
        <div
          className="absolute bottom-0 left-1/2"
          style={{
            transform: "translateX(calc(-50% + " + x + "px))",
            willChange: "transform",
          }}
        >
          <div
            className="cat-ground-glow h-3 w-24 rounded-[50%] blur-[2px]"
            style={{ transform: "scale(" + glowScale + ")", opacity: glowOpacity }}
          />
        </div>

        {/* 猫本体（位置层：水平偏移 + 离地高度） */}
        <div
          role="button"
          tabIndex={0}
          aria-label={t.catTitle}
          title={t.catTitle}
          className="pointer-events-auto absolute inset-0 select-none"
          style={{
            transform: "translate3d(" + x + "px, " + -lift + "px, 0)",
            willChange: "transform",
            touchAction: "none",
            cursor: dragging ? "grabbing" : "grab",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={handleCatClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleCatClick();
            }
          }}
        >
          {/* 呼吸层 */}
          <div className={"h-full w-full " + (asleep ? "cat-breathe-slow" : "cat-breathe")}>
            {/* 小动作层 */}
            <div className={"h-full w-full " + microCls}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/xiaohen.png"
                alt=""
                draggable={false}
                className={
                  "cat-img pointer-events-none h-full w-full object-contain" + (asleep ? " cat-dim" : "")
                }
                style={{ filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.55))" }}
              />
            </div>
          </div>

          {/* 打盹的 Zzz */}
          {asleep && (
            <div className="pointer-events-none absolute -end-1 -top-4 h-9 w-9">
              <span className="cat-zzz" style={{ animationDelay: "0s" }}>
                z
              </span>
              <span className="cat-zzz" style={{ animationDelay: "0.95s" }}>
                Z
              </span>
              <span className="cat-zzz" style={{ animationDelay: "1.9s" }}>
                z
              </span>
            </div>
          )}

          {/* 搭话气泡（跟着拖，分侧避免出屏） */}
          {bubbleOn && !dragging && !asleep && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                handleCatClick();
              }}
              className={
                "cat-bubble pointer-events-auto absolute bottom-5 w-max max-w-[210px] border border-accent/25 bg-[#141109]/95 px-3.5 py-2.5 text-start text-xs leading-relaxed text-foreground/90 shadow-lg shadow-black/40 backdrop-blur-sm " +
                (onLeft ? "left-full ms-3 rounded-2xl rounded-bl-md" : "right-full me-3 rounded-2xl rounded-br-md")
              }
            >
              {t.catBubble}
              <span
                className={
                  "absolute -bottom-0 h-2.5 w-2.5 rotate-45 bg-[#141109]/95 " +
                  (onLeft ? "start-2 border-b border-l border-accent/25" : "end-2 border-b border-r border-accent/25")
                }
              />
            </button>
          )}
        </div>
      </div>

      {/* ── 对话窗 ── */}
      {chatOpen && (
        <div
          className={
            "cat-chat fixed bottom-24 z-50 flex h-[560px] max-h-[calc(100vh-7.5rem)] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d0b09]/[0.97] shadow-2xl shadow-black/60 backdrop-blur-xl " +
            (onLeft ? "start-4 sm:start-6" : "end-4 sm:end-6")
          }
        >
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
            <button
              onClick={() => setChatOpen(false)}
              className="text-muted transition hover:text-foreground"
              aria-label="close"
            >
              <X size={16} />
            </button>
          </div>

          {user || PREVIEW ? (
            <>
              {/* 消息区 */}
              <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
                {turns.length === 0 && (
                  <div className="flex h-full flex-col justify-center gap-3">
                    {/* 小痕先自我介绍，像是在跟你开口 */}
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-accent/30">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/brand/xiaohen-avatar.png" alt="" className="h-full w-full object-cover" />
                      </span>
                      <div className="min-w-0 max-w-[85%]">
                        <p className="mb-1 text-[10px] tracking-wide text-accent/70">{t.catTitle}</p>
                        <div className="rounded-2xl rounded-ss-sm border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-foreground/85">
                          {t.catHello}
                        </div>
                      </div>
                    </div>

                    {/* 引导：点一下就能开始，不用自己想问什么 */}
                    <div className="ms-10 flex flex-wrap gap-1.5">
                      {t.catStarters.map((s0) => (
                        <button
                          key={s0}
                          onClick={() => send(s0)}
                          className="rounded-full border border-white/10 bg-white/[0.02] px-2.5 py-1 text-[11px] text-muted transition hover:border-accent/35 hover:bg-accent/[0.08] hover:text-accent"
                        >
                          {s0}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {turns.map((turn, i) => (
                  <div key={i}>
                    {turn.role === "user" ? (
                      <div className="ms-auto max-w-[85%] rounded-2xl rounded-br-md bg-accent/15 px-3.5 py-2 text-sm text-foreground/90">
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
                    ref={taRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send(input);
                      }
                    }}
                    rows={1}
                    placeholder={t.catPlaceholder}
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
