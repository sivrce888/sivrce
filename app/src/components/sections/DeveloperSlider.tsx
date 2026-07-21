'use client'

import LocalizedLink from '@/components/LocalizedLink'
import Image from 'next/image'
import { Building2, ArrowRight, ShieldCheck, Star } from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import HScroll from '@/components/HScroll'
import { DEVELOPERS } from '@/data/professionals'

export default function DeveloperSlider() {
  // Select top verified developers with projects done & ratings
  const topDevs = DEVELOPERS.slice(0, 16)

  return (
    <section className="relative overflow-hidden bg-sv-surface py-16 md:py-24">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sv-blue/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-blue">
              <Building2 className="h-3.5 w-3.5" /> დეველოპერები
            </span>
            <h2 className="text-balance text-[28px] font-black tracking-[-0.02em] text-sv-ink md:text-[36px]">
              წამყვანი დეველოპერული კომპანიები
            </h2>
            <p className="mt-2 text-[14px] font-semibold text-sv-ink/65 md:text-[15px]">
              დაათვალიერე დეველოპერების ყველა მშენებარე და დასრულებული პროექტი
            </p>
          </div>
          <LocalizedLink
            href="/developers"
            className="group flex items-center gap-2 text-[15px] font-extrabold text-sv-blue transition-colors hover:text-sv-blue-deep"
          >
            ყველა დეველოპერი ({DEVELOPERS.length})
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </LocalizedLink>
        </Reveal>
      </div>

      <HScroll
        aria-label="დეველოპერების კარუსელი"
        step={340}
        className="gap-5 px-5 pb-4 md:px-10 lg:px-[max(2.5rem,calc((100vw-1440px)/2+2.5rem))]"
      >
        {topDevs.map((dev) => {
          const logo = dev.logoUrl || '/logo/board1x1/mark.png'
          return (
            <LocalizedLink
              key={dev.slug}
              href={`/developers/${dev.slug}`}
              className="group relative flex w-[280px] shrink-0 flex-col overflow-hidden rounded-card border border-sv-ink/[0.07] bg-gradient-to-b from-sv-cloud to-sv-surface p-5 transition-all duration-300 hover:-translate-y-1.5 hover:border-sv-blue/30 hover:shadow-card-hover"
            >
              <div className="flex items-center gap-3.5">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-module bg-sv-surface p-1 shadow-sm border border-sv-ink/[0.06]">
                  <Image
                    src={logo}
                    alt={dev.name.ka}
                    fill
                    className="object-contain p-1"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate text-[16px] font-black text-sv-ink group-hover:text-sv-blue transition-colors">
                      {dev.name.ka}
                    </h3>
                    {dev.verified && (
                      <ShieldCheck className="h-4 w-4 shrink-0 text-sv-blue" />
                    )}
                  </div>
                  <p className="text-[12px] font-bold text-sv-ink/50 truncate">
                    {dev.city} • {dev.projectsDone} პროექტი
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-sv-ink/[0.06] pt-3 text-[13px] font-extrabold text-sv-ink/75">
                <span className="flex items-center gap-1 text-sv-ink/60">
                  <Star className="h-3.5 w-3.5 fill-sv-orange text-sv-orange" />
                  <span>4.9 / 5</span>
                </span>
                <span className="text-sv-blue group-hover:underline">
                  პროექტები →
                </span>
              </div>
            </LocalizedLink>
          )
        })}
      </HScroll>
    </section>
  )
}
