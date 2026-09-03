import HomeMain from '@/components/HomeMain'
import { LISTINGS, type Listing } from '@/data/listings'
import { getAllListings } from '@/lib/listings-db'
import { listingPath } from '@/lib/listing-slug'
import { isValidLang } from '@/lib/i18n/core'
import { jsonLd } from '@/lib/utils'

// Paid SUPER VIP / VIP+ rails — 60s ISR so a just-purchased slot lands on home.
export const revalidate = 60

// ponytail: ItemList of the freshest listings on the strongest page — schema
// only, no extra render work. Swap for curated/featured rails if home grows one.
async function homeItemListLd() {
  let rows: Listing[] = LISTINGS.slice(0, 10)
  try {
    const live = await getAllListings(10)
    if (live.length > 0) rows = live
  } catch { /* DB unavailable at build — static URLs */ }
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
    })),
  }
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
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
