import type { Metadata } from 'next'
import Navbar from '@/components/sections/Navbar'
import CTA from '@/components/sections/CTA'
import Footer from '@/components/sections/Footer'
import { EntityCard } from '@/components/entities/EntityCard'
import { listingCountByCity } from '@/data/professionals'
import { developersLive } from '@/lib/directory-live'
import { getReviewAggregate } from '@/lib/reviews/aggregate'
import { jsonLd } from '@/lib/utils'
import { langAlternates } from '@/lib/i18n/server'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'დეველოპერები საქართველოში — თბილისი, ბათუმი, მიმდინარე პროექტები',
  description:
    'ყველა დეველოპერი საქართველოში ერთ სივრცეზე: Archi, m², Alliance, ORBI, Domus, Blox, Eagle Hills, Mira, Ocean Capital — პროექტები, მისამართები, რუკა და ფასები.',
  alternates: { canonical: '/developers', languages: langAlternates('/developers') },
  openGraph: {
    title: 'დეველოპერები საქართველოში | sivrce',
    description:
      'ქართული დეველოპერების სრული კატალოგი: მიმდინარე მშენებლობები, ლოგოები, მისამართები და კოორდინატები რუკაზე.',
    type: 'website',
    url: 'https://sivrce.ge/developers',
    siteName: 'sivrce',
    locale: 'ka_GE',
    images: [{ url: 'https://sivrce.ge/images/og.jpg', alt: 'sivrce დეველოპერები' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'დეველოპერები საქართველოში | sivrce',
    description:
      'ქართული დეველოპერების სრული კატალოგი: მიმდინარე მშენებლობები, ლოგოები, მისამართები და კოორდინატები რუკაზე.',
    images: ['https://sivrce.ge/images/og.jpg'],
  },
}

export default async function DevelopersPage() {
  const developers = await developersLive()
  const cards = await Promise.all(
    developers.map(async (d) => ({
      d,
      aggregate: await getReviewAggregate('developer', d.slug),
    })),
  )

  const listLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: developers.length,
    itemListElement: developers.map((d, i) => ({
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
            დეველოპერები
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] font-semibold text-sv-ink/65 md:text-[16px]">
            ყველა დეველოპერი თბილისსა და საქართველოში — მიმდინარე მშენებლობებით, მისამართებითა და რუკის კოორდინატებით
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
                logoUrl={d.logoUrl}
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
