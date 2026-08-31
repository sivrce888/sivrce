/** Map an autocomplete pick → search URL filters. City/district survive a street pick. */

export type SuggestKind = 'city' | 'district' | 'street'

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
