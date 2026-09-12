/**
 * Homepage / market-hub inventory scope.
 * Country is mandatory for a live rail. City + buy/rent are optional URL locks.
 * `country: '*'` = the worldwide hub — one unified inventory, every country.
 */

import { cityByName, cityBySlug } from '@/lib/map/user-place'
import {
  MARKETS,
  countryIsoForMarket,
  type MarketId,
  type PathCountryId,
} from '@/lib/markets'

export type HomeScope = {
  /** ISO country, or `'*'` for the worldwide hub (no country filter). */
  country: string
  cityNames?: string[]
  /** Exact `city=` search param — ka on GE, Latin elsewhere. */
  cityParam?: string
  deal?: 'buy' | 'rent'
}

/** Name variants a listing.city row may use for this slug. */
export function cityNamesForSlug(slug: string): string[] {
  const pin = cityBySlug(slug)
  const spaced = slug.replace(/-/g, ' ')
  const titled = spaced.replace(/\b\w/g, (c) => c.toUpperCase())
  const names = new Set<string>([slug, spaced, titled])
  if (pin) {
    names.add(pin.ka)
    names.add(pin.en)
  }
  // Common international/German local spellings
  if (slug === 'cologne') { names.add('Köln'); names.add('Koeln'); names.add('köln') }
  if (slug === 'munich') { names.add('München'); names.add('Muenchen'); names.add('münchen') }
  if (slug === 'nuremberg') { names.add('Nürnberg'); names.add('Nuernberg'); names.add('nürnberg') }
  if (slug === 'duesseldorf') { names.add('Düsseldorf'); names.add('düsseldorf') }
  if (slug === 'muenster') { names.add('Münster'); names.add('münster') }
  if (slug === 'wuerzburg') { names.add('Würzburg'); names.add('würzburg') }
  if (slug === 'luebeck') { names.add('Lübeck'); names.add('lübeck') }
  if (slug === 'saarbruecken') { names.add('Saarbrücken'); names.add('saarbrücken') }
  if (slug === 'osnabrueck') { names.add('Osnabrück'); names.add('osnabrück') }
  if (slug === 'zurich') { names.add('Zürich'); names.add('zürich') }
  if (slug === 'geneva') { names.add('Genève'); names.add('Genf') }
  if (slug === 'vienna') { names.add('Wien') }
  if (slug === 'prague') { names.add('Praha') }
  if (slug === 'warsaw') { names.add('Warszawa') }
  if (slug === 'rome') { names.add('Roma') }
  if (slug === 'milan') { names.add('Milano') }
  if (slug === 'florence') { names.add('Firenze') }
  if (slug === 'naples') { names.add('Napoli') }
  if (slug === 'seville') { names.add('Sevilla') }
  if (slug === 'lisbon') { names.add('Lisboa') }
  if (slug === 'athens') { names.add('Athina'); names.add('Αθήνα') }
  return [...names].filter((s) => s.length > 0)
}

/** DB/Meili match list: `?city=Tbilisi` must hit rows stored as თბილისი. */
export function citySearchValues(raw: string | null | undefined): string[] {
  const q = raw?.trim()
  if (!q) return []
  const pin = cityByName(q)
  return pin ? cityNamesForSlug(pin.slug) : [q]
}

/** Catalog key for district expansion — GEO districts are keyed in ka. */
export function cityCatalogName(raw: string | null | undefined): string | undefined {
  const q = raw?.trim()
  if (!q) return undefined
  return cityByName(q)?.ka ?? q
}

function scopeForIso(country: string, citySlug?: string, intent?: 'buy' | 'rent'): HomeScope {
  const pin = citySlug ? cityBySlug(citySlug) : null
  const cityNames = citySlug ? cityNamesForSlug(citySlug) : undefined
  return {
    country,
    cityNames: cityNames?.length ? cityNames : undefined,
    cityParam: pin ? (pin.cc === 'GE' ? pin.ka : pin.en) : undefined,
    deal: intent,
  }
}

/** Product homepage: GE catalog, DE hub, etc. `global` → the unified worldwide inventory. */
export function homeScopeFor(
  market: MarketId,
  citySlug?: string,
  intent?: 'buy' | 'rent',
): HomeScope | null {
  if (market === 'global') return { country: '*' }
  const country = countryIsoForMarket(market)
  if (!country) return null
  return scopeForIso(country, citySlug, intent)
}

export function homeScopeForCountry(
  country: PathCountryId,
  citySlug?: string,
  intent?: 'buy' | 'rent',
): HomeScope | null {
  const iso = MARKETS[country].countryCode
  if (!iso) return null
  return scopeForIso(iso, citySlug, intent)
}

/** Prisma `where` fragment. `'*'`/null = no country filter (worldwide). */
export function homeScopeWhere(scope: HomeScope | null | undefined): {
  country?: string
  city?: { in: string[] }
  dealType?: 'buy' | 'rent'
} {
  if (!scope || scope.country === '*') return {}
  return {
    country: scope.country,
    ...(scope.cityNames?.length ? { city: { in: scope.cityNames } } : {}),
    ...(scope.deal ? { dealType: scope.deal } : {}),
  }
}

export function homeSearchHref(
  extra: Record<string, string | undefined>,
  scope: HomeScope | null | undefined,
): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(extra)) if (v) q.set(k, v)
  if (scope && scope.country !== '*') {
    q.set('country', scope.country)
    if (scope.cityParam) q.set('city', scope.cityParam)
    if (scope.deal) q.set('deal', scope.deal === 'buy' ? 'sale' : 'rent')
  }
  const qs = q.toString()
  return qs ? `/search?${qs}` : '/search'
}

export function homeScopeCacheKey(scope: HomeScope | null | undefined): string {
  if (!scope) return ''
  return [scope.country, scope.cityNames?.join('|') ?? '', scope.deal ?? ''].join(':')
}
