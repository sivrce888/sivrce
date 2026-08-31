import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BadgeCheck, Globe, MapPin, Phone } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import ListingCard from '@/components/ListingCard'
import { LeadForm } from '@/components/lead/LeadForm'
import { ReviewsSection } from '@/components/reviews/ReviewsSection'
import LocalizedLink from '@/components/LocalizedLink'
import { isValidLang } from '@/lib/i18n/core'
import { langAlternates } from '@/lib/i18n/server'
import { jsonLd } from '@/lib/utils'
import { telHref } from '@/lib/inquiries/phone'
import { getListingsByOwner } from '@/lib/listings-db'
import { getReviewAggregate } from '@/lib/reviews/aggregate'
import {
  isServiceCategoryId,
  pickLocText,
  SERVICE_PROVIDERS,
  formatGel,
  serviceCategory,
} from '@/lib/services'
import { getServiceProvider } from '@/lib/services-db'

export const revalidate = 3600

export function generateStaticParams() {
  return SERVICE_PROVIDERS.map((p) => ({ lang: 'ka', category: p.category, slug: p.slug }))
}

interface PageProps {
  params: Promise<{ lang: string; category: string; slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang: raw, category, slug } = await params
  const lang = isValidLang(raw) ? raw : 'ka'
  const p = await getServiceProvider(category, slug)
  if (!p) return {}
  const name = pickLocText(p.name, lang)
  const description = pickLocText(p.description, lang).replace(/\s+/g, ' ').slice(0, 155)
  return {
    title: `${name} — ${p.city}`,
    description,
    alternates: {
      canonical: `/services/${p.category}/${p.slug}`,
      languages: langAlternates(`/services/${p.category}/${p.slug}`),
    },
    openGraph: {
      title: `${name} | sivrce`,
      description,
      type: 'profile',
      url: `https://sivrce.ge/services/${p.category}/${p.slug}`,
      siteName: 'sivrce',
    },
  }
}

export default async function ServiceProviderPage({ params }: PageProps) {
  const { lang: raw, category, slug } = await params
  if (!isServiceCategoryId(category)) notFound()
  const lang = isValidLang(raw) ? raw : 'ka'
  const p = await getServiceProvider(category, slug)
  if (!p || p.category !== category) notFound()
  const cat = serviceCategory(p.category)
  const aggregate = await getReviewAggregate('service', p.slug)
  const listings = p.ownerId ? await getListingsByOwner(p.ownerId) : []
  const name = pickLocText(p.name, lang)

  const bizLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: p.name.en,
    alternateName: p.name.ka,
    url: `https://sivrce.ge/services/${p.category}/${p.slug}`,
    telephone: p.phone.replace(/\s+/g, ''),
    address: {
      '@type': 'PostalAddress',
      addressLocality: p.city,
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
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main" className="pt-[68px]">
        <header className="border-b border-sv-ink/[0.06] bg-sv-cloud">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between md:px-10 md:py-14">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.18em] text-sv-blue">
                <LocalizedLink href="/services" className="hover:underline">
                  {lang === 'ru' ? 'Сервисы' : lang === 'ka' ? 'სერვისები' : 'Services'}
                </LocalizedLink>
                {cat ? (
                  <>
                    {' · '}
                    <LocalizedLink href={`/services/${p.category}`} className="hover:underline">
                      {pickLocText(cat.name, lang)}
                    </LocalizedLink>
                  </>
                ) : null}
              </p>
              <h1 className="mt-3 flex items-center gap-2 text-[32px] font-black tracking-[-0.03em] text-sv-ink md:text-[40px]">
                {name}
                {p.verified && (
                  <BadgeCheck className="h-6 w-6 shrink-0 text-sv-success" aria-label="ვერიფიცირებული" />
                )}
              </h1>
              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] font-semibold text-sv-ink/60">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-sv-ink/35" />
                  {p.city}
                  {p.district ? ` · ${p.district}` : ''}
                </span>
                {p.yearsActive > 0 && <span>{p.yearsActive} წელი</span>}
                {p.priceRangeMin != null && (
                  <span>{formatGel(p.priceRangeMin)}{p.priceRangeMax != null ? ` – ${formatGel(p.priceRangeMax)}` : '+'}</span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {p.phone && (
                <a
                  href={telHref(p.phone)}
                  className="inline-flex items-center gap-2 rounded-full bg-sv-orange px-5 py-3 text-[14px] font-extrabold text-white shadow-glow-orange"
                >
                  <Phone className="h-4 w-4" />
                  დარეკვა
                </a>
              )}
              {p.website && (
                <a
                  href={p.website}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-full border border-sv-ink/10 bg-sv-surface px-5 py-3 text-[14px] font-extrabold text-sv-ink"
                >
                  <Globe className="h-4 w-4" />
                  ვებსაიტი
                </a>
              )}
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-[1440px] px-5 py-12 md:grid md:grid-cols-[1.4fr_0.8fr] md:gap-12 md:px-10">
          <div>
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink">შესახებ</h2>
            <p className="mt-3 max-w-3xl text-[15px] font-semibold leading-relaxed text-sv-ink/70">
              {pickLocText(p.description, lang)}
            </p>
            {p.features.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2">
                {p.features.map((f) => (
                  <li
                    key={f}
                    className="rounded-full border border-sv-ink/[0.07] bg-sv-surface px-3.5 py-1.5 text-[13px] font-extrabold text-sv-ink"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <LeadForm targetType="service" targetId={p.slug} recipientName={name} />
        </section>

        {listings.length > 0 && (
          <section className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-sv-ink">
              კომპანიის განცხადებები
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((l) => (
                <ListingCard key={l.id} l={l} />
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto max-w-[1440px] px-5 pb-20 md:px-10">
          <ReviewsSection targetType="service" targetId={p.slug} />
        </section>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(bizLd) }} />
    </div>
  )
}
