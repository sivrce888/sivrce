import { CITIES, districtsOf } from "@/data/listings"
import { geoStreets } from "@/data/georgia-locations"
import { TBILISI_QUARTERS } from "@/data/tbilisi-quarters"
import { districtKaForStreet } from "@/data/tbilisi-streets"
import { suggestMatch } from "@/lib/suggest-match"

/**
 * GET /api/suggest?q= — autocomplete for the search keyword box.
 * Matches cities, districts, streets and micro-quarters across ka/en/ru.
 * Static in-memory data, substring match; ranked: prefix first.
 * ponytail: no fuzzy matching — Meilisearch handles typos in search.
 */

interface Suggestion {
  kind: "city" | "district" | "street"
  /** Georgian label shown in the dropdown and used as the search term */
  ka: string
  /** Latin subtitle (en) for recognition */
  en?: string
  /** Soft-fill ubani when street/quarter is catalog-pinned */
  district?: string
}

const DISTRICTS: { ka: string; city: string }[] = CITIES.flatMap((city) =>
  districtsOf(city).map((d) => ({ ka: d, city })),
)

const STREETS = geoStreets()

// Static catalog — CDN cache; query string keys the variant.
const CACHE = { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" }

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams
  const q = (sp.get("q") ?? "").trim().toLowerCase()
  if (q.length < 2) return Response.json({ ok: true, suggestions: [] }, { headers: CACHE })
  // ponytail: optional city scopes streets + districts to that city
  const cityFilter = (sp.get("city") ?? "").trim() || undefined

  const prefix: Suggestion[] = []
  const partial: Suggestion[] = []
  const push = (s: Suggestion, p: boolean) => (p ? prefix : partial).push(s)

  if (!cityFilter) {
    for (const city of CITIES) {
      const m = suggestMatch([city], q)
      if (m) push({ kind: "city", ka: city }, m.prefix)
    }
  }
  for (const d of DISTRICTS) {
    if (cityFilter && d.city !== cityFilter) continue
    const m = suggestMatch([d.ka], q)
    if (m) push({ kind: "district", ka: d.ka }, m.prefix)
  }
  // Quarters before streets — "მეორე კვარტალი" must beat random street substrings.
  for (const qtr of TBILISI_QUARTERS) {
    if (cityFilter && qtr.city !== cityFilter) continue
    const m = suggestMatch([qtr.ka, qtr.en, ...qtr.aliases], q)
    if (m) push({ kind: "street", ka: qtr.ka, en: qtr.en, district: qtr.district }, m.prefix)
  }
  for (const s of STREETS) {
    if (cityFilter && s.city !== cityFilter) continue
    const m = suggestMatch([s.ka, s.en, s.ru], q)
    if (m) {
      push(
        { kind: "street", ka: s.ka, en: s.en, district: districtKaForStreet(s.ka) },
        m.prefix,
      )
    }
  }

  const suggestions = [...prefix, ...partial].slice(0, 10)
  return Response.json({ ok: true, suggestions }, { headers: CACHE })
}
