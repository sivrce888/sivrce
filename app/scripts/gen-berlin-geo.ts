/**
 * One-shot generator for Berlin geo catalogs from OSM (Overpass):
 *   src/data/berlin-ortsteile.ts   — 97 OSM Ortsteil boundaries w/ Bezirk slug + center
 *   src/data/berlin-streets.ts     — deduped street names (autocomplete catalog)
 *   Bezirk polygons skipped: OSM admin_level=9 outers are split ways, not rings.
 *
 * Run: npm run gen:berlin-geo   (network required; outputs are committed)
 * Source: © OpenStreetMap contributors (ODbL) — same provenance as tbilisi-streets.ts.
 * ponytail: regenerate on demand, not in CI — official admin borders move ~yearly.
 */

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
]
/** Berlin city-state relation 62422 → area id 3'600'000'000 + 62422. */
const BERLIN_AREA = 3600062422

async function overpass(query: string): Promise<OverpassEl[]> {
  let lastErr: unknown = null
  for (const url of OVERPASS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'sivrce-geo-gen/1.0 (https://sivrce.ge)' },
        signal: AbortSignal.timeout(240_000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as { elements: OverpassEl[] }
      return json.elements ?? []
    } catch (e) {
      lastErr = e
      await new Promise((r) => setTimeout(r, 15_000)) // mirror cooldown before next try
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('overpass unreachable')
}

interface OverpassEl {
  type: string
  id: number
  tags?: Record<string, string>
  center?: { lat: number; lon: number }
  members?: { type: string; role: string; geometry?: { lat: number; lon: number }[] }[]
}

/** Official LOR Bezirk numbers (ref:DE-BE:OT prefix). */
const BEZIRK_BY_NUM: Record<string, string> = {
  '01': 'mitte',
  '02': 'friedrichshain-kreuzberg',
  '03': 'pankow',
  '04': 'charlottenburg-wilmersdorf',
  '05': 'spandau',
  '06': 'steglitz-zehlendorf',
  '07': 'tempelhof-schoeneberg',
  '08': 'neukoelln',
  '09': 'treptow-koepenick',
  '10': 'marzahn-hellersdorf',
  '11': 'lichtenberg',
  '12': 'reinickendorf',
}

/** Bezirk slug canonicalization (matches lib/countries/de.ts BERLIN_BEZIRKE). */
const BEZIRK_SLUG: Record<string, string> = {
  Mitte: 'mitte',
  'Friedrichshain-Kreuzberg': 'friedrichshain-kreuzberg',
  Pankow: 'pankow',
  'Charlottenburg-Wilmersdorf': 'charlottenburg-wilmersdorf',
  Spandau: 'spandau',
  'Steglitz-Zehlendorf': 'steglitz-zehlendorf',
  'Tempelhof-Schöneberg': 'tempelhof-schoeneberg',
  Neukölln: 'neukoelln',
  'Treptow-Köpenick': 'treptow-koepenick',
  'Marzahn-Hellersdorf': 'marzahn-hellersdorf',
  Lichtenberg: 'lichtenberg',
  Reinickendorf: 'reinickendorf',
}

export function slugifyDe(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function main() {
  console.log('[1/2] Ortsteile + Bezirke (admin relations)…')
  const admin = await overpass(`[out:json][timeout:120];
area(${BERLIN_AREA})->.a;
relation["boundary"="administrative"]["admin_level"~"^(9|10)$"](area.a);
out tags center;`)

  const bezirke = admin.filter((e) => e.tags?.['admin_level'] === '9')
  const ortsteile = admin.filter((e) => e.tags?.['admin_level'] === '10')
  console.log(`  candidates: ${bezirke.length} bezirk-level, ${ortsteile.length} ortsteil-level`)

  // Bezirk-level truth: exactly 12 named entries matching BEZIRK_SLUG (OSM
  // carries Berlin Bezirke as admin_level=9, Ortsteile as 10).
  const bezirkNames = bezirke.map((e) => e.tags?.name).filter((n): n is string => !!n && n in BEZIRK_SLUG)
  if (bezirkNames.length !== 12) throw new Error(`expected 12 Bezirke, got ${bezirkNames.length}: ${bezirkNames.join(', ')}`)

  // Ortsteil → Bezirk: OSM carries the parent as is_in? No — use name prefix match
  // against the official list is fragile; instead walk admin_level=10 members'
  // `de:bezirk` tag when present, else fall back to the is_in:city_tag fallback.
  const ortRows = ortsteile
    .map((e) => {
      const name = e.tags?.['name']
      if (!name || !e.center) return null
      // LOR key: first two digits of ref:DE-BE:OT = parent Bezirk
      const lor = e.tags?.['ref:DE-BE:OT'] ?? ''
      const bezirk = BEZIRK_BY_NUM[lor.slice(0, 2)] ?? null
      return { de: name, slug: slugifyDe(name), bezirk, lat: e.center.lat, lng: e.center.lon }
    })
    .filter((r): r is NonNullable<typeof r> => !!r)
    .sort((a, b) => a.de.localeCompare(b.de, 'de'))
  if (ortRows.length < 90) throw new Error(`expected ~96 Ortsteile, got ${ortRows.length}`)
  const missingBezirk = ortRows.filter((r) => !r.bezirk)
  if (missingBezirk.length) throw new Error(`Ortsteile missing LOR bezirk ref: ${missingBezirk.map((r) => r.de).join(', ')}`)

  console.log('[2/2] Streets…')
  const ways = await overpass(`[out:json][timeout:180];
area(${BERLIN_AREA})->.a;
way["highway"~"^(primary|secondary|tertiary|residential|unclassified|living_street|pedestrian)$"]["name"](area.a);
out tags 30000;`)
  const streetNames = [...new Set(ways.map((e) => e.tags?.['name']).filter((n): n is string => !!n))]
    .filter((n) => n.length >= 2 && n.length <= 60 && !/^Way \d/.test(n))
    .sort((a, b) => a.localeCompare(b, 'de'))
  console.log(`  ${ways.length} ways → ${streetNames.length} unique street names`)

  const out = (p: string) => resolve(import.meta.dirname, '../src/data', p)
  const bezirkPatch = JSON.stringify(
    Object.fromEntries(ortRows.filter((r) => r.bezirk).map((r) => [r.slug, r.bezirk])),
  )
  writeFileSync(
    out('berlin-ortsteile.ts'),
    `// GENERATED by scripts/gen-berlin-geo.ts — © OpenStreetMap contributors (ODbL).
// OSM admin_level=10 Ortsteil boundaries (97 named; 96 official + 1 historic) with
// parent Bezirk slug from the official LOR key (ref:DE-BE:OT) + relation center.

export interface BerlinOrtsteil { de: string; slug: string; bezirk: string; lat: number; lng: number }

const RAW: (Omit<BerlinOrtsteil, 'bezirk'> & { bezirk: string | null })[] = ${JSON.stringify(ortRows, null, 0)}

const BEZIRK_OF: Record<string, string> = ${bezirkPatch}

export const BERLIN_ORTSTEILE: BerlinOrtsteil[] = RAW.map((r) => ({ ...r, bezirk: r.bezirk ?? BEZIRK_OF[r.slug] ?? 'mitte' }))
`,
  )
  writeFileSync(
    out('berlin-streets.ts'),
    `// GENERATED by scripts/gen-berlin-geo.ts — © OpenStreetMap contributors (ODbL).
// Deduped Berlin street names (autocomplete catalog, no geometry).

export const BERLIN_STREETS: string[] = ${JSON.stringify(streetNames, null, 0)}
`,
  )
  const kb = (p: string) => Math.round(require('node:fs').statSync(p).size / 1024)
  console.log(`done: ortsteile=${ortRows.length} streets=${streetNames.length}`)
  for (const f of ['berlin-ortsteile.ts', 'berlin-streets.ts']) console.log(`  ${f}: ${kb(out(f))} KB`)
}

// tsx script: run main, no server-side import surface.
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
