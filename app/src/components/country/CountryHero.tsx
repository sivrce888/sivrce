import { BadgeCheck, Landmark, ShieldCheck } from 'lucide-react'
import HeroBackground from '@/components/sections/HeroBackground'
import CountrySearch, { type CountryCityChip } from '@/components/country/CountrySearch'
import { MARKETS, type PathCountryId } from '@/lib/markets'
import { COUNTRY_NAMES, heroPair, type CountryCopy } from '@/lib/country-copy'
import { mapHrefForPlace } from '@/lib/map/map-href'
import { cityBySlug } from '@/lib/map/user-place'
import { marketCenter } from '@/lib/geo-market'
import type { Lang } from '@/lib/i18n/core'

const TRUST: Record<string, [string, string, string]> = {
  de: ['Street-verified new-builds', 'Notary & Grundbuch', '3D map'],
  ae: ['Freehold zones', 'RERA escrow', '3D map'],
}

const TRUST_DE: [string, string, string] = ['Straßenverifizierte Neubauten', 'Notar & Grundbuch', '3D-Karte']

const TRUST_DEFAULT: [string, string, string] = [
  'City guides live',
  'Verified listings as they land',
  '3D map',
]

export default function CountryHero({
  country,
  copy,
  city,
  intent,
  cities,
  lang = 'en',
}: {
  country: PathCountryId
  copy: CountryCopy
  city?: string
  intent?: 'buy' | 'rent'
  cities: CountryCityChip[]
  lang?: Lang
}) {
  const pair = heroPair(copy.h1)
  const market = MARKETS[country]
  const pin = city ? cityBySlug(city) : null
  const cam = pin ?? marketCenter(country)
  const mapHref = mapHrefForPlace(cam.lat, cam.lng, 12.8, market.countryCode)
  const trust = country === 'de' && lang === 'de' ? TRUST_DE : (TRUST[country] ?? TRUST_DEFAULT)
  const countryLabel = country === 'de' && lang === 'de' ? 'Deutschland' : COUNTRY_NAMES[country]
  const icons = [BadgeCheck, ShieldCheck, Landmark] as const

  return (
    <section className="relative min-h-[calc(100svh-var(--sv-dock))] overflow-x-clip bg-sv-cloud dark:bg-sv-navy">
      <HeroBackground />
      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-var(--sv-dock))] max-w-[1440px] flex-col items-center justify-center px-5 pb-24 pt-[calc(9rem+env(safe-area-inset-top,0px))] md:px-10">
        <div className="flex flex-col items-center">
          <div className="mb-5 flex items-center gap-2.5 rounded-full glass-hero px-5 py-2 shadow-card">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-sv-blue dark:bg-sv-success" />
            <span className="text-[13px] font-bold leading-snug tracking-wide text-sv-ink/80 dark:text-white/90 md:text-[14px]">
              {countryLabel} · {market.currency}
            </span>
          </div>

          <h1 className="w-full max-w-full text-balance text-center text-[length:var(--sv-type-display)] font-black tracking-[-0.035em] text-sv-ink dark:text-white">
            {pair.place ? (
              <>
                <span className="block">{pair.lead}</span>
                <span className="text-gradient-blue text-gradient-shimmer">{pair.place}</span>
              </>
            ) : (
              copy.h1
            )}
          </h1>

          <p
            className="speakable-lead mt-4 w-full max-w-[min(56rem,100%)] text-pretty text-center text-[length:var(--sv-type-lead)] font-medium leading-[1.4] tracking-[-0.012em] text-sv-ink/60 dark:text-white/75 sm:mt-5"
            role="doc-subtitle"
          >
            {copy.lede}
          </p>
        </div>

        <CountrySearch
          country={country}
          city={city}
          intent={intent}
          cities={cities}
          mapHref={mapHref}
          showProjects={country === 'de'}
        />

        <div
          className="sv-hero-in mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-4"
          style={{ animationDelay: '0.3s' }}
        >
          {trust.map((label, i) => {
            const Icon = icons[i] ?? BadgeCheck
            return (
              <div key={label} className="flex items-center gap-2.5 text-sv-ink/60 dark:text-white/75">
                <Icon className="h-[18px] w-[18px] text-sv-blue dark:text-sv-success" />
                <span className="text-[13px] font-bold leading-snug md:text-[14px]">{label}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div
        className="sv-hero-in absolute bottom-[calc(1.5rem+var(--sv-dock))] left-1/2 z-10 -translate-x-1/2"
        style={{ animationDelay: '0.5s' }}
      >
        <div className="flex h-12 w-7 items-start justify-center rounded-full border-2 border-sv-ink/20 p-1.5 dark:border-white/25">
          <span className="animate-scroll-hint h-2 w-2 rounded-full bg-sv-ink/50 dark:bg-white/70" />
        </div>
      </div>
    </section>
  )
}
