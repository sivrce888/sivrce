'use client'

import { Building2, Users, Award, TrendingUp } from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import { useI18n } from '@/lib/i18n/context'
import type { CmsBlockKey } from '@/lib/cms-blocks'
import type { HomeStats } from '@/lib/home-stats'

const STATS = [
  { icon: Building2, n: 1 as const, live: 'listings' as const },
  { icon: Users, n: 2 as const, live: 'professionals' as const },
  { icon: TrendingUp, n: 3 as const, live: 'projects' as const },
  { icon: Award, n: 4 as const, live: 'cities' as const },
]

// No orphan rows: 4 → 2×2 / 1×4, 3 → stack / 1×3, 2 → 1×2.
const COLS: Record<number, string> = { 2: 'grid-cols-2', 3: 'sm:grid-cols-3', 4: 'grid-cols-2 lg:grid-cols-4' }

export default function Stats({ live }: { live: HomeStats }) {
  const { b } = useI18n()
  const shown = STATS.filter((s) => live[s.live] > 0)
  // One stranded tile in a 2-col grid reads as broken — an outage hides the band.
  if (shown.length < 2) return null
  return (
    <section className="relative bg-sv-cloud py-20 md:py-28">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <div className={`grid gap-3 sm:gap-4 ${COLS[shown.length]}`}>
          {shown.map((s, i) => {
            const label = b(`home.stats.${s.n}.label` as CmsBlockKey)
            const target = live[s.live]
            return (
              <Reveal key={s.n} delay={i * 0.02} className="h-full">
                <div className="h-full rounded-card border border-sv-ink/[0.06] bg-sv-surface p-4 sm:p-6">
                  <div className="mb-5 grid h-11 w-11 place-items-center rounded-module bg-sv-blue/10 text-sv-blue-deep dark:text-sv-blue-light">
                    <s.icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="text-[34px] font-black tabular-nums tracking-tight text-sv-ink md:text-[38px]">
                    {/* Real number in the HTML — crawlers, no-JS and first paint never see "0"; exact counts, no "+" padding. */}
                    {target.toLocaleString('en-US')}
                  </div>
                  <div className="mt-1 text-[13px] font-extrabold text-sv-ink/85 sm:text-[14px]">{label}</div>
                  <div className="mt-0.5 text-[12px] font-semibold text-sv-ink/65">
                    {b(`home.stats.${s.n}.sub` as CmsBlockKey)}
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
