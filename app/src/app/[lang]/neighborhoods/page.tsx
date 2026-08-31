import type { Metadata } from 'next'
import Navbar from '@/components/sections/Navbar'
import CTA from '@/components/sections/CTA'
import Footer from '@/components/sections/Footer'
import NeighborhoodsIndex from '@/components/neighborhoods/NeighborhoodsIndex'
import { AdSlot } from '@/components/ads/AdSlot'
import { isValidLang } from '@/lib/i18n/core'
import { NEIGHBORHOODS } from '@/data/neighborhoods'
import { getDistrictListingCounts } from '@/lib/listings-db'
import { jsonLd } from '@/lib/utils'
import { langAlternates } from '@/lib/i18n/server'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'უბნები თბილისში — ვაკე, საბურთალო, ბინები დღიურად | sivrce',
  description:
    'ბინები დღიურად საბურთალოზე და ვაკეში, იყიდება და ქირავდება. ცხოვრების ხარისხის ქულები, ფასი მ²-ზე და რეალური ფოტოები.',
  alternates: { canonical: '/neighborhoods', languages: langAlternates('/neighborhoods') },
  openGraph: {
    title: 'უბნების გზამკვლევი — ცხოვრების ხარისხის ქულები და ფასები | sivrce',
    description:
      'ვაკე, საბურთალო, ძველი თბილისი, ბათუმი, ქუთაისი — ქულები, ფასები მ²-ზე და მცხოვრებლების შეფასებები.',
    type: 'website',
  },
}

export default async function NeighborhoodsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang: raw } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const counts = await getDistrictListingCounts()
  const listLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'უბნების გზამკვლევი — sivrce',
    url: 'https://sivrce.ge/neighborhoods',
    numberOfItems: NEIGHBORHOODS.length,
    itemListElement: NEIGHBORHOODS.map((n, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: n.name.ka,
      url: `https://sivrce.ge/neighborhoods/${n.slug}`,
    })),
  }

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main">
        <NeighborhoodsIndex counts={counts} />
        <AdSlot slot="neighborhoods" lang={lang} />
        <CTA />
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(listLd) }} />
    </div>
  )
}
