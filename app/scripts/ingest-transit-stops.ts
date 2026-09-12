/**
 * Berlin transit stops (bus/tram/rail) → pois.
 * Run: npx --yes tsx scripts/ingest-transit-stops.ts [--write]
 *
 * Source: OpenStreetMap via Overpass (ODbL), Berlin bbox chunked 4×2 with
 * adaptive subdivision of dense cells (depth ≤ 2) — light queries survive
 * Overpass slot limits where one giant query gets killed. Default is a dry
 * run that prints counts; --write upserts kind bus_stop (bus) or other + metadata
 * (tram/rail — PoiKind has no tram/rail yet) and recomputes nothing:
 * listing_nearest_poi picks new rows up on its next cron/batch pass.
 * ponytail: Overpass chunk ingest; upgrade → VBB/DELFI GTFS when daily freshness matters.
 */

import { config } from 'dotenv'
import { resolve } from 'node:path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

const WRITE = process.argv.includes('--write')
const UA = 'sivrce-maps/1.0 (sivrce888@gmail.com)'
const API = 'https://overpass-api.de/api/interpreter'

// Berlin bbox 13.08/52.32/13.77/52.68 → 4×2 chunks (each ≤0.5° span).
const W = 13.08
const S = 52.32
const E = 13.77
const N = 52.68
const COLS = 4
const ROWS = 2

function chunk(i: number): { w: number; s: number; e: number; n: number } {
  const cw = (E - W) / COLS
  const ch = (N - S) / ROWS
  const col = i % COLS
  const row = Math.floor(i / COLS)
  return { w: W + col * cw, s: S + row * ch, e: W + (col + 1) * cw, n: S + (row + 1) * ch }
}

type Bbox = { w: number; s: number; e: number; n: number }

/** Per-request cap — dense cells subdivide instead of growing the query. */
const REQ_CAP = 2000

async function overpassQuery(ql: string, label: string): Promise<{ elements?: never[] }> {
  let last = ''
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(ql)}`,
        signal: AbortSignal.timeout(45_000),
      })
      if (res.ok) return (await res.json()) as { elements?: never[] }
      last = `overpass ${res.status} ${label}`
      if (res.status !== 429 && res.status < 500) break
      const retryAfter = Number(res.headers.get('retry-after'))
      await new Promise((r) => setTimeout(r, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 4000 * 2 ** attempt))
      continue
    } catch (e) {
      last = `overpass fetch fail ${label}: ${(e as Error).message}`
    }
    await new Promise((r) => setTimeout(r, 4000 * 2 ** attempt))
  }
  throw new Error(last)
}

type TransitStop = import('../src/lib/map/transit').TransitStop
type Parse = typeof import('../src/lib/map/transit')

/**
 * Fetch one bbox; subdivide (depth ≤ 2) when the cap truncates a dense cell.
 * Light queries finish fast and survive Overpass slot limits — one giant
 * 60 s query is what gets killed.
 */
async function fetchStops(
  parseOverpass: Parse['parseOverpass'],
  cats: readonly ('bus' | 'tram' | 'rail' | 'metro')[],
  b: Bbox,
  depth: number,
): Promise<TransitStop[]> {
  const bb = `${b.s},${b.w},${b.n},${b.e}`
  const ql =
    `[out:json][timeout:25];\n(\n` +
    `  node["highway"="bus_stop"](${bb});\n` +
    `  node["public_transport"="platform"]["bus"="yes"](${bb});\n` +
    `  node["railway"="tram_stop"](${bb});\n` +
    `  node["railway"="station"](${bb});\n` +
    `  node["railway"="halt"](${bb});\n` +
    `  node["public_transport"="station"](${bb});\n` +
    `);\nout center ${REQ_CAP};`
  const stops = parseOverpass(await overpassQuery(ql, bb), [...cats], REQ_CAP)
  const span = Math.max(b.e - b.w, b.n - b.s)
  if (stops.length >= REQ_CAP && depth < 2 && span > 0.06) {
    const mw = (b.w + b.e) / 2
    const ms = (b.s + b.n) / 2
    const subs: Bbox[] = [
      { w: b.w, s: b.s, e: mw, n: ms },
      { w: mw, s: b.s, e: b.e, n: ms },
      { w: b.w, s: ms, e: mw, n: b.n },
      { w: mw, s: ms, e: b.e, n: b.n },
    ]
    const out: TransitStop[] = []
    for (const sub of subs) {
      out.push(...(await fetchStops(parseOverpass, cats, sub, depth + 1)))
      await new Promise((r) => setTimeout(r, 2000))
    }
    return out
  }
  return stops
}

async function main() {
  const { BERLIN_BBOX } = await import('../src/lib/map/berlin-gov')
  void BERLIN_BBOX
  const { parseOverpass } = await import('../src/lib/map/transit')
  const cats = ['bus', 'tram', 'rail', 'metro'] as const
  let fetched = 0
  const seen = new Map<string, TransitStop>()
  for (let i = 0; i < COLS * ROWS; i++) {
    const stops = await fetchStops(parseOverpass, cats, chunk(i), 0)
    fetched += stops.length
    for (const st of stops) {
      if (!seen.has(st.id)) seen.set(st.id, st)
    }
    console.log(`chunk ${i + 1}/${COLS * ROWS}: ${stops.length} stops`)
    await new Promise((r) => setTimeout(r, 2000))
  }
  const all = [...seen.values()]
  const byCat = new Map<string, number>()
  for (const st of all) byCat.set(st.category, (byCat.get(st.category) ?? 0) + 1)
  console.log(`berlin/transit: ${all.length} unique (${fetched} fetched)`, Object.fromEntries(byCat))
  if (!WRITE) {
    console.log('dry run — pass --write to upsert into pois')
    return
  }
  const { poiUuid } = await import('../src/lib/geo/nearest-poi-pure')
  const { db } = await import('../src/lib/db')
  let n = 0
  const FALLBACK_NAME: Record<string, string> = { bus: 'Haltestelle', tram: 'Tram', rail: 'Bahnhof', metro: 'U-/S-Bahn' }
  for (const st of all) {
    const kind = st.category === 'bus' ? 'bus_stop' : st.category === 'metro' ? 'metro' : 'other'
    const name = st.name ?? FALLBACK_NAME[st.category] ?? 'Haltestelle'
    await db.$executeRaw`
      INSERT INTO pois (id, kind, name_ka, name_en, location, is_active, metadata, created_at, updated_at)
      VALUES (
        ${poiUuid(`de-transit:${st.id}`)}::uuid,
        ${kind}::poi_kind,
        ${name},
        ${name},
        ST_SetSRID(ST_MakePoint(${st.lng}, ${st.lat}), 4326)::geography,
        true,
        ${JSON.stringify({ osmId: st.id, deTransit: st.category, license: 'ODbL' })}::jsonb,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        kind = EXCLUDED.kind,
        name_ka = EXCLUDED.name_ka,
        name_en = EXCLUDED.name_en,
        location = EXCLUDED.location,
        is_active = true,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    `
    n++
  }
  console.log(`berlin/transit: upserted ${n}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
