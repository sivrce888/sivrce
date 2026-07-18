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
  listingsByCity,
  listingCountByCity,
} from '@/data/professionals'
import { getLiveDeveloper, projectsLiveByDeveloper } from '@/lib/directory-live'
import { cityCenter, parseCoords } from '@/lib/map/geocode'
import MapEmbed from '@/components/MapEmbed'
import { getReviewAggregate } from '@/lib/reviews/aggregate'
import { jsonLd, ogImage } from '@/lib/utils'
import { langAlternates } from '@/lib/i18n/server'

export const revalidate = 3600

export function generateStaticParams() {
  // Prerender ka only; other locales + korter-only slugs SSR via dynamicParams.
  return DEVELOPERS.map((d) => ({ lang: 'ka', slug: d.slug }))
}

interface PageProps {
  params: Promise<{ slug: string }>
}

function absImg(src: string) {
  return src.startsWith('http') ? src : `https://sivrce.ge${src}`
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const d = await getLiveDeveloper(slug)
  if (!d) return {}
  const projects = await projectsLiveByDeveloper(slug)
  const flagship = projects.length
    ? projects.reduce((a, b) => (b.done > a.done ? b : a))
    : null
  const description = (
    d.description.ka ||
    `${d.name.ka} — დეველოპერი ${d.city}ში. პროექტები, ფასები და მიმოხილვები სივრცეზე.`
  )
    .replace(/\s+/g, ' ')
    .slice(0, 155)
  const title = `${d.name.ka} — პროექტები, ფასები და მიმოხილვები | sivrce`
  // ponytail: flagship project photo beats tiny logo for OG (rich results + CTR).
  const og = flagship ? ogImage(flagship.img) : d.logoUrl || undefined
  return {
    title,
    description,
    alternates: {
      canonical: `/developers/${d.slug}`,
      languages: langAlternates(`/developers/${d.slug}`),
    },
    openGraph: {
      title: `${d.name.ka} | sivrce`,
      description,
      type: 'profile',
      url: `https://sivrce.ge/developers/${d.slug}`,
      siteName: 'sivrce',
      locale: 'ka_GE',
      ...(og ? { images: [{ url: og, alt: d.name.ka }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${d.name.ka} | sivrce`,
      description,
      ...(og ? { images: [og] } : {}),
    },
  }
}

export default async function DeveloperPage({ params }: PageProps) {
  const { slug } = await params
  const dev = await getLiveDeveloper(slug)
  if (!dev) notFound()

  const [aggregate, projects, listings] = await Promise.all([
    getReviewAggregate('developer', slug),
    projectsLiveByDeveloper(slug),
    Promise.resolve(listingsByCity(dev.city, 6)),
  ])

  // Cover = most complete project's real photo (deterministic, no new assets).
  const flagship = projects.length
    ? projects.reduce((a, b) => (b.done > a.done ? b : a))
    : null
  const flagshipImg = flagship ? absImg(flagship.img) : null

  // Map pin: flagship → any project with Georgia geo → city center fallback.
  const geoProject =
    (flagship && parseCoords(flagship.coords.lat, flagship.coords.lng) ? flagship : null) ??
    projects.find((p) => parseCoords(p.coords.lat, p.coords.lng)) ??
    null
  const mapPin = geoProject?.coords ?? cityCenter(dev.city)
  const mapLabel = geoProject?.location ?? dev.city

  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: dev.name.en,
    alternateName: [dev.name.ka, dev.name.ru].filter(Boolean),
    url: `https://sivrce.ge/developers/${dev.slug}`,
    ...(dev.phone ? { telephone: dev.phone } : {}),
    ...(dev.logoUrl ? { logo: absImg(dev.logoUrl) } : {}),
    ...(flagshipImg && { image: flagshipImg }),
    ...(dev.website ? { sameAs: [dev.website] } : {}),
    address: {
      '@type': 'PostalAddress',
      addressLocality: dev.city,
      addressCountry: 'GE',
    },
    ...(geoProject &&
      parseCoords(geoProject.coords.lat, geoProject.coords.lng) && {
        geo: {
          '@type': 'GeoCoordinates',
          latitude: geoProject.coords.lat,
          longitude: geoProject.coords.lng,
        },
      }),
    ...(aggregate && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: aggregate.average,
        reviewCount: aggregate.count,
      },
    }),
    ...(projects.length > 0 && {
      makesOffer: projects.slice(0, 12).map((p) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'ApartmentComplex',
          name: p.name,
          url: `https://sivrce.ge/projects/${p.slug}`,
        },
      })),
    }),
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'მთავარი', item: 'https://sivrce.ge' },
      { '@type': 'ListItem', position: 2, name: 'დეველოპერები', item: 'https://sivrce.ge/developers' },
      {
        '@type': 'ListItem',
        position: 3,
        name: dev.name.ka,
        item: `https://sivrce.ge/developers/${dev.slug}`,
      },
    ],
  }

  const projectListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${dev.name.ka} — პროექტები`,
    numberOfItems: projects.length,
    itemListElement: projects.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.name,
      url: `https://sivrce.ge/projects/${p.slug}`,
      image: absImg(p.img),
    })),
  }

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `რა პროექტები აქვს ${dev.name.ka}-ს?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            projects.length > 0
              ? `${dev.name.ka}-ს აქვს ${projects.length} პროექტი სივრცეზე: ${projects
                  .slice(0, 5)
                  .map((p) => p.name)
                  .join(', ')}${projects.length > 5 ? ' და სხვა' : ''}.`
              : `${dev.name.ka} — დეველოპერი ${dev.city}ში. პროექტები ხელმისაწვდომია სივრცეზე.`,
        },
      },
      {
        '@type': 'Question',
        name: `სად მუშაობს ${dev.name.ka}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${dev.name.ka} მუშაობს ${dev.city}ში. ${dev.yearsActive > 0 ? `აქტიურია ${dev.yearsActive} წელია. ` : ''}${dev.description.ka.slice(0, 200)}`,
        },
      },
    ],
  }

  return (
    <div className="min-h-screen bg-sv-surface">
      <Navbar />
      <main id="main" className="pt-16">
        {flagship && (
          <div className="relative h-[240px] overflow-hidden md:h-[360px]">
            <Image
              src={flagship.img}
              alt={`${dev.name.ka} — ${flagship.name}`}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-sv-navy/55 via-sv-navy/10 to-transparent"
            />
            <nav
              aria-label="breadcrumb"
              className="absolute left-5 top-4 text-[12px] font-semibold text-white/70 md:left-10"
            >
              <Link href="/developers" className="hover:text-white">
                დეველოპერები
              </Link>
              <span aria-hidden className="mx-1.5">
                /
              </span>
              <span className="text-white/90">{dev.name.ka}</span>
            </nav>
          </div>
        )}
        <EntityHeader
          kind="developer"
          name={dev.name}
          city={dev.city}
          verified={dev.verified}
          phone={dev.phone}
          logoUrl={dev.logoUrl}
          stats={[
            { key: 'yearsActive', value: dev.yearsActive },
            { key: 'projectsDone', value: projects.length || dev.projectsDone },
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
          {dev.website && (
            <p className="mt-3 text-[13px] font-bold text-sv-ink/55">
              ვებგვერდი:{' '}
              <a
                href={dev.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sv-blue hover:underline"
              >
                {dev.website.replace(/^https?:\/\//, '')}
              </a>
            </p>
          )}
        </section>

        <section className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10">
          <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink md:text-[26px]">
            მდებარეობა
          </h2>
          <div className="relative mt-6 overflow-hidden rounded-card shadow-card">
            <MapEmbed
              lat={mapPin.lat}
              lng={mapPin.lng}
              zoom={geoProject ? 14 : 12}
              q={mapLabel}
              aspect="16/9"
              highlight
              className="border-0 shadow-none rounded-none"
            />
          </div>
          <p className="mt-3 text-[12px] font-semibold text-sv-ink/45">
            {mapLabel} · {mapPin.lat.toFixed(5)}, {mapPin.lng.toFixed(5)}
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(projectListLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqLd) }} />
    </div>
  )
}
