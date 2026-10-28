"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Sparkles,
  Loader2,
  Trash2,
  ChevronDown,
  FileText,
  LogOut,
  User,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Receipt,
} from "lucide-react";
import { getCloud } from "@/lib/cloud";
import { Locale, Messages } from "@/lib/i18n";
import { getAuthMessages } from "@/lib/auth-i18n";
import { getSecurityMessages } from "@/lib/security-i18n";
import { ProfileCard } from "./ProfileCard";
import { WalletCard } from "./WalletCard";
import { getPaymentMessages } from "@/lib/payment-i18n";
import { useAuth } from "./AuthProvider";

interface Reading {
  id: number;
  name: string | null;
  birth_date: string;
  birth_time: string | null;
  gender: string;
  focus: string | null;
  locale: string | null;
  report: string;
  created_at: string;
}

interface PaymentOrder {
  id: number;
  method: string;
  amount: string | null;
  payer_note: string | null;
  status: string;
  created_at: string;
  product?: string | null;
  tracking_number?: string | null;
  carrier?: string | null;
}

export function AccountContent({ messages, locale }: { messages: Messages; locale: Locale }) {
  const t = (key: string) => {
    const parts = key.split(".");
    let value: any = messages;
    for (const part of parts) value = value?.[part];
    return value || key;
  };
  const a = getAuthMessages(locale);
  const s = getSecurityMessages(locale);
  const pm = getPaymentMessages(locale);
  const { user, loading: authLoading, openAuth, signOut } = useAuth();

  const [items, setItems] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [orders, setOrders] = useState<PaymentOrder[]>([]);

  // security — change password
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwErr, setPwErr] = useState("");
  const [pwOk, setPwOk] = useState("");

  // security — clear data
  const [clearing, setClearing] = useState(false);
  const [clearMsg, setClearMsg] = useState("");
  const [clearErr, setClearErr] = useState("");

  const link = (path: string) => `/${locale}${path}`;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErr("");
    setPwOk("");
    if (!oldPw) return setPwErr(a.password);
    if (newPw.length < 6) return setPwErr(a.errPassword);
    if (newPw !== confirmPw) return setPwErr(s.passwordMismatch);
    setPwBusy(true);
    try {
      const { error: err } = await getCloud().auth.resetPasswordForOld({
        oldPassword: oldPw,
        newPassword: newPw,
      });
      if (err) {
        setPwErr(err.message || a.errGeneric);
        return;
      }
      setPwOk(s.passwordChanged);
      setOldPw("");
      setNewPw("");
      setConfirmPw("");
    } catch {
      setPwErr(a.errGeneric);
    } finally {
      setPwBusy(false);
    }
  };

  const handleClearData = async () => {
    setClearMsg("");
    setClearErr("");
    if (!window.confirm(s.clearDataConfirm)) return;
    if (items.length === 0) {
      setClearMsg(s.clearDataNone);
      return;
    }
    setClearing(true);
    try {
      const { data, error: err } = await getCloud()
        .database.from("readings")
        .delete()
        .gt("id", 0)
        .select();
      if (err) {
        setClearErr(err.message || a.errGeneric);
        return;
      }
      const removed = Array.isArray(data) ? data : [];
      setItems((prev) => prev.filter((r) => !removed.some((d: any) => d.id === r.id)));
      setExpanded(null);
      setClearMsg(s.clearDataDone);
    } catch {
      setClearErr(a.errGeneric);
    } finally {
      setClearing(false);
    }
  };

  const loadReadings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const { data, error: err } = await getCloud()
        .database.from("readings")
        .select("id, name, birth_date, birth_time, gender, focus, locale, report, created_at")
        .order("created_at", { ascending: false });
      if (err) {
        setError(err.message || a.errGeneric);
        return;
      }
      setItems((data as Reading[]) || []);
    } catch {
      setError(a.errGeneric);
    } finally {
      setLoading(false);
    }
  }, [user, a.errGeneric]);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error: err } = await getCloud()
        .database.from("payment_orders")
        .select("id, method, amount, payer_note, status, created_at, product, tracking_number, carrier")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (!err) setOrders((data as PaymentOrder[]) || []);
    } catch {
      /* payment records are non-blocking */
    }
  }, [user]);

  useEffect(() => {
    if (user) loadReadings();
  }, [user, loadReadings]);

  useEffect(() => {
    if (user) loadOrders();
  }, [user, loadOrders]);

  const handleDelete = async (id: number) => {
    if (!window.confirm(a.deleteConfirm)) return;
    setDeletingId(id);
    setNotice("");
    try {
      const { data, error: err } = await getCloud()
        .database.from("readings")
        .delete()
        .eq("id", id)
        .select();
      if (err) {
        setError(err.message || a.errGeneric);
        return;
      }
      const removed = Array.isArray(data) ? data : [];
      if (removed.length === 0) {
        setError(a.errGeneric);
        return;
      }
      setItems((prev) => prev.filter((r) => r.id !== id));
      if (expanded === id) setExpanded(null);
      setNotice(a.deleted);
    } catch {
      setError(a.errGeneric);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const focusLabel = (focus: string | null) => {
    if (!focus) return "";
    const key = `bazi.focus${focus.charAt(0).toUpperCase()}${focus.slice(1)}`;
    const label = t(key);
    return label === key ? focus : label;
  };

  /* ---------- not signed in ---------- */
  if (!authLoading && !user) {
    return (
      <main className="flex-1 pt-[72px]">
        <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-32 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-accent/20 bg-accent/10">
            <User size={28} className="text-accent" />
          </div>
          <h1 className="mb-3 font-serif text-3xl tracking-wide">{a.needSignIn}</h1>
          <p className="mb-8 max-w-md text-sm text-muted">{a.needSignInHint}</p>
          <button
            onClick={openAuth}
            className="rounded-full bg-accent px-8 py-3.5 text-sm font-medium text-background shadow-lg shadow-accent/20 transition hover:bg-accent-light"
          >
            {a.signIn}
          </button>
        </div>
      </main>
    );
  }

  /* ---------- loading ---------- */
  if (authLoading || (loading && items.length === 0 && !error)) {
    return (
      <main className="flex-1 pt-[72px]">
        <div className="flex items-center justify-center py-40">
          <Loader2 size={28} className="animate-spin text-accent" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 pt-[72px]">
      <section className="relative overflow-hidden px-6 py-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[300px] w-[500px] -translate-x-1/2 rounded-full bg-accent/[0.06] blur-[110px]" />
        </div>
        <div className="mx-auto flex max-w-4xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-accent">
              {a.accountTitle}
            </p>
            <h1 className="mb-2 font-serif text-4xl font-light tracking-wide text-gradient">
              {a.readingsTitle}
            </h1>
            <p className="text-sm text-muted">
              {a.signedInAs}: <span className="text-foreground">{user?.email || user?.phone || "—"}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={link("/bazi")}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-background transition hover:bg-accent-light"
            >
              <Sparkles size={15} />
              {a.getReading}
            </a>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm text-muted transition hover:border-accent/30 hover:text-foreground"
            >
              <LogOut size={14} />
              {a.signOut}
            </button>
          </div>
        </div>
      </section>

      {/* Profile */}
      <section className="px-6 pb-14">
        <div className="mx-auto max-w-4xl">
          <ProfileCard locale={locale} />
        </div>
      </section>

      {/* Wallet */}
      <section className="px-6 pb-14">
        <div className="mx-auto max-w-4xl">
          <WalletCard locale={locale} />
        </div>
      </section>

      {/* Security */}
      <section className="px-6 pb-14">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/20 bg-accent/10">
              <ShieldCheck size={18} className="text-accent" />
            </div>
            <div>
              <h2 className="font-serif text-xl">{s.securityTitle}</h2>
              <p className="text-xs text-muted">{s.securitySubtitle}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* change password */}
            <form onSubmit={handleChangePassword} className="glass rounded-2xl p-6">
              <h3 className="mb-1 flex items-center gap-2 font-serif text-lg">
                <KeyRound size={15} className="text-accent" />
                {s.changePassword}
              </h3>
              <p className="mb-5 text-xs text-muted">{s.changePasswordNote}</p>
              <div className="space-y-3">
                <input
                  type="password"
                  value={oldPw}
                  onChange={(e) => setOldPw(e.target.value)}
                  placeholder={s.oldPasswordPlaceholder}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm outline-none transition placeholder:text-muted/40 focus:border-accent/50"
                />
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder={a.newPassword}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm outline-none transition placeholder:text-muted/40 focus:border-accent/50"
                />
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder={s.confirmPassword}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm outline-none transition placeholder:text-muted/40 focus:border-accent/50"
                />
                <button
                  type="submit"
                  disabled={pwBusy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-medium text-background transition hover:bg-accent-light disabled:opacity-70"
                >
                  {pwBusy && <Loader2 size={14} className="animate-spin" />}
                  {s.savePassword}
                </button>
              </div>
              {pwOk && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-green-300">
                  <CheckCircle2 size={12} /> {pwOk}
                </p>
              )}
              {pwErr && <p className="mt-3 text-xs text-red-300">{pwErr}</p>}
            </form>

            {/* clear data */}
            <div className="glass rounded-2xl p-6">
              <h3 className="mb-1 flex items-center gap-2 font-serif text-lg">
                <ShieldAlert size={15} className="text-accent" />
                {s.clearData}
              </h3>
              <p className="mb-5 text-xs text-muted">{s.clearDataHint}</p>
              <button
                onClick={handleClearData}
                disabled={clearing}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-70"
              >
                {clearing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {s.clearData}
              </button>
              {clearMsg && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-green-300">
                  <CheckCircle2 size={12} /> {clearMsg}
                </p>
              )}
              {clearErr && <p className="mt-3 text-xs text-red-300">{clearErr}</p>}
              <p className="mt-5 border-t border-white/[0.06] pt-4 text-xs leading-relaxed text-muted/70">
                {s.accountDeletionNote}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-10">
        <div className="mx-auto max-w-4xl">
          {notice && (
            <p className="mb-6 rounded-xl bg-green-500/10 px-4 py-3 text-sm text-green-300">
              {notice}
            </p>
          )}
          {error && (
            <p className="mb-6 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
          )}

          {items.length === 0 && !loading && (
            <div className="glass rounded-2xl p-12 text-center">
              <FileText size={32} className="mx-auto mb-4 text-accent/60" />
              <p className="mb-2 font-serif text-xl">{a.empty}</p>
              <p className="mb-6 text-sm text-muted">{a.emptyHint}</p>
              <a
                href={link("/bazi")}
                className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-6 py-3 text-sm text-accent transition hover:bg-accent/20"
              >
                <Sparkles size={15} />
                {a.getReading}
              </a>
            </div>
          )}

          <div className="space-y-4">
            {items.map((r) => {
              const isOpen = expanded === r.id;
              return (
                <div key={r.id} className="glass rounded-2xl transition hover:border-accent/25">
                  <button
                    onClick={() => setExpanded(isOpen ? null : r.id)}
                    className="flex w-full items-center justify-between gap-4 p-6 text-start"
                  >
                    <div className="min-w-0">
                      <p className="mb-1 truncate font-serif text-lg">
                        {r.name || focusLabel(r.focus) || "Bazi Reading"}
                      </p>
                      <p className="text-xs text-muted">
                        {r.birth_date} {r.birth_time || ""} ·{" "}
                        {r.gender === "male" ? t("bazi.male") : t("bazi.female")}
                        {r.focus ? ` · ${focusLabel(r.focus)}` : ""} · {a.savedOn}{" "}
                        {formatDate(r.created_at)}
                      </p>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-muted transition-transform duration-300 ${
                        isOpen ? "rotate-180 text-accent" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="border-t border-white/[0.06] px-6 pb-6 pt-5">
                      <div className="mb-4 max-h-[420px] overflow-y-auto pe-2 text-sm leading-relaxed text-muted">
                        {r.report.split("\n").map((line, i) => (
                          <p key={i} className="mb-2">
                            {line}
                          </p>
                        ))}
                      </div>
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={deletingId === r.id}
                        className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/5 px-4 py-2 text-xs text-red-300 transition hover:bg-red-500/10 disabled:opacity-60"
                      >
                        {deletingId === r.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                        {a.delete}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Payment records */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/20 bg-accent/10">
              <Receipt size={18} className="text-accent" />
            </div>
            <h2 className="font-serif text-xl">{pm.ordersTitle}</h2>
          </div>
          {orders.length === 0 ? (
            <p className="glass rounded-2xl p-6 text-center text-sm text-muted">
              {pm.ordersEmpty}
            </p>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl px-6 py-4"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex h-7 items-center rounded-lg px-2.5 text-[11px] font-medium text-white ${
                        o.method === "wechat"
                          ? "bg-[#07C160]"
                          : o.method === "alipay"
                            ? "bg-[#1677FF]"
                            : "bg-[#0070ba]"
                      }`}
                    >
                      {o.method === "wechat" ? pm.wechat : o.method === "alipay" ? pm.alipay : "PayPal"}
                    </span>
                    <div>
                      <p className="text-sm">
                        {o.amount ? `$${o.amount}` : "—"}
                        <span className="ms-2 text-xs text-muted">{formatDate(o.created_at)}</span>
                      </p>
                      {o.payer_note && (
                        <p className="mt-0.5 text-xs text-muted/80">{o.payer_note}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span
                      className={`rounded-full border px-3 py-1 text-[11px] ${
                        o.status === "refunded"
                          ? "border-red-500/30 bg-red-500/10 text-red-300"
                          : o.status === "completed" || o.status === "confirmed"
                            ? "border-green-500/30 bg-green-500/10 text-green-300"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                      }`}
                    >
                      {o.status === "refunded"
                        ? pm.statusRefunded
                        : o.status === "completed" || o.status === "confirmed"
                          ? pm.statusCompleted
                          : pm.statusPending}
                    </span>
                    {o.tracking_number && (
                      <span className="text-[10px] text-muted/70">
                        {pm.trackingLabel}:{" "}
                        <span className="font-mono text-accent/80">{o.tracking_number}</span>
                        {o.carrier ? " · " + o.carrier : ""}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
