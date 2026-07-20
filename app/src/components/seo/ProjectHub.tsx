import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, CalendarCheck, Building2, Star } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import CTA from '@/components/sections/CTA'
import Footer from '@/components/sections/Footer'
import { FaqSection } from '@/components/seo/FaqSection'
import { getDeveloper, type Project } from '@/data/professionals'
import { jsonLd } from '@/lib/utils'
import { langAlternates, OG_LOCALE } from '@/lib/i18n/server'
import type { Lang } from '@/lib/i18n/core'
import {
  MICRO,
  faqPageLd,
  finishLabel,
  pickLoc,
  unitsLabel,
  type DirLoc,
  type DirectoryHubCopy,
} from '@/lib/directory-seo'

/**
 * Shared new-build hub page — identical card/prose/FAQ pattern to
 * app/[lang]/projects/page.tsx, driven by a filtered project list + hub copy.
 * Used by /projects/tbilisi, /projects/batumi, /projects/batumi/sea-view,
 * /projects/installment, /projects/ready and /projects/tbilisi/[district].
 */
export function projectHubMetadata(path: string, lang: Lang, c: DirectoryHubCopy): Metadata {
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: path, languages: langAlternates(path) },
    openGraph: {
      title: c.ogTitle,
      description: c.description,
      type: 'website',
      url: `https://sivrce.ge${path}`,
      siteName: 'sivrce',
      locale: OG_LOCALE[lang],
      images: [{ url: 'https://sivrce.ge/images/og.jpg', alt: c.ogTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: c.ogTitle,
      description: c.description,
      images: ['https://sivrce.ge/images/og.jpg'],
    },
  }
}

export function ProjectHub({
  loc,
  c,
  projects,
}: {
  loc: DirLoc
  c: DirectoryHubCopy
  projects: Project[]
}) {
  const micro = MICRO[loc]
  const listLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: projects.length,
    itemListElement: projects.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.name,
      url: `https://sivrce.ge/projects/${p.slug}`,
      image: p.img.startsWith('http') ? p.img : `https://sivrce.ge${p.img}`,
    })),
  }

  return (
    <div className="min-h-screen bg-sv-surface">
      <Navbar />
      <main id="main" className="pt-16">
        <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 md:py-16">
          <h1 className="text-balance text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[40px]">
            {c.h1}
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] font-semibold text-sv-ink/65 md:text-[16px]">
            {c.sub}
          </p>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {projects.map((p) => {
              const dev = getDeveloper(p.developerSlug)
              return (
                <Link
                  key={p.slug}
                  href={`/projects/${p.slug}`}
                  aria-label={p.name}
                  className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue rounded-card"
                >
                  <article className="overflow-hidden rounded-card border border-sv-ink/[0.06] bg-sv-surface shadow-card transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-card-hover">
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <Image
                        src={p.img}
                        alt={p.name}
                        fill
                        sizes="(max-width:1024px) 100vw, 690px"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-sv-navy/75 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                        <div>
                          <h2 className="text-[22px] font-black text-white [text-shadow:0_2px_10px_rgba(5,11,38,0.55)]">
                            {p.name}
                          </h2>
                          {dev && (
                            <p className="text-[13px] font-bold text-white/80">{pickLoc(dev.name, loc)}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 rounded-control bg-white/95 px-3 py-1.5 text-[14px] font-black text-sv-navy">
                          <Star className="h-3.5 w-3.5 fill-sv-orange text-sv-orange" aria-hidden />
                          {p.rating}
                        </div>
                      </div>
                      <div className="absolute left-5 top-4 rounded-full bg-sv-navy/55 px-3.5 py-1.5 text-[12px] font-extrabold text-white backdrop-blur">
                        {micro.builtPct(p.done)}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 p-5">
                      <span className="flex items-center gap-1.5 text-[13px] font-bold text-sv-ink/55">
                        <MapPin className="h-4 w-4 text-sv-ink/35" aria-hidden /> {p.location}
                      </span>
                      <span className="flex items-center gap-1.5 text-[13px] font-bold text-sv-ink/55">
                        <CalendarCheck className="h-4 w-4 text-sv-ink/35" aria-hidden /> {micro.handover}{' '}
                        {finishLabel(loc, p.finish)}
                      </span>
                      <span className="flex items-center gap-1.5 text-[13px] font-bold text-sv-ink/55">
                        <Building2 className="h-4 w-4 text-sv-ink/35" aria-hidden /> {unitsLabel(p.flats, loc)}
                      </span>
                      <span className="ml-auto text-[16px] font-black text-sv-blue">
                        {p.priceFromM2}
                        <span className="text-[12px] font-bold text-sv-ink/60"> {micro.perM2From}</span>
                      </span>
                    </div>
                    <div className="mx-5 mb-5 h-1.5 overflow-hidden rounded-full bg-sv-ink/[0.07]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sv-blue to-sv-violet"
                        style={{ width: `${p.done}%` }}
                      />
                    </div>
                  </article>
                </Link>
              )
            })}
          </div>
        </section>

        {/* SEO prose — hub keyword block */}
        <section className="mx-auto max-w-[1440px] px-5 pb-12 md:px-10">
          <div className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-10">
            <h2 className="text-[20px] font-black tracking-[-0.02em] text-sv-ink md:text-[24px]">
              {c.proseTitle}
            </h2>
            {c.prose.map((para, i) => (
              <p
                key={i}
                className="mt-4 max-w-[860px] text-[15px] font-medium leading-[1.75] text-sv-ink/65"
              >
                {para}
              </p>
            ))}
          </div>
        </section>

        <FaqSection
          title={c.faqTitle}
          items={c.faqs}
          className="mx-auto max-w-[1440px] px-5 pb-16 md:px-10"
        />
        <CTA />
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(listLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqPageLd(c.faqs)) }} />
    </div>
  )
}
