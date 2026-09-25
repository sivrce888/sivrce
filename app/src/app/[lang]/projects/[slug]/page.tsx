import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { avifCardOf, cardOf } from '@/lib/media'
import { MapPin, BadgeCheck, Star, Phone, PhoneCall, Landmark, ArrowUpRight, Images, PlayCircle, Calculator } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import ListingCard from '@/components/ListingCard'
import { AnchorNav } from '@/components/AnchorNav'
import { StickyLeadBar } from '@/components/lead/StickyLeadBar'
import { PlaceContext } from '@/components/entities/PlaceContext'
import { placeLabels } from '@/lib/place-context'
import { telHref, waHref } from '@/lib/inquiries/phone'
import { SourcesSection } from '@/components/entities/SourcesSection'
import { getEntityProfile } from '@/lib/intel/store'
import { sourcesHeading, toPublicFacts } from '@/lib/intel/public-facts'
import { LeadForm } from '@/components/lead/LeadForm'
import { ProjectChatButton } from '@/components/chat/ProjectChatButton'
import ReviewsSectionServer from '@/components/reviews/ReviewsSectionServer'
import { FaqSection } from '@/components/seo/FaqSection'
import { ProjectMediaGallery } from '@/components/entities/ProjectMediaGallery'
import { ProjectMarket } from '@/components/entities/ProjectMarket'
import { ReportInaccuracy } from '@/components/entities/ReportInaccuracy'
import { DeveloperLogo } from '@/components/entities/DeveloperLogo'
import { TBILISI_DISTRICT_LABELS } from '@/data/district-labels'
import { marketPosition, priceM2Currency, priceM2Number, trackRecord } from '@/lib/project-insights'
import { PROJECT_PAGE } from '@/lib/project-page-copy'
import { PROJECTS, isDelivered } from '@/data/professionals'
import {
  getLiveProject,
  getLiveDeveloper,
  developersLive,
  nearbyProjectsLive,
  projectsLive,
  projectsLiveByDeveloper,
  isValidCoords,
} from '@/lib/directory-live'
import { getListingsForProjectSlug } from '@/lib/listings-db'
import { ensureFootprints, footprintPin } from '@/lib/map/buildings'
import { projectCluster } from '@/lib/map/project-cluster-index'
import { buildingFloors, floorsToGeoJSON } from '@/lib/map/floors'
import { BuildingFloorsMapLazy } from '@/components/map/BuildingFloorsMapLazy'
import MapEmbed from '@/components/MapEmbed'
import { getReviewAggregate } from '@/lib/reviews/aggregate'
import { altName, altNameList } from '@/lib/bilingual'
import { jsonLd, ogImage } from '@/lib/utils'
import {pageAlternates, OG_LOCALE  } from '@/lib/i18n/server'
import { DE_CITIES } from '@/lib/countries/de'
import { aeEmirateByKa } from '@/lib/countries/ae'
import { isValidLang, type Lang } from '@/lib/i18n/core'
import { cityByName } from '@/lib/map/user-place'
import {
  MICRO,
  MICRO_DE,
  PROJECT_DETAIL,
  PROJECT_DETAIL_DE,
  dirLoc,
  faqPageLd,
  cityName,
  finishLabel,
  floorsLabel,
  hasPriceFrom,
  pickLoc,
  priceFromLabel,
  projectFaqs,
  unitsLabel,
} from '@/lib/directory-seo'

export const revalidate = 3600

export function generateStaticParams() {
  // Static catalog slugs prerender; korter-only slugs SSR via dynamicParams.
  return PROJECTS.map((p) => ({ lang: 'ka', slug: p.slug }))
}

interface PageProps {
  params: Promise<{ lang: string; slug: string; market?: 'de' | 'ae' }>
}

function kaAltName(p: { name: string; nameKa?: string; city: string }, lang: string): string {
  if (lang !== 'ka' && cityByName(p.city)?.cc !== 'GE') return ''
  return p.nameKa || altName(p.name)
}

/** Portal source links name the portal — only developer/official pages are "official". */
function sourceLabel(url: string, lang: string, isDe: boolean): string {
  try {
    const h = new URL(url).host
    const portal = h.endsWith('korter.ge') ? 'Korter' : h.endsWith('myhome.ge') ? 'MyHome' : h.endsWith('ss.ge') ? 'SS.ge' : undefined
    if (portal) return lang === 'ka' ? `წყარო: ${portal}` : lang === 'ru' ? `Источник: ${portal}` : `Source: ${portal}`
  } catch { /* not a URL — treat as official */ }
  return isDe ? 'Offizielle Quelle' : 'Official source'
}

function absImg(src: string, com = false) {
  return src.startsWith('http') ? src : com ? `https://sivrce.com${src}` : `https://sivrce.ge${src}`
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang: raw, slug, market } = await params
  const lang: Lang = isValidLang(raw) ? raw : 'ka'
  const loc = dirLoc(lang)
  const p = await getLiveProject(slug)
  if (!p) return {}
  const alt = (lang === 'ka' && p.nameKa) || kaAltName(p, lang)
  const body = (pickLoc(p.description, lang === 'de' ? 'de' : loc) || `${p.name}, ${p.location}`).replace(/\s+/g, ' ')
  // Both scripts up front — Google/AI bold whichever the query used.
  const description = ((alt && !body.includes(alt) ? `${p.name} (${alt}). ` : '') + body).slice(0, 155)
  const title = (lang === 'de' ? PROJECT_DETAIL_DE : PROJECT_DETAIL[loc]).titleOf(p)
  // Georgian transliteration wins on ka (users search "ჩარგლის რეზიდენსი", not the Latin brand).
  const displayName = lang === 'ka' && p.nameKa ? p.nameKa : p.name
  const og = ogImage(p.img)
  // DE/AE-market delegation (sivrce.com/{cc}/projects/*): canonical/OG stay on
  // the market host — a sivrce.ge canonical would 308 and drop the URL from index.
  if (market === 'de' || market === 'ae') {
    const url = `https://sivrce.com/${market}/projects/${p.slug}`
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title: displayName,
        description,
        type: 'website',
        url,
        siteName: 'sivrce',
        locale: OG_LOCALE[lang],
        images: [{ url: og, alt: displayName }],
      },
      twitter: {
        card: 'summary_large_image' as const,
        title: displayName,
        description,
        images: [og],
      },
    }
  }
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
  const { lang, slug, market } = await params
  if (!isValidLang(lang)) notFound()
  const com = market === 'de' || market === 'ae'
  const isDe = lang === 'de'
  const loc = dirLoc(lang)
  const c = isDe ? PROJECT_DETAIL_DE : PROJECT_DETAIL[loc]
  const micro = isDe ? MICRO_DE : MICRO[loc]
  const chromeLoc = isDe ? 'de' : loc

  const project = await getLiveProject(slug)
  if (!project) notFound()
  // Georgian transliteration wins on ka — matches how users actually search.
  const displayName = lang === 'ka' && project.nameKa ? project.nameKa : project.name

  const hasGeo = isValidCoords(project.coords.lat, project.coords.lng)
  const [dev, listings, aggregate, allProjects, devProjects, intel, nearby, devs] = await Promise.all([
    project.developerSlug ? getLiveDeveloper(project.developerSlug) : Promise.resolve(null),
    getListingsForProjectSlug(slug, 6),
    getReviewAggregate('project', slug),
    projectsLive(),
    project.developerSlug ? projectsLiveByDeveloper(project.developerSlug) : Promise.resolve([]),
    // Provenance is additive: a dossier miss must never 500 the project page.
    getEntityProfile('project', slug).catch(() => null),
    hasGeo ? nearbyProjectsLive(project.coords, project.city, 6, project.slug) : Promise.resolve([]),
    developersLive(),
  ])
  const siblingProjects = devProjects.filter((p) => p.slug !== project.slug).slice(0, 4)
  const track = trackRecord(devProjects)
  const t = PROJECT_PAGE[chromeLoc]
  const delivered = isDelivered(project)
  // Only a verified developer line rings here — never the site switchboard;
  // numberless developers convert via the #contact lead form instead.
  const phoneNum = dev?.phone
  const marketIso = cityByName(project.city)?.cc
  const showMortgage = !com && marketIso === 'GE'
  const devNames = new Map(devs.map((d) => [d.slug, pickLoc(d.name, loc)]))
  // Percentile among same-city, same-currency priced projects (district when dense enough).
  const position = marketPosition(project, allProjects)
  const scopeName =
    position?.scope === 'district' && project.district
      ? loc === 'ka'
        ? project.district
        : (TBILISI_DISTRICT_LABELS.find((d) => d.name.ka === project.district)?.name.en ?? project.district)
      : cityName(project.city, chromeLoc)
  const factRows = intel ? toPublicFacts(intel.facts, lang) : []
  const sourcesCopy = sourcesHeading(lang)

  // 3D floor stack: live address/coords so the corpus sits on the exact pin.
  // Shared index — rebuilding every cluster per page was O(listings × projects)
  // ~840 times per build and blew Next's 180s page budget on world projects.
  await ensureFootprints()
  const cluster = await projectCluster(slug, project.slug)
  const floorsFc = cluster ? floorsToGeoJSON(cluster) : null
  const floorsInfo = cluster ? buildingFloors(cluster) : []
  const isGhost = !!cluster && cluster.status === 'construction' && cluster.listings.length === 0

  const heroAbs = absImg(project.img, com)
  const galleryAbs = (project.gallery ?? []).map((g) => absImg(g, com))
  const images = [heroAbs, ...galleryAbs.filter((u) => u !== heroAbs)]
  // ponytail: credits keyed by raw gallery value; absolutize once for the JSON-LD lookup.
  const creditByAbs = new Map(
    (project.gallery ?? []).flatMap((g) => {
      const c = project.galleryCredits?.[g]
      return c ? [[absImg(g, com), c] as const] : []
    }),
  )
  const lowPrice = priceM2Number(project.priceFromM2)
  const currency = priceM2Currency(project.priceFromM2)
  // Exact-building pin — committed OSM footprint beats street-level geocode drift.
  const fpPin = hasGeo ? footprintPin({ slug: project.slug }, project.coords) : null
  const aboutText =
    pickLoc(project.description, chromeLoc) || project.description.ka || project.description.en

  // alternateName: curated ka name or derived translit — the other-script form
  // for entity matching in Google/AI (users search 'არჩი უნივერსი' AND 'Archi Universe').
  const altNames = [...new Set([project.name, kaAltName(project, lang)])].filter(
    (n): n is string => !!n && n !== displayName,
  )

  // Market-scoped entity URLs: DE/AE copies live on sivrce.com/{cc}, catalog ka
  // city names map to their Latin form for the .com audience.
  const ldOrigin = com ? 'https://sivrce.com' : 'https://sivrce.ge'
  const ldPath = com && market ? `/${market}/projects/${project.slug}` : `/projects/${project.slug}`
  const deCity = DE_CITIES.find((c) => c.ka === project.city)
  const aeCity = aeEmirateByKa(project.city)
  const locality = market === 'de' && deCity ? deCity.de : market === 'ae' && aeCity ? aeCity.en : project.city
  const addressCountry = market === 'de' ? 'DE' : market === 'ae' ? 'AE' : 'GE'

  const projectLd = {
    '@context': 'https://schema.org',
    '@type': 'ApartmentComplex',
    name: displayName,
    ...(altNames.length > 0 && { alternateName: altNames }),
    description: aboutText,
    url: `${ldOrigin}${ldPath}`,
    image: images.map((url, i) => ({
      '@type': 'ImageObject',
      url,
      caption: i === 0 ? project.name : `${project.name} — ${c.renderAlt(i)}`,
      ...(creditByAbs.get(url)?.author ? { author: creditByAbs.get(url)!.author } : {}),
      ...(creditByAbs.get(url) ? { license: creditByAbs.get(url)!.page } : {}),
    })),
    // ponytail: numberOfAvailableAccommodationUnits = "currently for sale" — only
    // true for projects under construction. Sold-out/completed buildings would
    // mislead Google's schema (policy risk). Use numberOfAccommodationUnits (total built) for those.
    ...(project.flats > 0 && isDelivered(project)
      ? { numberOfAccommodationUnits: project.flats }
      : project.flats > 0
        ? { numberOfAvailableAccommodationUnits: project.flats }
        : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: project.location,
      addressLocality: locality,
      addressCountry,
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
          delivered
            ? 'https://schema.org/SoldOut'
            : 'https://schema.org/InStock',
        url: `${ldOrigin}${ldPath}`,
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
      { '@type': 'ListItem', position: 1, name: c.crumbHome, item: com && market ? `https://sivrce.com/${market}` : 'https://sivrce.ge' },
      { '@type': 'ListItem', position: 2, name: c.crumbProjects, item: com && market ? `https://sivrce.com/${market}#new-builds` : 'https://sivrce.ge/projects' },
      {
        '@type': 'ListItem',
        position: 3,
        name: displayName,
        item: `${ldOrigin}${ldPath}`,
      },
    ],
  }

  // Visible FAQ + FAQPage JSON-LD come from the same array (stays in sync).
  const faqs = projectFaqs(loc, project, dev)

  // Structured facts (crawlable dl) — only rows the data actually supports.
  const detailRows: { label: string; value: string }[] = [
    ...(project.priceFromM2
      ? [{ label: micro.priceFromM2, value: priceFromLabel(project.priceFromM2, chromeLoc) }]
      : []),
    { label: c.statsBuilt, value: `${project.done}%` },
    { label: micro.handover, value: finishLabel(chromeLoc, project.finish) },
    { label: micro.flats, value: unitsLabel(project.flats, chromeLoc) },
    ...(project.floors ? [{ label: c.floorsRow, value: floorsLabel(project.floors, chromeLoc) }] : []),
    ...(project.cadastral ? [{ label: c.cadastral, value: project.cadastral }] : []),
    { label: c.location, value: project.location.includes(locality) ? project.location : `${project.location}, ${locality}` },
  ]

  const anchors = [
    { id: 'details', label: c.details },
    ...(position || nearby.length > 0 ? [{ id: 'market', label: t.marketTitle }] : []),
    ...(floorsFc || hasGeo
      ? [{ id: 'location', label: floorsFc && cluster ? c.building3d : c.location }]
      : []),
    ...(floorsFc || hasGeo ? [{ id: 'area', label: placeLabels(chromeLoc).area }] : []),
    { id: 'gallery', label: c.gallery },
    ...(aboutText ? [{ id: 'about', label: c.aboutProject }] : []),
    ...(listings.length > 0 ? [{ id: 'listings', label: micro.listingsShort }] : []),
    ...(factRows.length > 0 ? [{ id: 'sources', label: sourcesCopy.title }] : []),
    { id: 'faq', label: c.faqChip },
    { id: 'contact', label: c.contact },
  ]

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar marketIso={marketIso} />
      <main id="main">
        {/* Hero — media + decision panel: price, status, developer and the call-to-action above the fold */}
        <section aria-labelledby="project-title" className="mx-auto max-w-[1440px] px-5 pb-8 pt-[84px] md:px-10 md:pt-[92px]">
          <nav aria-label="breadcrumb" className="mb-4 text-[12px] font-semibold text-sv-ink/60">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href={com && market ? `/${market}` : '/'} className="hover:text-sv-ink">
                  {c.crumbHome}
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link href={com && market ? `/${market}#new-builds` : '/projects'} className="hover:text-sv-ink">
                  {c.crumbProjects}
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li aria-current="page" className="text-sv-ink/85">
                {displayName}
              </li>
            </ol>
          </nav>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(360px,1fr)]">
            <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-sv-navy sm:aspect-[16/10] lg:aspect-auto lg:min-h-[500px]">
              {/* ponytail: manual card/master srcset — global Image.unoptimized ships the 2560px master to phones */}
              <picture className="contents">
                {avifCardOf(project.img) ? (
                  <source type="image/avif" media="(max-width: 800px)" srcSet={avifCardOf(project.img)} />
                ) : null}
                <img
                  src={project.img}
                  srcSet={cardOf(project.img) ? `${cardOf(project.img)} 800w, ${project.img} 2560w` : undefined}
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  alt={displayName}
                  fetchPriority="high"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </picture>
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-sv-navy/60 to-transparent" />
              <span className="absolute left-4 top-4 rounded-full bg-sv-surface/95 px-3 py-1 text-[12px] font-extrabold text-sv-ink shadow-card">
                {delivered ? t.completed : `${t.building} · ${micro.builtPct(project.done)}`}
              </span>
              <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                <a
                  href="#gallery"
                  className="inline-flex min-h-11 items-center gap-2 rounded-control bg-sv-navy/55 px-4 text-[13px] font-extrabold text-white backdrop-blur transition-colors hover:bg-sv-navy/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <Images className="h-4 w-4" aria-hidden />
                  {t.photos(images.length)}
                </a>
                {project.videoUrl && (
                  <a
                    href="#gallery"
                    className="inline-flex min-h-11 items-center gap-2 rounded-control bg-sv-navy/55 px-4 text-[13px] font-extrabold text-white backdrop-blur transition-colors hover:bg-sv-navy/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <PlayCircle className="h-4 w-4" aria-hidden />
                    {t.video}
                  </a>
                )}
              </div>
            </div>

            <div className="flex flex-col rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-7">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 id="project-title" className="text-[26px] font-black leading-tight tracking-[-0.02em] text-sv-ink md:text-[32px]">
                    {displayName}
                  </h1>
                  {(displayName !== project.name || altNames.length > 0) && (
                    <p className="mt-0.5 text-[13px] font-bold text-sv-ink/60">
                      {displayName !== project.name ? project.name : altNames[0]}
                    </p>
                  )}
                </div>
                {/* Real reviews only — the catalog's seed `rating` has no source. */}
                {aggregate && (
                  <a
                    href="#contact"
                    className="inline-flex shrink-0 items-center gap-1 rounded-control bg-sv-cloud px-3 py-1.5 text-[14px] font-black text-sv-ink"
                  >
                    <Star className="h-4 w-4 fill-sv-orange text-sv-orange" aria-hidden />
                    {aggregate.average.toFixed(1)}
                    <span className="text-[12px] font-bold text-sv-ink/60">({aggregate.count})</span>
                  </a>
                )}
              </div>
              <a
                href="#location"
                className="mt-2 inline-flex items-start gap-1.5 text-[14px] font-bold text-sv-ink/70 transition-colors hover:text-sv-ink"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sv-ink/40" aria-hidden />
                {project.location}
              </a>

              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-y border-sv-ink/[0.06] py-5">
                <div className="col-span-2">
                  <dt className="text-[12px] font-bold uppercase tracking-wide text-sv-ink/60">{micro.priceFromM2}</dt>
                  <dd className="mt-0.5 text-[28px] font-black tracking-[-0.02em] text-sv-ink">
                    {priceFromLabel(project.priceFromM2, chromeLoc) || '—'}
                  </dd>
                  {position && (
                    <dd className="mt-1.5">
                      <a
                        href="#market"
                        className="inline-flex rounded-full bg-sv-blue/[0.08] px-3 py-1 text-[12px] font-extrabold text-sv-blue-deep transition-colors hover:bg-sv-blue/[0.14]"
                      >
                        {t.marketChip(position.deltaPct, scopeName)}
                      </a>
                    </dd>
                  )}
                </div>
                <div>
                  <dt className="text-[12px] font-bold uppercase tracking-wide text-sv-ink/60">{micro.handover}</dt>
                  <dd className="mt-0.5 text-[16px] font-black text-sv-ink">{finishLabel(chromeLoc, project.finish) || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[12px] font-bold uppercase tracking-wide text-sv-ink/60">{micro.flats}</dt>
                  <dd className="mt-0.5 text-[16px] font-black text-sv-ink">
                    {unitsLabel(project.flats, chromeLoc)}
                    {project.floors ? <span className="block text-[13px] font-bold text-sv-ink/60">{floorsLabel(project.floors, chromeLoc)}</span> : null}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="flex justify-between text-[12px] font-bold uppercase tracking-wide text-sv-ink/60">
                    {c.statsBuilt}
                    <span className="text-sv-ink">{project.done}%</span>
                  </dt>
                  <dd className="mt-2 h-1.5 overflow-hidden rounded-full bg-sv-ink/[0.07]">
                    <div className="h-full rounded-full bg-gradient-to-r from-sv-blue to-sv-violet" style={{ width: `${project.done}%` }} />
                  </dd>
                </div>
              </dl>

              {dev && (
                <Link
                  href={`/developers/${dev.slug}`}
                  className="-mx-2 mt-4 flex items-center gap-3 rounded-module p-2 transition-colors hover:bg-sv-cloud focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
                >
                  <DeveloperLogo slug={dev.slug} name={dev.name} logoUrl={dev.logoUrl} size="sm" />
                  <span className="min-w-0">
                    <span className="block text-[11px] font-bold uppercase tracking-wide text-sv-ink/60">{t.developer}</span>
                    <span className="flex items-center gap-1 text-[15px] font-black text-sv-ink">
                      <span className="truncate">{pickLoc(dev.name, loc)}</span>
                      {dev.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-sv-blue" aria-hidden />}
                    </span>
                    {track.total > 0 && (
                      <span className="block text-[12px] font-semibold text-sv-ink/60">{t.devRecord(track.total, track.delivered)}</span>
                    )}
                  </span>
                </Link>
              )}

              <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
                <a
                  href="#contact"
                  className="col-span-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-sv-orange px-5 text-[15px] font-extrabold text-sv-ink transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow-orange-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
                >
                  <PhoneCall className="h-4 w-4" aria-hidden />
                  {t.requestCall}
                </a>
                {phoneNum && (
                  <>
                    <a
                      href={telHref(phoneNum)}
                      aria-label={`${displayName} — ${phoneNum}`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-sv-blue px-3 text-[14px] font-extrabold text-white transition-colors duration-200 hover:bg-sv-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
                    >
                      <Phone className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="truncate">{phoneNum}</span>
                    </a>
                    <a
                      href={waHref(phoneNum)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`WhatsApp: ${displayName}`}
                      className="inline-flex min-h-11 items-center justify-center rounded-control border border-sv-blue/25 bg-sv-blue/[0.06] px-3 text-[14px] font-extrabold text-sv-blue-deep transition-colors duration-200 hover:bg-sv-blue/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
                    >
                      WhatsApp
                    </a>
                  </>
                )}
              </div>
              {(showMortgage || project.sourceUrl) && (
              <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] font-bold text-sv-ink/60">
                {showMortgage && (
                  <Link href="/mortgage-calculator" className="inline-flex min-h-8 items-center gap-1 text-sv-blue-deep hover:underline">
                    <Calculator className="h-3.5 w-3.5" aria-hidden />
                    {t.mortgage}
                  </Link>
                )}
                {project.sourceUrl && (
                  <a
                    href={project.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-8 items-center gap-1 hover:text-sv-ink"
                  >
                    <Landmark className="h-3.5 w-3.5" aria-hidden />
                    {sourceLabel(project.sourceUrl, lang, isDe)}
                    <ArrowUpRight className="h-3 w-3" aria-hidden />
                  </a>
                )}
              </p>
              )}
            </div>
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

        <ProjectMarket
          project={project}
          position={position}
          scopeName={scopeName}
          nearby={nearby}
          devNames={devNames}
          t={t}
          loc={chromeLoc}
        />

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

        {(floorsFc || hasGeo) && (
          <PlaceContext
            loc={loc}
            lang={lang}
            cityKa={project.city}
            district={project.district}
            location={project.location}
            coords={hasGeo ? project.coords : null}
            photoAlt={displayName}
          />
        )}

        <ProjectMediaGallery
          projectName={displayName}
          developerName={dev ? pickLoc(dev.name, loc) : undefined}
          heroImage={project.img}
          gallery={project.gallery}
          galleryCredits={project.galleryCredits}
          passportUrl={project.passportUrl}
          videoUrl={project.videoUrl}
          virtualTourUrl={project.virtualTourUrl}
          lang={chromeLoc}
        />

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
                        {priceFromLabel(p.priceFromM2, chromeLoc)}
                        {hasPriceFrom(p.priceFromM2) && micro.perM2}
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
              {micro.listingsIn(locality)}
            </h2>
            <div className="mt-6 sv-card-grid-3">
              {listings.map((l, i) => (
                <ListingCard key={l.id} l={l} i={i} layout="wide" />
              ))}
            </div>
          </section>
        )}

        <SourcesSection
          title={sourcesCopy.title}
          note={sourcesCopy.note}
          rows={factRows}
          altLabel={isDe ? 'Auch gemeldet:' : 'Also reported:'}
          className="mx-auto max-w-[1440px] scroll-mt-[7.5rem] px-5 pb-12 md:px-10"
          id="sources"
        />

        <div className="mx-auto max-w-[1440px] px-5 pb-10 md:px-10">
          <ReportInaccuracy kind="project" slug={project.slug} t={t.report} />
        </div>

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
          <div>
            <ProjectChatButton projectSlug={project.slug} label={c.chatWithDev} />
            <div className="mt-4">
              <LeadForm targetType="project" targetId={project.slug} recipientName={project.name} />
            </div>
          </div>
          <ReviewsSectionServer targetType="project" targetId={project.slug} />
        </section>
        <StickyLeadBar targetType="project" targetId={project.slug} phone={dev?.phone} recipientName={project.name} />
      </main>
      <Footer marketIso={marketIso} marketCity={cityByName(project.city)?.en} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(projectLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqPageLd(faqs)) }} />
    </div>
  )
}
