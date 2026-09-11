import type { Metadata } from 'next'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { Reveal } from '@/components/Reveal'
import { isValidLang, type Lang } from '@/lib/i18n/core'
import { pageAlternates } from '@/lib/i18n/server'
import { LEGAL_DOCS } from '@/lib/legal/docs'

export const revalidate = 86400

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = (isValidLang(raw) ? raw : 'en') as Lang
  const de = lang === 'de'
  return {
    title: de ? 'Rechtliches' : 'Legal',
    description: de
      ? 'Impressum, Datenschutz, AGB, Widerruf und weitere Rechtstexte von sivrce.'
      : 'Imprint, privacy, terms, withdrawal and further sivrce legal documents.',
    alternates: pageAlternates('/legal', lang),
  }
}

export default async function LegalIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'en'
  const de = lang === 'de'
  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero
          tone="light"
          kicker={de ? 'Rechtliches' : 'Legal'}
          title={de ? 'Rechtliches' : 'Legal'}
          subtitle={
            de
              ? 'Alle rechtlichen Informationen zu sivrce auf einen Blick.'
              : 'All legal information about sivrce at a glance.'
          }
        />
        <div className="mx-auto max-w-3xl px-6 pb-20 pt-4 md:pb-28">
          <ul className="grid gap-3 sm:grid-cols-2">
            {LEGAL_DOCS.map((d, i) => {
              const loc = de ? d.de : d.en
              return (
                <li key={d.slug}>
                  <Reveal delay={Math.min(i * 0.03, 0.18)}>
                    <a
                      href={`/${lang}/legal/${d.slug}`}
                      className="block h-full rounded-2xl border border-sv-ink/10 bg-sv-surface p-5 transition-colors hover:border-sv-blue/40"
                    >
                      <span className="block text-[15px] font-black tracking-[-0.01em] text-sv-ink">
                        {loc.title}
                      </span>
                      <span className="mt-1 block text-[13px] font-medium leading-relaxed text-sv-ink/60">
                        {loc.description}
                      </span>
                    </a>
                  </Reveal>
                </li>
              )
            })}
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  )
}
