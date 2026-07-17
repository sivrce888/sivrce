'use client'

import { BadgeCheck, MapPin, Phone } from 'lucide-react'
import { SERVICE_BRAND } from '@/lib/category-brand'
import type { LocalName } from '@/data/professionals'
import { StatsRow, type StatItem } from './StatsRow'
import { useEntities, pick, localizeCity, type EntitiesKey } from './i18n'

export interface EntityHeaderProps {
  kind: 'developer' | 'agent'
  name: LocalName
  city: string
  verified: boolean
  /** E.164-ish display phone; rendered as tel: link */
  phone: string
  /** numeric stats keyed to i18n labels */
  stats: { key: EntitiesKey; value: string | number }[]
  /** agency name (agents) or tagline context */
  subtitle?: string
}

export function EntityHeader({ kind, name, city, verified, phone, stats, subtitle }: EntityHeaderProps) {
  const { lang, d } = useEntities()
  const brand = SERVICE_BRAND[kind === 'developer' ? 'developers' : 'agents']
  const displayName = pick(name, lang)
  const telHref = `tel:${phone.replace(/\s+/g, '')}`

  const items: StatItem[] = stats.map((s) => ({ label: d[s.key], value: String(s.value) }))

  return (
    <header className="border-b border-sv-ink/[0.06] bg-sv-cloud">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between md:px-10 md:py-14">
        <div className="flex items-start gap-5">
          <span
            aria-hidden
            className="grid h-20 w-20 shrink-0 place-items-center rounded-card text-[28px] font-black md:h-24 md:w-24"
            style={{ color: brand.hue, backgroundColor: brand.chip }}
          >
            {displayName
              .split(/\s+/)
              .map((w) => w[0] ?? '')
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </span>
          <div>
            <span
              className="mb-2 inline-block rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider"
              style={{ color: brand.hue, backgroundColor: brand.chip }}
            >
              {kind === 'developer' ? d.developer : d.agent}
            </span>
            <h1 className="flex flex-wrap items-center gap-2 text-[28px] font-black tracking-[-0.02em] text-sv-ink md:text-[36px]">
              {displayName}
              {verified && (
                <BadgeCheck className="h-6 w-6 text-sv-success" aria-label={d.verified} />
              )}
            </h1>
            <p className="mt-1.5 flex items-center gap-1.5 text-[14px] font-bold text-sv-ink/55">
              <MapPin className="h-4 w-4 text-sv-ink/35" aria-hidden />
              {localizeCity(city, lang)}
              {subtitle ? ` · ${subtitle}` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5 md:items-end">
          <StatsRow items={items} />
          <a
            href={telHref}
            aria-label={`${d.call}: ${displayName}, ${phone}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-sv-blue px-6 text-[15px] font-extrabold text-white transition-colors duration-200 hover:bg-sv-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
          >
            <Phone className="h-4 w-4" aria-hidden />
            {phone}
          </a>
        </div>
      </div>
    </header>
  )
}
