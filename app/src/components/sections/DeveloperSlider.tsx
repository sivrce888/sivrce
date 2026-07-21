'use client'

import LocalizedLink from '@/components/LocalizedLink'
import { Building2, ArrowRight, ShieldCheck } from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import HScroll from '@/components/HScroll'
import { DeveloperLogo } from '@/components/entities/DeveloperLogo'
import type { LocalName } from '@/data/professionals'

export type TopDeveloperCard = {
  slug: string
  name: LocalName
  city: string
  verified: boolean
  logoUrl?: string
  projectsDone: number
  listingsCount: number
}

export default function DeveloperSlider({
  developers,
  total,
}: {
  developers: TopDeveloperCard[]
  total: number
}) {
  if (developers.length === 0) return null

  return (
    <section className="relative overflow-hidden bg-sv-surface py-16 md:py-24">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sv-blue/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-blue">
              <Building2 className="h-3.5 w-3.5" /> ტოპ დეველოპერები
            </span>
            <h2 className="text-balance text-[28px] font-black tracking-[-0.02em] text-sv-ink md:text-[36px]">
              წამყვანი დეველოპერული კომპანიები
            </h2>
            <p className="mt-2 text-[14px] font-semibold text-sv-ink/65 md:text-[15px]">
              რეიტინგი აქტიური განცხადებებით — დაათვალიერე პროექტები და ობიექტები
            </p>
          </div>
          <LocalizedLink
            href="/developers"
            className="group flex items-center gap-2 text-[15px] font-extrabold text-sv-blue transition-colors hover:text-sv-blue-deep"
          >
            ყველა დეველოპერი ({total})
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </LocalizedLink>
        </Reveal>
      </div>

      <HScroll
        aria-label="დეველოპერების კარუსელი"
        step={340}
        className="gap-5 px-5 pb-4 md:px-10 lg:px-[max(2.5rem,calc((100vw-1440px)/2+2.5rem))]"
      >
        {developers.map((dev, i) => (
          <LocalizedLink
            key={dev.slug}
            href={`/developers/${dev.slug}`}
            className="group relative flex w-[280px] shrink-0 flex-col overflow-hidden rounded-card border border-sv-ink/[0.07] bg-gradient-to-b from-sv-cloud to-sv-surface p-5 transition-all duration-300 hover:-translate-y-1.5 hover:border-sv-blue/30 hover:shadow-card-hover"
          >
            <div className="flex items-center gap-3.5">
              <DeveloperLogo
                slug={dev.slug}
                name={dev.name}
                logoUrl={dev.logoUrl}
                size="sm"
                className="h-12 w-12"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sv-blue/10 text-[10px] font-black text-sv-blue"
                  >
                    {i + 1}
                  </span>
                  <h3 className="truncate text-[16px] font-black text-sv-ink transition-colors group-hover:text-sv-blue">
                    {dev.name.ka}
                  </h3>
                  {dev.verified && (
                    <ShieldCheck className="h-4 w-4 shrink-0 text-sv-blue" />
                  )}
                </div>
                <p className="truncate text-[12px] font-bold text-sv-ink/50">
                  {dev.city} · {dev.projectsDone} პროექტი
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-sv-ink/[0.06] pt-3 text-[13px] font-extrabold text-sv-ink/75">
              <span className="text-sv-ink/60">{dev.listingsCount} აქტიური</span>
              <span className="text-sv-blue group-hover:underline">პროექტები →</span>
            </div>
          </LocalizedLink>
        ))}
      </HScroll>
    </section>
  )
}
