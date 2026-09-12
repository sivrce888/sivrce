/**
 * Compact card projection + pure filter logic for the /projects grids.
 *
 * The client explorer (ProjectsExplorer) receives ONLY this shape — importing
 * the full Project catalog into client code would drag professionals.ts
 * (155+ projects, developers, agents) into the browser bundle. Everything
 * here is React-free so the self-check can run it under tsx.
 */
import { finishMaxYear, getDeveloper, isDelivered, type Project } from '@/data/professionals'
import { canonicalizeDistrict } from '@/lib/district-canon'
import { pickLoc, type DirLoc } from '@/lib/directory-seo'

export interface ProjectCard {
  slug: string
  name: string
  img: string
  location: string
  city: string
  /** Canonical ka district ('' when unknown — never invent). */
  district: string
  developerSlug?: string
  /** Resolved display name — '' for DB-only developers without a catalog profile. */
  devName: string
  priceFromM2: string
  done: number
  finish: string
  /** Max year parsed from finish ('2027 Q2' → 2027) — null when no year. */
  year: number | null
  flats: number
  rating: number
  delivered: boolean
}

/** Server-side projection: resolves dev name + delivered once so the client grid never imports the catalog. */
export function toCard(p: Project, loc: DirLoc): ProjectCard {
  const dev = getDeveloper(p.developerSlug)
  return {
    slug: p.slug,
    name: loc === 'ka' && p.nameKa ? p.nameKa : p.name,
    img: p.img,
    location: p.location,
    city: p.city,
    district: p.district ?? canonicalizeDistrict(p.location, p.city),
    developerSlug: p.developerSlug,
    devName: dev ? pickLoc(dev.name, loc) : '',
    priceFromM2: p.priceFromM2,
    done: p.done,
    finish: p.finish,
    year: finishMaxYear(p.finish),
    flats: p.flats,
    rating: p.rating,
    delivered: isDelivered(p),
  }
}

// -- Filter vocabulary -------------------------------------------------------
// Buckets are market-anchored (median ~$1,650/m², 2026 corpus) — stable keys
// double as URL params. Handover buckets roll forward with the build year so
// '2026 / 2027 / 2028+' never goes stale.

export const PRICE_BUCKETS = [
  { key: 'lt1000', min: 0, max: 1000, label: '<$1,000' },
  { key: '1000-1500', min: 1000, max: 1500, label: '$1,000–1,500' },
  { key: '1500-2000', min: 1500, max: 2000, label: '$1,500–2,000' },
  { key: '2000-3000', min: 2000, max: 3000, label: '$2,000–3,000' },
  { key: 'gt3000', min: 3000, max: Infinity, label: '$3,000+' },
] as const

const NOW_YEAR = new Date().getFullYear()

export const HANDOVER_BUCKETS = [
  { key: 'le', min: 0, max: NOW_YEAR, label: `${NOW_YEAR}` },
  { key: 'mid', min: NOW_YEAR + 1, max: NOW_YEAR + 1, label: `${NOW_YEAR + 1}` },
  { key: 'late', min: NOW_YEAR + 2, max: Infinity, label: `${NOW_YEAR + 2}+` },
] as const

export type Sort = 'rec' | 'price' | 'price-desc' | 'handover' | 'rating' | 'progress'
export const SORTS: Sort[] = ['rec', 'price', 'price-desc', 'handover', 'rating', 'progress']

export interface Q {
  q: string
  city: string
  district: string
  status: '' | 'build' | 'done'
  price: string
  handover: string
  dev: string
  sort: Sort
}

export const EMPTY_Q: Q = { q: '', city: '', district: '', status: '', price: '', handover: '', dev: '', sort: 'rec' }

/** City chip value for "everything outside the top cities". */
export const OTHER_CITY = '__other'

/** '$1,450' → 1450; '' or junk → 0 (price bucket then excludes the row). */
export function priceM2(p: Pick<ProjectCard, 'priceFromM2'>): number {
  return Number(p.priceFromM2.replace(/[^0-9.]/g, '')) || 0
}

// URL is the trust boundary: whitelist keys, cap lengths, ignore junk — bad
// params degrade to unfiltered instead of erroring.
export function parseQ(sp: URLSearchParams): Q {
  const status = sp.get('status')
  const sort = sp.get('sort') as Sort
  return {
    q: sp.get('q')?.slice(0, 60) ?? '',
    city: sp.get('city')?.slice(0, 60) ?? '',
    district: sp.get('district')?.slice(0, 60) ?? '',
    status: status === 'build' || status === 'done' ? status : '',
    price: PRICE_BUCKETS.some((b) => b.key === sp.get('price')) ? sp.get('price')! : '',
    handover: HANDOVER_BUCKETS.some((b) => b.key === sp.get('handover')) ? sp.get('handover')! : '',
    dev: sp.get('dev')?.slice(0, 80) ?? '',
    sort: SORTS.includes(sort) ? sort : 'rec',
  }
}

export function qToSearch(q: Q): string {
  const sp = new URLSearchParams()
  if (q.q) sp.set('q', q.q)
  if (q.city) sp.set('city', q.city)
  if (q.district) sp.set('district', q.district)
  if (q.status) sp.set('status', q.status)
  if (q.price) sp.set('price', q.price)
  if (q.handover) sp.set('handover', q.handover)
  if (q.dev) sp.set('dev', q.dev)
  if (q.sort !== 'rec') sp.set('sort', q.sort)
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export function isQActive(q: Q): boolean {
  return !!(q.q || q.city || q.district || q.status || q.price || q.handover || q.dev) || q.sort !== 'rec'
}

/** Case-insensitive substring over name + location + district + developer (Korter-style quick search). */
function searchHit(p: ProjectCard, q: string): boolean {
  const n = q.toLowerCase()
  return `${p.name}\n${p.location}\n${p.district}\n${p.devName}\n${p.developerSlug}`.toLowerCase().includes(n)
}

export function matchesCard(p: ProjectCard, q: Q, topCities: ReadonlySet<string>): boolean {
  if (q.q && !searchHit(p, q.q)) return false
  if (q.status === 'build' && p.delivered) return false
  if (q.status === 'done' && !p.delivered) return false
  if (q.city && (q.city === OTHER_CITY ? topCities.has(p.city) : p.city !== q.city)) return false
  if (q.district && p.district !== q.district) return false
  if (q.dev && p.developerSlug !== q.dev) return false
  if (q.price) {
    const b = PRICE_BUCKETS.find((b) => b.key === q.price)
    const v = priceM2(p)
    if (!b || v === 0 || v < b.min || v >= b.max) return false
  }
  if (q.handover) {
    const b = HANDOVER_BUCKETS.find((b) => b.key === q.handover)
    // Handover filter speaks about projects still being built — delivered rows
    // have no future handover date, so they never match a year bucket.
    if (!b || p.delivered || p.year === null || p.year < b.min || p.year > b.max) return false
  }
  return true
}

export function sortCards(items: ProjectCard[], sort: Sort): ProjectCard[] {
  if (sort === 'rec') return items
  const s = [...items]
  if (sort === 'price') s.sort((a, b) => (priceM2(a) || Infinity) - (priceM2(b) || Infinity))
  else if (sort === 'price-desc') s.sort((a, b) => priceM2(b) - priceM2(a))
  else if (sort === 'rating') s.sort((a, b) => b.rating - a.rating)
  else if (sort === 'progress') s.sort((a, b) => b.done - a.done)
  else s.sort((a, b) => (a.delivered ? Infinity : a.year ?? Infinity) - (b.delivered ? Infinity : b.year ?? Infinity))
  return s
}

// -- Facets (counts + option lists, derived from the corpus — always in sync) --

export interface CityFacet {
  value: string
  count: number
}

/** Top-N cities by project count; everything else folds into OTHER_CITY. */
export function facetCities(items: ProjectCard[], keep = 3): CityFacet[] {
  const byCity = new Map<string, number>()
  for (const p of items) byCity.set(p.city, (byCity.get(p.city) ?? 0) + 1)
  const top = [...byCity.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, keep)
  const other = items.length - top.reduce((sum, [, n]) => sum + n, 0)
  return other > 0 ? [...top.map(([value, count]) => ({ value, count })), { value: OTHER_CITY, count: other }] : top.map(([value, count]) => ({ value, count }))
}

export interface DevFacet {
  slug: string
  label: string
  count: number
}

/** Canonical districts with counts — '' (unknown) and 1-off junk labels excluded, curated cap. */
export function facetDistricts(items: ProjectCard[], keep = 40): { value: string; count: number }[] {
  const by = new Map<string, number>()
  for (const p of items) {
    if (!p.district) continue
    by.set(p.district, (by.get(p.district) ?? 0) + 1)
  }
  return [...by.entries()]
    .map(([value, count]) => ({ value, count }))
    .filter((d) => d.count >= 2)
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
    .slice(0, keep)
}

export function facetDevs(items: ProjectCard[]): DevFacet[] {
  const by = new Map<string, { label: string; count: number }>()
  for (const p of items) {
    // DB rows without a resolvable developer can't be filtered — skip the
    // empty-slug bucket rather than render a nameless " (N)" option.
    if (!p.developerSlug) continue
    const hit = by.get(p.developerSlug)
    if (hit) hit.count++
    else by.set(p.developerSlug, { label: p.devName || p.developerSlug, count: 1 })
  }
  return [...by.entries()]
    .map(([slug, v]) => ({ slug, label: v.label, count: v.count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

/** Global per-option counts (single pass) for chip badges. */
export interface FacetCounts {
  build: number
  done: number
  city: Map<string, number>
  price: Map<string, number>
  handover: Map<string, number>
}

export function facetCounts(items: ProjectCard[]): FacetCounts {
  const f: FacetCounts = { build: 0, done: 0, city: new Map(), price: new Map(), handover: new Map() }
  const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1)
  for (const p of items) {
    if (p.delivered) f.done++
    else f.build++
    bump(f.city, p.city)
    const v = priceM2(p)
    const pb = v > 0 ? PRICE_BUCKETS.find((b) => v >= b.min && v < b.max) : undefined
    if (pb) bump(f.price, pb.key)
    if (!p.delivered && p.year !== null) {
      const hb = HANDOVER_BUCKETS.find((b) => p.year! >= b.min && p.year! <= b.max)
      if (hb) bump(f.handover, hb.key)
    }
  }
  return f
}
