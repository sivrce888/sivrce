import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LISTINGS, getListing, formatUSD } from '@/data/listings'
import { getReviewAggregate } from '@/lib/reviews/aggregate'
import { jsonLd } from '@/lib/utils'
import ListingDetailClient from '@/components/listing/ListingDetailClient'

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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const l = getListing(id)
  if (!l) return {}
  const price = l.dealType === 'rent' ? `${formatUSD(l.priceUSD)}/თვე` : formatUSD(l.priceUSD)
  const title = `${l.title} — ${price}`
  const description = metaDescription(l.description)
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
      images: [{ url: l.img, width: 1536, height: 957, alt: l.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [l.img],
    },
  }
}

export default async function ListingPage({ params }: PageProps) {
  const { id } = await params
  const listing = getListing(id)
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
