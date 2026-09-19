import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import ListingCard from '@/components/ListingCard'
import { EntityHeader } from '@/components/entities/EntityHeader'
import { LeadForm } from '@/components/lead/LeadForm'
import ReviewsSectionServer from '@/components/reviews/ReviewsSectionServer'
import { AGENT_PROFILES, getAgentProfile } from '@/data/professionals'
import { cityCenter } from '@/lib/map/geocode'
import MapEmbed from '@/components/MapEmbed'
import { getListingsForAgentProfile } from '@/lib/listings-db'
import { getReviewAggregate } from '@/lib/reviews/aggregate'
import { altNameList } from '@/lib/bilingual'
import { jsonLd } from '@/lib/utils'
import { kaOnlyAlternates } from '@/lib/i18n/server'
import { isValidLang } from '@/lib/i18n/core'
import { pickLoc } from '@/lib/directory-seo-lite'
import { db } from '@/lib/db'
import { safeQuery } from '@/lib/guards'

export const revalidate = 3600

export function generateStaticParams() {
  // ponytail: prerender ka only (today's build surface) — other locales SSR on
  // demand via dynamicParams. Upgrade path: per-locale SSG when build budget allows.
  return AGENT_PROFILES.map((a) => ({ lang: 'ka', slug: a.slug }))
}

interface PageProps {
  params: Promise<{ lang: string; slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang: rawLang, slug } = await params
  const lang = isValidLang(rawLang) ? rawLang : 'ka'
  const loc = lang === 'ka' || lang === 'ru' || lang === 'de' ? lang : 'en'
  const a = getAgentProfile(slug)
  if (a) {
    const description = pickLoc(a.description, loc).replace(/\s+/g, ' ').slice(0, 155)
    const name = pickLoc(a.name, loc)
    return {
      title: `${name} — ${a.agency}`,
      description,
      alternates: kaOnlyAlternates(`/agents/${a.slug}`),
      openGraph: {
        title: `${name} — ${a.agency}`,
        description,
        type: 'profile',
        url: `https://sivrce.ge/agents/${a.slug}`,
        siteName: 'sivrce',
        locale: lang === 'de' ? 'de_DE' : lang === 'ru' ? 'ru_RU' : lang === 'en' ? 'en_US' : 'ka_GE',
      },
    }
  }
  const dbAgent = await safeQuery(
    () => db.agentProfile.findFirst({ where: { slug, deletedAt: null }, select: { name: true, agency: true } }),
    null,
  )
  if (!dbAgent) return {}
  return {
    title: `${dbAgent.name} — ${dbAgent.agency}`,
    alternates: kaOnlyAlternates(`/agents/${slug}`),
  }
}

export default async function AgentPage({ params }: PageProps) {
  const { lang: rawLang, slug } = await params
  const lang = isValidLang(rawLang) ? rawLang : 'ka'
  const loc = lang === 'ka' || lang === 'ru' || lang === 'de' ? lang : 'en'
  // Tri-lang section headings (ka/en+de) — ka block is the SEO surface.
  const H = {
    ka: { about: 'შესახებ', location: 'მდებარეობა', listings: 'აგენტის განცხადებები', home: 'მთავარი', agents: 'აგენტები' },
    ru: { about: 'Об агенте', location: 'Расположение', listings: 'Объявления агента', home: 'Главная', agents: 'Агенты' },
    de: { about: 'Über uns', location: 'Lage', listings: 'Inserate des Maklers', home: 'Startseite', agents: 'Makler' },
    en: { about: 'About', location: 'Location', listings: "Agent's listings", home: 'Home', agents: 'Agents' },
  }[loc]
  const agent = getAgentProfile(slug)

  // Live DB agents → unified /u/[id] (listings + role)
  if (!agent) {
    const dbAgent = await safeQuery(
      () => db.agentProfile.findFirst({ where: { slug, deletedAt: null }, select: { ownerId: true } }),
      null,
    )
    if (dbAgent?.ownerId) redirect(`/u/${dbAgent.ownerId}`)
    notFound()
  }

  const listings = await getListingsForAgentProfile(agent.slug, agent.name.ka)
  const descLoc = pickLoc(agent.description, loc)
  const aggregate = await getReviewAggregate('agent', slug)
  const mapPin = cityCenter(agent.city)

  const agentLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: agent.name.en,
    alternateName: altNameList(agent.name.en, [agent.name.ka, agent.name.ru]),
    url: `https://sivrce.ge/agents/${agent.slug}`,
    worksFor: { '@type': 'Organization', name: agent.agency },
    address: {
      '@type': 'PostalAddress',
      addressLocality: agent.city,
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
      { '@type': 'ListItem', position: 2, name: H.agents, item: 'https://sivrce.ge/agents' },
      { '@type': 'ListItem', position: 3, name: pickLoc(agent.name, loc), item: `https://sivrce.ge/agents/${agent.slug}` },
    ],
  }

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main" className="pt-[68px]">
        <EntityHeader
          kind="agent"
          name={agent.name}
          city={agent.city}
          verified={agent.verified}
          phone={agent.phone}
          subtitle={agent.agency}
          stats={[
            { key: 'yearsActive', value: agent.yearsActive },
            { key: 'dealsClosed', value: agent.dealsClosed },
            { key: 'activeListings', value: listings.length },
          ]}
        />

        <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10">
          <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
            {H.about}
          </h2>
          <p className="mt-3 max-w-3xl text-[15px] font-semibold leading-relaxed text-sv-ink/70">
            {descLoc}
          </p>
        </section>

        <section className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10">
          <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
            {H.location}
          </h2>
          <div className="relative mt-6 overflow-hidden rounded-card shadow-card">
            <MapEmbed
              lat={mapPin.lat}
              lng={mapPin.lng}
              zoom={12}
              q={agent.city}
              aspect="16/9"
              highlight
              className="border-0 shadow-none rounded-none"
            />
          </div>
          <p className="mt-3 text-[12px] font-semibold text-sv-ink/60">
            {agent.city} · {agent.agency}
          </p>
        </section>

        {listings.length > 0 && (
          <section className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              {H.listings}
            </h2>
            <div className="mt-6 sv-card-grid-3">
              {listings.map((l, i) => (
                <ListingCard key={l.id} l={l} i={i} layout="wide" />
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto grid max-w-[1440px] gap-10 px-5 pb-16 md:px-10 lg:grid-cols-2">
          <LeadForm targetType="agent" targetId={agent.slug} recipientName={pickLoc(agent.name, loc)} />
          <ReviewsSectionServer targetType="agent" targetId={agent.slug} />
        </section>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(agentLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbLd) }} />
    </div>
  )
}
