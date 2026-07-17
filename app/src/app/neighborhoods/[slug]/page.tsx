import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import NeighborhoodDetail from '@/components/neighborhoods/NeighborhoodDetail'
import { NEIGHBORHOODS, getNeighborhood } from '@/data/neighborhoods'
import { jsonLd } from '@/lib/utils'

// ponytail: dynamicParams default (true) — unknown slugs hit notFound() below.
export function generateStaticParams() {
  return NEIGHBORHOODS.map((n) => ({ slug: n.slug }))
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const n = getNeighborhood(slug)
  if (!n) return {}
  const title = `${n.name.ka} — უბნის გზამკვლევი, ფასები და შეფასებები`
  const description = n.description.ka
  return {
    title,
    description,
    alternates: { canonical: `/neighborhoods/${n.slug}` },
    openGraph: {
      title: `${title} | sivrce`,
      description,
      type: 'website',
      url: `https://sivrce.ge/neighborhoods/${n.slug}`,
      siteName: 'sivrce',
      locale: 'ka_GE',
      images: [{ url: n.img, alt: n.name.ka }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [n.img],
    },
  }
}

export default async function NeighborhoodPage({ params }: PageProps) {
  const { slug } = await params
  const n = getNeighborhood(slug)
  if (!n) notFound()

  // aggregateRating intentionally omitted — ratings are runtime data (Review model)
  const placeLd = {
    '@context': 'https://schema.org',
    '@type': n.type,
    name: n.name.ka,
    alternateName: [n.name.en, n.name.ru],
    description: n.description.ka,
    url: `https://sivrce.ge/neighborhoods/${n.slug}`,
    image: `https://sivrce.ge${n.img}`,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: n.coords.lat,
      longitude: n.coords.lng,
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: n.city.ka,
      addressCountry: 'GE',
    },
    ...(n.type === 'Neighborhood' && {
      containedInPlace: { '@type': 'City', name: n.city.ka },
    }),
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'მთავარი', item: 'https://sivrce.ge' },
      { '@type': 'ListItem', position: 2, name: 'უბნები', item: 'https://sivrce.ge/neighborhoods' },
      { '@type': 'ListItem', position: 3, name: n.name.ka, item: `https://sivrce.ge/neighborhoods/${n.slug}` },
    ],
  }

  return (
    <div className="min-h-screen bg-sv-surface">
      <Navbar />
      <main id="main">
        <NeighborhoodDetail n={n} />
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(placeLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbLd) }} />
    </div>
  )
}
