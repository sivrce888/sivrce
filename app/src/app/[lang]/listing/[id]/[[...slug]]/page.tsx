import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { LISTINGS, getListing as getMockListing, formatUSD } from '@/data/listings'
import {
  getListing as getDbListing,
  getDistrictPeerPerM2,
} from '@/lib/listings-db'
import { getReviewAggregate } from '@/lib/reviews/aggregate'
import { listingKeyword, listingPath, listingSlug } from '@/lib/listing-slug'
import { listingPublicId } from '@/lib/listing-public-id'
import { jsonLd, ogImage } from '@/lib/utils'
import ListingDetailClient from '@/components/listing/ListingDetailClient'
import { langAlternates } from '@/lib/i18n/server'

// ponytail: dynamicParams default (true) — unknown ids hit notFound() below;
// `false` crashes `next start` (NoFallbackError) on any unknown-id request.
export function generateStaticParams() {
  // ponytail: prerender ka only at the canonical slug URL — other locales SSR on
  // demand via dynamicParams. Upgrade path: per-locale SSG when build budget allows.
  return LISTINGS.map((l) => ({ lang: 'ka', id: l.id, slug: [listingSlug(l)] }))
}

interface PageProps {
  params: Promise<{ id: string; slug?: string[] }>
}

/* Trim to ~155 chars at a word boundary for meta/OG descriptions */
function metaDescription(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max)
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[.,;:!?…-]+$/, '')}…`
}

/** Try DB first, fall back to mock data. ponytail: seamless migration path. */
async function getListing(id: string) {
  try {
    const dbListing = await getDbListing(id)
    if (dbListing) return dbListing
  } catch { /* DB unavailable — fall through to mock */ }
  return getMockListing(id)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const l = await getListing(id)
  if (!l) return {}
  const price =
    l.dealType === 'rent' ? `${formatUSD(l.priceUSD)}/თვე`
      : l.dealType === 'daily' ? `${formatUSD(l.priceUSD)}/დღე`
        : formatUSD(l.priceUSD)
  const keyword = listingKeyword(l)
  const title = `${keyword} — ${price} | Sivrce`
  /* CTR lead: keyword sentence + hard stats before the free text (Google bolds query matches) */
  const stats = [
    l.area > 0 && `${l.area} მ²`,
    l.floor > 0 && `${l.floor}/${l.totalFloors} სართული`,
  ].filter(Boolean).join(', ')
  const description = metaDescription(`${keyword}. ${stats && `${stats}. `}${price}. ${l.description}`)
  // Local photos have a build-time JPEG derivative (scripts/og-derivatives.mjs)
  // because WhatsApp/Viber/FB crawlers don't render WebP OG tags. Uploaded
  // (https) photos are served as-is; brand card is the last resort.
  const firstImg = l.images[0] ?? ''
  const og = firstImg ? ogImage(firstImg) : '/images/og.jpg'
  const path = listingPath(l)
  return {
    title,
    description,
    alternates: { canonical: path, languages: langAlternates(path) },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://sivrce.ge${path}`,
      siteName: 'sivrce',
      locale: 'ka_GE',
      images: [{ url: og, width: 1200, height: 630, alt: title }],
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
  const { id, slug } = await params
  const listing = await getListing(id)
  if (!listing) notFound()

  // Competitor-style canonical: /listing/{id}/{keyword-slug}. Bare /listing/id
  // (old links, shares) and wrong/garbage slugs 301 to it — juice consolidates.
  const canonical = listingPath(listing)
  if (slug?.join('/') !== listingSlug(listing)) permanentRedirect(canonical)

  // Deterministic: same dealType + city, exclude self, cap 8 (source order)
  const similar = LISTINGS.filter(
    (x) => x.id !== listing.id && x.dealType === listing.dealType && x.city === listing.city,
  ).slice(0, 8)

  let peerPerM2: number[] = []
  try {
    peerPerM2 = await getDistrictPeerPerM2(listing.city, listing.district, listing.dealType)
  } catch {
    peerPerM2 = []
  }

  // Reviews aggregate for rich results — a DB outage must never break the page
  let aggregate: { average: number; count: number } | null = null
  try {
    aggregate = await getReviewAggregate('listing', listing.id)
  } catch {
    aggregate = null
  }

  // Offer validity: 30 days after posting (matches the 30-day listing lifetime)
  const priceValidUntil = new Date(
    Date.parse(`${listing.postedAt}T00:00:00Z`) + 30 * 24 * 60 * 60 * 1000,
  )
    .toISOString()
    .slice(0, 10)

  // ponytail: propType → schema.org dwelling type. InStock rich-result prefers
  // an itemOffered dwelling over a bare Offer; the Resident schema family also
  // unlocks the "Bedrooms/Bathrooms" rich snippet in Google's RE vertical.
  const dwellingType =
    listing.propType === 'apartment' ? 'Apartment'
      : listing.propType === 'house' ? 'House'
        : listing.propType === 'commercial' ? 'Place'
          : 'Place'

  const listingLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: listing.title,
    description: listing.description,
    url: `https://sivrce.ge${canonical}`,
    sku: String(listingPublicId(listing)),
    image: listing.images.map((src) => `https://sivrce.ge${src}`),
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
          unitText: 'MONTH',
        },
      }),
    },
    floorSize: {
      '@type': 'QuantitativeValue',
      value: listing.area,
      unitCode: 'MTK',
    },
    ...(listing.rooms > 0 && { numberOfRooms: listing.rooms }),
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
      <ListingDetailClient listing={listing} similar={similar} peerPerM2={peerPerM2} />
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
