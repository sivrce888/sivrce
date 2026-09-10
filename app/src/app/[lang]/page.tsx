import type { Metadata } from 'next'
import HomeMain from '@/components/HomeMain'
import GlobalHome, { metadata as globalMeta } from '@/components/GlobalHome'
import { LISTINGS, type Listing } from '@/data/listings'
import { getAllListings } from '@/lib/listings-db'
import { listingPath } from '@/lib/listing-slug'
import { isValidLang } from '@/lib/i18n/core'
import { jsonLd } from '@/lib/utils'
import { requestMarket } from '@/lib/request-market'

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
async function homeItemListLd() {
  let rows: Listing[] = LISTINGS.slice(0, 10)
  try {
    const live = await getAllListings(10)
    if (live.length > 0) rows = live
  } catch { /* DB unavailable at build — static URLs */ }
  const abs = (src: string) => (src.startsWith('http') ? src : `https://sivrce.ge${src}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'განცხადებები sivrce-ზე',
    numberOfItems: rows.length,
    itemListElement: rows.map((l, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://sivrce.ge${listingPath(l)}`,
      name: l.title,
      image: abs(l.img),
      offers: { '@type': 'Offer', price: l.priceUSD, priceCurrency: 'USD' },
    })),
  }
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const market = await requestMarket()
  if (market === 'global') return <GlobalHome />
  const { lang: raw } = await params
  const itemListLd = await homeItemListLd()
  return (
    <>
      <HomeMain lang={isValidLang(raw) ? raw : 'ka'} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(itemListLd) }}
      />
    </>
  )
}
