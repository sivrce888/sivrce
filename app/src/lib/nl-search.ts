/**
 * Natural-language search → structured /search params.
 * ponytail: regex parse, no model. AI route may overlay when Gemini is up.
 */

import { canonicalizeDistrict } from '@/lib/district-canon'
import { geoDistrictsOf } from '@/data/georgia-locations'

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
  // DE market (sivrce.de) — ka + latin/di local names.
  ['ბერლინი', 'ბერლინი'],
  ['berlin', 'ბერლინი'],
  ['ჰამბურგი', 'ჰამბურგი'],
  ['hamburg', 'ჰამბურგი'],
  ['მიუნხენი', 'მიუნხენი'],
  ['munich', 'მიუნხენი'],
  ['münchen', 'მიუნხენი'],
  ['კელნი', 'კელნი'],
  ['cologne', 'კელნი'],
  ['köln', 'კელნი'],
  ['ფრანკფურტი', 'ფრანკფურტი'],
  ['frankfurt', 'ფრანკფურტი'],
  ['შტუტგარტი', 'შტუტგარტი'],
  ['stuttgart', 'შტუტგარტი'],
  ['დიუსელდორფი', 'დიუსელდორფი'],
  ['düsseldorf', 'დიუსელდორფი'],
  ['duesseldorf', 'დიუსელდორფი'],
  ['ლაიფციგი', 'ლაიფციგი'],
  ['leipzig', 'ლაიფციგი'],
  ['დორტმუნდი', 'დორტმუნდი'],
  ['dortmund', 'დორტმუნდი'],
  ['ესენი', 'ესენი'],
  ['essen', 'ესენი'],
  ['ბრემენი', 'ბრემენი'],
  ['bremen', 'ბრემენი'],
  ['დრეზდენი', 'დრეზდენი'],
  ['dresden', 'დრეზდენი'],
  ['ჰანოვერი', 'ჰანოვერი'],
  ['hanover', 'ჰანოვერი'],
  ['hannover', 'ჰანოვერი'],
  ['ნიურნბერგი', 'ნიურნბერგი'],
  ['nuremberg', 'ნიურნბერგი'],
  ['nürnberg', 'ნიურნბერგი'],
  ['დუისბურგი', 'დუისბურგი'],
  ['duisburg', 'დუისბურგი'],
  ['ბოხუმი', 'ბოხუმი'],
  ['bochum', 'ბოხუმი'],
]

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

  if (/იყიდება|შეძენა|გაყიდვა|\bbuy\b|\bsale\b|\bsell\b|kauf|verkauf/i.test(q)) out.dealType = 'sale'
  else if (/დღიურად|\bdaily\b|\bovernight\b|tagesmiete|ferienwohnung(en)?|übernacht/i.test(q)) out.dealType = 'daily'
  else if (/გირავდ|გირავნ|\bpledge\b|\bcollateral\b|\bзалог/i.test(q)) out.dealType = 'pledge'
  else if (/გაიცემა\s*იჯარ|იჯარით|\bijara\b/i.test(q)) out.dealType = 'rent'
  else if (/ქირავდება|გაქირავება|\brent\b|\blease\b|ქირა|miet|pacht/i.test(q)) out.dealType = 'rent'

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

  const under = q.match(/(?:under|below|unter|bis\s*zu|ქვემოთ|მდე|up to)\s*[$₾€]?\s*([\d.,]+)\s*([kKmM])?/i)
  const kPrice = q.match(/\$\s*([\d.,]+)\s*([kKmM])/)
  const eurPrice = q.match(/€\s*([\d.,]+)\s*([kKmM])?/)
  const eurTrailing = q.match(/([\d.,]+)\s*€/)
  const gelPrice = q.match(/₾\s*([\d.,]+)\s*([kKmM])?/)
  const bareK = q.match(/\b(\d+(?:[.,]\d+)?)\s*([kK])\b/)
  const moneySrc = under ?? eurPrice ?? gelPrice ?? kPrice ?? eurTrailing ?? (under ? null : bareK)
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
  if (/pet[- ]?friendly|ცხოველ|pets?\s+allow|haustier/i.test(q)) out.pets = true

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
  if (f.bedrooms) patch.beds = String(f.bedrooms)
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
