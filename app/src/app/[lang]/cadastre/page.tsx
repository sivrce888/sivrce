import type { Metadata } from 'next'
import { Suspense } from 'react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import LocalizedLink from '@/components/LocalizedLink'
import { isValidLang } from '@/lib/i18n/core'
import { getServerT, langAlternates } from '@/lib/i18n/server'
import { jsonLd } from '@/lib/utils'
import CadastreExplorer from './CadastreExplorer'

const SITE = 'https://sivrce.ge'

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const t = getServerT(lang)
  const title = t('cadastre.meta.title')
  const description = t('cadastre.meta.description')
  return {
    title,
    description,
    alternates: { canonical: '/cadastre', languages: langAlternates('/cadastre') },
    openGraph: {
      title,
      description,
      url: `${SITE}/cadastre`,
      type: 'website',
      images: [{ url: `${SITE}/images/og-brand.png`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE}/images/og-brand.png`],
    },
  }
}

export default async function CadastrePage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const t = getServerT(lang)

  const faq = [1, 2, 3].map((i) => ({
    q: t(`cadastre.faq.q${i}` as Parameters<typeof t>[0]),
    a: t(`cadastre.faq.a${i}` as Parameters<typeof t>[0]),
  }))

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${SITE}/cadastre#webpage`,
        url: `${SITE}/cadastre`,
        name: t('cadastre.meta.title'),
        description: t('cadastre.meta.description'),
        inLanguage: lang,
        isPartOf: { '@id': `${SITE}/#website` },
        about: { '@id': `${SITE}/#organization` },
      },
      {
        '@type': 'Map',
        name: t('cadastre.h1'),
        description: t('cadastre.meta.description'),
        url: `${SITE}/cadastre`,
        inLanguage: lang,
        isPartOf: { '@id': `${SITE}/cadastre#webpage` },
        provider: { '@id': `${SITE}/#organization` },
        areaServed: { '@type': 'Country', name: 'Georgia' },
        geo: { '@type': 'GeoCoordinates', latitude: 41.7151, longitude: 44.8271 },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'sivrce', item: SITE },
          { '@type': 'ListItem', position: 2, name: t('cadastre.h1'), item: `${SITE}/cadastre` },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
      <Navbar />
      <main id="main">
        <section className="mx-auto w-full max-w-6xl px-4 pt-10 pb-6 md:pt-14">
          <nav aria-label="Breadcrumb" className="mb-3 text-[12px] font-bold text-sv-ink/60">
            <LocalizedLink href="/" className="transition hover:text-sv-ink">
              sivrce
            </LocalizedLink>
            <span aria-hidden className="mx-1.5">/</span>
            <span aria-current="page">{t('cadastre.h1')}</span>
          </nav>
          <h1 className="text-[clamp(1.9rem,4.6vw,3rem)] font-black leading-[1.05] tracking-tight text-sv-ink">
            {t('cadastre.h1')}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] font-medium leading-relaxed text-sv-ink/60 md:text-[16px]">
            {t('cadastre.sub')}
          </p>
        </section>

        <section
          aria-label={t('cadastre.h1')}
          className="relative h-[68dvh] min-h-[26rem] w-full overflow-hidden border-y border-sv-ink/[0.06] bg-sv-cloud"
        >
          <Suspense fallback={<div className="h-full w-full" aria-hidden />}>
            <CadastreExplorer />
          </Suspense>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-12 md:py-16">
          <div className="grid gap-8 md:grid-cols-3">
            {faq.map((f) => (
              <article key={f.q}>
                <h2 className="text-[16px] font-black tracking-tight text-sv-ink">{f.q}</h2>
                <p className="mt-2 text-[14px] font-medium leading-relaxed text-sv-ink/60">{f.a}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <LocalizedLink
              href="/search"
              className="rounded-pill border border-sv-ink/10 px-4 py-2 text-[13px] font-extrabold text-sv-ink/70 transition hover:border-sv-blue/40 hover:text-sv-ink"
            >
              {t('search.title')}
            </LocalizedLink>
            <LocalizedLink
              href="/map"
              className="rounded-pill border border-sv-ink/10 px-4 py-2 text-[13px] font-extrabold text-sv-ink/70 transition hover:border-sv-blue/40 hover:text-sv-ink"
            >
              {t('nav.map')}
            </LocalizedLink>
            <LocalizedLink
              href="/sale/land"
              className="rounded-pill border border-sv-ink/10 px-4 py-2 text-[13px] font-extrabold text-sv-ink/70 transition hover:border-sv-blue/40 hover:text-sv-ink"
            >
              {t('footer.re.land')}
            </LocalizedLink>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
