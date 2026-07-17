'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Home, Banknote, Ruler, SlidersHorizontal, ChevronDown, Loader2 } from 'lucide-react'
import { SparkMark } from '@/components/SparkMark'
import SearchSuggest from '@/components/search/SearchSuggest'
import { DEAL_BRAND } from '@/lib/category-brand'

/* Deal tabs — locked DEAL_BRAND (BRAND.md §3.2) */
const TABS = [
  { label: 'იყიდება', hue: DEAL_BRAND.sale },
  { label: 'ქირავდება', hue: DEAL_BRAND.rent },
  { label: 'დღიურად', hue: DEAL_BRAND.daily },
  { label: 'ახალი პროექტები', hue: DEAL_BRAND.newProjects },
]

const QUICK = ['ვაკე', 'საბურთალო', 'მთაწმინდა', 'ბათუმი', 'ძველი თბილისი', 'დიღომი']

const DEFAULT_PLACEHOLDER = 'ქალაქი, უბანი, ქუჩა ან ID'
const AI_PLACEHOLDER = 'მაგ.: 3 ოთახიანი ბინა ვაკეში $200K-მდე'

/** Interactive hero search panel — the only client island in the hero. */
export default function HeroSearch() {
  const [tab, setTab] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiHint, setAiHint] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const dealParam = () => (tab === 0 ? 'sale' : tab === 1 ? 'rent' : tab === 2 ? 'daily' : undefined)

  const submitSearch = () => {
    if (tab === 3) {
      // „ახალი პროექტები" tab → homepage projects section
      document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    const params = new URLSearchParams()
    const deal = dealParam()
    if (deal) params.set('deal', deal)
    if (keyword.trim()) params.set('q', keyword.trim())
    const qs = params.toString()
    router.push(qs ? `/search?${qs}` : '/search')
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
      if (f.city) params.set('city', String(f.city))
      if (f.district) params.set('district', String(f.district))
      if (f.minPrice) params.set('min', String(f.minPrice))
      if (f.maxPrice) params.set('max', String(f.maxPrice))
      if (f.rooms) params.set('rooms', String(f.rooms))
      if (f.minArea) params.set('amin', String(f.minArea))
      if (f.maxArea) params.set('amax', String(f.maxArea))
      if (f.keywords) params.set('q', String(f.keywords))
      router.push(`/search?${params.toString()}`)
    } catch {
      submitSearch() // network/parse failure → plain keyword search still works
    } finally {
      setAiLoading(false)
    }
  }

  /** Filter pills → results page with the pill's filter pre-applied. */
  const goFilters = (extra: Record<string, string>) => {
    const params = new URLSearchParams(extra)
    const deal = dealParam()
    if (deal) params.set('deal', deal)
    router.push(`/search?${params.toString()}`)
  }

  const goDistrict = (q: string) => {
    const params = new URLSearchParams({ q })
    const deal = dealParam()
    if (deal) params.set('deal', deal)
    router.push(`/search?${params.toString()}`)
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

      {/* Search bar */}
      <div className="glass rounded-b-tile rounded-tr-tile p-2 shadow-panel-dark">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
          <SearchSuggest
            variant="dark"
            value={keyword}
            onChange={(v) => { setKeyword(v); setAiHint(false) }}
            onPick={(v) => { setKeyword(v); router.push(`/search?q=${encodeURIComponent(v)}${dealParam() ? `&deal=${dealParam()}` : ''}`) }}
            onSubmit={submitSearch}
            placeholder={aiHint ? AI_PLACEHOLDER : DEFAULT_PLACEHOLDER}
            ariaLabel={DEFAULT_PLACEHOLDER}
            inputRef={inputRef}
            className="col-span-2 md:col-span-1"
          />
          {(
            [
              { icon: Home, label: 'ტიპი', value: 'ბინა', tinted: true, target: { type: 'apartment' } },
              { icon: Banknote, label: 'ფასი', value: 'ნებისმიერი', tinted: false, target: {} },
              { icon: Ruler, label: 'ფართი', value: '40+ მ²', tinted: false, target: { amin: '40' } },
            ] satisfies { icon: typeof Home; label: string; value: string; tinted: boolean; target: Record<string, string> }[]
          ).map((f) => (
            <button
              key={f.label}
              onClick={() => goFilters(f.target as Record<string, string>)}
              className="group flex items-center gap-3 rounded-control bg-white/[0.07] px-4 py-3.5 text-left transition-colors hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy"
            >
              <f.icon className={`h-[18px] w-[18px] shrink-0 ${f.tinted ? 'text-sv-blue-light' : 'text-white/50'}`} />
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-bold uppercase tracking-wider text-white/70">
                  {f.label}
                </span>
                <span className="block truncate text-[14px] font-bold text-white">{f.value}</span>
              </span>
              <ChevronDown className="h-4 w-4 text-white/40 transition-transform group-hover:translate-y-0.5" />
            </button>
          ))}
          <button
            onClick={submitSearch}
            className="col-span-2 flex items-center justify-center gap-2.5 rounded-control bg-sv-orange px-7 py-3.5 text-[15px] font-extrabold text-white shadow-glow-orange transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-orange-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy active:scale-[0.98] md:col-span-1"
          >
            <Search className="h-[18px] w-[18px]" />
            ძიება
          </button>
        </div>

        {/* Sub row */}
        <div className="mt-2 flex flex-wrap items-center gap-2 px-1 pb-1">
          <button
            onClick={() => router.push('/search')}
            className="flex items-center gap-2 rounded-control px-3 py-3 text-[13px] font-bold text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy"
          >
            <SlidersHorizontal className="h-4 w-4" /> დეტალური ფილტრი
          </button>
          <button
            onClick={() => router.push('/map')}
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
            onClick={() => goDistrict(q)}
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
