import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LISTINGS, getListing as getMockListing, formatUSD, type Listing, type PropType } from '@/data/listings'
import { getListing as getDbListing } from '@/lib/listings-db'
import { getReviewAggregate } from '@/lib/reviews/aggregate'
import { ka, type DictKey } from '@/lib/i18n/ka'
import { DEALS as SEO_DEALS } from '@/lib/seo-pages'
import { cap1, fillTpl, seoTitleParts } from '@/lib/seo-title'
import { jsonLd, ogImage } from '@/lib/utils'
import ListingDetailClient from '@/components/listing/ListingDetailClient'

/** Title-slot type labels — the SEO keyword forms (კომერციული ფართი, not კომერციული). */
const TITLE_TYPE: Record<PropType, DictKey> = {
  apartment: 'prop.apartment', house: 'prop.houseShort',
  commercial: 'add.titleType.commercial', land: 'prop.land',
}

/** Keyword-first detail title: "იყიდება 2-ოთახიანი ბინა ვაკეში" — same engine as the /add-listing default. */
function seoTitle(l: Listing): string {
  const dealLabel = l.dealType === 'daily' ? 'ქირავდება დღიურად' : SEO_DEALS[l.dealType].ka
  const { deal, where } = seoTitleParts({ lang: 'ka', deal: l.dealType, dealLabel, district: l.district, city: l.city })
  return cap1(fillTpl(
    ka[l.rooms > 0 && l.propType !== 'land' ? 'add.autoTitle.rooms' : 'add.autoTitle.simple'],
    { deal, rooms: l.rooms, type: ka[TITLE_TYPE[l.propType]], where },
  ))
}

// ponytail: dynamicParams default (true) — unknown ids hit notFound() below;
// `false` crashes `next start` (NoFallbackError) on any unknown-id request.
export function generateStaticParams() {
  return LISTINGS.map((l) => ({ id: l.id }))
}

interface PageProps {
  params: Promise<{ id: string }>
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
  const title = `${seoTitle(l)} — ${price} | Sivrce`
  const description = metaDescription(l.description)
  // Local photos have a build-time JPEG derivative (scripts/og-derivatives.mjs)
  // because WhatsApp/Viber/FB crawlers don't render WebP OG tags. Uploaded
  // (https) photos are served as-is; brand card is the last resort.
  const firstImg = l.images[0] ?? ''
  const og = firstImg ? ogImage(firstImg) : '/images/og.jpg'
  return {
    title,
    description,
    alternates: { canonical: `/listing/${l.id}` },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://sivrce.ge/listing/${l.id}`,
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
  const { id } = await params
  const listing = await getListing(id)
  if (!listing) notFound()

  // Deterministic: same dealType + city, exclude self, cap 8 (source order)
  const similar = LISTINGS.filter(
    (x) => x.id !== listing.id && x.dealType === listing.dealType && x.city === listing.city,
  ).slice(0, 8)

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
    url: `https://sivrce.ge/listing/${listing.id}`,
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
      seller: {
        '@type': 'RealEstateAgent',
        name: listing.agent.name,
        telephone: listing.agent.phone,
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
      { '@type': 'ListItem', position: 3, name: listing.title, item: `https://sivrce.ge/listing/${listing.id}` },
    ],
  }

  return (
    <>
      <ListingDetailClient listing={listing} similar={similar} />
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
