import type { Metadata } from 'next'
import Navbar from '@/components/sections/Navbar'
import CTA from '@/components/sections/CTA'
import Footer from '@/components/sections/Footer'
import NeighborhoodsIndex from '@/components/neighborhoods/NeighborhoodsIndex'
import { NEIGHBORHOODS } from '@/data/neighborhoods'
import { jsonLd } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'უბნების გზამკვლევი — თბილისი, ბათუმი, ქუთაისი | sivrce',
  description:
    'სად ცხოვრება ღირს: ცხოვრების ხარისხის ქულები (ტრანსპორტი, სკოლები, მწვანე ზონები, უსაფრთხოება), საშუალო ფასები კვადრატულზე და მცხოვრებლების შეფასებები ყველა უბნისთვის.',
  alternates: { canonical: '/neighborhoods' },
  openGraph: {
    title: 'უბნების გზამკვლევი — ცხოვრების ხარისხის ქულები და ფასები | sivrce',
    description:
      'ვაკე, საბურთალო, ძველი თბილისი, ბათუმი, ქუთაისი — ქულები, ფასები მ²-ზე და მცხოვრებლების შეფასებები.',
    type: 'website',
  },
}

export default function NeighborhoodsPage() {
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
    <div className="min-h-screen bg-sv-surface">
      <Navbar />
      <main id="main" className="pt-16">
        <NeighborhoodsIndex />
        <CTA />
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(listLd) }} />
    </div>
  )
}
