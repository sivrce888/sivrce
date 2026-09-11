/**
 * Natural-language search → structured /search params.
 * ponytail: regex parse, no model. AI route may overlay when Gemini is up.
 */

import { canonicalizeDistrict } from '@/lib/district-canon'
import { geoDistrictsOf } from '@/data/georgia-locations'
import { BERLIN_BEZIRKE, DE_CITIES, bezirkSlugOfOrtsteil } from '@/lib/countries/de'

export type NlFilters = {
  dealType?: 'sale' | 'rent' | 'daily' | 'pledge'
  propertyType?: 'apartment' | 'house' | 'villa' | 'commercial' | 'land' | 'hotel'
  city?: string
  district?: string
  minPrice?: number
  maxPrice?: number
  rooms?: number
  bedrooms?: number
  minArea?: number
  maxArea?: number
  features?: string[]
  pets?: boolean
  /** Tbilisi metro catchment (`metro=1`). Never set for DE cities — index is GE-only. */
  nearMetro?: boolean
  /** Stored vocabulary keys (`add.status.*` / `add.cond.*`). */
  buildingStatus?: string
  condition?: string
  currency?: 'USD' | 'GEL' | 'EUR'
  keywords?: string
}

const CITIES: [string, string][] = [
  ['თბილისი', 'თბილისი'],
  ['tbilisi', 'თბილისი'],
  ['ბათუმი', 'ბათუმი'],
  ['batumi', 'ბათუმი'],
  ['ქუთაისი', 'ქუთაისი'],
  ['kutaisi', 'ქუთაისი'],
  ['რუსთავი', 'რუსთავი'],
  ['rustavi', 'რუსთავი'],
  ['tiflis', 'თბილისი'],
  ['kutaissi', 'ქუთაისი'],
]

for (const c of DE_CITIES) {
  CITIES.push([c.ka, c.ka], [c.de.toLowerCase(), c.ka], [c.slug, c.ka])
}
for (const [alias, slug] of [
  ['muenchen', 'munich'],
  ['münchen', 'munich'],
  ['koeln', 'cologne'],
  ['köln', 'cologne'],
  ['düsseldorf', 'duesseldorf'],
  ['nürnberg', 'nuremberg'],
  ['nuernberg', 'nuremberg'],
  ['hannover', 'hanover'],
] as const) {
  const ka = DE_CITIES.find((c) => c.slug === slug)?.ka
  if (ka) CITIES.push([alias, ka])
}

function foldDe(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ß/g, 'ss')
}

/** Official German names, longest first so "Prenzlauer Berg" wins over "Berg". */
const BERLIN_PLACES = [
  ...BERLIN_BEZIRKE.map((b) => b.de),
  'Prenzlauer Berg',
  'Friedrichshain',
  'Kreuzberg',
  'Charlottenburg',
  'Wilmersdorf',
  'Schöneberg',
  'Neukölln',
  'Köpenick',
  'Wedding',
  'Moabit',
  'Lichterfelde',
  'Karlshorst',
  'Haselhorst',
  'Buckow',
  'Grünau',
].sort((a, b) => b.length - a.length)

function findBerlinPlace(q: string): { district: string; city: string } | undefined {
  const folded = ` ${foldDe(q)} `
  for (const name of BERLIN_PLACES) {
    const key = foldDe(name)
    if (!folded.includes(` ${key} `) && !folded.includes(` ${key},`)) continue
    const slug = bezirkSlugOfOrtsteil(name)
    const bez = slug ? BERLIN_BEZIRKE.find((b) => b.slug === slug) : undefined
    return { district: bez?.de ?? name, city: 'ბერლინი' }
  }
  return undefined
}

const CITY_OF = new Map<string, string>()
for (const city of ['თბილისი', 'ბათუმი', 'ქუთაისი', 'რუსთავი']) {
  for (const d of geoDistrictsOf(city)) CITY_OF.set(d, city)
}

const FEATURE_RX: [RegExp, string][] = [
  [/parking|პარკინგ|ავტოსადგომ|parkplatz|stellplatz/i, 'add.f.parking'],
  [/garage|გარაჟ|ავტოფარეხ/i, 'add.f.garage'],
  [/bright|ნათელ|ბუნებრივი სინათლ|hell|lichtdurchflutet/i, 'add.f.bright'],
  [/elevator|lift|ლიფტ|aufzug/i, 'add.f.elevator'],
  [/loggia|ლოჯ|лоджи/i, 'add.f.loggia'],
  [/balcony|აივან|балкон|balkon/i, 'add.f.balcony'],
  [/furnish|ავეჯ|möbliert|moebliert/i, 'add.f.furniture'],
  [/წვეულებ|ბადაბ|დაბადების\s*დღ|ივენთ|\bpart(?:y|ies)\b|\bbirthday\b|\bevent\s*house\b/i, 'add.f.partiesAllowed'],
]

function parseMoney(raw: string): number | undefined {
  const s = raw.replace(/[$,₾€\s]/g, '').replace(/,/g, '')
  if (!s) return undefined
  // German thousand-dots: 200.000 → 200000 (strict 3-digit groups only,
  // so a decimal like 2.5 still parses as a decimal below).
  const deThousands = s.match(/^(\d{1,3}(?:\.\d{3})+)([kKmM])?$/)
  const t = deThousands ? `${deThousands[1]!.replace(/\./g, '')}${deThousands[2] ?? ''}` : s
  const m = t.match(/^(\d+(?:\.\d+)?)([kKmM])?$/)
  if (!m) {
    const n = Number(s)
    return Number.isFinite(n) && n > 0 ? n : undefined
  }
  const n = Number(m[1])
  if (!Number.isFinite(n)) return undefined
  if (m[2] === 'k' || m[2] === 'K') return Math.round(n * 1000)
  if (m[2] === 'm' || m[2] === 'M') return Math.round(n * 1_000_000)
  return Math.round(n)
}

function findCity(q: string): string | undefined {
  const lower = foldDe(q)
  for (const [key, city] of CITIES) {
    if (lower.includes(foldDe(key)) || q.includes(key)) return city
  }
  return undefined
}

function findDistrict(q: string): string | undefined {
  const catalog = [...CITY_OF.keys()].sort((a, b) => b.length - a.length)
  for (const d of catalog) {
    if (d.length < 3) continue
    if (q.includes(d)) return d
  }
  const tokens = q.toLowerCase().split(/[^a-zა-ჰ-]+/).filter((t) => t.length > 1)
  for (let n = 3; n >= 1; n--) {
    for (let i = 0; i <= tokens.length - n; i++) {
      const phrase = tokens.slice(i, i + n).join(' ')
      const canon = canonicalizeDistrict(phrase)
      if (CITY_OF.has(canon)) return canon
    }
  }
  return undefined
}

export function parseNlQuery(query: string): NlFilters {
  const raw = query.trim()
  const q = raw.toLowerCase()
  const out: NlFilters = {}

  if (/იყიდება|შეძენა|გაყიდვა|\bbuy\b|\bsale\b|\bsell\b|\bkauf\b|kaufpreis|verkauf|\bkaufen\b/i.test(q)) out.dealType = 'sale'
  else if (/დღიურად|\bdaily\b|\bovernight\b|tagesmiete|ferienwohnung(en)?|übernacht/i.test(q)) out.dealType = 'daily'
  else if (/გირავდ|გირავნ|\bpledge\b|\bcollateral\b|\bзалог/i.test(q)) out.dealType = 'pledge'
  else if (/გაიცემა\s*იჯარ|იჯარით|\bijara\b/i.test(q)) out.dealType = 'rent'
  else if (/ქირავდება|გაქირავება|\brent\b|\blease\b|ქირა|kaltmiete|warmmiete|\bmiete\b|\bmieten\b|pacht/i.test(q)) out.dealType = 'rent'

  const party = /წვეულებ|ბადაბ|დაბადების\s*დღ|ივენთ|\bpart(?:y|ies)\b|\bbirthday\b|\bevent\s*house\b|partyhaus|geburtstag|feier/i.test(q)
  if (party && !out.dealType) out.dealType = 'daily'

  if (/ბინა|\bapartment\b|\bflat\b|\bstudio\b|(?<!ferien)wohnung/i.test(q) && !party) out.propertyType = 'apartment'
  else if (/აგარაკ|\bcottage\b|\bdacha\b|ferienhaus|ferienwohnung(en)?/i.test(q)) out.propertyType = 'villa'
  else if (/სასტუმრო|\bhotel\b/i.test(q)) out.propertyType = 'hotel'
  else if (!party && /სახლი|\bhouse\b|\bvilla\b|ვილა|haus/i.test(q)) out.propertyType = 'house'
  else if (/კომერც|\bcommercial\b|\bshop\b|მაღაზია|\boffice\b|ოფისი|gewerbe|büro|buero|laden|geschäft/i.test(q)) out.propertyType = 'commercial'
  else if (/მიწა|\bland\b|\bplot\b|ნაკვეთი|grundstück|grundstueck|grundst/i.test(q)) out.propertyType = 'land'

  if (out.dealType === 'rent' && /გაიცემა\s*იჯარ|იჯარით|\bijara\b/i.test(q) && !out.propertyType) {
    out.propertyType = 'land'
  }

  const bedMatch = q.match(/(\d+)\s*[-]?\s*(საძინებელ|საძინებლიან|\bbedrooms?\b|\bbeds?\b|schlafzimmer)/i)
  if (bedMatch) out.bedrooms = Number(bedMatch[1])
  const roomMatch = q.match(/(\d+)\s*[-]?\s*(ოთახიანი|ოთახი|\brooms?\b|(?<!schlaf)zimmer)/i)
  if (roomMatch) out.rooms = Number(roomMatch[1])

  // €/m² is a unit price — never treat it as a purchase cap (trust).
  const isPpm2 = /€?\s*\/\s*m[²2]|pro\s*m[²2]|quadratmeterpreis/i.test(q)
  const moneyTailBad = /minuten|\bmin\b|\bstunden\b|km\b|meter\b/i
  const under = q.match(/(?:under|below|unter|bis\s*zu|ქვემოთ|მდე|up to)\s*[$₾€]?\s*([\d.,]+)\s*([kKmM])?/i)
  const over = q.match(/(?:ab|from|über|ueber|starting at|min(?:imum)?)\s*[$₾€]?\s*([\d.,]+)\s*([kKmM])?/i)
  const kPrice = q.match(/\$\s*([\d.,]+)\s*([kKmM])/)
  const eurPrice = q.match(/€\s*([\d.,]+)\s*([kKmM])?/)
  const eurTrailing = q.match(/([\d.,]+)\s*€/)
  const gelPrice = q.match(/₾\s*([\d.,]+)\s*([kKmM])?/)
  const bareK = q.match(/\b(\d+(?:[.,]\d+)?)\s*([kK])\b/)
  const moneyOk = (m: RegExpMatchArray | null) => {
    if (!m || isPpm2) return false
    const after = q.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 12)
    return !moneyTailBad.test(after)
  }
  const moneySrc = [under, eurPrice, gelPrice, kPrice, eurTrailing, bareK].find(moneyOk) ?? null
  if (moneySrc) {
    const n = parseMoney(`${moneySrc[1]}${moneySrc[2] ?? ''}`)
    if (n) out.maxPrice = n
  }
  if (over && moneyOk(over) && !isPpm2) {
    const n = parseMoney(`${over[1]}${over[2] ?? ''}`)
    if (n && n !== out.maxPrice) out.minPrice = n
  }
  if (/€|eur\b/.test(q)) out.currency = 'EUR'
  else if (/₾|gel\b/.test(q)) out.currency = 'GEL'
  else if (/\$|usd\b/.test(q)) out.currency = 'USD'

  if (
    /neubau|erstbezug|new[\s-]?developments?|new[\s-]?builds?|off[\s-]?plan|ახალაშენებულ/i.test(q)
  )
    out.buildingStatus = 'add.status.new'
  else if (/\bim bau\b|rohbau/i.test(q)) out.buildingStatus = 'add.status.construction'
  else if (/\baltbau\b|denkmalschutz/i.test(q)) {
    out.buildingStatus = 'add.status.old'
    out.condition = 'add.cond.oldReno'
  }

  const city = findCity(q)
  const district = findDistrict(raw)
  const berlin = findBerlinPlace(raw)
  if (city) out.city = city
  if (district) {
    out.district = district
    if (!out.city) out.city = CITY_OF.get(district)
  } else if (berlin) {
    out.district = berlin.district
    if (!out.city) out.city = berlin.city
  }

  const features: string[] = []
  for (const [rx, key] of FEATURE_RX) {
    if (rx.test(q)) features.push(key)
  }
  if (features.length) out.features = features
  if (/pet[- ]?friendly|ცხოველ|pets?\s+allow|haustier/i.test(q)) out.pets = true
  // Tbilisi metroM index only. U-Bahn/S-Bahn must not silently filter GE stations.
  if (
    /(?:near|close\s+to)\s+(?:the\s+)?metro|მეტრო|метро|metro\s+nearby/i.test(q) &&
    !DE_CITIES.some((c) => c.ka === out.city)
  ) {
    out.nearMetro = true
  }

  if (!nlHasStructure(out)) out.keywords = raw
  return out
}

export function nlHasStructure(f: NlFilters): boolean {
  return Boolean(
    f.dealType ||
      f.propertyType ||
      f.city ||
      f.district ||
      f.maxPrice ||
      f.minPrice ||
      f.rooms ||
      f.bedrooms ||
      f.minArea ||
      f.maxArea ||
      f.pets ||
      f.nearMetro ||
      f.features?.length ||
      f.buildingStatus ||
      f.condition,
  )
}

/** URL keys used by /search (parseSearchParams). */
export function nlToSearchPatch(f: NlFilters): Record<string, string | undefined> {
  const patch: Record<string, string | undefined> = { q: undefined }
  if (f.dealType) patch.deal = f.dealType
  if (f.propertyType) patch.type = f.propertyType
  if (f.city) patch.city = f.city
  if (f.district) patch.district = f.district
  if (f.maxPrice) patch.max = String(f.maxPrice)
  if (f.minPrice) patch.min = String(f.minPrice)
  if (f.rooms) patch.rooms = String(f.rooms)
  if (f.bedrooms) patch.beds = String(f.bedrooms)
  if (f.minArea) patch.amin = String(f.minArea)
  if (f.maxArea) patch.amax = String(f.maxArea)
  if (f.features?.length) patch.feat = f.features.join(',')
  if (f.pets) patch.pets = '1'
  if (f.nearMetro) patch.metro = '1'
  if (f.buildingStatus) patch.bstat = f.buildingStatus
  if (f.condition) patch.cond = f.condition
  if (f.currency && f.currency !== 'USD') patch.cur = f.currency
  if (f.keywords) patch.q = f.keywords
  return patch
}

export function mergeNl(base: NlFilters, over: NlFilters): NlFilters {
  const features = [...new Set([...(base.features ?? []), ...(over.features ?? [])])]
  return {
    ...base,
    ...Object.fromEntries(Object.entries(over).filter(([, v]) => v != null && v !== '')),
    features: features.length ? features : undefined,
  }
}

/** Official Berlin planning/cadastre language → map, not empty /search. */
export function isOfficialGeoQuery(q: string): boolean {
  return /\bb-?pl[aä]ne?\b|bebauungsplan|alkis|\bflurst|step\s*wohnen|bodenrichtwert|\bmietspiegel\b|\bbaurecht\b/i.test(
    q,
  )
}

export function nlHasListingConstraints(f: NlFilters): boolean {
  return Boolean(
    f.rooms ||
      f.bedrooms ||
      f.maxPrice ||
      f.minPrice ||
      f.propertyType ||
      f.district ||
      f.features?.length ||
      f.buildingStatus ||
      f.condition ||
      f.pets ||
      f.nearMetro,
  )
}

export function coordsForNlCity(ka: string | undefined): { lat: number; lng: number } | null {
  if (!ka) return null
  const c = DE_CITIES.find((x) => x.ka === ka)
  return c ? c.center : null
}

export function countryNlNeedsGeocode(q: string): boolean {
  const raw = q.trim()
  if (raw.length < 3) return false
  if (isOfficialGeoQuery(raw)) return false
  const p = parseNlQuery(raw)
  return !p.city && !nlHasListingConstraints(p)
}

export type CountryNlRoute = { go: 'projects' | 'map'; href: string }

/**
 * Country-hub submit: Neubau/geo/constrained NL → map or projects.
 * No /search on sivrce.com — it is the Georgia catalog and would 308
 * cross-host; the map carries deal/kind/status + city pin instead
 * (rooms/price constraints have no map params yet).
 */
export function routeCountryNl(p: {
  q: string
  tab: 'buy' | 'rent' | 'projects'
  country: string
  cityKa?: string
  lat: number
  lng: number
  /** Hero type picker — wins over NL parse when set. */
  kind?: NlFilters['propertyType']
}): CountryNlRoute {
  if (p.tab === 'projects') return { go: 'projects', href: '#new-builds' }
  const raw = p.q.trim()
  if (p.country === 'de' && raw && isOfficialGeoQuery(raw)) {
    const pin = coordsForNlCity(parseNlQuery(raw).city) ?? { lat: p.lat, lng: p.lng }
    return { go: 'map', href: `/map?lat=${pin.lat.toFixed(5)}&lng=${pin.lng.toFixed(5)}&zoom=12.8&country=DE` }
  }
  const parsed: NlFilters = raw ? parseNlQuery(raw) : {}
  if (!parsed.dealType) parsed.dealType = p.tab === 'rent' ? 'rent' : 'sale'
  if (!parsed.city && p.cityKa) parsed.city = p.cityKa
  if (p.kind) parsed.propertyType = p.kind

  const projectish =
    p.country === 'de' &&
    /neubau|bauprojekt|bautr[aä]ger|wohnungsunternehmen|projektentwickler|new[\s-]?developments?|new[\s-]?builds?|off[\s-]?plan/i.test(
      raw,
    ) &&
    parsed.rooms == null &&
    parsed.maxPrice == null &&
    parsed.minPrice == null
  if (projectish) return { go: 'projects', href: '#new-builds' }

  const pin = coordsForNlCity(parsed.city) ?? { lat: p.lat, lng: p.lng }
  const q = new URLSearchParams()
  q.set('lat', pin.lat.toFixed(5))
  q.set('lng', pin.lng.toFixed(5))
  q.set('zoom', '12.8')
  if (parsed.dealType) q.set('deal', parsed.dealType)
  if (parsed.propertyType === 'villa') q.set('kind', 'house')
  else if (parsed.propertyType) q.set('kind', parsed.propertyType)
  if (parsed.buildingStatus === 'add.status.construction') q.set('status', 'construction')
  if (p.country === 'de') q.set('country', 'DE')
  return { go: 'map', href: `/map?${q}` }
}

/**
 * Client helper: ask /api/ai/search to structure a query the regex parser
 * couldn't. Returns null on any failure (offline, no key, rate limit, slow) —
 * callers keep their regex/keyword path. 6s cap: never block navigation.
 * ponytail: fire-and-forget quality; upgrade to streaming merge if queries grow.
 */
export async function aiParseQuery(query: string): Promise<NlFilters | null> {
  try {
    const r = await fetch('/api/ai/search', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(6000),
    })
    if (!r.ok) return null
    const j = (await r.json()) as { ok?: boolean; source?: string; filters?: NlFilters }
    return j.ok && j.source === 'ai' && j.filters ? j.filters : null
  } catch {
    return null
  }
}
