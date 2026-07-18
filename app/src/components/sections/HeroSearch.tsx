'use client'

import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Building2, Route, SlidersHorizontal, ChevronDown, Loader2 } from 'lucide-react'
import { SparkMark } from '@/components/SparkMark'
import SearchSuggest, { type Suggestion } from '@/components/search/SearchSuggest'
import { useI18n, localizedHref } from '@/lib/i18n/context'
import { DEAL_BRAND } from '@/lib/category-brand'
import { CITIES, districtsOf } from '@/data/listings'

/* Deal tabs — locked DEAL_BRAND (BRAND.md §3.2) */
const TABS = [
  { label: 'იყიდება', hue: DEAL_BRAND.sale },
  { label: 'ქირავდება', hue: DEAL_BRAND.rent },
  { label: 'დღიურად', hue: DEAL_BRAND.daily },
  { label: 'ახალი პროექტები', hue: DEAL_BRAND.newProjects },
]

const QUICK = ['ვაკე', 'საბურთალო', 'მთაწმინდა', 'ბათუმი', 'ძველი თბილისი', 'დიღომი']

const STREET_PLACEHOLDER = 'ქუჩა, მისამართი ან ID'
const AI_PLACEHOLDER = 'მაგ.: 3 ოთახიანი ბინა ვაკეში $200K-მდე'

const fieldShell =
  'flex min-w-0 flex-col justify-center gap-0.5 rounded-control bg-white/[0.07] px-3.5 py-2.5 text-left transition-colors hover:bg-white/[0.12] focus-within:bg-white/[0.12]'

/** Interactive hero search — location cascade first (city → district → street). */
export default function HeroSearch() {
  const [tab, setTab] = useState(0)
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [keyword, setKeyword] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiHint, setAiHint] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { lang } = useI18n()
  const go = (path: string) => router.push(localizedHref(path, lang))

  // Cascade: districts only after city — keeps the list short and readable.
  const districtOptions = useMemo(() => (city ? districtsOf(city) : []), [city])

  const dealParam = () => (tab === 0 ? 'sale' : tab === 1 ? 'rent' : tab === 2 ? 'daily' : undefined)

  const buildParams = (extra?: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    const deal = dealParam()
    if (deal) params.set('deal', deal)
    if (city) params.set('city', city)
    if (district) params.set('district', district)
    if (keyword.trim()) params.set('q', keyword.trim())
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
    const params = new URLSearchParams()
    const deal = dealParam()
    if (deal) params.set('deal', deal)

    if (s.kind === 'city') {
      setCity(s.ka)
      setDistrict('')
      setKeyword('')
      params.set('city', s.ka)
    } else if (s.kind === 'district') {
      setDistrict(s.ka)
      setKeyword('')
      if (city) params.set('city', city)
      params.set('district', s.ka)
    } else {
      setKeyword(s.ka)
      if (city) params.set('city', city)
      if (district) params.set('district', district)
      params.set('q', s.ka)
    }
    go(`/search?${params.toString()}`)
  }

  /** AI natural-language search: parse the query into filters, land on /search. */
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
      const nextCity = (f.city as string | undefined) ?? (city || undefined)
      const nextDistrict = (f.district as string | undefined) ?? (district || undefined)
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
      params.set('city', name)
      setCity(name)
      setDistrict('')
    } else {
      params.set('district', name)
      setDistrict(name)
    }
    go(`/search?${params.toString()}`)
  }

  return (
    <div
      className="sv-hero-in mt-11 w-full max-w-[980px]"
      style={{ animationDelay: '0.16s' }}
    >
      {/* Tabs */}
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

      {/* Location cascade — city → district → street */}
      <div className="glass rounded-b-tile rounded-tr-tile p-2 shadow-panel-dark">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_auto]">
          {/* City */}
          <label className={fieldShell}>
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/55">
              <Building2 className="h-3 w-3 text-sv-blue-light" aria-hidden />
              ქალაქი
            </span>
            <span className="relative flex items-center">
              <select
                value={city}
                aria-label="ქალაქი"
                onChange={(e) => {
                  setCity(e.target.value)
                  setDistrict('')
                }}
                className="w-full cursor-pointer appearance-none bg-transparent pr-6 text-[14px] font-bold text-white outline-none"
              >
                <option value="" className="bg-sv-navy text-white">ყველა ქალაქი</option>
                {CITIES.map((c) => (
                  <option key={c} value={c} className="bg-sv-navy text-white">{c}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-0 h-4 w-4 text-white/40" aria-hidden />
            </span>
          </label>

          {/* District */}
          <label className={fieldShell}>
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/55">
              <MapPin className="h-3 w-3 text-sv-blue-light" aria-hidden />
              უბანი
            </span>
            <span className="relative flex items-center">
              <select
                value={district}
                aria-label="უბანი"
                disabled={!city}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full cursor-pointer appearance-none bg-transparent pr-6 text-[14px] font-bold text-white outline-none disabled:cursor-not-allowed disabled:opacity-40"
              >
                <option value="" className="bg-sv-navy text-white">
                  {city ? 'ყველა უბანი' : 'ჯერ ქალაქი'}
                </option>
                {districtOptions.map((d) => (
                  <option key={d} value={d} className="bg-sv-navy text-white">{d}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-0 h-4 w-4 text-white/40" aria-hidden />
            </span>
          </label>

          {/* Street / address */}
          <div className={`col-span-2 md:col-span-1 ${fieldShell} !p-0 overflow-visible`}>
            <div className="px-3.5 pt-2.5">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/55">
                <Route className="h-3 w-3 text-sv-blue-light" aria-hidden />
                ქუჩა
              </span>
            </div>
            <SearchSuggest
              variant="dark"
              bare
              city={city || undefined}
              value={keyword}
              onChange={(v) => { setKeyword(v); setAiHint(false) }}
              onPick={applySuggestion}
              onSubmit={submitSearch}
              placeholder={aiHint ? AI_PLACEHOLDER : STREET_PLACEHOLDER}
              ariaLabel={STREET_PLACEHOLDER}
              inputRef={inputRef}
              className="w-full"
            />
          </div>

          <button
            onClick={submitSearch}
            className="col-span-2 flex items-center justify-center gap-2.5 rounded-control bg-sv-orange px-7 py-3.5 text-[15px] font-extrabold text-white shadow-glow-orange transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-orange-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy active:scale-[0.98] md:col-span-1 md:min-w-[132px]"
          >
            <Search className="h-[18px] w-[18px]" />
            ძიება
          </button>
        </div>

        {/* Sub row */}
        <div className="mt-2 flex flex-wrap items-center gap-2 px-1 pb-1">
          <button
            onClick={() => go(`/search?${buildParams().toString()}`)}
            className="flex items-center gap-2 rounded-control px-3 py-3 text-[13px] font-bold text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy"
          >
            <SlidersHorizontal className="h-4 w-4" /> დეტალური ფილტრი
          </button>
          <button
            onClick={() => go('/map')}
            className="flex items-center gap-2 rounded-control px-3 py-3 text-[13px] font-bold text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy"
          >
            <MapPin className="h-4 w-4" /> ძიება რუკით
          </button>
          <button
            onClick={aiSearch}
            disabled={aiLoading}
            aria-busy={aiLoading}
            className="flex items-center gap-2 rounded-control bg-gradient-to-r from-sv-blue/25 to-sv-violet/25 px-3 py-3 text-[13px] font-bold text-sv-blue-light ring-1 ring-inset ring-sv-blue/40 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy disabled:opacity-70"
          >
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SparkMark className="h-4 w-4" />}
            {aiLoading ? 'AI იძიებს…' : 'AI ძიება ბუნებრივი ენით'}
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
    </div>
  )
}
