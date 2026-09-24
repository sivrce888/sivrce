'use client'

import { NEIGHBORHOODS, overallScore, pick } from '@/data/neighborhoods'
import { useI18n } from '@/lib/i18n/context'
import { Reveal } from '@/components/Reveal'
import { PageHero } from '@/components/PageHero'
import NeighborhoodCard from './NeighborhoodCard'
import { useNb } from './i18n'

/** /neighborhoods index — counts from DB (passed in), never mock inventory. */
export default function NeighborhoodsIndex({
  counts,
  liveAvg = {},
}: {
  counts: Record<string, number>
  /** live avg $/m² by slug — same source as the detail page */
  liveAvg?: Record<string, number>
}) {
  const s = useNb()
  const { lang } = useI18n()
  return (
    <>
      <PageHero tone="light" kicker={s.badge} title={s.indexTitle} subtitle={s.indexSub} />
      <section className="bg-sv-cloud pb-20 md:pb-28">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {NEIGHBORHOODS.map((n, i) => {
              const count = n.districts.reduce((sum, d) => sum + (counts[d] ?? 0), 0)
              return (
                <Reveal key={n.slug} delay={(i % 3) * 0.1}>
                  <NeighborhoodCard
                    n={{
                      slug: n.slug,
                      name: pick(n.name, lang),
                      city: pick(n.city, lang),
                      img: n.img,
                      score: overallScore(n),
                      avgPriceM2USD: liveAvg[n.slug] ?? n.avgPriceM2USD,
                    }}
                    count={count}
                  />
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
