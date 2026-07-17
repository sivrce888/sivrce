'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search as SearchIcon, X, LayoutGrid, Rows3,
  ChevronDown, MapPin, RotateCcw, SearchX, Home,
} from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import ListingCard from '@/components/ListingCard'
import SaveSearchControl from '@/components/search/SaveSearchControl'
import { useI18n, type DictKey } from '@/lib/i18n/context'
import { CATEGORY_BRAND, DEAL_BRAND } from '@/lib/category-brand'
import {
  filterListings, CITIES, districtsOf,
  type DealType, type PropType, type SortKey, type Listing,
} from '@/data/listings'

const ease = [0.21, 0.65, 0.2, 1] as const

/* Locked per-category branding (BRAND.md §3.1) */
const PROP_TYPES: { value: PropType; key: DictKey; brand: (typeof CATEGORY_BRAND)[keyof typeof CATEGORY_BRAND] }[] = [
  { value: 'apartment', key: 'prop.apartment', brand: CATEGORY_BRAND.apartments },
  { value: 'house', key: 'prop.house', brand: CATEGORY_BRAND.houses },
  { value: 'commercial', key: 'prop.commercial', brand: CATEGORY_BRAND.commercial },
  { value: 'land', key: 'prop.land', brand: CATEGORY_BRAND.land },
]

const SORTS: { value: SortKey; key: DictKey }[] = [
  { value: 'date', key: 'sort.date' },
  { value: 'price-asc', key: 'sort.priceAsc' },
  { value: 'price-desc', key: 'sort.priceDesc' },
  { value: 'area', key: 'sort.area' },
  { value: 'ai', key: 'sort.ai' },
]

const ROOM_OPTIONS = ['1+', '2', '3', '4', '5+'] as const

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-card border border-sv-ink/[0.06] bg-sv-surface shadow-card">
      <div className="aspect-[4/3] animate-pulse bg-sv-ink/[0.06]" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-sv-ink/[0.08]" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-sv-ink/[0.06]" />
        <div className="h-10 animate-pulse rounded-module bg-sv-ink/[0.05]" />
      </div>
    </div>
  )
}

export default function SearchClient() {
  const params = useSearchParams()
  const router = useRouter()
  const { t } = useI18n()
  const [view, setView] = useState<'grid' | 'list'>('grid')

  // ——— Simulated fetch: brief skeleton on mount + every filter change ———
  // Derived loading state: a params signature is marked "loaded" after 320ms.
  const paramsKey = params.toString()
  const [loadedKey, setLoadedKey] = useState('')
  const loading = loadedKey !== paramsKey

  useEffect(() => {
    if (loadedKey === paramsKey) return
    const timer = window.setTimeout(() => setLoadedKey(paramsKey), 320)
    return () => window.clearTimeout(timer)
  }, [paramsKey, loadedKey])

  // ——— Read filters from URL — invalid values are ignored (whitelists + numeric checks) ———
  const dealParam = params.get('deal')
  const deal: DealType | undefined = dealParam === 'sale' || dealParam === 'rent' || dealParam === 'daily' ? dealParam : undefined
  const typeParam = params.get('type')
  const type: PropType | undefined = PROP_TYPES.some((p) => p.value === typeParam)
    ? (typeParam as PropType)
    : undefined
  const city = params.get('city') ?? undefined
  const district = params.get('district') ?? undefined
  const numParam = (key: string, min = 0): number | undefined => {
    const raw = params.get(key)
    if (raw === null || raw === '') return undefined
    const n = Number(raw)
    return Number.isFinite(n) && n >= min ? n : undefined
  }
  const minPrice = numParam('min')
  const maxPrice = numParam('max')
  const rooms = numParam('rooms', 1)
  const minArea = numParam('amin')
  const maxArea = numParam('amax')
  const sortParam = params.get('sort')
  const sort: SortKey = SORTS.some((s) => s.value === sortParam) ? (sortParam as SortKey) : 'date'
  const q = params.get('q') ?? ''

  // Always build patches on the live URL — never a stale closure
  const patchParams = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(window.location.search)
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === '') next.delete(k)
      else next.set(k, v)
    }
    const qs = next.toString()
    router.replace(qs ? `/search?${qs}` : '/search', { scroll: false })
  }

  // ——— Keyword/price/area inputs: local drafts, debounced into the URL (~300ms) ———
  const urlText = {
    q,
    min: minPrice !== undefined ? String(minPrice) : '',
    max: maxPrice !== undefined ? String(maxPrice) : '',
    amin: minArea !== undefined ? String(minArea) : '',
    amax: maxArea !== undefined ? String(maxArea) : '',
  }
  const [drafts, setDrafts] = useState(urlText)
  const clearDraft = (k: keyof typeof urlText) => setDrafts((d) => ({ ...d, [k]: '' }))

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const patch: Record<string, string | undefined> = {}
      for (const k of ['q', 'min', 'max', 'amin', 'amax'] as const) {
        if (drafts[k] !== urlText[k]) patch[k] = drafts[k] || undefined
      }
      if (Object.keys(patch).length > 0) patchParams(patch)
    }, 300)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- urlText/patchParams derive from drafts+paramsKey
  }, [drafts, paramsKey])

  const results: Listing[] = useMemo(
    () =>
      filterListings({
        deal, type, city, district,
        minPrice, maxPrice, rooms, minArea, maxArea,
        q: q || undefined, sort,
      }),
    [deal, type, city, district, minPrice, maxPrice, rooms, minArea, maxArea, q, sort],
  )

  // ——— Active filter chips ———
  const propType = PROP_TYPES.find((p) => p.value === type)
  const propTypeKey = propType?.key
  const chips: { key: string; label: string; hue?: string; clear: () => void }[] = []
  if (deal) chips.push({ key: 'deal', label: t(deal === 'sale' ? 'search.sale' : deal === 'daily' ? 'add.deal.daily' : 'search.rent'), hue: deal === 'rent' ? DEAL_BRAND.rent : deal === 'daily' ? DEAL_BRAND.daily : DEAL_BRAND.sale, clear: () => patchParams({ deal: undefined }) })
  if (type) chips.push({ key: 'type', label: propTypeKey ? t(propTypeKey) : type, hue: propType?.brand.hue, clear: () => patchParams({ type: undefined }) })
  if (city) chips.push({ key: 'city', label: city, clear: () => patchParams({ city: undefined, district: undefined }) })
  if (district) chips.push({ key: 'district', label: district, clear: () => patchParams({ district: undefined }) })
  if (minPrice !== undefined) chips.push({ key: 'min', label: `${t('search.min')}. $${minPrice.toLocaleString('en-US')}`, clear: () => { clearDraft('min'); patchParams({ min: undefined }) } })
  if (maxPrice !== undefined) chips.push({ key: 'max', label: `${t('search.max')}. $${maxPrice.toLocaleString('en-US')}`, clear: () => { clearDraft('max'); patchParams({ max: undefined }) } })
  if (rooms !== undefined) chips.push({ key: 'rooms', label: t('search.roomsChip', { n: rooms }), clear: () => patchParams({ rooms: undefined }) })
  if (minArea !== undefined) chips.push({ key: 'amin', label: `${t('search.min')}. ${minArea} მ²`, clear: () => { clearDraft('amin'); patchParams({ amin: undefined }) } })
  if (maxArea !== undefined) chips.push({ key: 'amax', label: `${t('search.max')}. ${maxArea} მ²`, clear: () => { clearDraft('amax'); patchParams({ amax: undefined }) } })
  if (q) chips.push({ key: 'q', label: `„${q}"`, clear: () => { clearDraft('q'); patchParams({ q: undefined }) } })

  const resetAll = () => {
    setDrafts({ q: '', min: '', max: '', amin: '', amax: '' })
    router.replace('/search', { scroll: false })
  }

  const selectClass =
    'h-11 w-full appearance-none rounded-control border border-sv-ink/10 bg-sv-surface pl-3.5 pr-9 text-[13px] font-bold text-sv-ink outline-none transition-colors focus:border-sv-blue focus-visible:ring-2 focus-visible:ring-sv-blue/30 cursor-pointer'
  const inputClass =
    'h-11 w-full rounded-control border border-sv-ink/10 bg-sv-surface px-3.5 text-[13px] font-bold text-sv-ink outline-none transition-colors placeholder:text-sv-ink/35 focus:border-sv-blue focus-visible:ring-2 focus-visible:ring-sv-blue/30'

  return (
    <div className="font-geo min-h-screen bg-sv-cloud antialiased">
      <Navbar />

      {/* Page header */}
      <div className="relative overflow-hidden bg-sv-navy pb-8 pt-[104px]">
        <div aria-hidden className="absolute inset-0 bg-dots-dark" />
        <div className="relative mx-auto max-w-[1440px] px-5 md:px-10">
          <h1 className="text-[28px] font-black tracking-[-0.02em] text-white md:text-[36px]">
            {t('search.title')}
          </h1>
          <p className="mt-1.5 flex items-center gap-2 text-[14px] font-semibold text-white/55">
            <MapPin className="h-4 w-4 text-sv-blue" />
            {city ?? t('search.allGeorgia')}
            {district ? ` · ${district}` : ''}
          </p>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-[80px] z-40 border-b border-sv-ink/[0.06] glass-light md:top-[88px]">
        <div className="mx-auto max-w-[1440px] px-4 py-3 md:px-10">
          {/* Row 1: deal + type + location + sort */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Deal segmented */}
            <div className="flex rounded-control bg-sv-ink/[0.05] p-1" role="tablist" aria-label={t('search.dealType')}>
              {([undefined, 'sale', 'rent', 'daily'] as const).map((d) => {
                const label = t(d === undefined ? 'search.all' : d === 'sale' ? 'search.sale' : d === 'daily' ? 'add.deal.daily' : 'search.rent')
                const active = deal === d
                return (
                  <button
                    key={label}
                    role="tab"
                    aria-selected={active}
                    onClick={() => patchParams({ deal: d })}
                    className={`relative rounded-lg px-4 py-2 text-[13px] font-extrabold transition-colors ${
                      active ? 'text-white' : 'text-sv-ink/65 hover:text-sv-ink'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="deal-seg"
                        className="absolute inset-0 rounded-lg"
                        style={{ backgroundColor: d === 'rent' ? DEAL_BRAND.rent : d === 'daily' ? DEAL_BRAND.daily : DEAL_BRAND.sale }}
                        transition={{ type: 'spring', bounce: 0.18, duration: 0.5 }}
                      />
                    )}
                    <span className="relative z-10">{label}</span>
                  </button>
                )
              })}
            </div>

            {/* Property type */}
            <div className="relative">
              <select
                value={type ?? ''}
                onChange={(e) => patchParams({ type: (e.target.value || undefined) as PropType | undefined })}
                className={selectClass}
                aria-label={t('search.propType')}
              >
                <option value="">{t('search.allTypes')}</option>
                {PROP_TYPES.map((p) => (
                  <option key={p.value} value={p.value}>{t(p.key)}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sv-ink/40" />
            </div>

            {/* City */}
            <div className="relative">
              <select
                value={city ?? ''}
                onChange={(e) => patchParams({ city: e.target.value || undefined, district: undefined })}
                className={selectClass}
                aria-label={t('search.city')}
              >
                <option value="">{t('search.allCities')}</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sv-ink/40" />
            </div>

            {/* District */}
            <div className="relative">
              <select
                value={district ?? ''}
                onChange={(e) => patchParams({ district: e.target.value || undefined })}
                className={selectClass}
                aria-label={t('search.district')}
              >
                <option value="">{t('search.allDistricts')}</option>
                {districtsOf(city).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sv-ink/40" />
            </div>

            {/* Keyword */}
            <label className="relative min-w-[160px] flex-1">
              <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sv-ink/35" />
              <input
                value={drafts.q}
                onChange={(e) => setDrafts((d) => ({ ...d, q: e.target.value }))}
                placeholder={t('search.keywordPlaceholder')}
                className={`${inputClass} pl-10`}
                aria-label={t('search.keyword')}
              />
            </label>

            {/* Sort */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => patchParams({ sort: e.target.value === 'date' ? undefined : e.target.value })}
                className={selectClass}
                aria-label={t('search.sort')}
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{t(s.key)}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sv-ink/40" />
            </div>

            {/* View toggle */}
            <div className="ml-auto flex rounded-control bg-sv-ink/[0.05] p-1" role="group" aria-label={t('search.view')}>
              <button
                onClick={() => setView('grid')}
                aria-label={t('search.grid')}
                aria-pressed={view === 'grid'}
                className={`grid h-11 w-11 place-items-center rounded-lg transition-colors ${view === 'grid' ? 'bg-sv-surface text-sv-blue shadow-glow-blue-sm' : 'text-sv-ink/45 hover:text-sv-ink'}`}
              >
                <LayoutGrid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setView('list')}
                aria-label={t('search.list')}
                aria-pressed={view === 'list'}
                className={`grid h-11 w-11 place-items-center rounded-lg transition-colors ${view === 'list' ? 'bg-sv-surface text-sv-blue shadow-glow-blue-sm' : 'text-sv-ink/45 hover:text-sv-ink'}`}
              >
                <Rows3 className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Row 2: price + rooms + area */}
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-black uppercase tracking-wide text-sv-ink/65">{t('search.price')}</span>
              <input
                type="number" min={0} placeholder={t('search.min')}
                value={drafts.min}
                onChange={(e) => setDrafts((d) => ({ ...d, min: e.target.value }))}
                className={`${inputClass} w-[104px]`}
                aria-label={t('search.minPrice')}
              />
              <span className="text-sv-ink/65">—</span>
              <input
                type="number" min={0} placeholder={t('search.max')}
                value={drafts.max}
                onChange={(e) => setDrafts((d) => ({ ...d, max: e.target.value }))}
                className={`${inputClass} w-[104px]`}
                aria-label={t('search.maxPrice')}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-black uppercase tracking-wide text-sv-ink/65">{t('search.rooms')}</span>
              <div className="flex gap-1">
                {ROOM_OPTIONS.map((r, idx) => {
                  const n = idx + 1
                  const active = rooms === n
                  return (
                    <button
                      key={r}
                      onClick={() => patchParams({ rooms: active ? undefined : String(n) })}
                      aria-pressed={active}
                      className={`h-11 min-w-[44px] rounded-control px-2.5 text-[13px] font-extrabold transition-colors ${
                        active
                          ? 'bg-sv-blue text-white shadow-glow-blue-sm'
                          : 'border border-sv-ink/10 bg-sv-surface text-sv-ink/60 hover:border-sv-blue/50 hover:text-sv-blue'
                      }`}
                    >
                      {r}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-black uppercase tracking-wide text-sv-ink/65">{t('search.area')}</span>
              <input
                type="number" min={0} placeholder={t('search.min')}
                value={drafts.amin}
                onChange={(e) => setDrafts((d) => ({ ...d, amin: e.target.value }))}
                className={`${inputClass} w-[88px]`}
                aria-label={t('search.minArea')}
              />
              <span className="text-sv-ink/65">—</span>
              <input
                type="number" min={0} placeholder={t('search.max')}
                value={drafts.amax}
                onChange={(e) => setDrafts((d) => ({ ...d, amax: e.target.value }))}
                className={`${inputClass} w-[88px]`}
                aria-label={t('search.maxArea')}
              />
            </div>

            {(chips.length > 0 || sort !== 'date') && (
              <button
                onClick={resetAll}
                className="ml-auto flex items-center gap-1.5 rounded-control px-3 py-2 text-[13px] font-extrabold text-sv-orange transition-colors hover:bg-sv-orange/10"
              >
                <RotateCcw className="h-3.5 w-3.5" /> {t('search.clear')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <main id="main" className="mx-auto max-w-[1440px] px-5 py-8 md:px-10">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <p className="text-[15px] font-extrabold text-sv-ink" aria-live="polite">
            {loading ? t('search.loading') : t('search.results', { n: results.length })}
          </p>
          <AnimatePresence>
            {chips.map((c) => (
              <motion.button
                key={c.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25, ease }}
                onClick={c.clear}
                aria-label={t('search.removeFilter', { label: c.label })}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-extrabold transition-colors ${
                  c.hue ? '' : 'bg-sv-blue/10 text-sv-blue hover:bg-sv-blue/15'
                }`}
                style={c.hue ? { backgroundColor: `${c.hue}1A`, color: c.hue } : undefined}
              >
                {c.hue && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.hue }} aria-hidden />}
                {c.label}
                <X className="h-3 w-3" aria-hidden="true" />
              </motion.button>
            ))}
          </AnimatePresence>
          <SaveSearchControl />
        </div>

        {loading ? (
          <div className={`grid gap-6 ${view === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center rounded-card border border-sv-ink/[0.06] bg-sv-surface px-6 py-20 text-center shadow-card">
            <span className="grid h-16 w-16 place-items-center rounded-module bg-sv-blue/10">
              <SearchX className="h-7 w-7 text-sv-blue" />
            </span>
            <h2 className="mt-5 text-[20px] font-black tracking-[-0.02em] text-sv-ink">
              {t('search.emptyTitle')}
            </h2>
            <p className="mt-2 max-w-[380px] text-[15px] font-semibold leading-relaxed text-sv-ink/50">
              {t('search.emptyText')}
            </p>
            <button
              onClick={resetAll}
              className="mt-6 flex h-11 items-center gap-2 rounded-full bg-sv-blue px-6 text-[14px] font-extrabold text-white transition-all hover:bg-sv-blue-deep"
            >
              <RotateCcw className="h-4 w-4" /> {t('search.resetFilters')}
            </button>
          </div>
        ) : (
          <div className={view === 'grid' ? 'grid gap-6 sm:grid-cols-2 xl:grid-cols-3' : 'grid grid-cols-1 gap-5'}>
            {results.map((l, i) => (
              <ListingCard key={l.id} l={l} i={i} layout={view === 'grid' ? 'wide' : 'list'} />
            ))}
          </div>
        )}

        {/* SEO hint */}
        {!loading && results.length > 0 && (
          <p className="mt-10 flex items-start gap-2 text-[13px] font-semibold leading-relaxed text-sv-ink/65">
            <Home className="mt-0.5 h-4 w-4 shrink-0" />
            {t('search.seoHint')}
          </p>
        )}
      </main>

      <Footer />
    </div>
  )
}
