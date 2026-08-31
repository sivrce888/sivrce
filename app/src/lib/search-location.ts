/** Map an autocomplete pick → search URL filters. City/district survive a street pick. */

export type SuggestKind = 'city' | 'district' | 'street'

export type LocationValue = { city: string; district: string; street: string; metro?: boolean }

export function splitDistricts(raw: string | null | undefined): string[] {
  if (!raw) return []
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

export function locStamp(v: Pick<LocationValue, 'city' | 'district' | 'street'>): string {
  return `${v.city}\0${v.district}\0${v.street}`
}

/** Newest first. Nationwide (no city) is not a place. */
export function mergeLocRecent(cur: LocationValue[], v: LocationValue, max = 4): LocationValue[] {
  if (!v.city) return cur
  const stamp = locStamp(v)
  const next: LocationValue = { city: v.city, district: v.district, street: v.street }
  return [next, ...cur.filter((x) => locStamp(x) !== stamp)].slice(0, max)
}

const LOC_RECENT_KEY = 'sivrce.loc.recent'

export function readLocRecent(): LocationValue[] {
  if (typeof window === 'undefined') return []
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(LOC_RECENT_KEY) ?? '[]')
    if (!Array.isArray(raw)) return []
    return raw.filter((x): x is LocationValue =>
      !!x && typeof x === 'object' && typeof (x as LocationValue).city === 'string',
    ).slice(0, 4)
  } catch {
    return []
  }
}

export function pushLocRecent(v: LocationValue): LocationValue[] {
  const next = mergeLocRecent(readLocRecent(), v)
  try { localStorage.setItem(LOC_RECENT_KEY, JSON.stringify(next)) } catch { /* private mode */ }
  return next
}

/** Compact label for the location trigger. */
export function locationLabel(v: LocationValue, empty = 'აირჩიე ქალაქი'): string {
  const districts = splitDistricts(v.district)
  if (v.street) {
    if (districts[0]) return `${v.street}, ${districts[0]}`
    if (v.city) return `${v.street}, ${v.city}`
    return v.street
  }
  if (districts.length === 1) return v.city ? `${districts[0]}, ${v.city}` : districts[0]!
  if (districts.length === 2) return districts.join(', ')
  if (districts.length > 2) return v.city ? `${v.city} · ${districts.length}` : String(districts.length)
  if (v.city) return v.city
  return empty
}

/** URL param: selected names only. Raion ≠ all its ubani. */
export function compactDistrictParam(selected: string[], _raions?: Record<string, string[]>): string {
  return [...new Set(selected)].join(',')
}

export type SuggestHit = {
  kind: SuggestKind
  ka: string
  city?: string
  district?: string
}

/** Keys present in the patch; `undefined` means delete that param. */
export function suggestionToFilters(
  s: SuggestHit,
): Record<string, string | undefined> {
  if (s.kind === 'city') return { city: s.ka, district: undefined, q: undefined }
  if (s.kind === 'district') {
    return {
      ...(s.city ? { city: s.city } : {}),
      district: s.ka,
      q: undefined,
    }
  }
  return {
    ...(s.city ? { city: s.city } : {}),
    ...(s.district ? { district: s.district } : {}),
    q: s.ka,
  }
}

export function filtersToParams(f: Record<string, string | undefined>): URLSearchParams {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(f)) if (v) p.set(k, v)
  return p
}

export function searchHref(f: Record<string, string | undefined>): string {
  const qs = filtersToParams(f).toString()
  return qs ? `/search?${qs}` : '/search'
}

/** Prefer city → district → street when the typed box equals a catalog label. */
export function exactSuggestHit(items: SuggestHit[], q: string): SuggestHit | undefined {
  const needle = q.trim().toLowerCase()
  if (!needle) return undefined
  const order: SuggestKind[] = ['city', 'district', 'street']
  for (const k of order) {
    const hit = items.find((s) => s.kind === k && s.ka.toLowerCase() === needle)
    if (hit) return hit
  }
  return undefined
}
