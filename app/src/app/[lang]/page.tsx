import type { Metadata } from 'next'
import { headers } from 'next/headers'
import HomeMain from '@/components/HomeMain'
import GlobalHome, { metadata as globalMeta } from '@/components/GlobalHome'
import type { Listing } from '@/data/listings'
import { getAllListings } from '@/lib/listings-db'
import { listingDisplayTitle, listingPath } from '@/lib/listing-slug'
import { isValidLang, localizedHref, type Lang } from '@/lib/i18n/core'
import { getServerT } from '@/lib/i18n/server'
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
async function homeItemListLd(market: MarketId, lang: Lang) {
  const scope = homeScopeFor(market)
  let rows: Listing[] = []
  try {
    rows = await getAllListings(10, scope)
  } catch { /* DB unavailable — no ItemList beats mock offers */ }
  if (rows.length === 0) return null
  // Worldwide hub: world listings live on sivrce.com; every market keeps its own origin.
  const origin = market === 'global' ? COM_ORIGIN : canonicalOrigin(market)
  const abs = (src: string) => (src.startsWith('http') ? src : `${origin}${src}`)
  const t = getServerT(lang)
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: lang === 'ka' ? 'განცხადებები sivrce-ზე' : 'Listings on sivrce',
    numberOfItems: rows.length,
    itemListElement: rows.map((l, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      // Same locale as the page — /en home must not point crawlers at ka URLs/names.
      url: `${origin}${localizedHref(listingPath(l), lang)}`,
      name: listingDisplayTitle(l, lang, t),
      image: abs(l.img),
      // Price-on-request rows (project catalog) carry 0 — no Offer beats a fake $0 one.
      ...(l.priceUSD > 0 ? { offers: { '@type': 'Offer', price: l.priceUSD, priceCurrency: 'USD' } } : {}),
    })),
  }
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const market = await requestMarket()
  const { lang: raw } = await params
  if (market === 'global') {
    const lang: Lang = isValidLang(raw) ? raw : 'en'
    const [itemListLd, h] = await Promise.all([homeItemListLd(market, lang), headers()])
    // Edge geo → the visitor's own market on the World Desk. Absent (crawler,
    // preview, proxy miss) renders the world index alone; never a guess.
    const cc = h.get('x-vercel-ip-country') || h.get('cf-ipcountry')
    return (
      <>
        <GlobalHome cc={cc} lang={lang} />
        {itemListLd && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(itemListLd) }} />
        )}
      </>
    )
  }
  const lang: Lang = isValidLang(raw) ? raw : 'ka'
  const itemListLd = await homeItemListLd(market, lang)
  return (
    <>
      <HomeMain lang={lang} market={market} />
      {itemListLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(itemListLd) }} />
      )}
    </>
  )
}
