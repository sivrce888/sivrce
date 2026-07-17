import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, CalendarCheck, Building2, Star } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import CTA from '@/components/sections/CTA'
import Footer from '@/components/sections/Footer'
import { PROJECTS, getDeveloper } from '@/data/professionals'
import { jsonLd } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'ახალი პროექტები თბილისში და ბათუმში — მშენებარე კორპუსები',
  description:
    'ახალი საცხოვრებელი პროექტები თბილისში და ბათუმში: დეველოპერების შეფასებები, ფასები კვადრატულზე, მშენებლობის პროგრესი და ჩაბარების ვადები — ყველა პროექტი ერთ სივრცეში.',
  alternates: { canonical: '/projects' },
  openGraph: {
    title: 'ახალი პროექტები თბილისში და ბათუმში | sivrce',
    description:
      'დეველოპერების შეფასებები, ფასები კვადრატულზე, მშენებლობის პროგრესი — ყველა ახალი პროექტი ერთ სივრცეში.',
    type: 'website',
  },
}

export default function ProjectsPage() {
  const listLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: PROJECTS.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.name,
      url: `https://sivrce.ge/projects/${p.slug}`,
    })),
  }

  return (
    <div className="min-h-screen bg-sv-surface">
      <Navbar />
      <main id="main" className="pt-16">
        <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 md:py-16">
          <h1 className="text-balance text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[40px]">
            მშენებარე პროექტები
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] font-semibold text-sv-ink/65 md:text-[16px]">
            ყველა დეველოპერი, ყველა პროექტი — შეფასებებით, ფასებითა და ჩაბარების ვადებით
          </p>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {PROJECTS.map((p) => {
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
                            <p className="text-[13px] font-bold text-white/80">{dev.name.ka}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 rounded-control bg-white/95 px-3 py-1.5 text-[14px] font-black text-sv-navy">
                          <Star className="h-3.5 w-3.5 fill-sv-orange text-sv-orange" aria-hidden />
                          {p.rating}
                        </div>
                      </div>
                      <div className="absolute left-5 top-4 rounded-full bg-sv-navy/55 px-3.5 py-1.5 text-[12px] font-extrabold text-white backdrop-blur">
                        აშენებულია {p.done}%
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 p-5">
                      <span className="flex items-center gap-1.5 text-[13px] font-bold text-sv-ink/55">
                        <MapPin className="h-4 w-4 text-sv-ink/35" aria-hidden /> {p.location}
                      </span>
                      <span className="flex items-center gap-1.5 text-[13px] font-bold text-sv-ink/55">
                        <CalendarCheck className="h-4 w-4 text-sv-ink/35" aria-hidden /> ჩაბარება{' '}
                        {p.finish}
                      </span>
                      <span className="flex items-center gap-1.5 text-[13px] font-bold text-sv-ink/55">
                        <Building2 className="h-4 w-4 text-sv-ink/35" aria-hidden /> {p.flats} ბინა
                      </span>
                      <span className="ml-auto text-[16px] font-black text-sv-blue">
                        {p.priceFromM2}
                        <span className="text-[12px] font-bold text-sv-ink/60"> /მ²-დან</span>
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
        <CTA />
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(listLd) }} />
    </div>
  )
}
