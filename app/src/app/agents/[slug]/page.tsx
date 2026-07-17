import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import ListingCard from '@/components/ListingCard'
import { EntityHeader } from '@/components/entities/EntityHeader'
import { LeadForm } from '@/components/lead/LeadForm'
import { ReviewsSection } from '@/components/reviews/ReviewsSection'
import { AGENT_PROFILES, getAgentProfile, listingsByAgent } from '@/data/professionals'
import { getReviewAggregate } from '@/lib/reviews/aggregate'
import { jsonLd } from '@/lib/utils'

export function generateStaticParams() {
  return AGENT_PROFILES.map((a) => ({ slug: a.slug }))
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const a = getAgentProfile(slug)
  if (!a) return {}
  const description = a.description.ka.replace(/\s+/g, ' ').slice(0, 155)
  return {
    title: `${a.name.ka} — ${a.agency}`,
    description,
    alternates: { canonical: `/agents/${a.slug}` },
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

export default async function AgentPage({ params }: PageProps) {
  const { slug } = await params
  const agent = getAgentProfile(slug)
  if (!agent) notFound()

  const listings = listingsByAgent(agent.name.ka)
  const aggregate = await getReviewAggregate('agent', slug)

  const agentLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: agent.name.en,
    alternateName: agent.name.ka,
    url: `https://sivrce.ge/agents/${agent.slug}`,
    telephone: agent.phone,
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
            შესახებ
          </h2>
          <p className="mt-3 max-w-3xl text-[15px] font-semibold leading-relaxed text-sv-ink/70">
            {agent.description.ka}
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
