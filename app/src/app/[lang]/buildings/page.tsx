import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Building2, Star, Navigation } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import CTA from '@/components/sections/CTA'
import Footer from '@/components/sections/Footer'
import { BUILDINGS, buildingDealCounts } from '@/data/buildings'
import { getDeveloper } from '@/data/professionals'
import { DEAL_BRAND } from '@/lib/category-brand'
import { jsonLd } from '@/lib/utils'
import { langAlternates } from '@/lib/i18n/server'

export const metadata: Metadata = {
  title: 'შენობები და კორპუსები — თბილისი, ბათუმი',
  description:
    'ცნობილი კორპუსები თბილისსა და ბათუმში — კოდი, მისამართი, დეველოპერი, განცხადებები.',
  alternates: { canonical: '/buildings', languages: langAlternates('/buildings') },
  openGraph: {
    title: 'შენობები და კორპუსები | sivrce',
    description: 'კორპუსების კატალოგი — მისამართი, დეველოპერი, განცხადებები.',
    type: 'website',
  },
}

export default function BuildingsPage() {
  const listLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: BUILDINGS.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.name,
      url: `https://sivrce.ge/buildings/${b.slug}`,
    })),
  }

  return (
    <div className="min-h-screen bg-sv-surface">
      <Navbar />
      <main id="main" className="pt-16">
        <section className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 md:py-16">
          <h1 className="text-balance text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[40px]">
            შენობები და კორპუსები
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] font-semibold text-sv-ink/65 md:text-[16px]">
            კორპუსის კოდი, მისამართი და განცხადებები — აირჩიე შენობა და გახსენი დეტალები
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BUILDINGS.map((b) => {
              const dev = getDeveloper(b.developerSlug)
              const counts = buildingDealCounts(b.slug)
              const total = counts.sale + counts.rent + counts.daily + counts.pledge
              return (
                <Link
                  key={b.slug}
                  href={`/buildings/${b.slug}`}
                  aria-label={`${b.name} ${b.code}`}
                  className="group block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
                >
                  <article className="overflow-hidden rounded-card border border-sv-ink/[0.06] bg-sv-surface shadow-card transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-card-hover">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={b.img}
                        alt={b.name}
                        fill
                        sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 440px"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-sv-navy/75 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2">
                        <div className="min-w-0">
                          <h2 className="truncate text-[20px] font-black text-white [text-shadow:0_2px_10px_rgba(5,11,38,0.55)]">
                            {b.name}
                          </h2>
                          {dev && (
                            <p className="text-[12px] font-bold text-white/80">{dev.name.ka}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-1 rounded-control bg-white/95 px-2.5 py-1.5 text-[13px] font-black text-sv-navy">
                          <Star className="h-3.5 w-3.5 fill-sv-orange text-sv-orange" aria-hidden />
                          {b.rating}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3 p-4">
                      <p className="flex items-center gap-1.5 text-[13px] font-semibold text-sv-ink/55">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{b.address}</span>
                      </p>
                      <p className="flex items-center gap-1.5 text-[11px] font-bold text-sv-ink/40">
                        <Navigation className="h-3 w-3" />
                        {b.coords.lat.toFixed(5)}, {b.coords.lng.toFixed(5)}
                      </p>
                      <div className="flex flex-wrap gap-2 text-[11px] font-extrabold">
                        <span style={{ color: DEAL_BRAND.sale }}>{counts.sale} იყიდება</span>
                        <span style={{ color: DEAL_BRAND.rent }}>{counts.rent} ქირა</span>
                        <span style={{ color: DEAL_BRAND.daily }}>{counts.daily} დღე</span>
                        <span style={{ color: DEAL_BRAND.pledge }}>{counts.pledge} გირავნ.</span>
                      </div>
                      <p className="inline-flex items-center gap-1.5 text-[12px] font-bold text-sv-ink/45">
                        <Building2 className="h-3.5 w-3.5" />
                        {total} განცხადება · {b.floors} სართ.
                      </p>
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
