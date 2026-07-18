'use client'

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, LayoutGrid, Rows3,
  ChevronDown, MapPin, RotateCcw, SearchX, Home, SlidersHorizontal,
} from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import ListingCard from '@/components/ListingCard'
import SaveSearchControl from '@/components/search/SaveSearchControl'
import SearchSuggest from '@/components/search/SearchSuggest'
import { useSearchStrings } from '@/components/search/i18n'
import { useRecentIds } from '@/lib/recent'
import { useCurrency } from '@/lib/currency'
import { useI18n, type DictKey } from '@/lib/i18n/context'
import { localizedHref } from '@/lib/i18n/core'
import { CATEGORY_BRAND, DEAL_BRAND } from '@/lib/category-brand'
import { CONDITION_KEYS, BUILDING_STATUS_KEYS, FEATURE_KEYS } from '@/lib/features'
import type { SearchLocations } from '@/lib/listings-db'
import {
  CITIES, districtsOf, USD_GEL,
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
  { value: 'm2asc', key: 'sort.m2asc' },
  { value: 'm2desc', key: 'sort.m2desc' },
  { value: 'ai', key: 'sort.ai' },
]

const DEALS: (DealType | undefined)[] = [undefined, 'sale', 'rent', 'daily', 'pledge']
const dealLabelKey = (d: DealType | undefined): DictKey =>
  d === undefined ? 'search.all' : d === 'sale' ? 'search.sale' : d === 'rent' ? 'search.rent' : d === 'daily' ? 'add.deal.daily' : 'add.deal.pledge'
const dealHue = (d: DealType | undefined): string =>
  d === 'rent' ? DEAL_BRAND.rent : d === 'daily' ? DEAL_BRAND.daily : d === 'pledge' ? DEAL_BRAND.pledge : DEAL_BRAND.sale

const ROOM_OPTIONS = ['1+', '2', '3', '4', '5+'] as const
const COUNT_OPTIONS = [1, 2, 3, 4] as const

/** CSV param → whitelisted vocabulary keys (module-level so identity is stable). */
const splitCsv = (raw: string, allowed: readonly string[]): DictKey[] =>
  raw.split(',').filter((v) => allowed.includes(v)) as DictKey[]

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

/** Compact rail card — thumb + price + one-line meta; 3–4 visible per viewport. */
function CompactCard({ l }: { l: Listing }) {
  const { format } = useCurrency()
  const { t } = useI18n()
  const suffix = l.dealType === 'rent' ? t('detail.perMonth') : l.dealType === 'daily' ? t('detail.perDay') : ''
  return (
    <Link
      href={`/listing/${l.id}`}
      className="group flex w-[264px] shrink-0 items-center gap-3 rounded-module border border-sv-ink/[0.06] bg-sv-surface p-2.5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-blue"
    >
      <span className="relative h-16 w-20 shrink-0 overflow-hidden rounded-control">
        {/* decorative — the title next to it carries the meaning */}
        <Image src={l.img} alt="" fill sizes="80px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
      </span>
      <span className="min-w-0">
        <span className="block text-[14px] font-extrabold text-sv-ink transition-colors group-hover:text-sv-blue">
          {format(l.priceGEL)}{suffix}
        </span>
        <span className="block truncate text-[12px] font-semibold text-sv-ink/55">{l.title}</span>
        <span className="block text-[12px] font-semibold text-sv-ink/40">{l.area} მ² · {l.city}</span>
      </span>
    </Link>
  )
}

/** Map an /api/search hit → Listing shape for the card components. */
function mapHit(h: Record<string, unknown>): Listing {
  const postedAt = (h.createdAt as string) ?? new Date().toISOString()
  const tier = h.tier as string | undefined
  return {
    id: h.id as string,
    title: h.title as string,
    city: h.city as string,
    district: h.district as string,
    dealType: h.dealType as DealType,
    propType: h.propertyType as PropType,
    priceUSD: h.price as number,
    priceGEL: Math.round((h.price as number) * USD_GEL),
    perM2USD: (h.pricePerSqm as number) ?? 0,
    area: h.area as number,
    rooms: h.rooms as number,
    images: (h.images as string[]) ?? [],
    img: ((h.images as string[])?.[0]) ?? '/images/p1.webp',
    address: (h.address as string) ?? '',
    beds: (h.bedrooms as number) ?? (h.rooms as number),
    baths: (h.bathrooms as number) ?? 1,
    floor: (h.floor as number) ?? 0,
    totalFloors: (h.totalFloors as number) ?? 0,
    views: (h.views as number) ?? 0,
    badge: tier === 'super_vip' ? 'SUPER VIP' : tier === 'diamond' ? 'VIP+' : tier === 'vip' ? 'VIP' : null,
    ai: { score: (h.trustScore as number) ?? 70, label: '' },
    features: (h.features as string[]) ?? [],
    description: (h.description as string) ?? '',
    coords: { lat: (h.lat as number) ?? 41.7, lng: (h.lng as number) ?? 44.8 },
    postedAt,
    agent: (h.agent as Listing['agent']) ?? { name: 'Sivrce', phone: '', agency: '' },
    isNew: Date.now() - new Date(postedAt).getTime() < 72 * 3600_000,
  }
}

export default function SearchClient({ locations }: { locations?: SearchLocations }) {
  const params = useSearchParams()
  const router = useRouter()
  const { t, lang } = useI18n()
  const s = useSearchStrings()
  // Live location facets from the server (DB-backed); static catalog fallback.
  const hasLive = Boolean(locations && locations.cities.length > 0)
  const locationDistricts = (c?: string): string[] =>
    hasLive && locations ? (c ? (locations.districts[c] ?? []) : Object.values(locations.districts).flat()) : districtsOf(c)
  // Remember grid/list preference across visits (SSR-safe external store).
  const savedView = useSyncExternalStore(
    () => () => {},
    () => (window.localStorage.getItem('sivrce:view') === 'list' ? 'list' : 'grid'),
    () => 'grid' as const,
  )
  const [chosen, setView] = useState<'grid' | 'list' | null>(null)
  const view = chosen ?? savedView

  useEffect(() => {
    window.localStorage.setItem('sivrce:view', view)
  }, [view])

  // ——— Read filters from URL — invalid values are ignored (whitelists + numeric checks) ———
  const paramsKey = params.toString()
  const dealParam = params.get('deal')
  const deal: DealType | undefined = DEALS.includes(dealParam as DealType) ? (dealParam as DealType) : undefined
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
  // More-filters params — CSVs whitelisted against the stored vocabulary.
  const beds = numParam('beds', 1)
  const baths = numParam('baths', 1)
  const floorMin = numParam('fmin')
  const floorMax = numParam('fmax')
  const condRaw = params.get('cond') ?? ''
  const bstatRaw = params.get('bstat') ?? ''
  const featRaw = params.get('feat') ?? ''
  // Memoized so the search effect only re-fires on real param changes.
  const cond = useMemo(() => splitCsv(condRaw, CONDITION_KEYS), [condRaw])
  const bstat = useMemo(() => splitCsv(bstatRaw, BUILDING_STATUS_KEYS), [bstatRaw])
  const feat = useMemo(() => splitCsv(featRaw, FEATURE_KEYS), [featRaw])
  const photo = params.get('photo') === '1'
  const verifiedOnly = params.get('verified') === '1'
  const pets = params.get('pets') === '1'
  const sellerParam = params.get('seller')
  const seller: 'owner' | 'agency' | undefined =
    sellerParam === 'owner' || sellerParam === 'agency' ? sellerParam : undefined
  const cur: 'USD' | 'GEL' = params.get('cur') === 'GEL' ? 'GEL' : 'USD'
  // Page lives in the URL — shareable and SSR-friendly. Filter changes reset it (see patchParams).
  const page = numParam('page', 1) ?? 1
  // Daily-rent availability window (only meaningful for the daily deal).
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
  const fromRaw = params.get('from') ?? ''
  const toRaw = params.get('to') ?? ''
  const from = deal === 'daily' && DATE_RE.test(fromRaw) ? fromRaw : undefined
  const to = deal === 'daily' && DATE_RE.test(toRaw) && (!from || toRaw > from) ? toRaw : undefined
  const todayIso = new Date().toISOString().slice(0, 10)

  // City/district options: live facets, but keep a stale URL value selectable.
  const cityBase = hasLive && locations ? locations.cities : CITIES
  const cityOptions = city && !cityBase.includes(city) ? [...cityBase, city] : cityBase
  const distBase = locationDistricts(city)
  const distOptions = district && !distBase.includes(district) ? [...distBase, district] : distBase

  // Always build patches on the live URL — never a stale closure
  const patchParams = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(window.location.search)
    // Any filter change resets pagination — unless the patch IS the page change.
    if (!('page' in patch)) next.delete('page')
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === '') next.delete(k)
      else next.set(k, v)
    }
    const qs = next.toString()
    // Keep the locale prefix (/en/search …) — ka stays unprefixed per core.
    const base = localizedHref('/search', lang)
    router.replace(qs ? `${base}?${qs}` : base, { scroll: false })
  }

  // ——— Keyword/price/area inputs: local drafts, debounced into the URL (~300ms) ———
  const urlText = {
    q,
    min: minPrice !== undefined ? String(minPrice) : '',
    max: maxPrice !== undefined ? String(maxPrice) : '',
    amin: minArea !== undefined ? String(minArea) : '',
    amax: maxArea !== undefined ? String(maxArea) : '',
    fmin: floorMin !== undefined ? String(floorMin) : '',
    fmax: floorMax !== undefined ? String(floorMax) : '',
  }
  const [drafts, setDrafts] = useState(urlText)
  const clearDraft = (k: keyof typeof urlText) => setDrafts((d) => ({ ...d, [k]: '' }))

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const patch: Record<string, string | undefined> = {}
      for (const k of ['q', 'min', 'max', 'amin', 'amax', 'fmin', 'fmax'] as const) {
        if (drafts[k] !== urlText[k]) patch[k] = drafts[k] || undefined
      }
      if (Object.keys(patch).length > 0) patchParams(patch)
    }, 300)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- urlText/patchParams derive from drafts+paramsKey
  }, [drafts, paramsKey])

  // ——— API-driven search (page from the URL; prev/next navigation) —————————
  const [results, setResults] = useState<Listing[]>([])
  const [totalResults, setTotalResults] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [searchLoading, setSearchLoading] = useState(true)
  // Facet counts from Meilisearch (null on the DB fallback → counts hidden).
  const [facets, setFacets] = useState<Record<string, Record<string, number>> | null>(null)
  const fcount = (dim: string, key: string): number | undefined => facets?.[dim]?.[key]
  const fmtCount = (n: number | undefined) => (n === undefined ? '' : ` (${n})`)

  // Map filter state → /api/search query params and fetch.
  // ponytail: paramsKey already encodes every filter; refetch on that alone.
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setSearchLoading(true)
      try {
        const sp = new URLSearchParams()
        if (deal) sp.set('dealType', deal)
        if (type) sp.set('propertyType', type)
        if (city) sp.set('city', city)
        if (district) sp.set('district', district)
        if (minPrice !== undefined) sp.set('minPrice', String(minPrice))
        if (maxPrice !== undefined) sp.set('maxPrice', String(maxPrice))
        if (rooms !== undefined) sp.set('rooms', String(rooms))
        if (minArea !== undefined) sp.set('minArea', String(minArea))
        if (maxArea !== undefined) sp.set('maxArea', String(maxArea))
        if (q) sp.set('q', q)
        if (sort !== 'date') sp.set('sort', sort)
        if (beds !== undefined) sp.set('beds', String(beds))
        if (baths !== undefined) sp.set('baths', String(baths))
        if (floorMin !== undefined) sp.set('fmin', String(floorMin))
        if (floorMax !== undefined) sp.set('fmax', String(floorMax))
        if (condRaw) sp.set('cond', condRaw)
        if (bstatRaw) sp.set('bstat', bstatRaw)
        if (featRaw) sp.set('feat', featRaw)
        if (photo) sp.set('photo', '1')
        if (verifiedOnly) sp.set('verified', '1')
        if (pets) sp.set('pets', '1')
        if (seller) sp.set('seller', seller)
        if (from) sp.set('from', from)
        if (to) sp.set('to', to)
        if (cur === 'GEL') sp.set('cur', 'GEL')
        sp.set('page', String(page))
        sp.set('pageSize', '24')

        const res = await fetch(`/api/search?${sp.toString()}`)
        const json = await res.json()
        if (cancelled) return
        if (json.ok && Array.isArray(json.hits)) {
          setResults((json.hits as Record<string, unknown>[]).map(mapHit))
          setTotalResults(json.totalHits as number)
          setTotalPages((json.totalPages as number) ?? 0)
          setFacets((json.facets as Record<string, Record<string, number>> | undefined) ?? null)
        } else {
          setResults([])
          setTotalResults(0)
          setTotalPages(0)
          setFacets(null)
        }
      } catch {
        if (cancelled) return
        setResults([])
        setTotalResults(0)
        setTotalPages(0)
      } finally {
        if (!cancelled) setSearchLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- paramsKey is the single change signal
  }, [paramsKey])

  // Page navigation — the page number itself lives in the URL.
  const goPage = (n: number) => {
    patchParams({ page: n <= 1 ? undefined : String(n) })
    document.getElementById('main')?.scrollIntoView({ behavior: 'smooth' })
  }

  // ——— Mobile filter sheet + "More filters" panel state ———
  const [sheetOpen, setSheetOpen] = useState(false)
  const moreCount = (beds !== undefined ? 1 : 0) + (baths !== undefined ? 1 : 0)
    + (floorMin !== undefined || floorMax !== undefined ? 1 : 0)
    + cond.length + bstat.length + feat.length + (photo ? 1 : 0) + (verifiedOnly ? 1 : 0)
    + (pets ? 1 : 0) + (seller ? 1 : 0)
  const [moreOpen, setMoreOpen] = useState(moreCount > 0)

  // Sheet: Escape to close + body scroll lock while open.
  useEffect(() => {
    if (!sheetOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSheetOpen(false) }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [sheetOpen])

  const toggleCsv = (key: string, current: DictKey[], v: DictKey) => {
    const next = current.includes(v) ? current.filter((x) => x !== v) : [...current, v]
    patchParams({ [key]: next.length ? next.join(',') : undefined })
  }

  // ——— Recently viewed (retention rail above results) ———
  const recentIds = useRecentIds()
  const recentKey = recentIds.slice(0, 8).join(',')
  // Stored with its key: render only when it matches the live ids — no sync reset.
  const [recents, setRecents] = useState<{ key: string; items: Listing[] }>({ key: '', items: [] })
  useEffect(() => {
    if (!recentKey) return
    let alive = true
    fetch(`/api/search?ids=${recentKey}`)
      .then((r) => r.json())
      .then((j) => {
        if (alive && j.ok && Array.isArray(j.hits)) {
          setRecents({ key: recentKey, items: (j.hits as Record<string, unknown>[]).map(mapHit) })
        }
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [recentKey])
  const recentItems = recents.key === recentKey ? recents.items : []

  // Skeleton only when there is nothing on screen yet — page 2+ keeps cards visible.
  const showSkeleton = searchLoading && results.length === 0

  // ——— Active filter chips ———
  const propType = PROP_TYPES.find((p) => p.value === type)
  const propTypeKey = propType?.key
  const chips: { key: string; label: string; hue?: string; clear: () => void }[] = []
  if (deal) chips.push({ key: 'deal', label: t(dealLabelKey(deal)), hue: dealHue(deal), clear: () => patchParams({ deal: undefined }) })
  if (type) chips.push({ key: 'type', label: propTypeKey ? t(propTypeKey) : type, hue: propType?.brand.hue, clear: () => patchParams({ type: undefined }) })
  if (city) chips.push({ key: 'city', label: city, clear: () => patchParams({ city: undefined, district: undefined }) })
  if (district) chips.push({ key: 'district', label: district, clear: () => patchParams({ district: undefined }) })
  if (minPrice !== undefined) chips.push({ key: 'min', label: `${t('search.min')}. $${minPrice.toLocaleString('en-US')}`, clear: () => { clearDraft('min'); patchParams({ min: undefined }) } })
  if (maxPrice !== undefined) chips.push({ key: 'max', label: `${t('search.max')}. $${maxPrice.toLocaleString('en-US')}`, clear: () => { clearDraft('max'); patchParams({ max: undefined }) } })
  if (rooms !== undefined) chips.push({ key: 'rooms', label: t('search.roomsChip', { n: rooms }), clear: () => patchParams({ rooms: undefined }) })
  if (minArea !== undefined) chips.push({ key: 'amin', label: `${t('search.min')}. ${minArea} მ²`, clear: () => { clearDraft('amin'); patchParams({ amin: undefined }) } })
  if (maxArea !== undefined) chips.push({ key: 'amax', label: `${t('search.max')}. ${maxArea} მ²`, clear: () => { clearDraft('amax'); patchParams({ amax: undefined }) } })
  if (q) chips.push({ key: 'q', label: `„${q}"`, clear: () => { clearDraft('q'); patchParams({ q: undefined }) } })
  if (beds !== undefined) chips.push({ key: 'beds', label: t('search.bedsChip', { n: beds }), clear: () => patchParams({ beds: undefined }) })
  if (baths !== undefined) chips.push({ key: 'baths', label: t('search.bathsChip', { n: baths }), clear: () => patchParams({ baths: undefined }) })
  if (floorMin !== undefined || floorMax !== undefined) chips.push({ key: 'floor', label: `${t('search.floor')}: ${floorMin ?? '—'}–${floorMax ?? '—'}`, clear: () => { clearDraft('fmin'); clearDraft('fmax'); patchParams({ fmin: undefined, fmax: undefined }) } })
  if (cond.length) chips.push({ key: 'cond', label: `${t('search.condition')} · ${cond.length}`, clear: () => patchParams({ cond: undefined }) })
  if (bstat.length) chips.push({ key: 'bstat', label: `${t('search.buildingStatus')} · ${bstat.length}`, clear: () => patchParams({ bstat: undefined }) })
  if (feat.length) chips.push({ key: 'feat', label: `${t('search.features')} · ${feat.length}`, clear: () => patchParams({ feat: undefined }) })
  if (photo) chips.push({ key: 'photo', label: t('search.photoOnly'), clear: () => patchParams({ photo: undefined }) })
  if (verifiedOnly) chips.push({ key: 'verified', label: t('search.verifiedOnly'), clear: () => patchParams({ verified: undefined }) })
  if (pets) chips.push({ key: 'pets', label: t('search.petsOnly'), clear: () => patchParams({ pets: undefined }) })
  if (seller) chips.push({ key: 'seller', label: t(seller === 'owner' ? 'search.sellerOwner' : 'search.sellerAgency'), clear: () => patchParams({ seller: undefined }) })
  if (from && to) chips.push({ key: 'dates', label: `${from} → ${to}`, clear: () => patchParams({ from: undefined, to: undefined }) })
  if (cur === 'GEL' && (minPrice !== undefined || maxPrice !== undefined)) chips.push({ key: 'cur', label: '₾', clear: () => patchParams({ cur: undefined }) })

  const resetAll = () => {
    setDrafts({ q: '', min: '', max: '', amin: '', amax: '', fmin: '', fmax: '' })
    router.replace(localizedHref('/search', lang), { scroll: false })
  }

  const selectClass =
    'h-11 w-full appearance-none rounded-control border border-sv-ink/10 bg-sv-surface pl-3.5 pr-9 text-[13px] font-bold text-sv-ink outline-none transition-colors focus:border-sv-blue focus-visible:ring-2 focus-visible:ring-sv-blue/30 cursor-pointer'
  const inputClass =
    'h-11 w-full rounded-control border border-sv-ink/10 bg-sv-surface px-3.5 text-[13px] font-bold text-sv-ink outline-none transition-colors placeholder:text-sv-ink/35 focus:border-sv-blue focus-visible:ring-2 focus-visible:ring-sv-blue/30'
  const labelClass = 'mb-1.5 block text-[12px] font-black uppercase tracking-wide text-sv-ink/65'
  const numChip = (active: boolean) =>
    `h-11 min-w-[44px] rounded-control px-2.5 text-[13px] font-extrabold transition-colors ${
      active
        ? 'bg-sv-blue text-white shadow-glow-blue-sm'
        : 'border border-sv-ink/10 bg-sv-surface text-sv-ink/60 hover:border-sv-blue/50 hover:text-sv-blue'
    }`
  const tagChip = (active: boolean) =>
    `h-9 rounded-full px-3.5 text-[12px] font-extrabold transition-colors ${
      active
        ? 'bg-sv-blue text-white shadow-glow-blue-sm'
        : 'border border-sv-ink/10 bg-sv-surface text-sv-ink/60 hover:border-sv-blue/50 hover:text-sv-blue'
    }`

  /* Whole filter UI — rendered once in the desktop sticky bar and again inside
     the mobile bottom sheet (mobile swaps the deal-pill layoutId + hides the
     view toggle, which only makes sense next to results). */
  const filtersBody = (mobile: boolean) => (
    <>
      {/* Row 1: deal + type + location + sort */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Deal segmented */}
        <div className="scrollbar-hide flex max-w-full overflow-x-auto rounded-control bg-sv-ink/[0.05] p-1 [mask-image:linear-gradient(to_right,black_calc(100%-32px),transparent)] md:[mask-image:none]" role="group" aria-label={t('search.dealType')}>
          {DEALS.map((d) => {
            const label = t(dealLabelKey(d))
            const count = d === undefined ? undefined : fcount('dealType', d)
            const active = deal === d
            return (
              <button
                key={label}
                type="button"
                aria-pressed={active}
                onClick={() => patchParams({ deal: d, ...(d === 'daily' ? {} : { from: undefined, to: undefined }) })}
                className={`relative whitespace-nowrap rounded-lg px-4 py-2.5 text-[13px] font-extrabold transition-colors ${
                  active ? 'text-white' : 'text-sv-ink/65 hover:text-sv-ink'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId={mobile ? 'deal-seg-m' : 'deal-seg'}
                    className="absolute inset-0 rounded-lg"
                    style={{ backgroundColor: dealHue(d) }}
                    transition={{ type: 'spring', bounce: 0.18, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">
                  {label}
                  {count !== undefined && (
                    <span className={`ml-1 text-[11px] font-bold ${active ? 'text-white/80' : 'text-sv-ink/40'}`}>
                      {count}
                    </span>
                  )}
                </span>
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
              <option key={p.value} value={p.value}>{t(p.key)}{fmtCount(fcount('propertyType', p.value))}</option>
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
            {cityOptions.map((c) => (
              <option key={c} value={c}>{c}{fmtCount(fcount('city', c))}</option>
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
            {distOptions.map((d) => (
              <option key={d} value={d}>{d}{fmtCount(fcount('district', d))}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sv-ink/40" />
        </div>

        {/* Keyword + location autocomplete */}
        <SearchSuggest
          variant="light"
          value={drafts.q}
          onChange={(v) => setDrafts((d) => ({ ...d, q: v }))}
          onPick={(v) => { setDrafts((d) => ({ ...d, q: v })); patchParams({ q: v }) }}
          onSubmit={() => patchParams({ q: drafts.q || undefined })}
          placeholder={t('search.keywordPlaceholder')}
          ariaLabel={t('search.keyword')}
          className="min-w-[160px] flex-1"
        />

        {/* Sort */}
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => patchParams({ sort: e.target.value === 'date' ? undefined : e.target.value })}
            className={selectClass}
            aria-label={t('search.sort')}
          >
            {SORTS.map((so) => (
              <option key={so.value} value={so.value}>{t(so.key)}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sv-ink/40" />
        </div>

        {/* View toggle — desktop only (it lives next to the results) */}
        {!mobile && (
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
        )}
      </div>

      {/* Row 2: price + currency + rooms + area */}
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
          <div className="ml-1 flex rounded-control bg-sv-ink/[0.05] p-1" role="group" aria-label={t('search.currency')}>
            {(['USD', 'GEL'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => patchParams({ cur: c === 'USD' ? undefined : 'GEL' })}
                aria-pressed={cur === c}
                className={`h-9 w-9 rounded-lg text-[13px] font-extrabold transition-colors ${cur === c ? 'bg-sv-surface text-sv-blue shadow-glow-blue-sm' : 'text-sv-ink/45 hover:text-sv-ink'}`}
              >
                {c === 'USD' ? '$' : '₾'}
              </button>
            ))}
          </div>
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
                  className={numChip(active)}
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

        {deal === 'daily' && (
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-black uppercase tracking-wide text-sv-ink/65">{t('search.checkIn')}</span>
            <input
              type="date"
              value={from ?? ''}
              min={todayIso}
              onChange={(e) => patchParams({ from: e.target.value || undefined, ...(from && to && e.target.value >= to ? { to: undefined } : {}) })}
              className={`${inputClass} w-[150px]`}
              aria-label={t('search.checkIn')}
            />
            <span className="text-sv-ink/65">—</span>
            <input
              type="date"
              value={to ?? ''}
              min={from ?? todayIso}
              onChange={(e) => patchParams({ to: e.target.value || undefined })}
              className={`${inputClass} w-[150px]`}
              aria-label={t('search.checkOut')}
            />
          </div>
        )}

        {(chips.length > 0 || sort !== 'date') && (
          <button
            onClick={resetAll}
            className="ml-auto flex items-center gap-1.5 rounded-control px-3 py-2.5 text-[13px] font-extrabold text-sv-orange transition-colors hover:bg-sv-orange/10"
          >
            <RotateCcw className="h-3.5 w-3.5" /> {t('search.clear')}
          </button>
        )}
      </div>

      {/* More filters: beds/baths, floor, condition, building status, features, toggles */}
      <div className="mt-2.5">
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          aria-expanded={moreOpen}
          className="flex items-center gap-1.5 rounded-control px-3 py-2.5 text-[13px] font-extrabold text-sv-blue transition-colors hover:bg-sv-blue/10"
        >
          {t('search.moreFilters')}
          {moreCount > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-sv-blue px-1 text-[11px] font-black text-white">
              {moreCount}
            </span>
          )}
          <ChevronDown className={`h-4 w-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
        </button>

        {moreOpen && (
          <div className="mt-2 space-y-3.5 rounded-module border border-sv-ink/[0.06] bg-sv-surface p-3.5 shadow-card">
            <div className="flex flex-wrap gap-x-6 gap-y-3.5">
              <div>
                <span className={labelClass}>{t('search.bedrooms')}</span>
                <div className="flex gap-1">
                  {COUNT_OPTIONS.map((n) => (
                    <button key={n} type="button" onClick={() => patchParams({ beds: beds === n ? undefined : String(n) })} aria-pressed={beds === n} className={numChip(beds === n)}>
                      {n}+
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className={labelClass}>{t('search.bathrooms')}</span>
                <div className="flex gap-1">
                  {COUNT_OPTIONS.map((n) => (
                    <button key={n} type="button" onClick={() => patchParams({ baths: baths === n ? undefined : String(n) })} aria-pressed={baths === n} className={numChip(baths === n)}>
                      {n}+
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className={labelClass}>{t('search.floor')}</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number" min={0} placeholder={t('search.min')}
                    value={drafts.fmin}
                    onChange={(e) => setDrafts((d) => ({ ...d, fmin: e.target.value }))}
                    className={`${inputClass} w-[88px]`}
                    aria-label={`${t('search.floor')} · ${t('search.min')}`}
                  />
                  <span className="text-sv-ink/65">—</span>
                  <input
                    type="number" min={0} placeholder={t('search.max')}
                    value={drafts.fmax}
                    onChange={(e) => setDrafts((d) => ({ ...d, fmax: e.target.value }))}
                    className={`${inputClass} w-[88px]`}
                    aria-label={`${t('search.floor')} · ${t('search.max')}`}
                  />
                </div>
              </div>
              <div>
                <span className={labelClass}>{t('search.seller')}</span>
                <div className="flex gap-1">
                  {(['owner', 'agency'] as const).map((v) => (
                    <button key={v} type="button" onClick={() => patchParams({ seller: seller === v ? undefined : v })} aria-pressed={seller === v} className={numChip(seller === v)}>
                      {t(v === 'owner' ? 'search.sellerOwner' : 'search.sellerAgency')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <span className={labelClass}>{t('search.condition')}</span>
              <div className="flex flex-wrap gap-1">
                {CONDITION_KEYS.map((c) => (
                  <button key={c} type="button" onClick={() => toggleCsv('cond', cond, c)} aria-pressed={cond.includes(c)} className={tagChip(cond.includes(c))}>
                    {t(c)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className={labelClass}>{t('search.buildingStatus')}</span>
              <div className="flex flex-wrap gap-1">
                {BUILDING_STATUS_KEYS.map((bs) => (
                  <button key={bs} type="button" onClick={() => toggleCsv('bstat', bstat, bs)} aria-pressed={bstat.includes(bs)} className={tagChip(bstat.includes(bs))}>
                    {t(bs)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className={labelClass}>{t('search.features')}</span>
              <div className="scrollbar-hide flex max-h-32 flex-wrap gap-1 overflow-y-auto">
                {FEATURE_KEYS.map((f) => (
                  <button key={f} type="button" onClick={() => toggleCsv('feat', feat, f)} aria-pressed={feat.includes(f)} className={tagChip(feat.includes(f))}>
                    {t(f)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              <button type="button" onClick={() => patchParams({ photo: photo ? undefined : '1' })} aria-pressed={photo} className={tagChip(photo)}>
                {t('search.photoOnly')}
              </button>
              <button type="button" onClick={() => patchParams({ verified: verifiedOnly ? undefined : '1' })} aria-pressed={verifiedOnly} className={tagChip(verifiedOnly)}>
                {t('search.verifiedOnly')}
              </button>
              <button type="button" onClick={() => patchParams({ pets: pets ? undefined : '1' })} aria-pressed={pets} className={tagChip(pets)}>
                {t('search.petsOnly')}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )

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

      {/* Filter bar: full controls on desktop (sticky), compact sheet trigger on mobile */}
      <div className="z-40 border-b border-sv-ink/[0.06] glass-light md:sticky md:top-[88px]">
        <div className="mx-auto max-w-[1440px] px-4 py-3 md:px-10">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-control bg-sv-blue text-[14px] font-extrabold text-white shadow-glow-blue-sm md:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t('search.filters')}{chips.length > 0 ? ` (${chips.length})` : ''}
          </button>
          <div className="hidden md:block">{filtersBody(false)}</div>
        </div>
      </div>

      {/* Results */}
      <main id="main" aria-busy={showSkeleton} className="mx-auto max-w-[1440px] px-5 py-8 md:px-10">
        {/* Recently viewed rail — return-visit retention */}
        {recentItems.length > 0 && !showSkeleton && (
          <section aria-label={s('recentlyViewed')} className="mb-8">
            <h2 className="mb-3 text-[15px] font-extrabold text-sv-ink">{s('recentlyViewed')}</h2>
            <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 md:-mx-10 md:px-10">
              {recentItems.map((l) => (
                <CompactCard key={l.id} l={l} />
              ))}
            </div>
          </section>
        )}

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <p className="text-[15px] font-extrabold text-sv-ink" aria-live="polite">
            {showSkeleton ? t('search.loading') : t('search.results', { n: totalResults })}
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
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-extrabold transition-colors ${
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

        {showSkeleton ? (
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

        {/* Pagination — page lives in the URL (?page=N), shareable/SSR-friendly */}
        {!showSkeleton && totalPages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-3" aria-label={t('search.pagination')}>
            <button
              type="button"
              onClick={() => goPage(page - 1)}
              disabled={page <= 1 || searchLoading}
              className="flex h-11 items-center rounded-full border border-sv-ink/10 bg-sv-surface px-5 text-[13px] font-extrabold text-sv-ink shadow-card transition-all hover:border-sv-blue/40 hover:text-sv-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-blue disabled:opacity-40"
            >
              ← {t('search.prev')}
            </button>
            <span className="text-[13px] font-extrabold text-sv-ink/55" aria-live="polite">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => goPage(page + 1)}
              disabled={page >= totalPages || searchLoading}
              className="flex h-11 items-center rounded-full border border-sv-ink/10 bg-sv-surface px-5 text-[13px] font-extrabold text-sv-ink shadow-card transition-all hover:border-sv-blue/40 hover:text-sv-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-blue disabled:opacity-40"
            >
              {t('search.next')} →
            </button>
          </nav>
        )}

        {/* SEO hint */}
        {!showSkeleton && results.length > 0 && (
          <p className="mt-10 flex items-start gap-2 text-[13px] font-semibold leading-relaxed text-sv-ink/65">
            <Home className="mt-0.5 h-4 w-4 shrink-0" />
            {t('search.seoHint')}
          </p>
        )}
      </main>

      {/* Mobile filter sheet — fixed bottom overlay, Escape/backdrop close */}
      {sheetOpen && (
        <div className="fixed inset-0 z-[70] md:hidden" role="dialog" aria-modal="true" aria-label={t('search.filters')}>
          <div className="absolute inset-0 bg-sv-navy/60" onClick={() => setSheetOpen(false)} aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-card bg-sv-cloud shadow-card">
            <div className="flex items-center justify-between border-b border-sv-ink/[0.06] bg-sv-surface px-4 py-3">
              <h2 className="text-[16px] font-black text-sv-ink">
                {t('search.filters')}{chips.length > 0 ? ` (${chips.length})` : ''}
              </h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label={t('detail.close')}
                className="grid h-9 w-9 place-items-center rounded-full text-sv-ink/55 transition-colors hover:bg-sv-ink/[0.05] hover:text-sv-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">{filtersBody(true)}</div>
            <div className="flex gap-2 border-t border-sv-ink/[0.06] bg-sv-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={resetAll}
                className="flex h-11 items-center justify-center gap-1.5 rounded-control border border-sv-ink/10 px-4 text-[13px] font-extrabold text-sv-orange transition-colors hover:bg-sv-orange/10"
              >
                <RotateCcw className="h-3.5 w-3.5" /> {t('search.clear')}
              </button>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="h-11 flex-1 rounded-control bg-sv-blue text-[14px] font-extrabold text-white shadow-glow-blue-sm transition-colors hover:bg-sv-blue-deep"
              >
                {t('search.showResults', { n: totalResults })}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
