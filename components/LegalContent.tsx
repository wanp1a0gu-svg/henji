import { Locale } from "@/lib/i18n";
import { getLegalDoc, LegalDocKey } from "@/lib/legal";
import { getSecurityMessages } from "@/lib/security-i18n";

export function LegalContent({ locale, docKey }: { locale: Locale; docKey: LegalDocKey }) {
  const doc = getLegalDoc(docKey, locale);
  const s = getSecurityMessages(locale);

  return (
    <main className="flex-1 pt-[72px]">
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-accent">{s.lastUpdated}</p>
          <h1 className="mb-6 font-serif text-4xl font-light tracking-wide text-gradient">
            {doc.title}
          </h1>
          <p className="mb-12 text-sm leading-relaxed text-muted">{doc.intro}</p>

          <div className="space-y-9">
            {doc.sections.map((sec) => (
              <div key={sec.heading}>
                <h2 className="mb-3 font-serif text-xl text-foreground">{sec.heading}</h2>
                {sec.paragraphs.map((p, i) => (
                  <p key={i} className="mb-3 text-sm leading-relaxed text-muted">
                    {p}
                  </p>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-14 border-t border-white/[0.06] pt-8">
            <a
              href={`/${locale}`}
              className="inline-flex items-center gap-2 text-sm text-accent transition hover:text-accent-light"
            >
              ← {s.backToHome}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
