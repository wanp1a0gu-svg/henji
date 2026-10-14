"use client";

import { Loader2, LockKeyhole, Sparkles } from "lucide-react";
import { Locale } from "@/lib/i18n";
import { getAuthMessages } from "@/lib/auth-i18n";
import { useAuth } from "./AuthProvider";

/**
 * 功能登录门禁：未登录时以登录卡片替代功能内容，登录后渲染 children。
 * 会话加载中先显示占位（避免已登录用户看到门禁闪屏）。
 */
export function SignInGate({
  locale,
  children,
  className = "",
}: {
  locale: Locale;
  children: React.ReactNode;
  className?: string;
}) {
  const { user, loading, openAuth } = useAuth();
  const a = getAuthMessages(locale);

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-16 ${className}`}>
        <Loader2 size={18} className="animate-spin text-accent/70" />
      </div>
    );
  }

  if (user) return <>{children}</>;

  return (
    <div className={`mx-auto w-full max-w-md ${className}`}>
      <div className="glass glow rounded-2xl px-6 py-10 text-center sm:px-10">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-accent/25 bg-accent/10">
          <LockKeyhole size={20} className="text-accent" />
        </div>
        <h3 className="font-serif text-xl text-foreground">{a.gateTitle}</h3>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted">{a.gateDesc}</p>
        <button
          onClick={openAuth}
          className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-7 py-3 text-sm font-medium text-background shadow-lg shadow-accent/20 transition hover:bg-accent-light"
        >
          <Sparkles size={15} /> {a.gateCta}
        </button>
      </div>
    </div>
  );
}
