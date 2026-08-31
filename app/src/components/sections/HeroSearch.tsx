'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import LocalizedLink from '@/components/LocalizedLink'
import { useRouter } from 'next/navigation'
import { ChevronDown, History, MapPin, Search } from 'lucide-react'
import { PartyHouseIcon } from '@/components/PartyHouseIcon'
import SearchSuggest, { type Suggestion, resolveExactPlace } from '@/components/search/SearchSuggest'
import LocationPicker, { locationLabel, type LocationValue } from '@/components/search/LocationPicker'
import PropertyTypePicker from '@/components/search/PropertyTypePicker'
import { useI18n, localizedHref } from '@/lib/i18n/context'
import { CATEGORY_BRAND } from '@/lib/category-brand'
import { useCurrency } from '@/lib/currency'
import type { PropType } from '@/data/listings'
import {
  boundNum,
  heroDeal,
  HERO_TABS,
  priceLabel,
  quickHref,
  readRecent,
  recentLabel,
  ROOM_CHIPS,
  sizeLabel,
  writeRecent,
  type RecentSearch,
} from './hero-search-mode'
import { isExactLookupQuery } from '@/lib/listing-public-id'
import { searchHref, suggestionToFilters } from '@/lib/search-location'
import { nlHasStructure, nlToSearchPatch, parseNlQuery } from '@/lib/nl-search'

type QuickKey =
  | 'home.search.quick.dailyTbilisi'
  | 'home.search.quick.vake'
  | 'home.search.quick.saburtalo'
  | 'home.search.quick.mtatsminda'
  | 'home.search.quick.batumi'
  | 'home.search.quick.oldTbilisi'
  | 'home.search.quick.digomi'

const QUICK: { labelKey: QuickKey; sale: string; rent: string; pledge: string; daily: string; projects: string }[] = [
  {
    labelKey: 'home.search.quick.dailyTbilisi',
    sale: '/daily/apartments/tbilisi',
    rent: '/daily/apartments/tbilisi',
    pledge: '/search?deal=pledge&city=თბილისი',
    daily: '/daily/apartments/tbilisi',
    projects: '/projects/tbilisi',
  },
  {
    labelKey: 'home.search.quick.vake',
    sale: '/sale/apartments/tbilisi/vake',
    rent: '/rent/apartments/tbilisi/vake',
    pledge: '/search?deal=pledge&city=თბილისი&district=ვაკე',
    daily: '/daily/apartments/tbilisi/vake',
    projects: '/projects/tbilisi/vake',
  },
  {
    labelKey: 'home.search.quick.saburtalo',
    sale: '/sale/apartments/tbilisi/saburtalo',
    rent: '/rent/apartments/tbilisi/saburtalo',
    pledge: '/search?deal=pledge&city=თბილისი&district=საბურთალო',
    daily: '/daily/apartments/tbilisi/saburtalo',
    projects: '/projects/tbilisi/saburtalo',
  },
  {
    labelKey: 'home.search.quick.mtatsminda',
    sale: '/sale/apartments/tbilisi/mtatsminda',
    rent: '/rent/apartments/tbilisi/mtatsminda',
    pledge: '/search?deal=pledge&city=თბილისი&district=მთაწმინდა',
    daily: '/daily/apartments/tbilisi/mtatsminda',
    projects: '/projects/tbilisi',
  },
  {
    labelKey: 'home.search.quick.batumi',
    sale: '/sale/apartments/batumi',
    rent: '/rent/apartments/batumi',
    pledge: '/search?deal=pledge&city=ბათუმი',
    daily: '/daily/apartments/batumi',
    projects: '/projects/batumi',
  },
  {
    labelKey: 'home.search.quick.oldTbilisi',
    sale: '/sale/apartments/tbilisi/old-tbilisi',
    rent: '/rent/apartments/tbilisi/old-tbilisi',
    pledge: '/search?deal=pledge&city=თბილისი&district=ძველი თბილისი',
    daily: '/daily/apartments/tbilisi/old-tbilisi',
    projects: '/projects/tbilisi',
  },
  {
    labelKey: 'home.search.quick.digomi',
    sale: '/sale/apartments/tbilisi/didi-dighomi',
    rent: '/rent/apartments/tbilisi/didi-dighomi',
    pledge: '/search?deal=pledge&city=თბილისი&district=დიდი დიღომი',
    daily: '/daily/apartments/tbilisi/didi-dighomi',
    projects: '/projects/tbilisi/didi-dighomi',
  },
]

const fieldBtn =
  'flex h-12 w-full items-center gap-2 rounded-full px-3.5 text-left text-sv-ink transition-colors hover:bg-sv-ink/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue/30 dark:text-white'
const fieldCap = 'block truncate text-[10px] font-extrabold uppercase tracking-[0.06em] text-sv-ink/40 dark:text-white/40'
const fieldVal = 'block truncate text-[14px] font-extrabold tracking-[-0.01em]'
const dropChrome =
  'rounded-module border border-sv-ink/10 bg-sv-surface p-3 shadow-card-hover dark:border-white/10 dark:bg-sv-navy dark:shadow-panel-dark'
const dropFloat = `absolute left-0 top-full z-[90] mt-2 hidden w-[min(calc(100vw-2.5rem),280px)] lg:block ${dropChrome}`
const numInput =
  'h-10 w-[104px] rounded-full bg-sv-ink/[0.045] px-3.5 text-[13px] font-bold text-sv-ink outline-none placeholder:text-sv-ink/35 focus:bg-sv-ink/[0.07] focus-visible:ring-2 focus-visible:ring-sv-blue/30 dark:bg-white/[0.07] dark:text-white dark:placeholder:text-white/35'

/** Hero search — deal + type + place + size + price + query. Rest lives on /search. */
export default function HeroSearch() {
  const [tab, setTab] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [minP, setMinP] = useState('')
  const [maxP, setMaxP] = useState('')
  const [amin, setAmin] = useState('')
  const [amax, setAmax] = useState('')
  const [rooms, setRooms] = useState<number | undefined>()
  const [roomsExact, setRoomsExact] = useState(true)
  const [menu, setMenu] = useState<'size' | 'price' | null>(null)
  const [recent, setRecent] = useState<RecentSearch | null>(null)
  const [loc, setLoc] = useState<LocationValue>({ city: '', district: '', street: '' })
  const [locOpen, setLocOpen] = useState(false)
  const [propType, setPropType] = useState<PropType | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)
  const menusRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { lang, t, b } = useI18n()
  const { currency, setCurrency } = useCurrency()
  const go = (path: string) => router.push(localizedHref(path, lang))
  const deal = heroDeal(tab)
  const isDaily = deal === 'daily'
  const isProjects = HERO_TABS[tab]?.id === 'projects'
  const showRooms = propType !== 'land'
  const todayIso = new Date().toISOString().slice(0, 10)
  const areaUnit = t('add.areaUnit.m2')
  const sizeText = sizeLabel(rooms, roomsExact, amin, amax, areaUnit)
  const priceText = priceLabel(minP, maxP, currency)
  const sizeCaption = isDaily ? t('search.bedrooms') : showRooms ? t('search.rooms') : t('search.area')

  useEffect(() => {
    router.prefetch(localizedHref('/search', lang))
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate recent from localStorage (SSR-safe)
    setRecent(readRecent())
  }, [router, lang])

  useEffect(() => {
    if (!menu) return
    const onDown = (e: MouseEvent) => {
      if (menusRef.current && e.target instanceof Node && !menusRef.current.contains(e.target)) setMenu(null)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(null) }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [menu])

  const persistAndGo = (path: string, params: URLSearchParams) => {
    const dealKey = HERO_TABS[tab]?.key ?? 'search.sale'
    writeRecent({ path, label: recentLabel(params, t(dealKey)) })
    go(path)
  }

  const withDeal = (extra?: Record<string, string | undefined>) => {
    const min = boundNum(minP)
    const max = boundNum(maxP)
    const areaMin = boundNum(amin)
    const areaMax = boundNum(amax)
    const roomPatch =
      rooms === undefined
        ? {}
        : isDaily
          ? { beds: String(rooms), bmax: roomsExact ? String(rooms) : undefined }
          : { rooms: String(rooms), rmax: roomsExact ? String(rooms) : undefined }
    const f: Record<string, string | undefined> = {
      deal,
      type: propType,
      city: loc.city || undefined,
      district: loc.district || undefined,
      min: min ? String(min) : undefined,
      max: max ? String(max) : undefined,
      amin: areaMin ? String(areaMin) : undefined,
      amax: areaMax ? String(areaMax) : undefined,
      ...roomPatch,
      cur: currency === 'GEL' && (min || max) ? 'GEL' : undefined,
      ...(loc.metro ? { metro: '1' } : {}),
      ...(isDaily && from && to && from >= todayIso && from < to ? { from, to } : {}),
      ...extra,
    }
    const href = searchHref(f)
    persistAndGo(href, new URLSearchParams(href.split('?')[1] ?? ''))
  }

  const submitSearch = async () => {
    if (isProjects) {
      document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    const raw = keyword.trim()
    if (isExactLookupQuery(raw)) {
      try {
        const res = await fetch(`/api/listings/resolve?q=${encodeURIComponent(raw)}`)
        const json = (await res.json()) as { ok?: boolean; path?: string }
        if (json.ok && json.path) {
          persistAndGo(json.path, new URLSearchParams())
          return
        }
      } catch { /* fall through */ }
    }
    const place = raw ? await resolveExactPlace(raw) : undefined
    if (place) {
      withDeal(suggestionToFilters(place))
      return
    }
    const parsed = raw ? parseNlQuery(raw) : null
    if (parsed && nlHasStructure(parsed)) {
      withDeal(nlToSearchPatch(parsed))
      return
    }
    withDeal({ q: raw || loc.street || undefined })
  }

  const applySuggestion = (s: Suggestion) => {
    setKeyword(s.kind === 'street' ? s.ka : '')
    withDeal(suggestionToFilters(s))
  }

  const switchTab = (i: number) => {
    setTab(i)
    if (HERO_TABS[i]?.deal !== 'daily') {
      setFrom('')
      setTo('')
    }
    setMenu(null)
  }

  const pickRoom = (n: number, exact: boolean) => {
    if (rooms === n && roomsExact === exact) {
      setRooms(undefined)
      setRoomsExact(true)
      return
    }
    setRooms(n)
    setRoomsExact(exact)
  }

  const keywordPh = t('search.keywordPlaceholder')
  const sizeBody = (
    <>
      {showRooms && (
        <div className="mb-2.5">
          <span className="mb-1.5 block text-[12px] font-semibold text-sv-ink/45 dark:text-white/45">{sizeCaption}</span>
          <div className="flex gap-1">
            {ROOM_CHIPS.map((r) => {
              const on = rooms === r.n && roomsExact === r.exact
              return (
                <button
                  key={r.label}
                  type="button"
                  aria-pressed={on}
                  onClick={() => pickRoom(r.n, r.exact)}
                  className={`h-10 min-w-10 rounded-full px-3 text-[13px] font-bold transition-colors ${
                    on
                      ? 'bg-sv-blue text-white'
                      : 'bg-sv-ink/[0.045] text-sv-ink/65 hover:bg-sv-ink/[0.08] hover:text-sv-ink dark:bg-white/[0.07] dark:text-white/70 dark:hover:bg-white/[0.12] dark:hover:text-white'
                  }`}
                >
                  {r.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
      <span className="mb-1.5 block text-[12px] font-semibold text-sv-ink/45 dark:text-white/45">{t('search.area')}</span>
      <div className="flex items-center gap-1.5">
        <input type="number" min={0} inputMode="numeric" placeholder={t('search.min')} value={amin} onChange={(e) => setAmin(e.target.value)} aria-label={t('search.minArea')} className={numInput} />
        <span className="text-sv-ink/30 dark:text-white/30">—</span>
        <input type="number" min={0} inputMode="numeric" placeholder={t('search.max')} value={amax} onChange={(e) => setAmax(e.target.value)} aria-label={t('search.maxArea')} className={numInput} />
        <span className="text-[12px] font-semibold text-sv-ink/35 dark:text-white/40">{areaUnit}</span>
      </div>
    </>
  )
  const priceBody = (
    <div className="flex items-center gap-1.5">
      <input type="number" min={0} inputMode="numeric" placeholder={t('search.min')} value={minP} onChange={(e) => setMinP(e.target.value)} aria-label={t('search.minPrice')} className={numInput} />
      <span className="text-sv-ink/30 dark:text-white/30">—</span>
      <input type="number" min={0} inputMode="numeric" placeholder={t('search.max')} value={maxP} onChange={(e) => setMaxP(e.target.value)} aria-label={t('search.maxPrice')} className={numInput} />
      <div className="ml-0.5 flex rounded-full bg-sv-ink/[0.045] p-0.5 dark:bg-white/[0.07]" role="group" aria-label={t('search.currency')}>
        {(['USD', 'GEL'] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCurrency(c)}
            aria-pressed={currency === c}
            className={`h-9 w-9 rounded-full text-[13px] font-bold transition-colors ${
              currency === c
                ? 'bg-sv-surface text-sv-blue shadow-soft dark:bg-white/15 dark:text-sv-blue-light'
                : 'text-sv-ink/55 hover:text-sv-ink dark:text-white/55 dark:hover:text-white'
            }`}
          >
            {c === 'USD' ? '$' : '₾'}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div
      className="sv-hero-in mx-auto mt-11 w-full min-w-0 max-w-[1100px]"
      style={{ animationDelay: '0.16s' }}
    >
      <div
        className="mx-auto mb-2.5 grid w-full grid-cols-2 gap-1 rounded-tile glass-hero p-1 sm:flex sm:w-fit sm:flex-wrap sm:rounded-full lg:flex-nowrap"
        role="tablist"
        aria-label={t('search.dealType')}
      >
        {HERO_TABS.map((item, i) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={tab === i}
            onClick={() => switchTab(i)}
            className={`relative w-full rounded-full px-2.5 py-2 text-center text-[12.5px] font-extrabold leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-cloud dark:focus-visible:ring-offset-sv-navy sm:w-auto sm:px-4 sm:py-2.5 sm:text-[14px] lg:px-5 ${
              item.id === 'projects' ? 'col-span-2 sm:col-auto' : ''
            } ${
              tab === i ? 'text-sv-ink' : 'text-sv-ink/55 hover:text-sv-ink dark:text-white/75 dark:hover:text-white'
            }`}
          >
            {tab === i && (
              <motion.span
                layoutId="hero-tab"
                className="absolute inset-0 rounded-full bg-white shadow-card"
                transition={{ type: 'spring', bounce: 0.18, duration: 0.55 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.hue }} aria-hidden />
              {t(item.key)}
            </span>
          </button>
        ))}
      </div>

      <form
        role="search"
        aria-label={t('nav.search')}
        onSubmit={(e) => { e.preventDefault(); void submitSearch() }}
        className="relative w-full min-w-0 overflow-visible rounded-tile bg-sv-surface/90 p-1.5 shadow-card ring-1 ring-white/80 backdrop-blur-2xl focus-within:ring-sv-blue/25 dark:bg-white/[0.10] dark:shadow-panel-dark dark:ring-white/14 lg:rounded-full lg:p-1.5"
      >
        <div className="flex flex-col gap-1.5 lg:flex-row lg:items-center">
          {!isProjects && (
            <>
              <PropertyTypePicker
                variant="hero"
                value={propType}
                onChange={(v) => {
                  setPropType(v)
                  if (v === 'land') { setRooms(undefined); setRoomsExact(true) }
                }}
                onOpen={() => setMenu(null)}
                className="shrink-0"
              />
              <span className="hidden h-7 w-px shrink-0 bg-sv-ink/10 dark:bg-white/15 lg:block" aria-hidden />
            </>
          )}
          <button
            type="button"
            onClick={() => { setMenu(null); setLocOpen(true) }}
            aria-label={t('loc.title')}
            className={`${fieldBtn} lg:w-[168px] lg:max-w-[168px] lg:shrink-0`}
          >
            <MapPin className={`h-4 w-4 shrink-0 ${loc.city ? 'text-sv-blue' : 'text-sv-ink/35 dark:text-white/40'}`} />
            <span className="min-w-0 flex-1">
              <span className={fieldCap}>{t('loc.where')}</span>
              <span className={fieldVal}>{locationLabel(loc, t('search.allGeorgia'))}</span>
            </span>
          </button>
          <LocationPicker
            open={locOpen}
            value={loc}
            multi
            showMetro
            onClose={() => setLocOpen(false)}
            onApply={(v) => { setLoc(v); setLocOpen(false) }}
          />
          {!isProjects && (
            <>
              <span className="hidden h-7 w-px shrink-0 bg-sv-ink/10 dark:bg-white/15 lg:block" aria-hidden />
              <div ref={menusRef} className="flex flex-col gap-1.5 lg:contents">
                <div className="grid grid-cols-2 gap-1.5 lg:contents">
                  <div className="relative min-w-0">
                    <button
                      type="button"
                      aria-haspopup="dialog"
                      aria-expanded={menu === 'size'}
                      aria-label={sizeText ? `${sizeCaption}: ${sizeText}` : sizeCaption}
                      onClick={() => setMenu((m) => (m === 'size' ? null : 'size'))}
                      className={`${fieldBtn} lg:w-[128px] lg:max-w-[128px]`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className={fieldCap}>{sizeCaption}</span>
                        <span className={`${fieldVal} ${sizeText ? '' : 'text-sv-ink/38 dark:text-white/45'}`}>
                          {sizeText ?? sizeCaption}
                        </span>
                      </span>
                      <ChevronDown className={`h-3.5 w-3.5 shrink-0 opacity-40 transition-transform ${menu === 'size' ? 'rotate-180' : ''}`} aria-hidden />
                    </button>
                    {menu === 'size' && (
                      <div role="dialog" aria-label={sizeCaption} className={dropFloat}>
                        {sizeBody}
                      </div>
                    )}
                  </div>
                  <div className="relative min-w-0">
                    <button
                      type="button"
                      aria-haspopup="dialog"
                      aria-expanded={menu === 'price'}
                      aria-label={priceText ? `${t('search.price')}: ${priceText}` : t('search.price')}
                      onClick={() => setMenu((m) => (m === 'price' ? null : 'price'))}
                      className={`${fieldBtn} lg:w-[128px] lg:max-w-[128px]`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className={fieldCap}>{t('search.price')}</span>
                        <span className={`${fieldVal} ${priceText ? '' : 'text-sv-ink/38 dark:text-white/45'}`}>
                          {priceText ?? t('search.price')}
                        </span>
                      </span>
                      <ChevronDown className={`h-3.5 w-3.5 shrink-0 opacity-40 transition-transform ${menu === 'price' ? 'rotate-180' : ''}`} aria-hidden />
                    </button>
                    {menu === 'price' && (
                      <div role="dialog" aria-label={t('search.price')} className={`${dropFloat} lg:left-auto lg:right-0`}>
                        {priceBody}
                      </div>
                    )}
                  </div>
                </div>
                {menu === 'size' && (
                  <div role="dialog" aria-label={sizeCaption} className={`lg:hidden ${dropChrome}`}>
                    {sizeBody}
                  </div>
                )}
                {menu === 'price' && (
                  <div role="dialog" aria-label={t('search.price')} className={`lg:hidden ${dropChrome}`}>
                    {priceBody}
                  </div>
                )}
              </div>
              <span className="hidden h-7 w-px shrink-0 bg-sv-ink/10 dark:bg-white/15 lg:block" aria-hidden />
            </>
          )}
          <SearchSuggest
            variant="auto"
            size="lg"
            value={keyword}
            onChange={setKeyword}
            onPick={applySuggestion}
            onSubmit={() => void submitSearch()}
            placeholder={keywordPh}
            ariaLabel={keywordPh}
            inputRef={inputRef}
            className="min-w-0 flex-1"
          />
          {isDaily && (
            <div className="flex min-w-0 items-center gap-1 rounded-full bg-sv-ink/[0.05] px-3 py-2 lg:w-[220px] lg:shrink-0 dark:bg-white/[0.07]">
              <input
                type="date"
                value={from}
                min={todayIso}
                onChange={(e) => {
                  const v = e.target.value
                  setFrom(v)
                  if (to && v >= to) setTo('')
                }}
                aria-label={t('search.checkIn')}
                className="w-full min-w-0 bg-transparent text-[13px] font-bold text-sv-ink outline-none [color-scheme:light] dark:text-white dark:[color-scheme:dark]"
              />
              <span className="text-sv-ink/25 dark:text-white/30">–</span>
              <input
                type="date"
                value={to}
                min={from || todayIso}
                onChange={(e) => setTo(e.target.value)}
                aria-label={t('search.checkOut')}
                className="w-full min-w-0 bg-transparent text-[13px] font-bold text-sv-ink outline-none [color-scheme:light] dark:text-white dark:[color-scheme:dark]"
              />
            </div>
          )}
          <button
            type="submit"
            onMouseEnter={() => router.prefetch(localizedHref('/search', lang))}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-sv-orange px-6 text-[15px] font-extrabold text-white shadow-glow-orange transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-orange-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-cloud active:scale-[0.98] dark:focus-visible:ring-offset-sv-navy lg:w-auto lg:shrink-0 lg:min-w-[112px]"
          >
            <Search className="h-[18px] w-[18px]" />
            {t('nav.search')}
          </button>
        </div>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {recent && (
          <button
            type="button"
            onClick={() => go(recent.path)}
            onMouseEnter={() => router.prefetch(localizedHref(recent.path, lang))}
            className="sv-hero-in flex items-center gap-1.5 rounded-full bg-sv-blue px-4 py-2.5 text-[13px] font-bold text-white shadow-glow-blue-sm transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-cloud dark:focus-visible:ring-offset-sv-navy"
            style={{ animationDelay: '0.22s' }}
          >
            <History className="h-3.5 w-3.5" />
            {recent.label}
          </button>
        )}
        <span className="sv-hero-in text-[13px] font-bold text-sv-ink/50 dark:text-white/70" style={{ animationDelay: '0.24s' }}>
          {b('home.search.popular')}
        </span>
        {isDaily && (
          <LocalizedLink
            href="/search?deal=daily&feat=add.f.partiesAllowed"
            className="sv-hero-in inline-flex items-center gap-1.5 rounded-full glass-hero px-4 py-2.5 text-[13px] font-bold text-sv-ink/80 transition-all duration-200 hover:bg-sv-surface hover:text-sv-ink hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-cloud dark:text-white/85 dark:hover:bg-white/20 dark:hover:text-white dark:focus-visible:ring-offset-sv-navy"
            style={{ animationDelay: '0.26s' }}
          >
            <PartyHouseIcon className="h-3.5 w-3.5" style={{ color: CATEGORY_BRAND.partyHouses.hue }} />
            {t('col.party')}
          </LocalizedLink>
        )}
        {QUICK.map((chip, i) => (
          <LocalizedLink
            key={chip.labelKey}
            href={quickHref(chip, tab, propType)}
            className="sv-hero-in rounded-full glass-hero px-4 py-2.5 text-[13px] font-bold text-sv-ink/80 transition-all duration-200 hover:bg-sv-surface hover:text-sv-ink hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-cloud dark:text-white/85 dark:hover:bg-white/20 dark:hover:text-white dark:focus-visible:ring-offset-sv-navy"
            style={{ animationDelay: `${0.28 + i * 0.045}s` }}
          >
            {b(chip.labelKey)}
          </LocalizedLink>
        ))}
      </div>
    </div>
  )
}
