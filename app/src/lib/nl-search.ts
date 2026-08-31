/**
 * Natural-language search → structured /search params.
 * ponytail: regex parse, no model. AI route may overlay when Gemini is up.
 */

import { canonicalizeDistrict } from '@/lib/district-canon'
import { geoDistrictsOf } from '@/data/georgia-locations'

export type NlFilters = {
  dealType?: 'sale' | 'rent' | 'daily'
  propertyType?: 'apartment' | 'house' | 'commercial' | 'land'
  city?: string
  district?: string
  minPrice?: number
  maxPrice?: number
  rooms?: number
  minArea?: number
  maxArea?: number
  features?: string[]
  pets?: boolean
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
]

const CITY_OF = new Map<string, string>()
for (const city of ['თბილისი', 'ბათუმი', 'ქუთაისი', 'რუსთავი']) {
  for (const d of geoDistrictsOf(city)) CITY_OF.set(d, city)
}

const FEATURE_RX: [RegExp, string][] = [
  [/parking|პარკინგ|ავტოსადგომ|garage|გარაჟ/i, 'add.f.parking'],
  [/bright|ნათელ|ბუნებრივი სინათლ/i, 'add.f.bright'],
  [/elevator|lift|ლიფტ/i, 'add.f.elevator'],
  [/balcony|აივან/i, 'add.f.balcony'],
  [/furnish|ავეჯ/i, 'add.f.furniture'],
]

function parseMoney(raw: string): number | undefined {
  const s = raw.replace(/[$,₾\s]/g, '').replace(/,/g, '')
  if (!s) return undefined
  const m = s.match(/^(\d+(?:\.\d+)?)([kKmM])?$/)
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
  const lower = q.toLowerCase()
  for (const [key, city] of CITIES) {
    if (lower.includes(key.toLowerCase()) || q.includes(key)) return city
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

  if (/იყიდება|შეძენა|გაყიდვა|\bbuy\b|\bsale\b|\bsell\b/i.test(q)) out.dealType = 'sale'
  else if (/დღიურად|\bdaily\b|\bovernight\b/i.test(q)) out.dealType = 'daily'
  else if (/ქირავდება|გაქირავება|\brent\b|\blease\b|ქირა/i.test(q)) out.dealType = 'rent'

  if (/ბინა|\bapartment\b|\bflat\b|\bstudio\b/i.test(q)) out.propertyType = 'apartment'
  else if (/სახლი|\bhouse\b|\bvilla\b|ვილა|\bcottage\b/i.test(q)) out.propertyType = 'house'
  else if (/კომერც|\bcommercial\b|\bshop\b|მაღაზია|\boffice\b|ოფისი/i.test(q)) out.propertyType = 'commercial'
  else if (/მიწა|\bland\b|\bplot\b|ნაკვეთი/i.test(q)) out.propertyType = 'land'

  const roomMatch = q.match(/(\d+)\s*[-]?\s*(ოთახიანი|ოთახი|\brooms?\b|\bbedrooms?\b|\bbeds?\b)/i)
  if (roomMatch) out.rooms = Number(roomMatch[1])

  const under = q.match(/(?:under|below|ქვემოთ|მდე|up to)\s*\$?\s*₾?\s*([\d.,]+)\s*([kKmM])?/i)
  const kPrice = q.match(/\$\s*([\d.,]+)\s*([kKmM])/)
  const gelPrice = q.match(/₾\s*([\d.,]+)\s*([kKmM])?/)
  const bareK = q.match(/\b(\d+(?:[.,]\d+)?)\s*([kK])\b/)
  const moneySrc = under ?? gelPrice ?? kPrice ?? (under ? null : bareK)
  if (moneySrc) {
    const n = parseMoney(`${moneySrc[1]}${moneySrc[2] ?? ''}`)
    if (n) out.maxPrice = n
  }

  const city = findCity(q)
  const district = findDistrict(raw)
  if (city) out.city = city
  if (district) {
    out.district = district
    if (!out.city) out.city = CITY_OF.get(district)
  }

  const features: string[] = []
  for (const [rx, key] of FEATURE_RX) {
    if (rx.test(q)) features.push(key)
  }
  if (features.length) out.features = features
  if (/pet[- ]?friendly|ცხოველ|pets?\s+allow/i.test(q)) out.pets = true

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
      f.minArea ||
      f.maxArea ||
      f.pets ||
      f.features?.length,
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
  if (f.minArea) patch.amin = String(f.minArea)
  if (f.maxArea) patch.amax = String(f.maxArea)
  if (f.features?.length) patch.feat = f.features.join(',')
  if (f.pets) patch.pets = '1'
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
