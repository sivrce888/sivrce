import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/sections/Navbar'
import CTA from '@/components/sections/CTA'
import Footer from '@/components/sections/Footer'
import { EntityCard } from '@/components/entities/EntityCard'
import { FaqSection } from '@/components/seo/FaqSection'
import { developersLive, projectsLive } from '@/lib/directory-live'
import { getDeveloperListingCountsBySlug } from '@/lib/listings-db'
import { getReviewAggregate } from '@/lib/reviews/aggregate'
import { jsonLd } from '@/lib/utils'
import { langAlternates, OG_LOCALE } from '@/lib/i18n/server'
import { isValidLang, type Lang } from '@/lib/i18n/core'
import { DEVELOPERS_HUB, dirLoc, faqPageLd } from '@/lib/directory-seo'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang: raw } = await params
  const lang: Lang = isValidLang(raw) ? raw : 'ka'
  const c = DEVELOPERS_HUB[dirLoc(lang)]
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: '/developers', languages: langAlternates('/developers') },
    openGraph: {
      title: c.ogTitle,
      description: c.description,
      type: 'website',
      url: 'https://sivrce.ge/developers',
      siteName: 'sivrce',
      locale: OG_LOCALE[lang],
      images: [{ url: 'https://sivrce.ge/images/og.jpg', alt: c.ogTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: c.ogTitle,
      description: c.description,
      images: ['https://sivrce.ge/images/og.jpg'],
    },
  }
}

export default async function DevelopersPage({ params }: PageProps) {
  const { lang: raw } = await params
  if (!isValidLang(raw)) notFound()
  const c = DEVELOPERS_HUB[dirLoc(raw)]

  const [developers, projects] = await Promise.all([developersLive(), projectsLive()])
  const projectToDev = new Map(
    projects.filter((p) => p.developerSlug).map((p) => [p.slug, p.developerSlug!]),
  )
  const listingCounts = await getDeveloperListingCountsBySlug(projectToDev)

  const cards = (
    await Promise.all(
      developers.map(async (d) => ({
        d,
        listingsCount: listingCounts[d.slug] ?? 0,
        aggregate: await getReviewAggregate('developer', d.slug),
      })),
    )
  ).sort((x, y) => y.listingsCount - x.listingsCount || y.d.projectsDone - x.d.projectsDone)

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
    })),
  }

  return (
    <div className="min-h-screen bg-sv-surface">
      <Navbar />
      <main id="main" className="pt-16">
        <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 md:py-16">
          <h1 className="text-balance text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[40px]">
            {c.h1}
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] font-semibold text-sv-ink/65 md:text-[16px]">
            {c.sub}
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
        <CTA />
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(listLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqPageLd(c.faqs)) }} />
    </div>
  )
}
