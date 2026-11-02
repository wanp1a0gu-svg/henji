"use client";

import { usePathname } from "next/navigation";
import { Locale, Messages, labels, locales } from "@/lib/i18n";
import { getAuthMessages } from "@/lib/auth-i18n";
import { Menu, X, ChevronDown, Globe, Check, User, ArrowRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { BrandMark } from "./BrandMark";
import { openCatAssistant } from "@/lib/cat-open";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLangOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const link = (path: string) => `/${locale}${path}`;

  /**
   * 顶栏只留 4 项：首页 / 功能（下拉）/ 八字（$6.80）/ 商店（$66 起）。
   * 其余全部收进「功能」下拉，避免 10 个平铺挤成一排。
   * 下拉里仍按免费 → 付费的顺序排，底部再给「全部功能」入口。
   */
  const navItems: {
    label: string;
    href?: string;
    note?: string;
    children?: { label: string; href: string }[];
    footer?: { label: string; href: string };
    action?: "open-cat";
  }[] = [
    { label: t("nav.home"), href: link("/") },
    // 对话没有独立页面了，点它直接打开右下角小痕弹窗
    { label: t("nav.advisor"), action: "open-cat" },
    {
      label: t("nav.features"),
      children: [
        { label: t("nav.tarot"), href: link("/tarot") },
        { label: t("nav.bagua"), href: link("/bagua") },
        { label: t("nav.ziwei"), href: link("/ziwei") },
        { label: t("nav.learn"), href: link("/learn") },
        { label: t("nav.courses"), href: link("/courses") },
      ],
      footer: { label: t("nav.features"), href: link("/features") },
    },
    { label: t("nav.bazi"), href: link("/bazi"), note: t("bazi.price") },
    { label: t("nav.shop"), href: link("/shop") },
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
          {navItems.map((item) =>
            item.children ? (
              <div
                key={item.label}
                ref={menuRef}
                className="relative"
                onMouseEnter={() => setMenuOpen(true)}
                onMouseLeave={() => setMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className={`relative flex items-center gap-1.5 px-4 py-2 text-sm tracking-wide transition ${
                    menuOpen || item.children.some((c) => isActive(c.href))
                      ? "text-accent"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {item.label}
                  <ChevronDown
                    size={12}
                    className={`transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {menuOpen && (
                  <div className="absolute start-0 top-full z-50 w-56 pt-2">
                    <div className="overflow-hidden rounded-xl border border-white/[0.10] bg-[#12100c] p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl">
                      {item.children.map((c) => (
                        <a
                          key={c.href}
                          href={c.href}
                          onClick={() => setMenuOpen(false)}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 text-[13px] transition ${
                            isActive(c.href)
                              ? "bg-accent/10 text-accent"
                              : "text-muted hover:bg-white/[0.05] hover:text-foreground"
                          }`}
                        >
                          {c.label}
                        </a>
                      ))}
                      {item.footer && (
                        <a
                          href={item.footer.href}
                          onClick={() => setMenuOpen(false)}
                          className="mt-1 flex items-center justify-between gap-1 border-t border-white/[0.06] px-3 pb-1 pt-2.5 text-[12px] text-accent/90 transition hover:text-accent"
                        >
                          {item.footer.label}
                          <ArrowRight size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : item.action === "open-cat" ? (
              <button
                key={item.label}
                type="button"
                onClick={openCatAssistant}
                className="relative px-4 py-2 text-sm tracking-wide text-muted transition hover:text-foreground"
              >
                {item.label}
              </button>
            ) : (
              <a
                key={item.href}
                href={item.href}
                className={`relative px-4 py-2 text-sm tracking-wide transition ${
                  item.href && isActive(item.href) ? "text-accent" : "text-muted hover:text-foreground"
                }`}
              >
                {item.label}
                {item.note && <span className="ms-1.5 text-[10px] text-muted/45">{item.note}</span>}
                {item.href && isActive(item.href) && (
                  <span className="absolute bottom-0 left-1/2 h-[2px] w-1 -translate-x-1/2 rounded-full bg-accent" />
                )}
              </a>
            )
          )}
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
            {navItems.map((item) =>
              item.children ? (
                <div key={item.label} className="py-1">
                  <p className="pb-1 pt-2 text-[10px] uppercase tracking-[0.18em] text-muted/40">
                    {item.label}
                  </p>
                  {item.children.map((c) => (
                    <a
                      key={c.href}
                      href={c.href}
                      onClick={() => setOpen(false)}
                      className={`block py-2 ps-3 text-sm ${isActive(c.href) ? "text-accent" : "text-muted"}`}
                    >
                      {c.label}
                    </a>
                  ))}
                  {item.footer && (
                    <a
                      href={item.footer.href}
                      onClick={() => setOpen(false)}
                      className="block py-2 ps-3 text-sm text-accent/90"
                    >
                      {item.footer.label} →
                    </a>
                  )}
                </div>
              ) : item.action === "open-cat" ? (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    openCatAssistant();
                  }}
                  className="py-3 text-start text-sm text-muted"
                >
                  {item.label}
                </button>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`py-3 text-sm ${item.href && isActive(item.href) ? "text-accent" : "text-muted"}`}
                >
                  {item.label}
                  {item.note && <span className="ms-1.5 text-[11px] text-muted/45">{item.note}</span>}
                </a>
              )
            )}
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
