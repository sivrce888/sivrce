import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { formatUSD } from '@/data/listings'
import {
  getListing as getDbListing,
  getSimilarListings,
  getDistrictPeerPerM2,
  getListingOwnerMeta,
  getAllListings,
  getListingPriceEvents,
  getListingViewDays,
} from '@/lib/listings-db'
import { daysSince } from '@/lib/price-scale'
import { scalePeers } from '@/lib/peer-rank'
import { getReviewAggregate } from '@/lib/reviews/aggregate'
import { listingDisplayTitle, listingKeywordIn, listingPath, listingSlug } from '@/lib/listing-slug'
import { listingHubAnchor, listingHubPath, seoLocOf } from '@/lib/seo-pages'
import { isLandLease } from '@/lib/add-listing-fields'
import { getLandInsights } from '@/lib/land'
import { listingPublicId } from '@/lib/listing-public-id'
import { listingVideoObject } from '@/lib/listing-video'
import { jsonLd, ogImages } from '@/lib/utils'
import ListingDetailClient from '@/components/listing/ListingDetailClient'
import { pickAd } from '@/lib/ads-db'
import { nearbyProjectsLive } from '@/lib/directory-live'
import { getServerT, OG_LOCALE } from '@/lib/i18n/server'
import { isValidLang, type Lang } from '@/lib/i18n/core'
import { featureLabel, isFeatureKey } from '@/lib/features'
import { COM_ORIGIN, GE_ORIGIN, listingCanonicalPath, listingOrigin } from '@/lib/markets'
import { georgiaListingAlternates, surfacePathPrefix, type DomainId } from '@/lib/domain-scope'
import { requestDomain, requestHostKind } from '@/lib/request-market'
import { buyerCostBreakdownByCityName } from '@/lib/countries/de'
import { geBuyerCosts } from '@/lib/countries/costs'
import { estimateRent, rentAnchorSource } from '@/lib/rent-anchor'
import { parseDeExpose } from '@/lib/countries/de-expose'

/**
 * Listing alternates are absolute and surface-aware.
 * World listings canonicalize on sivrce.com/en.
 * Georgian listings self-canonicalize on the serving domain and hreflang
 * to the other surface — never a blind .ge ↔ .com canonical.
 */
function listingAlternates(path: string, lang: Lang, country?: string, domain: DomainId = 'ge') {
  const origin = listingOrigin(country)
  if (country && country !== 'GE') {
    const url = `${origin}${listingCanonicalPath(path, country)}`
    return { canonical: url, languages: { en: url, 'x-default': url } as Record<string, string> }
  }
  return georgiaListingAlternates(path, lang, domain)
}

// ponytail: 60s ISR. auth() on this page dynamized every listing view.
export const revalidate = 60
export const maxDuration = 15

// ponytail: dynamicParams default (true) — unknown ids hit notFound() below;
// `false` crashes `next start` (NoFallbackError) on any unknown-id request.
export async function generateStaticParams() {
  // Live ids only — no mock inventory in the static set.
  try {
    const rows = await getAllListings(80)
    return rows.map((l) => ({ lang: 'ka', id: String(listingPublicId(l)), slug: [listingSlug(l)] }))
  } catch {
    return []
  }
}

interface PageProps {
  params: Promise<{ lang?: string; id: string; slug?: string[] }>
}

/* Trim to ~155 chars at a word boundary for meta/OG descriptions */
function metaDescription(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max)
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[.,;:!?…-]+$/, '')}…`
}

/** DB only — mock LISTINGS never surface as live detail pages. Strict: a failed
 *  lookup throws (ISR keeps the last good render, else error.tsx with Retry);
 *  only a real miss becomes notFound(). */
const getListing = (id: string) => getDbListing(id, { strict: true })

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, lang: raw } = await params
  const l = await getListing(id)
  if (!l) return {}
  const lang: Lang = raw && isValidLang(raw) ? raw : 'ka'
  const t = getServerT(lang)
  const per =
    l.dealType === 'rent' && !isLandLease(l.dealType, l.propType) ? t('detail.perMonth')
      : l.dealType === 'daily' ? t('detail.perDay') : ''
  const loc = lang === 'de' ? 'de-DE' : 'en-US'
  const head =
    l.currencyOriginal === 'EUR' && l.priceOriginal
      ? `€${Math.round(l.priceOriginal).toLocaleString(loc)}`
      : formatUSD(l.priceUSD)
  const price = `${head}${per}`
  const keyword = listingKeywordIn(l, lang, t)
  // One lead only — both read "Exclusive · Exclusively on Sivrce" and ate half the
  // SERP title. Sivrce-only is the stronger (unique) claim.
  const exclusiveLead = l.isSivrceExclusive
    ? t('badge.sivrceExclusive')
    : l.isExclusive ? t('badge.exclusive') : ''
  // No brand suffix here — the layout title template appends "| sivrce"
  // (hardcoding it produced "… | Sivrce | sivrce" on every listing SERP).
  const title = `${exclusiveLead ? `${exclusiveLead} · ` : ''}${keyword} — ${price}`
  /* CTR lead: exclusive + keyword sentence + hard stats before the free text */
  const stats = [
    l.area > 0 && `${l.area} ${lang === 'ka' ? 'მ²' : 'm²'}`,
    l.floor > 0 && `${l.floor}/${l.totalFloors} ${t('spec.floor')}`,
  ].filter(Boolean).join(', ')
  const description = metaDescription(`${exclusiveLead ? `${exclusiveLead}. ` : ''}${keyword}. ${stats && `${stats}. `}${price}. ${l.description}`)
  // Local photos have a build-time JPEG derivative (scripts/og-derivatives.mjs);
  // uploaded photos a runtime .og.jpg twin (src/lib/media.ts ogOf), with the
  // original kept as fallback og:image for uploads made before the twin —
  // WhatsApp/Viber/FB crawlers don't render WebP OG tags.
  const firstImg = l.images[0] ?? ''
  const ogList = firstImg ? ogImages(firstImg) : ['/images/og-brand.png']
  const path = listingPath(l)
  const domain = await requestDomain()
  const alts = listingAlternates(path, lang, l.country, domain)
  const canonicalAbs = alts.canonical
  const videoLd = listingVideoObject(l.video, {
    name: keyword,
    description,
    poster: firstImg || '/images/og-brand.png',
    uploadDate: `${l.postedAt}T00:00:00Z`,
  })
  return {
    title,
    description,
    alternates: alts,
    openGraph: {
      title,
      description,
      type: videoLd ? 'video.other' : 'website',
      url: canonicalAbs,
      siteName: 'sivrce',
      locale: OG_LOCALE[lang],
      images: ogList.map((url, i) => (
        i === 0 ? { url, width: 1200, height: 630, alt: title } : { url, alt: title }
      )),
      ...(videoLd && {
        videos: [{
          url: videoLd.contentUrl ?? videoLd.embedUrl ?? l.video!,
          width: 1280,
          height: 720,
        }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogList,
    },
  }
}

export default async function ListingPage({ params }: PageProps) {
  const { id, slug, lang: raw } = await params
  const lang: Lang = raw && isValidLang(raw) ? raw : "ka"
  const listing = await getListing(id)
  if (!listing) notFound()

  // Competitor-style canonical: /listing/{publicId}/{keyword-slug}. getListing
  // accepts both the uuid and the public number, so legacy uuid links and
  // bare /listing/id and wrong/garbage slugs all 301 to it — juice consolidates.
  const canonical = listingPath(listing)
  const world = (listing.country ?? 'GE') !== 'GE'
  // sivrce.ge is Georgian inventory only — a world listing's home is sivrce.com.
  // Dev/preview keep rendering so local global flows still work.
  if (world && (await requestHostKind()) === 'ge') {
    permanentRedirect(`${COM_ORIGIN}${listingCanonicalPath(canonical, listing.country)}`)
  }
  const domain = await requestDomain()
  const absCanonical = listingAlternates(canonical, lang, listing.country, domain).canonical
  const origin = world || domain === 'com' ? COM_ORIGIN : GE_ORIGIN
  const prefix = surfacePathPrefix(domain, world ? 'global' : 'ge')
  if (
    id !== String(listingPublicId(listing)) ||
    slug?.join('/') !== listingSlug(listing)
  ) {
    permanentRedirect(canonical)
  }

  // Profile rating for the contact card — agent/developer profiles only;
  // owner (/u/…) listings have no review target.
  const profileHref = listing.agent.profileHref ?? ''
  const ratingType = profileHref.startsWith('/agents/')
    ? 'agent'
    : profileHref.startsWith('/developers/') ? 'developer' : null

  const [similar, peerPerM2, aggregate, ownerMeta, railAd, priceEvents, land, profileRating, nearbyProjects, viewDays] = await Promise.all([
    getSimilarListings(listing, 8).catch(() => []),
    getDistrictPeerPerM2(listing.city, listing.district, listing.dealType).catch(() => []),
    getReviewAggregate('listing', listing.id).catch(() => null),
    getListingOwnerMeta(listing.id),
    pickAd('listing_rail', { audience: 'guest', lang }),
    getListingPriceEvents(listing.id),
    // Terrain + climate readout — land listings only, never blocks other cards.
    listing.propType === 'land' ? getLandInsights(listing.coords).catch(() => null) : null,
    ratingType ? getReviewAggregate(ratingType, profileHref.split('/')[2]!).catch(() => null) : null,
    nearbyProjectsLive(listing.coords, listing.city, 6, listing.projectSlug).catch(() => []),
    getListingViewDays(listing.id).catch(() => ({ today: 0, yesterday: 0 })),
  ])
  const ownerTier = ownerMeta?.tier ?? 'standard'
  // Whole days since posting — feeds the freshness line (60s ISR stays honest).
  const postedDays = daysSince(listing.postedAt)
  const euroNative = listing.currencyOriginal === 'EUR' && (listing.priceOriginal ?? 0) > 0
  const offerPrice = euroNative ? Math.round(listing.priceOriginal!) : listing.priceUSD
  const offerCurrency = euroNative ? 'EUR' : 'USD'
  const deExpose = listing.country === 'DE'
    ? parseDeExpose(`${listing.description ?? ''} ${listing.features.join(' ')}`)
    : null
  const deCosts =
    listing.country === 'DE' && listing.dealType === 'sale' && (listing.priceOriginal ?? 0) > 0
      ? buyerCostBreakdownByCityName(listing.priceOriginal!, listing.city)
      : null
  const geCosts =
    listing.country === 'GE' && listing.dealType === 'sale'
      ? geBuyerCosts(listing.priceGEL)
      : null

  // Offer validity: 30 days after posting (matches the 30-day listing lifetime)
  const priceValidUntil = new Date(
    Date.parse(`${listing.postedAt}T00:00:00Z`) + 30 * 24 * 60 * 60 * 1000,
  )
    .toISOString()
    .slice(0, 10)

  const t = getServerT(lang)
  // Georgian-authored titles read as the localized keyword on non-ka pages.
  const displayTitle = listingDisplayTitle(listing, lang, t)
  const amenityFeature = listing.features
    .filter((f): f is typeof f => isFeatureKey(f) && f !== 'add.f.onlineView')
    .map((f) => ({
      '@type': 'LocationFeatureSpecification',
      name: featureLabel(f, t),
      value: true,
    }))

  // ponytail: propType → schema.org dwelling type. InStock rich-result prefers
  // an itemOffered dwelling over a bare Offer; the Resident schema family also
  // unlocks the "Bedrooms/Bathrooms" rich snippet in Google's RE vertical.
  const dwellingType =
    listing.propType === 'apartment' ? 'Apartment'
      : listing.propType === 'house' ? 'House'
        : listing.propType === 'commercial' ? 'Place'
          : 'Place'

  const videoLd = listingVideoObject(listing.video, {
    name: displayTitle,
    description: listing.description,
    poster: listing.images[0] ?? listing.img,
    uploadDate: `${listing.postedAt}T00:00:00Z`,
  })

  const listingLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: displayTitle,
    ...(displayTitle !== listing.title && { alternateName: listing.title }),
    description: listing.description,
    url: absCanonical,
    sku: String(listingPublicId(listing)),
    image: listing.images.map((src) => (src.startsWith('http') ? src : `${origin}${src}`)),
    datePosted: listing.postedAt,
    numberOfBedrooms: listing.beds,
    numberOfBathroomsTotal: listing.baths,
    floorLevel: listing.floor,
    address: {
      '@type': 'PostalAddress',
      streetAddress: listing.address,
      addressLocality: listing.city,
      addressRegion: listing.district,
      addressCountry: listing.country ?? 'GE',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: listing.coords.lat,
      longitude: listing.coords.lng,
    },
    offers: {
      '@type': 'Offer',
      price: offerPrice,
      priceCurrency: offerCurrency,
      priceValidUntil,
      availability: 'https://schema.org/InStock',
      itemOffered: {
        '@type': dwellingType,
        name: displayTitle,
        numberOfBedrooms: listing.beds,
        numberOfBathroomsTotal: listing.baths,
        floorSize: { '@type': 'QuantitativeValue', value: listing.area, unitCode: 'MTK' },
        ...(listing.rooms > 0 && { numberOfRooms: listing.rooms }),
        ...(amenityFeature.length > 0 && { amenityFeature }),
      },
      // Phone omitted on purpose — scrapers harvest JSON-LD; reveal is BotID-gated.
      seller: {
        '@type': 'RealEstateAgent',
        name: listing.agent.name,
      },
      ...(listing.dealType === 'rent' && {
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: offerPrice,
          priceCurrency: offerCurrency,
          unitText: isLandLease(listing.dealType, listing.propType) ? 'ANN' : 'MONTH',
        },
      }),
    },
    floorSize: {
      '@type': 'QuantitativeValue',
      value: listing.area,
      unitCode: 'MTK',
    },
    ...(listing.rooms > 0 && { numberOfRooms: listing.rooms }),
    ...((listing.isExclusive || listing.isSivrceExclusive || deExpose?.energyClass || deExpose?.yearBuilt) && {
      additionalProperty: [
        ...(listing.isExclusive ? [{ '@type': 'PropertyValue' as const, name: t('badge.exclusive'), value: true }] : []),
        ...(listing.isSivrceExclusive ? [{ '@type': 'PropertyValue' as const, name: t('badge.sivrceExclusive'), value: true }] : []),
        ...(deExpose?.energyClass
          ? [{ '@type': 'PropertyValue' as const, name: 'Energieausweis', value: deExpose.energyClass }]
          : []),
        ...(deExpose?.yearBuilt
          ? [{ '@type': 'PropertyValue' as const, name: 'Baujahr', value: deExpose.yearBuilt }]
          : []),
      ],
    }),
    // ponytail: no `review` node — the aggregate contract exposes only
    // {average,count}; synthesizing review bodies would fabricate content.
    ...(aggregate && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: aggregate.average,
        reviewCount: aggregate.count,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    ...(videoLd && { video: videoLd }),
    inLanguage: lang,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '.speakable-lead'],
    },
  }

  const hubPath = listingHubPath(listing)
  const hubAnchor = hubPath ? listingHubAnchor(listing, seoLocOf(lang)) : null
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    // Middle crumb points at the indexable programmatic hub, not noindex /search.
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('detail.home'), item: prefix ? `${origin}${prefix}` : origin },
      ...(hubPath && hubAnchor
        ? [{ '@type': 'ListItem', position: 2, name: hubAnchor, item: `${origin}${prefix}${listingCanonicalPath(hubPath, listing.country)}` }]
        : []),
      {
        '@type': 'ListItem',
        position: hubPath ? 3 : 2,
        name: displayTitle,
        item: absCanonical,
      },
    ],
  }

  return (
    <>
      <ListingDetailClient
        listing={listing}
        similar={similar}
        peerPerM2={scalePeers(similar, peerPerM2)}
        ownerId={ownerMeta?.ownerId ?? null}
        ownerTier={ownerTier}
        railAd={railAd}
        priceEvents={priceEvents}
        viewDays={viewDays}
        postedDays={postedDays}
        land={land}
        profileRating={profileRating}
        nearbyProjects={nearbyProjects}
        hubLink={hubPath && hubAnchor ? { href: hubPath, anchor: hubAnchor } : null}
        deCosts={deCosts}
        geCosts={geCosts}
        rentEstimate={estimateRent(listing.area, listing.country, listing.city, listing.district)}
        rentSource={rentAnchorSource(listing.country, listing.city, listing.district)}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(listingLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbLd) }}
      />
    </>
  )
}
