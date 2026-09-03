'use client'

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, LayoutGrid, Rows3, Search,
  ChevronDown, MapPin, RotateCcw, SearchX, Home, SlidersHorizontal, Layers,
} from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import LocalizedLink from '@/components/LocalizedLink'
import ListingCard from '@/components/ListingCard'
import { AdCreative } from '@/components/ads/AdCreative'
import type { PublicAd } from '@/lib/ads'
import HScroll from '@/components/HScroll'
import SaveSearchControl from '@/components/search/SaveSearchControl'
import SearchSuggest, { resolveExactPlace } from '@/components/search/SearchSuggest'
import LocationPicker, { locationLabel, type LocationValue } from '@/components/search/LocationPicker'
import PropertyTypePicker, { SEARCH_PROP_TYPES, isSearchPropType } from '@/components/search/PropertyTypePicker'
import { useSearchStrings } from '@/components/search/i18n'
import { useRecentIds } from '@/lib/recent'
import { blurProps } from '@/lib/media'
import { useCurrency } from '@/lib/currency'
import { useI18n, type DictKey } from '@/lib/i18n/context'
import { localizedHref } from '@/lib/i18n/core'
import { listingPath } from '@/lib/listing-slug'
import { CATEGORY_BRAND, DEAL_BRAND } from '@/lib/category-brand'
import { PartyHouseIcon } from '@/components/PartyHouseIcon'
import { CONDITION_KEYS, BUILDING_STATUS_KEYS, FEATURE_KEYS, PROJECT_KEYS, FLOOR_TYPE_KEYS, featureLabel } from '@/lib/features'
import { dealLabelKey as dealKeyFor, featuresFor, rentPeriodKey } from '@/lib/add-listing-fields'
import { mapSearchHit } from '@/lib/map-search-hit'
import { suggestionToFilters, splitDistricts } from '@/lib/search-location'
import { nlHasStructure, nlToSearchPatch, parseNlQuery } from '@/lib/nl-search'
import { isExactLookupQuery } from '@/lib/listing-public-id'
import { isSearchTier, SEARCH_TIERS } from '@/lib/listings-home-rail'
import { tierKeyToBadge } from '@/lib/promo-pricing'
import {
  type DealType, type PropType, type SortKey, type Listing,
} from '@/data/listings'

const ease = [0.21, 0.65, 0.2, 1] as const

/* Map view is heavy (maplibre) — load only when ?view=map is actually used. */
const SearchMapView = dynamic(() => import('@/components/search/SearchMapView'), {
  ssr: false,
  loading: () => (
    <div className="grid h-[min(78dvh,860px)] min-h-[min(56dvh,420px)] place-items-center rounded-card border border-sv-ink/[0.06] bg-sv-surface shadow-card" role="status" aria-label="იტვირთება">
      <span className="sv-spinner" aria-hidden />
    </div>
  ),
})

const SORTS: { value: SortKey; key: DictKey }[] = [
  { value: 'date', key: 'sort.date' },
  { value: 'price-asc', key: 'sort.priceAsc' },
  { value: 'price-desc', key: 'sort.priceDesc' },
  { value: 'area', key: 'sort.area' },
  { value: 'm2asc', key: 'sort.m2asc' },
  { value: 'm2desc', key: 'sort.m2desc' },
  { value: 'ai', key: 'sort.ai' },
]

const DEALS: (DealType | undefined)[] = [undefined, 'sale', 'rent', 'pledge', 'daily']
const dealChipKey = (d: DealType | undefined, prop?: PropType): DictKey =>
  d === undefined ? 'search.all' : dealKeyFor(d, prop ?? null)
const dealHue = (d: DealType | undefined): string =>
  d === 'rent' ? DEAL_BRAND.rent : d === 'daily' ? DEAL_BRAND.daily : d === 'pledge' ? DEAL_BRAND.pledge : DEAL_BRAND.sale

/** Exact 1–4 (ss.ge / myhome); 5+ is gte. */
const ROOM_CHIPS = [
  { label: '1', n: 1, exact: true },
  { label: '2', n: 2, exact: true },
  { label: '3', n: 3, exact: true },
  { label: '4', n: 4, exact: true },
  { label: '5+', n: 5, exact: false },
] as const
const TYPE_PATH: Record<PropType, string> = {
  apartment: 'apartments',
  house: 'houses',
  villa: 'houses',
  commercial: 'commercial',
  land: 'land',
  hotel: 'commercial',
}
const COUNT_OPTIONS = [1, 2, 3, 4] as const

export type SearchLock = {
  deal?: DealType
  type?: PropType
  city?: string
  citySlug?: string
  district?: string
  districtSlug?: string
  rooms?: number
}

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
  const suffixKey = rentPeriodKey(l.dealType, l.propType)
  const suffix = suffixKey ? t(suffixKey) : ''
  return (
    <Link
      href={listingPath(l)}
      className="group flex w-[264px] shrink-0 items-center gap-3 rounded-module border border-sv-ink/[0.06] bg-sv-surface p-2.5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-blue"
    >
      <span className="relative h-16 w-20 shrink-0 overflow-hidden rounded-control">
        {/* decorative — the title next to it carries the meaning */}
        <Image src={l.img} alt="" fill sizes="80px" className="object-cover transition-transform duration-500 group-hover:scale-105" {...blurProps(l.img)} />
      </span>
      <span className="min-w-0">
        <span className="block text-[14px] font-extrabold text-sv-ink transition-colors group-hover:text-sv-blue">
          {format(l.priceGEL)}{suffix}
        </span>
        <span className="block truncate text-[12px] font-semibold text-sv-ink/70">{l.title}</span>
        <span className="block text-[12px] font-semibold text-sv-ink/40">{l.area} მ² · {l.city}</span>
      </span>
    </Link>
  )
}

export default function SearchClient({
  ads,
  embed,
  lock,
  initialHits,
}: {
  ads?: { top: PublicAd | null; native: PublicAd | null }
  /** SEO landings: no chrome, lock from the slug, stay on this path. */
  embed?: boolean
  lock?: SearchLock
  initialHits?: Listing[]
}) {
  const params = useSearchParams()
  const router = useRouter()
  const { t, lang } = useI18n()
  const s = useSearchStrings()
  // Remember grid/list preference across visits (SSR-safe external store).
  const savedView = useSyncExternalStore(
    () => () => {},
    () => (window.localStorage.getItem('sivrce:view') === 'list' ? 'list' : 'grid'),
    () => 'grid' as const,
  )
  const [chosen, setView] = useState<'grid' | 'list' | null>(null)
  const [locOpen, setLocOpen] = useState(false)
  const view = chosen ?? savedView

  useEffect(() => {
    window.localStorage.setItem('sivrce:view', view)
  }, [view])

  // ——— Read filters from URL — invalid values are ignored (whitelists + numeric checks) ———
  const paramsKey = params.toString()
  const dealParam = params.get('deal')
  const leaseAlias = dealParam === 'lease'
  const deal: DealType | undefined = leaseAlias
    ? 'rent'
    : DEALS.includes(dealParam as DealType)
      ? (dealParam as DealType)
      : lock?.deal
  const typeParam = params.get('type')
  const type: PropType | undefined = leaseAlias
    ? 'land'
    : isSearchPropType(typeParam)
      ? (typeParam as PropType)
      : lock?.type
  const city = params.get('city') ?? lock?.city ?? undefined
  const district = params.get('district') ?? lock?.district ?? undefined
  const numParam = (key: string, min = 0): number | undefined => {
    const raw = params.get(key)
    if (raw === null || raw === '') return undefined
    const n = Number(raw)
    return Number.isFinite(n) && n >= min ? n : undefined
  }
  const minPrice = numParam('min')
  const maxPrice = numParam('max')
  const rooms = numParam('rooms', 1) ?? lock?.rooms
  const roomsMax = numParam('rmax', 1) ?? (lock?.rooms && lock.rooms < 4 ? lock.rooms : undefined)
  const minArea = numParam('amin')
  const maxArea = numParam('amax')
  const sortParam = params.get('sort')
  const sort: SortKey = SORTS.some((s) => s.value === sortParam) ? (sortParam as SortKey) : 'date'
  const q = params.get('q') ?? ''
  // More-filters params — CSVs whitelisted against the stored vocabulary.
  const beds = numParam('beds', 1)
  const bedsMax = numParam('bmax', 1)
  const baths = numParam('baths', 1)
  const floorMin = numParam('fmin')
  const floorMax = numParam('fmax')
  const condRaw = params.get('cond') ?? ''
  const bstatRaw = params.get('bstat') ?? ''
  const projectRaw = params.get('project') ?? ''
  const ftypeRaw = params.get('ftype') ?? ''
  const featRaw = params.get('feat') ?? ''
  // Memoized so the search effect only re-fires on real param changes.
  const cond = useMemo(() => splitCsv(condRaw, CONDITION_KEYS), [condRaw])
  const bstat = useMemo(() => splitCsv(bstatRaw, BUILDING_STATUS_KEYS), [bstatRaw])
  const project = useMemo(() => splitCsv(projectRaw, PROJECT_KEYS), [projectRaw])
  const ftype = useMemo(() => splitCsv(ftypeRaw, FLOOR_TYPE_KEYS), [ftypeRaw])
  const feat = useMemo(() => splitCsv(featRaw, FEATURE_KEYS), [featRaw])
  const partyLanding = deal === 'daily' && feat.length === 1 && feat[0] === 'add.f.partiesAllowed'
  const photo = params.get('photo') === '1'
  const verifiedOnly = params.get('verified') === '1'
  const tierRaw = params.get('tier')
  const tier = isSearchTier(tierRaw) ? tierRaw : undefined
  const pets = params.get('pets') === '1'
  const nearMetro = params.get('metro') === '1'
  const sellerParam = params.get('seller')
  const seller: 'owner' | 'agency' | undefined =
    sellerParam === 'owner' || sellerParam === 'agency' ? sellerParam : undefined
  const cur: 'USD' | 'GEL' = params.get('cur') === 'GEL' ? 'GEL' : 'USD'
  // Page lives in the URL — shareable and SSR-friendly. Filter changes reset it (see patchParams).
  const page = numParam('page', 1) ?? 1
  // Results mode lives in the URL too (?view=map) — shareable; default list.
  const mapMode = params.get('view') === 'map'
  const west = numParam('west')
  const south = numParam('south')
  const east = numParam('east')
  const north = numParam('north')
  const areaActive = Boolean(
    west !== undefined &&
      south !== undefined &&
      east !== undefined &&
      north !== undefined &&
      west < east &&
      south < north,
  )
  // Daily-rent availability window (only meaningful for the daily deal).
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
  const fromRaw = params.get('from') ?? ''
  const toRaw = params.get('to') ?? ''
  const from = deal === 'daily' && DATE_RE.test(fromRaw) ? fromRaw : undefined
  const to = deal === 'daily' && DATE_RE.test(toRaw) && (!from || toRaw > from) ? toRaw : undefined
  const todayIso = new Date().toISOString().slice(0, 10)

  const locValue: LocationValue = {
    city: city ?? '',
    district: district ?? '',
    street: '',
    metro: nearMetro,
  }
  const distList = splitDistricts(district)

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
    // Embed stays on the SEO path (/sale/apartments/tbilisi); /search keeps its prefix.
    const base = embed ? window.location.pathname : localizedHref('/search', lang)
    router.replace(qs ? `${base}?${qs}` : base, { scroll: false })
  }

  const embedDealHref = (d: DealType) => {
    if (d === 'rent' && type === 'land') {
      const segs = ['lease', lock?.citySlug, lock?.districtSlug].filter(Boolean)
      return localizedHref(`/${segs.join('/')}`, lang)
    }
    const dealSlug = d
    const typeSlug = type ? TYPE_PATH[type] : undefined
    const segs = [dealSlug, typeSlug, lock?.citySlug, lock?.districtSlug].filter(Boolean)
    return localizedHref(`/${segs.join('/')}`, lang)
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
  const [draftsKey, setDraftsKey] = useState(paramsKey)
  // Sync drafts when URL changes (back/forward, chip clear) — not an effect.
  if (draftsKey !== paramsKey) {
    setDraftsKey(paramsKey)
    setDrafts(urlText)
  }
  const clearDraft = (k: keyof typeof urlText) => setDrafts((d) => ({ ...d, [k]: '' }))

  const tryResolveQ = async (raw: string): Promise<boolean> => {
    if (!isExactLookupQuery(raw)) return false
    try {
      const res = await fetch(`/api/listings/resolve?q=${encodeURIComponent(raw)}`)
      const json = (await res.json()) as { ok?: boolean; path?: string; many?: boolean }
      if (json.ok && json.path && !json.many) {
        router.push(localizedHref(json.path, lang))
        return true
      }
    } catch { /* fall through */ }
    return false
  }

  const flushDrafts = () => {
    const patch: Record<string, string | undefined> = {}
    for (const k of ['q', 'min', 'max', 'amin', 'amax', 'fmin', 'fmax'] as const) {
      if (drafts[k] !== urlText[k]) patch[k] = drafts[k] || undefined
    }
    if (Object.keys(patch).length > 0) patchParams(patch)
  }

  const submitKeyword = () => {
    void (async () => {
      const raw = drafts.q.trim()
      if (raw && isExactLookupQuery(raw)) {
        if (await tryResolveQ(raw)) return
        flushDrafts()
        return
      }
      const place = raw ? await resolveExactPlace(raw, city) : undefined
      if (place) {
        patchParams(suggestionToFilters(place))
        return
      }
      const parsed = raw ? parseNlQuery(raw) : null
      if (parsed && nlHasStructure(parsed)) {
        setDrafts((d) => ({ ...d, q: '' }))
        patchParams(nlToSearchPatch(parsed))
        return
      }
      flushDrafts()
    })()
  }

  useEffect(() => {
    const timer = window.setTimeout(flushDrafts, 300)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- urlText/patchParams derive from drafts+paramsKey
  }, [drafts, paramsKey])

  // ——— API-driven search (page from the URL; prev/next navigation) —————————
  const [results, setResults] = useState<Listing[]>(initialHits ?? [])
  const [totalResults, setTotalResults] = useState(initialHits?.length ?? 0)
  const [totalPages, setTotalPages] = useState(0)
  const [searchLoading, setSearchLoading] = useState(!initialHits?.length)
  // Facet counts from Meilisearch (null on the DB fallback → counts hidden).
  const [facets, setFacets] = useState<Record<string, Record<string, number>> | null>(null)
  const fcount = (dim: string, key: string): number | undefined => facets?.[dim]?.[key]

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
        if (roomsMax !== undefined) sp.set('rmax', String(roomsMax))
        if (minArea !== undefined) sp.set('minArea', String(minArea))
        if (maxArea !== undefined) sp.set('maxArea', String(maxArea))
        if (q) sp.set('q', q)
        if (sort !== 'date') sp.set('sort', sort)
        if (beds !== undefined) sp.set('beds', String(beds))
        if (bedsMax !== undefined) sp.set('bmax', String(bedsMax))
        if (baths !== undefined) sp.set('baths', String(baths))
        if (floorMin !== undefined) sp.set('fmin', String(floorMin))
        if (floorMax !== undefined) sp.set('fmax', String(floorMax))
        if (condRaw) sp.set('cond', condRaw)
        if (bstatRaw) sp.set('bstat', bstatRaw)
        if (projectRaw) sp.set('project', projectRaw)
        if (ftypeRaw) sp.set('ftype', ftypeRaw)
        if (featRaw) sp.set('feat', featRaw)
        if (photo) sp.set('photo', '1')
        if (verifiedOnly) sp.set('verified', '1')
        if (tier) sp.set('tier', tier)
        if (pets) sp.set('pets', '1')
        if (nearMetro) sp.set('metro', '1')
        if (seller) sp.set('seller', seller)
        if (from) sp.set('from', from)
        if (to) sp.set('to', to)
        if (cur === 'GEL') sp.set('cur', 'GEL')
        if (areaActive && west !== undefined && south !== undefined && east !== undefined && north !== undefined) {
          sp.set('west', String(west))
          sp.set('south', String(south))
          sp.set('east', String(east))
          sp.set('north', String(north))
        }
        // Map mode pulls the first 100 matches for pins; list keeps paged cards.
        sp.set('page', mapMode ? '1' : String(page))
        sp.set('pageSize', mapMode ? '100' : '24')

        const res = await fetch(`/api/search?${sp.toString()}`)
        const json = await res.json()
        if (cancelled) return
        if (json.ok && Array.isArray(json.hits)) {
          setResults((json.hits as Record<string, unknown>[]).map(mapSearchHit))
          setTotalResults(json.totalHits as number)
          setTotalPages((json.totalPages as number) ?? 0)
          setFacets((json.facets as Record<string, Record<string, number>> | undefined) ?? null)
        } else {
          setFacets(null)
        }
      } catch {
        if (cancelled) return
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
  const moreCount = (baths !== undefined ? 1 : 0)
    + (floorMin !== undefined || floorMax !== undefined ? 1 : 0)
    + cond.length + bstat.length + project.length + ftype.length + feat.length + (photo ? 1 : 0) + (verifiedOnly ? 1 : 0)
    + (pets ? 1 : 0) + (nearMetro ? 1 : 0) + (seller ? 1 : 0) + (tier ? 1 : 0)
  const [moreOpen, setMoreOpen] = useState(false)
  const [menu, setMenu] = useState<'price' | 'rooms' | 'area' | 'dates' | null>(null)
  const filterRowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menu) return
    const onDown = (e: MouseEvent) => {
      if (filterRowRef.current && e.target instanceof Node && !filterRowRef.current.contains(e.target)) setMenu(null)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(null) }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [menu])

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
          setRecents({ key: recentKey, items: (j.hits as Record<string, unknown>[]).map(mapSearchHit) })
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
  const propType = SEARCH_PROP_TYPES.find((p) => p.value === type)
  const propTypeKey = propType?.key
  const chips: { key: string; label: string; hue?: string; clear: () => void }[] = []
  if (deal && params.get('deal')) chips.push({ key: 'deal', label: t(dealChipKey(deal, type)), hue: dealHue(deal), clear: () => patchParams({ deal: undefined }) })
  if (type && params.get('type')) chips.push({ key: 'type', label: propTypeKey ? t(propTypeKey) : type, hue: propType?.brand.hue, clear: () => patchParams({ type: undefined }) })
  if (city && params.get('city')) chips.push({ key: 'city', label: city, clear: () => patchParams({ city: undefined, district: undefined }) })
  if (params.get('district')) {
    if (distList.length === 1) chips.push({ key: 'district', label: distList[0]!, clear: () => patchParams({ district: undefined }) })
    else if (distList.length > 1) chips.push({ key: 'district', label: t('loc.nDistricts', { n: distList.length }), clear: () => patchParams({ district: undefined }) })
  }
  if (minPrice !== undefined) chips.push({ key: 'min', label: `${t('search.min')}. ${cur === 'GEL' ? '₾' : '$'}${minPrice.toLocaleString('en-US')}`, clear: () => { clearDraft('min'); patchParams({ min: undefined }) } })
  if (maxPrice !== undefined) chips.push({ key: 'max', label: `${t('search.max')}. ${cur === 'GEL' ? '₾' : '$'}${maxPrice.toLocaleString('en-US')}`, clear: () => { clearDraft('max'); patchParams({ max: undefined }) } })
  if (beds !== undefined) chips.push({ key: 'beds', label: bedsMax === beds ? `${beds} ${t('spec.beds')}` : t('search.bedsChip', { n: beds }), clear: () => patchParams({ beds: undefined, bmax: undefined }) })
  if (rooms !== undefined && params.get('rooms')) chips.push({ key: 'rooms', label: roomsMax === rooms ? `${rooms} ${t('spec.rooms')}` : t('search.roomsChip', { n: rooms }), clear: () => patchParams({ rooms: undefined, rmax: undefined }) })
  if (minArea !== undefined) chips.push({ key: 'amin', label: `${t('search.min')}. ${minArea} ${t('add.areaUnit.m2')}`, clear: () => { clearDraft('amin'); patchParams({ amin: undefined }) } })
  if (maxArea !== undefined) chips.push({ key: 'amax', label: `${t('search.max')}. ${maxArea} ${t('add.areaUnit.m2')}`, clear: () => { clearDraft('amax'); patchParams({ amax: undefined }) } })
  if (q) chips.push({ key: 'q', label: `„${q}"`, clear: () => { clearDraft('q'); patchParams({ q: undefined }) } })
  if (baths !== undefined) chips.push({ key: 'baths', label: t('search.bathsChip', { n: baths }), clear: () => patchParams({ baths: undefined }) })
  if (floorMin !== undefined || floorMax !== undefined) chips.push({ key: 'floor', label: `${t('search.floor')}: ${floorMin ?? '—'}–${floorMax ?? '—'}`, clear: () => { clearDraft('fmin'); clearDraft('fmax'); patchParams({ fmin: undefined, fmax: undefined }) } })
  if (cond.length) chips.push({ key: 'cond', label: cond.map((c) => t(c)).join(' · '), clear: () => patchParams({ cond: undefined }) })
  if (bstat.length) chips.push({ key: 'bstat', label: `${t('search.buildingStatus')} · ${bstat.length}`, clear: () => patchParams({ bstat: undefined }) })
  if (project.length) chips.push({ key: 'project', label: `${t('search.project')} · ${project.length}`, clear: () => patchParams({ project: undefined }) })
  if (ftype.length) chips.push({ key: 'ftype', label: `${t('search.floorType')} · ${ftype.length}`, clear: () => patchParams({ ftype: undefined }) })
  if (feat.length === 1) {
    const f = feat[0]!
    chips.push({
      key: 'feat',
      label: featureLabel(f, t),
      hue: f === 'add.f.partiesAllowed' ? CATEGORY_BRAND.partyHouses.hue : undefined,
      clear: () => patchParams({ feat: undefined }),
    })
  } else if (feat.length) chips.push({ key: 'feat', label: `${t('search.features')} · ${feat.length}`, clear: () => patchParams({ feat: undefined }) })
  if (photo) chips.push({ key: 'photo', label: t('search.photoOnly'), clear: () => patchParams({ photo: undefined }) })
  if (verifiedOnly) chips.push({ key: 'verified', label: t('search.verifiedOnly'), clear: () => patchParams({ verified: undefined }) })
  if (tier) chips.push({ key: 'tier', label: tierKeyToBadge(tier) ?? tier, clear: () => patchParams({ tier: undefined }) })
  if (pets) chips.push({ key: 'pets', label: t('search.petsOnly'), clear: () => patchParams({ pets: undefined }) })
  if (nearMetro) chips.push({ key: 'metro', label: t('search.nearMetro'), clear: () => patchParams({ metro: undefined }) })
  if (seller) chips.push({ key: 'seller', label: t(seller === 'owner' ? 'search.sellerOwner' : 'search.sellerAgency'), clear: () => patchParams({ seller: undefined }) })
  if (from && to) chips.push({ key: 'dates', label: `${from} → ${to}`, clear: () => patchParams({ from: undefined, to: undefined }) })
  if (cur === 'GEL' && (minPrice !== undefined || maxPrice !== undefined)) chips.push({ key: 'cur', label: '₾', clear: () => patchParams({ cur: undefined }) })
  if (areaActive) {
    chips.push({
      key: 'area',
      label: t('search.mapSearchArea'),
      clear: () =>
        patchParams({ west: undefined, south: undefined, east: undefined, north: undefined }),
    })
  }

  const resetAll = () => {
    setDrafts({ q: '', min: '', max: '', amin: '', amax: '', fmin: '', fmax: '' })
    router.replace(embed ? window.location.pathname : localizedHref('/search', lang), { scroll: false })
  }

  const selectClass =
    'h-10 w-full appearance-none rounded-full border-0 bg-sv-ink/[0.045] pl-3.5 pr-8 text-[13px] font-bold text-sv-ink outline-none transition-colors focus:bg-sv-ink/[0.07] focus-visible:ring-2 focus-visible:ring-sv-blue/30 cursor-pointer'
  const inputClass =
    'h-10 w-full rounded-full border-0 bg-sv-ink/[0.045] px-3.5 text-[13px] font-bold text-sv-ink outline-none transition-colors placeholder:text-sv-ink/35 focus:bg-sv-ink/[0.07] focus-visible:ring-2 focus-visible:ring-sv-blue/30'
  const labelClass = 'mb-1.5 block text-[12px] font-semibold tracking-[-0.01em] text-sv-ink/45'
  const numChip = (active: boolean) =>
    `h-10 min-w-10 rounded-full px-3 text-[13px] font-bold transition-colors ${
      active
        ? 'bg-sv-blue text-white'
        : 'bg-sv-ink/[0.045] text-sv-ink/65 hover:bg-sv-ink/[0.08] hover:text-sv-ink'
    }`
  const tagChip = (active: boolean) =>
    `h-9 rounded-full px-3.5 text-[12px] font-bold transition-colors ${
      active
        ? 'bg-sv-blue text-white'
        : 'bg-sv-ink/[0.045] text-sv-ink/65 hover:bg-sv-ink/[0.08] hover:text-sv-ink'
    }`
  const pillCls = (on: boolean) =>
    `flex h-10 shrink-0 items-center gap-1 rounded-full px-3.5 text-[13px] font-bold transition-colors ${
      on ? 'bg-sv-blue/12 text-sv-blue' : 'bg-sv-ink/[0.045] text-sv-ink/70 hover:bg-sv-ink/[0.08] hover:text-sv-ink'
    }`
  const toggleMenu = (id: 'price' | 'rooms' | 'area' | 'dates') => {
    setMoreOpen(false)
    setMenu((m) => (m === id ? null : id))
  }
  const money = (n: number) => {
    const s = cur === 'GEL' ? '₾' : '$'
    if (n >= 1_000_000) return `${s}${n % 1_000_000 === 0 ? n / 1_000_000 : (n / 1_000_000).toFixed(1)}m`
    if (n >= 1000) return `${s}${Math.round(n / 1000)}k`
    return `${s}${n}`
  }
  const priceSummary =
    minPrice !== undefined && maxPrice !== undefined ? `${money(minPrice)}–${money(maxPrice)}`
    : minPrice !== undefined ? `${money(minPrice)}+`
    : maxPrice !== undefined ? `≤${money(maxPrice)}`
    : null
  const roomN = deal === 'daily' ? beds : rooms
  const roomMaxN = deal === 'daily' ? bedsMax : roomsMax
  const roomsSummary = roomN === undefined ? null : roomMaxN === roomN ? String(roomN) : `${roomN}+`
  const areaUnit = t('add.areaUnit.m2')
  const areaSummary =
    minArea !== undefined && maxArea !== undefined ? `${minArea}–${maxArea} ${areaUnit}`
    : minArea !== undefined ? `${minArea}+ ${areaUnit}`
    : maxArea !== undefined ? `≤${maxArea} ${areaUnit}`
    : null
  const datesSummary = from && to ? `${from} → ${to}` : from || null

  const roomChipActive = (r: (typeof ROOM_CHIPS)[number]) =>
    deal === 'daily'
      ? r.exact ? beds === r.n && bedsMax === r.n : beds === r.n && bedsMax === undefined
      : r.exact ? rooms === r.n && roomsMax === r.n : rooms === r.n && roomsMax === undefined
  const applyRoomChip = (r: (typeof ROOM_CHIPS)[number], active: boolean) => {
    if (deal === 'daily') {
      patchParams(active ? { beds: undefined, bmax: undefined } : r.exact ? { beds: String(r.n), bmax: String(r.n) } : { beds: String(r.n), bmax: undefined })
      return
    }
    patchParams(active ? { rooms: undefined, rmax: undefined } : r.exact ? { rooms: String(r.n), rmax: String(r.n) } : { rooms: String(r.n), rmax: undefined })
  }
  const roomsBtns = (
    <div className="flex gap-1">
      {ROOM_CHIPS.map((r) => {
        const active = roomChipActive(r)
        return (
          <button key={r.label} type="button" onClick={() => applyRoomChip(r, active)} aria-pressed={active} className={numChip(active)}>
            {r.label}
          </button>
        )
      })}
    </div>
  )
  const priceFields = (
    <div className="flex items-center gap-1.5">
      <input type="number" min={0} placeholder={t('search.min')} value={drafts.min} onChange={(e) => setDrafts((d) => ({ ...d, min: e.target.value }))} className={`${inputClass} w-[96px]`} aria-label={t('search.minPrice')} />
      <span className="text-sv-ink/30">—</span>
      <input type="number" min={0} placeholder={t('search.max')} value={drafts.max} onChange={(e) => setDrafts((d) => ({ ...d, max: e.target.value }))} className={`${inputClass} w-[96px]`} aria-label={t('search.maxPrice')} />
      <div className="ml-0.5 flex rounded-full bg-sv-ink/[0.045] p-0.5" role="group" aria-label={t('search.currency')}>
        {(['USD', 'GEL'] as const).map((c) => (
          <button key={c} type="button" onClick={() => patchParams({ cur: c === 'USD' ? undefined : 'GEL' })} aria-pressed={cur === c} className={`h-9 w-9 rounded-full text-[13px] font-bold transition-colors ${cur === c ? 'bg-sv-surface text-sv-blue' : 'text-sv-ink/55 hover:text-sv-ink'}`}>
            {c === 'USD' ? '$' : '₾'}
          </button>
        ))}
      </div>
    </div>
  )
  const areaFields = (
    <div className="flex items-center gap-1.5">
      <input type="number" min={0} placeholder={t('search.min')} value={drafts.amin} onChange={(e) => setDrafts((d) => ({ ...d, amin: e.target.value }))} className={`${inputClass} w-[96px]`} aria-label={t('search.minArea')} />
      <span className="text-sv-ink/30">—</span>
      <input type="number" min={0} placeholder={t('search.max')} value={drafts.amax} onChange={(e) => setDrafts((d) => ({ ...d, amax: e.target.value }))} className={`${inputClass} w-[96px]`} aria-label={t('search.maxArea')} />
      <span className="text-[12px] font-semibold text-sv-ink/35">{areaUnit}</span>
    </div>
  )
  const dateFields = (
    <div className="flex items-center gap-1.5">
      <input type="date" value={from ?? ''} min={todayIso} onChange={(e) => patchParams({ from: e.target.value || undefined, ...(from && to && e.target.value >= to ? { to: undefined } : {}) })} className={`${inputClass} w-[148px]`} aria-label={t('search.checkIn')} />
      <span className="text-sv-ink/30">—</span>
      <input type="date" value={to ?? ''} min={from ?? todayIso} onChange={(e) => patchParams({ to: e.target.value || undefined })} className={`${inputClass} w-[148px]`} aria-label={t('search.checkOut')} />
    </div>
  )

  /* Whole filter UI — rendered once in the desktop sticky bar and again inside
     the mobile bottom sheet (mobile swaps the deal-pill layoutId + hides the
     view toggle, which only makes sense next to results). */
  const keywordBox = (size: 'md' | 'lg', className = 'min-w-0 w-full') => (
    <SearchSuggest
      variant="light"
      size={size}
      city={city}
      value={drafts.q}
      onChange={(v) => setDrafts((d) => ({ ...d, q: v }))}
      onPick={(s) => patchParams(suggestionToFilters(s))}
      onSubmit={submitKeyword}
      placeholder={t('search.keywordPlaceholder')}
      ariaLabel={t('search.keyword')}
      className={className}
    />
  )

  const filtersBody = (mobile: boolean) => (
    <>
      {mobile && <div className="mb-3">{keywordBox('lg')}</div>}
      {!mobile && (
        <div className="mb-3 flex items-center gap-2">
          {keywordBox('lg', 'min-w-0 flex-1')}
          <button
            type="button"
            onClick={submitKeyword}
            className="flex h-12 shrink-0 items-center gap-1.5 rounded-full bg-sv-blue px-5 text-[13px] font-extrabold text-white shadow-glow-blue-sm transition-colors hover:bg-sv-blue-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-blue"
          >
            <Search className="h-4 w-4" aria-hidden />
            {t('search.apply')}
          </button>
        </div>
      )}

      {/* Deal · type · place · price/rooms/area as compact menus — one chip language */}
      {mobile ? (
        <div className="space-y-4">
          <div className="flex shrink-0 rounded-full bg-sv-ink/[0.045] p-0.5" role="group" aria-label={t('search.dealType')}>
            {(embed ? DEALS.filter((d): d is DealType => d !== undefined) : DEALS)
              .filter((d) => type !== 'land' || d !== 'daily')
              .map((d) => {
              const label = t(dealChipKey(d, type))
              const count = d === undefined ? undefined : fcount('dealType', d)
              const active = deal === d
              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    if (active) return
                    if (embed && d && d !== lock?.deal) {
                      const next = new URLSearchParams(window.location.search)
                      next.delete('page')
                      next.delete('deal')
                      const path = embedDealHref(d)
                      const qs = next.toString()
                      router.push(qs ? `${path}?${qs}` : path, { scroll: false })
                      return
                    }
                    patchParams({
                      deal: d,
                      beds: undefined,
                      bmax: undefined,
                      rooms: undefined,
                      rmax: undefined,
                      ...(d === 'daily' ? {} : { from: undefined, to: undefined }),
                    })
                  }}
                  className={`relative min-w-0 flex-1 whitespace-nowrap rounded-full px-2 py-2 text-[12px] font-extrabold transition-colors ${
                    active ? 'text-white' : 'text-sv-ink/65 hover:text-sv-ink'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="deal-seg-m"
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: dealHue(d) }}
                      transition={{ type: 'spring', bounce: 0.18, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10 truncate">
                    {label}
                    {count !== undefined && (
                      <span className={`ml-1 text-[10px] font-bold ${active ? 'text-white/80' : 'text-sv-ink/40'}`}>{count}</span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="flex gap-2">
            <PropertyTypePicker
              value={type}
              onChange={(v) => patchParams({ type: v })}
              counts={facets?.propertyType}
              className="min-w-0 flex-1"
            />
            <button
              type="button"
              onClick={() => setLocOpen(true)}
              aria-label={t('loc.title')}
              className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full bg-sv-ink/[0.045] px-3.5 text-left text-[13px] font-bold text-sv-ink outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sv-blue/30"
            >
              <MapPin className={`h-3.5 w-3.5 shrink-0 ${city ? 'text-sv-blue' : 'text-sv-ink/35'}`} />
              <span className="min-w-0 flex-1 truncate">
                {distList.length > 2 ? `${city} · ${t('loc.nDistricts', { n: distList.length })}` : locationLabel(locValue, t('search.allGeorgia'))}
              </span>
            </button>
          </div>
          <div>
            <span className={labelClass}>{t('search.price')}</span>
            {priceFields}
          </div>
          <div>
            <span className={labelClass}>{deal === 'daily' ? t('search.bedrooms') : t('search.rooms')}</span>
            {roomsBtns}
          </div>
          <div>
            <span className={labelClass}>{t('search.area')}</span>
            {areaFields}
          </div>
          {deal === 'daily' && (
            <div>
              <span className={labelClass}>{t('search.checkIn')}</span>
              {dateFields}
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setMenu(null); setMoreOpen((o) => !o) }}
              aria-expanded={moreOpen}
              className={pillCls(moreOpen || moreCount > 0)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
              {t('search.moreFilters')}
              {moreCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-sv-blue px-1 text-[10px] font-black text-white">{moreCount}</span>
              )}
            </button>
            {(chips.length > 0 || sort !== 'date') && (
              <button type="button" onClick={resetAll} className="flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold text-sv-orange transition-colors hover:bg-sv-orange/10">
                <RotateCcw className="h-3.5 w-3.5" /> {t('search.clear')}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div ref={filterRowRef}>
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex shrink-0 rounded-full bg-sv-ink/[0.045] p-0.5" role="group" aria-label={t('search.dealType')}>
            {(embed ? DEALS.filter((d): d is DealType => d !== undefined) : DEALS)
              .filter((d) => type !== 'land' || d !== 'daily')
              .map((d) => {
              const label = t(dealChipKey(d, type))
              const count = d === undefined ? undefined : fcount('dealType', d)
              const active = deal === d
              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    if (active) return
                    if (embed && d && d !== lock?.deal) {
                      const next = new URLSearchParams(window.location.search)
                      next.delete('page')
                      next.delete('deal')
                      const path = embedDealHref(d)
                      const qs = next.toString()
                      router.push(qs ? `${path}?${qs}` : path, { scroll: false })
                      return
                    }
                    patchParams({
                      deal: d,
                      beds: undefined,
                      bmax: undefined,
                      rooms: undefined,
                      rmax: undefined,
                      ...(d === 'daily' ? {} : { from: undefined, to: undefined }),
                    })
                  }}
                  className={`relative whitespace-nowrap rounded-full px-2.5 py-2 text-[13px] font-bold transition-colors ${
                    active ? 'text-white' : 'text-sv-ink/65 hover:text-sv-ink'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="deal-seg"
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: dealHue(d) }}
                      transition={{ type: 'spring', bounce: 0.18, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10">
                    {label}
                    {count !== undefined && (
                      <span className={`ml-1 text-[10px] font-bold ${active ? 'text-white/80' : 'text-sv-ink/40'}`}>{count}</span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>

          <PropertyTypePicker
            value={type}
            onChange={(v) => { setMenu(null); patchParams({ type: v }) }}
            counts={facets?.propertyType}
            onOpen={() => setMenu(null)}
            className="min-w-[132px] max-w-[188px] shrink-0"
          />

          <button
            type="button"
            onClick={() => { setMenu(null); setLocOpen(true) }}
            aria-label={t('loc.title')}
            className="flex h-10 min-w-[128px] max-w-[220px] shrink-0 items-center gap-2 rounded-full bg-sv-ink/[0.045] px-3.5 text-left text-[13px] font-bold text-sv-ink outline-none transition-colors hover:bg-sv-ink/[0.08] focus-visible:ring-2 focus-visible:ring-sv-blue/30"
          >
            <MapPin className={`h-3.5 w-3.5 shrink-0 ${city ? 'text-sv-blue' : 'text-sv-ink/35'}`} />
            <span className="min-w-0 flex-1 truncate">
              {distList.length > 2 ? `${city} · ${t('loc.nDistricts', { n: distList.length })}` : locationLabel(locValue, t('search.allGeorgia'))}
            </span>
          </button>

          <button type="button" aria-expanded={menu === 'price'} aria-haspopup="dialog" onClick={() => toggleMenu('price')} className={pillCls(!!priceSummary || menu === 'price')}>
            {priceSummary ?? t('search.price')}
            <ChevronDown className={`h-3 w-3 opacity-40 transition-transform ${menu === 'price' ? 'rotate-180' : ''}`} />
          </button>

          <button type="button" aria-expanded={menu === 'rooms'} aria-haspopup="dialog" onClick={() => toggleMenu('rooms')} className={pillCls(!!roomsSummary || menu === 'rooms')}>
            {roomsSummary ?? (deal === 'daily' ? t('search.bedrooms') : t('search.rooms'))}
            <ChevronDown className={`h-3 w-3 opacity-40 transition-transform ${menu === 'rooms' ? 'rotate-180' : ''}`} />
          </button>

          <button type="button" aria-expanded={menu === 'area'} aria-haspopup="dialog" onClick={() => toggleMenu('area')} className={pillCls(!!areaSummary || menu === 'area')}>
            {areaSummary ?? t('search.area')}
            <ChevronDown className={`h-3 w-3 opacity-40 transition-transform ${menu === 'area' ? 'rotate-180' : ''}`} />
          </button>

          {deal === 'daily' && (
            <button type="button" aria-expanded={menu === 'dates'} aria-haspopup="dialog" onClick={() => toggleMenu('dates')} className={pillCls(!!datesSummary || menu === 'dates')}>
              {datesSummary ?? t('search.checkIn')}
              <ChevronDown className={`h-3 w-3 opacity-40 transition-transform ${menu === 'dates' ? 'rotate-180' : ''}`} />
            </button>
          )}

          <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => { setMenu(null); setMoreOpen((o) => !o) }}
            aria-expanded={moreOpen}
            aria-label={t('search.moreFilters')}
            className={pillCls(moreOpen || moreCount > 0)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
            {t('search.moreFilters')}
            {moreCount > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-sv-blue px-1 text-[10px] font-black text-white">{moreCount}</span>
            )}
          </button>

          {(chips.length > 0 || sort !== 'date') && (
            <button type="button" onClick={resetAll} aria-label={t('search.clear')} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sv-orange transition-colors hover:bg-sv-orange/10">
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          </div>
        </div>
        {menu && (
          <div
            className="mt-2.5 rounded-module bg-sv-ink/[0.035] p-3.5"
            role="dialog"
            aria-label={
              menu === 'price' ? t('search.price')
              : menu === 'rooms' ? (deal === 'daily' ? t('search.bedrooms') : t('search.rooms'))
              : menu === 'area' ? t('search.area')
              : t('search.checkIn')
            }
          >
            {menu === 'price' && priceFields}
            {menu === 'rooms' && roomsBtns}
            {menu === 'area' && areaFields}
            {menu === 'dates' && dateFields}
          </div>
        )}
        </div>
      )}

      {/* More filters panel — seller / condition / status / features */}
      <div>
        {moreOpen && (
          <div className="mt-2 space-y-4 rounded-module border border-sv-ink/[0.06] bg-sv-surface p-4 shadow-card">
            <div className="flex flex-wrap gap-x-6 gap-y-4">
              <div>
                <span className={labelClass}>{t('search.promo')}</span>
                <div className="flex flex-wrap gap-1" role="group" aria-label={t('search.promo')}>
                  {SEARCH_TIERS.map((tk) => (
                    <button key={tk} type="button" onClick={() => patchParams({ tier: tier === tk ? undefined : tk })} aria-pressed={tier === tk} className={tagChip(tier === tk)}>
                      {tierKeyToBadge(tk) ?? tk}
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

            {(!type || type === 'apartment') && (
              <div>
                <span className={labelClass}>{t('search.project')}</span>
                <div className="scrollbar-hide flex max-h-28 flex-wrap gap-1 overflow-y-auto">
                  {PROJECT_KEYS.map((p) => (
                    <button key={p} type="button" onClick={() => toggleCsv('project', project, p)} aria-pressed={project.includes(p)} className={tagChip(project.includes(p))}>
                      {t(p)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(!type || type === 'apartment') && (
              <div>
                <span className={labelClass}>{t('search.floorType')}</span>
                <div className="flex flex-wrap gap-1">
                  {FLOOR_TYPE_KEYS.map((ft) => (
                    <button key={ft} type="button" onClick={() => toggleCsv('ftype', ftype, ft)} aria-pressed={ftype.includes(ft)} className={tagChip(ftype.includes(ft))}>
                      {t(ft)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className={labelClass}>{t('search.features')}</span>
              <div className="scrollbar-hide flex max-h-32 flex-wrap gap-1 overflow-y-auto">
                {(type === 'land'
                  ? featuresFor('land', deal ?? 'sale', city)
                  : featuresFor(type ?? 'apartment', deal ?? 'sale', city)
                ).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleCsv('feat', feat, f)}
                    aria-pressed={feat.includes(f)}
                    className={`${tagChip(feat.includes(f))} inline-flex items-center gap-1.5`}
                  >
                    {f === 'add.f.partiesAllowed' && (
                      <PartyHouseIcon
                        className="h-3.5 w-3.5"
                        style={feat.includes(f) ? undefined : { color: CATEGORY_BRAND.partyHouses.hue }}
                      />
                    )}
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
              <button type="button" onClick={() => patchParams({ metro: nearMetro ? undefined : '1' })} aria-pressed={nearMetro} className={tagChip(nearMetro)}>
                {t('search.nearMetro')}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )

  const viewToggle = (
    <div className="flex shrink-0 items-center gap-1.5">
      <div className="flex rounded-full bg-sv-ink/[0.045] p-0.5" role="group" aria-label={t('search.view')}>
        {([undefined, 'map'] as const).map((v) => {
          const active = mapMode === (v === 'map')
          return (
            <button
              key={v ?? 'list'}
              type="button"
              aria-pressed={active}
              onClick={() =>
                patchParams(
                  v === 'map'
                    ? { view: 'map' }
                    : { view: undefined, west: undefined, south: undefined, east: undefined, north: undefined },
                )
              }
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors ${
                active ? 'bg-sv-surface text-sv-blue' : 'text-sv-ink/65 hover:text-sv-ink'
              }`}
            >
              {t(v === 'map' ? 'search.map' : 'search.list')}
            </button>
          )
        })}
      </div>
      <LocalizedLink
        href="/map"
        className="inline-flex h-11 items-center gap-1.5 rounded-full bg-sv-orange px-3 text-[12px] font-extrabold text-white shadow-glow-orange transition hover:brightness-110"
      >
        <Layers className="h-3.5 w-3.5" aria-hidden />
        {t('nav.map')}
      </LocalizedLink>
    </div>
  )

  const Shell = embed ? 'div' : 'main'

  return (
    <div className={embed ? 'font-geo' : 'font-geo min-h-screen bg-sv-cloud antialiased'}>
      {!embed && <Navbar />}
      <LocationPicker
        open={locOpen}
        value={locValue}
        multi
        showMetro
        onClose={() => setLocOpen(false)}
        onApply={(v) => {
          setLocOpen(false)
          patchParams({
            city: v.city || undefined,
            district: v.district || undefined,
            ...(v.street ? { q: v.street } : {}),
            metro: v.metro ? '1' : undefined,
          })
        }}
      />

      {/* Page header — compact so listings start above the fold */}
      <Shell id={embed ? undefined : 'main'} aria-busy={showSkeleton}>
      {!embed && (
      <div className="relative overflow-hidden bg-sv-navy pb-6 pt-[calc(100px+env(safe-area-inset-top,0px))]">
        <div aria-hidden className="absolute inset-0 bg-grid-dark" />
        <div
          aria-hidden
          className="absolute -top-24 left-1/4 h-56 w-56 rounded-full bg-sv-blue/20 blur-[100px]"
        />
        <div
          aria-hidden
          className="absolute -bottom-16 right-1/5 h-40 w-40 rounded-full bg-sv-violet/15 blur-[80px]"
        />
        <div className="relative mx-auto max-w-[1440px] px-5 md:px-10">
          <h1 className="flex items-center gap-3 text-balance text-[clamp(1.375rem,1.1rem+1.4vw,2rem)] font-black tracking-[-0.03em] text-white">
            {partyLanding && (
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-module"
                style={{ backgroundColor: `color-mix(in oklab, ${CATEGORY_BRAND.partyHouses.hue} 22%, transparent)`, color: CATEGORY_BRAND.partyHouses.hue }}
              >
                <PartyHouseIcon className="h-5 w-5" />
              </span>
            )}
            {partyLanding ? t('col.party') : t('search.title')}
          </h1>
          <p className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] font-semibold leading-snug text-white/55">
            {partyLanding ? t('col.party.sub') : null}
            {partyLanding ? ' · ' : <MapPin className="h-3.5 w-3.5 text-sv-blue-light" />}
            {city ?? t('search.allGeorgia')}
            {distList.length === 1 ? ` · ${distList[0]}` : distList.length > 1 ? ` · ${t('loc.nDistricts', { n: distList.length })}` : ''}
            {q ? ` · ${q}` : ''}
          </p>
        </div>
      </div>
      )}

      {/* Filter bar: full controls on desktop (sticky), compact sheet trigger on mobile */}
      <div className={embed
        ? 'z-30 mb-5 rounded-card border border-sv-ink/[0.06] bg-sv-surface/95 p-3 shadow-card backdrop-blur-md md:sticky md:top-[calc(88px+env(safe-area-inset-top,0px))]'
        : 'z-40 overflow-visible border-b border-sv-ink/[0.06] glass-light md:sticky md:top-[calc(88px+env(safe-area-inset-top,0px))]'}>
        <div className={embed ? '' : 'mx-auto max-w-[1440px] px-4 py-3 md:px-10'}>
          <div className="flex items-center gap-2 md:hidden">
            {keywordBox('md', 'min-w-0 flex-1')}
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sv-blue text-white shadow-glow-blue-sm"
              aria-label={`${t('search.filters')}${chips.length > 0 ? ` (${chips.length})` : ''}`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {chips.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-sv-orange px-1 text-[9px] font-black text-white">
                  {chips.length}
                </span>
              )}
            </button>
            {viewToggle}
          </div>
          <div className="hidden md:block">{filtersBody(false)}</div>
        </div>
      </div>

      {/* Results */}
      <div className={embed ? 'pt-1' : 'mx-auto max-w-[1440px] px-5 py-5 md:px-10'}>
        {/* Recently viewed rail — return-visit retention */}
        {!embed && recentItems.length > 0 && !showSkeleton && (
          <section aria-label={s('recentlyViewed')} className="mb-6">
            <h2 className="mb-2 text-[14px] font-extrabold text-sv-ink">{s('recentlyViewed')}</h2>
            <HScroll aria-label={s('recentlyViewed')} className="-mx-5 gap-3 px-5 pb-1 md:-mx-10 md:px-10">
              {recentItems.map((l) => (
                <CompactCard key={l.id} l={l} />
              ))}
            </HScroll>
          </section>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <p className="text-[14px] font-extrabold text-sv-ink" aria-live="polite">
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
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold transition-colors ${
                  c.hue ? '' : 'bg-sv-blue/10 text-sv-blue hover:bg-sv-blue/15'
                }`}
                style={c.hue ? { backgroundColor: `${c.hue}1A`, color: c.hue } : undefined}
              >
                {c.hue === CATEGORY_BRAND.partyHouses.hue ? (
                  <PartyHouseIcon className="h-3 w-3" aria-hidden />
                ) : c.hue ? (
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.hue }} aria-hidden />
                ) : null}
                {c.label}
                <X className="h-3 w-3" aria-hidden="true" />
              </motion.button>
            ))}
          </AnimatePresence>
          <SaveSearchControl />
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => patchParams({ sort: e.target.value === 'date' ? undefined : e.target.value })}
                className={`${selectClass} min-w-[140px]`}
                aria-label={t('search.sort')}
              >
                {SORTS.map((so) => (
                  <option key={so.value} value={so.value}>{t(so.key)}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sv-ink/40" />
            </div>
            <div className="flex rounded-full bg-sv-ink/[0.045] p-0.5" role="group" aria-label={t('search.view')}>
              <button
                onClick={() => setView('grid')}
                aria-label={t('search.grid')}
                aria-pressed={view === 'grid'}
                className={`grid h-10 w-10 place-items-center rounded-full transition-colors ${view === 'grid' ? 'bg-sv-surface text-sv-blue' : 'text-sv-ink/65 hover:text-sv-ink'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView('list')}
                aria-label={t('search.list')}
                aria-pressed={view === 'list'}
                className={`grid h-10 w-10 place-items-center rounded-full transition-colors ${view === 'list' ? 'bg-sv-surface text-sv-blue' : 'text-sv-ink/65 hover:text-sv-ink'}`}
              >
                <Rows3 className="h-4 w-4" />
              </button>
            </div>
            <div className="hidden md:block">{viewToggle}</div>
          </div>
        </div>

        {ads?.top ? (
          <div className="mb-6">
            <AdCreative ad={ads.top} lang={lang} />
          </div>
        ) : null}

        {mapMode ? (
          <div>
            <SearchMapView
              listings={results}
              areaActive={areaActive}
              onSearchArea={(b) =>
                patchParams({
                  west: String(b.west),
                  south: String(b.south),
                  east: String(b.east),
                  north: String(b.north),
                  view: 'map',
                })
              }
              onClearArea={() =>
                patchParams({
                  west: undefined,
                  south: undefined,
                  east: undefined,
                  north: undefined,
                })
              }
            />
            {totalResults > results.length && (
              <p className="mt-3 flex items-center gap-1.5 text-[13px] font-semibold text-sv-ink/70">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {t('search.mapNote', { n: results.length, total: totalResults })}
              </p>
            )}
          </div>
        ) : showSkeleton ? (
          <div className={view === 'grid' ? 'sv-card-grid' : 'grid grid-cols-1 gap-6'}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center rounded-card border border-sv-ink/[0.06] bg-sv-surface px-6 py-20 text-center shadow-card">
            <span className="grid h-16 w-16 place-items-center rounded-module bg-sv-blue/10">
              <SearchX className="h-7 w-7 text-sv-blue" />
            </span>
            <h2 className="mt-5 text-[20px] font-black tracking-[-0.02em] text-sv-ink">
              {t(isExactLookupQuery(q) ? 'search.lookupMiss' : 'search.emptyTitle')}
            </h2>
            <p className="mt-2 max-w-[380px] text-[15px] font-semibold leading-relaxed text-sv-ink/65">
              {t(isExactLookupQuery(q) ? 'search.lookupMissText' : 'search.emptyText')}
            </p>
            <button
              onClick={resetAll}
              className="mt-6 flex h-11 items-center gap-2 rounded-full bg-sv-blue px-6 text-[14px] font-extrabold text-white transition-all hover:bg-sv-blue-deep"
            >
              <RotateCcw className="h-4 w-4" /> {t('search.resetFilters')}
            </button>
          </div>
        ) : (
          <div className={view === 'grid' ? 'sv-card-grid' : 'grid grid-cols-1 gap-5'}>
            {results.flatMap((l, i) => {
              const card = (
                <ListingCard key={l.id} l={l} i={i} layout={view === 'grid' ? 'wide' : 'list'} />
              )
              if (ads?.native && i === 2) {
                return [
                  <AdCreative key={`ad-${ads.native.id}`} ad={ads.native} lang={lang} />,
                  card,
                ]
              }
              return [card]
            })}
          </div>
        )}

        {/* Pagination — page lives in the URL (?page=N), shareable/SSR-friendly. Map mode shows first-100 pins instead. */}
        {!mapMode && !showSkeleton && totalPages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-3" aria-label={t('search.pagination')}>
            <button
              type="button"
              onClick={() => goPage(page - 1)}
              disabled={page <= 1 || searchLoading}
              className="flex h-11 items-center rounded-full border border-sv-ink/10 bg-sv-surface px-5 text-[13px] font-extrabold text-sv-ink shadow-card transition-all hover:border-sv-blue/40 hover:text-sv-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-blue disabled:opacity-40"
            >
              ← {t('search.prev')}
            </button>
            <span className="text-[13px] font-extrabold text-sv-ink/70" aria-live="polite">
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
        {!embed && !showSkeleton && results.length > 0 && (
          <p className="mt-10 flex items-start gap-2 text-[13px] font-semibold leading-relaxed text-sv-ink/65">
            <Home className="mt-0.5 h-4 w-4 shrink-0" />
            {t('search.seoHint')}
          </p>
        )}
      </div>

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
                className="grid h-11 w-11 place-items-center rounded-full text-sv-ink/70 transition-colors hover:bg-sv-ink/[0.05] hover:text-sv-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">{filtersBody(true)}</div>
            <div className="flex gap-2 border-t border-sv-ink/[0.06] bg-sv-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={resetAll}
                className="flex h-11 items-center justify-center gap-1.5 rounded-full px-4 text-[13px] font-extrabold text-sv-orange transition-colors hover:bg-sv-orange/10"
              >
                <RotateCcw className="h-3.5 w-3.5" /> {t('search.clear')}
              </button>
              <button
                type="button"
                onClick={() => {
                  flushDrafts()
                  setSheetOpen(false)
                }}
                className="h-11 flex-1 rounded-full bg-sv-blue text-[14px] font-extrabold text-white shadow-glow-blue-sm transition-colors hover:bg-sv-blue-deep"
              >
                {t('search.showResults', { n: totalResults })}
              </button>
            </div>
          </div>
        </div>
      )}

      </Shell>

      {!embed && <Footer />}
    </div>
  )
}
