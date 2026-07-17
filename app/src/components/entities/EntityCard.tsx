'use client'

import Link from 'next/link'
import { BadgeCheck, MapPin, Star } from 'lucide-react'
import { SERVICE_BRAND } from '@/lib/category-brand'
import type { LocalName } from '@/data/professionals'
import { useEntities, pick, localizeCity } from './i18n'

export interface EntityCardProps {
  kind: 'developer' | 'agent'
  slug: string
  name: LocalName
  city: string
  yearsActive: number
  /** pre-computed deterministic listings count */
  listingsCount: number
  verified: boolean
  /** server-fetched review aggregate; null → "reviews soon" placeholder */
  aggregate: { average: number; count: number } | null
}

function initials(enName: string): string {
  return enName
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function EntityCard({
  kind,
  slug,
  name,
  city,
  yearsActive,
  listingsCount,
  verified,
  aggregate,
}: EntityCardProps) {
  const { lang, d } = useEntities()
  const brand = SERVICE_BRAND[kind === 'developer' ? 'developers' : 'agents']
  const href = `/${kind === 'developer' ? 'developers' : 'agents'}/${slug}`

  return (
    <Link
      href={href}
      aria-label={`${pick(name, lang)} — ${d.viewProfile}`}
      className="group block rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card transition-all duration-500 hover:-translate-y-1.5 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
    >
      <div className="flex items-center gap-4">
        <span
          aria-hidden
          className="grid h-14 w-14 shrink-0 place-items-center rounded-module text-[18px] font-black"
          style={{ color: brand.hue, backgroundColor: brand.chip }}
        >
          {initials(name.en)}
        </span>
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 truncate text-[17px] font-black text-sv-ink">
            {pick(name, lang)}
            {verified && (
              <BadgeCheck className="h-4 w-4 shrink-0 text-sv-success" aria-label={d.verified} />
            )}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-[13px] font-bold text-sv-ink/55">
            <MapPin className="h-3.5 w-3.5 text-sv-ink/35" aria-hidden />
            {localizeCity(city, lang)} · {yearsActive} {d.yearsActive}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-sv-ink/[0.06] pt-4">
        <span className="text-[13px] font-bold text-sv-ink/55">
          {listingsCount} {d.listingsShort}
        </span>
        {aggregate ? (
          <span className="flex items-center gap-1 text-[14px] font-black text-sv-navy">
            <Star className="h-3.5 w-3.5 fill-sv-orange text-sv-orange" aria-hidden />
            {aggregate.average.toFixed(1)}
            <span className="text-[12px] font-bold text-sv-ink/50">
              ({aggregate.count} {d.reviewsCount})
            </span>
          </span>
        ) : (
          <span className="text-[12px] font-bold text-sv-ink/40">{d.reviewsSoon}</span>
        )}
      </div>
    </Link>
  )
}
