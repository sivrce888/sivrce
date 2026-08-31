'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Search, History } from 'lucide-react'
import SearchSuggest, { type Suggestion, resolveExactPlace } from '@/components/search/SearchSuggest'
import { useI18n, localizedHref } from '@/lib/i18n/context'
import { DEAL_BRAND } from '@/lib/category-brand'
import { DAILY_SIGNAL_KEYS } from '@/lib/features'
import { CITIES } from '@/data/listings'
import { readRecent, writeRecent, recentLabel, type RecentSearch } from './hero-search-mode'
import { isExactLookupQuery } from '@/lib/listing-public-id'
import { searchHref, suggestionToFilters } from '@/lib/search-location'

const TAB_HUES = [DEAL_BRAND.sale, DEAL_BRAND.rent, DEAL_BRAND.daily, DEAL_BRAND.newProjects] as const
const TAB_KEYS = ['search.sale', 'search.rent', 'nav.daily', 'nav.projects'] as const

const QUICK: { q: string; labelKey: 'home.search.quick.vake' | 'home.search.quick.saburtalo' | 'home.search.quick.mtatsminda' | 'home.search.quick.batumi' | 'home.search.quick.oldTbilisi' | 'home.search.quick.digomi' }[] = [
  { q: 'ვაკე', labelKey: 'home.search.quick.vake' },
  { q: 'საბურთალო', labelKey: 'home.search.quick.saburtalo' },
  { q: 'მთაწმინდა', labelKey: 'home.search.quick.mtatsminda' },
  { q: 'ბათუმი', labelKey: 'home.search.quick.batumi' },
  { q: 'ძველი თბილისი', labelKey: 'home.search.quick.oldTbilisi' },
  { q: 'დიღომი', labelKey: 'home.search.quick.digomi' },
]

/** Hero search — one box. Filters live on /search. */
export default function HeroSearch() {
  const [tab, setTab] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [recent, setRecent] = useState<RecentSearch | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { lang, t, b } = useI18n()
  const go = (path: string) => router.push(localizedHref(path, lang))
  const isDaily = tab === 2
  const todayIso = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    router.prefetch(localizedHref('/search', lang))
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate recent from localStorage (SSR-safe)
    setRecent(readRecent())
  }, [router, lang])

  const dealParam = () => (tab === 0 ? 'sale' : tab === 1 ? 'rent' : tab === 2 ? 'daily' : undefined)

  const persistAndGo = (path: string, params: URLSearchParams) => {
    const dealKey = TAB_KEYS[tab] ?? 'search.sale'
    writeRecent({ path, label: recentLabel(params, t(dealKey)) })
    go(path)
  }

  const withDeal = (extra?: Record<string, string | undefined>) => {
    const f: Record<string, string | undefined> = {
      deal: dealParam(),
      ...(isDaily && from && to && from >= todayIso && from < to ? { from, to } : {}),
      ...extra,
    }
    const href = searchHref(f)
    persistAndGo(href, new URLSearchParams(href.split('?')[1] ?? ''))
  }

  const submitSearch = async () => {
    if (tab === 3) {
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
    withDeal(place ? suggestionToFilters(place) : { q: raw || undefined })
  }

  const applySuggestion = (s: Suggestion) => {
    setKeyword(s.kind === 'street' ? s.ka : '')
    withDeal(suggestionToFilters(s))
  }

  const goQuick = (name: string) => {
    withDeal(CITIES.includes(name) ? { city: name } : { district: name })
  }

  const goDailySignal = (feat: (typeof DAILY_SIGNAL_KEYS)[number]) => {
    withDeal({
      deal: 'daily',
      feat,
      ...(feat === 'add.f.partiesAllowed' ? { type: 'house' } : {}),
    })
  }

  const switchTab = (i: number) => {
    setTab(i)
    if (i !== 2) {
      setFrom('')
      setTo('')
    }
  }

  const keywordPh = t('search.keywordPlaceholder')

  return (
    <div
      className="sv-hero-in mx-auto mt-11 w-full min-w-0 max-w-[760px]"
      style={{ animationDelay: '0.16s' }}
    >
      <div
        className="mx-auto mb-2.5 flex w-full max-w-full items-center gap-1 overflow-x-auto rounded-full glass-hero p-1 scrollbar-hide sm:w-fit"
        role="tablist"
        aria-label={t('search.dealType')}
      >
        {TAB_KEYS.map((key, i) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === i}
            onClick={() => switchTab(i)}
            className={`relative shrink-0 rounded-full px-3.5 py-2.5 text-[13px] font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-cloud dark:focus-visible:ring-offset-sv-navy sm:px-5 sm:text-[14px] ${
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
            <span className="relative z-10 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: TAB_HUES[i] }} aria-hidden />
              {t(key)}
            </span>
          </button>
        ))}
      </div>

      <form
        role="search"
        aria-label={t('nav.search')}
        onSubmit={(e) => { e.preventDefault(); void submitSearch() }}
        className="w-full min-w-0 rounded-tile bg-sv-surface/90 p-1.5 shadow-card ring-1 ring-white/80 backdrop-blur-2xl focus-within:ring-sv-blue/25 dark:bg-white/[0.10] dark:shadow-panel-dark dark:ring-white/14 sm:rounded-full sm:p-1.5"
      >
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
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
            <div className="flex min-w-0 items-center gap-1 rounded-full bg-sv-ink/[0.05] px-3 py-2 sm:w-[220px] sm:shrink-0 dark:bg-white/[0.07]">
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
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-sv-orange px-6 text-[15px] font-extrabold text-white shadow-glow-orange transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-orange-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-cloud active:scale-[0.98] dark:focus-visible:ring-offset-sv-navy sm:w-auto sm:shrink-0 sm:min-w-[112px]"
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
          {isDaily ? t('search.features') : b('home.search.popular')}
        </span>
        {isDaily
          ? DAILY_SIGNAL_KEYS.map((f, i) => (
              <button
                key={f}
                type="button"
                onClick={() => goDailySignal(f)}
                className="sv-hero-in rounded-full glass-hero px-4 py-2.5 text-[13px] font-bold text-sv-ink/80 transition-all duration-200 hover:bg-sv-surface hover:text-sv-ink hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-cloud dark:text-white/85 dark:hover:bg-white/20 dark:hover:text-white dark:focus-visible:ring-offset-sv-navy"
                style={{ animationDelay: `${0.28 + i * 0.045}s` }}
              >
                {t(f)}
              </button>
            ))
          : QUICK.map((chip, i) => (
              <button
                key={chip.q}
                type="button"
                onClick={() => goQuick(chip.q)}
                className="sv-hero-in rounded-full glass-hero px-4 py-2.5 text-[13px] font-bold text-sv-ink/80 transition-all duration-200 hover:bg-sv-surface hover:text-sv-ink hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue-light focus-visible:ring-offset-2 focus-visible:ring-offset-sv-cloud dark:text-white/85 dark:hover:bg-white/20 dark:hover:text-white dark:focus-visible:ring-offset-sv-navy"
                style={{ animationDelay: `${0.28 + i * 0.045}s` }}
              >
                {b(chip.labelKey)}
              </button>
            ))}
      </div>
    </div>
  )
}
