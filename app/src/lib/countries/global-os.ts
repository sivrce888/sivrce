/**
 * SIVRCE Global Real-Estate OS — one unified read layer over every country,
 * metro, developer, project, render and photo in the corpus.
 *
 * Derived, never duplicated: deep markets come from lib/markets + country-copy,
 * metros from lib/map/user-place (+ data/world-places), names from Intl via
 * place-context, costs-as-of from countries/costs, freshness from intel/core,
 * verified metro stations from data/tbilisi-metro. No fake rows, no invented
 * prices, no committed images — renders/photos are counted, not copied.
 *
 * DB-free by design (static corpus only; live DB rows merge at runtime via
 * directory-live). Safe for prebuild checks and server components.
 * All 249 ISO countries resolve (data/world-countries.ts, codes only, names
 * via Intl): pinned metros where committed, discovery-only rows elsewhere —
 * live Nominatim/OSM at runtime, never invented pins, never sitemap links.
 * Developers span the GE corpus (data/professionals) + the world corpus
 * (data/world-developers); renders/photos are counted, not copied (R2).
 * ponytail: one file; per-country fan-out only when a market earns a deep hub.
 * ponytail: one file; per-country fan-out only when a market earns a deep hub.
 * Non-deep currencies fall back to USD/en for display only — never for pricing.
 */

import { DEVELOPERS, PROJECTS } from '@/data/professionals'
import { METRO_STATIONS } from '@/data/tbilisi-metro'
import { worldDevelopers } from '@/data/world-developers'
import { ISO_COUNTRY_CODES } from '@/data/world-countries'
import { WORLD_PLACES } from '@/data/world-places'
import { countrySitemapPaths } from '@/lib/country-copy'
import { COSTS_AS_OF } from '@/lib/countries/costs'
import { normalizeName, refreshHoursFor, type FactType } from '@/lib/intel/core'
import {
  COUNTRY_IDS,
  COM_ORIGIN,
  MARKETS,
  type PathCountryId,
} from '@/lib/markets'
import {
  MAP_CITIES_ALL as MAP_CITIES,
  cityByName,
  nearestMapCity,
} from '@/lib/map/user-place.server'
import type { MapCity } from '@/lib/map/user-place'
import { countryOf } from '@/lib/place-context'

export const GLOBAL_OS_AS_OF = COSTS_AS_OF

// Mirrors isPlaceholderImg / isValidCoords in lib/directory-live.ts (db-coupled).
const isRender = (s: string | undefined): boolean =>
  !!s && (!s.startsWith('/images/') || s.startsWith('/images/projects/'))
const hasCoords = (lat: unknown, lng: unknown): boolean =>
  typeof lat === 'number' &&
  typeof lng === 'number' &&
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  !(Math.abs(lat) < 0.01 && Math.abs(lng) < 0.01)

/** Deep-market id for an ISO-2 cc, if that country earned a hub. */
export function deepMarketFor(cc: string): PathCountryId | null {
  const up = cc.toUpperCase()
  const hit = COUNTRY_IDS.find((id) => MARKETS[id].countryCode === up)
  return hit ?? null
}

export interface GlobalMetro extends MapCity {
  /** Country earned a deep hub (unique copy, costs, buy/rent). */
  deep: boolean
  /** City carries buy + rent intent copy (never link intent URLs otherwise). */
  intent: boolean
  /** Canonical market path, or null for map/suggest-only discovery metros. */
  marketPath: string | null
}

export function globalMetros(): GlobalMetro[] {
  return MAP_CITIES.map((c) => {
    const deep = deepMarketFor(c.cc)
    const intent = deep ? MARKETS[deep].intentCities.includes(c.slug) : false
    return {
      ...c,
      deep: !!deep,
      intent,
      marketPath: deep ? `${MARKETS[deep].pathPrefix}/${c.slug}` : null,
    }
  })
}

export function metrosForCountry(cc: string): GlobalMetro[] {
  const up = cc.toUpperCase()
  return globalMetros().filter((m) => m.cc === up)
}

export interface GlobalCountry {
  /** ISO-3166-1 alpha-2, uppercase. */
  cc: string
  names: { ka: string; en: string; ru: string; de?: string }
  currency: string
  locale: string
  deep: boolean
  deepId: PathCountryId | null
  /** Canonical hub path on sivrce.com, or null (discovery-only country). */
  path: string | null
  defaultCitySlug: string | null
  cityCount: number
  /** Map anchor (deep default city, else first metro) — null = discovery-only, no invented pin. */
  center: { lat: number; lng: number } | null
  metros: GlobalMetro[]
}

export function globalCountries(): GlobalCountry[] {
  const metros = globalMetros()
  const byCc = new Map<string, GlobalMetro[]>()
  for (const m of metros) {
    const list = byCc.get(m.cc) ?? []
    list.push(m)
    byCc.set(m.cc, list)
  }
  const rows: GlobalCountry[] = [...byCc.entries()].map(([cc, list]) => {
    const deep = deepMarketFor(cc)
    const market = deep ? MARKETS[deep] : null
    const anchor =
      (deep && list.find((m) => m.slug === market!.defaultCitySlug)) ?? list[0]!
    return {
      cc,
      names: countryOf(cc),
      currency: market?.currency ?? 'USD',
      locale: market?.locale ?? 'en',
      deep: !!deep,
      deepId: deep,
      path: market?.pathPrefix ?? null,
      defaultCitySlug: market?.defaultCitySlug ?? null,
      cityCount: list.length,
      center: { lat: anchor.lat, lng: anchor.lng },
      metros: list,
    } satisfies GlobalCountry
  })
  // Discovery-only ISO rows: searchable by name, live-geocoded at runtime.
  for (const cc of ISO_COUNTRY_CODES) {
    if (byCc.has(cc)) continue
    rows.push({
      cc,
      names: countryOf(cc),
      currency: 'USD',
      locale: 'en',
      deep: false,
      deepId: null,
      path: null,
      defaultCitySlug: null,
      cityCount: 0,
      center: null,
      metros: [],
    })
  }
  return rows.sort((a, b) => a.names.en.localeCompare(b.names.en))
}

export function globalCountry(cc: string): GlobalCountry | null {
  const up = cc.toUpperCase()
  return globalCountries().find((c) => c.cc === up) ?? null
}

/* ── Metros / transit info ── */

export interface MetroSystem {
  citySlug: string
  city: string
  /** verified = committed station pins; live-only = resolve via OSM/Nominatim at runtime. */
  status: 'verified' | 'live-only'
  lines?: number
  stations?: number
  source: string
}

/** Only Tbilisi ships committed pins — every other city resolves live (no invented counts). */
export function metroSystemFor(slug: string): MetroSystem {
  const metro = globalMetros().find((m) => m.slug === slug)
  const city = metro?.en ?? slug
  if (slug === 'tbilisi') {
    return {
      citySlug: slug,
      city,
      status: 'verified',
      lines: 2,
      stations: METRO_STATIONS.length,
      source: 'OSM georgia-pois + tbilisi-metro-grid (committed)',
    }
  }
  return {
    citySlug: slug,
    city,
    status: 'live-only',
    source: 'live OSM/Nominatim — no committed counts',
  }
}

/** Committed station pins (Tbilisi only); [] everywhere else = live lookup, not "no metro". */
export function metroStationsFor(slug: string) {
  return slug === 'tbilisi' ? METRO_STATIONS : []
}

/* ── Developers / projects / renders / photos ── */

export interface GlobalOsStats {
  /** Countries with committed metro pins. */
  countries: number
  /** All ISO assignments + pin-backed extras (XK) — the OS resolves every one. */
  isoCountries: number
  /** ISO rows without pins: name search + live geocode, no dead URLs. */
  discoveryCountries: number
  metros: number
  deepMarkets: number
  deepCities: number
  worldPlaces: number
  developers: number
  contactableDevelopers: number
  projects: number
  renders: number
  galleries: number
  geoPinned: number
  verifiedMetroStations: number
  asOf: string
}

export function globalOsStats(): GlobalOsStats {
  const metros = globalMetros()
  const contactable = DEVELOPERS.filter((d) => d.phone || d.website || d.ownerId).length
  const iso = new Set<string>([...ISO_COUNTRY_CODES, ...metros.map((m) => m.cc)])
  const pinned = new Set(metros.map((m) => m.cc))
  return {
    countries: pinned.size,
    isoCountries: iso.size,
    discoveryCountries: iso.size - pinned.size,
    metros: metros.length,
    deepMarkets: COUNTRY_IDS.length,
    deepCities: COUNTRY_IDS.reduce((n, id) => n + MARKETS[id].citySlugs.length, 0),
    worldPlaces: WORLD_PLACES.length,
    // worldDevelopers are merged into DEVELOPERS (professionals.ts) — counted once.
    developers: DEVELOPERS.length,
    contactableDevelopers: contactable,
    projects: PROJECTS.length,
    renders: PROJECTS.filter((p) => isRender(p.img)).length,
    galleries: PROJECTS.filter((p) => (p.gallery?.length ?? 0) > 0).length,
    geoPinned: PROJECTS.filter((p) => hasCoords(p.coords?.lat, p.coords?.lng)).length,
    verifiedMetroStations: METRO_STATIONS.length,
    asOf: GLOBAL_OS_AS_OF,
  }
}

export interface CountryCoverage {
  cc: string
  developers: number
  projects: number
  renders: number
}

/** Corpus grouped by country: GE ka city name or world Latin city first, project pin snap as fallback. Unmapped rows reported, never forced. */
export function globalCoverage(): {
  rows: CountryCoverage[]
  unmappedDevelopers: number
  unmappedProjects: number
} {
  const counts = new Map<string, CountryCoverage>()
  const bump = (cc: string, kind: 'developers' | 'projects', render: boolean) => {
    const row = counts.get(cc) ?? { cc, developers: 0, projects: 0, renders: 0 }
    row[kind] += 1
    if (kind === 'projects' && render) row.renders += 1
    counts.set(cc, row)
  }
  const resolveCc = (cityKa: string, lat?: number, lng?: number): string | null =>
    cityByName(cityKa)?.cc ??
    (typeof lat === 'number' && typeof lng === 'number'
      ? nearestMapCity(lat, lng)?.cc ?? null
      : null)
  let unmappedDevelopers = 0
  let unmappedProjects = 0
  // worldDevelopers are merged into DEVELOPERS — one pass, no double count.
  for (const d of DEVELOPERS) {
    const cc = resolveCc(d.city)
    if (!cc) {
      unmappedDevelopers += 1
      continue
    }
    bump(cc, 'developers', false)
  }
  for (const p of PROJECTS) {
    const cc = resolveCc(p.city, p.coords?.lat, p.coords?.lng)
    if (!cc) {
      unmappedProjects += 1
      continue
    }
    bump(cc, 'projects', isRender(p.img))
  }
  return {
    rows: [...counts.values()].sort((a, b) => b.projects - a.projects),
    unmappedDevelopers,
    unmappedProjects,
  }
}

/* ── Search / sitemap / freshness / SEO ── */

export interface GlobalOsHit {
  kind: 'city' | 'developer' | 'project'
  slug: string
  label: string
  sub: string
}

export function globalOsSearch(raw: string, limit = 8): GlobalOsHit[] {
  const needle = normalizeName(raw.trim())
  if (!needle) return []
  const out: GlobalOsHit[] = []
  const exact = cityByName(raw.trim())
  if (exact) {
    out.push({ kind: 'city', slug: exact.slug, label: exact.en, sub: countryOf(exact.cc).en })
  }
  for (const m of MAP_CITIES) {
    if (out.length >= limit) break
    if (m.slug === exact?.slug) continue
    const hay = normalizeName(`${m.en} ${m.ka} ${m.slug}`)
    if (hay.includes(needle)) {
      out.push({ kind: 'city', slug: m.slug, label: m.en, sub: countryOf(m.cc).en })
    }
  }
  for (const d of DEVELOPERS) {
    if (out.length >= limit) break
    if (normalizeName(`${d.name.en} ${d.name.ka}`).includes(needle)) {
      out.push({ kind: 'developer', slug: d.slug, label: d.name.en, sub: d.city })
    }
  }
  for (const p of PROJECTS) {
    if (out.length >= limit) break
    if (normalizeName(p.name).includes(needle)) {
      out.push({ kind: 'project', slug: p.slug, label: p.name, sub: p.city })
    }
  }
  return out.slice(0, limit)
}

/** Canonical indexable paths (deep hubs only). World metros stay map/suggest-only — no dead URLs. */
export function globalOsSitemapPaths(): string[] {
  return COUNTRY_IDS.flatMap((cc) => countrySitemapPaths(cc))
}

/** ISO codes with zero committed pins — usable for name search + live geocode, never for sitemap/links. */
export function discoveryCountryCodes(): string[] {
  const pinned = new Set(globalMetros().map((m) => m.cc))
  return [...new Set([...ISO_COUNTRY_CODES, ...pinned])]
    .filter((cc) => !pinned.has(cc))
    .sort()
}

/** Metros without a route — usable for map snap + suggest, never for sitemap/links. */
export function discoveryMetroSlugs(): string[] {
  return globalMetros()
    .filter((m) => !m.marketPath)
    .map((m) => m.slug)
}

export function osFreshness(): { asOf: string; cycles: { fact: FactType; hours: number }[] } {
  const facts: FactType[] = [
    'price',
    'availability',
    'project_status',
    'permit_status',
    'completion_date',
    'media',
  ]
  return { asOf: GLOBAL_OS_AS_OF, cycles: facts.map((fact) => ({ fact, hours: refreshHoursFor(fact) })) }
}

export function countryJsonLd(cc: string): Record<string, unknown> | null {
  const c = globalCountry(cc)
  if (!c?.path) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'Country',
    name: c.names.en,
    identifier: c.cc,
    url: `${COM_ORIGIN}${c.path}`,
    sameAs: [`${COM_ORIGIN}${c.path}`],
    containsPlace: c.metros.map((m) => ({
      '@type': 'City',
      name: m.en,
      geo: { '@type': 'GeoCoordinates', latitude: m.lat, longitude: m.lng },
      ...(m.marketPath ? { url: `${COM_ORIGIN}${m.marketPath}` } : {}),
    })),
  }
}

export { nearestMapCity, cityByName }
