import type { Metadata } from 'next'
import Navbar from '@/components/sections/Navbar'
import CTA from '@/components/sections/CTA'
import Footer from '@/components/sections/Footer'
import { EntityCard } from '@/components/entities/EntityCard'
import { AGENT_PROFILES } from '@/data/professionals'
import { getAgentListingCountsByKaName } from '@/lib/listings-db'
import { getReviewAggregate } from '@/lib/reviews/aggregate'
import { jsonLd } from '@/lib/utils'
import { langAlternates } from '@/lib/i18n/server'
import { Building2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'უძრავი ქონების აგენტები — ვერიფიცირებული სპეციალისტები',
  description:
    'ვერიფიცირებული უძრავი ქონების აგენტები თბილისსა და ბათუმში: გამოცდილება, დახურული გარიგებები, ენები და რეალური მიმოხილვები — აირჩიე შენი აგენტი.',
  alternates: { canonical: '/agents', languages: langAlternates('/agents') },
  openGraph: {
    title: 'უძრავი ქონების აგენტები | sivrce',
    description:
      'ვერიფიცირებული აგენტები თბილისსა და ბათუმში — გამოცდილებით, სტატისტიკითა და მიმოხილვებით.',
    type: 'website',
  },
}

export default async function AgentsPage() {
  const counts = await getAgentListingCountsByKaName()
  const cards = (
    await Promise.all(
      AGENT_PROFILES.map(async (a) => ({
        a,
        listingsCount: counts[a.name.ka] ?? 0,
        aggregate: await getReviewAggregate('agent', a.slug),
      })),
    )
  ).sort((x, y) => y.listingsCount - x.listingsCount || y.a.dealsClosed - x.a.dealsClosed)

  // ponytail: agency hub not public yet — sum agent inventory by agency name string
  const agencyMap = new Map<string, { listings: number; agents: number }>()
  for (const { a, listingsCount } of cards) {
    const cur = agencyMap.get(a.agency) ?? { listings: 0, agents: 0 }
    cur.listings += listingsCount
    cur.agents += 1
    agencyMap.set(a.agency, cur)
  }
  const topAgencies = [...agencyMap.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((x, y) => y.listings - x.listings || y.agents - x.agents)
    .slice(0, 8)

  const listLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: cards.map(({ a }, i) => ({
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
            დალაგებული აქტიური განცხადებების რაოდენობით — ვერიფიცირებული სპეციალისტები გამოცდილებითა და მიმოხილვებით
          </p>

          {topAgencies.some((x) => x.listings > 0) && (
            <div className="mt-8">
              <div className="mb-3 flex items-center gap-2 text-[13px] font-black uppercase tracking-wider text-sv-blue">
                <Building2 className="h-3.5 w-3.5" />
                ტოპ სააგენტოები
              </div>
              <ul className="flex flex-wrap gap-2.5">
                {topAgencies.map((ag, i) => (
                  <li
                    key={ag.name}
                    className="inline-flex items-center gap-2 rounded-control border border-sv-ink/[0.07] bg-sv-cloud px-3.5 py-2 text-[13px] font-extrabold text-sv-ink"
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-sv-blue/10 text-[10px] font-black text-sv-blue">
                      {i + 1}
                    </span>
                    <span>{ag.name}</span>
                    <span className="font-bold text-sv-ink/45">
                      {ag.listings} · {ag.agents} აგენტი
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map(({ a, listingsCount, aggregate }) => (
              <EntityCard
                key={a.slug}
                kind="agent"
                slug={a.slug}
                name={a.name}
                city={a.city}
                yearsActive={a.yearsActive}
                listingsCount={listingsCount}
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
