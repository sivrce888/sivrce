import type { Metadata } from 'next'
import HomeMain from '@/components/HomeMain'
import GlobalHome, { metadata as globalMeta } from '@/components/GlobalHome'
import { LISTINGS, type Listing } from '@/data/listings'
import { getAllListings } from '@/lib/listings-db'
import { listingPath } from '@/lib/listing-slug'
import { isValidLang } from '@/lib/i18n/core'
import { jsonLd } from '@/lib/utils'
import { requestMarket } from '@/lib/request-market'
import { homeScopeFor } from '@/lib/home-scope'
import { canonicalOrigin } from '@/lib/site-host'
import { COM_ORIGIN, type MarketId } from '@/lib/markets'

export async function generateMetadata(): Promise<Metadata> {
  const market = await requestMarket()
  if (market === 'global') return globalMeta
  return {}
}

// Paid SUPER VIP / VIP+ rails — 60s ISR so a just-purchased slot lands on home.
export const revalidate = 60

// ponytail: ItemList of the freshest listings on the strongest page — schema
// only, no extra render work. image + offers = carousel/rich-result eligible
// + citable prices for AI engines. Swap for curated rails if home grows one.
async function homeItemListLd(market: MarketId) {
  const scope = homeScopeFor(market)
  let rows: Listing[] = LISTINGS.slice(0, 10)
  try {
    const live = await getAllListings(10, scope)
    if (live.length > 0) rows = live
  } catch { /* DB unavailable at build — static URLs */ }
  // Worldwide hub: world listings live on sivrce.com; every market keeps its own origin.
  const origin = market === 'global' ? COM_ORIGIN : canonicalOrigin(market)
  const abs = (src: string) => (src.startsWith('http') ? src : `${origin}${src}`)
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: market === 'global' ? 'Listings on sivrce' : 'განცხადებები sivrce-ზე',
    numberOfItems: rows.length,
    itemListElement: rows.map((l, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${origin}${market === 'global' ? `/en${listingPath(l)}` : listingPath(l)}`,
      name: l.title,
      image: abs(l.img),
      offers: { '@type': 'Offer', price: l.priceUSD, priceCurrency: 'USD' },
    })),
  }
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const market = await requestMarket()
  const { lang: raw } = await params
  if (market === 'global') {
    const itemListLd = await homeItemListLd(market)
    return (
      <>
        <GlobalHome />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(itemListLd) }}
        />
      </>
    )
  }
  const itemListLd = await homeItemListLd(market)
  return (
    <>
      <HomeMain lang={isValidLang(raw) ? raw : 'ka'} market={market} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(itemListLd) }}
      />
    </>
  )
}
