import { CITIES, districtsOf } from "@/data/listings"
import { geoStreets, geoStreetsOf } from "@/data/georgia-streets"
import { villagesOf, allVillages } from "@/data/georgia-villages"
import { TBILISI_QUARTERS } from "@/data/tbilisi-quarters"
import { STREETS as TBILISI_STREETS } from "@/data/tbilisi-streets"
import { BERLIN_ORTSTEILE } from "@/data/berlin-ortsteile"
import { BERLIN_STREETS } from "@/data/berlin-streets"
import { BERLIN_BEZIRKE, DE_CITIES } from "@/lib/countries/de"
import { MAP_CITIES } from "@/lib/map/user-place"
import { COUNTRY_IDS, MARKETS } from "@/lib/markets"
import { canonicalizeDistrict, districtSearchValues } from "@/lib/district-canon"
import { compileHay, matchCompiled, suggestFuzzy, type CompiledHay } from "@/lib/suggest-match"

/**
 * GET /api/suggest?q= — autocomplete for the search keyword box.
 * Matches cities, districts, streets and micro-quarters across ka/en/ru.
 * Static in-memory data, substring match; ranked: prefix first.
 * Matching is cross-script: ka↔latin skeleton fold + genitive stems in
 * suggest-match — "beliashvilis"/"kutaisi" hit Georgian-only catalog rows.
 * Catalog haystacks and the street→ubani join are precomputed once at module
 * init — per-keystroke regex folding over ~11k rows blew the function budget.
 */

export const maxDuration = 5

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

/** Catalog row with precompiled haystacks; payload doubles as a Suggestion. */
type Row = Suggestion & { hay: CompiledHay; raw: (string | undefined)[] }

const DISTRICTS: { ka: string; city: string }[] = CITIES.flatMap((city) =>
  districtsOf(city).map((d) => ({ ka: d, city })),
)

/** Official/alt names that resolve to the canonical city (canonical = TNET/SS/inventory name). */
export const CITY_ALIASES: Record<string, string[]> = { "ყაზბეგი": ["სტეფანწმინდა"] }

/** Villages by municipality — picked as district of the muni (search model: city → district). */
const VILLAGES = allVillages()

const mk = (r: Omit<Row, "hay" | "raw">, raw: (string | undefined)[]): Row => ({
  ...r,
  hay: compileHay(raw),
  raw,
})

const CITY_ROWS: Row[] = CITIES.map((ka) =>
  mk({ kind: "city", ka, city: ka }, [ka, ...(CITY_ALIASES[ka] ?? [])]),
)
/* ————— World rows (map fly-to + global suggest) —————
 * ponytail: cities + launched countries only. Capitals/metros from MAP_CITIES
 * (~200+). Neighbourhoods/streets/addresses stay live via /api/geocode. */
const COUNTRY_NAMES: Record<string, string> = {
  de: "Germany", ae: "United Arab Emirates", fr: "France", es: "Spain",
  it: "Italy", gb: "United Kingdom", us: "United States", ca: "Canada", tr: "Türkiye",
  gr: "Greece", cy: "Cyprus", nl: "Netherlands", pt: "Portugal", ch: "Switzerland",
}
const WORLD_CITY_ROWS: Row[] = MAP_CITIES.filter((c) => c.cc !== "GE").map((c) =>
  mk({ kind: "city", ka: c.ka, en: c.en, city: c.ka }, [c.ka, c.en, c.slug]),
)
const COUNTRY_ROWS: Row[] = COUNTRY_IDS.map((id) =>
  mk(
    { kind: "city", ka: COUNTRY_NAMES[id] ?? id.toUpperCase(), en: `/${id}`, city: MARKETS[id].defaultCitySlug },
    [COUNTRY_NAMES[id] ?? id, id],
  ),
)
const DISTRICT_ROWS: Row[] = DISTRICTS.map((d) => mk({ kind: "district", ka: d.ka, city: d.city }, [d.ka]))
const VILLAGE_ROWS: Row[] = VILLAGES.map((v) => mk({ kind: "district", ka: v.ka, city: v.muni }, [v.ka]))
const QUARTER_ROWS: Row[] = TBILISI_QUARTERS.map((q) =>
  mk({ kind: "street", ka: q.ka, en: q.en, city: q.city, district: q.district }, [q.ka, q.en, ...q.aliases]),
)

const STREET_ROWS: Row[] = []
{
  const seen = new Set<string>()
  // OSM join already pins each Tbilisi street's ubani — canonicalize once here,
  // never per request (districtKaForStreet's fuzzy scan is for free-text addresses).
  const source: Omit<Row, "hay" | "raw">[] = [
    ...TBILISI_STREETS.map((s) => ({
      kind: "street" as const,
      ka: s.ka,
      en: s.en,
      city: "თბილისი",
      district: s.district ? canonicalizeDistrict(s.district, "თბილისი") || undefined : undefined,
    })),
    ...geoStreets().map((s) => ({
      kind: "street" as const,
      ka: s.ka,
      en: s.en,
      city: s.city,
      district: undefined,
    })),
  ]
  for (const s of source) {
    const k = `${s.city}\0${s.ka}`
    if (seen.has(k)) continue
    seen.add(k)
    STREET_ROWS.push(mk(s, [s.ka, s.en]))
  }
}

// Static catalog — CDN cache; query string keys the variant.
const CACHE = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
  "Vercel-CDN-Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
}

/* ————— DE market rows (mkt=de) —————
 * Label slot is `ka` (display field) but carries the German name — the
 * Suggestion shape is market-agnostic. `en` holds the parent Bezirk. */
const BERLIN = "Berlin"

const DE_CITY_ROWS: Row[] = DE_CITIES.map((c) =>
  mk({ kind: "city", ka: c.de, en: c.de === "München" ? "Munich" : undefined, city: c.de }, [c.de, c.slug]),
)

const DE_ORTSTEIL_ROWS: Row[] = BERLIN_ORTSTEILE.map((o) => {
  const bezirkDe = BERLIN_BEZIRKE.find((b) => b.slug === o.bezirk)?.de
  return mk({ kind: "district", ka: o.de, en: bezirkDe, city: BERLIN }, [o.de])
})
const DE_STREET_ROWS: Row[] = BERLIN_STREETS.map((s) => mk({ kind: "street", ka: s, city: BERLIN }, [s]))

function deSuggest(q: string, cityFilter?: string): Suggestion[] {
  const ql = q.toLowerCase()
  const prefix: Row[] = []
  const partial: Row[] = []
  const pools: Row[][] = cityFilter
    ? cityFilter === BERLIN
      ? [DE_ORTSTEIL_ROWS, DE_STREET_ROWS]
      : []
    : [DE_CITY_ROWS, DE_ORTSTEIL_ROWS, DE_STREET_ROWS]
  for (const pool of pools) {
    for (const r of pool) {
      const hay = r.raw.find((h) => h && h.toLowerCase().includes(ql))
      if (hay) (hay.toLowerCase().startsWith(ql) ? prefix : partial).push(r)
    }
  }
  const out = (r: Row): Suggestion => ({ kind: r.kind, ka: r.ka, en: r.en, city: r.city, district: r.district })
  return [...prefix, ...partial].slice(0, 10).map(out)
}

function browseStreets(city: string, districtCsv: string): Suggestion[] {
  const wanted = districtCsv ? new Set(districtSearchValues(districtCsv, city)) : null
  if (city === "თბილისი") {
    if (!wanted) return []
    return STREET_ROWS.filter((s) => s.district && wanted.has(s.district))
      .sort((a, b) => a.ka.localeCompare(b.ka, "ka"))
      .slice(0, 80)
  }
  return geoStreetsOf(city)
    .slice()
    .sort((a, b) => a.localeCompare(b, "ka"))
    .slice(0, 80)
    .map((ka) => ({ kind: "street" as const, ka, city }))
}

function browseVillages(city: string): Suggestion[] {
  return villagesOf(city)
    .slice()
    .sort((a, b) => a.localeCompare(b, "ka"))
    .map((ka) => ({ kind: "district" as const, ka, city }))
}

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams
  const q = (sp.get("q") ?? "").trim().toLowerCase()
  const cityFilter = (sp.get("city") ?? "").trim() || undefined
  const districtFilter = (sp.get("district") ?? "").trim()

  // DE market — German names, separate pools; never mixed with the GE catalog.
  if (sp.get("mkt") === "de") {
    if (q.length < 2) {
      if (sp.get("browse") === "1" && cityFilter === BERLIN) {
        const out = (s: string): Suggestion => ({ kind: "street", ka: s, city: BERLIN })
        return Response.json(
          { ok: true, suggestions: BERLIN_STREETS.slice(0, 80).map(out) },
          { headers: CACHE },
        )
      }
      return Response.json({ ok: true, suggestions: [] }, { headers: CACHE })
    }
    return Response.json({ ok: true, suggestions: deSuggest(q, cityFilter) }, { headers: CACHE })
  }

  if (q.length < 2) {
    if (sp.get("browse") === "1" && cityFilter) {
      return Response.json(
        { ok: true, suggestions: [...browseStreets(cityFilter, districtFilter), ...browseVillages(cityFilter)] },
        { headers: CACHE },
      )
    }
    return Response.json({ ok: true, suggestions: [] }, { headers: CACHE })
  }

  const wanted = districtFilter
    ? new Set(districtSearchValues(districtFilter, cityFilter))
    : null

  const prefix: Row[] = []
  const partial: Row[] = []
  const push = (r: Row, p: boolean) => (p ? prefix : partial).push(r)

  if (!cityFilter) {
    for (const r of CITY_ROWS) {
      const m = matchCompiled(r.hay, q)
      if (m) push(r, m.prefix)
    }
    // World cities + countries — global map fly-to; no DE-district leak (cities only).
    for (const r of WORLD_CITY_ROWS) {
      const m = matchCompiled(r.hay, q)
      if (m) push(r, m.prefix)
    }
    for (const r of COUNTRY_ROWS) {
      const m = matchCompiled(r.hay, q)
      if (m) push(r, m.prefix)
    }
  }
  for (const r of DISTRICT_ROWS) {
    if (cityFilter && r.city !== cityFilter) continue
    const m = matchCompiled(r.hay, q)
    if (m) push(r, m.prefix)
  }
  for (const r of VILLAGE_ROWS) {
    if (cityFilter && r.city !== cityFilter) continue
    const m = matchCompiled(r.hay, q)
    if (m) push(r, m.prefix)
  }
  // Quarters before streets — "მეორე კვარტალი" must beat random street substrings.
  for (const r of QUARTER_ROWS) {
    if (cityFilter && r.city !== cityFilter) continue
    if (wanted && r.district && !wanted.has(r.district)) continue
    const m = matchCompiled(r.hay, q)
    if (m) push(r, m.prefix)
  }
  for (const r of STREET_ROWS) {
    if (cityFilter && r.city !== cityFilter) continue
    if (wanted && r.district && !wanted.has(r.district)) continue
    const m = matchCompiled(r.hay, q)
    if (m) push(r, m.prefix)
  }

  // Typo rescue — nothing matched, one char is off: fuzzy streets/quarters so the
  // dropdown never dead-ends (runs only here, ≤1 edit in suggestFuzzy).
  if (prefix.length === 0 && partial.length === 0 && q.length >= 4) {
    for (const r of QUARTER_ROWS) {
      if (cityFilter && r.city !== cityFilter) continue
      if (wanted && r.district && !wanted.has(r.district)) continue
      if (suggestFuzzy(r.raw, q)) push(r, false)
    }
    for (const r of STREET_ROWS) {
      if (cityFilter && r.city !== cityFilter) continue
      if (wanted && r.district && !wanted.has(r.district)) continue
      if (suggestFuzzy(r.raw, q)) push(r, false)
    }
    for (const r of VILLAGE_ROWS) {
      if (cityFilter && r.city !== cityFilter) continue
      if (suggestFuzzy(r.raw, q)) push(r, false)
    }
  }

  const out = (r: Row): Suggestion => ({ kind: r.kind, ka: r.ka, en: r.en, city: r.city, district: r.district })
  return Response.json({ ok: true, suggestions: [...prefix, ...partial].slice(0, 10).map(out) }, { headers: CACHE })
}
