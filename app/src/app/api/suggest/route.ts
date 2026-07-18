import { CITIES, districtsOf } from "@/data/listings"
import { geoStreets } from "@/data/georgia-locations"

/**
 * GET /api/suggest?q= — autocomplete for the search keyword box.
 * Matches cities, districts and streets across ka/en/ru.
 * Static in-memory data, substring match; ranked: prefix first.
 * ponytail: no fuzzy matching — Meilisearch handles typos in search.
 */

export const dynamic = "force-dynamic"

interface Suggestion {
  kind: "city" | "district" | "street"
  /** Georgian label shown in the dropdown and used as the search term */
  ka: string
  /** Latin subtitle (en) for recognition */
  en?: string
}

const DISTRICTS: { ka: string; city: string }[] = CITIES.flatMap((city) =>
  districtsOf(city).map((d) => ({ ka: d, city })),
)

const STREETS = geoStreets()

const norm = (s: string) => s.toLowerCase()

function matches(hay: (string | undefined)[], q: string): { prefix: boolean } | null {
  for (const h of hay) {
    if (!h) continue
    const n = norm(h)
    if (n.startsWith(q)) return { prefix: true }
  }
  for (const h of hay) {
    if (!h) continue
    if (norm(h).includes(q)) return { prefix: false }
  }
  return null
}

export async function GET(req: Request) {
  const q = norm((new URL(req.url).searchParams.get("q") ?? "").trim())
  if (q.length < 2) return Response.json({ ok: true, suggestions: [] })

  const prefix: Suggestion[] = []
  const partial: Suggestion[] = []
  const push = (s: Suggestion, p: boolean) => (p ? prefix : partial).push(s)

  for (const city of CITIES) {
    const m = matches([city], q)
    if (m) push({ kind: "city", ka: city }, m.prefix)
  }
  for (const d of DISTRICTS) {
    const m = matches([d.ka], q)
    if (m) push({ kind: "district", ka: d.ka }, m.prefix)
  }
  for (const s of STREETS) {
    const m = matches([s.ka, s.en, s.ru], q)
    if (m) push({ kind: "street", ka: s.ka, en: s.en }, m.prefix)
  }

  const suggestions = [...prefix, ...partial].slice(0, 8)
  return Response.json({ ok: true, suggestions })
}
