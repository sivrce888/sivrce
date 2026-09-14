/**
 * sivrce.com "World Desk" — what the visitor's OWN country looks like on the
 * global home, plus the region-grouped world index under it.
 *
 * Derived only: names from place-context (Intl), metros + country facts from
 * countries/global-os, buyer costs / rent rules from countries/costs (public
 * statute, `asOf` carried through). Nothing is invented here — a country with
 * no verified cost table renders `cost: null` and the UI says so.
 *
 * Three honest states:
 *   deep      — launched hub, city pages, verified cost model
 *   pinned    — committed metro pins, searchable, no hub yet
 *   discovery — ISO row only; search + live geocode, never a dead URL
 *
 * ponytail: pure functions over the static corpus, no DB, no FX, no fetch.
 * Safe for prebuild checks and server components.
 */

import { countryOf } from '@/lib/place-context'
import {
  cityFact,
  buyerCosts,
  marketCosts,
  COSTS_AS_OF,
} from '@/lib/countries/costs'
import {
  countryInfo,
  globalCountry,
  metroBySlug,
  metrosForCountry,
} from '@/lib/countries/global-os'
import { COUNTRY_IDS, MARKETS, type PathCountryId } from '@/lib/markets'
import type { Lang } from '@/lib/i18n/core'

/** Cities shown in the visitor panel — enough to act on, short enough to scan. */
const DESK_CITIES = 6

export type DeskState = 'deep' | 'pinned' | 'discovery'

export interface DeskCity {
  slug: string
  name: string
  /** Country-hub city page. null unless the market ships copy for this slug. */
  href: string | null
  /** Always live: worldwide search scoped to country + city. */
  searchHref: string
}

export interface DeskCost {
  /** Local legal name of the headline buyer tax (DMTO, SDLT, tapu harcı…). */
  taxLabel: string
  /** Headline rate chip for the market's default city. */
  chip: string
  chipTitle: string
  /** Buyer-side cash on top of the price, % — one decimal. */
  totalPct: number
  closer: string
  cashLabel: string
  note: string
  rentTitle: string
  rentRules: readonly [string, string, string]
  rentNote: string
  /** Year the statute table was last verified. */
  asOf: string
}

export interface VisitorDesk {
  cc: string
  /** Country name in the reader's language. */
  name: string
  state: DeskState
  /** Canonical hub path on sivrce.com, or null when not launched. */
  hubPath: string | null
  currency: string
  locale: string
  capital: string | null
  languages: readonly string[]
  population: number | null
  /** Sourced one-liner from the country corpus. */
  note: string | null
  cities: DeskCity[]
  /** Verified buyer-cost model — null for every non-launched market. */
  cost: DeskCost | null
  searchHref: string
  mapHref: string
}

/** Country label in any supported UI language (Intl for the six without a hand row). */
export function countryName(cc: string, lang: Lang): string {
  const o = countryOf(cc)
  if (lang === 'ka') return o.ka
  if (lang === 'ru') return o.ru
  if (lang === 'de') return o.de ?? o.en
  if (lang === 'en') return o.en
  try {
    return new Intl.DisplayNames([lang], { type: 'region' }).of(cc.toUpperCase()) ?? o.en
  } catch {
    return o.en
  }
}

function costFor(id: PathCountryId): DeskCost | null {
  const m = marketCosts(id)
  const fact = cityFact(id)
  const costs = buyerCosts(id)
  // GENERIC fallback carries no verified rate — never render it as fact.
  if (!costs || costs.lines.length === 0 || fact.chip === '—') return null
  return {
    taxLabel: m.taxLabel,
    chip: fact.chip,
    chipTitle: fact.chipTitle,
    totalPct: costs.totalPct,
    closer: m.closer,
    cashLabel: m.cashLabel,
    note: m.note,
    rentTitle: m.rentTitle,
    rentRules: m.rentRules,
    rentNote: m.rentNote,
    asOf: COSTS_AS_OF,
  }
}

/**
 * The country corpus stores the capital as a slug (`andorra-la-vella`).
 * Prefer the pinned metro's real name; otherwise title-case the slug rather
 * than printing a URL fragment at a human.
 */
function capitalName(slug: string | undefined, lang: Lang): string | null {
  if (!slug) return null
  const pin = metroBySlug(slug)
  if (pin) return lang === 'ka' ? pin.ka : pin.en
  return slug.replace(/-/g, ' ').replace(/(^|\s)\p{Ll}/gu, (c) => c.toUpperCase())
}

function searchHref(cc: string, city?: string): string {
  const q = new URLSearchParams({ country: cc })
  if (city) q.set('city', city)
  return `/search?${q.toString()}`
}

/**
 * The visitor's own country, resolved for the global home.
 * `null` when the ISO is missing or unknown — caller renders the world index
 * alone rather than guessing a market.
 */
export function visitorDesk(cc: string | null | undefined, lang: Lang): VisitorDesk | null {
  const code = cc?.trim().toUpperCase()
  if (!code || !/^[A-Z]{2}$/.test(code)) return null
  const country = globalCountry(code)
  if (!country) return null

  const info = countryInfo(code)
  const deepId = country.deepId
  const market = deepId ? MARKETS[deepId] : null
  const shipped = new Set<string>(market?.citySlugs ?? [])

  const metros = metrosForCountry(code).slice(0, DESK_CITIES)
  const cities: DeskCity[] = metros.map((m) => {
    const name = lang === 'ka' ? m.ka : m.en
    return {
      slug: m.slug,
      name,
      href: market && shipped.has(m.slug) ? `${market.pathPrefix}/${m.slug}` : null,
      searchHref: searchHref(code, m.en),
    }
  })

  const state: DeskState = country.deep ? 'deep' : country.cityCount > 0 ? 'pinned' : 'discovery'

  return {
    cc: code,
    name: countryName(code, lang),
    state,
    hubPath: market?.pathPrefix ?? null,
    currency: country.currency,
    locale: country.locale,
    capital: capitalName(info?.capital, lang),
    languages: info?.languages ?? [],
    population: info?.population ?? null,
    note: info?.realEstateNote ?? null,
    cities,
    cost: deepId ? costFor(deepId) : null,
    searchHref: searchHref(code),
    mapHref: country.center ? `/map?country=${code}` : '/map',
  }
}

export interface DeskIndexRow {
  id: PathCountryId
  cc: string
  name: string
  path: string
  currency: string
  /** Headline buyer-tax chip, or null when the table is not verified yet. */
  chip: string | null
  chipTitle: string | null
  cities: number
}

export interface DeskRegion {
  region: string
  countries: DeskIndexRow[]
}

/**
 * Launched markets grouped by world region, each row carrying its real
 * currency + statutory buyer-tax chip. Region comes from the country corpus;
 * anything without one lands in `Worldwide` rather than being dropped.
 */
export function deskWorldIndex(lang: Lang): DeskRegion[] {
  const byRegion = new Map<string, DeskIndexRow[]>()
  for (const id of COUNTRY_IDS) {
    const market = MARKETS[id]
    const cc = market.countryCode
    if (!cc) continue
    const fact = cityFact(id)
    const verified = fact.chip !== '—'
    const row: DeskIndexRow = {
      id,
      cc,
      name: countryName(cc, lang),
      path: market.pathPrefix,
      currency: market.currency,
      chip: verified ? fact.chip : null,
      chipTitle: verified ? fact.chipTitle : null,
      cities: market.citySlugs.length,
    }
    const region = countryInfo(cc)?.region || 'Worldwide'
    const list = byRegion.get(region)
    if (list) list.push(row)
    else byRegion.set(region, [row])
  }
  return [...byRegion.entries()]
    .map(([region, countries]) => ({
      region,
      countries: countries.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => b.countries.length - a.countries.length || a.region.localeCompare(b.region))
}
