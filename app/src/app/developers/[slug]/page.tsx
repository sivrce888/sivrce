import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import ListingCard from '@/components/ListingCard'
import { EntityHeader } from '@/components/entities/EntityHeader'
import { LeadForm } from '@/components/lead/LeadForm'
import { ReviewsSection } from '@/components/reviews/ReviewsSection'
import {
  DEVELOPERS,
  getDeveloper,
  projectsByDeveloper,
  listingsByCity,
  listingCountByCity,
} from '@/data/professionals'
import { getReviewAggregate } from '@/lib/reviews/aggregate'
import { jsonLd } from '@/lib/utils'

export function generateStaticParams() {
  return DEVELOPERS.map((d) => ({ slug: d.slug }))
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const d = getDeveloper(slug)
  if (!d) return {}
  const description = d.description.ka.replace(/\s+/g, ' ').slice(0, 155)
  return {
    title: `${d.name.ka} — პროექტები, ფასები და მიმოხილვები`,
    description,
    alternates: { canonical: `/developers/${d.slug}` },
    openGraph: {
      title: `${d.name.ka} | sivrce`,
      description,
      type: 'profile',
      url: `https://sivrce.ge/developers/${d.slug}`,
      siteName: 'sivrce',
      locale: 'ka_GE',
    },
  }
}

export default async function DeveloperPage({ params }: PageProps) {
  const { slug } = await params
  const dev = getDeveloper(slug)
  if (!dev) notFound()

  const [aggregate, projects, listings] = [
    await getReviewAggregate('developer', slug),
    projectsByDeveloper(slug),
    listingsByCity(dev.city, 6),
  ]

  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: dev.name.en,
    alternateName: dev.name.ka,
    url: `https://sivrce.ge/developers/${dev.slug}`,
    telephone: dev.phone,
    address: {
      '@type': 'PostalAddress',
      addressLocality: dev.city,
      addressCountry: 'GE',
    },
    ...(aggregate && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: aggregate.average,
        reviewCount: aggregate.count,
      },
    }),
  }

  return (
    <div className="min-h-screen bg-sv-surface">
      <Navbar />
      <main id="main" className="pt-16">
        <EntityHeader
          kind="developer"
          name={dev.name}
          city={dev.city}
          verified={dev.verified}
          phone={dev.phone}
          stats={[
            { key: 'yearsActive', value: dev.yearsActive },
            { key: 'projectsDone', value: dev.projectsDone },
            { key: 'unitsDelivered', value: dev.unitsDelivered.toLocaleString('en-US') },
            { key: 'activeListings', value: listingCountByCity(dev.city) },
          ]}
        />

        <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10">
          <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
            შესახებ
          </h2>
          <p className="mt-3 max-w-3xl text-[15px] font-semibold leading-relaxed text-sv-ink/70">
            {dev.description.ka}
          </p>
        </section>

        {projects.length > 0 && (
          <section className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              პროექტები
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <Link
                  key={p.slug}
                  href={`/projects/${p.slug}`}
                  aria-label={p.name}
                  className="group overflow-hidden rounded-card border border-sv-ink/[0.06] bg-sv-surface shadow-card transition-all duration-500 hover:-translate-y-1.5 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={p.img}
                      alt={p.name}
                      fill
                      sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 460px"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                    />
                    <div className="absolute left-4 top-3 rounded-full bg-sv-navy/55 px-3 py-1 text-[12px] font-extrabold text-white backdrop-blur">
                      აშენებულია {p.done}%
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-[16px] font-black text-sv-ink">{p.name}</h3>
                    <p className="mt-1 text-[13px] font-bold text-sv-ink/55">
                      {p.location} · ჩაბარება {p.finish}
                    </p>
                    <p className="mt-2 text-[15px] font-black text-sv-blue">
                      {p.priceFromM2}
                      <span className="text-[12px] font-bold text-sv-ink/60"> /მ²-დან</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {listings.length > 0 && (
          <section className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              განცხადებები ქ. {dev.city}ში
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((l, i) => (
                <ListingCard key={l.id} l={l} i={i} layout="wide" />
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto grid max-w-[1440px] gap-10 px-5 pb-16 md:px-10 lg:grid-cols-2">
          <LeadForm targetType="developer" targetId={dev.slug} recipientName={dev.name.ka} />
          <ReviewsSection targetType="developer" targetId={dev.slug} />
        </section>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(orgLd) }} />
    </div>
  )
}
