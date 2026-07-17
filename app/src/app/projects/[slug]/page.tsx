import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { MapPin, CalendarCheck, Building2, BadgeCheck, Star } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import ListingCard from '@/components/ListingCard'
import { StatsRow } from '@/components/entities/StatsRow'
import { LeadForm } from '@/components/lead/LeadForm'
import { ReviewsSection } from '@/components/reviews/ReviewsSection'
import { PROJECTS, getProject, getDeveloper, listingsByCity } from '@/data/professionals'
import { getReviewAggregate } from '@/lib/reviews/aggregate'
import { jsonLd } from '@/lib/utils'

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }))
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const p = getProject(slug)
  if (!p) return {}
  const description = p.description.ka.replace(/\s+/g, ' ').slice(0, 155)
  return {
    title: `${p.name} — ${p.location}, ფასი ${p.priceFromM2}/მ²-დან`,
    description,
    alternates: { canonical: `/projects/${p.slug}` },
    openGraph: {
      title: `${p.name} | sivrce`,
      description,
      type: 'website',
      url: `https://sivrce.ge/projects/${p.slug}`,
      siteName: 'sivrce',
      locale: 'ka_GE',
      images: [{ url: p.img, alt: p.name }],
    },
  }
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params
  const project = getProject(slug)
  if (!project) notFound()

  const dev = getDeveloper(project.developerSlug)
  const listings = listingsByCity(project.city, 6)
  const aggregate = await getReviewAggregate('project', slug)

  const projectLd = {
    '@context': 'https://schema.org',
    '@type': 'ApartmentComplex',
    name: project.name,
    description: project.description.ka,
    url: `https://sivrce.ge/projects/${project.slug}`,
    image: `https://sivrce.ge${project.img}`,
    numberOfAvailableAccommodationUnits: project.flats,
    address: {
      '@type': 'PostalAddress',
      addressLocality: project.city,
      addressCountry: 'GE',
    },
    ...(dev && {
      provider: {
        '@type': 'Organization',
        name: dev.name.en,
        url: `https://sivrce.ge/developers/${dev.slug}`,
      },
    }),
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
        {/* Hero */}
        <div className="relative aspect-[16/9] max-h-[520px] w-full overflow-hidden md:aspect-[21/9]">
          <Image
            src={project.img}
            alt={project.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-sv-navy/80 via-sv-navy/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1440px] px-5 pb-8 md:px-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-[28px] font-black text-white [text-shadow:0_2px_12px_rgba(5,11,38,0.6)] md:text-[40px]">
                  {project.name}
                </h1>
                {dev && (
                  <Link
                    href={`/developers/${dev.slug}`}
                    className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-[14px] font-bold text-white/85 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <BadgeCheck className="h-4 w-4 text-sv-success" aria-hidden />
                    {dev.name.ka}
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-1 rounded-control bg-white/95 px-3.5 py-2 text-[15px] font-black text-sv-navy">
                <Star className="h-4 w-4 fill-sv-orange text-sv-orange" aria-hidden />
                {project.rating}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <section className="border-b border-sv-ink/[0.06] bg-sv-cloud">
          <div className="mx-auto max-w-[1440px] px-5 py-8 md:px-10">
            <StatsRow
              items={[
                { label: 'ფასი /მ²-დან', value: project.priceFromM2 },
                { label: 'აშენებულია', value: `${project.done}%` },
                { label: 'ჩაბარება', value: project.finish },
                { label: 'ბინა', value: String(project.flats) },
              ]}
            />
            <div className="mt-6 h-1.5 max-w-xl overflow-hidden rounded-full bg-sv-ink/[0.07]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sv-blue to-sv-violet"
                style={{ width: `${project.done}%` }}
              />
            </div>
            <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-bold text-sv-ink/55">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-sv-ink/35" aria-hidden /> {project.location}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarCheck className="h-4 w-4 text-sv-ink/35" aria-hidden /> ჩაბარება{' '}
                {project.finish}
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-sv-ink/35" aria-hidden /> {project.flats} ბინა
              </span>
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10">
          <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
            პროექტის შესახებ
          </h2>
          <p className="mt-3 max-w-3xl text-[15px] font-semibold leading-relaxed text-sv-ink/70">
            {project.description.ka}
          </p>
        </section>

        {listings.length > 0 && (
          <section className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
              განცხადებები ქ. {project.city}ში
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((l, i) => (
                <ListingCard key={l.id} l={l} i={i} layout="wide" />
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto grid max-w-[1440px] gap-10 px-5 pb-16 md:px-10 lg:grid-cols-2">
          <LeadForm targetType="project" targetId={project.slug} recipientName={project.name} />
          <ReviewsSection targetType="project" targetId={project.slug} />
        </section>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(projectLd) }} />
    </div>
  )
}
