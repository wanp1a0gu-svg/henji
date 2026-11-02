"use client";

import { usePathname } from "next/navigation";
import { Locale, Messages, labels, locales } from "@/lib/i18n";
import { getAuthMessages } from "@/lib/auth-i18n";
import { Menu, X, ChevronDown, Globe, Check, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { BrandMark } from "./BrandMark";

export function Nav({ messages, locale }: { messages: Messages; locale: Locale }) {
  const t = (key: string) => {
    const parts = key.split(".");
    let value: any = messages;
    for (const part of parts) value = value?.[part];
    return value || key;
  };
  const a = getAuthMessages(locale);
  const { user, loading, openAuth } = useAuth();

  const pathname = usePathname();
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, "") || "/";
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLangOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const link = (path: string) => `/${locale}${path}`;

  // 顺序按价格梯度排：免费 → 微付费（$6.80 八字）→ 重付费（$66 符纸 / 课程）
  const navItems = [
    { label: t("nav.home"), href: link("/") },
    { label: t("nav.advisor"), href: link("/#advisor") },
    { label: t("nav.tarot"), href: link("/tarot") },
    { label: t("nav.bagua"), href: link("/bagua") },
    { label: t("nav.ziwei"), href: link("/ziwei") },
    { label: t("nav.learn"), href: link("/learn") },
    { label: t("nav.bazi"), href: link("/bazi") },
    { label: t("nav.shop"), href: link("/shop") },
    { label: t("nav.courses"), href: link("/courses") },
  ];

  const isActive = (href: string) => {
    if (href === link("/")) return pathname === href;
    return pathname.startsWith(href);
  };

  const switchLocale = (loc: Locale) => {
    setLangOpen(false);
    if (loc === locale) return;
    window.location.href = `/${loc}${pathWithoutLocale}`;
  };

  return (
    <header className="fixed top-0 start-0 end-0 z-50 border-b border-white/[0.06] bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href={link("/")} className="group flex items-center gap-3">
          <BrandMark className="h-9 w-9" />
          <span className="font-serif text-lg tracking-[0.08em] text-foreground group-hover:text-accent transition sm:text-xl">
            {locale === "zh" ? "痕迹" : "Traces"}
          </span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`relative px-4 py-2 text-sm tracking-wide transition ${
                isActive(item.href)
                  ? "text-accent"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {item.label}
              {isActive(item.href) && (
                <span className="absolute bottom-0 left-1/2 h-[2px] w-1 -translate-x-1/2 rounded-full bg-accent" />
              )}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* language switcher */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={langOpen}
              className={`flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs tracking-wide transition sm:px-3.5 ${
                langOpen
                  ? "border-accent/40 bg-accent/[0.08] text-accent"
                  : "border-white/10 bg-white/5 text-muted hover:border-accent/30 hover:text-foreground"
              }`}
            >
              <Globe size={13} className={langOpen ? "text-accent" : ""} />
              <span className="hidden sm:inline">{labels[locale]}</span>
              <ChevronDown
                size={12}
                className={`transition-transform duration-300 ${langOpen ? "rotate-180" : ""}`}
              />
            </button>

            {langOpen && (
              <div
                role="listbox"
                className="absolute end-0 top-full z-50 mt-2 max-h-[320px] w-44 overflow-y-auto rounded-xl border border-accent/15 bg-[#12100d]/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl"
              >
                {locales.map((loc) => {
                  const selected = loc === locale;
                  return (
                    <button
                      key={loc}
                      role="option"
                      aria-selected={selected}
                      onClick={() => switchLocale(loc)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-start text-xs tracking-wide transition ${
                        selected
                          ? "bg-accent/10 text-accent"
                          : "text-muted hover:bg-white/[0.05] hover:text-foreground"
                      }`}
                    >
                      <span>{labels[loc]}</span>
                      {selected && <Check size={12} className="text-accent" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* account */}
          {loading ? (
            <div className="h-8 w-8 animate-pulse rounded-full border border-white/10 bg-white/5" />
          ) : user ? (
            <a
              href={link("/account")}
              className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs tracking-wide transition ${
                isActive(link("/account"))
                  ? "border-accent/40 bg-accent/[0.08] text-accent"
                  : "border-white/10 bg-white/5 text-muted hover:border-accent/30 hover:text-foreground"
              }`}
            >
              <User size={13} />
              <span className="hidden sm:inline">{a.myAccount}</span>
            </a>
          ) : (
            <button
              onClick={openAuth}
              className="flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs font-medium tracking-wide text-accent transition hover:bg-accent/20"
            >
              <User size={13} />
              <span className="hidden sm:inline">{a.signIn}</span>
            </button>
          )}

          <button
            onClick={() => setOpen(!open)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-muted transition hover:border-accent/30 hover:text-accent lg:hidden"
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/[0.06] bg-background/95 backdrop-blur-xl lg:hidden">
          <nav className="flex flex-col px-6 py-4">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`py-3 text-sm ${isActive(item.href) ? "text-accent" : "text-muted"}`}
              >
                {item.label}
              </a>
            ))}
            <a
              href={link("/account")}
              onClick={() => setOpen(false)}
              className={`py-3 text-sm ${isActive(link("/account")) ? "text-accent" : "text-muted"}`}
            >
              {a.myAccount}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
