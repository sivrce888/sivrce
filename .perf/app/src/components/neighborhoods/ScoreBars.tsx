'use client'

import { Bus, GraduationCap, TreePine, ShieldCheck, Martini } from 'lucide-react'
import type { LivabilityScores } from '@/data/neighborhoods'
import { useNb } from './i18n'

const CATEGORIES = [
  { key: 'transport', Icon: Bus },
  { key: 'schools', Icon: GraduationCap },
  { key: 'green', Icon: TreePine },
  { key: 'safety', Icon: ShieldCheck },
  { key: 'nightlife', Icon: Martini },
] as const

/** Five accessible score bars (role="meter") for a neighborhood detail page. */
export default function ScoreBars({ scores }: { scores: LivabilityScores }) {
  const s = useNb()
  return (
    <ul className="space-y-4">
      {CATEGORIES.map(({ key, Icon }) => {
        const value = scores[key]
        return (
          <li key={key} className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-sv-blue/10 text-sv-blue">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <span className="text-[14px] font-extrabold text-sv-ink">{s[key]}</span>
                <span className="text-[13px] font-black text-sv-blue">{value}/10</span>
              </div>
              <div
                role="meter"
                aria-label={s[key]}
                aria-valuemin={0}
                aria-valuemax={10}
                aria-valuenow={value}
                className="h-2 overflow-hidden rounded-full bg-sv-ink/[0.07]"
              >
                <div
                  className="h-full rounded-full bg-sv-blue transition-[width] duration-700"
                  style={{ width: `${value * 10}%` }}
                />
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
