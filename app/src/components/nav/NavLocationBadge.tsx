'use client'

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronDown, Check, Globe } from 'lucide-react'
import { Flag, type FlagCode } from '@/components/Flag'
import { COUNTRY_IDS, MARKETS, isPathCountry, marketFromIso, parseCountryPath, type PathCountryId } from '@/lib/markets'
import { useI18n } from '@/lib/i18n/context'
import { stripLangPrefix } from '@/lib/i18n/core'

const noopSubscribe = () => () => {}

const MARKET_LABELS: Record<string, { ka: string; en: string; de?: string }> = {
  ge: { ka: 'საქართველო', en: 'Georgia', de: 'Georgien' },
  global: { ka: 'მსოფლიო', en: 'Worldwide', de: 'Weltweit' },
  de: { ka: 'გერმანია', en: 'Germany', de: 'Deutschland' },
  ae: { ka: 'არაბთა საამიროები', en: 'UAE', de: 'VAE' },
  us: { ka: 'აშშ', en: 'USA', de: 'USA' },
  gb: { ka: 'დიდი ბრიტანეთი', en: 'UK', de: 'Großbritannien' },
  es: { ka: 'ესპანეთი', en: 'Spain', de: 'Spanien' },
  fr: { ka: 'საფრანგეთი', en: 'France', de: 'Frankreich' },
  tr: { ka: 'თურქეთი', en: 'Turkey', de: 'Türkei' },
  cy: { ka: 'კვიპროსი', en: 'Cyprus', de: 'Zypern' },
  gr: { ka: 'საბერძნეთი', en: 'Greece', de: 'Griechenland' },
  it: { ka: 'იტალია', en: 'Italy', de: 'Italien' },
  pt: { ka: 'პორტუგალია', en: 'Portugal', de: 'Portugal' },
  nl: { ka: 'ნიდერლანდები', en: 'Netherlands', de: 'Niederlande' },
  ch: { ka: 'შვეიცარია', en: 'Switzerland', de: 'Schweiz' },
  at: { ka: 'ავსტრია', en: 'Austria', de: 'Österreich' },
  pl: { ka: 'პოლონეთი', en: 'Poland', de: 'Polen' },
  cz: { ka: 'ჩეხეთი', en: 'Czech Republic', de: 'Tschechien' },
  hu: { ka: 'უნგრეთი', en: 'Hungary', de: 'Ungarn' },
  ie: { ka: 'ირლანდია', en: 'Ireland', de: 'Irland' },
  se: { ka: 'შვედეთი', en: 'Sweden', de: 'Schweden' },
  dk: { ka: 'დანია', en: 'Denmark', de: 'Dänemark' },
  no: { ka: 'ნორვეგია', en: 'Norway', de: 'Norwegen' },
  fi: { ka: 'ფინეთი', en: 'Finland', de: 'Finnland' },
  be: { ka: 'ბელგია', en: 'Belgium', de: 'Belgien' },
  lu: { ka: 'ლუქსემბურგი', en: 'Luxembourg', de: 'Luxemburg' },
  sa: { ka: 'საუდის არაბეთი', en: 'Saudi Arabia', de: 'Saudi-Arabien' },
  qa: { ka: 'ყატარი', en: 'Qatar', de: 'Katar' },
  kw: { ka: 'ქუვეითი', en: 'Kuwait', de: 'Kuwait' },
  bh: { ka: 'ბაჰრეინი', en: 'Bahrain', de: 'Bahrain' },
  om: { ka: 'ომანი', en: 'Oman', de: 'Oman' },
  il: { ka: 'ისრაელი', en: 'Israel', de: 'Israel' },
  sg: { ka: 'სინგაპური', en: 'Singapore', de: 'Singapur' },
  jp: { ka: 'იაპონია', en: 'Japan', de: 'Japan' },
  kr: { ka: 'სამხრეთ კორეა', en: 'South Korea', de: 'Südkorea' },
  au: { ka: 'ავსტრალია', en: 'Australia', de: 'Australien' },
  nz: { ka: 'ახალი ზელანდია', en: 'New Zealand', de: 'Neuseeland' },
  ca: { ka: 'კანადა', en: 'Canada', de: 'Kanada' },
  mx: { ka: 'მექსიკა', en: 'Mexico', de: 'Mexiko' },
  br: { ka: 'ბრაზილია', en: 'Brazil', de: 'Brasilien' },
  ar: { ka: 'არგენტინა', en: 'Argentina', de: 'Argentinien' },
  cl: { ka: 'ჩილე', en: 'Chile', de: 'Chile' },
  th: { ka: 'ტაილანდი', en: 'Thailand', de: 'Thailand' },
  id: { ka: 'ინდონეზია', en: 'Indonesia', de: 'Indonesien' },
  my: { ka: 'მალაიზია', en: 'Malaysia', de: 'Malaysia' },
  vn: { ka: 'ვიეტნამი', en: 'Vietnam', de: 'Vietnam' },
  ph: { ka: 'ფილიპინები', en: 'Philippines', de: 'Philippinen' },
  in: { ka: 'ინდოეთი', en: 'India', de: 'Indien' },
  kz: { ka: 'ყაზახეთი', en: 'Kazakhstan', de: 'Kasachstan' },
  uz: { ka: 'უზბეკეთი', en: 'Uzbekistan', de: 'Usbekistan' },
  za: { ka: 'სამხრეთ აფრიკა', en: 'South Africa', de: 'Südafrika' },
}

/** Market label in the UI locale — de falls back to en for unlisted names. */
function marketLabel(id: string, lang: string): string {
  const m = MARKET_LABELS[id]
  if (!m) return id.toUpperCase()
  return lang === 'ka' ? m.ka : lang === 'de' ? (m.de ?? m.en) : m.en
}

const TOP_ITEMS: { id: 'ge' | PathCountryId; flag: FlagCode }[] = [
  { id: 'ge', flag: 'ge' },
  ...COUNTRY_IDS.map((id) => ({ id, flag: id as FlagCode })),
]

/**
 * Market path that resolves on either origin, so the badge renders the same
 * href on the server and after hydration (the old `window.location` sniff
 * rendered one href on the server and another in the browser).
 *
 * `/ge/…` is the Georgian catalog on sivrce.com and folds to the unprefixed
 * canonical on sivrce.ge. `/en/<cc>` is the country-market form: sivrce.com
 * 308s it to /<cc>, sivrce.ge 308s it across to sivrce.com. The two locale
 * forms a country market publishes (German Germany, Arabic UAE) keep their
 * locale. ponytail: one 308 on a nav click beats a host branch.
 */
export function marketHref(id: 'ge' | PathCountryId, currentLang = 'ka'): string {
  if (id === 'ge') return currentLang && currentLang !== 'ka' ? `/ge/${currentLang}` : '/ge'
  if (id === 'de' && currentLang === 'de') return '/de/de'
  if (id === 'ae' && currentLang === 'ar') return '/ar/ae'
  return `/en${MARKETS[id].pathPrefix}`
}

function cookieVal(): string | null {
  if (typeof document === 'undefined') return null
  const row = document.cookie.split('; ').find((c) => c.startsWith('sv-geo-v2='))
  return row ? decodeURIComponent(row.slice('sv-geo-v2'.length + 1)) : null
}

function isMarketId(v: string | null | undefined): v is 'ge' | 'global' | PathCountryId {
  return v === 'ge' || v === 'global' || (!!v && isPathCountry(v))
}

/**
 * Market (country) switcher for the navbar.
 *
 * Country only — deliberately no `· City`. The popover switches countries, so
 * a city label here was state this control could not change, it was hidden
 * below `sm` (phones never saw it), it duplicated the hero WHERE field, and
 * the lookup it needed dragged `map/user-place` → `data/world-places` (88 KB
 * of city rows) into the navbar chunk on every route. City/district is the
 * search field's axis; country is this one's. Locked by bundle-leak.check.
 */
const GE_NAV_CITIES = [
  { slug: '', ka: 'ყველა საქართველო', en: 'All Georgia', ru: 'Вся Грузия', de: 'Ganz Georgien', icon: '🇬🇪' },
  { slug: 'tbilisi', ka: 'თბილისი', en: 'Tbilisi', ru: 'Тбилиси', de: 'Tiflis', icon: '🏛️' },
  { slug: 'batumi', ka: 'ბათუმი', en: 'Batumi', ru: 'Батуми', de: 'Batumi', icon: '🌊' },
  { slug: 'kutaisi', ka: 'ქუთაისი', en: 'Kutaisi', ru: 'Кутаиси', de: 'Kutaisi', icon: '🏰' },
  { slug: 'rustavi', ka: 'რუსთავი', en: 'Rustavi', ru: 'Рустави', de: 'Rustawi', icon: '🏭' },
  { slug: 'bakuriani', ka: 'ბაკურიანი', en: 'Bakuriani', ru: 'Бакуриани', de: 'Bakuriani', icon: '⛷️' },
  { slug: 'gudauri', ka: 'გუდაური', en: 'Gudauri', ru: 'Гудаури', de: 'Gudauri', icon: '🏔️' },
  { slug: 'kobuleti', ka: 'ქობულეთი', en: 'Kobuleti', ru: 'Кобулети', de: 'Kobuleti', icon: '🏖️' },
  { slug: 'telavi', ka: 'თელავი', en: 'Telavi', ru: 'Телави', de: 'Telawi', icon: '🍇' },
  { slug: 'borjomi', ka: 'ბორჯომი', en: 'Borjomi', ru: 'Боржоми', de: 'Bordschomi', icon: '🌲' },
]

type GeNavCity = (typeof GE_NAV_CITIES)[number]

function cityNavHref(c: GeNavCity, pathname: string, lang: string): string {
  const bare = stripLangPrefix(pathname)
  const lPrefix = lang && lang !== 'ka' ? `/${lang}` : ''
  if (bare.startsWith('/projects')) {
    // Explorer filters match raw catalog city values (Georgian), so the query
    // carries c.ka — the same value the facet chips compare against.
    return c.slug ? `${lPrefix}/projects?city=${encodeURIComponent(c.ka)}` : `${lPrefix}/projects`
  }
  if (bare.startsWith('/rent')) {
    return c.slug ? `${lPrefix}/rent/${c.slug}` : `${lPrefix}/rent`
  }
  if (bare.startsWith('/daily')) {
    return c.slug ? `${lPrefix}/daily/${c.slug}` : `${lPrefix}/daily`
  }
  if (bare.startsWith('/hotels')) {
    return c.slug ? `${lPrefix}/hotels?city=${c.slug}` : `${lPrefix}/hotels`
  }
  if (bare.startsWith('/map')) {
    return c.slug ? `${lPrefix}/map?city=${c.slug}` : `${lPrefix}/map`
  }
  return c.slug ? `${lPrefix}/sale/${c.slug}` : `${lPrefix}/sale`
}

/** City slug the current path is scoped to — /sale/tbilisi, /tbilisi/x, /rent/batumi, /projects/tbilisi. */
function activeCitySlug(pathname: string): string {
  const parts = stripLangPrefix(pathname).split('/')
  const a = parts[1] ?? ''
  return GE_NAV_CITIES.find((c) => c.slug && (c.slug === a || c.slug === (parts[2] ?? '')))?.slug ?? ''
}

export function NavLocationBadge({
  light = false,
  marketIso,
}: {
  light?: boolean
  marketIso?: string
}) {
  const pathname = usePathname()
  const { lang } = useI18n()
  // Tri-lang chrome strings (ka/de/en) — matches the de-market overlay ceiling.
  const T = (ka: string, de: string, en: string) => (lang === 'ka' ? ka : lang === 'de' ? de : en)
  const [open, setOpen] = useState(false)
  // Explicit tab pick wins; default derives from market during render — no
  // effect, no cascading re-render when countryId resolves.
  const [tabPick, setTab] = useState<'ge' | 'world' | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false)

  const parsed = parseCountryPath(stripLangPrefix(pathname))
  const fromProp = marketFromIso(marketIso ?? null)

  const sticky = useMemo(() => {
    if (!mounted) return null
    // pathname never reads into the probe — it's the nav signal that re-runs
    // it after a market switch rewrites the cookie / data-market attribute.
    void pathname
    const sp = new URLSearchParams(window.location.search)
    const iso = sp.get('country')
    const fromIso = marketFromIso(iso)
    const html = document.documentElement.getAttribute('data-market')
    const cook = cookieVal()
    const raw = fromIso || (isMarketId(html) ? html : null) || cook
    const country: 'ge' | 'global' | PathCountryId = isMarketId(raw) ? raw : 'global'
    return country
  }, [mounted, pathname])

  const countryId: 'ge' | 'global' | PathCountryId =
    parsed?.country ?? (fromProp && fromProp !== 'global' ? fromProp : null) ?? sticky ?? 'global'

  const countryName = marketLabel(countryId, lang)

  const tab: 'ge' | 'world' = tabPick ?? (countryId !== 'ge' ? 'world' : 'ge')

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
  const [armed, setArmed] = useState(false)

  const filteredItems = search.trim()
    ? TOP_ITEMS.filter((m) => {
        const q = search.trim().toLowerCase()
        const label = marketLabel(m.id, lang)
        return label.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)
      })
    : TOP_ITEMS

  return (
    <div ref={rootRef} className="inline-flex items-center">
      <button
        type="button"
        onClick={() => {
          setArmed(true)
          setOpen((v) => !v)
          setSearch('')
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${T('ბაზარი', 'Markt', 'Market')}: ${countryName}`}
        className={`group relative flex h-8 items-center gap-1.5 rounded-full border border-sv-ink/10 px-2.5 text-[11px] font-bold transition duration-200 before:absolute before:inset-x-0 before:-inset-y-1.5 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue ${
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
        <span className="max-w-[136px] truncate tracking-tight sm:max-w-none">{countryName}</span>
        <ChevronDown className={`h-3 w-3 shrink-0 opacity-60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <div
        role="menu"
        aria-label={T('მდებარეობა და ბაზარი', 'Standort & Markt', 'Location & Market')}
        inert={!open}
        data-open={open || undefined}
        className="sv-pop glass-light absolute start-0 top-full z-50 mt-2 max-h-[min(26rem,75vh)] w-[min(17rem,calc(100vw-2.5rem))] origin-top-start overflow-hidden rounded-module border border-sv-ink/10 p-2 shadow-card"
      >
        {armed && (
          <>
            {/* Apple-grade Tab Switcher: Georgia Hierarchy vs Global Hub */}
            <div className="mb-2 flex rounded-control bg-sv-ink/[0.06] p-0.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setTab('ge')}
                className={`flex-1 rounded-[6px] py-1 text-center transition-colors ${
                  tab === 'ge' ? 'bg-white text-sv-ink shadow-sm dark:bg-sv-navy dark:text-white' : 'text-sv-ink/60 hover:text-sv-ink'
                }`}
              >
                🇬🇪 {T('საქართველო', 'Georgien', 'Georgia')}
              </button>
              <button
                type="button"
                onClick={() => setTab('world')}
                className={`flex-1 rounded-[6px] py-1 text-center transition-colors ${
                  tab === 'world' ? 'bg-white text-sv-ink shadow-sm dark:bg-sv-navy dark:text-white' : 'text-sv-ink/60 hover:text-sv-ink'
                }`}
              >
                🌐 {T('მსოფლიო', 'Weltweit', 'Global')}
              </button>
            </div>

            {tab === 'ge' ? (
              <div className="max-h-[min(19rem,55vh)] overflow-y-auto overscroll-contain">
                <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-sv-ink/40">
                  {T('ქალაქები და კურორტები', 'Städte & Regionen', 'Cities & Resorts')}
                </div>
                {GE_NAV_CITIES.map((c) => {
                  const href = cityNavHref(c, pathname, lang)
                  const label = lang === 'ka' ? c.ka : lang === 'de' ? c.de : lang === 'ru' ? c.ru : c.en
                  const on = countryId === 'ge' && (c.slug ? c.slug === activeCitySlug(pathname) : activeCitySlug(pathname) === '')
                  return (
                    <a
                      key={c.slug}
                      href={href}
                      role="menuitem"
                      onClick={() => {
                        document.cookie = `sv-geo-v2=ge; path=/; max-age=31536000; SameSite=Lax`
                        setOpen(false)
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-control px-2.5 py-1.5 text-start text-[12.5px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue ${
                        on ? 'bg-sv-blue/10 text-sv-blue' : 'text-sv-ink hover:bg-sv-ink/5'
                      }`}
                    >
                      <span className="text-[14px]">{c.icon}</span>
                      <span className="flex-1 truncate">{label}</span>
                      {on && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </a>
                  )
                })}
                <div className="mt-2 border-t border-sv-ink/10 pt-2">
                  <a
                    href="https://sivrce.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center gap-2 rounded-control bg-sv-blue/5 px-2.5 py-2 text-start text-[11px] font-bold text-sv-blue transition-colors hover:bg-sv-blue/10"
                  >
                    <Globe className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1">sivrce.com — {T('გლობალური პლატფორმა', 'Globale Plattform', 'Global Platform')}</span>
                  </a>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-2 px-1">
                  <input
                    type="text"
                    name="country-search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={T('ქვეყნის ძიება…', 'Land suchen…', 'Search country…')}
                    aria-label={T('ქვეყნის ძიება', 'Land suchen', 'Search country')}
                    className="w-full rounded-control border border-sv-ink/10 bg-sv-surface px-3 py-1.5 text-[12px] font-semibold text-sv-ink placeholder:text-sv-ink/40 focus:border-sv-blue focus:outline-none focus:ring-2 focus:ring-sv-blue/20"
                    autoFocus={open}
                  />
                </div>
                <div className="max-h-[min(18rem,55vh)] overflow-y-auto overscroll-contain">
                  {filteredItems.map((m) => {
                    const on = m.id === countryId
                    const label = marketLabel(m.id, lang)
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
                        className={`flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-start text-[13px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue ${
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
                      {T('ვერ მოიძებნა', 'Kein Land gefunden', 'No country found')}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
