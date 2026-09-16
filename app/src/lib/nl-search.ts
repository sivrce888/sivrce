/**
 * Natural-language search → structured /search params & Super Search Intent Engine.
 * ponytail: regex parse, no model required. AI route overlays when Gemini is active.
 */

import { canonicalizeDistrict } from '@/lib/district-canon'
import { geoDistrictsOf } from '@/data/georgia-locations'
import { BERLIN_BEZIRKE, DE_CITIES, bezirkSlugOfOrtsteil } from '@/lib/countries/de'
import { MARKETS, isPathCountry } from '@/lib/markets'
import { searchHref } from '@/lib/search-location'

/** ISO market code for the /map `country` filter, or null for Georgia (unscoped). */
function mapCountryIso(country: string): string | null {
  return isPathCountry(country) ? MARKETS[country].countryCode : null
}

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
  /** "kein Erdgeschoss" / "first floor or higher" → search `fmin`. */
  floorMin?: number
  features?: string[]
  pets?: boolean
  /** Tbilisi metro catchment (`metro=1`). Never set for DE cities — index is GE-only. */
  nearMetro?: boolean
  /** Stored vocabulary keys (`add.status.*` / `add.cond.*`). */
  buildingStatus?: string
  condition?: string
  currency?: 'USD' | 'GEL' | 'EUR'
  keywords?: string
  /** Investment intent flag */
  investmentGoal?: boolean
  /** Quiet / family / lifestyle intent flag */
  lifestyleGoal?: 'family' | 'quiet' | 'central' | 'luxury'
  /**
   * Time-to-place catchment. Converted to an estimated bbox — not a routing
   * isochrone. Never treated as a district pin (Mitte commute ≠ Mitte-only).
   */
  commute?: NlCommute
}

export type NlCommuteMode = 'transit' | 'walk' | 'cycle' | 'drive'

export type NlCommute = {
  place: string
  minutes: number
  mode: NlCommuteMode
  lat: number
  lng: number
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
  [
    /bright|ნათელ|ბუნებრივი სინათლ|\blots?\s+of\s+(?:natural\s+)?light\b|viel(?:es)?\s+(?:tages)?licht|\bhell(?:e[sn]?)?\b|lichtdurchflutet/i,
    'add.f.bright',
  ],
  [/elevator|lift|ლიფტ|aufzug/i, 'add.f.elevator'],
  [/loggia|ლოჯ|лоджи/i, 'add.f.loggia'],
  [/balcony|აივან|балкон|balkon/i, 'add.f.balcony'],
  [/furnish|ავეჯ|möbliert|moebliert/i, 'add.f.furniture'],
  [/garten|garden|hofanteil/i, 'add.f.yard'],
  [/terrasse|terrace|dachterrasse/i, 'add.f.terrace'],
  [/keller|basement/i, 'add.f.cellar'],
  [/წვეულებ|ბადაბ|დაბადების\s*დღ|ივენთ|\bpart(?:y|ies)\b|\bbirthday\b|\bevent\s*house\b/i, 'add.f.partiesAllowed'],
]

function parseMoney(raw: string): number | undefined {
  const s = raw.replace(/[$,₾€\s]/g, '').replace(/,/g, '')
  if (!s) return undefined
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

/** Public map centers (not survey pins) — commute destination lookup. */
const COMMUTE_PINS: [string, string, number, number][] = [
  ['mitte', 'Mitte', 52.5219, 13.4132],
  ['alexanderplatz', 'Alexanderplatz', 52.5219, 13.4132],
  ['prenzlauer berg', 'Prenzlauer Berg', 52.5388, 13.4244],
  ['friedrichshain', 'Friedrichshain', 52.5158, 13.454],
  ['kreuzberg', 'Kreuzberg', 52.4983, 13.4065],
  ['friedrichshain-kreuzberg', 'Friedrichshain-Kreuzberg', 52.507, 13.43],
  ['charlottenburg', 'Charlottenburg', 52.5167, 13.3041],
  ['wilmersdorf', 'Wilmersdorf', 52.487, 13.32],
  ['charlottenburg-wilmersdorf', 'Charlottenburg-Wilmersdorf', 52.5, 13.31],
  ['schoneberg', 'Schöneberg', 52.485, 13.355],
  ['tempelhof', 'Tempelhof', 52.463, 13.385],
  ['tempelhof-schoneberg', 'Tempelhof-Schöneberg', 52.47, 13.37],
  ['neukolln', 'Neukölln', 52.4813, 13.4351],
  ['kopenick', 'Köpenick', 52.446, 13.575],
  ['treptow-kopenick', 'Treptow-Köpenick', 52.45, 13.52],
  ['wedding', 'Wedding', 52.5505, 13.3517],
  ['moabit', 'Moabit', 52.5285, 13.34],
  ['pankow', 'Pankow', 52.569, 13.404],
  ['spandau', 'Spandau', 52.534, 13.2],
  ['steglitz', 'Steglitz', 52.457, 13.322],
  ['steglitz-zehlendorf', 'Steglitz-Zehlendorf', 52.43, 13.26],
  ['lichterfelde', 'Lichterfelde', 52.437, 13.314],
  ['karlshorst', 'Karlshorst', 52.485, 13.526],
  ['haselhorst', 'Haselhorst', 52.538, 13.227],
  ['buckow', 'Buckow', 52.432, 13.43],
  ['grunau', 'Grünau', 52.416, 13.574],
  ['lichtenberg', 'Lichtenberg', 52.521, 13.48],
  ['marzahn-hellersdorf', 'Marzahn-Hellersdorf', 52.535, 13.587],
  ['reinickendorf', 'Reinickendorf', 52.575, 13.35],
  ['hauptbahnhof', 'Hauptbahnhof', 52.525, 13.369],
]

function commuteMode(q: string): NlCommuteMode {
  if (/walk|walking|zu\s*fu[sß]|fussweg|fußweg/i.test(q)) return 'walk'
  if (/cycl|bike|fahrrad|radweg/i.test(q)) return 'cycle'
  if (/\bdriv|\bauto\b|\bcar\b|\bpkw\b/i.test(q)) return 'drive'
  return 'transit'
}

function resolveCommutePin(placeRaw: string, cityKa?: string): { place: string; lat: number; lng: number } | undefined {
  const folded = foldDe(placeRaw.replace(/^(?:the|der|die|das|dem)\s+/i, '').trim())
  if (!folded) return undefined
  const pin = COMMUTE_PINS.find(([key]) => folded === key || folded.startsWith(`${key} `))
  if (pin) return { place: pin[1], lat: pin[2], lng: pin[3] }
  if (cityKa === 'ბერლინი' && /^(zentrum|center|centre|city\s*centre|stadtzentrum)$/.test(folded)) {
    const berlin = DE_CITIES.find((c) => c.slug === 'berlin')!
    return { place: 'Mitte', lat: berlin.center.lat, lng: berlin.center.lng }
  }
  return undefined
}

function parseCommute(raw: string, cityKa?: string): NlCommute | undefined {
  const m =
    raw.match(
      /(?:within|inside)\s+(\d+)\s+min(?:ute)?s?\s+(?:of|from|to)\s+([^,.;]+)/i,
    ) ||
    raw.match(/innerhalb(?:\s+von)?\s+(\d+)\s+min(?:uten)?\s+(?:von|nach)\s+([^,.;]+)/i) ||
    raw.match(/(\d+)\s+min(?:uten)?\s+(?:von|nach|to)\s+([^,.;]+)/i)
  if (!m) return undefined
  const minutes = Number(m[1])
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 180) return undefined
  const pin = resolveCommutePin(m[2]!.trim(), cityKa)
  if (!pin) return undefined
  return { ...pin, minutes, mode: commuteMode(raw) }
}

/** Estimated Euclidean catchment. Ceiling: over-includes across rivers/transfers. Upgrade → OSRM isochrone. */
export function commuteBbox(c: NlCommute): { west: number; south: number; east: number; north: number } {
  const mpm = c.mode === 'walk' ? 80 : c.mode === 'cycle' ? 250 : c.mode === 'drive' ? 500 : 350
  const radiusM = Math.min(40_000, c.minutes * mpm)
  const dLat = radiusM / 111_320
  const dLng = radiusM / (111_320 * Math.cos((c.lat * Math.PI) / 180))
  const r = (n: number) => Number(n.toFixed(5))
  return { west: r(c.lng - dLng), south: r(c.lat - dLat), east: r(c.lng + dLng), north: r(c.lat + dLat) }
}

function haversineM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6_371_000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
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

  // Apartment/house under a monthly-scale cap with no buy verb → rent, not a €2,000 sale.
  if (
    !out.dealType &&
    out.maxPrice &&
    out.propertyType !== 'land' &&
    out.propertyType !== 'commercial'
  ) {
    if (out.maxPrice <= 20_000) out.dealType = 'rent'
    else if (out.maxPrice >= 50_000) out.dealType = 'sale'
  }

  // Investment intent detection
  if (/invest|yield| ROI |рентабельн|ინვესტიც|მომგებიან/i.test(q)) {
    out.investmentGoal = true
  }

  // Lifestyle intent detection
  if (/quiet|ruhig|მშვიდ/i.test(q)) out.lifestyleGoal = 'quiet'
  else if (/family|familie|ოჯახ/i.test(q)) out.lifestyleGoal = 'family'
  else if (/luxury|luxus|ფუფუნ/i.test(q)) out.lifestyleGoal = 'luxury'
  else if (/central|zentrum|ცენტრ/i.test(q)) out.lifestyleGoal = 'central'

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
  const commute = parseCommute(raw, city)
  if (commute) out.commute = commute
  const district = findDistrict(raw)
  const berlin = commute ? undefined : findBerlinPlace(raw)
  if (city) out.city = city
  if (district) {
    out.district = district
    if (!out.city) out.city = CITY_OF.get(district)
  } else if (berlin) {
    out.district = berlin.district
    if (!out.city) out.city = berlin.city
  }
  if (commute && !out.city) out.city = 'ბერლინი'

  const features: string[] = []
  for (const [rx, key] of FEATURE_RX) {
    if (rx.test(q)) features.push(key)
  }
  if (features.length) out.features = features
  if (/pet[- ]?friendly|ცხოველ|pets?\s+allow|haustier/i.test(q)) out.pets = true
  // "kein Erdgeschoss" & friends → floorMin=1 (ground floor = 0 in the index).
  if (
    /kein(?:e?[rs]?)?\s+erdgeschoss|nicht\s+(?:im\s+)?erdgeschoss|erdgeschoss\s+ausgeschlossen|(?:erster|zweiter|1\.|2\.)\s+(?:og|stock)|obergeschoss|hohe(r?s?)\s+etage|(?:first|upper)\s+floor|not\s+(?:on\s+(?:the\s+)?)?ground\s+floor/i.test(
      q,
    )
  ) {
    out.floorMin = 1
  }
  if (
    /(?:near|close\s+to)\s+(?:the\s+)?metro|მეტრო|метро|metro\s+nearby|nahe\s+(?:der\s+)?U-Bahn|U-Bahn\s+nähe|U-Bahn\s+unter\s+\d+|unter\s+\d+\s+min(?:uten)?\s+(?:zur\s+)?U-Bahn/i.test(
      q,
    )
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
      f.floorMin ||
      f.pets ||
      f.nearMetro ||
      f.investmentGoal ||
      f.lifestyleGoal ||
      f.commute ||
      f.features?.length ||
      f.buildingStatus ||
      f.condition,
  )
}

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
  if (f.floorMin) patch.fmin = String(f.floorMin)
  if (f.features?.length) patch.feat = f.features.join(',')
  if (f.pets) patch.pets = '1'
  if (f.nearMetro) patch.metro = '1'
  if (f.buildingStatus) patch.bstat = f.buildingStatus
  if (f.condition) patch.cond = f.condition
  if (f.currency && f.currency !== 'USD') patch.cur = f.currency
  if (f.lifestyleGoal) patch.life = f.lifestyleGoal
  if (f.commute) {
    const b = commuteBbox(f.commute)
    patch.west = String(b.west)
    patch.south = String(b.south)
    patch.east = String(b.east)
    patch.north = String(b.north)
    patch.cplace = f.commute.place
    patch.cmin = String(f.commute.minutes)
    patch.cmode = f.commute.mode
    patch.district = undefined
  }
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
      f.nearMetro ||
      f.floorMin ||
      f.commute ||
      f.investmentGoal ||
      f.lifestyleGoal,
  )
}

export function coordsForNlCity(ka: string | undefined): { lat: number; lng: number } | null {
  if (!ka) return null
  const c = DE_CITIES.find((x) => x.ka === ka)
  return c ? c.center : null
}

export type CountryNlRoute = { go: 'projects' | 'map' | 'search'; href: string }

export function routeCountryNl(p: {
  q: string
  tab: 'buy' | 'rent' | 'projects'
  country: string
  cityKa?: string
  lat: number
  lng: number
  kind?: NlFilters['propertyType']
}): CountryNlRoute {
  if (p.tab === 'projects') return { go: 'projects', href: '#new-builds' }
  const raw = p.q.trim()
  if (p.country === 'de' && raw && isOfficialGeoQuery(raw)) {
    const pin = coordsForNlCity(parseNlQuery(raw).city) ?? { lat: p.lat, lng: p.lng }
    return { go: 'map', href: `/map?lat=${pin.lat.toFixed(5)}&lng=${pin.lng.toFixed(5)}&zoom=12.8&country=DE` }
  }
  const parsed: NlFilters = raw ? parseNlQuery(raw) : {}
  // Free text with no place and no constraints (e.g. "Alexanderplatz") rides as
  // `q` — computed before the city fallback below would mask it.
  const freeText = Boolean(raw) && !parsed.city && !nlHasListingConstraints(parsed)
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

  const patch = nlToSearchPatch(parsed)
  if (freeText) patch.q = raw
  const iso = mapCountryIso(p.country)
  if (iso) patch.country = iso
  return { go: 'search', href: searchHref(patch) }
}

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

/* ── Match Explanation & Tradeoff Reasoning ── */

export interface PropertyMatchResult {
  matchPercentage: number
  matched: number
  criteria: number
  reasons: string[]
  tradeoffs: string[]
}

const MONEY_MARK: Record<NonNullable<NlFilters['currency']>, string> = {
  USD: '$',
  GEL: '₾',
  EUR: '€',
}

export function explainPropertyMatch(
  query: NlFilters,
  property: {
    price: number
    rooms?: number
    bedrooms?: number
    area?: number
    district?: string
    nearMetro?: boolean
    features?: string[]
    floor?: number
    lat?: number
    lng?: number
  },
): PropertyMatchResult {
  const reasons: string[] = []
  const tradeoffs: string[] = []
  let matched = 0
  let criteria = 0
  const mark = MONEY_MARK[query.currency ?? 'USD']
  const tick = (ok: boolean, yes: string, no: string) => {
    criteria += 1
    if (ok) {
      matched += 1
      reasons.push(yes)
    } else {
      tradeoffs.push(no)
    }
  }

  if (query.maxPrice && property.price) {
    const ok = property.price <= query.maxPrice
    const overPct = ok ? 0 : Math.round(((property.price - query.maxPrice) / query.maxPrice) * 100)
    tick(
      ok,
      `Under budget (${mark}${property.price.toLocaleString()} ≤ ${mark}${query.maxPrice.toLocaleString()})`,
      `Above target price (+${overPct}%)`,
    )
  }

  if (query.bedrooms && property.bedrooms != null) {
    tick(
      property.bedrooms >= query.bedrooms,
      `Matches bedroom requirement (${property.bedrooms} BR)`,
      `Fewer bedrooms than requested (${property.bedrooms} vs ${query.bedrooms})`,
    )
  }

  if (query.rooms && property.rooms != null) {
    tick(
      property.rooms >= query.rooms,
      `Matches room requirement (${property.rooms})`,
      `Fewer rooms than requested (${property.rooms} vs ${query.rooms})`,
    )
  }

  if (query.nearMetro) {
    tick(
      Boolean(property.nearMetro),
      'Located within short walking distance to metro station',
      'Further from metro transport than ideal',
    )
  }

  if (query.district) {
    tick(
      Boolean(property.district && query.district === property.district),
      `Located in requested neighborhood (${query.district})`,
      property.district
        ? `Different neighborhood (${property.district} vs ${query.district})`
        : `Neighborhood not tagged (requested ${query.district})`,
    )
  }

  if (query.floorMin != null && property.floor != null) {
    tick(
      property.floor >= query.floorMin,
      `Above ground floor (floor ${property.floor})`,
      `Ground-floor listing (requested floor ≥ ${query.floorMin})`,
    )
  }

  for (const feat of query.features ?? []) {
    const tagged = property.features?.includes(feat) ?? false
    tick(
      tagged,
      `Has requested feature (${feat.replace(/^add\.f\./, '')})`,
      `Requested feature not tagged (${feat.replace(/^add\.f\./, '')})`,
    )
  }

  if (query.lifestyleGoal === 'quiet') {
    tick(
      Boolean(property.features?.includes('add.f.quiet')),
      'Tagged as quiet',
      'Quiet requested — not tagged on this listing',
    )
  }

  if (query.commute && property.lat != null && property.lng != null) {
    const radiusM =
      Math.min(
        40_000,
        query.commute.minutes *
          (query.commute.mode === 'walk' ? 80 : query.commute.mode === 'cycle' ? 250 : query.commute.mode === 'drive' ? 500 : 350),
      )
    const dist = haversineM({ lat: property.lat, lng: property.lng }, query.commute)
    tick(
      dist <= radiusM,
      `Inside estimated ${query.commute.minutes} min catchment of ${query.commute.place}`,
      `Outside estimated ${query.commute.minutes} min catchment of ${query.commute.place}`,
    )
  }

  const matchPercentage = criteria === 0 ? 100 : Math.round((matched / criteria) * 100)
  return { matchPercentage, matched, criteria, reasons, tradeoffs }
}

const COMMUTE_MODES: readonly NlCommuteMode[] = ['transit', 'walk', 'cycle', 'drive']

/** Rebuild intent from a /search URL so result cards can explain the match. */
export function nlFromSearchParams(sp: URLSearchParams): NlFilters {
  const deal = sp.get('deal')
  const type = sp.get('type')
  const life = sp.get('life')
  const cplace = sp.get('cplace')
  const cmin = Number(sp.get('cmin'))
  const cmodeRaw = sp.get('cmode')
  const cmode = COMMUTE_MODES.includes(cmodeRaw as NlCommuteMode) ? (cmodeRaw as NlCommuteMode) : 'transit'
  const west = Number(sp.get('west'))
  const south = Number(sp.get('south'))
  const east = Number(sp.get('east'))
  const north = Number(sp.get('north'))
  const feat = sp.get('feat')
  const f: NlFilters = {}
  if (deal === 'sale' || deal === 'rent' || deal === 'daily' || deal === 'pledge') f.dealType = deal
  if (type === 'apartment' || type === 'house' || type === 'villa' || type === 'commercial' || type === 'land' || type === 'hotel') {
    f.propertyType = type
  }
  if (sp.get('city')) f.city = sp.get('city')!
  if (sp.get('district')) f.district = sp.get('district')!
  const max = Number(sp.get('max'))
  const min = Number(sp.get('min'))
  if (Number.isFinite(max) && max > 0) f.maxPrice = max
  if (Number.isFinite(min) && min > 0) f.minPrice = min
  const rooms = Number(sp.get('rooms'))
  const beds = Number(sp.get('beds'))
  const fmin = Number(sp.get('fmin'))
  if (Number.isFinite(rooms) && rooms > 0) f.rooms = rooms
  if (Number.isFinite(beds) && beds > 0) f.bedrooms = beds
  if (Number.isFinite(fmin) && fmin > 0) f.floorMin = fmin
  if (feat) f.features = feat.split(',').filter(Boolean)
  if (sp.get('pets') === '1') f.pets = true
  if (sp.get('metro') === '1') f.nearMetro = true
  if (sp.get('bstat')) f.buildingStatus = sp.get('bstat')!
  if (sp.get('cond')) f.condition = sp.get('cond')!
  const cur = sp.get('cur')
  if (cur === 'EUR' || cur === 'GEL' || cur === 'USD') f.currency = cur
  if (life === 'family' || life === 'quiet' || life === 'central' || life === 'luxury') f.lifestyleGoal = life
  if (cplace && Number.isFinite(cmin) && cmin > 0 && Number.isFinite(west) && Number.isFinite(south) && Number.isFinite(east) && Number.isFinite(north)) {
    f.commute = {
      place: cplace,
      minutes: cmin,
      mode: cmode,
      lat: (south + north) / 2,
      lng: (west + east) / 2,
    }
  }
  return f
}
