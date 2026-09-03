import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import ListingCard from '@/components/ListingCard'
import { EntityCard } from '@/components/entities/EntityCard'
import { EntityHeader } from '@/components/entities/EntityHeader'
import { LeadForm } from '@/components/lead/LeadForm'
import { cityCenter } from '@/lib/map/geocode'
import MapEmbed from '@/components/MapEmbed'
import { getListingsByOwner } from '@/lib/listings-db'
import { jsonLd } from '@/lib/utils'
import { langAlternates } from '@/lib/i18n/server'
import { db } from '@/lib/db'
import { safeQuery } from '@/lib/guards'
import type { EntitiesKey } from '@/components/entities/i18n'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const agency = await safeQuery(
    () =>
      db.agencyProfile.findFirst({
        where: { slug, deletedAt: null },
        select: { name: true, city: true, summary: true },
      }),
    null,
  )
  if (!agency) return {}
  const description =
    agency.summary.replace(/\s+/g, ' ').slice(0, 155) ||
    `${agency.name} — უძრავი ქონების სააგენტო ${agency.city}-ში · სივრცე.ge`
  return {
    title: `${agency.name} — სააგენტო`,
    description,
    alternates: { canonical: `/agencies/${slug}`, languages: langAlternates(`/agencies/${slug}`) },
    openGraph: {
      title: `${agency.name} — სააგენტო`,
      description,
      type: 'profile',
      url: `https://sivrce.ge/agencies/${slug}`,
      siteName: 'sivrce',
      locale: 'ka_GE',
    },
  }
}

export default async function AgencyPage({ params }: PageProps) {
  const { slug } = await params
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
  const listings = await getListingsByOwner(ownerIds).catch(() => [])
  const mapPin = cityCenter(agency.city)

  const stats: { key: EntitiesKey; value: string | number }[] = [
    { key: 'teamSize', value: Math.max(agency.teamSize, team.length) },
    { key: 'activeListings', value: listings.length },
  ]
  if (agency.responseRatePct > 0)
    stats.push({ key: 'responseRate', value: `${Math.round(agency.responseRatePct)}%` })
  if (agency.avgDealDays > 0) stats.push({ key: 'avgDealDays', value: agency.avgDealDays })

  const name = { ka: agency.name, en: agency.name, ru: agency.name }

  const agencyLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: agency.name,
    url: `https://sivrce.ge/agencies/${agency.slug}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: agency.city,
      addressCountry: 'GE',
    },
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
        />

        {agency.summary ? (
          <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              შესახებ
            </h2>
            <p className="mt-3 max-w-3xl text-[15px] font-semibold leading-relaxed text-sv-ink/70">
              {agency.summary}
            </p>
          </section>
        ) : null}

        <section className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10">
          <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
            მდებარეობა
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
          <p className="mt-3 text-[12px] font-semibold text-sv-ink/45">{agency.city}</p>
        </section>

        {team.length > 0 && (
          <section className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              გუნდის აგენტები
            </h2>
            <div className="mt-6 sv-card-grid-3">
              {team.map((t) => (
                <EntityCard
                  key={t.slug}
                  kind="agent"
                  slug={t.slug}
                  name={{ ka: t.name, en: t.name, ru: t.name }}
                  city=""
                  subtitle={agency.name}
                  listingsCount={t.listingsCount}
                  verified={t.verified}
                  aggregate={null}
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
          <div className="mx-auto max-w-xl">
            <LeadForm targetType="agency" targetId={agency.slug} recipientName={agency.name} />
          </div>
        </section>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(agencyLd) }} />
    </div>
  )
}
