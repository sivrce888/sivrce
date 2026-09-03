import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import LocalizedLink from '@/components/LocalizedLink'
import { ArrowRight } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import CTA from '@/components/sections/CTA'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { AdSlot } from '@/components/ads/AdSlot'
import { EntityCard } from '@/components/entities/EntityCard'
import { roleSignupHref } from '@/lib/auth-roles'
import { jsonLd } from '@/lib/utils'
import { langAlternates, OG_LOCALE } from '@/lib/i18n/server'
import { isValidLang, type Lang } from '@/lib/i18n/core'
import { DEVELOPERS_HUB, dirLoc, MICRO } from '@/lib/directory-seo'
import { PER_PAGE, Pager } from '../../../projects/ProjectsGrid'
import { rankedDevelopers } from '../../ranked'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ lang: string; pg: string }>
}

/** Only integers ≥ 2 land here — page 1 is the canonical /developers. */
function parsePg(raw: string): number {
  const n = Number(raw)
  return Number.isInteger(n) && n >= 2 ? n : 0
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang: raw, pg: rawPg } = await params
  const lang: Lang = isValidLang(raw) ? raw : 'ka'
  const pg = parsePg(rawPg)
  const c = DEVELOPERS_HUB[dirLoc(lang)]
  const path = `/developers/page/${pg}`
  const title = pg ? `${c.title} — ${MICRO[dirLoc(lang)].page(pg)}` : c.title
  return {
    title,
    description: c.description,
    alternates: { canonical: pg ? path : '/developers', languages: langAlternates(path) },
    openGraph: {
      title,
      description: c.description,
      type: 'website',
      url: `https://sivrce.ge${pg ? path : '/developers'}`,
      siteName: 'sivrce',
      locale: OG_LOCALE[lang],
      images: [{ url: 'https://sivrce.ge/images/og-brand.png', alt: c.ogTitle }],
    },
  }
}

export default async function DevelopersPageN({ params }: PageProps) {
  const { lang: raw, pg: rawPg } = await params
  if (!isValidLang(raw)) notFound()
  const pg = parsePg(rawPg)
  if (!pg) notFound()
  const loc = dirLoc(raw)
  const c = DEVELOPERS_HUB[loc]

  const { cards, total } = await rankedDevelopers(pg)
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))
  if (pg > totalPages) notFound()

  const listLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: cards.length,
    itemListElement: cards.map(({ d }, i) => ({
      '@type': 'ListItem',
      position: (pg - 1) * PER_PAGE + i + 1,
      name: d.name.en,
      url: `https://sivrce.ge/developers/${d.slug}`,
      ...(d.logoUrl
        ? { image: d.logoUrl.startsWith('http') ? d.logoUrl : `https://sivrce.ge${d.logoUrl}` }
        : {}),
    })),
  }

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero tone="light" kicker="დირექტორია" title={c.h1} subtitle={c.sub}>
          <LocalizedLink
            href={roleSignupHref("developer")}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-sv-orange px-6 py-3 text-[14px] font-extrabold text-white shadow-glow-orange transition hover:-translate-y-0.5 hover:shadow-glow-orange-lg"
          >
            გახდი დეველოპერი სივრცეზე
            <ArrowRight className="h-4 w-4" />
          </LocalizedLink>
        </PageHero>
        <AdSlot slot="developers" lang={raw} />
        <section className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10">
          <div className="sv-card-grid-3">
            {cards.map(({ d, listingsCount, aggregate }) => (
              <EntityCard
                key={d.slug}
                kind="developer"
                slug={d.slug}
                name={d.name}
                city={d.city}
                yearsActive={d.yearsActive}
                listingsCount={listingsCount}
                verified={d.verified}
                aggregate={aggregate}
                logoUrl={d.logoUrl}
              />
            ))}
          </div>
          <Pager page={pg} totalPages={totalPages} loc={loc} basePath="/developers" />
        </section>
        <CTA lang={raw} />
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(listLd) }} />
    </div>
  )
}
