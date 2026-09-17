'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronDown, MapPin, Search } from 'lucide-react'
import { DEAL_BRAND } from '@/lib/category-brand'
import { MARKETS, countryBasePath, intentHref, type PathCountryId } from '@/lib/markets'
import { COUNTRY_NAMES } from '@/lib/country-copy'
import { cityBySlug } from '@/lib/map/user-place'
import { useI18n, localizedHref } from '@/lib/i18n/context'
import { DE_CITIES } from '@/lib/countries/de'
import { usePostHog } from '@/lib/posthog'
import SearchSuggest from '@/components/search/SearchSuggest'
import PropertyTypePicker from '@/components/search/PropertyTypePicker'
import type { PropType } from '@/data/listings'

const fieldBtn =
  'flex h-12 w-full items-center gap-2 rounded-full px-3.5 text-left text-sv-ink transition-colors hover:bg-sv-ink/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue/30 dark:text-white'
const fieldCap = 'block truncate text-[10px] font-extrabold uppercase tracking-[0.06em] text-sv-ink/60 dark:text-white/40'
const fieldVal = 'block truncate text-[14px] font-extrabold tracking-[-0.01em]'

/** Rotating natural-language examples for German users — every one is
 *  parse-verified against lib/nl-search (see nl-search.check.ts pattern). */
const DE_NL_EXAMPLES = [
  '2-Zimmer-Wohnung in Berlin unter 700.000 €',
  'Mietwohnung mit Balkon in Mitte',
  'Haus mit Garten in München kaufen',
  'Ruhige 3-Zimmer-Wohnung in Prenzlauer Berg, kein Erdgeschoss',
]

const AE_NL_EXAMPLES = [
  '2-bed apartment in Dubai Marina',
  'Villa in Arabian Ranches with pool',
  'Off-plan apartment in JVC',
  'Rent in Downtown Dubai, Ejari ready',
]

type Tab = 'buy' | 'rent' | 'projects'

export type CountryCityChip = { slug: string; name: string }

export default function CountrySearch({
  country,
  city,
  intent,
  cities,
  showProjects = false,
}: {
  country: PathCountryId
  city?: string
  intent?: 'buy' | 'rent'
  cities: CountryCityChip[]
  showProjects?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { t, lang } = useI18n()
  const [tab, setTab] = useState<Tab>(intent === 'rent' ? 'rent' : 'buy')
  const [picked, setPicked] = useState<string | null>(null)
  const citySlug = city ?? picked ?? MARKETS[country].defaultCitySlug
  const [q, setQ] = useState('')
  const [propType, setPropType] = useState<PropType | undefined>(undefined)
  const { capture } = usePostHog()
  const deNl = country === 'de' && lang === 'de'
  const aeNl = country === 'ae' && lang !== 'ar'
  const [exIdx, setExIdx] = useState(0)

  // Rotate NL example placeholder while the box is untouched (typing pauses it).
  useEffect(() => {
    if (!deNl && !aeNl) return
    const n = deNl ? DE_NL_EXAMPLES.length : AE_NL_EXAMPLES.length
    const id = setInterval(() => setExIdx((i) => (i + 1) % n), 4000)
    return () => clearInterval(id)
  }, [deNl, aeNl])

  useEffect(() => {
    if (city) return
    let cancelled = false
    const iso = MARKETS[country].countryCode
    ;(async () => {
      try {
        const res = await fetch('/api/geo')
        if (!res.ok || cancelled) return
        const data = (await res.json()) as { ok: true; slug: string; cc: string } | { ok: false }
        if (!data.ok || cancelled) return
        if (data.cc !== iso) return
        if (!cities.some((c) => c.slug === data.slug)) return
        // IP city aims the picker. Do not hijack /{cc} hub URLs — proxy already
        // city-routes sivrce.com/; country briefings must stay crawlable.
        setPicked(data.slug)
      } catch {
        /* offline — keep default city */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [country, cities, city])

  const cityName = cities.find((c) => c.slug === citySlug)?.name ?? citySlug
  const prefix = countryBasePath(country, pathname)
  const tabs: { id: Tab; label: string; hue: string }[] = [
    { id: 'buy', label: t('search.sale'), hue: DEAL_BRAND.sale },
    { id: 'rent', label: t('search.rent'), hue: DEAL_BRAND.rent },
    ...(showProjects ? [{ id: 'projects' as const, label: t('nav.projects'), hue: DEAL_BRAND.newProjects }] : []),
  ]

  const submit = async () => {
    const { routeCountryNl } = await import('@/lib/nl-search')
    const pin = cityBySlug(citySlug)
    const deCity = country === 'de' ? DE_CITIES.find((c) => c.slug === citySlug) : undefined
    const routed = routeCountryNl({
      q,
      tab,
      country,
      cityKa: deCity?.ka ?? pin?.ka,
      lat: pin?.lat ?? deCity?.center.lat ?? 0,
      lng: pin?.lng ?? deCity?.center.lng ?? 0,
      kind: propType,
    })
    if (routed.go === 'projects') {
      document.getElementById('new-builds')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    if (q.trim()) capture('search_country_submitted', { country, tab, nl: routed.go === 'search' })
    // Listings first ('search'); map stays for planning-layer queries (B-Plan etc.).
    router.push(localizedHref(routed.href, lang))
  }

  const chipHref = (slug: string) =>
    tab === 'projects' ? `${prefix}/${slug}` : intentHref(country, slug, tab, lang, pathname)

  const chips = cities.filter((c) => c.slug !== citySlug).slice(0, 8)

  return (
    <div className="sv-hero-in mx-auto mt-11 w-full min-w-0 max-w-[1100px]" style={{ animationDelay: '0.16s' }}>
      <div
        className="mx-auto mb-2.5 grid w-full grid-cols-2 gap-1 rounded-tile glass-hero p-1 sm:flex sm:w-fit sm:flex-wrap sm:rounded-full lg:flex-nowrap"
        role="tablist"
        aria-label={t('search.dealType')}
      >
        {tabs.map((item) => {
          const on = tab === item.id
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(item.id)}
              className={`relative w-full rounded-full px-2.5 py-2 text-center text-[12.5px] font-extrabold leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-cloud dark:focus-visible:ring-offset-sv-navy sm:w-auto sm:px-4 sm:py-2.5 sm:text-[14px] lg:px-5 ${
                item.id === 'projects' ? 'col-span-2 sm:col-auto' : ''
              } ${on ? 'bg-white text-sv-navy shadow-card' : 'text-sv-ink/60 hover:text-sv-ink dark:text-white/75 dark:hover:text-white'}`}
            >
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.hue }} aria-hidden />
                {item.label}
              </span>
            </button>
          )
        })}
      </div>

      <form
        role="search"
        aria-label={t('nav.search')}
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
        className="relative z-[60] w-full min-w-0 overflow-visible rounded-tile bg-sv-surface/90 p-1.5 shadow-card ring-1 ring-white/80 backdrop-blur-2xl focus-within:ring-sv-blue/25 dark:bg-white/[0.10] dark:shadow-panel-dark dark:ring-white/14 lg:rounded-full lg:p-1.5"
      >
        <div className="flex flex-col gap-1.5 lg:flex-row lg:items-center">
          {tab !== 'projects' && (
            <>
              <PropertyTypePicker
                variant="hero"
                value={propType}
                onChange={setPropType}
                className="shrink-0"
              />
              <span className="hidden h-7 w-px shrink-0 bg-sv-ink/10 dark:bg-white/15 lg:block" aria-hidden />
            </>
          )}
          <label className={`${fieldBtn} relative lg:w-[216px] lg:max-w-[216px] lg:shrink-0`}>
            <MapPin className={`h-4 w-4 shrink-0 ${citySlug ? 'text-sv-blue' : 'text-sv-ink/35 dark:text-white/40'}`} />
            <span className="min-w-0 flex-1">
              <span className={fieldCap}>{t('loc.where')}</span>
              <span className={fieldVal}>{cityName || t('search.allCities')}</span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-40" aria-hidden />
            <select
              value={citySlug}
              onChange={(e) => {
                const slug = e.target.value
                setPicked(slug)
                if (slug !== citySlug) router.push(chipHref(slug))
              }}
              aria-label={t('search.city')}
              className="absolute inset-0 cursor-pointer opacity-0"
            >
              {cities.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <span className="hidden h-7 w-px shrink-0 bg-sv-ink/10 dark:bg-white/15 lg:block" aria-hidden />
          <SearchSuggest
            variant="auto"
            className="min-w-0 flex-1"
            value={q}
            onChange={setQ}
            onPick={(s) => {
              setQ(s.ka)
              if (s.kind === 'city') {
                const hit = DE_CITIES.find((c) => c.de === s.ka)
                if (hit) setPicked(hit.slug)
              }
            }}
            onSubmit={() => void submit()}
            placeholder={
              country === 'de'
                ? deNl
                  ? DE_NL_EXAMPLES[exIdx]
                  : 'What are you looking for?'
                : country === 'ae'
                  ? AE_NL_EXAMPLES[exIdx]
                  : `${cityName}, ${COUNTRY_NAMES[country]}`
            }
            ariaLabel={
              country === 'de'
                ? lang === 'de'
                  ? 'Was suchst du? Zum Beispiel 2-Zimmer-Wohnung in Berlin unter 500.000 €'
                  : 'What are you looking for? For example 2-room apartment in Berlin under €500,000'
                : country === 'ae'
                  ? 'What are you looking for? For example 2-bed apartment in Dubai Marina'
                  : t('search.keywordPlaceholder')
            }
            mkt={country === 'de' ? 'de' : undefined}
            city={country === 'de' && citySlug === 'berlin' ? 'Berlin' : undefined}
          />
          <button
            type="submit"
            onMouseEnter={() => router.prefetch(localizedHref('/search', lang))}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-sv-orange px-6 text-[15px] font-extrabold text-sv-ink shadow-glow-orange transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-orange-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-cloud active:scale-[0.98] dark:focus-visible:ring-offset-sv-navy lg:w-auto lg:min-w-[112px] lg:shrink-0"
          >
            <Search className="h-[18px] w-[18px]" />
            {t('nav.search')}
          </button>
        </div>
      </form>

      {chips.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {chips.map((c, i) => (
            <Link
              key={c.slug}
              href={chipHref(c.slug)}
              className="sv-hero-in rounded-full glass-hero px-4 py-2.5 text-[13px] font-bold text-sv-ink/80 transition-all duration-200 hover:bg-sv-surface hover:text-sv-ink hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-cloud dark:text-white/85 dark:hover:bg-white/20 dark:hover:text-white dark:focus-visible:ring-offset-sv-navy"
              style={{ animationDelay: `${0.28 + i * 0.045}s` }}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
