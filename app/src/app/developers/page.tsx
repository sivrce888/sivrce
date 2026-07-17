import type { Metadata } from 'next'
import Navbar from '@/components/sections/Navbar'
import CTA from '@/components/sections/CTA'
import Footer from '@/components/sections/Footer'
import { EntityCard } from '@/components/entities/EntityCard'
import { DEVELOPERS, listingCountByCity } from '@/data/professionals'
import { getReviewAggregate } from '@/lib/reviews/aggregate'
import { jsonLd } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'დეველოპერები საქართველოში — შეფასებები და პროექტები',
  description:
    'ქართული დეველოპერული კომპანიების კატალოგი: m2, Alliance Group, ORBI, დირსი, არქი, აქსისი — ჩაბარებული პროექტები, ფასები და რეალური მიმოხილვები ერთ სივრცეში.',
  alternates: { canonical: '/developers' },
  openGraph: {
    title: 'დეველოპერები საქართველოში | sivrce',
    description:
      'დეველოპერების კატალოგი შეფასებებით: ჩაბარებული პროექტები, ფასები და მიმოხილვები.',
    type: 'website',
  },
}

export default async function DevelopersPage() {
  const cards = await Promise.all(
    DEVELOPERS.map(async (d) => ({
      d,
      aggregate: await getReviewAggregate('developer', d.slug),
    })),
  )

  const listLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: DEVELOPERS.map((d, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: d.name.en,
      url: `https://sivrce.ge/developers/${d.slug}`,
    })),
  }

  return (
    <div className="min-h-screen bg-sv-surface">
      <Navbar />
      <main id="main" className="pt-16">
        <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 md:py-16">
          <h1 className="text-balance text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[40px]">
            დეველოპერები
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] font-semibold text-sv-ink/65 md:text-[16px]">
            ყველა სანდო დეველოპერი ერთ სივრცეში — ჩაბარებული პროექტებით, ფასებითა და მიმოხილვებით
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map(({ d, aggregate }) => (
              <EntityCard
                key={d.slug}
                kind="developer"
                slug={d.slug}
                name={d.name}
                city={d.city}
                yearsActive={d.yearsActive}
                listingsCount={listingCountByCity(d.city)}
                verified={d.verified}
                aggregate={aggregate}
              />
            ))}
          </div>
        </section>
        <CTA />
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(listLd) }} />
    </div>
  )
}
