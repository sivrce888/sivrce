'use client'

import { Map } from 'lucide-react'
import { NEIGHBORHOODS } from '@/data/neighborhoods'
import { LISTINGS } from '@/data/listings'
import { Reveal } from '@/components/Reveal'
import NeighborhoodCard from './NeighborhoodCard'
import { useNb } from './i18n'

function countListings(districts: string[]): number {
  return LISTINGS.filter((l) => districts.includes(l.district)).length
}

/** /neighborhoods index — card grid with score badge + avg price per m². */
export default function NeighborhoodsIndex() {
  const s = useNb()
  return (
    <section className="bg-sv-cloud py-20 md:py-28">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <Reveal className="mb-10">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sv-blue/10 px-4 py-1.5 text-[12px] font-black uppercase tracking-wider text-sv-blue">
            <Map className="h-3.5 w-3.5" /> {s.badge}
          </span>
          <h1 className="text-balance text-[30px] font-black tracking-[-0.02em] text-sv-ink md:text-[40px]">
            {s.indexTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] font-semibold text-sv-ink/65 md:text-[16px]">
            {s.indexSub}
          </p>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {NEIGHBORHOODS.map((n, i) => (
            <Reveal key={n.slug} delay={(i % 3) * 0.1}>
              <NeighborhoodCard n={n} count={countListings(n.districts)} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
