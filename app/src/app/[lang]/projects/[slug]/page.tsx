import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { avifCardOf, cardOf } from '@/lib/media'
import { MapPin, CalendarCheck, Building2, BadgeCheck, Star, Phone } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import ListingCard from '@/components/ListingCard'
import HScroll from '@/components/HScroll'
import { AnchorNav } from '@/components/AnchorNav'
import { StickyLeadBar } from '@/components/lead/StickyLeadBar'
import { telHref, waHref } from '@/lib/inquiries/phone'
import { StatsRow } from '@/components/entities/StatsRow'
import { LeadForm } from '@/components/lead/LeadForm'
import ReviewsSectionServer from '@/components/reviews/ReviewsSectionServer'
import { FaqSection } from '@/components/seo/FaqSection'
import { PROJECTS, isDelivered } from '@/data/professionals'
import {
  getLiveProject,
  getLiveDeveloper,
  projectsLive,
  projectsLiveByDeveloper,
  isValidCoords,
} from '@/lib/directory-live'
import { getListingsForProjectSlug } from '@/lib/listings-db'
import { getMapListings } from '@/lib/map/db-buildings'
import {
  clusterListingsToBuildings,
  ensureFootprints,
  footprintPin,
  mergeMapBuildings,
  projectsToConstructionBuildings,
  applyLiveProjectPins,
} from '@/lib/map/buildings'
import { buildingFloors, floorsToGeoJSON } from '@/lib/map/floors'
import { BuildingFloorsMapLazy } from '@/components/map/BuildingFloorsMapLazy'
import MapEmbed from '@/components/MapEmbed'
import { getReviewAggregate } from '@/lib/reviews/aggregate'
import { altName, altNameList } from '@/lib/bilingual'
import { jsonLd, ogImage } from '@/lib/utils'
import {pageAlternates, OG_LOCALE  } from '@/lib/i18n/server'
import { isValidLang, type Lang } from '@/lib/i18n/core'
import {
  MICRO,
  PROJECT_DETAIL,
  dirLoc,
  faqPageLd,
  finishLabel,
  floorsLabel,
  pickLoc,
  projectFaqs,
  unitsLabel,
} from '@/lib/directory-seo'

export const revalidate = 3600

export function generateStaticParams() {
  // Static catalog slugs prerender; korter-only slugs SSR via dynamicParams.
  return PROJECTS.map((p) => ({ lang: 'ka', slug: p.slug }))
}

interface PageProps {
  params: Promise<{ lang: string; slug: string }>
}

function absImg(src: string) {
  return src.startsWith('http') ? src : `https://sivrce.ge${src}`
}

/** "$2,100" | "₾4,224" → 2100 / 4224 — AggregateOffer lowPrice. */
function priceNumber(priceFromM2: string): number | null {
  const n = Number(priceFromM2.replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

/** ponytail: GEL if ₾/GEL marker, EUR if €/EUR (Berlin), else USD — covers catalog + live merge. */
function priceCurrency(priceFromM2: string): 'GEL' | 'EUR' | 'USD' {
  if (/₾|GEL/i.test(priceFromM2)) return 'GEL'
  if (/€|EUR/i.test(priceFromM2)) return 'EUR'
  return 'USD'
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang: raw, slug } = await params
  const lang: Lang = isValidLang(raw) ? raw : 'ka'
  const loc = dirLoc(lang)
  const p = await getLiveProject(slug)
  if (!p) return {}
  const alt = (lang === 'ka' && p.nameKa) || altName(p.name) || ''
  const body = (pickLoc(p.description, loc) || `${p.name}, ${p.location}`).replace(/\s+/g, ' ')
  // Both scripts up front — Google/AI bold whichever the query used.
  const description = ((alt && !body.includes(alt) ? `${p.name} (${alt}). ` : '') + body).slice(0, 155)
  const title = PROJECT_DETAIL[loc].titleOf(p)
  // Georgian transliteration wins on ka (users search "ჩარგლის რეზიდენსი", not the Latin brand).
  const displayName = lang === 'ka' && p.nameKa ? p.nameKa : p.name
  const og = ogImage(p.img)
  return {
    title,
    description,
    alternates: pageAlternates(`/projects/${p.slug}`, lang),
    openGraph: {
      title: displayName,
      description,
      type: 'website',
      url: `https://sivrce.ge/projects/${p.slug}`,
      siteName: 'sivrce',
      locale: OG_LOCALE[lang],
      images: [{ url: og, alt: displayName }],
    },
    twitter: {
      card: 'summary_large_image',
      title: displayName,
      description,
      images: [og],
    },
  }
}

export default async function ProjectPage({ params }: PageProps) {
  const { lang, slug } = await params
  if (!isValidLang(lang)) notFound()
  const loc = dirLoc(lang)
  const c = PROJECT_DETAIL[loc]
  const micro = MICRO[loc]

  const [project, liveProjects] = await Promise.all([getLiveProject(slug), projectsLive()])
  if (!project) notFound()
  // Georgian transliteration wins on ka — matches how users actually search.
  const displayName = lang === 'ka' && project.nameKa ? project.nameKa : project.name

  const [dev, listings, aggregate, siblingProjects, mapListings] = await Promise.all([
    project.developerSlug ? getLiveDeveloper(project.developerSlug) : Promise.resolve(null),
    getListingsForProjectSlug(slug, 6),
    getReviewAggregate('project', slug),
    project.developerSlug
      ? projectsLiveByDeveloper(project.developerSlug).then((ps) =>
          ps.filter((p) => p.slug !== project.slug).slice(0, 4),
        )
      : Promise.resolve([]),
    getMapListings().catch(() => []),
  ])

  // 3D floor stack: live address/coords so the corpus sits on the exact pin.
  await ensureFootprints()
  const cluster = applyLiveProjectPins(
    mergeMapBuildings(
      clusterListingsToBuildings(mapListings),
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
  const currency = priceCurrency(project.priceFromM2)
  const hasGeo = isValidCoords(project.coords.lat, project.coords.lng)
  // Exact-building pin — committed OSM footprint beats street-level geocode drift.
  const fpPin = hasGeo ? footprintPin({ slug: project.slug }, project.coords) : null
  const aboutText =
    pickLoc(project.description, loc) || project.description.ka || project.description.en

  // alternateName: curated ka name or derived translit — the other-script form
  // for entity matching in Google/AI (users search 'არჩი უნივერსი' AND 'Archi Universe').
  const altNames = [
    ...new Set([project.name, project.nameKa ? null : altName(project.name)]),
  ].filter((n): n is string => !!n && n !== displayName)

  const projectLd = {
    '@context': 'https://schema.org',
    '@type': 'ApartmentComplex',
    name: displayName,
    ...(altNames.length > 0 && { alternateName: altNames }),
    description: aboutText,
    url: `https://sivrce.ge/projects/${project.slug}`,
    image: images.map((url, i) => ({
      '@type': 'ImageObject',
      url,
      caption: i === 0 ? project.name : `${project.name} — ${c.renderAlt(i)}`,
    })),
    // ponytail: numberOfAvailableAccommodationUnits = "currently for sale" — only
    // true for projects under construction. Sold-out/completed buildings would
    // mislead Google's schema (policy risk). Use numberOfAccommodationUnits (total built) for those.
    ...(isDelivered(project)
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
        priceCurrency: currency,
        lowPrice,
        unitText: 'SQM',
        availability:
          isDelivered(project)
            ? 'https://schema.org/SoldOut'
            : 'https://schema.org/InStock',
        url: `https://sivrce.ge/projects/${project.slug}`,
      },
    }),
    ...(dev && {
      provider: {
        '@type': 'Organization',
        name: pickLoc(dev.name, loc),
        alternateName: altNameList(pickLoc(dev.name, loc), [dev.name.ka, dev.name.en, dev.name.ru]),
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
      { '@type': 'ListItem', position: 1, name: c.crumbHome, item: 'https://sivrce.ge' },
      { '@type': 'ListItem', position: 2, name: c.crumbProjects, item: 'https://sivrce.ge/projects' },
      {
        '@type': 'ListItem',
        position: 3,
        name: displayName,
        item: `https://sivrce.ge/projects/${project.slug}`,
      },
    ],
  }

  // Visible FAQ + FAQPage JSON-LD come from the same array (stays in sync).
  const faqs = projectFaqs(loc, project, dev)

  // Structured facts (crawlable dl) — only rows the data actually supports.
  const detailRows: { label: string; value: string }[] = [
    ...(project.priceFromM2 ? [{ label: micro.priceFromM2, value: project.priceFromM2 }] : []),
    { label: c.statsBuilt, value: `${project.done}%` },
    { label: micro.handover, value: finishLabel(loc, project.finish) },
    { label: micro.flats, value: unitsLabel(project.flats, loc) },
    ...(project.floors ? [{ label: c.floorsRow, value: floorsLabel(project.floors, loc) }] : []),
    ...(project.cadastral ? [{ label: c.cadastral, value: project.cadastral }] : []),
    { label: c.location, value: `${project.location}, ${project.city}` },
  ]

  const anchors = [
    ...(floorsFc || hasGeo
      ? [{ id: 'location', label: floorsFc && cluster ? c.building3d : c.location }]
      : []),
    { id: 'details', label: c.details },
    ...((project.gallery?.length ?? 0) > 0 ? [{ id: 'gallery', label: c.gallery }] : []),
    ...(project.passportUrl ? [{ id: 'plans', label: c.floorPlan }] : []),
    ...(aboutText ? [{ id: 'about', label: c.aboutProject }] : []),
    ...(listings.length > 0 ? [{ id: 'listings', label: micro.listingsShort }] : []),
    { id: 'faq', label: c.faqChip },
    { id: 'contact', label: c.contact },
  ]

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        {/* Hero */}
        <div className="relative aspect-[16/9] max-h-[520px] w-full overflow-hidden md:aspect-[21/9]">
          {/* ponytail: manual card/master srcset — global Image.unoptimized ships the 2560px master to phones */}
          { }
          <picture className="contents">
            <source type="image/avif" media="(max-width: 800px)" srcSet={avifCardOf(project.img)} />
          <img
            src={project.img}
            srcSet={cardOf(project.img) ? `${cardOf(project.img)} 800w, ${project.img} 2560w` : undefined}
            sizes="100vw"
            alt={project.name}
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover"
          />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-t from-sv-navy/80 via-sv-navy/20 to-transparent" />
          <div aria-hidden className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-sv-navy/55 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1440px] px-5 pb-8 md:px-10">
            <nav aria-label="breadcrumb" className="mb-3 text-[12px] font-semibold text-white/60">
              <Link href="/projects" className="hover:text-white">
                {c.crumbProjects}
              </Link>
              <span aria-hidden className="mx-1.5">
                /
              </span>
              <span className="text-white/85">{displayName}</span>
            </nav>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-[28px] font-black text-white [text-shadow:0_2px_12px_rgba(5,11,38,0.6)] md:text-[40px]">
                  {displayName}
                </h1>
                {(displayName !== project.name || altNames.length > 0) && (
                  <p className="text-[13px] font-bold text-white/60">
                    {displayName !== project.name ? project.name : altNames[0]}
                  </p>
                )}
                {dev && (
                  <Link
                    href={`/developers/${dev.slug}`}
                    className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-[14px] font-bold text-white/85 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <BadgeCheck className="h-4 w-4 text-sv-success" aria-hidden />
                    {pickLoc(dev.name, loc)}
                  </Link>
                )}
              </div>
              {project.rating > 0 && (
                <div className="flex items-center gap-1 rounded-control bg-white/95 px-3.5 py-2 text-[15px] font-black text-sv-ink">
                  <Star className="h-4 w-4 fill-sv-orange text-sv-orange" aria-hidden />
                  {project.rating}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <section className="border-b border-sv-ink/[0.06] bg-sv-cloud">
          <div className="mx-auto max-w-[1440px] px-5 py-8 md:px-10">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="min-w-0 flex-1">
                <StatsRow
                  items={[
                    ...(project.priceFromM2
                      ? [{ label: micro.priceFromM2, value: project.priceFromM2 }]
                      : []),
                    { label: c.statsBuilt, value: `${project.done}%` },
                    { label: micro.handover, value: finishLabel(loc, project.finish) },
                    { label: micro.flats, value: String(project.flats) },
                  ]}
                />
                <div className="mt-6 h-1.5 max-w-xl overflow-hidden rounded-full bg-sv-ink/[0.07]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sv-blue to-sv-violet"
                    style={{ width: `${project.done}%` }}
                  />
                </div>
              </div>
              {dev?.phone && (
                <div className="flex shrink-0 flex-wrap gap-2">
                  <a
                    href={telHref(dev.phone)}
                    aria-label={`${pickLoc(dev.name, loc)} — ${dev.phone}`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-control bg-sv-blue px-5 text-[15px] font-extrabold text-white transition-colors duration-200 hover:bg-sv-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
                  >
                    <Phone className="h-4 w-4" aria-hidden />
                    {dev.phone}
                  </a>
                  <a
                    href={waHref(dev.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`WhatsApp: ${pickLoc(dev.name, loc)}`}
                    className="inline-flex min-h-11 items-center rounded-control border border-sv-blue/25 bg-sv-blue/[0.06] px-5 text-[15px] font-extrabold text-sv-blue-deep transition-colors duration-200 hover:bg-sv-blue/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
                  >
                    WhatsApp
                  </a>
                </div>
              )}
            </div>
            <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-bold text-sv-ink/60">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-sv-ink/35" aria-hidden /> {project.location}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarCheck className="h-4 w-4 text-sv-ink/35" aria-hidden /> {micro.handover}{' '}
                {finishLabel(loc, project.finish)}
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-sv-ink/35" aria-hidden /> {unitsLabel(project.flats, loc)}
              </span>
            </p>
          </div>
        </section>

        <AnchorNav items={anchors} label={c.navLabel} />

        {/* Facts */}
        <section id="details" className="mx-auto max-w-[1440px] scroll-mt-[7.5rem] px-5 py-12 md:px-10">
          <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
            {c.details}
          </h2>
          <dl className="mt-6 grid gap-px overflow-hidden rounded-card border border-sv-ink/[0.06] bg-sv-ink/[0.06] shadow-card sm:grid-cols-2 lg:grid-cols-3">
            {detailRows.map((r) => (
              <div key={r.label} className="bg-sv-surface px-5 py-4">
                <dt className="text-[12px] font-bold uppercase tracking-wide text-sv-ink/60">{r.label}</dt>
                <dd className="mt-1 text-[15px] font-black text-sv-ink">{r.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {floorsFc && cluster ? (
          <section id="location" className="mx-auto max-w-[1440px] scroll-mt-[7.5rem] px-5 py-12 md:px-10">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              {c.building3d}
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
            <p className="mt-3 text-[12px] font-semibold text-sv-ink/60">
              {c.floorsCaption(floorsInfo.length, project.flats, project.done)}
            </p>
          </section>
        ) : hasGeo ? (
          <section id="location" className="mx-auto max-w-[1440px] scroll-mt-[7.5rem] px-5 py-12 md:px-10">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              {c.location}
            </h2>
            <div className="relative mt-6 overflow-hidden rounded-card">
              <MapEmbed
                lat={fpPin?.lat ?? project.coords.lat}
                lng={fpPin?.lng ?? project.coords.lng}
                zoom={fpPin ? 16 : 15}
                q={project.location}
                aspect="16/9"
                highlight
                footprint={fpPin?.ring ?? null}
                className="border-0 shadow-none"
              />
            </div>
            <p className="mt-3 text-[12px] font-semibold text-sv-ink/60">
              {project.location} · {(fpPin?.lat ?? project.coords.lat).toFixed(5)},{' '}
              {(fpPin?.lng ?? project.coords.lng).toFixed(5)}
            </p>
          </section>
        ) : null}

        {(project.gallery?.length ?? 0) > 0 && (
          <section id="gallery" className="mx-auto max-w-[1440px] scroll-mt-[7.5rem] px-5 py-12 md:px-10">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              {c.gallery}
            </h2>
            <HScroll aria-label={c.gallery} step={300} className="mt-6 gap-3 pb-1">
              {project.gallery!.map((src, i) => (
                <div
                  key={src}
                  className="relative h-40 w-56 shrink-0 overflow-hidden rounded-module bg-sv-cloud md:h-52 md:w-72"
                >
                  <Image
                    src={src}
                    alt={`${project.name} — ${c.renderAlt(i + 1)}`}
                    fill
                    sizes="288px"
                    className="object-cover"
                  />
                </div>
              ))}
            </HScroll>
          </section>
        )}

        {project.passportUrl && (
          <section id="plans" className="mx-auto max-w-[1440px] scroll-mt-[7.5rem] px-5 py-12 md:px-10">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              {c.floorPlan}
            </h2>
            <div className="relative mt-6 aspect-[4/3] max-w-3xl overflow-hidden rounded-card bg-sv-cloud">
              <Image
                src={project.passportUrl}
                alt={`${project.name} — ${c.floorPlan}`}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-contain"
              />
            </div>
          </section>
        )}

        {aboutText && (
          <section id="about" className="mx-auto max-w-[1440px] scroll-mt-[7.5rem] px-5 py-12 md:px-10">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              {c.aboutProject}
            </h2>
            <p className="mt-3 max-w-3xl whitespace-pre-line text-[15px] font-semibold leading-relaxed text-sv-ink/70">
              {aboutText}
            </p>
          </section>
        )}

        {siblingProjects.length > 0 && dev && (
          <section className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              {c.otherProjects(pickLoc(dev.name, loc))}
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {siblingProjects.map((p) => (
                <Link
                  key={p.slug}
                  href={`/projects/${p.slug}`}
                  // no aria-label: visible text (name+price) IS the accessible name
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
                    {p.priceFromM2 && (
                      <p className="mt-1 text-[12px] font-bold text-sv-ink/60">
                        {p.priceFromM2}
                        {micro.perM2}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {listings.length > 0 && (
          <section id="listings" className="mx-auto max-w-[1440px] scroll-mt-[7.5rem] px-5 pb-12 md:px-10">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              {micro.listingsIn(project.city)}
            </h2>
            <div className="mt-6 sv-card-grid-3">
              {listings.map((l, i) => (
                <ListingCard key={l.id} l={l} i={i} layout="wide" />
              ))}
            </div>
          </section>
        )}

        <div id="faq" className="scroll-mt-[7.5rem]">
          <FaqSection
            title={c.faqTitle}
            items={faqs}
            className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10"
          />
        </div>

        <section
          id="contact"
          className="mx-auto grid max-w-[1440px] scroll-mt-[7.5rem] gap-10 px-5 pb-16 md:px-10 lg:grid-cols-2"
        >
          <LeadForm targetType="project" targetId={project.slug} recipientName={project.name} />
          <ReviewsSectionServer targetType="project" targetId={project.slug} />
        </section>
        {dev?.phone && (
          <StickyLeadBar targetType="project" targetId={project.slug} phone={dev.phone} recipientName={project.name} />
        )}
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(projectLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqPageLd(faqs)) }} />
    </div>
  )
}
