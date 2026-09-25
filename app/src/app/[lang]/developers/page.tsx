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
import { FaqSection } from '@/components/seo/FaqSection'
import { roleSignupHref } from '@/lib/auth-roles'
import { PER_PAGE, Pager } from '../projects/ProjectsGrid'
import { rankedDevelopers } from './ranked'
import { altNameList } from '@/lib/bilingual'
import { jsonLd } from '@/lib/utils'
import {pageAlternates, OG_LOCALE  } from '@/lib/i18n/server'
import { isValidLang, type Lang } from '@/lib/i18n/core'
import { DEVELOPERS_HUB, dirLoc, faqPageLd } from '@/lib/directory-seo'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang: raw } = await params
  const lang: Lang = isValidLang(raw) ? raw : 'ka'
  const c = DEVELOPERS_HUB[lang === 'ka' || lang === 'ru' || lang === 'de' ? lang : 'en']
  return {
    title: c.title,
    description: c.description,
    alternates: pageAlternates('/developers', lang),
    openGraph: {
      title: c.ogTitle,
      description: c.description,
      type: 'website',
      url: 'https://sivrce.ge/developers',
      siteName: 'sivrce',
      locale: OG_LOCALE[lang],
      images: [{ url: 'https://sivrce.ge/images/og-brand.png', alt: c.ogTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: c.ogTitle,
      description: c.description,
      images: ['https://sivrce.ge/images/og-brand.png'],
    },
  }
}

export default async function DevelopersPage({ params }: PageProps) {
  const { lang: raw } = await params
  if (!isValidLang(raw)) notFound()
  const c = DEVELOPERS_HUB[raw === 'ka' || raw === 'ru' || raw === 'de' ? raw : 'en']
  // Same chrome copy as the agents hub — was hard-coded Georgian on every locale.
  const ui =
    raw === 'ka'
      ? { kicker: 'დირექტორია', cta: 'გახდი დეველოპერი სივრცეზე' }
      : raw === 'ru'
        ? { kicker: 'Каталог', cta: 'Стать застройщиком на Sivrce' }
        : raw === 'de'
          ? { kicker: 'Verzeichnis', cta: 'Bauträger werden auf Sivrce' }
          : { kicker: 'Directory', cta: 'Become a developer on Sivrce' }

  const { cards, total } = await rankedDevelopers(1)
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  const listLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: cards.length,
    itemListElement: cards.map(({ d }, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: d.name.en,
      url: `https://sivrce.ge/developers/${d.slug}`,
      ...(d.logoUrl
        ? { image: d.logoUrl.startsWith('http') ? d.logoUrl : `https://sivrce.ge${d.logoUrl}` }
        : {}),
      item: {
        '@type': 'Organization',
        name: d.name.en,
        alternateName: altNameList(d.name.en, [d.name.ka, d.name.ru]),
        url: `https://sivrce.ge/developers/${d.slug}`,
      },
    })),
  }

  const loc = dirLoc(raw)
  const homeLabel = loc === 'ka' ? 'მთავარი' : loc === 'ru' ? 'Главная' : 'Home'
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: homeLabel, item: 'https://sivrce.ge' },
      { '@type': 'ListItem', position: 2, name: c.h1, item: 'https://sivrce.ge/developers' },
    ],
  }

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero tone="light" kicker={ui.kicker} title={c.h1} subtitle={c.sub}>
          <LocalizedLink
            href={roleSignupHref("developer")}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-sv-orange px-6 py-3 text-[14px] font-extrabold text-sv-ink shadow-glow-orange transition hover:-translate-y-0.5 hover:shadow-glow-orange-lg"
          >
            {ui.cta}
            <ArrowRight className="h-4 w-4" />
          </LocalizedLink>
        </PageHero>
        <AdSlot slot="developers" lang={raw} />
        <section className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10">
          <div className="sv-card-grid-3">
            {cards.map(({ d, listingsCount, aggregate, projectsCount, fromPriceM2 }) => (
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
                projectsCount={projectsCount}
                fromPriceM2={fromPriceM2}
              />
            ))}
          </div>
          <Pager page={1} totalPages={totalPages} loc={dirLoc(raw)} basePath="/developers" />
        </section>

        {/* SEO prose — hub keyword block (დეველოპერები საქართველოში) */}
        <section className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10">
          <div className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-10">
            <h2 className="text-[20px] font-black tracking-[-0.02em] text-sv-ink md:text-[24px]">
              {c.proseTitle}
            </h2>
            {c.prose.map((para, i) => (
              <p
                key={i}
                className="mt-4 max-w-[860px] text-[15px] font-medium leading-[1.75] text-sv-ink/65"
              >
                {para}
              </p>
            ))}
          </div>
        </section>

        <FaqSection
          title={c.faqTitle}
          items={c.faqs}
          className="mx-auto max-w-[1440px] px-5 pb-16 md:px-10"
        />
        <CTA lang={raw} />
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(listLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqPageLd(c.faqs)) }} />
    </div>
  )
}
