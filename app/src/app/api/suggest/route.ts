import { CITIES, districtsOf } from "@/data/listings"
import { geoStreets, geoStreetsOf, type GeoStreet } from "@/data/georgia-locations"
import { TBILISI_QUARTERS } from "@/data/tbilisi-quarters"
import { districtKaForStreet, STREETS as TBILISI_STREETS } from "@/data/tbilisi-streets"
import { canonicalizeDistrict, districtSearchValues } from "@/lib/district-canon"
import { suggestMatch } from "@/lib/suggest-match"

/**
 * GET /api/suggest?q= — autocomplete for the search keyword box.
 * Matches cities, districts, streets and micro-quarters across ka/en/ru.
 * Static in-memory data, substring match; ranked: prefix first.
 * ponytail: no fuzzy matching — Meilisearch handles typos in search.
 */

export const maxDuration = 5
export const preferredRegion = "fra1"

interface Suggestion {
  kind: "city" | "district" | "street"
  /** Georgian label shown in the dropdown and used as the search term */
  ka: string
  /** Latin subtitle (en) for recognition */
  en?: string
  /** Parent city — search must scope to it on pick */
  city?: string
  /** Soft-fill ubani when street/quarter is catalog-pinned */
  district?: string
}

const DISTRICTS: { ka: string; city: string }[] = CITIES.flatMap((city) =>
  districtsOf(city).map((d) => ({ ka: d, city })),
)

const STREETS: GeoStreet[] = []
{
  const seen = new Set<string>()
  for (const s of [
    ...TBILISI_STREETS.map((s) => ({ ka: s.ka, en: s.en, city: "თბილისი" })),
    ...geoStreets(),
  ]) {
    const k = `${s.city}\0${s.ka}`
    if (seen.has(k)) continue
    seen.add(k)
    STREETS.push(s)
  }
}

// Static catalog — CDN cache; query string keys the variant.
const CACHE = { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" }

function browseStreets(city: string, districtCsv: string): Suggestion[] {
  const wanted = districtCsv ? new Set(districtSearchValues(districtCsv, city)) : null
  if (city === "თბილისი") {
    if (!wanted) return []
    const out: Suggestion[] = []
    const seen = new Set<string>()
    for (const s of TBILISI_STREETS) {
      if (!s.district) continue
      const ka = canonicalizeDistrict(s.district, "თბილისი")
      if (!wanted.has(ka)) continue
      if (seen.has(s.ka)) continue
      seen.add(s.ka)
      out.push({ kind: "street", ka: s.ka, en: s.en, city, district: ka })
    }
    out.sort((a, b) => a.ka.localeCompare(b.ka, "ka"))
    return out.slice(0, 80)
  }
  return geoStreetsOf(city)
    .slice()
    .sort((a, b) => a.localeCompare(b, "ka"))
    .slice(0, 80)
    .map((ka) => ({ kind: "street" as const, ka, city }))
}

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams
  const q = (sp.get("q") ?? "").trim().toLowerCase()
  const cityFilter = (sp.get("city") ?? "").trim() || undefined
  const districtFilter = (sp.get("district") ?? "").trim()

  if (q.length < 2) {
    if (sp.get("browse") === "1" && cityFilter) {
      return Response.json(
        { ok: true, suggestions: browseStreets(cityFilter, districtFilter) },
        { headers: CACHE },
      )
    }
    return Response.json({ ok: true, suggestions: [] }, { headers: CACHE })
  }

  const wanted = districtFilter
    ? new Set(districtSearchValues(districtFilter, cityFilter))
    : null

  const prefix: Suggestion[] = []
  const partial: Suggestion[] = []
  const push = (s: Suggestion, p: boolean) => (p ? prefix : partial).push(s)

  if (!cityFilter) {
    for (const city of CITIES) {
      const m = suggestMatch([city], q)
      if (m) push({ kind: "city", ka: city, city }, m.prefix)
    }
  }
  for (const d of DISTRICTS) {
    if (cityFilter && d.city !== cityFilter) continue
    const m = suggestMatch([d.ka], q)
    if (m) push({ kind: "district", ka: d.ka, city: d.city }, m.prefix)
  }
  // Quarters before streets — "მეორე კვარტალი" must beat random street substrings.
  for (const qtr of TBILISI_QUARTERS) {
    if (cityFilter && qtr.city !== cityFilter) continue
    if (wanted && qtr.district && !wanted.has(qtr.district)) continue
    const m = suggestMatch([qtr.ka, qtr.en, ...qtr.aliases], q)
    if (m) push({ kind: "street", ka: qtr.ka, en: qtr.en, city: qtr.city, district: qtr.district }, m.prefix)
  }
  for (const s of STREETS) {
    if (cityFilter && s.city !== cityFilter) continue
    const dist = districtKaForStreet(s.ka)
    if (wanted && dist && !wanted.has(dist)) continue
    const m = suggestMatch([s.ka, s.en, s.ru], q)
    if (m) {
      push({ kind: "street", ka: s.ka, en: s.en, city: s.city, district: dist }, m.prefix)
    }
  }

  const suggestions = [...prefix, ...partial].slice(0, 10)
  return Response.json({ ok: true, suggestions }, { headers: CACHE })
}
