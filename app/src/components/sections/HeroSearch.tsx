'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Search, MapPin, SlidersHorizontal, ChevronDown, Loader2,
  Building2, Home, Trees, LandPlot, Store, BedDouble, Banknote, DoorOpen, History,
} from 'lucide-react'
import { SparkMark } from '@/components/SparkMark'
import SearchSuggest, { type Suggestion } from '@/components/search/SearchSuggest'
import LocationPicker, { locationLabel, type LocationValue } from '@/components/search/LocationPicker'
import { useI18n, localizedHref } from '@/lib/i18n/context'
import { CATEGORY_BRAND, DEAL_BRAND } from '@/lib/category-brand'
import { DAILY_SIGNAL_KEYS } from '@/lib/features'
import { CITIES } from '@/data/listings'
import {
  countFilterMode,
  pricePresets,
  readRecent,
  writeRecent,
  recentLabel,
  type RecentSearch,
} from './hero-search-mode'

/* Deal tabs — locked DEAL_BRAND (BRAND.md §3.2); labels from i18n */
const TAB_HUES = [DEAL_BRAND.sale, DEAL_BRAND.rent, DEAL_BRAND.daily, DEAL_BRAND.newProjects] as const
const TAB_KEYS = ['search.sale', 'search.rent', 'nav.daily', 'nav.projects'] as const

const PROP_TYPES = [
  { value: 'apartment', labelKey: 'prop.apartment', icon: Building2, brand: CATEGORY_BRAND.apartments },
  { value: 'house', labelKey: 'prop.houseShort', icon: Home, brand: CATEGORY_BRAND.houses },
  { value: 'villa', labelKey: 'prop.villa', icon: Trees, brand: CATEGORY_BRAND.cottages },
  { value: 'land', labelKey: 'prop.land', icon: LandPlot, brand: CATEGORY_BRAND.land },
  { value: 'commercial', labelKey: 'prop.commercial', icon: Store, brand: CATEGORY_BRAND.commercial },
  { value: 'hotel', labelKey: 'prop.hotel', icon: BedDouble, brand: CATEGORY_BRAND.hotels },
] as const

const COUNTS = ['1', '2', '3', '4', '5+'] as const
const QUICK = ['ვაკე', 'საბურთალო', 'მთაწმინდა', 'ბათუმი', 'ძველი თბილისი', 'დიღომი']

const cell =
  'group relative flex min-w-0 flex-col justify-center gap-0.5 px-3.5 py-2.5 text-left transition-colors hover:bg-white/[0.08] focus-within:bg-white/[0.08]'

/** Hero search — Airbnb-grade: type · where · when? · rooms|beds · price · keyword · find. */
export default function HeroSearch() {
  const [tab, setTab] = useState(0)
  const [loc, setLoc] = useState<LocationValue>({ city: '', district: '', street: '' })
  const [locOpen, setLocOpen] = useState(false)
  const [type, setType] = useState('')
  const [typeOpen, setTypeOpen] = useState(false)
  const [count, setCount] = useState('')
  const [countOpen, setCountOpen] = useState(false)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [priceOpen, setPriceOpen] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [keyword, setKeyword] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiHint, setAiHint] = useState(false)
  const [recent, setRecent] = useState<RecentSearch | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const barRef = useRef<HTMLFormElement>(null)
  const router = useRouter()
  const { lang, t } = useI18n()
  const go = (path: string) => router.push(localizedHref(path, lang))
  const countMode = countFilterMode(tab, type)
  const isDaily = tab === 2
  const todayIso = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    router.prefetch(localizedHref('/search', lang))
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate recent search from localStorage on mount (SSR-safe: starts null)
    setRecent(readRecent())
  }, [router, lang])

  useEffect(() => {
    const close = () => {
      setTypeOpen(false)
      setCountOpen(false)
      setPriceOpen(false)
    }
    const onDoc = (e: MouseEvent) => {
      if (!barRef.current?.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const dealParam = () => (tab === 0 ? 'sale' : tab === 1 ? 'rent' : tab === 2 ? 'daily' : undefined)

  const buildParams = (extra?: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    const deal = dealParam()
    if (deal) params.set('deal', deal)
    if (type) params.set('type', type)
    // villa/hotel are real PropTypes (schema + add-listing)
    if (loc.city) params.set('city', loc.city)
    if (loc.district) params.set('district', loc.district)
    const q = (keyword.trim() || loc.street.trim())
    if (q) params.set('q', q)
    if (count && countMode !== 'hide') {
      params.set(countMode === 'beds' ? 'beds' : 'rooms', count.replace('+', ''))
    }
    if (minPrice) params.set('min', minPrice)
    if (maxPrice) params.set('max', maxPrice)
    // Airbnb: dates optional — only send valid from < to range
    if (isDaily && from && to && from >= todayIso && from < to) {
      params.set('from', from)
      params.set('to', to)
    }
    if (extra) {
      for (const [k, v] of Object.entries(extra)) {
        if (v) params.set(k, v)
        else params.delete(k)
      }
    }
    return params
  }

  const persistAndGo = (path: string, params: URLSearchParams) => {
    const dealKey = TAB_KEYS[tab] ?? 'search.sale'
    const label = recentLabel(params, t(dealKey))
    writeRecent({ path, label })
    setRecent({ path, label })
    go(path)
  }

  const submitSearch = () => {
    if (tab === 3) {
      document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    const params = buildParams()
    const qs = params.toString()
    persistAndGo(qs ? `/search?${qs}` : '/search', params)
  }

  const applySuggestion = (s: Suggestion) => {
    if (s.kind === 'city') {
      setLoc({ city: s.ka, district: '', street: '' })
      setKeyword('')
      const params = buildParams({ city: s.ka, district: undefined, q: undefined })
      persistAndGo(`/search?${params}`, params)
    } else if (s.kind === 'district') {
      setLoc((l) => ({ ...l, district: s.ka, street: '' }))
      setKeyword('')
      const params = buildParams({ district: s.ka, q: undefined })
      persistAndGo(`/search?${params}`, params)
    } else {
      setKeyword(s.ka)
      const params = buildParams({ q: s.ka })
      persistAndGo(`/search?${params}`, params)
    }
  }

  const aiSearch = async () => {
    const q = keyword.trim()
    if (!q) {
      setAiHint(true)
      inputRef.current?.focus()
      return
    }
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      const json = (await res.json()) as { ok: boolean; filters?: Record<string, string | number | undefined> }
      const f = json.ok ? (json.filters ?? {}) : {}
      const params = new URLSearchParams()
      const deal = (f.dealType as string | undefined) ?? dealParam()
      if (deal) params.set('deal', deal)
      if (f.propertyType) params.set('type', String(f.propertyType))
      const nextCity = (f.city as string | undefined) ?? (loc.city || undefined)
      const nextDistrict = (f.district as string | undefined) ?? (loc.district || undefined)
      if (nextCity) params.set('city', nextCity)
      if (nextDistrict) params.set('district', nextDistrict)
      if (f.minPrice) params.set('min', String(f.minPrice))
      if (f.maxPrice) params.set('max', String(f.maxPrice))
      if (f.rooms) params.set('rooms', String(f.rooms))
      if (f.bedrooms) params.set('beds', String(f.bedrooms))
      if (f.minArea) params.set('amin', String(f.minArea))
      if (f.maxArea) params.set('amax', String(f.maxArea))
      if (f.keywords) params.set('q', String(f.keywords))
      if (isDaily && from && to && from < to) {
        params.set('from', from)
        params.set('to', to)
      }
      persistAndGo(`/search?${params}`, params)
    } catch {
      submitSearch()
    } finally {
      setAiLoading(false)
    }
  }

  const goQuick = (name: string) => {
    const params = new URLSearchParams()
    const deal = dealParam()
    if (deal) params.set('deal', deal)
    if (CITIES.includes(name)) {
      setLoc({ city: name, district: '', street: '' })
      params.set('city', name)
    } else {
      setLoc((l) => ({ ...l, district: name }))
      params.set('district', name)
      if (loc.city) params.set('city', loc.city)
    }
    persistAndGo(`/search?${params}`, params)
  }

  const goDailySignal = (feat: (typeof DAILY_SIGNAL_KEYS)[number]) => {
    const params = buildParams()
    params.set('deal', 'daily')
    params.set('feat', feat)
    if (feat === 'add.f.partiesAllowed') params.set('type', 'house')
    persistAndGo(`/search?${params}`, params)
  }

  const switchTab = (i: number) => {
    setTab(i)
    setCount('') // ponytail: reset count — rooms≠beds units
    setCountOpen(false)
    setMaxPrice('')
    setMinPrice('')
    if (i !== 2) {
      setFrom('')
      setTo('')
    }
  }

  const activeType = PROP_TYPES.find((p) => p.value === type)
  const locText = locationLabel(loc)
  const anyLabel = t('search.all')
  const priceText =
    minPrice || maxPrice
      ? `${minPrice ? `$${Number(minPrice).toLocaleString()}` : '…'} – ${maxPrice ? `$${Number(maxPrice).toLocaleString()}` : '…'}`
      : anyLabel
  const countLabel = countMode === 'beds' ? t('search.bedrooms') : t('search.rooms')
  const CountIcon = countMode === 'beds' ? BedDouble : DoorOpen
  const countText = count ? (count.endsWith('+') ? count : `${count}+`) : anyLabel
  const keywordPh = t('search.keywordPlaceholder')
  const aiPh = countMode === 'beds'
    ? 'მაგ.: 2 საძინებელი ვაკეში, ზღვასთან'
    : 'მაგ.: 3 ოთახიანი ბინა ვაკეში $200K-მდე'
  const dateText =
    from && to ? `${from.slice(5)} → ${to.slice(5)}` : anyLabel
  const presets = pricePresets(tab)

  return (
    <div
      className="sv-hero-in mt-11 w-full max-w-[1080px]"
      style={{ animationDelay: '0.16s' }}
    >
      {/* Deal tabs */}
      <div
        className="mb-0 flex w-fit items-center gap-1 rounded-t-tile glass p-1.5 max-md:mx-auto max-md:max-w-full max-md:overflow-x-auto max-md:scrollbar-hide"
        role="tablist"
        aria-label={t('search.dealType')}
      >
        {TAB_KEYS.map((key, i) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === i}
            onClick={() => switchTab(i)}
            className={`relative rounded-module px-4 py-3 text-[13px] font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy md:px-5 md:text-[14px] ${
              tab === i ? 'text-sv-navy' : 'text-white/75 hover:text-white'
            }`}
          >
            {tab === i && (
              <motion.span
                layoutId="hero-tab"
                className="absolute inset-0 rounded-module bg-white"
                transition={{ type: 'spring', bounce: 0.18, duration: 0.55 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: TAB_HUES[i] }} aria-hidden />
              {t(key)}
            </span>
          </button>
        ))}
      </div>

      {/* One search bar */}
      <form
        ref={barRef}
        role="search"
        aria-label={t('nav.search')}
        onSubmit={(e) => { e.preventDefault(); submitSearch() }}
        className="glass rounded-b-tile rounded-tr-tile p-1.5 shadow-panel-dark md:p-2"
      >
        <div className="flex flex-col gap-1.5 md:flex-row md:items-stretch md:gap-0 md:divide-x md:divide-white/10">
          {/* Type */}
          <div className={`${cell} md:w-[140px] md:shrink-0`}>
            <button
              type="button"
              aria-expanded={typeOpen}
              aria-haspopup="listbox"
              onClick={() => { setTypeOpen((o) => !o); setCountOpen(false); setPriceOpen(false) }}
              className="w-full text-left"
            >
              <span className="block text-[11px] font-bold uppercase tracking-wider text-white/50">{t('search.propType')}</span>
              <span className="mt-0.5 flex items-center gap-1.5 text-[14px] font-bold text-white">
                {activeType ? (
                  <>
                    <activeType.icon className="h-3.5 w-3.5 shrink-0" style={{ color: activeType.brand.hue }} />
                    <span className="truncate">{t(activeType.labelKey)}</span>
                  </>
                ) : (
                  <span className="truncate text-white/70">{t('search.all')}</span>
                )}
                <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 text-white/40" />
              </span>
            </button>
            <AnimatePresence>
              {typeOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.18 }}
                  role="listbox"
                  className="absolute left-0 top-full z-50 mt-2 w-[min(100vw-2rem,340px)] rounded-tile border border-sv-ink/10 bg-sv-surface p-2 shadow-card-hover"
                >
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      role="option"
                      aria-selected={!type}
                      onClick={() => { setType(''); setTypeOpen(false) }}
                      className={`rounded-control px-3 py-3 text-left text-[13px] font-bold ${
                        !type ? 'bg-sv-blue/10 text-sv-blue' : 'text-sv-ink hover:bg-sv-ink/[0.04]'
                      }`}
                    >
                      {t('search.allTypes')}
                    </button>
                    {PROP_TYPES.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        role="option"
                        aria-selected={type === p.value}
                        onClick={() => { setType(p.value); setTypeOpen(false); if (countFilterMode(tab, p.value) === 'hide') setCount('') }}
                        className={`flex items-center gap-2.5 rounded-control px-3 py-3 text-left text-[13px] font-bold transition-colors ${
                          type === p.value ? 'bg-sv-blue/10 text-sv-blue' : 'text-sv-ink hover:bg-sv-ink/[0.04]'
                        }`}
                      >
                        <span
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-control"
                          style={{ backgroundColor: p.brand.chip, color: p.brand.hue }}
                        >
                          <p.icon className="h-4 w-4" />
                        </span>
                        {t(p.labelKey)}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Location */}
          <div className={`${cell} md:min-w-[140px] md:flex-1`}>
            <button type="button" onClick={() => setLocOpen(true)} className="w-full text-left">
              <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-white/50">
                <MapPin className="h-3 w-3 text-sv-blue-light" /> მდებარეობა
              </span>
              <span className="mt-0.5 flex items-center gap-1 text-[14px] font-bold text-white">
                <span className={`truncate ${locText === 'მდებარეობა' ? 'text-white/70' : ''}`}>{locText}</span>
                <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 text-white/40" />
              </span>
            </button>
          </div>

          {/* When — daily only (Airbnb: dates optional) */}
          {isDaily && (
            <div className={`${cell} md:w-[168px] md:shrink-0`}>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-white/50">
                {t('search.checkIn')}
              </span>
              <div className="mt-0.5 flex items-center gap-1">
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
                  className="w-full min-w-0 bg-transparent text-[13px] font-bold text-white outline-none [color-scheme:dark]"
                />
                <span className="text-white/30">–</span>
                <input
                  type="date"
                  value={to}
                  min={from || todayIso}
                  onChange={(e) => setTo(e.target.value)}
                  aria-label={t('search.checkOut')}
                  className="w-full min-w-0 bg-transparent text-[13px] font-bold text-white outline-none [color-scheme:dark]"
                />
              </div>
              {!from && !to && (
                <span className="sr-only">{dateText}</span>
              )}
            </div>
          )}

          {/* Rooms (sale/rent) · Bedrooms (daily) */}
          {countMode !== 'hide' && (
            <div className={`${cell} md:w-[128px] md:shrink-0`}>
              <button
                type="button"
                aria-expanded={countOpen}
                aria-haspopup="listbox"
                onClick={() => { setCountOpen((o) => !o); setTypeOpen(false); setPriceOpen(false) }}
                className="w-full text-left"
              >
                <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-white/50">
                  <CountIcon className="h-3 w-3" /> {countLabel}
                </span>
                <span className="mt-0.5 flex items-center gap-1 text-[14px] font-bold text-white">
                  <span className={`truncate ${!count ? 'text-white/70' : ''}`}>{countText}</span>
                  <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 text-white/40" />
                </span>
              </button>
              <AnimatePresence>
                {countOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    role="listbox"
                    className="absolute left-0 top-full z-50 mt-2 flex gap-1.5 rounded-tile border border-sv-ink/10 bg-sv-surface p-2 shadow-card-hover"
                  >
                    <button
                      type="button"
                      role="option"
                      aria-selected={!count}
                      onClick={() => { setCount(''); setCountOpen(false) }}
                      className={`h-10 rounded-control px-3 text-[13px] font-extrabold ${!count ? 'bg-sv-blue text-white' : 'bg-sv-cloud text-sv-ink'}`}
                    >
                      {t('search.all')}
                    </button>
                    {COUNTS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        role="option"
                        aria-selected={count === r}
                        onClick={() => { setCount(r); setCountOpen(false) }}
                        className={`h-10 min-w-10 rounded-control px-3 text-[13px] font-extrabold ${
                          count === r ? 'bg-sv-blue text-white' : 'bg-sv-cloud text-sv-ink hover:bg-sv-ink/[0.06]'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Price */}
          <div className={`${cell} md:w-[140px] md:shrink-0`}>
            <button
              type="button"
              aria-expanded={priceOpen}
              aria-haspopup="dialog"
              onClick={() => { setPriceOpen((o) => !o); setTypeOpen(false); setCountOpen(false) }}
              className="w-full text-left"
            >
              <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-white/50">
                <Banknote className="h-3 w-3" /> {t('search.price')}
              </span>
              <span className="mt-0.5 flex items-center gap-1 text-[14px] font-bold text-white">
                <span className={`truncate ${!minPrice && !maxPrice ? 'text-white/70' : ''}`}>{priceText}</span>
                <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 text-white/40" />
              </span>
            </button>
            <AnimatePresence>
              {priceOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute right-0 top-full z-50 mt-2 w-[280px] rounded-tile border border-sv-ink/10 bg-sv-surface p-3 shadow-card-hover"
                >
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {presets.map((p) => (
                      <button
                        key={p.max}
                        type="button"
                        onClick={() => { setMinPrice(''); setMaxPrice(p.max) }}
                        className={`rounded-control px-2.5 py-1.5 text-[12px] font-extrabold ${
                          maxPrice === p.max && !minPrice
                            ? 'bg-sv-blue text-white'
                            : 'bg-sv-cloud text-sv-ink hover:bg-sv-ink/[0.06]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      placeholder={`${t('search.min')} $`}
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="h-11 w-full rounded-control border border-sv-ink/10 bg-sv-cloud px-3 text-[13px] font-bold text-sv-ink outline-none focus:border-sv-blue"
                    />
                    <span className="text-sv-ink/30">–</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      placeholder={`${t('search.max')} $`}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setPriceOpen(false) } }}
                      className="h-11 w-full rounded-control border border-sv-ink/10 bg-sv-cloud px-3 text-[13px] font-bold text-sv-ink outline-none focus:border-sv-blue"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setPriceOpen(false)}
                    className="mt-2 h-10 w-full rounded-control bg-sv-blue text-[13px] font-extrabold text-white hover:bg-sv-blue-deep"
                  >
                    მზადაა
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Keyword */}
          <div className="min-w-0 flex-1 px-1 py-1 md:min-w-[140px]">
            <SearchSuggest
              variant="dark"
              city={loc.city || undefined}
              value={keyword}
              onChange={(v) => { setKeyword(v); setAiHint(false) }}
              onPick={applySuggestion}
              onSubmit={submitSearch}
              placeholder={aiHint ? aiPh : keywordPh}
              ariaLabel={keywordPh}
              inputRef={inputRef}
              className="w-full"
            />
          </div>

          {/* CTA */}
          <div className="flex shrink-0 gap-1.5 p-1 md:pl-2">
            <button
              type="button"
              onClick={() => go('/map')}
              onMouseEnter={() => router.prefetch(localizedHref('/map', lang))}
              aria-label={t('nav.map')}
              className="hidden h-[52px] w-11 place-items-center rounded-control text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white md:grid"
            >
              <MapPin className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              onClick={() => {
                const params = buildParams()
                persistAndGo(`/search?${params}`, params)
              }}
              onMouseEnter={() => router.prefetch(localizedHref(`/search?${buildParams()}`, lang))}
              aria-label={t('search.filters')}
              className="hidden h-[52px] w-11 place-items-center rounded-control text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white md:grid"
            >
              <SlidersHorizontal className="h-[18px] w-[18px]" />
            </button>
            <button
              type="submit"
              onMouseEnter={() => router.prefetch(localizedHref(`/search?${buildParams()}`, lang))}
              className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-control bg-sv-orange px-6 text-[15px] font-extrabold text-white shadow-glow-orange transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-orange-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy active:scale-[0.98] md:flex-none md:min-w-[120px]"
            >
              <Search className="h-[18px] w-[18px]" />
              {t('nav.search')}
            </button>
          </div>
        </div>

        {/* Sub tools — mobile + AI */}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 px-1 pb-0.5 md:mt-2">
          <button
            type="button"
            onClick={() => {
              const params = buildParams()
              persistAndGo(`/search?${params}`, params)
            }}
            className="flex items-center gap-2 rounded-control px-3 py-2.5 text-[13px] font-bold text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white md:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" /> {t('search.filters')}
          </button>
          <button
            type="button"
            onClick={() => go('/map')}
            className="flex items-center gap-2 rounded-control px-3 py-2.5 text-[13px] font-bold text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white md:hidden"
          >
            <MapPin className="h-4 w-4" /> {t('nav.map')}
          </button>
          <button
            type="button"
            onClick={aiSearch}
            disabled={aiLoading}
            aria-busy={aiLoading}
            className="flex items-center gap-2 rounded-control bg-gradient-to-r from-sv-blue/25 to-sv-violet/25 px-3 py-2.5 text-[13px] font-bold text-sv-blue-light ring-1 ring-inset ring-sv-blue/40 transition-colors hover:text-white disabled:opacity-70"
          >
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SparkMark className="h-4 w-4" />}
            {aiLoading ? 'AI…' : `AI ${t('nav.search')}`}
          </button>
        </div>
      </form>

      {/* Quick chips: districts (sale/rent) · lifestyle signals (daily) */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {recent && (
          <button
            type="button"
            onClick={() => go(recent.path)}
            onMouseEnter={() => router.prefetch(localizedHref(recent.path, lang))}
            className="sv-hero-in flex items-center gap-1.5 rounded-full glass px-4 py-3 text-[13px] font-bold text-sv-blue-light ring-1 ring-inset ring-sv-blue/35 transition-all duration-200 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy"
            style={{ animationDelay: '0.22s' }}
          >
            <History className="h-3.5 w-3.5" />
            {recent.label}
          </button>
        )}
        <span className="sv-hero-in text-[13px] font-bold text-white/70" style={{ animationDelay: '0.24s' }}>
          {isDaily ? t('search.features') : 'პოპულარული:'}
        </span>
        {isDaily
          ? DAILY_SIGNAL_KEYS.map((f, i) => (
              <button
                key={f}
                type="button"
                onClick={() => goDailySignal(f)}
                onMouseEnter={() => {
                  const p = buildParams()
                  p.set('deal', 'daily')
                  p.set('feat', f)
                  if (f === 'add.f.partiesAllowed') p.set('type', 'house')
                  router.prefetch(localizedHref(`/search?${p}`, lang))
                }}
                className="sv-hero-in rounded-full glass px-4 py-3 text-[13px] font-bold text-white/85 transition-all duration-200 hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy"
                style={{ animationDelay: `${0.28 + i * 0.045}s` }}
              >
                {t(f)}
              </button>
            ))
          : QUICK.map((q, i) => (
              <button
                key={q}
                type="button"
                onClick={() => goQuick(q)}
                onMouseEnter={() => {
                  const p = new URLSearchParams()
                  const deal = dealParam()
                  if (deal) p.set('deal', deal)
                  if (CITIES.includes(q)) p.set('city', q)
                  else p.set('district', q)
                  router.prefetch(localizedHref(`/search?${p}`, lang))
                }}
                className="sv-hero-in rounded-full glass px-4 py-3 text-[13px] font-bold text-white/85 transition-all duration-200 hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy"
                style={{ animationDelay: `${0.28 + i * 0.045}s` }}
              >
                {q}
              </button>
            ))}
      </div>

      <LocationPicker
        open={locOpen}
        value={loc}
        onClose={() => setLocOpen(false)}
        onApply={(v) => { setLoc(v); setLocOpen(false); if (v.street) setKeyword(v.street) }}
      />
    </div>
  )
}
