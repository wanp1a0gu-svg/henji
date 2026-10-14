import type { ReactNode } from "react";
import {
  Sparkles,
  BookOpen,
  Globe,
  MessageCircle,
  Mail,
  Camera,
  Music2,
  Play,
  Moon,
  GraduationCap,
  ShoppingBag,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
import { Locale } from "@/lib/i18n";
import { getLinksMessages } from "@/lib/links-i18n";
import { WHATSAPP_NUMBER, LINKS } from "@/lib/site-config";
import { BrandMark } from "./BrandMark";

interface LinkItem {
  key: string;
  mark: ReactNode;
  title: string;
  desc?: string;
  href: string;
  external?: boolean;
  primary?: boolean;
}

function Badge({ bg, children }: { bg: string; children: ReactNode }) {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 text-[15px] font-semibold leading-none text-white"
      style={{ backgroundColor: bg }}
    >
      {children}
    </span>
  );
}

function AccentIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent">
      {children}
    </span>
  );
}

export function LinksContent({ locale }: { locale: Locale }) {
  const l = getLinksMessages(locale);
  const link = (p: string) => `/${locale}${p}`;

  const waHref = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}` : "";
  const mailHref = LINKS.email ? `mailto:${LINKS.email}` : "";

  const items: LinkItem[] = [
    {
      key: "bazi",
      mark: (
        <AccentIcon>
          <Sparkles size={17} />
        </AccentIcon>
      ),
      title: l.bazi,
      desc: l.baziDesc,
      href: link("/bazi"),
      primary: true,
    },
    {
      key: "tarot",
      mark: (
        <AccentIcon>
          <Moon size={17} />
        </AccentIcon>
      ),
      title: l.tarot,
      desc: l.tarotDesc,
      href: link("/tarot"),
    },
    {
      key: "learn",
      mark: (
        <AccentIcon>
          <GraduationCap size={17} />
        </AccentIcon>
      ),
      title: l.learn,
      desc: l.learnDesc,
      href: link("/learn"),
    },
    {
      key: "shop",
      mark: (
        <AccentIcon>
          <ShoppingBag size={17} />
        </AccentIcon>
      ),
      title: l.shop,
      desc: l.shopDesc,
      href: link("/shop"),
    },
    {
      key: "courses",
      mark: (
        <AccentIcon>
          <BookOpen size={17} />
        </AccentIcon>
      ),
      title: l.courses,
      desc: l.coursesDesc,
      href: link("/courses"),
    },
    {
      key: "home",
      mark: (
        <AccentIcon>
          <Globe size={17} />
        </AccentIcon>
      ),
      title: l.home,
      desc: l.homeDesc,
      href: link("/"),
    },
  ];

  if (waHref) {
    items.push({
      key: "whatsapp",
      mark: (
        <Badge bg="#25D366">
          <MessageCircle size={16} />
        </Badge>
      ),
      title: l.whatsapp,
      desc: l.whatsappDesc,
      href: waHref,
      external: true,
    });
  }

  if (mailHref) {
    items.push({
      key: "email",
      mark: (
        <AccentIcon>
          <Mail size={17} />
        </AccentIcon>
      ),
      title: l.email,
      desc: l.emailDesc,
      href: mailHref,
      external: true,
    });
  }

  const socials: { key: string; bg: string; glyph: ReactNode; label: string; url: string }[] = [
    { key: "instagram", bg: "#E4405F", glyph: <Camera size={16} />, label: "Instagram", url: LINKS.instagram },
    { key: "tiktok", bg: "#111111", glyph: <Music2 size={16} />, label: "TikTok", url: LINKS.tiktok },
    { key: "youtube", bg: "#FF0000", glyph: <Play size={16} />, label: "YouTube", url: LINKS.youtube },
    { key: "x", bg: "#111111", glyph: "X", label: "X (Twitter)", url: LINKS.x },
    { key: "facebook", bg: "#1877F2", glyph: "f", label: "Facebook", url: LINKS.facebook },
    { key: "xiaohongshu", bg: "#FF2442", glyph: "红", label: "小红书", url: LINKS.xiaohongshu },
  ];

  for (const s of socials) {
    if (!s.url) continue;
    items.push({
      key: s.key,
      mark: <Badge bg={s.bg}>{s.glyph}</Badge>,
      title: s.label,
      href: s.url,
      external: true,
    });
  }

  return (
    <main className="flex-1 pt-[72px]">
      <div className="relative overflow-hidden px-6 pb-24 pt-14">
        {/* 背景光晕 */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[340px] w-[560px] -translate-x-1/2 rounded-full bg-accent/[0.07] blur-[120px]" />
        </div>

        <div className="mx-auto flex max-w-md flex-col items-center">
          {/* 品牌头 */}
          <BrandMark className="h-20 w-20" />
          <p className="mt-6 text-[11px] uppercase tracking-[0.35em] text-accent">{l.eyebrow}</p>
          <h1 className="mt-2 font-serif text-3xl tracking-[0.08em] text-gradient">
            {locale === "zh" ? "痕迹" : "Traces"}
          </h1>
          <p className="mt-2 text-xs tracking-widest text-muted">{l.tagline}</p>

          {/* 链接列表 */}
          <div className="mt-10 w-full space-y-3">
            {items.map((item) => (
              <a
                key={item.key}
                href={item.href}
                {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={`group flex items-center gap-4 rounded-2xl border px-5 py-4 backdrop-blur transition ${
                  item.primary
                    ? "border-accent/35 bg-accent/[0.07] hover:border-accent/60 hover:bg-accent/[0.12]"
                    : "border-white/[0.08] bg-white/[0.03] hover:border-accent/40 hover:bg-white/[0.05]"
                }`}
              >
                {item.mark}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{item.title}</span>
                  {item.desc ? (
                    <span className="mt-0.5 block truncate text-xs text-muted">{item.desc}</span>
                  ) : null}
                </span>
                {item.external ? (
                  <ArrowUpRight
                    size={15}
                    className="shrink-0 text-muted/50 transition group-hover:text-accent"
                  />
                ) : (
                  <ChevronRight
                    size={15}
                    className="shrink-0 text-muted/50 transition group-hover:text-accent"
                  />
                )}
              </a>
            ))}
          </div>

          <p className="mt-12 text-[10px] tracking-widest text-muted/50">
            © 2026 {locale === "zh" ? "痕迹" : "Traces"}
          </p>
        </div>
      </div>
    </main>
  );
}
