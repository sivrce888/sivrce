'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Home, Banknote, Ruler, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { SparkMark } from '@/components/SparkMark'
import { DEAL_BRAND } from '@/lib/category-brand'

/* Deal tabs — locked DEAL_BRAND (BRAND.md §3.2) */
const TABS = [
  { label: 'იყიდება', hue: DEAL_BRAND.sale },
  { label: 'ქირავდება', hue: DEAL_BRAND.rent },
  { label: 'დღიურად', hue: DEAL_BRAND.daily },
  { label: 'ახალი პროექტები', hue: DEAL_BRAND.newProjects },
]

const QUICK = ['ვაკე', 'საბურთალო', 'მთაწმინდა', 'ბათუმი', 'ძველი თბილისი', 'დიღომი']

/** Interactive hero search panel — the only client island in the hero. */
export default function HeroSearch() {
  const [tab, setTab] = useState(0)
  const [keyword, setKeyword] = useState('')
  const router = useRouter()

  const submitSearch = () => {
    if (tab === 3) {
      // „ახალი პროექტები" tab → homepage projects section
      document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    const params = new URLSearchParams()
    if (tab === 0) params.set('deal', 'sale')
    if (tab === 1) params.set('deal', 'rent')
    if (tab === 2) params.set('deal', 'daily')
    if (keyword.trim()) params.set('q', keyword.trim())
    const qs = params.toString()
    router.push(qs ? `/search?${qs}` : '/search')
  }

  const goDistrict = (q: string) => router.push(`/search?q=${encodeURIComponent(q)}`)

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
          <label className="col-span-2 flex items-center gap-3 rounded-control bg-white/[0.07] px-4 py-3.5 transition-colors focus-within:bg-white/[0.12] md:col-span-1">
            <Search className="h-[18px] w-[18px] shrink-0 text-white/50" />
            <input
              type="text"
              placeholder="ქალაქი, უბანი, ქუჩა ან ID"
              aria-label="ქალაქი, უბანი, ქუჩა ან ID"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
              className="w-full bg-transparent text-[15px] font-semibold text-white placeholder:text-white/45 focus:outline-none"
            />
          </label>
          {[
            { icon: Home, label: 'ტიპი', value: 'ბინა', hue: '#8FB4FF' },
            { icon: Banknote, label: 'ფასი', value: 'ნებისმიერი', hue: undefined },
            { icon: Ruler, label: 'ფართი', value: '40+ მ²', hue: undefined },
          ].map((f) => (
            <button
              key={f.label}
              onClick={() => router.push('/search')}
              className="group flex items-center gap-3 rounded-control bg-white/[0.07] px-4 py-3.5 text-left transition-colors hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy"
            >
              <f.icon className="h-[18px] w-[18px] shrink-0 text-white/50" style={f.hue ? { color: f.hue } : undefined} />
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
            onClick={() => router.push('/search')}
            className="flex items-center gap-2 rounded-control px-3 py-3 text-[13px] font-bold text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy"
          >
            <MapPin className="h-4 w-4" /> ძიება რუკით
          </button>
          <button className="flex items-center gap-2 rounded-control bg-gradient-to-r from-sv-blue/25 to-sv-violet/25 px-3 py-3 text-[13px] font-bold text-sv-blue-light ring-1 ring-inset ring-sv-blue/40 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-navy">
            <SparkMark className="h-4 w-4" /> AI ძიება ბუნებრივი ენით
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
