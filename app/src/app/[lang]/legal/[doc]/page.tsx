import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { Reveal } from '@/components/Reveal'
import { isValidLang, type Lang } from '@/lib/i18n/core'
import { pageAlternates } from '@/lib/i18n/server'
import { LEGAL_DOCS, LEGAL_SLUGS, getLegalDoc } from '@/lib/legal/docs'

export const revalidate = 86400

export function generateStaticParams() {
  // de is canonical for this family; other locales render on demand.
  return LEGAL_SLUGS.map((doc) => ({ lang: 'de', doc }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; doc: string }>
}): Promise<Metadata> {
  const { lang: raw, doc } = await params
  const d = getLegalDoc(doc)
  if (!d) return {}
  const lang = (isValidLang(raw) ? raw : 'en') as Lang
  const loc = lang === 'de' ? d.de : d.en
  return {
    title: loc.title,
    description: loc.description,
    alternates: pageAlternates(`/legal/${doc}`, lang),
    robots: d.legalReviewRequired
      ? { index: true, follow: true }
      : undefined,
  }
}

export default async function LegalDocPage({
  params,
}: {
  params: Promise<{ lang: string; doc: string }>
}) {
  const { lang: raw, doc } = await params
  const d = getLegalDoc(doc)
  if (!d) notFound()
  const lang = isValidLang(raw) ? raw : 'en'
  const loc = lang === 'de' ? d.de : d.en
  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero
          tone="light"
          kicker={lang === 'de' ? 'Rechtliches' : 'Legal'}
          title={loc.title}
          subtitle={loc.description}
        />
        <article className="mx-auto max-w-3xl px-6 pb-20 pt-4 md:pb-28">
          {d.legalReviewRequired && (
            <p
              role="note"
              className="mb-10 rounded-2xl border border-sv-ink/15 bg-sv-surface px-5 py-4 text-[13px] font-semibold leading-relaxed text-sv-ink/70"
            >
              {lang === 'de'
                ? 'Entwurf — dieser Text befindet sich in rechtlicher Prüfung (LEGAL_REVIEW_REQUIRED) und ist noch nicht rechtsverbindlich. Es handelt sich nicht um Rechtsberatung.'
                : 'Draft — this text is under legal review (LEGAL_REVIEW_REQUIRED) and not yet legally binding. This is not legal advice.'}
            </p>
          )}
          <div className="space-y-10">
            {loc.sections.map((s, i) => (
              <Reveal key={s.title} delay={Math.min(i * 0.04, 0.2)}>
                <section>
                  <h2 className="text-xl font-black tracking-[-0.02em] text-sv-ink">{s.title}</h2>
                  {s.body.map((p) => (
                    <p key={p.slice(0, 40)} className="mt-3 text-[15px] font-medium leading-relaxed text-sv-ink/65">
                      {p}
                    </p>
                  ))}
                </section>
              </Reveal>
            ))}
          </div>
          <nav aria-label={lang === 'de' ? 'Rechtliches' : 'Legal'} className="mt-16 border-t border-sv-ink/10 pt-8">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {LEGAL_DOCS.filter((o) => o.slug !== d.slug).map((o) => (
                <li key={o.slug}>
                  <a
                    href={`/${lang}/legal/${o.slug}`}
                    className="text-[13px] font-bold text-sv-blue underline-offset-4 hover:underline"
                  >
                    {(lang === 'de' ? o.de : o.en).title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </article>
      </main>
      <Footer />
    </div>
  )
}
