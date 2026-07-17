import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, MapPin, TrendingUp, LayoutGrid, Sparkles } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import ListingCard from '@/components/ListingCard'
import { formatUSD } from '@/data/listings'
import { jsonLd } from '@/lib/utils'
import {
  DEALS,
  generateAllSeoParams,
  parseSeoSlug,
  h1Of,
  titleOf,
  descriptionOf,
  introOf,
  faqsOf,
  statsOf,
  breadcrumbsOf,
  linkChipsOf,
  type SeoPageDef,
} from '@/lib/seo-pages'

// ponytail: dynamicParams=true — unknown slugs render on demand and hit notFound()
// below; `false` at root catch-all crashes `next start` (NoFallbackError) on any
// unmatched asset request.
export function generateStaticParams() {
  return generateAllSeoParams().map((seo) => ({ seo }))
}

interface PageProps {
  params: Promise<{ seo: string[] }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { seo } = await params
  const def = parseSeoSlug(seo)
  if (!def) return {}
  const title = titleOf(def)
  const description = descriptionOf(def)
  return {
    title,
    description,
    alternates: { canonical: def.path },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://sivrce.ge${def.path}`,
      siteName: 'sivrce',
      locale: 'ka_GE',
      images: [{ url: '/images/og.jpg', width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/images/og.jpg'] },
  }
}

function seoLd(def: SeoPageDef) {
  const crumbs = breadcrumbsOf(def)
  const faqs = faqsOf(def)
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: titleOf(def),
        description: descriptionOf(def),
        url: `https://sivrce.ge${def.path}`,
        inLanguage: 'ka',
        isPartOf: { '@id': 'https://sivrce.ge/#website' },
      },
      {
        '@type': 'ItemList',
        numberOfItems: def.listings.length,
        itemListElement: def.listings.slice(0, 30).map((l, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `https://sivrce.ge/listing/${l.id}`,
          name: l.title,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: c.name,
          item: `https://sivrce.ge${c.href}`,
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  }
}

function Chip({ label, href, active }: { label: string; href: string; active?: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-extrabold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue ${
        active
          ? 'bg-sv-blue text-white shadow-glow-blue-sm'
          : 'border border-sv-ink/10 bg-sv-surface text-sv-ink/70 hover:border-sv-blue/40 hover:text-sv-blue'
      }`}
    >
      {label}
    </Link>
  )
}

export default async function SeoLandingPage({ params }: PageProps) {
  const { seo } = await params
  const def = parseSeoSlug(seo)
  if (!def) notFound()

  const stats = statsOf(def.listings)
  const crumbs = breadcrumbsOf(def)
  const chips = linkChipsOf(def)
  const faqs = faqsOf(def)
  const h1 = h1Of(def)

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main" className="mx-auto max-w-[1440px] px-5 pb-20 pt-24 md:px-10 md:pt-28">
        {/* Breadcrumbs */}
        <nav aria-label="ბრედკრამბი" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-sv-ink/50">
            {crumbs.map((c, i) => (
              <li key={c.href} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-sv-ink/30" aria-hidden />}
                {i === crumbs.length - 1 ? (
                  <span aria-current="page" className="text-sv-ink/80">{c.name}</span>
                ) : (
                  <Link href={c.href} className="transition-colors hover:text-sv-blue">
                    {c.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sv-blue/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-blue">
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> AI შეფასებით
          </span>
          <h1 className="max-w-[900px] text-balance text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[44px]">
            {h1}
          </h1>
          <p className="mt-3 max-w-[720px] text-[15px] font-semibold text-sv-ink/60 md:text-[16px]">
            {descriptionOf(def)}
          </p>

          {/* Live stats */}
          <dl className="mt-6 flex flex-wrap gap-3">
            {[
              { icon: LayoutGrid, label: 'განცხადება', value: String(stats.count) },
              ...(stats.avgPerM2
                ? [{ icon: TrendingUp, label: 'საშუალო ფასი', value: `${formatUSD(stats.avgPerM2)}/მ²` }]
                : []),
              { icon: MapPin, label: 'ფასი დაწყება', value: formatUSD(stats.minPrice) },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-3 rounded-module border border-sv-ink/[0.06] bg-sv-surface px-4 py-3 shadow-card"
              >
                <span className="grid h-9 w-9 place-items-center rounded-control bg-sv-blue/10">
                  <s.icon className="h-4 w-4 text-sv-blue" aria-hidden />
                </span>
                <div>
                  <dd className="text-[16px] font-black text-sv-ink">{s.value}</dd>
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-sv-ink/45">{s.label}</dt>
                </div>
              </div>
            ))}
          </dl>
        </header>

        {/* Filter chips — internal link mesh */}
        {(chips.dealSwitch || chips.types.length > 1 || chips.geo.length > 0) && (
          <div className="mb-8 space-y-3">
            {chips.dealSwitch && (
              <div className="flex flex-wrap gap-2">
                <Chip label={DEALS[def.dealSlug!]!.ka} href={def.path} active />
                <Chip label={chips.dealSwitch.label} href={chips.dealSwitch.href} />
              </div>
            )}
            {chips.types.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {chips.types.map((t) => (
                  <Chip key={t.href} label={t.label} href={t.href} active={t.active} />
                ))}
              </div>
            )}
            {chips.geo.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {chips.geo.map((g) => (
                  <Chip key={g.href} label={g.label} href={g.href} active={g.active} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Listings */}
        <section aria-label="განცხადებები" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {def.listings.map((l, i) => (
            <ListingCard key={l.id} l={l} i={i} />
          ))}
        </section>

        {/* SEO intro */}
        <section className="mt-14 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-10">
          <h2 className="text-[20px] font-black tracking-[-0.02em] text-sv-ink md:text-[24px]">
            {h1} — ბაზრის მიმოხილვა
          </h2>
          <p className="mt-3 max-w-[860px] text-[15px] font-medium leading-relaxed text-sv-ink/65">
            {introOf(def)}
          </p>
        </section>

        {/* FAQ */}
        <section className="mt-10" aria-label="ხშირად დასმული კითხვები">
          <h2 className="mb-5 text-[20px] font-black tracking-[-0.02em] text-sv-ink md:text-[24px]">
            ხშირად დასმული კითხვები
          </h2>
          <div className="grid gap-3">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-module border border-sv-ink/[0.06] bg-sv-surface px-5 py-4 shadow-card open:shadow-card-hover"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-extrabold text-sv-ink [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronRight className="h-4 w-4 shrink-0 text-sv-blue transition-transform duration-300 group-open:rotate-90" aria-hidden />
                </summary>
                <p className="mt-3 text-[14px] font-medium leading-relaxed text-sv-ink/60">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(seoLd(def)) }} />
    </div>
  )
}
