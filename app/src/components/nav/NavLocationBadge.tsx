'use client'

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronDown, Check, Globe } from 'lucide-react'
import { Flag, type FlagCode } from '@/components/Flag'
import { COUNTRY_IDS, MARKETS, isPathCountry, marketFromIso, parseCountryPath, type PathCountryId } from '@/lib/markets'
import { useI18n } from '@/lib/i18n/context'
import { stripLangPrefix } from '@/lib/i18n/core'
import { cityByName, cityBySlug } from '@/lib/map/user-place'

const noopSubscribe = () => () => {}

const MARKET_LABELS: Record<string, { ka: string; en: string }> = {
  ge: { ka: 'საქართველო', en: 'Georgia' },
  global: { ka: 'მსოფლიო', en: 'Worldwide' },
  de: { ka: 'გერმანია', en: 'Germany' },
  ae: { ka: 'არაბთა საამიროები', en: 'UAE' },
  us: { ka: 'აშშ', en: 'USA' },
  gb: { ka: 'დიდი ბრიტანეთი', en: 'UK' },
  es: { ka: 'ესპანეთი', en: 'Spain' },
  fr: { ka: 'საფრანგეთი', en: 'France' },
  tr: { ka: 'თურქეთი', en: 'Turkey' },
  cy: { ka: 'კვიპროსი', en: 'Cyprus' },
  gr: { ka: 'საბერძნეთი', en: 'Greece' },
  it: { ka: 'იტალია', en: 'Italy' },
  pt: { ka: 'პორტუგალია', en: 'Portugal' },
  nl: { ka: 'ნიდერლანდები', en: 'Netherlands' },
  ch: { ka: 'შვეიცარია', en: 'Switzerland' },
  at: { ka: 'ავსტრია', en: 'Austria' },
  pl: { ka: 'პოლონეთი', en: 'Poland' },
  cz: { ka: 'ჩეხეთი', en: 'Czech Republic' },
  hu: { ka: 'უნგრეთი', en: 'Hungary' },
  ie: { ka: 'ირლანდია', en: 'Ireland' },
  se: { ka: 'შვედეთი', en: 'Sweden' },
  dk: { ka: 'დანია', en: 'Denmark' },
  no: { ka: 'ნორვეგია', en: 'Norway' },
  fi: { ka: 'ფინეთი', en: 'Finland' },
  be: { ka: 'ბელგია', en: 'Belgium' },
  lu: { ka: 'ლუქსემბურგი', en: 'Luxembourg' },
  sa: { ka: 'საუდის არაბეთი', en: 'Saudi Arabia' },
  qa: { ka: 'ყატარი', en: 'Qatar' },
  kw: { ka: 'ქუვეითი', en: 'Kuwait' },
  bh: { ka: 'ბაჰრეინი', en: 'Bahrain' },
  om: { ka: 'ომანი', en: 'Oman' },
  il: { ka: 'ისრაელი', en: 'Israel' },
  sg: { ka: 'სინგაპური', en: 'Singapore' },
  jp: { ka: 'იაპონია', en: 'Japan' },
  kr: { ka: 'სამხრეთ კორეა', en: 'South Korea' },
  au: { ka: 'ავსტრალია', en: 'Australia' },
  nz: { ka: 'ახალი ზელანდია', en: 'New Zealand' },
  ca: { ka: 'კანადა', en: 'Canada' },
  mx: { ka: 'მექსიკა', en: 'Mexico' },
  br: { ka: 'ბრაზილია', en: 'Brazil' },
  ar: { ka: 'არგენტინა', en: 'Argentina' },
  cl: { ka: 'ჩილე', en: 'Chile' },
  th: { ka: 'ტაილანდი', en: 'Thailand' },
  id: { ka: 'ინდონეზია', en: 'Indonesia' },
  my: { ka: 'მალაიზია', en: 'Malaysia' },
  vn: { ka: 'ვიეტნამი', en: 'Vietnam' },
  ph: { ka: 'ფილიპინები', en: 'Philippines' },
  in: { ka: 'ინდოეთი', en: 'India' },
  kz: { ka: 'ყაზახეთი', en: 'Kazakhstan' },
  uz: { ka: 'უზბეკეთი', en: 'Uzbekistan' },
  za: { ka: 'სამხრეთ აფრიკა', en: 'South Africa' },
}

const TOP_ITEMS: { id: 'ge' | PathCountryId; flag: FlagCode }[] = [
  { id: 'ge', flag: 'ge' },
  ...COUNTRY_IDS.map((id) => ({ id, flag: id as FlagCode })),
]

function isComHost() {
  if (typeof window === 'undefined') return false
  const h = window.location.hostname
  return h === 'sivrce.com' || h === 'www.sivrce.com'
}

function marketHref(id: 'ge' | PathCountryId, currentLang = 'ka'): string {
  if (id === 'ge') {
    return isComHost() ? '/ge' : (currentLang && currentLang !== 'ka' ? `/${currentLang}` : '/')
  }
  const path = MARKETS[id].pathPrefix
  const l = currentLang && currentLang !== 'ka' ? currentLang : (id === 'de' ? 'de' : id === 'ae' ? 'ar' : 'en')
  return isComHost() ? path : `/${l}${path}`
}

function cookieVal(): string | null {
  if (typeof document === 'undefined') return null
  const row = document.cookie.split('; ').find((c) => c.startsWith('sv-geo-v2='))
  return row ? decodeURIComponent(row.slice('sv-geo-v2'.length + 1)) : null
}

function isMarketId(v: string | null | undefined): v is 'ge' | 'global' | PathCountryId {
  return v === 'ge' || v === 'global' || (!!v && isPathCountry(v))
}

export function NavLocationBadge({
  light = false,
  marketIso,
  marketCity,
}: {
  light?: boolean
  marketIso?: string
  marketCity?: string
}) {
  const pathname = usePathname()
  const { lang } = useI18n()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false)

  const parsed = parseCountryPath(stripLangPrefix(pathname))
  const fromProp = marketFromIso(marketIso ?? null)

  // Browser-only market hints (?country, <html data-market>, cookie). Derived
  // during render once hydrated — an effect + setState would cost a second
  // render pass on every navigation, on every page that mounts the navbar.
  const sticky = useMemo(() => {
    if (!mounted) return null
    const sp = new URLSearchParams(window.location.search)
    const iso = sp.get('country')
    const fromIso = marketFromIso(iso)
    const html = document.documentElement.getAttribute('data-market')
    const cook = cookieVal()
    const raw = fromIso || (isMarketId(html) ? html : null) || cook
    const country: 'ge' | 'global' | PathCountryId = isMarketId(raw) ? raw : 'global'
    const cityQ = sp.get('city')
    const pin = cityQ ? cityByName(cityQ) : null
    const city =
      pin?.slug ??
      (country !== 'global' && country !== 'ge' ? MARKETS[country]?.defaultCitySlug : undefined)
    return { country, city }
    // pathname is the invalidation signal, not a read value: navigation is what
    // changes location.search/data-market. useSearchParams() would read them
    // "properly" but opts every page that renders the navbar out of static.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, pathname])

  const countryId: 'ge' | 'global' | PathCountryId =
    parsed?.country ?? (fromProp && fromProp !== 'global' ? fromProp : null) ?? sticky?.country ?? 'global'
  const propCity = marketCity ? cityByName(marketCity)?.slug : undefined
  const citySlug =
    parsed?.city ??
    propCity ??
    sticky?.city ??
    (countryId !== 'global' && countryId !== 'ge' ? MARKETS[countryId]?.defaultCitySlug : countryId === 'ge' ? 'tbilisi' : undefined)
  const cityObj = citySlug ? cityBySlug(citySlug) : null

  const countryName = (lang === 'ka' ? MARKET_LABELS[countryId]?.ka : MARKET_LABELS[countryId]?.en) ?? countryId.toUpperCase()
  const cityName = cityObj ? (lang === 'ka' ? cityObj.ka : cityObj.en) : ''

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const [search, setSearch] = useState('')

  const filteredItems = search.trim()
    ? TOP_ITEMS.filter((m) => {
        const q = search.trim().toLowerCase()
        const label = (lang === 'ka' ? MARKET_LABELS[m.id]?.ka : MARKET_LABELS[m.id]?.en) || m.id
        return label.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)
      })
    : TOP_ITEMS

  return (
    <div ref={rootRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          setSearch('')
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Location & Market"
        className={`group flex h-8 items-center gap-1.5 rounded-full border border-sv-ink/10 px-2.5 text-[11px] font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue ${
          light
            ? 'bg-sv-ink/5 text-sv-ink hover:bg-sv-ink/10'
            : 'bg-sv-ink/5 text-sv-ink hover:bg-sv-ink/10 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20'
        }`}
      >
        {countryId === 'global' ? (
          <Globe className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
        ) : (
          <Flag code={countryId as FlagCode} size={14} />
        )}
        <span className="max-w-[110px] truncate tracking-tight sm:max-w-[160px]">
          {countryName}
          {cityName ? <span className="opacity-60"> · {cityName}</span> : null}
        </span>
        <ChevronDown className={`h-3 w-3 shrink-0 opacity-60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <div
        role="menu"
        aria-label="Location & Market"
        inert={!open}
        data-open={open || undefined}
        className="sv-pop glass-light absolute start-0 top-full z-50 mt-2 max-h-[min(24rem,70vh)] w-64 origin-top-start overflow-hidden rounded-2xl border border-sv-ink/10 p-2 shadow-card"
      >
        <div className="mb-2 px-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'ka' ? 'ქვეყნის ძიება…' : 'Search country…'}
            aria-label={lang === 'ka' ? 'ქვეყნის ძიება' : 'Search country'}
            className="w-full rounded-xl border border-sv-ink/10 bg-sv-surface px-3 py-1.5 text-[12px] font-semibold text-sv-ink placeholder:text-sv-ink/40 focus:border-sv-blue focus:outline-none focus:ring-2 focus:ring-sv-blue/20"
            autoFocus={open}
          />
        </div>
        <div className="max-h-[min(18rem,55vh)] overflow-y-auto overscroll-contain">
          {filteredItems.map((m) => {
            const on = m.id === countryId
            const label = (lang === 'ka' ? MARKET_LABELS[m.id]?.ka : MARKET_LABELS[m.id]?.en) ?? m.id.toUpperCase()
            return (
              <a
                key={m.id}
                href={marketHref(m.id, lang)}
                role="menuitemradio"
                aria-checked={on}
                onClick={() => {
                  document.cookie = `sv-geo-v2=${encodeURIComponent(m.id)}; path=/; max-age=31536000; SameSite=Lax`
                  setOpen(false)
                }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-start text-[13px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue ${
                  on ? 'bg-sv-blue/10 text-sv-blue' : 'text-sv-ink hover:bg-sv-ink/5'
                }`}
              >
                <Flag code={m.flag} size={16} />
                <span className="flex-1 truncate">{label}</span>
                {on && <Check className="h-4 w-4 shrink-0" />}
              </a>
            )
          })}
          {filteredItems.length === 0 && (
            <div className="py-4 text-center text-[12px] font-semibold text-sv-ink/50">
              {lang === 'ka' ? 'ვერ მოიძებნა' : 'No country found'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
