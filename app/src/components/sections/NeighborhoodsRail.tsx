'use client'

import LocalizedLink from '@/components/LocalizedLink'
import { ArrowRight, MapPin } from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import HScroll from '@/components/HScroll'
import NeighborhoodCard, { type NeighborhoodCardData } from '@/components/neighborhoods/NeighborhoodCard'
import { useI18n } from '@/lib/i18n/context'

/** Homepage neighborhoods rail — items resolved server-side (HomeMain). */
export default function NeighborhoodsRail({
  items,
}: {
  items: (NeighborhoodCardData & { count: number })[]
}) {
  const { b } = useI18n()
  if (items.length === 0) return null

  return (
    <section id="neighborhoods" className="bg-sv-cloud py-20 md:py-28">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sv-blue/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-blue-deep dark:text-sv-blue-light">
              <MapPin className="h-3.5 w-3.5" /> {b('home.nb.kicker')}
            </span>
            <h2 className="sv-h2 text-sv-ink">
              {b('home.nb.title')}
            </h2>
            <p className="mt-2 max-w-xl text-[15px] font-semibold text-sv-ink/65 md:text-[16px]">
              {b('home.nb.sub')}
            </p>
          </div>
          <LocalizedLink
            href="/neighborhoods"
            className="group flex items-center gap-2 text-[15px] font-extrabold text-sv-blue-deep dark:text-sv-blue-light transition-colors duration-200 hover:text-sv-blue"
          >
            {b('home.nb.viewAll')}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </LocalizedLink>
        </Reveal>
        <HScroll aria-label={b('home.nb.title')} step={420} className="gap-6 pb-2 pt-2">
          {items.map((n) => (
            <div key={n.slug} className="w-[min(85%,380px)] shrink-0">
              <NeighborhoodCard n={n} count={n.count} />
            </div>
          ))}
        </HScroll>
      </div>
    </section>
  )
}
