import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { formatUSD } from '@/data/listings'
import {
  getListing as getDbListing,
  getSimilarListings,
  getDistrictPeerPerM2,
  getListingOwnerMeta,
  getAllListings,
} from '@/lib/listings-db'
import { getReviewAggregate } from '@/lib/reviews/aggregate'
import { listingKeyword, listingPath, listingSlug } from '@/lib/listing-slug'
import { isLandLease } from '@/lib/add-listing-fields'
import { listingPublicId } from '@/lib/listing-public-id'
import { listingVideoObject } from '@/lib/listing-video'
import { jsonLd, ogImage } from '@/lib/utils'
import ListingDetailClient from '@/components/listing/ListingDetailClient'
import { pickAd } from '@/lib/ads-db'
import { getServerT, langAlternates, OG_LOCALE } from '@/lib/i18n/server'
import { isValidLang, type Lang } from '@/lib/i18n/core'
import { featureLabel, isFeatureKey } from '@/lib/features'

// ponytail: 60s ISR. auth() on this page dynamized every listing view.
export const revalidate = 60
export const maxDuration = 15

// ponytail: dynamicParams default (true) — unknown ids hit notFound() below;
// `false` crashes `next start` (NoFallbackError) on any unknown-id request.
export async function generateStaticParams() {
  // Live ids only — no mock inventory in the static set.
  try {
    const rows = await getAllListings(80)
    return rows.map((l) => ({ lang: 'ka', id: l.id, slug: [listingSlug(l)] }))
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

/** DB only — mock LISTINGS never surface as live detail pages. */
async function getListing(id: string) {
  try {
    return await getDbListing(id)
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, lang: raw } = await params
  const l = await getListing(id)
  if (!l) return {}
  const lang: Lang = raw && isValidLang(raw) ? raw : 'ka'
  const t = getServerT(lang)
  const price =
    l.dealType === 'rent' && !isLandLease(l.dealType, l.propType) ? `${formatUSD(l.priceUSD)}/თვე`
      : l.dealType === 'daily' ? `${formatUSD(l.priceUSD)}/დღე`
        : formatUSD(l.priceUSD)
  const keyword = listingKeyword(l)
  const exclusiveLead = [
    l.isExclusive && t('badge.exclusive'),
    l.isSivrceExclusive && t('badge.sivrceExclusive'),
  ].filter(Boolean).join(' · ')
  const title = `${exclusiveLead ? `${exclusiveLead} · ` : ''}${keyword} — ${price} | Sivrce`
  /* CTR lead: exclusive + keyword sentence + hard stats before the free text */
  const stats = [
    l.area > 0 && `${l.area} მ²`,
    l.floor > 0 && `${l.floor}/${l.totalFloors} სართული`,
  ].filter(Boolean).join(', ')
  const description = metaDescription(`${exclusiveLead ? `${exclusiveLead}. ` : ''}${keyword}. ${stats && `${stats}. `}${price}. ${l.description}`)
  // Local photos have a build-time JPEG derivative (scripts/og-derivatives.mjs)
  // because WhatsApp/Viber/FB crawlers don't render WebP OG tags. Uploaded
  // (https) photos are served as-is; brand card is the last resort.
  const firstImg = l.images[0] ?? ''
  const og = firstImg ? ogImage(firstImg) : '/images/og-brand.png'
  const path = listingPath(l)
  const videoLd = listingVideoObject(l.video, {
    name: keyword,
    description,
    poster: firstImg || '/images/og-brand.png',
    uploadDate: `${l.postedAt}T00:00:00Z`,
  })
  return {
    title,
    description,
    alternates: { canonical: path, languages: langAlternates(path) },
    openGraph: {
      title,
      description,
      type: videoLd ? 'video.other' : 'website',
      url: `https://sivrce.ge${path}`,
      siteName: 'sivrce',
      locale: OG_LOCALE[lang],
      images: [{ url: og, width: 1200, height: 630, alt: title }],
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
      images: [og],
    },
  }
}

export default async function ListingPage({ params }: PageProps) {
  const { id, slug, lang: raw } = await params
  const lang: Lang = raw && isValidLang(raw) ? raw : "ka"
  const listing = await getListing(id)
  if (!listing) notFound()

  // Competitor-style canonical: /listing/{id}/{keyword-slug}. Bare /listing/id
  // (old links, shares) and wrong/garbage slugs 301 to it — juice consolidates.
  const canonical = listingPath(listing)
  if (slug?.join('/') !== listingSlug(listing)) permanentRedirect(canonical)

  const [similar, peerPerM2, aggregate, ownerMeta, railAd] = await Promise.all([
    getSimilarListings(listing, 8).catch(() => []),
    getDistrictPeerPerM2(listing.city, listing.district, listing.dealType).catch(() => []),
    getReviewAggregate('listing', listing.id).catch(() => null),
    getListingOwnerMeta(listing.id),
    pickAd('listing_rail', { audience: 'guest', lang }),
  ])
  const ownerTier = ownerMeta?.tier ?? 'standard'

  // Offer validity: 30 days after posting (matches the 30-day listing lifetime)
  const priceValidUntil = new Date(
    Date.parse(`${listing.postedAt}T00:00:00Z`) + 30 * 24 * 60 * 60 * 1000,
  )
    .toISOString()
    .slice(0, 10)

  const t = getServerT(lang)
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
    name: listing.title,
    description: listing.description,
    poster: listing.images[0] ?? listing.img,
    uploadDate: `${listing.postedAt}T00:00:00Z`,
  })

  const listingLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: listing.title,
    description: listing.description,
    url: `https://sivrce.ge${canonical}`,
    sku: String(listingPublicId(listing)),
    image: listing.images.map((src) => (src.startsWith('http') ? src : `https://sivrce.ge${src}`)),
    datePosted: listing.postedAt,
    numberOfBedrooms: listing.beds,
    numberOfBathroomsTotal: listing.baths,
    floorLevel: listing.floor,
    address: {
      '@type': 'PostalAddress',
      streetAddress: listing.address,
      addressLocality: listing.city,
      addressRegion: listing.district,
      addressCountry: 'GE',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: listing.coords.lat,
      longitude: listing.coords.lng,
    },
    offers: {
      '@type': 'Offer',
      price: listing.priceUSD,
      priceCurrency: 'USD',
      priceValidUntil,
      availability: 'https://schema.org/InStock',
      itemOffered: {
        '@type': dwellingType,
        name: listing.title,
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
          price: listing.priceUSD,
          priceCurrency: 'USD',
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
    ...((listing.isExclusive || listing.isSivrceExclusive) && {
      additionalProperty: [
        ...(listing.isExclusive ? [{ '@type': 'PropertyValue' as const, name: t('badge.exclusive'), value: true }] : []),
        ...(listing.isSivrceExclusive ? [{ '@type': 'PropertyValue' as const, name: t('badge.sivrceExclusive'), value: true }] : []),
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
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'მთავარი', item: 'https://sivrce.ge' },
      { '@type': 'ListItem', position: 2, name: 'ძიება', item: 'https://sivrce.ge/search' },
      { '@type': 'ListItem', position: 3, name: listing.title, item: `https://sivrce.ge${canonical}` },
    ],
  }

  return (
    <>
      <ListingDetailClient
        listing={listing}
        similar={similar}
        peerPerM2={peerPerM2}
        ownerId={ownerMeta?.ownerId ?? null}
        ownerTier={ownerTier}
        railAd={railAd}
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
