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
  TrainFront,
  GraduationCap,
  Trees,
  Hospital,
  ShoppingBag,
  Landmark,
  Dumbbell,
  Pill,
  type LucideIcon,
} from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import ListingCard from '@/components/ListingCard'
import { StatsRow } from '@/components/entities/StatsRow'
import { LeadForm } from '@/components/lead/LeadForm'
import { ReviewsSection } from '@/components/reviews/ReviewsSection'
import { FaqSection } from '@/components/seo/FaqSection'
import HScroll from '@/components/HScroll'
import MapEmbed from '@/components/MapEmbed'
import {
  getBuilding,
  buildingDealCounts,
  relatedBuildings,
} from '@/data/buildings'
import { getDeveloper, type Developer } from '@/data/professionals'
import {
  clusterListingsToBuildings,
  dealLabelKa,
  ensureFootprints,
  findBuildingBySlug,
  footprintPin,
} from '@/lib/map/buildings'
import {
  getBuildingDealCountsBySlug,
  getDbBuildingEntries,
  getListingsForBuildingSlug,
} from '@/lib/map/db-buildings'
import {
  buildingFloorCount,
  buildingFloors,
  floorsToGeoJSON,
  listingFloor,
} from '@/lib/map/floors'
import { getMapPlatformConfig } from '@/lib/map/platform-config'
import BuildingFloorExplorer from '@/components/map/BuildingFloorExplorer'
import { DEAL_BRAND } from '@/lib/category-brand'
import { getReviewAggregate } from '@/lib/reviews/aggregate'
import {
  formatMetroDist,
  nearestAmenities,
  nearestMetro,
  POI_COLORS,
  POI_LABELS,
  type PoiCategory,
} from '@/lib/map/pois'
import { getDistrictPeerPerM2 } from '@/lib/listings-db'
import { priceScaleOf } from '@/lib/price-scale'
import { medianOf } from '@/lib/market-stats-core'
import { buildingScoreOf, type BuildingFactorKey } from '@/lib/building-score'
import { faqPageLd } from '@/lib/directory-seo'
import { jsonLd, ogImage } from '@/lib/utils'
import { langAlternates } from '@/lib/i18n/server'

const FACTOR_LABEL: Record<BuildingFactorKey, string> = {
  value: 'ღირებულება',
  liquidity: 'ლიკვიდურობა',
  trust: 'ნდობა',
  quality: 'ხარისხი',
  location: 'მდებარეობა',
}

export const revalidate = 3600
export const maxDuration = 15

interface PageProps {
  params: Promise<{ slug: string }>
}

const AMENITY_ICON: Record<PoiCategory, LucideIcon> = {
  metro: TrainFront,
  school: GraduationCap,
  university: Landmark,
  park: Trees,
  hospital: Hospital,
  shop: ShoppingBag,
  gym: Dumbbell,
  pharmacy: Pill,
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
  const live = (await getBuildingDealCountsBySlug())[slug]
  const counts = live ?? buildingDealCounts(slug)
  const place = [b.ubani, b.district, b.city].filter(Boolean).join(', ')
  const description = `${b.description.ka} ${place}. ${counts.sale} გაყიდვა, ${counts.rent} ქირა.`.slice(0, 160)
  return {
    title: `${b.name} (${b.code}) — ${b.district}, ${b.city}`,
    description,
    alternates: { canonical: `/buildings/${b.slug}`, languages: langAlternates(`/buildings/${b.slug}`) },
    openGraph: {
      title: `${b.name}`,
      description,
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
  await ensureFootprints()
  // Exact-building pin — committed OSM footprint beats street-level geocode drift.
  const fpPin = footprintPin({ slug }, building.coords)

  const dev = getDeveloper(building.developerSlug) ?? dbDeveloper
  const liveListings = await getListingsForBuildingSlug(slug)
  const listings = liveListings
  const liveCounts = (await getBuildingDealCountsBySlug())[slug]
  const counts = liveCounts ?? { sale: 0, rent: 0, daily: 0, pledge: 0 }
  const aggregate = await getReviewAggregate('building', slug)
  const amenities = nearestAmenities(building.coords.lat, building.coords.lng)
  const metro = nearestMetro(building.coords.lat, building.coords.lng)
  const related = relatedBuildings(slug)
  const gallery = (building.gallery ?? []).filter((src) => src !== building.img)
  const place = [building.ubani, building.district, building.city].filter(Boolean).join(' · ')
  const mapsApple = `https://maps.apple.com/?daddr=${building.coords.lat},${building.coords.lng}&q=${encodeURIComponent(building.name)}`
  const mapsGoogle = `https://www.google.com/maps/dir/?api=1&destination=${building.coords.lat},${building.coords.lng}`

  // Building price intelligence — live sale sample vs district band.
  const saleListings = listings.filter((l) => l.dealType === 'sale')
  const salePerM2 = saleListings.map((l) => l.perM2USD).filter((p) => p > 0)
  const buildingAvgPerM2 = salePerM2.length
    ? Math.round(salePerM2.reduce((a, b) => a + b, 0) / salePerM2.length)
    : null
  const buildingMedianPrice = medianOf(saleListings.map((l) => l.priceUSD))
  const peers = await getDistrictPeerPerM2(building.city, building.district, 'sale')
  const buildingScale = buildingAvgPerM2 != null ? priceScaleOf(buildingAvgPerM2, peers) : null
  const score = buildingScoreOf({
    avgPerM2USD: buildingAvgPerM2,
    districtPct: buildingScale?.pct ?? null,
    saleCount: counts.sale,
    verifiedShare: listings.length
      ? listings.filter((l) => l.verified).length / listings.length
      : null,
    rating: aggregate ? aggregate.average : (building.rating ?? null),
    metroWalkMin: metro ? metro.walkMin : null,
  })

  const cluster = findBuildingBySlug(slug, clusterListingsToBuildings(listings))
  const floorCount = cluster ? buildingFloorCount(cluster) : building.floors
  const floorsInfo = cluster ? buildingFloors(cluster) : []
  const floorsFc =
    (await getMapPlatformConfig()).floorStacksEnabled && cluster && listings.length > 0
      ? floorsToGeoJSON(cluster)
      : null

  const faqs = [
    {
      q: `რამდენი განცხადებაა ${building.name}-ში?`,
      a: `ამჟამად ${listings.length} განცხადება: ${counts.sale} გაყიდვა, ${counts.rent} ქირა, ${counts.daily} დღიური, ${counts.pledge} გირავნობა.`,
    },
    {
      q: `სად არის ${building.name}?`,
      a: `მისამართი: ${building.address}. ${place}. კოდი: ${building.code}.${metro ? ` უახლოესი მეტრო: ${metro.name} (${formatMetroDist(metro)}).` : ''}`,
    },
    ...(buildingAvgPerM2 != null
      ? [
          {
            q: `რა ღირს მ² ${building.name}-ში?`,
            a: `აქტიური განცხადებების მიხედვით საშუალო ფასი $${buildingAvgPerM2.toLocaleString('en-US')}/მ²-ა (${salePerM2.length} განცხადება).${buildingScale ? ` რაიონთან შედარებით: ${buildingScale.labelKa.toLowerCase()}.` : ''}`,
          },
        ]
      : []),
    ...(dev
      ? [
          {
            q: 'ვინ არის დეველოპერი?',
            a: `დეველოპერი: ${dev.name.ka}.`,
          },
        ]
      : []),
    {
      q: 'როგორ მივიდე?',
      a: metro
        ? `ფეხით ${metro.walkMin} წთ მეტრო ${metro.name}-დან. გახსენი Apple Maps ან Google Maps მარშრუტისთვის.`
        : `მისამართი: ${building.address}. გახსენი Apple Maps ან Google Maps მარშრუტისთვის.`,
    },
  ]

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
    numberOfAccommodationUnits: building.units,
    ...(building.yearBuilt && { yearBuilt: building.yearBuilt }),
    ...(buildingAvgPerM2 != null && {
      additionalProperty: [
        { '@type': 'PropertyValue' as const, name: 'averagePricePerSqmUSD', value: buildingAvgPerM2 },
      ],
    }),
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

  const crumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'შენობები', item: 'https://sivrce.ge/buildings' },
      {
        '@type': 'ListItem',
        position: 2,
        name: building.district,
        item: `https://sivrce.ge/buildings`,
      },
      { '@type': 'ListItem', position: 3, name: building.name, item: `https://sivrce.ge/buildings/${building.slug}` },
    ],
  }

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
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
          <div aria-hidden className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-sv-navy/55 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1440px] px-5 pb-8 md:px-10">
            <nav className="mb-3 flex flex-wrap items-center gap-2 text-[12px] font-bold text-white/60">
              <Link href="/buildings" className="hover:text-white">
                შენობები
              </Link>
              <span aria-hidden>/</span>
              <span>{building.district}</span>
              {building.ubani && (
                <>
                  <span aria-hidden>/</span>
                  <span>{building.ubani}</span>
                </>
              )}
            </nav>
            <p className="mb-2 text-[13px] font-semibold tracking-wide text-white/55">{place}</p>
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
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1.5 text-[12px] font-extrabold text-white ${
                    building.status === 'ready' ? 'bg-sv-blue' : 'bg-sv-orange'
                  }`}
                >
                  {building.status === 'ready' ? 'ჩაბარებული' : 'მშენებარე'}
                </span>
                <div className="flex items-center gap-1 rounded-control bg-white/95 px-3.5 py-2 text-[15px] font-black text-sv-ink">
                  <Star className="h-4 w-4 fill-sv-orange text-sv-orange" aria-hidden />
                  {aggregate ? aggregate.average.toFixed(1) : building.rating}
                </div>
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

            {score && buildingAvgPerM2 != null && (
              <div className="mt-8 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-[13px] font-black uppercase tracking-wider text-sv-ink/55">
                    კორპუსის ინტელექტი
                  </h2>
                  <span className="text-[11px] font-bold text-sv-ink/40">
                    {score.confidence === 'high'
                      ? 'მაღალი ნდობა'
                      : score.confidence === 'medium'
                        ? 'საშუალო ნდობა'
                        : 'დაბალი ნდობა'}{' '}
                    · {salePerM2.length} განცხადება
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-x-10 gap-y-6">
                  <div className="flex items-center gap-3">
                    <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90" aria-hidden>
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--sv-blue)" strokeOpacity="0.12" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15.5" fill="none"
                        stroke={score.score >= 70 ? 'var(--sv-success)' : score.score >= 50 ? 'var(--sv-blue)' : 'var(--sv-orange)'}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${score.score} 100`}
                      />
                    </svg>
                    <div>
                      <p className="text-[26px] font-black leading-none tracking-[-0.02em] text-sv-ink">
                        {score.score}
                        <span className="text-[14px] font-bold text-sv-ink/40">/100</span>
                      </p>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-sv-ink/45">
                        Building Score
                      </p>
                    </div>
                  </div>

                  <dl className="flex flex-wrap gap-x-8 gap-y-3">
                    <div>
                      <dd className="text-[20px] font-black tracking-[-0.02em] text-sv-ink">
                        ${buildingAvgPerM2.toLocaleString('en-US')}/მ²
                      </dd>
                      <dt className="text-[11px] font-bold uppercase tracking-wide text-sv-ink/45">
                        საშუალო ფასი
                      </dt>
                    </div>
                    {buildingMedianPrice != null && (
                      <div>
                        <dd className="text-[20px] font-black tracking-[-0.02em] text-sv-ink">
                          ${buildingMedianPrice.toLocaleString('en-US')}
                        </dd>
                        <dt className="text-[11px] font-bold uppercase tracking-wide text-sv-ink/45">
                          მედიანური ფასი
                        </dt>
                      </div>
                    )}
                    {buildingScale && (
                      <div>
                        <dd
                          className={`text-[20px] font-black ${
                            buildingScale.band === 'low' || buildingScale.band === 'mediumLow'
                              ? 'text-sv-blue-deep'
                              : buildingScale.band === 'high' || buildingScale.band === 'aboveAverage'
                                ? 'text-sv-orange-deep'
                                : 'text-sv-ink'
                          }`}
                        >
                          {buildingScale.labelKa}
                        </dd>
                        <dt className="text-[11px] font-bold uppercase tracking-wide text-sv-ink/45">
                          რაიონთან შედარებით
                        </dt>
                      </div>
                    )}
                  </dl>

                  <ul className="flex flex-wrap gap-1.5">
                    {score.factors.map((f) => (
                      <li
                        key={f.key}
                        className="rounded-full bg-sv-ink/[0.05] px-2.5 py-1 text-[11px] font-bold text-sv-ink/60"
                      >
                        {FACTOR_LABEL[f.key]} {f.pct}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
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
                {building.units ? ` · ${building.units} ბინა` : ''}
              </span>
              {building.yearBuilt && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-sv-ink/35" aria-hidden /> {building.yearBuilt}
                </span>
              )}
              {building.finish && building.status === 'construction' && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-sv-ink/35" aria-hidden /> ჩაბარება {building.finish}
                </span>
              )}
              {building.priceFromM2 && (
                <span className="font-black text-sv-ink">{building.priceFromM2}/მ²-დან</span>
              )}
            </p>
            {metro && (
              <p className="mt-3 flex items-center gap-2 text-[14px] font-extrabold text-sv-blue">
                <TrainFront className="h-4 w-4 shrink-0" aria-hidden />
                {metro.name} · {formatMetroDist(metro)}
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/map?building=${building.slug}`}
                className="inline-flex min-h-11 items-center rounded-full bg-sv-blue px-5 py-2.5 text-[13px] font-extrabold text-white shadow-glow-blue-sm transition hover:bg-sv-blue-deep"
              >
                რუკაზე ნახვა
              </Link>
              <a
                href={mapsApple}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-full bg-sv-navy px-5 py-2.5 text-[13px] font-extrabold text-white transition hover:bg-sv-navy-soft"
              >
                Apple Maps
              </a>
              <a
                href={mapsGoogle}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-full bg-sv-cloud px-5 py-2.5 text-[13px] font-extrabold text-sv-ink transition hover:bg-sv-ink/5"
              >
                Google Maps
              </a>
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
          <p className="mt-3 max-w-3xl whitespace-pre-line text-[15px] font-semibold leading-relaxed text-sv-ink/70">
            {building.description.ka}
          </p>
          <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['კოდი', building.code],
              ['რაიონი', building.district],
              ...(building.ubani ? [['უბანი', building.ubani] as const] : []),
              ['სართული', String(building.floors)],
              ...(building.units ? [['ბინა', String(building.units)] as const] : []),
              ...(building.yearBuilt ? [['წელი', String(building.yearBuilt)] as const] : []),
              ...(building.buildingNumber !== '—'
                ? [['კორპუსის №', building.buildingNumber] as const]
                : []),
            ].map(([k, v]) => (
              <div key={k} className="rounded-module border border-sv-ink/[0.06] bg-sv-surface px-4 py-3 shadow-card">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-sv-ink/40">{k}</dt>
                <dd className="mt-1 text-[15px] font-extrabold text-sv-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {amenities.length > 0 && (
          <section className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              ირგვლივ
            </h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {amenities.map((a) => {
                const Icon = AMENITY_ICON[a.category]
                return (
                  <li
                    key={a.category}
                    className="flex items-start gap-3 rounded-module border border-sv-ink/[0.06] bg-sv-surface px-4 py-3.5 shadow-card"
                  >
                    <Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: POI_COLORS[a.category] }} aria-hidden />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-sv-ink/40">
                        {POI_LABELS[a.category]}
                      </p>
                      <p className="truncate text-[14px] font-extrabold text-sv-ink">{a.name}</p>
                      <p className="text-[12px] font-bold text-sv-ink/45">{formatMetroDist(a)}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <section className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10">
          <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
            მისამართი და მიმართულება
          </h2>
          <div className="relative mt-6 overflow-hidden rounded-card">
            <MapEmbed
              lat={fpPin?.lat ?? building.coords.lat}
              lng={fpPin?.lng ?? building.coords.lng}
              zoom={fpPin ? 17 : 16}
              q={building.address}
              aspect="16/9"
              highlight
              footprint={fpPin?.ring ?? null}
              className="border-0 shadow-none"
            />
          </div>
          <p className="mt-3 text-[13px] font-semibold text-sv-ink/50">
            {building.address} · {(fpPin?.lat ?? building.coords.lat).toFixed(5)},{' '}
            {(fpPin?.lng ?? building.coords.lng).toFixed(5)}
          </p>
        </section>

        {gallery.length > 0 && (
          <section className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              ფოტოები
            </h2>
            <HScroll aria-label="ფოტოები" step={300} className="mt-6 gap-3 pb-1">
              {gallery.map((src, i) => (
                <div
                  key={src}
                  className="relative h-40 w-56 shrink-0 overflow-hidden rounded-module bg-sv-cloud md:h-52 md:w-72"
                >
                  <Image
                    src={src}
                    alt={`${building.name} — ფოტო ${i + 2}`}
                    fill
                    sizes="288px"
                    className="object-cover"
                  />
                </div>
              ))}
            </HScroll>
          </section>
        )}

        {building.passportUrl && (
          <section className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              გეგმა
            </h2>
            <div className="relative mt-6 aspect-[4/3] max-w-3xl overflow-hidden rounded-card bg-sv-cloud">
              <Image
                src={building.passportUrl}
                alt={`${building.name} — გეგმა`}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-contain"
              />
            </div>
          </section>
        )}

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
                <div className="sv-card-grid-3">
                  {listings.map((l, i) => (
                    <div key={l.id} className="relative" data-card-floor={listingFloor(l.floor, floorCount)}>
                      <span
                        className="absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-extrabold text-white"
                        style={{ background: DEAL_BRAND[l.dealType] }}
                      >
                        {dealLabelKa(l.dealType, l.propType)}
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

        {related.length > 0 && (
          <section className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              იგივე რაიონში
            </h2>
            <div className="mt-6 sv-card-grid-3">
              {related.map((b) => (
                <Link
                  key={b.slug}
                  href={`/buildings/${b.slug}`}
                  className="group overflow-hidden rounded-card border border-sv-ink/[0.06] bg-sv-surface shadow-card transition-all duration-500 hover:-translate-y-1 hover:shadow-card-hover"
                >
                  <div className="relative aspect-[16/10]">
                    <Image src={b.img} alt={b.name} fill sizes="400px" className="object-cover" />
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] font-bold text-sv-ink/40">
                      {[b.district, b.ubani].filter(Boolean).join(' · ')}
                    </p>
                    <h3 className="mt-0.5 text-[16px] font-black text-sv-ink">{b.name}</h3>
                    <p className="mt-1 text-[12px] font-semibold text-sv-ink/50">
                      {b.floors} სართ.{b.units ? ` · ${b.units} ბინა` : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <FaqSection title="ხშირი კითხვები" items={faqs} className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10" />

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(crumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqPageLd(faqs)) }} />
    </div>
  )
}
