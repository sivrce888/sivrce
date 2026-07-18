'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Search, MapPin, SlidersHorizontal, ChevronDown, Loader2,
  Building2, Home, Trees, LandPlot, Store, BedDouble, Banknote, Ruler,
} from 'lucide-react'
import { SparkMark } from '@/components/SparkMark'
import SearchSuggest, { type Suggestion } from '@/components/search/SearchSuggest'
import LocationPicker, { locationLabel, type LocationValue } from '@/components/search/LocationPicker'
import { useI18n, localizedHref } from '@/lib/i18n/context'
import { CATEGORY_BRAND, DEAL_BRAND } from '@/lib/category-brand'
import { CITIES } from '@/data/listings'

/* Deal tabs — locked DEAL_BRAND (BRAND.md §3.2) */
const TABS = [
  { label: 'იყიდება', hue: DEAL_BRAND.sale },
  { label: 'ქირავდება', hue: DEAL_BRAND.rent },
  { label: 'დღიურად', hue: DEAL_BRAND.daily },
  { label: 'ახალი პროექტები', hue: DEAL_BRAND.newProjects },
]

const PROP_TYPES = [
  { value: 'apartment', label: 'ბინა', icon: Building2, brand: CATEGORY_BRAND.apartments },
  { value: 'house', label: 'სახლი', icon: Home, brand: CATEGORY_BRAND.houses },
  { value: 'cottage', label: 'აგარაკი', icon: Trees, brand: CATEGORY_BRAND.cottages },
  { value: 'land', label: 'მიწა', icon: LandPlot, brand: CATEGORY_BRAND.land },
  { value: 'commercial', label: 'კომერციული', icon: Store, brand: CATEGORY_BRAND.commercial },
  { value: 'hotel', label: 'სასტუმრო', icon: BedDouble, brand: CATEGORY_BRAND.hotels },
] as const

const ROOMS = ['1', '2', '3', '4', '5+'] as const
const QUICK = ['ვაკე', 'საბურთალო', 'მთაწმინდა', 'ბათუმი', 'ძველი თბილისი', 'დიღომი']
const KEYWORD_PH = 'უბანი, ქუჩა, ID…'
const AI_PH = 'მაგ.: 3 ოთახიანი ბინა ვაკეში $200K-მდე'

const cell =
  'group relative flex min-w-0 flex-col justify-center gap-0.5 px-3.5 py-2.5 text-left transition-colors hover:bg-white/[0.08] focus-within:bg-white/[0.08]'

/** Hero search — one bar like SS/MyHome: type · location · rooms · price · keyword · find. */
export default function HeroSearch() {
  const [tab, setTab] = useState(0)
  const [loc, setLoc] = useState<LocationValue>({ city: '', district: '', street: '' })
  const [locOpen, setLocOpen] = useState(false)
  const [type, setType] = useState('')
  const [typeOpen, setTypeOpen] = useState(false)
  const [rooms, setRooms] = useState('')
  const [roomsOpen, setRoomsOpen] = useState(false)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [priceOpen, setPriceOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiHint, setAiHint] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { lang } = useI18n()
  const go = (path: string) => router.push(localizedHref(path, lang))

  // Close popovers on outside click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!barRef.current?.contains(e.target as Node)) {
        setTypeOpen(false)
        setRoomsOpen(false)
        setPriceOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const dealParam = () => (tab === 0 ? 'sale' : tab === 1 ? 'rent' : tab === 2 ? 'daily' : undefined)

  const buildParams = (extra?: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    const deal = dealParam()
    if (deal) params.set('deal', deal)
    if (type) params.set('type', type === 'cottage' ? 'house' : type === 'hotel' ? 'commercial' : type)
    // ponytail: cottage/hotel map to nearest PropType until schema adds them
    if (loc.city) params.set('city', loc.city)
    if (loc.district) params.set('district', loc.district)
    const q = (keyword.trim() || loc.street.trim())
    if (q) params.set('q', q)
    if (rooms) params.set('rooms', rooms.replace('+', ''))
    if (minPrice) params.set('min', minPrice)
    if (maxPrice) params.set('max', maxPrice)
    if (extra) {
      for (const [k, v] of Object.entries(extra)) {
        if (v) params.set(k, v)
        else params.delete(k)
      }
    }
    return params
  }

  const submitSearch = () => {
    if (tab === 3) {
      document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    const qs = buildParams().toString()
    go(qs ? `/search?${qs}` : '/search')
  }

  const applySuggestion = (s: Suggestion) => {
    if (s.kind === 'city') {
      setLoc({ city: s.ka, district: '', street: '' })
      setKeyword('')
      go(`/search?${buildParams({ city: s.ka, district: undefined, q: undefined }).toString()}`)
    } else if (s.kind === 'district') {
      setLoc((l) => ({ ...l, district: s.ka, street: '' }))
      setKeyword('')
      go(`/search?${buildParams({ district: s.ka, q: undefined }).toString()}`)
    } else {
      setKeyword(s.ka)
      go(`/search?${buildParams({ q: s.ka }).toString()}`)
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
      if (f.minArea) params.set('amin', String(f.minArea))
      if (f.maxArea) params.set('amax', String(f.maxArea))
      if (f.keywords) params.set('q', String(f.keywords))
      go(`/search?${params.toString()}`)
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
    go(`/search?${params.toString()}`)
  }

  const activeType = PROP_TYPES.find((p) => p.value === type)
  const locText = locationLabel(loc)
  const priceText =
    minPrice || maxPrice
      ? `${minPrice ? `$${Number(minPrice).toLocaleString()}` : '…'} – ${maxPrice ? `$${Number(maxPrice).toLocaleString()}` : '…'}`
      : 'ნებისმიერი'
  const roomsText = rooms ? `${rooms} ოთახი` : 'ნებისმიერი'

  return (
    <div
      className="sv-hero-in mt-11 w-full max-w-[1080px]"
      style={{ animationDelay: '0.16s' }}
    >
      {/* Deal tabs */}
      <div className="mb-0 flex w-fit items-center gap-1 rounded-t-tile glass p-1.5 max-md:mx-auto max-md:max-w-full max-md:overflow-x-auto max-md:scrollbar-hide">
        {TABS.map((tb, i) => (
          <button
            key={tb.label}
            onClick={() => setTab(i)}
            aria-pressed={tab === i}
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
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tb.hue }} aria-hidden />
              {tb.label}
            </span>
          </button>
        ))}
      </div>

      {/* One search bar */}
      <div ref={barRef} className="glass rounded-b-tile rounded-tr-tile p-1.5 shadow-panel-dark md:p-2">
        <div className="flex flex-col gap-1.5 md:flex-row md:items-stretch md:gap-0 md:divide-x md:divide-white/10">
          {/* Type */}
          <div className={`${cell} md:w-[148px] md:shrink-0`}>
            <button
              type="button"
              aria-expanded={typeOpen}
              onClick={() => { setTypeOpen((o) => !o); setRoomsOpen(false); setPriceOpen(false) }}
              className="w-full text-left"
            >
              <span className="block text-[11px] font-bold uppercase tracking-wider text-white/50">ტიპი</span>
              <span className="mt-0.5 flex items-center gap-1.5 text-[14px] font-bold text-white">
                {activeType ? (
                  <>
                    <activeType.icon className="h-3.5 w-3.5 shrink-0" style={{ color: activeType.brand.hue }} />
                    <span className="truncate">{activeType.label}</span>
                  </>
                ) : (
                  <span className="truncate text-white/70">ყველა</span>
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
                  className="absolute left-0 top-full z-50 mt-2 w-[min(100vw-2rem,340px)] rounded-tile border border-sv-ink/10 bg-sv-surface p-2 shadow-card-hover"
                >
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => { setType(''); setTypeOpen(false) }}
                      className={`rounded-control px-3 py-3 text-left text-[13px] font-bold ${
                        !type ? 'bg-sv-blue/10 text-sv-blue' : 'text-sv-ink hover:bg-sv-ink/[0.04]'
                      }`}
                    >
                      ყველა ტიპი
                    </button>
                    {PROP_TYPES.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => { setType(p.value); setTypeOpen(false) }}
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
                        {p.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Location */}
          <div className={`${cell} md:min-w-[160px] md:flex-1`}>
            <button
              type="button"
              onClick={() => setLocOpen(true)}
              className="w-full text-left"
            >
              <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-white/50">
                <MapPin className="h-3 w-3 text-sv-blue-light" /> მდებარეობა
              </span>
              <span className="mt-0.5 flex items-center gap-1 text-[14px] font-bold text-white">
                <span className={`truncate ${locText === 'მდებარეობა' ? 'text-white/70' : ''}`}>{locText}</span>
                <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 text-white/40" />
              </span>
            </button>
          </div>

          {/* Rooms */}
          <div className={`${cell} md:w-[128px] md:shrink-0`}>
            <button
              type="button"
              aria-expanded={roomsOpen}
              onClick={() => { setRoomsOpen((o) => !o); setTypeOpen(false); setPriceOpen(false) }}
              className="w-full text-left"
            >
              <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-white/50">
                <Ruler className="h-3 w-3" /> ოთახები
              </span>
              <span className="mt-0.5 flex items-center gap-1 text-[14px] font-bold text-white">
                <span className={`truncate ${!rooms ? 'text-white/70' : ''}`}>{roomsText}</span>
                <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 text-white/40" />
              </span>
            </button>
            <AnimatePresence>
              {roomsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute left-0 top-full z-50 mt-2 flex gap-1.5 rounded-tile border border-sv-ink/10 bg-sv-surface p-2 shadow-card-hover"
                >
                  <button
                    type="button"
                    onClick={() => { setRooms(''); setRoomsOpen(false) }}
                    className={`h-10 rounded-control px-3 text-[13px] font-extrabold ${!rooms ? 'bg-sv-blue text-white' : 'bg-sv-cloud text-sv-ink'}`}
                  >
                    ყველა
                  </button>
                  {ROOMS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => { setRooms(r); setRoomsOpen(false) }}
                      className={`h-10 min-w-10 rounded-control px-3 text-[13px] font-extrabold ${
                        rooms === r ? 'bg-sv-blue text-white' : 'bg-sv-cloud text-sv-ink hover:bg-sv-ink/[0.06]'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Price */}
          <div className={`${cell} md:w-[148px] md:shrink-0`}>
            <button
              type="button"
              aria-expanded={priceOpen}
              onClick={() => { setPriceOpen((o) => !o); setTypeOpen(false); setRoomsOpen(false) }}
              className="w-full text-left"
            >
              <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-white/50">
                <Banknote className="h-3 w-3" /> ფასი
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
                  className="absolute right-0 top-full z-50 mt-2 w-[260px] rounded-tile border border-sv-ink/10 bg-sv-surface p-3 shadow-card-hover"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="დან $"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="h-11 w-full rounded-control border border-sv-ink/10 bg-sv-cloud px-3 text-[13px] font-bold text-sv-ink outline-none focus:border-sv-blue"
                    />
                    <span className="text-sv-ink/30">–</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="მდე $"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
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
          <div className="min-w-0 flex-1 px-1 py-1 md:min-w-[160px]">
            <SearchSuggest
              variant="dark"
              city={loc.city || undefined}
              value={keyword}
              onChange={(v) => { setKeyword(v); setAiHint(false) }}
              onPick={applySuggestion}
              onSubmit={submitSearch}
              placeholder={aiHint ? AI_PH : KEYWORD_PH}
              ariaLabel={KEYWORD_PH}
              inputRef={inputRef}
              className="w-full"
            />
          </div>

          {/* CTA */}
          <div className="flex shrink-0 gap-1.5 p-1 md:pl-2">
            <button
              type="button"
              onClick={() => go('/map')}
              aria-label="რუკა"
              className="hidden h-[52px] w-11 place-items-center rounded-control text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white md:grid"
            >
              <MapPin className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              onClick={() => go(`/search?${buildParams().toString()}`)}
              aria-label="დეტალური ფილტრი"
              className="hidden h-[52px] w-11 place-items-center rounded-control text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white md:grid"
            >
              <SlidersHorizontal className="h-[18px] w-[18px]" />
            </button>
            <button
              onClick={submitSearch}
              className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-control bg-sv-orange px-6 text-[15px] font-extrabold text-white shadow-glow-orange transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-orange-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy active:scale-[0.98] md:flex-none md:min-w-[120px]"
            >
              <Search className="h-[18px] w-[18px]" />
              ძიება
            </button>
          </div>
        </div>

        {/* Sub tools — mobile + AI */}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 px-1 pb-0.5 md:mt-2">
          <button
            onClick={() => go(`/search?${buildParams().toString()}`)}
            className="flex items-center gap-2 rounded-control px-3 py-2.5 text-[13px] font-bold text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white md:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" /> დეტალური
          </button>
          <button
            onClick={() => go('/map')}
            className="flex items-center gap-2 rounded-control px-3 py-2.5 text-[13px] font-bold text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white md:hidden"
          >
            <MapPin className="h-4 w-4" /> რუკა
          </button>
          <button
            onClick={aiSearch}
            disabled={aiLoading}
            aria-busy={aiLoading}
            className="flex items-center gap-2 rounded-control bg-gradient-to-r from-sv-blue/25 to-sv-violet/25 px-3 py-2.5 text-[13px] font-bold text-sv-blue-light ring-1 ring-inset ring-sv-blue/40 transition-colors hover:text-white disabled:opacity-70"
          >
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SparkMark className="h-4 w-4" />}
            {aiLoading ? 'AI იძიებს…' : 'AI ძიება'}
          </button>
        </div>
      </div>

      {/* Quick chips */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <span className="sv-hero-in text-[13px] font-bold text-white/70" style={{ animationDelay: '0.24s' }}>
          პოპულარული:
        </span>
        {QUICK.map((q, i) => (
          <button
            key={q}
            onClick={() => goQuick(q)}
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
