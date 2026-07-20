import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import ListingCard from '@/components/ListingCard'
import { EntityHeader } from '@/components/entities/EntityHeader'
import { LeadForm } from '@/components/lead/LeadForm'
import { ReviewsSection } from '@/components/reviews/ReviewsSection'
import { AGENT_PROFILES, getAgentProfile } from '@/data/professionals'
import { cityCenter } from '@/lib/map/geocode'
import MapEmbed from '@/components/MapEmbed'
import { getListingsForAgentProfile } from '@/lib/listings-db'
import { getReviewAggregate } from '@/lib/reviews/aggregate'
import { jsonLd } from '@/lib/utils'
import { langAlternates } from '@/lib/i18n/server'
import { db } from '@/lib/db'
import { safeQuery } from '@/lib/guards'

export function generateStaticParams() {
  // ponytail: prerender ka only (today's build surface) — other locales SSR on
  // demand via dynamicParams. Upgrade path: per-locale SSG when build budget allows.
  return AGENT_PROFILES.map((a) => ({ lang: 'ka', slug: a.slug }))
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const a = getAgentProfile(slug)
  if (a) {
    const description = a.description.ka.replace(/\s+/g, ' ').slice(0, 155)
    return {
      title: `${a.name.ka} — ${a.agency}`,
      description,
      alternates: { canonical: `/agents/${a.slug}`, languages: langAlternates(`/agents/${a.slug}`) },
      openGraph: {
        title: `${a.name.ka} — ${a.agency} | sivrce`,
        description,
        type: 'profile',
        url: `https://sivrce.ge/agents/${a.slug}`,
        siteName: 'sivrce',
        locale: 'ka_GE',
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
    alternates: { canonical: `/agents/${slug}`, languages: langAlternates(`/agents/${slug}`) },
  }
}

export default async function AgentPage({ params }: PageProps) {
  const { slug } = await params
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
  const aggregate = await getReviewAggregate('agent', slug)
  const mapPin = cityCenter(agent.city)

  const agentLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: agent.name.en,
    alternateName: agent.name.ka,
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

  return (
    <div className="min-h-screen bg-sv-surface">
      <Navbar />
      <main id="main" className="pt-16">
        <EntityHeader
          kind="agent"
          name={agent.name}
          city={agent.city}
          verified={agent.verified}
          phone=""
          subtitle={agent.agency}
          stats={[
            { key: 'yearsActive', value: agent.yearsActive },
            { key: 'dealsClosed', value: agent.dealsClosed },
            { key: 'activeListings', value: listings.length },
          ]}
        />

        <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10">
          <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
            შესახებ
          </h2>
          <p className="mt-3 max-w-3xl text-[15px] font-semibold leading-relaxed text-sv-ink/70">
            {agent.description.ka}
          </p>
        </section>

        <section className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10">
          <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
            მდებარეობა
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
          <p className="mt-3 text-[12px] font-semibold text-sv-ink/45">
            {agent.city} · {agent.agency}
          </p>
        </section>

        {listings.length > 0 && (
          <section className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              აგენტის განცხადებები
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((l, i) => (
                <ListingCard key={l.id} l={l} i={i} layout="wide" />
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto grid max-w-[1440px] gap-10 px-5 pb-16 md:px-10 lg:grid-cols-2">
          <LeadForm targetType="agent" targetId={agent.slug} recipientName={agent.name.ka} />
          <ReviewsSection targetType="agent" targetId={agent.slug} />
        </section>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(agentLd) }} />
    </div>
  )
}
