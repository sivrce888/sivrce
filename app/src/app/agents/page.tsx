import type { Metadata } from 'next'
import Navbar from '@/components/sections/Navbar'
import CTA from '@/components/sections/CTA'
import Footer from '@/components/sections/Footer'
import { EntityCard } from '@/components/entities/EntityCard'
import { AGENT_PROFILES, listingsByAgent } from '@/data/professionals'
import { getReviewAggregate } from '@/lib/reviews/aggregate'
import { jsonLd } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'უძრავი ქონების აგენტები — ვერიფიცირებული სპეციალისტები',
  description:
    'ვერიფიცირებული უძრავი ქონების აგენტები თბილისსა და ბათუმში: გამოცდილება, დახურული გარიგებები, ენები და რეალური მიმოხილვები — აირჩიე შენი აგენტი.',
  alternates: { canonical: '/agents' },
  openGraph: {
    title: 'უძრავი ქონების აგენტები | sivrce',
    description:
      'ვერიფიცირებული აგენტები თბილისსა და ბათუმში — გამოცდილებით, სტატისტიკითა და მიმოხილვებით.',
    type: 'website',
  },
}

export default async function AgentsPage() {
  const cards = await Promise.all(
    AGENT_PROFILES.map(async (a) => ({
      a,
      aggregate: await getReviewAggregate('agent', a.slug),
    })),
  )

  const listLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: AGENT_PROFILES.map((a, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: a.name.en,
      url: `https://sivrce.ge/agents/${a.slug}`,
    })),
  }

  return (
    <div className="min-h-screen bg-sv-surface">
      <Navbar />
      <main id="main" className="pt-16">
        <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 md:py-16">
          <h1 className="text-balance text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[40px]">
            აგენტები და სააგენტოები
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] font-semibold text-sv-ink/65 md:text-[16px]">
            ვერიფიცირებული სპეციალისტები — გამოცდილებით, დახურული გარიგებებითა და მიმოხილვებით
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map(({ a, aggregate }) => (
              <EntityCard
                key={a.slug}
                kind="agent"
                slug={a.slug}
                name={a.name}
                city={a.city}
                yearsActive={a.yearsActive}
                listingsCount={listingsByAgent(a.name.ka).length}
                verified={a.verified}
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
