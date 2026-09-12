import { CITIES, districtsOf } from "@/data/listings"
import { geoStreets, geoStreetsOf } from "@/data/georgia-streets"
import { villagesOf, allVillages } from "@/data/georgia-villages"
import { TBILISI_QUARTERS } from "@/data/tbilisi-quarters"
import { STREETS as TBILISI_STREETS } from "@/data/tbilisi-streets"
import { BERLIN_ORTSTEILE } from "@/data/berlin-ortsteile"
import { BERLIN_STREETS } from "@/data/berlin-streets"
import { BERLIN_BEZIRKE, DE_CITIES } from "@/lib/countries/de"
import { MAP_CITIES_ALL as MAP_CITIES } from "@/lib/map/user-place.server"
import { COUNTRY_IDS, MARKETS } from "@/lib/markets"
import { canonicalizeDistrict, districtSearchValues } from "@/lib/district-canon"
import {
  compileHay,
  compileQuery,
  matchPrepared,
  suggestFuzzyPrepared,
  type CompiledHay,
} from "@/lib/suggest-match"
import { DEVELOPERS, PROJECTS, getDeveloper } from "@/data/professionals"
import { BUILDINGS } from "@/data/buildings"
import { NEIGHBORHOODS } from "@/data/neighborhoods"
import { COUNTRIES as WORLD_COUNTRIES } from "@/data/world-countries"
import POIS from "@/data/georgia-pois.json"
import { METRO_STATIONS } from "@/data/tbilisi-metro"
import { WORLD_METROS } from "@/data/world-metros"

/**
 * GET /api/suggest?q= — autocomplete for the search keyword box.
 * Matches cities, developers, projects, buildings, districts, countries, streets,
 * micro-quarters, POIs (gyms/schools/shops/…) and metro stations across ka/en/ru.
 * Static in-memory data, substring match; ranked: prefix first.
 * Matching is cross-script: ka↔latin skeleton fold + genitive stems in
 * suggest-match — "beliashvilis"/"kutaisi" hit Georgian-only catalog rows.
 * Catalog haystacks and entity joins are precomputed once at module init.
 */

export const maxDuration = 5

export interface Suggestion {
  kind: "city" | "district" | "street" | "developer" | "project" | "building" | "country" | "poi" | "metro"
  /** Georgian label shown in the dropdown and used as the search term */
  ka: string
  /** Latin subtitle (en) for recognition */
  en?: string
  /** Parent city — search must scope to it on pick */
  city?: string
  /** Soft-fill ubani when street/quarter is catalog-pinned */
  district?: string
  /** Entity slug for direct navigation */
  slug?: string
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

const DEVELOPER_ROWS: Row[] = []
{
  const seen = new Set<string>()
  for (const d of DEVELOPERS) {
    if (!d.slug || seen.has(d.slug)) continue
    seen.add(d.slug)
    const ka = d.name.ka || d.name.en || d.slug
    const en = d.name.en || d.name.ka
    DEVELOPER_ROWS.push(
      mk(
        { kind: "developer", ka, en, city: d.city, slug: d.slug },
        [d.name.ka, d.name.en, d.slug, d.city]
      )
    )
  }
}

const PROJECT_ROWS: Row[] = []
{
  const seen = new Set<string>()
  for (const p of PROJECTS) {
    if (!p.slug || seen.has(p.slug)) continue
    seen.add(p.slug)
    const dev = p.developerSlug ? getDeveloper(p.developerSlug) : undefined
    const devName = dev ? (dev.name.ka || dev.name.en) : undefined
    PROJECT_ROWS.push(
      mk(
        {
          kind: "project",
          ka: p.name,
          en: devName ? `${devName} · ${p.city}` : p.city,
          city: p.city,
          district: p.district,
          slug: p.slug,
        },
        [p.name, p.slug, p.city, p.district, devName]
      )
    )
  }
}

const BUILDING_ROWS: Row[] = []
{
  const seen = new Set<string>()
  for (const b of BUILDINGS) {
    if (!b.slug || seen.has(b.slug)) continue
    seen.add(b.slug)
    BUILDING_ROWS.push(
      mk(
        {
          kind: "building",
          ka: b.name,
          en: b.nameEn || b.address,
          city: b.city,
          district: b.district,
          slug: b.slug,
        },
        [b.name, b.nameEn, b.address, b.code, b.slug]
      )
    )
  }
}

const NEIGHBORHOOD_ROWS: Row[] = []
{
  const seen = new Set<string>()
  for (const n of NEIGHBORHOODS) {
    if (!n.slug || seen.has(n.slug)) continue
    seen.add(n.slug)
    NEIGHBORHOOD_ROWS.push(
      mk(
        {
          kind: "district",
          ka: n.name.ka,
          en: n.name.en,
          city: n.cityKey || n.city.ka,
          slug: n.slug,
        },
        [n.name.ka, n.name.en, n.cityKey, n.city.ka]
      )
    )
  }
}

const WORLD_COUNTRY_ROWS: Row[] = []
{
  const seen = new Set<string>()
  for (const c of WORLD_COUNTRIES) {
    if (!c.cc || seen.has(c.cc)) continue
    seen.add(c.cc)
    WORLD_COUNTRY_ROWS.push(
      mk(
        {
          kind: "country",
          ka: c.ka,
          en: c.en,
          city: c.capital,
          slug: c.cc.toLowerCase(),
        },
        [c.ka, c.en, c.capital, c.cc]
      )
    )
  }
}

/* ————— World rows (map fly-to + global suggest) ————— */
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
    { kind: "country", ka: COUNTRY_NAMES[id] ?? id.toUpperCase(), en: `/${id}`, city: MARKETS[id].defaultCitySlug, slug: id },
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

// ponytail: POI/metro pools — names only, no coords; map pages own pins.
const POI_CITY_KA: Record<string, string> = { tbilisi: "თბილისი", batumi: "ბათუმი", kutaisi: "ქუთაისი" }
const POI_ROWS: Row[] = []
{
  const seen = new Set<string>()
  for (const p of POIS.pois) {
    const city = POI_CITY_KA[p.city]
    if (!city || !p.name || seen.has(`${city}\0${p.name}`)) continue
    seen.add(`${city}\0${p.name}`)
    POI_ROWS.push(mk({ kind: "poi", ka: p.name, city }, [p.name]))
  }
}
const WORLD_CITY_KA: Record<string, string> = Object.fromEntries(MAP_CITIES.map((c) => [c.slug, c.ka]))
const METRO_ROWS: Row[] = [
  ...METRO_STATIONS.map((s) =>
    mk({ kind: "metro", ka: s.ka, en: s.en, city: "თბილისი", slug: s.slug }, [s.ka, s.en, s.near])
  ),
  ...WORLD_METROS.flatMap((sys) =>
    sys.stations.map((s) =>
      mk({ kind: "metro", ka: s.nameKa || s.name, en: s.name, city: WORLD_CITY_KA[sys.citySlug] }, [s.name, s.nameKa])
    )
  ),
]

// Static catalog — CDN cache; query string keys the variant.
const CACHE = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
  "Vercel-CDN-Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
}

/* ————— DE market rows (mkt=de) ————— */
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
  const out = (r: Row): Suggestion => ({ kind: r.kind, ka: r.ka, en: r.en, city: r.city, district: r.district, slug: r.slug })
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

  // Query folds are loop-invariant — compile once per request, not once per row.
  const cq = compileQuery(q)

  const prefix: Row[] = []
  const partial: Row[] = []
  const push = (r: Row, p: boolean) => (p ? prefix : partial).push(r)

  if (!cityFilter) {
    for (const r of CITY_ROWS) {
      const m = matchPrepared(r.hay, cq)
      if (m) push(r, m.prefix)
    }
    for (const r of DEVELOPER_ROWS) {
      const m = matchPrepared(r.hay, cq)
      if (m) push(r, m.prefix)
    }
    for (const r of PROJECT_ROWS) {
      const m = matchPrepared(r.hay, cq)
      if (m) push(r, m.prefix)
    }
    for (const r of BUILDING_ROWS) {
      const m = matchPrepared(r.hay, cq)
      if (m) push(r, m.prefix)
    }
    for (const r of WORLD_CITY_ROWS) {
      const m = matchPrepared(r.hay, cq)
      if (m) push(r, m.prefix)
    }
    for (const r of COUNTRY_ROWS) {
      const m = matchPrepared(r.hay, cq)
      if (m) push(r, m.prefix)
    }
    for (const r of WORLD_COUNTRY_ROWS) {
      const m = matchPrepared(r.hay, cq)
      if (m) push(r, m.prefix)
    }
  } else {
    for (const r of DEVELOPER_ROWS) {
      if (r.city && r.city !== cityFilter) continue
      const m = matchPrepared(r.hay, cq)
      if (m) push(r, m.prefix)
    }
    for (const r of PROJECT_ROWS) {
      if (r.city && r.city !== cityFilter) continue
      const m = matchPrepared(r.hay, cq)
      if (m) push(r, m.prefix)
    }
    for (const r of BUILDING_ROWS) {
      if (r.city && r.city !== cityFilter) continue
      const m = matchPrepared(r.hay, cq)
      if (m) push(r, m.prefix)
    }
  }

  // Metro = navigable entity (station page) — ranks with buildings, above keywords.
  for (const r of METRO_ROWS) {
    if (cityFilter && r.city && r.city !== cityFilter) continue
    const m = matchPrepared(r.hay, cq)
    if (m) push(r, m.prefix)
  }
  for (const r of DISTRICT_ROWS) {
    if (cityFilter && r.city !== cityFilter) continue
    const m = matchPrepared(r.hay, cq)
    if (m) push(r, m.prefix)
  }
  for (const r of NEIGHBORHOOD_ROWS) {
    if (cityFilter && r.city !== cityFilter) continue
    const m = matchPrepared(r.hay, cq)
    if (m) push(r, m.prefix)
  }
  for (const r of VILLAGE_ROWS) {
    if (cityFilter && r.city !== cityFilter) continue
    const m = matchPrepared(r.hay, cq)
    if (m) push(r, m.prefix)
  }
  for (const r of QUARTER_ROWS) {
    if (cityFilter && r.city !== cityFilter) continue
    if (wanted && r.district && !wanted.has(r.district)) continue
    const m = matchPrepared(r.hay, cq)
    if (m) push(r, m.prefix)
  }
  for (const r of STREET_ROWS) {
    if (cityFilter && r.city !== cityFilter) continue
    if (wanted && r.district && !wanted.has(r.district)) continue
    const m = matchPrepared(r.hay, cq)
    if (m) push(r, m.prefix)
  }
  for (const r of POI_ROWS) {
    if (cityFilter && r.city !== cityFilter) continue
    const m = matchPrepared(r.hay, cq)
    if (m) push(r, m.prefix)
  }

  // Typo rescue — nothing matched, one char is off: fuzzy rescue for entities.
  if (prefix.length === 0 && partial.length === 0 && q.length >= 4) {
    for (const r of DEVELOPER_ROWS) {
      if (suggestFuzzyPrepared(r.raw, cq)) push(r, false)
    }
    for (const r of PROJECT_ROWS) {
      if (suggestFuzzyPrepared(r.raw, cq)) push(r, false)
    }
    for (const r of BUILDING_ROWS) {
      if (suggestFuzzyPrepared(r.raw, cq)) push(r, false)
    }
    for (const r of QUARTER_ROWS) {
      if (cityFilter && r.city !== cityFilter) continue
      if (wanted && r.district && !wanted.has(r.district)) continue
      if (suggestFuzzyPrepared(r.raw, cq)) push(r, false)
    }
    for (const r of STREET_ROWS) {
      if (cityFilter && r.city !== cityFilter) continue
      if (wanted && r.district && !wanted.has(r.district)) continue
      if (suggestFuzzyPrepared(r.raw, cq)) push(r, false)
    }
    for (const r of VILLAGE_ROWS) {
      if (cityFilter && r.city !== cityFilter) continue
      if (suggestFuzzyPrepared(r.raw, cq)) push(r, false)
    }
  }

  const out = (r: Row): Suggestion => ({
    kind: r.kind,
    ka: r.ka,
    en: r.en,
    city: r.city,
    district: r.district,
    slug: r.slug,
  })
  return Response.json({ ok: true, suggestions: [...prefix, ...partial].slice(0, 10).map(out) }, { headers: CACHE })
}
