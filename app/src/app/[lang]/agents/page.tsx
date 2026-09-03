import type { Metadata } from 'next'
import LocalizedLink from '@/components/LocalizedLink'
import Navbar from '@/components/sections/Navbar'
import CTA from '@/components/sections/CTA'
import Footer from '@/components/sections/Footer'
import { PageHero } from '@/components/PageHero'
import { AdSlot } from '@/components/ads/AdSlot'
import { isValidLang } from '@/lib/i18n/core'
import { EntityCard } from '@/components/entities/EntityCard'
import { AGENT_PROFILES, type LocalName } from '@/data/professionals'
import { getAgentListingCountsByKaName } from '@/lib/listings-db'
import { getReviewAggregate } from '@/lib/reviews/aggregate'
import { jsonLd } from '@/lib/utils'
import { pageMeta } from '@/lib/i18n/server'
import { roleSignupHref } from '@/lib/auth-roles'
import { db } from '@/lib/db'
import { safeQuery } from '@/lib/guards'
import { ArrowRight, Building2 } from 'lucide-react'

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  return {
    ...pageMeta('/agents', lang, {
      ka: {
        title: 'უძრავი ქონების აგენტები — ვერიფიცირებული სპეციალისტები',
        description:
          'ვერიფიცირებული უძრავი ქონების აგენტები თბილისსა და ბათუმში: გამოცდილება, დახურული გარიგებები, ენები და რეალური მიმოხილვები — აირჩიე შენი აგენტი.',
      },
      en: {
        title: 'Verified Real Estate Agents in Tbilisi & Batumi',
        description:
          'Verified real estate agents in Tbilisi and Batumi: experience, closed deals, languages and real reviews — choose your agent.',
      },
      ru: {
        title: 'Проверенные риелторы в Тбилиси и Батуми',
        description:
          'Проверенные агенты по недвижимости в Тбилиси и Батуми: опыт, закрытые сделки, языки и реальные отзывы — выберите своего агента.',
      },
    }),
    openGraph: {
      title: 'უძრავი ქონების აგენტები',
      description:
        'ვერიფიცირებული აგენტები თბილისსა და ბათუმში — გამოცდილებით, სტატისტიკითა და მიმოხილვებით.',
      type: 'website',
    },
  }
}

export default async function AgentsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const counts = await getAgentListingCountsByKaName()
  // DB-signed-up agents join the index; curated static profiles win on overlap.
  // ponytail: cap 60 DB cards — pagination when signups outgrow one page.
  const known = new Set(AGENT_PROFILES.flatMap((a) => [a.slug, a.name.ka]))
  const dbExtras = (
    await safeQuery(
      () =>
        db.agentProfile.findMany({
          where: { deletedAt: null },
          select: { slug: true, name: true, agency: true, verified: true },
          take: 300,
        }),
      [],
    )
  )
    .filter((p) => !known.has(p.slug) && !known.has(p.name))
    .slice(0, 60)

  interface Card {
    slug: string
    name: LocalName
    city: string
    agency: string
    yearsActive?: number
    dealsClosed: number
    verified: boolean
    listingsCount: number
    aggregate: Awaited<ReturnType<typeof getReviewAggregate>>
  }

  const cards = (
    await Promise.all([
      ...AGENT_PROFILES.map(async (a): Promise<Card> => ({
        slug: a.slug,
        name: a.name,
        city: a.city,
        agency: a.agency,
        yearsActive: a.yearsActive,
        dealsClosed: a.dealsClosed,
        verified: a.verified,
        listingsCount: counts[a.name.ka] ?? 0,
        aggregate: await getReviewAggregate('agent', a.slug),
      })),
      ...dbExtras.map(async (p): Promise<Card> => ({
        slug: p.slug,
        name: { ka: p.name, en: p.name, ru: p.name },
        city: '',
        agency: p.agency,
        dealsClosed: 0,
        verified: p.verified,
        listingsCount: counts[p.name] ?? 0,
        aggregate: await getReviewAggregate('agent', p.slug),
      })),
    ])
  ).sort((x, y) => y.listingsCount - x.listingsCount || y.dealsClosed - x.dealsClosed)

  // ponytail: no FK agent→agency — sum agent inventory by agency name string
  const agencyMap = new Map<string, { listings: number; agents: number }>()
  for (const { agency, listingsCount } of cards) {
    const cur = agencyMap.get(agency) ?? { listings: 0, agents: 0 }
    cur.listings += listingsCount
    cur.agents += 1
    agencyMap.set(agency, cur)
  }
  const topAgencies = [...agencyMap.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((x, y) => y.listings - x.listings || y.agents - x.agents)
    .slice(0, 8)

  const listLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: cards.map(({ name, slug }, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: name.en,
      url: `https://sivrce.ge/agents/${slug}`,
    })),
  }

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <PageHero
          tone="light"
          kicker="დირექტორია"
          title="აგენტები და სააგენტოები"
          subtitle="დალაგებული აქტიური განცხადებების რაოდენობით — ვერიფიცირებული სპეციალისტები გამოცდილებითა და მიმოხილვებით"
        >
          <LocalizedLink
            href={roleSignupHref("agent")}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-sv-orange px-6 py-3 text-[14px] font-extrabold text-white shadow-glow-orange transition hover:-translate-y-0.5 hover:shadow-glow-orange-lg"
          >
            გახდი აგენტი სივრცეზე
            <ArrowRight className="h-4 w-4" />
          </LocalizedLink>
        </PageHero>
        <AdSlot slot="agents" lang={lang} />
        <section className="mx-auto max-w-[1440px] px-5 pb-16 md:px-10">
          {topAgencies.some((x) => x.listings > 0) && (
            <div className="mt-2">
              <div className="mb-3 flex items-center gap-2 text-[13px] font-black uppercase tracking-wider text-sv-blue">
                <Building2 className="h-3.5 w-3.5" />
                ტოპ სააგენტოები
              </div>
              <ul className="flex flex-wrap gap-2.5">
                {topAgencies.map((ag, i) => (
                  <li key={ag.name}>
                    <LocalizedLink
                      href="/agencies"
                      className="inline-flex items-center gap-2 rounded-control border border-sv-ink/[0.07] bg-sv-surface px-3.5 py-2 text-[13px] font-extrabold text-sv-ink transition-all hover:-translate-y-0.5 hover:border-sv-blue/30 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
                    >
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-sv-blue/10 text-[10px] font-black text-sv-blue">
                        {i + 1}
                      </span>
                      <span>{ag.name}</span>
                      <span className="font-bold text-sv-ink/45">
                        {ag.listings} · {ag.agents} აგენტი
                      </span>
                    </LocalizedLink>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-10 sv-card-grid-3">
            {cards.map((c) => (
              <EntityCard
                key={c.slug}
                kind="agent"
                slug={c.slug}
                name={c.name}
                city={c.city}
                yearsActive={c.yearsActive}
                subtitle={c.agency}
                listingsCount={c.listingsCount}
                verified={c.verified}
                aggregate={c.aggregate}
              />
            ))}
          </div>
        </section>
        <CTA lang={lang} />
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(listLd) }} />
    </div>
  )
}
