import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import ListingCard from '@/components/ListingCard'
import { EntityCard } from '@/components/entities/EntityCard'
import { EntityHeader } from '@/components/entities/EntityHeader'
import { LeadForm } from '@/components/lead/LeadForm'
import ReviewsSectionServer from '@/components/reviews/ReviewsSectionServer'
import { getReviewAggregate } from '@/lib/reviews/aggregate'
import { altName } from '@/lib/bilingual'
import { cityCenter } from '@/lib/map/geocode'
import MapEmbed from '@/components/MapEmbed'
import { getListingsByOwner, getAgentListingCountsByKaName } from '@/lib/listings-db'
import { AGENT_PROFILES } from '@/data/agent-profiles'
import { jsonLd } from '@/lib/utils'
import {kaOnlyAlternates,  } from '@/lib/i18n/server'
import { db } from '@/lib/db'
import { safeQuery } from '@/lib/guards'
import type { EntitiesKey } from '@/components/entities/i18n'
import { isValidLang } from '@/lib/i18n/core'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ lang: string; slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang: rawLang, slug } = await params
  const lang = isValidLang(rawLang) ? rawLang : 'ka'
  const agency = await safeQuery(
    () =>
      db.agencyProfile.findFirst({
        where: { slug, deletedAt: null },
        select: { name: true, city: true, summary: true },
      }),
    null,
  )
  if (!agency) return {}
  const alt = altName(agency.name)
  const body =
    agency.summary.replace(/\s+/g, ' ') ||
    (lang === 'de'
      ? `${agency.name} — Immobilienmakler in ${agency.city} · sivrce.ge`
      : lang === 'en'
      ? `${agency.name} — real estate agency in ${agency.city} · sivrce.ge`
      : lang === 'ru'
      ? `${agency.name} — агентство недвижимости в ${agency.city} · sivrce.ge`
      : `${agency.name} — უძრავი ქონების სააგენტო ${agency.city}-ში · sivrce.ge`)
  const description = ((alt && !body.includes(alt) ? `${agency.name} (${alt}). ` : '') + body).slice(
    0,
    155,
  )
  const suffix = lang === 'de' ? 'Makler' : lang === 'en' ? 'Agency' : lang === 'ru' ? 'Агентство' : 'სააგენტო'
  return {
    title: `${agency.name} — ${suffix}`,
    description,
    alternates: kaOnlyAlternates(`/agencies/${slug}`),
    openGraph: {
      title: `${agency.name} — ${suffix}`,
      description,
      type: 'profile',
      url: `https://sivrce.ge/agencies/${slug}`,
      siteName: 'sivrce',
      locale: lang === 'de' ? 'de_DE' : lang === 'ru' ? 'ru_RU' : lang === 'en' ? 'en_US' : 'ka_GE',
    },
  }
}

export default async function AgencyPage({ params }: PageProps) {
  const { lang: rawLang, slug } = await params
  const lang = isValidLang(rawLang) ? rawLang : 'ka'
  const loc = lang === 'ka' || lang === 'ru' || lang === 'de' ? lang : 'en'
  // Tri-lang+ru section headings — ka block is the SEO surface.
  const H = {
    ka: { about: 'შესახებ', location: 'მდებარეობა', team: 'გუნდის აგენტები', listings: 'განცხადებები', home: 'მთავარი', agencies: 'სააგენტოები' },
    ru: { about: 'Об агентстве', location: 'Расположение', team: 'Агенты команды', listings: 'Объявления', home: 'Главная', agencies: 'Агентства' },
    de: { about: 'Über uns', location: 'Lage', team: 'Makler-Team', listings: 'Inserate', home: 'Startseite', agencies: 'Makler' },
    en: { about: 'About', location: 'Location', team: 'Team agents', listings: 'Listings', home: 'Home', agencies: 'Agencies' },
  }[loc]
  const agency = await safeQuery(
    () => db.agencyProfile.findFirst({ where: { slug, deletedAt: null } }),
    null,
  )
  if (!agency) notFound()

  // ponytail: no FK agent→agency — team membership is the agency name string.
  const team = await safeQuery(
    () =>
      db.agentProfile.findMany({
        where: { agency: agency.name, deletedAt: null },
        select: { slug: true, name: true, verified: true, listingsCount: true, ownerId: true },
        orderBy: { listingsCount: 'desc' },
        take: 24,
      }),
    [],
  )
  const ownerIds = [
    ...new Set([agency.ownerId, ...team.map((t) => t.ownerId)].filter((x): x is string => !!x)),
  ]
  const [aggregate, listings, agentCounts] = await Promise.all([
    getReviewAggregate('agency', agency.slug),
    getListingsByOwner(ownerIds).catch(() => []),
    getAgentListingCountsByKaName(),
  ])
  // Curated agents (same roster the /agents strip counts) fill the team rail
  // until the agency's agents claim DB profiles — DB rows win on slug overlap.
  const dbSlugs = new Set(team.map((t) => t.slug))
  const curatedTeam = AGENT_PROFILES.filter(
    (a) => a.agency === agency.name && !dbSlugs.has(a.slug),
  )
  const teamCards = (
    await Promise.all([
      ...team.map(async (t) => ({ ...t, aggregate: await getReviewAggregate('agent', t.slug) })),
      ...curatedTeam.map(async (a) => ({
        slug: a.slug,
        name: a.name.ka,
        verified: a.verified,
        listingsCount: agentCounts[a.name.ka] ?? 0,
        aggregate: await getReviewAggregate('agent', a.slug),
      })),
    ])
  ).sort((x, y) => y.listingsCount - x.listingsCount)
  const mapPin = cityCenter(agency.city)

  const stats: { key: EntitiesKey; value: string | number }[] = [
    { key: 'teamSize', value: Math.max(agency.teamSize, team.length) },
    // Same basis as the directory card — owner-linked listings alone read as 0
    // for agencies whose agents haven't claimed profiles yet.
    { key: 'activeListings', value: Math.max(agency.activeListings, listings.length) },
  ]
  if (agency.responseRatePct > 0)
    stats.push({ key: 'responseRate', value: `${Math.round(agency.responseRatePct)}%` })
  if (agency.avgDealDays > 0) stats.push({ key: 'avgDealDays', value: agency.avgDealDays })

  const name = { ka: agency.name, en: agency.name, ru: agency.name }

  const agencyLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: agency.name,
    ...(altName(agency.name) && { alternateName: altName(agency.name) }),
    url: `https://sivrce.ge/agencies/${agency.slug}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: agency.city,
      addressCountry: 'GE',
    },
    ...(aggregate && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: aggregate.average,
        reviewCount: aggregate.count,
      },
    }),
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: H.home, item: 'https://sivrce.ge' },
      { '@type': 'ListItem', position: 2, name: H.agencies, item: 'https://sivrce.ge/agencies' },
      { '@type': 'ListItem', position: 3, name: agency.name, item: `https://sivrce.ge/agencies/${agency.slug}` },
    ],
  }

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main" className="pt-[68px]">
        <EntityHeader
          kind="agency"
          name={name}
          city={agency.city}
          verified={agency.verified}
          phone=""
          subtitle={agency.districts.slice(0, 3).join(' · ')}
          stats={stats}
          messageUserId={agency.ownerId}
        />

        {agency.summary ? (
          <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              {H.about}
            </h2>
            <p className="mt-3 max-w-3xl text-[15px] font-semibold leading-relaxed text-sv-ink/70">
              {agency.summary}
            </p>
          </section>
        ) : null}

        <section className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10">
          <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
            {H.location}
          </h2>
          <div className="relative mt-6 overflow-hidden rounded-card shadow-card">
            <MapEmbed
              lat={mapPin.lat}
              lng={mapPin.lng}
              zoom={12}
              q={agency.city}
              aspect="16/9"
              highlight
              className="border-0 shadow-none rounded-none"
            />
          </div>
          <p className="mt-3 text-[12px] font-semibold text-sv-ink/60">{agency.city}</p>
        </section>

        {teamCards.length > 0 && (
          <section className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              {H.team}
            </h2>
            <div className="mt-6 sv-card-grid-3">
              {teamCards.map((t) => (
                <EntityCard
                  key={t.slug}
                  kind="agent"
                  slug={t.slug}
                  name={{ ka: t.name, en: t.name, ru: t.name }}
                  city=""
                  subtitle={agency.name}
                  listingsCount={t.listingsCount}
                  verified={t.verified}
                  aggregate={t.aggregate}
                />
              ))}
            </div>
          </section>
        )}

        {listings.length > 0 && (
          <section className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              სააგენტოს განცხადებები
            </h2>
            <div className="mt-6 sv-card-grid-3">
              {listings.map((l, i) => (
                <ListingCard key={l.id} l={l} i={i} layout="wide" />
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto max-w-[1440px] px-5 pb-16 md:px-10">
          <div className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-2">
            <LeadForm targetType="agency" targetId={agency.slug} recipientName={agency.name} />
            <ReviewsSectionServer targetType="agency" targetId={agency.slug} />
          </div>
        </section>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(agencyLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbLd) }} />
    </div>
  )
}
