import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { MapPin, CalendarCheck, Building2, BadgeCheck, Star } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import ListingCard from '@/components/ListingCard'
import { StatsRow } from '@/components/entities/StatsRow'
import { LeadForm } from '@/components/lead/LeadForm'
import { ReviewsSection } from '@/components/reviews/ReviewsSection'
import { PROJECTS, listingsByCity } from '@/data/professionals'
import { LISTINGS } from '@/data/listings'
import {
  getLiveProject,
  getLiveDeveloper,
  projectsLive,
  projectsLiveByDeveloper,
  isValidCoords,
} from '@/lib/directory-live'
import {
  clusterListingsToBuildings,
  mergeMapBuildings,
  projectsToConstructionBuildings,
  applyLiveProjectPins,
} from '@/lib/map/buildings'
import { buildingFloors, floorsToGeoJSON } from '@/lib/map/floors'
import { BuildingFloorsMapLazy } from '@/components/map/BuildingFloorsMapLazy'
import MapEmbed from '@/components/MapEmbed'
import { getReviewAggregate } from '@/lib/reviews/aggregate'
import { jsonLd, ogImage } from '@/lib/utils'
import { langAlternates } from '@/lib/i18n/server'

export const revalidate = 3600

export function generateStaticParams() {
  // Static catalog slugs prerender; korter-only slugs SSR via dynamicParams.
  return PROJECTS.map((p) => ({ lang: 'ka', slug: p.slug }))
}

interface PageProps {
  params: Promise<{ slug: string }>
}

function absImg(src: string) {
  return src.startsWith('http') ? src : `https://sivrce.ge${src}`
}

/** "$2,100" → 2100 — AggregateOffer lowPrice. */
function priceNumber(priceFromM2: string): number | null {
  const n = Number(priceFromM2.replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const p = await getLiveProject(slug)
  if (!p) return {}
  const description = (p.description.ka || `${p.name}, ${p.location}`).replace(/\s+/g, ' ').slice(0, 155)
  const title = `${p.name} — ${p.location}, ფასი ${p.priceFromM2}/მ²-დან`
  const og = ogImage(p.img)
  return {
    title,
    description,
    alternates: { canonical: `/projects/${p.slug}`, languages: langAlternates(`/projects/${p.slug}`) },
    openGraph: {
      title: `${p.name} | sivrce`,
      description,
      type: 'website',
      url: `https://sivrce.ge/projects/${p.slug}`,
      siteName: 'sivrce',
      locale: 'ka_GE',
      images: [{ url: og, alt: p.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${p.name} | sivrce`,
      description,
      images: [og],
    },
  }
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params
  const [project, liveProjects] = await Promise.all([getLiveProject(slug), projectsLive()])
  if (!project) notFound()

  const [dev, listings, aggregate, siblingProjects] = await Promise.all([
    project.developerSlug ? getLiveDeveloper(project.developerSlug) : Promise.resolve(null),
    Promise.resolve(listingsByCity(project.city, 6)),
    getReviewAggregate('project', slug),
    project.developerSlug
      ? projectsLiveByDeveloper(project.developerSlug).then((ps) =>
          ps.filter((p) => p.slug !== project.slug).slice(0, 4),
        )
      : Promise.resolve([]),
  ])

  // 3D floor stack: live address/coords so the corpus sits on the exact pin.
  const cluster = applyLiveProjectPins(
    mergeMapBuildings(
      clusterListingsToBuildings(LISTINGS),
      projectsToConstructionBuildings(liveProjects),
    ),
    liveProjects,
  ).find((b) => b.projectSlug === slug || b.projectSlug === project.slug)
  const floorsFc = cluster ? floorsToGeoJSON(cluster) : null
  const floorsInfo = cluster ? buildingFloors(cluster) : []
  const isGhost = !!cluster && cluster.status === 'construction' && cluster.listings.length === 0

  const heroAbs = absImg(project.img)
  const galleryAbs = (project.gallery ?? []).map(absImg)
  const images = [heroAbs, ...galleryAbs.filter((u) => u !== heroAbs)]
  const lowPrice = priceNumber(project.priceFromM2)
  const hasGeo = isValidCoords(project.coords.lat, project.coords.lng)

  const projectLd = {
    '@context': 'https://schema.org',
    '@type': 'ApartmentComplex',
    name: project.name,
    description: project.description.ka,
    url: `https://sivrce.ge/projects/${project.slug}`,
    image: images.length > 1 ? images : images[0],
    // ponytail: numberOfAvailableAccommodationUnits = "currently for sale" — only
    // true for projects under construction. Sold-out/completed buildings would
    // mislead Google's schema (policy risk). Use numberOfAccommodationUnits (total built) for those.
    ...(project.done >= 100 || project.finish.startsWith('გადაცემულია')
      ? { numberOfAccommodationUnits: project.flats }
      : { numberOfAvailableAccommodationUnits: project.flats }),
    address: {
      '@type': 'PostalAddress',
      streetAddress: project.location,
      addressLocality: project.city,
      addressCountry: 'GE',
    },
    ...(hasGeo && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: project.coords.lat,
        longitude: project.coords.lng,
      },
    }),
    ...(lowPrice && {
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'USD',
        lowPrice,
        unitText: 'SQM',
        availability:
          project.done >= 100
            ? 'https://schema.org/SoldOut'
            : 'https://schema.org/InStock',
        url: `https://sivrce.ge/projects/${project.slug}`,
      },
    }),
    ...(dev && {
      provider: {
        '@type': 'Organization',
        name: dev.name.en,
        url: `https://sivrce.ge/developers/${dev.slug}`,
        ...(dev.website ? { sameAs: [dev.website] } : {}),
      },
    }),
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
      { '@type': 'ListItem', position: 1, name: 'მთავარი', item: 'https://sivrce.ge' },
      { '@type': 'ListItem', position: 2, name: 'პროექტები', item: 'https://sivrce.ge/projects' },
      {
        '@type': 'ListItem',
        position: 3,
        name: project.name,
        item: `https://sivrce.ge/projects/${project.slug}`,
      },
    ],
  }

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `რა ღირს ${project.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: project.priceFromM2
            ? `${project.name}-ში ფასი იწყება ${project.priceFromM2}/მ²-დან. მდებარეობა: ${project.location}.`
            : `${project.name} — ${project.location}. ფასები ხელმისაწვდომია სივრცეზე.`,
        },
      },
      {
        '@type': 'Question',
        name: `როდის ჩაბარდება ${project.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `ჩაბარების ვადა: ${project.finish}. მშენებლობის პროგრესი: ${project.done}%. სულ ${project.flats} ბინა.`,
        },
      },
      ...(dev
        ? [
            {
              '@type': 'Question' as const,
              name: `ვინ აშენებს ${project.name}-ს?`,
              acceptedAnswer: {
                '@type': 'Answer' as const,
                text: `დეველოპერი: ${dev.name.ka}. სრული პროფილი: https://sivrce.ge/developers/${dev.slug}`,
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
        {/* Hero */}
        <div className="relative aspect-[16/9] max-h-[520px] w-full overflow-hidden md:aspect-[21/9]">
          <Image
            src={project.img}
            alt={project.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-sv-navy/80 via-sv-navy/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1440px] px-5 pb-8 md:px-10">
            <nav aria-label="breadcrumb" className="mb-3 text-[12px] font-semibold text-white/60">
              <Link href="/projects" className="hover:text-white">
                პროექტები
              </Link>
              <span aria-hidden className="mx-1.5">
                /
              </span>
              <span className="text-white/85">{project.name}</span>
            </nav>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-[28px] font-black text-white [text-shadow:0_2px_12px_rgba(5,11,38,0.6)] md:text-[40px]">
                  {project.name}
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
                {project.rating}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <section className="border-b border-sv-ink/[0.06] bg-sv-cloud">
          <div className="mx-auto max-w-[1440px] px-5 py-8 md:px-10">
            <StatsRow
              items={[
                { label: 'ფასი /მ²-დან', value: project.priceFromM2 },
                { label: 'აშენებულია', value: `${project.done}%` },
                { label: 'ჩაბარება', value: project.finish },
                { label: 'ბინა', value: String(project.flats) },
              ]}
            />
            <div className="mt-6 h-1.5 max-w-xl overflow-hidden rounded-full bg-sv-ink/[0.07]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sv-blue to-sv-violet"
                style={{ width: `${project.done}%` }}
              />
            </div>
            <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-bold text-sv-ink/55">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-sv-ink/35" aria-hidden /> {project.location}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarCheck className="h-4 w-4 text-sv-ink/35" aria-hidden /> ჩაბარება{' '}
                {project.finish}
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-sv-ink/35" aria-hidden /> {project.flats} ბინა
              </span>
            </p>
          </div>
        </section>

        {floorsFc && cluster ? (
          <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              კორპუსი 3D-ში
            </h2>
            <div className="relative mt-6 h-[300px] overflow-hidden rounded-card bg-sv-navy md:h-[420px]">
              <BuildingFloorsMapLazy
                geojson={floorsFc}
                floors={floorsInfo}
                center={{ lat: cluster.lat, lng: cluster.lng }}
                ghost={isGhost}
                progress={cluster.progress}
                label={project.name}
              />
            </div>
            <p className="mt-3 text-[12px] font-semibold text-sv-ink/45">
              {floorsInfo.length} სართული · {project.flats} ბინა · აშენებულია {project.done}% ·
              მიატრიე მაუსი სართულს
            </p>
          </section>
        ) : hasGeo ? (
          <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              მდებარეობა
            </h2>
            <div className="relative mt-6 overflow-hidden rounded-card">
              <MapEmbed
                lat={project.coords.lat}
                lng={project.coords.lng}
                zoom={15}
                q={project.location}
                aspect="16/9"
                highlight
                className="border-0 shadow-none"
              />
            </div>
            <p className="mt-3 text-[12px] font-semibold text-sv-ink/45">
              {project.location} · {project.coords.lat.toFixed(5)}, {project.coords.lng.toFixed(5)}
            </p>
          </section>
        ) : null}

        {(project.gallery?.length ?? 0) > 0 && (
          <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              გალერეა
            </h2>
            <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
              {project.gallery!.map((src, i) => (
                <div
                  key={src}
                  className="relative h-40 w-56 shrink-0 overflow-hidden rounded-module bg-sv-cloud md:h-52 md:w-72"
                >
                  <Image
                    src={src}
                    alt={`${project.name} — რენდერი ${i + 1}`}
                    fill
                    sizes="288px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {project.passportUrl && (
          <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              სართულის გეგმა
            </h2>
            <div className="relative mt-6 aspect-[4/3] max-w-3xl overflow-hidden rounded-card bg-sv-cloud">
              <Image
                src={project.passportUrl}
                alt={`${project.name} — floor plan`}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-contain"
              />
            </div>
          </section>
        )}

        {project.description.ka && (
          <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              პროექტის შესახებ
            </h2>
            <p className="mt-3 max-w-3xl text-[15px] font-semibold leading-relaxed text-sv-ink/70">
              {project.description.ka}
            </p>
          </section>
        )}

        {siblingProjects.length > 0 && dev && (
          <section className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              სხვა პროექტები — {dev.name.ka}
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {siblingProjects.map((p) => (
                <Link
                  key={p.slug}
                  href={`/projects/${p.slug}`}
                  aria-label={p.name}
                  className="group overflow-hidden rounded-card border border-sv-ink/[0.06] bg-sv-surface shadow-card transition-all duration-500 hover:-translate-y-1.5 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={p.img}
                      alt={p.name}
                      fill
                      sizes="(max-width:640px) 100vw, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-[14px] font-black text-sv-ink">{p.name}</h3>
                    <p className="mt-1 text-[12px] font-bold text-sv-ink/55">{p.priceFromM2}/მ²</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {listings.length > 0 && (
          <section className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              განცხადებები ქ. {project.city}ში
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((l, i) => (
                <ListingCard key={l.id} l={l} i={i} layout="wide" />
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto grid max-w-[1440px] gap-10 px-5 pb-16 md:px-10 lg:grid-cols-2">
          <LeadForm targetType="project" targetId={project.slug} recipientName={project.name} />
          <ReviewsSection targetType="project" targetId={project.slug} />
        </section>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(projectLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqLd) }} />
    </div>
  )
}
