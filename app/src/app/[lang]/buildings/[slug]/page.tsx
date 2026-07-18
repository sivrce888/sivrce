import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import {
  MapPin,
  Building2,
  BadgeCheck,
  Star,
  Navigation,
  Calendar,
} from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import ListingCard from '@/components/ListingCard'
import { StatsRow } from '@/components/entities/StatsRow'
import { LeadForm } from '@/components/lead/LeadForm'
import { ReviewsSection } from '@/components/reviews/ReviewsSection'
import {
  BUILDINGS,
  getBuilding,
  listingsForBuilding,
  buildingDealCounts,
} from '@/data/buildings'
import { LISTINGS } from '@/data/listings'
import { getDeveloper, type Developer } from '@/data/professionals'
import { clusterListingsToBuildings, findBuildingBySlug } from '@/lib/map/buildings'
import { getDbBuildingEntries } from '@/lib/map/db-buildings'
import {
  buildingFloorCount,
  buildingFloors,
  floorsToGeoJSON,
  listingFloor,
} from '@/lib/map/floors'
import BuildingFloorExplorer from '@/components/map/BuildingFloorExplorer'
import { DEAL_BRAND } from '@/lib/category-brand'
import { getReviewAggregate } from '@/lib/reviews/aggregate'
import { jsonLd, ogImage } from '@/lib/utils'
import { langAlternates } from '@/lib/i18n/server'

export function generateStaticParams() {
  // ponytail: prerender ka only (today's build surface) — other locales SSR on
  // demand via dynamicParams. Upgrade path: per-locale SSG when build budget allows.
  return BUILDINGS.map((b) => ({ lang: 'ka', slug: b.slug }))
}

interface PageProps {
  params: Promise<{ slug: string }>
}

/** Static catalog first; DB-curated buildings (admin) as fallback so map deep-links never 404. */
async function resolveBuilding(slug: string) {
  const staticHit = getBuilding(slug)
  if (staticHit) return { building: staticHit, developer: undefined as Developer | undefined }
  const hit = (await getDbBuildingEntries()).find((x) => x.entry.slug === slug)
  if (!hit) return { building: undefined, developer: undefined as Developer | undefined }
  // ponytail: minimal Developer shape; DB developer profiles get full pages when they exist
  const developer: Developer | undefined = hit.developer
    ? {
        slug: hit.developer.slug,
        name: { ka: hit.developer.name, en: hit.developer.name, ru: hit.developer.name },
        city: '',
        yearsActive: 0,
        projectsDone: 0,
        unitsDelivered: 0,
        description: { ka: '', en: '', ru: '' },
        verified: false,
        phone: '',
      }
    : undefined
  return { building: hit.entry, developer }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const { building: b } = await resolveBuilding(slug)
  if (!b) return {}
  const counts = buildingDealCounts(slug)
  const description = `${b.address}. ${counts.sale} გაყიდვა, ${counts.rent} ქირა, ${counts.daily} დღიური, ${counts.pledge} გირავნობა.`
  return {
    title: `${b.name} (${b.code}) — ${b.district}, ${b.city}`,
    description: description.slice(0, 160),
    alternates: { canonical: `/buildings/${b.slug}`, languages: langAlternates(`/buildings/${b.slug}`) },
    openGraph: {
      title: `${b.name} | sivrce`,
      description: description.slice(0, 155),
      type: 'website',
      url: `https://sivrce.ge/buildings/${b.slug}`,
      siteName: 'sivrce',
      locale: 'ka_GE',
      images: [{ url: ogImage(b.img), alt: b.name }],
    },
  }
}

export default async function BuildingPage({ params }: PageProps) {
  const { slug } = await params
  const { building, developer: dbDeveloper } = await resolveBuilding(slug)
  if (!building) notFound()

  const dev = getDeveloper(building.developerSlug) ?? dbDeveloper
  const listings = listingsForBuilding(slug)
  const counts = buildingDealCounts(slug)
  const aggregate = await getReviewAggregate('building', slug)

  // Floor explorer data (build-time): catalog cluster → per-floor availability + 3D slabs
  const cluster = findBuildingBySlug(slug, clusterListingsToBuildings(LISTINGS))
  const floorCount = cluster ? buildingFloorCount(cluster) : building.floors
  const floorsInfo = cluster ? buildingFloors(cluster) : []
  const floorsFc = cluster && listings.length > 0 ? floorsToGeoJSON(cluster) : null

  const buildingLd = {
    '@context': 'https://schema.org',
    '@type': 'ApartmentComplex',
    name: building.name,
    alternateName: [building.nameEn, building.code],
    description: building.description.ka,
    url: `https://sivrce.ge/buildings/${building.slug}`,
    image: `https://sivrce.ge${building.img}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: building.address,
      addressLocality: building.city,
      addressRegion: building.district,
      addressCountry: 'GE',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: building.coords.lat,
      longitude: building.coords.lng,
    },
    numberOfAvailableAccommodationUnits: listings.length || undefined,
    ...(building.yearBuilt && { yearBuilt: building.yearBuilt }),
    ...(aggregate && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: aggregate.average,
        reviewCount: aggregate.count,
      },
    }),
    ...(dev && {
      provider: {
        '@type': 'Organization',
        name: dev.name.en,
        url: `https://sivrce.ge/developers/${dev.slug}`,
      },
    }),
  }

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `რამდენი განცხადებაა ${building.name}-ში?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `ამჟამად ${listings.length} განცხადება: ${counts.sale} გაყიდვა, ${counts.rent} ქირა, ${counts.daily} დღიური, ${counts.pledge} გირავნობა.`,
        },
      },
      {
        '@type': 'Question',
        name: `სად არის ${building.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `მისამართი: ${building.address}. კოდი: ${building.code}.`,
        },
      },
      ...(dev
        ? [
            {
              '@type': 'Question' as const,
              name: `ვინ არის დეველოპერი?`,
              acceptedAnswer: {
                '@type': 'Answer' as const,
                text: `დეველოპერი: ${dev.name.ka}.`,
              },
            },
          ]
        : []),
    ],
  }

  return (
    <div className="min-h-screen bg-sv-surface">
      <Navbar />
      <main id="main" className="pt-16">
        <div className="relative aspect-[16/9] max-h-[480px] w-full overflow-hidden md:aspect-[21/9]">
          <Image
            src={building.img}
            alt={building.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-sv-navy/80 via-sv-navy/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1440px] px-5 pb-8 md:px-10">
            <p className="mb-2 text-[13px] font-semibold tracking-wide text-white/55">
              {building.district} · {building.city}
            </p>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-[28px] font-black text-white [text-shadow:0_2px_12px_rgba(5,11,38,0.6)] md:text-[40px]">
                  {building.name}
                </h1>
                {dev && (
                  <Link
                    href={`/developers/${dev.slug}`}
                    className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-[14px] font-bold text-white/85 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <BadgeCheck className="h-4 w-4 text-sv-success" aria-hidden />
                    {dev.name.ka}
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-1 rounded-control bg-white/95 px-3.5 py-2 text-[15px] font-black text-sv-navy">
                <Star className="h-4 w-4 fill-sv-orange text-sv-orange" aria-hidden />
                {aggregate ? aggregate.average.toFixed(1) : building.rating}
              </div>
            </div>
          </div>
        </div>

        <section className="border-b border-sv-ink/[0.06] bg-sv-cloud">
          <div className="mx-auto max-w-[1440px] px-5 py-8 md:px-10">
            <StatsRow
              items={[
                { label: 'იყიდება', value: String(counts.sale) },
                { label: 'ქირავდება', value: String(counts.rent) },
                { label: 'დღიურად', value: String(counts.daily) },
                { label: 'გირავდება', value: String(counts.pledge) },
              ]}
            />
            <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-bold text-sv-ink/55">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-sv-ink/35" aria-hidden /> {building.address}
              </span>
              <span className="flex items-center gap-1.5">
                <Navigation className="h-4 w-4 text-sv-ink/35" aria-hidden />
                {building.coords.lat.toFixed(5)}, {building.coords.lng.toFixed(5)}
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-sv-ink/35" aria-hidden /> {building.floors} სართ.
              </span>
              {building.yearBuilt && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-sv-ink/35" aria-hidden /> {building.yearBuilt}
                </span>
              )}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/map?building=${building.slug}`}
                className="inline-flex min-h-11 items-center rounded-full bg-sv-blue px-5 py-2.5 text-[13px] font-extrabold text-white shadow-glow-blue-sm transition hover:bg-sv-blue-deep"
              >
                რუკაზე ნახვა
              </Link>
              {building.projectSlug && (
                <Link
                  href={`/projects/${building.projectSlug}`}
                  className="inline-flex min-h-11 items-center rounded-full bg-sv-cloud px-5 py-2.5 text-[13px] font-extrabold text-sv-ink transition hover:bg-sv-ink/5"
                >
                  პროექტი
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10">
          <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
            შენობის შესახებ
          </h2>
          <p className="mt-3 max-w-3xl text-[15px] font-semibold leading-relaxed text-sv-ink/70">
            {building.description.ka}
          </p>
        </section>

        <section className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10">
          <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
            განცხადებები ამ შენობაში
          </h2>
          {listings.length === 0 ? (
            <p className="mt-6 rounded-module bg-sv-cloud px-5 py-10 text-center text-[14px] font-semibold text-sv-ink/50">
              ამ მისამართზე განცხადება არ გვაქვს.
            </p>
          ) : (
            (() => {
              const grid = (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {listings.map((l, i) => (
                    <div key={l.id} className="relative" data-card-floor={listingFloor(l.floor, floorCount)}>
                      <span
                        className="absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-extrabold text-white"
                        style={{ background: DEAL_BRAND[l.dealType] }}
                      >
                        {l.dealType === 'sale'
                          ? 'იყიდება'
                          : l.dealType === 'rent'
                            ? 'ქირავდება'
                            : l.dealType === 'daily'
                              ? 'დღიურად'
                              : 'გირავდება'}
                      </span>
                      <ListingCard l={l} i={i} layout="wide" />
                    </div>
                  ))}
                </div>
              )
              return floorsFc ? (
                <div className="mt-6">
                  <BuildingFloorExplorer
                    label={building.name}
                    center={building.coords}
                    geojson={floorsFc}
                    floors={floorsInfo}
                  >
                    {grid}
                  </BuildingFloorExplorer>
                </div>
              ) : (
                <div className="mt-6">{grid}</div>
              )
            })()
          )}
        </section>

        <section className="mx-auto max-w-[1440px] px-5 pb-16 md:px-10">
          <ReviewsSection targetType="building" targetId={building.slug} />
        </section>

        <section className="mx-auto max-w-[1440px] px-5 pb-16 md:px-10">
          <LeadForm
            targetType="project"
            targetId={building.slug}
            recipientName={building.name}
          />
        </section>
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(buildingLd) }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqLd) }} />
    </div>
  )
}
