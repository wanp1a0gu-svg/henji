"use client";

import { useEffect, useState } from "react";
import { X, Mail, KeyRound, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { getCloud } from "@/lib/cloud";
import { Locale } from "@/lib/i18n";
import { getAuthMessages } from "@/lib/auth-i18n";

type Tab = "password" | "otp";
type View = "signin" | "reset";

interface PendingOtp {
  email: string;
  verificationId: string;
  isExistingUser: boolean;
}

export function AuthModal({
  locale,
  onClose,
  onSuccess,
}: {
  locale: Locale;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}) {
  const m = getAuthMessages(locale);
  const [view, setView] = useState<View>("signin");
  const [tab, setTab] = useState<Tab>("password");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // sign-in (password)
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // sign-in (email otp)
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpPassword, setOtpPassword] = useState("");
  const [pending, setPending] = useState<PendingOtp | null>(null);
  const [countdown, setCountdown] = useState(0);

  // reset password
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetStarted, setResetStarted] = useState(false);
  const [resetCountdown, setResetCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    if (resetCountdown <= 0) return;
    const t = setTimeout(() => setResetCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resetCountdown]);

  const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  /* ---------------- password login ---------------- */
  const submitPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!emailOk(loginEmail)) return setError(m.errEmail);
    if (loginPassword.length < 6) return setError(m.errPassword);
    setBusy(true);
    try {
      const { error: err } = await getCloud().auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (err) {
        setError(err.message || m.errGeneric);
        return;
      }
      await onSuccess();
    } catch {
      setError(m.errGeneric);
    } finally {
      setBusy(false);
    }
  };

  /* ---------------- email otp ---------------- */
  const sendOtp = async () => {
    setError("");
    setNotice("");
    if (!emailOk(otpEmail)) return setError(m.errEmail);
    setBusy(true);
    try {
      const sent = await getCloud().auth.sendOtp({ email: otpEmail });
      if (sent.error) {
        setError(sent.error.message || m.errGeneric);
        return;
      }
      setPending({
        email: otpEmail,
        verificationId: sent.data.verificationId,
        isExistingUser: sent.data.isExistingUser,
      });
      setCountdown(60);
      setNotice(m.codeSent);
    } catch {
      setError(m.errGeneric);
    } finally {
      setBusy(false);
    }
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!pending || pending.email !== otpEmail) {
      setError(m.errGeneric);
      return;
    }
    if (!otpCode.trim()) return setError(m.errCode);
    if (!pending.isExistingUser && otpPassword.length > 0 && otpPassword.length < 6) {
      return setError(m.errPassword);
    }
    setBusy(true);
    try {
      const completed = await getCloud().auth.verifyOtp({
        email: pending.email,
        verificationId: pending.verificationId,
        isExistingUser: pending.isExistingUser,
        token: otpCode.trim(),
        password: pending.isExistingUser ? undefined : otpPassword || undefined,
      } as any);
      if (completed.error) {
        setError(completed.error.message || m.errGeneric);
        return;
      }
      setPending(null);
      await onSuccess();
    } catch {
      setError(m.errGeneric);
    } finally {
      setBusy(false);
    }
  };

  /* ---------------- reset password ---------------- */
  const sendResetCode = async () => {
    setError("");
    setNotice("");
    if (!emailOk(resetEmail)) return setError(m.errEmail);
    setBusy(true);
    try {
      const started = await getCloud().auth.resetPasswordForEmail(resetEmail);
      if (started.error) {
        setError(started.error.message || m.errGeneric);
        return;
      }
      (window as any).__wbResetHandle = started.data;
      setResetStarted(true);
      setResetCountdown(60);
      setNotice(m.codeSent);
    } catch {
      setError(m.errGeneric);
    } finally {
      setBusy(false);
    }
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!resetCode.trim()) return setError(m.errCode);
    if (resetPassword.length < 6) return setError(m.errPassword);
    const handle = (window as any).__wbResetHandle;
    if (!handle) {
      setError(m.errGeneric);
      return;
    }
    setBusy(true);
    try {
      const completed = await handle.updateUser({
        nonce: resetCode.trim(),
        password: resetPassword,
      });
      if (completed.error) {
        setError(completed.error.message || m.errGeneric);
        return;
      }
      delete (window as any).__wbResetHandle;
      await onSuccess();
    } catch {
      setError(m.errGeneric);
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted/40 focus:border-accent/50 focus:bg-white/[0.05]";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass relative w-full max-w-md rounded-2xl p-6 shadow-2xl shadow-black/60 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute end-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-white/5 hover:text-foreground"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <h2 className="mb-1 font-serif text-2xl text-foreground">{m.authTitle}</h2>
        <p className="mb-6 text-sm text-muted">{m.authSubtitle}</p>

        {view === "signin" && (
          <>
            {/* tabs */}
            <div className="mb-6 flex rounded-xl border border-white/10 bg-white/[0.02] p-1">
              {(
                [
                  { id: "password", label: m.tabPassword, icon: KeyRound },
                  { id: "otp", label: m.tabOtp, icon: Mail },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTab(t.id as Tab);
                    setError("");
                    setNotice("");
                  }}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs tracking-wide transition ${
                    tab === t.id
                      ? "bg-accent/15 text-accent"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <t.icon size={13} />
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "password" && (
              <form onSubmit={submitPasswordLogin} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-muted">{m.email}</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder={m.emailPlaceholder}
                    className={inputCls}
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-muted">{m.password}</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder={m.passwordPlaceholder}
                    className={inputCls}
                    autoComplete="current-password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-sm font-medium text-background transition hover:bg-accent-light disabled:opacity-70"
                >
                  {busy && <Loader2 size={15} className="animate-spin" />}
                  {m.submitPassword}
                </button>
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setView("reset");
                      setError("");
                      setNotice("");
                      setResetEmail(loginEmail);
                    }}
                    className="text-muted underline underline-offset-2 transition hover:text-accent"
                  >
                    {m.forgot}
                  </button>
                </div>
                <p className="text-center text-xs text-muted/70">{m.newUserNote}</p>
              </form>
            )}

            {tab === "otp" && (
              <form onSubmit={submitOtp} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-muted">{m.email}</label>
                  <div className="flex gap-3">
                    <input
                      type="email"
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      placeholder={m.emailPlaceholder}
                      className={inputCls}
                      autoComplete="email"
                    />
                    <button
                      type="button"
                      onClick={sendOtp}
                      disabled={busy || countdown > 0}
                      className="shrink-0 rounded-xl border border-accent/30 bg-accent/10 px-4 text-xs font-medium text-accent transition hover:bg-accent/20 disabled:opacity-50"
                    >
                      {countdown > 0 ? `${countdown}s` : pending ? m.resend : m.getCode}
                    </button>
                  </div>
                </div>
                {!pending && (
                  <p className="text-[11px] leading-relaxed text-muted/60">{m.otpNewUser}</p>
                )}
                <div>
                  <label className="mb-2 block text-sm text-muted">{m.code}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={8}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    placeholder={m.codePlaceholder}
                    className={inputCls}
                  />
                </div>
                {pending && !pending.isExistingUser && (
                  <div>
                    <label className="mb-2 block text-sm text-muted">
                      {m.newPassword}
                      <span className="ms-2 text-xs text-accent/70">{m.newPasswordNote}</span>
                    </label>
                    <input
                      type="password"
                      value={otpPassword}
                      onChange={(e) => setOtpPassword(e.target.value)}
                      placeholder={m.passwordPlaceholder}
                      className={inputCls}
                      autoComplete="new-password"
                    />
                  </div>
                )}
                <button
                  type="submit"
                  disabled={busy || !pending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-sm font-medium text-background transition hover:bg-accent-light disabled:opacity-50"
                >
                  {busy && <Loader2 size={15} className="animate-spin" />}
                  {m.submitOtp}
                </button>
              </form>
            )}
          </>
        )}

        {view === "reset" && (
          <form onSubmit={resetStarted ? submitReset : (e) => { e.preventDefault(); sendResetCode(); }} className="space-y-4">
            <h3 className="font-serif text-lg text-foreground">{m.resetTitle}</h3>
            {!resetStarted ? (
              <div>
                <label className="mb-2 block text-sm text-muted">{m.email}</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder={m.emailPlaceholder}
                  className={inputCls}
                  autoComplete="email"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="mb-2 block text-sm text-muted">{m.code}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder={m.codePlaceholder}
                    className={inputCls}
                    autoComplete="one-time-code"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-muted">{m.newPassword}</label>
                  <input
                    type="password"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder={m.passwordPlaceholder}
                    className={inputCls}
                    autoComplete="new-password"
                  />
                </div>
              </>
            )}
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-sm font-medium text-background transition hover:bg-accent-light disabled:opacity-70"
            >
              {busy && <Loader2 size={15} className="animate-spin" />}
              {resetStarted ? m.resetSubmit : m.resetSend}
            </button>
            <button
              type="button"
              onClick={() => {
                setView("signin");
                setResetStarted(false);
                setError("");
                setNotice("");
              }}
              className="flex w-full items-center justify-center gap-1.5 text-xs text-muted transition hover:text-accent"
            >
              <ArrowLeft size={12} /> {m.back}
            </button>
          </form>
        )}

        {notice && !error && (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-green-500/10 px-4 py-3 text-xs text-green-300">
            <CheckCircle2 size={13} /> {notice}
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-xs text-red-300">{error}</p>
        )}
      </div>
    </div>
  );
}
