/**
 * Tiled Overpass → osm_buildings (Phase B national corpus).
 * Run: npx --yes tsx scripts/ingest-osm-buildings.ts --city=tbilisi
 *      npx --yes tsx scripts/ingest-osm-buildings.ts --city=batumi
 *      npx --yes tsx scripts/ingest-osm-buildings.ts --city=all
 *
 * Attribution: © OpenStreetMap contributors (ODbL).
 * ponytail: Overpass tiles only; upgrade → Geofabrik PBF when volume hurts.
 */

import { config } from 'dotenv'
import { resolve } from 'node:path'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

type Ring = [number, number][]
type Bbox = { south: number; west: number; north: number; east: number }

const UA = 'sivrce-maps/1.0 (sivrce888@gmail.com)'
const ENDPOINTS = [
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

const CITIES: Record<string, Bbox> = {
  tbilisi: { south: 41.648, west: 44.682, north: 41.842, east: 44.954 },
  batumi: { south: 41.58, west: 41.58, north: 41.7, east: 41.72 },
  kutaisi: { south: 42.22, west: 42.65, north: 42.32, east: 42.78 },
  rustavi: { south: 41.5, west: 44.95, north: 41.6, east: 45.1 },
  gori: { south: 41.96, west: 44.08, north: 42.02, east: 44.15 },
  poti: { south: 42.13, west: 41.64, north: 42.18, east: 41.7 },
  zugdidi: { south: 42.48, west: 41.84, north: 42.53, east: 41.9 },
  telavi: { south: 41.9, west: 45.45, north: 41.94, east: 45.5 },
}

const TILE = 0.025 // ~2.5 km
const PAUSE_MS = 1200
const BATCH = 250

type OsmNode = { lon: number; lat: number }
type OsmEl = {
  type: string
  id?: number
  tags?: Record<string, string>
  geometry?: OsmNode[]
  members?: Array<{ type: string; role?: string; geometry?: OsmNode[] }>
}

type Hit = {
  osmId: number
  lat: number
  lng: number
  levels: number | null
  heightM: number | null
  name: string | null
  building: string | null
  ring: Ring
}

function closeRing(pts: Ring): Ring {
  if (pts.length < 3) return pts
  const a = pts[0]!
  const b = pts[pts.length - 1]!
  if (a[0] === b[0] && a[1] === b[1]) return pts
  return [...pts, [a[0], a[1]]]
}

function nodesToRing(geom: OsmNode[] | undefined): Ring | null {
  if (!geom || geom.length < 4) return null
  const ring = closeRing(geom.map((g) => [g.lon, g.lat] as [number, number]))
  return ring.length >= 5 ? ring : null
}

function centroid(ring: Ring): { lat: number; lng: number } {
  let x = 0
  let y = 0
  const n = ring.length - 1
  for (let i = 0; i < n; i++) {
    x += ring[i]![0]
    y += ring[i]![1]
  }
  return { lng: x / n, lat: y / n }
}

function hitsFromEl(el: OsmEl): Hit[] {
  const tags = el.tags ?? {}
  const building = (tags.building || '').trim().toLowerCase()
  if (!building || building === 'no' || building === 'roof') return []
  const levelsN = Number(tags['building:levels'] ?? tags.levels)
  const heightN = Number(tags.height)
  // OSM allows fractional levels (e.g. 1.5); DB column is int.
  const levels =
    Number.isFinite(levelsN) && levelsN > 0 ? Math.max(1, Math.round(levelsN)) : null
  const heightM =
    Number.isFinite(heightN) && heightN > 0
      ? heightN
      : levels
        ? Math.min(levels * 3.1, 160)
        : null
  const name = (tags.name || tags['name:ka'] || tags['name:en'] || '').trim() || null
  const osmId = typeof el.id === 'number' ? el.id : 0
  if (!osmId) return []

  const rings: Ring[] = []
  if (el.type === 'way') {
    const r = nodesToRing(el.geometry)
    if (r) rings.push(r)
  } else if (el.type === 'relation' && el.members) {
    for (const m of el.members) {
      if (m.type !== 'way') continue
      if (m.role && m.role !== 'outer') continue
      const r = nodesToRing(m.geometry)
      if (r) rings.push(r)
    }
  }

  const out: Hit[] = []
  for (const ring of rings) {
    const c = centroid(ring)
    out.push({
      osmId,
      lat: c.lat,
      lng: c.lng,
      levels,
      heightM,
      name,
      building,
      ring,
    })
  }
  return out
}

function tiles(bbox: Bbox): Bbox[] {
  const out: Bbox[] = []
  for (let s = bbox.south; s < bbox.north; s += TILE) {
    for (let w = bbox.west; w < bbox.east; w += TILE) {
      out.push({
        south: s,
        west: w,
        north: Math.min(s + TILE, bbox.north),
        east: Math.min(w + TILE, bbox.east),
      })
    }
  }
  return out
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function overpass(bbox: Bbox): Promise<OsmEl[]> {
  const q = `[out:json][timeout:60];(way["building"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});relation["building"](${bbox.south},${bbox.west},${bbox.north},${bbox.east}););out geom;`
  for (const ep of ENDPOINTS) {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(q)}`,
        signal: AbortSignal.timeout(70_000),
      })
      if (!res.ok) continue
      const json = (await res.json()) as { elements?: OsmEl[] }
      return json.elements ?? []
    } catch {
      /* next */
    }
  }
  return []
}

async function upsertMany(db: PrismaClient, city: string, hits: Hit[]): Promise<number> {
  if (!hits.length) return 0
  const byId = new Map<number, Hit>()
  for (const h of hits) byId.set(h.osmId, h)
  const list = [...byId.values()]
  let n = 0
  for (let i = 0; i < list.length; i += BATCH) {
    const chunk = list.slice(i, i + BATCH)
    const payload = JSON.stringify(
      chunk.map((h) => ({
        osmId: h.osmId,
        lat: h.lat,
        lng: h.lng,
        levels: h.levels,
        heightM: h.heightM,
        name: h.name,
        building: h.building,
        ring: h.ring,
      })),
    )
    try {
      await db.$executeRaw`
        INSERT INTO osm_buildings (
          osm_id, osm_type, city, lat, lng, levels, height_m, name, building, ring, updated_at
        )
        SELECT
          (x->>'osmId')::bigint,
          'way',
          ${city},
          (x->>'lat')::float8,
          (x->>'lng')::float8,
          (x->>'levels')::int,
          (x->>'heightM')::float8,
          x->>'name',
          x->>'building',
          (x->'ring')::jsonb,
          NOW()
        FROM jsonb_array_elements(${payload}::jsonb) AS t(x)
        ON CONFLICT (osm_id) DO UPDATE SET
          city = EXCLUDED.city,
          lat = EXCLUDED.lat,
          lng = EXCLUDED.lng,
          levels = EXCLUDED.levels,
          height_m = EXCLUDED.height_m,
          name = EXCLUDED.name,
          building = EXCLUDED.building,
          ring = EXCLUDED.ring,
          updated_at = NOW()
      `
      n += chunk.length
    } catch (e) {
      console.warn(`  batch fail @${i}:`, e instanceof Error ? e.message : e)
      for (const h of chunk) {
        try {
          await db.$executeRaw`
            INSERT INTO osm_buildings (
              osm_id, osm_type, city, lat, lng, levels, height_m, name, building, ring, updated_at
            ) VALUES (
              ${h.osmId}, 'way', ${city}, ${h.lat}, ${h.lng},
              ${h.levels}, ${h.heightM}, ${h.name}, ${h.building},
              ${JSON.stringify(h.ring)}::jsonb, NOW()
            )
            ON CONFLICT (osm_id) DO UPDATE SET
              city = EXCLUDED.city,
              lat = EXCLUDED.lat,
              lng = EXCLUDED.lng,
              levels = EXCLUDED.levels,
              height_m = EXCLUDED.height_m,
              name = EXCLUDED.name,
              building = EXCLUDED.building,
              ring = EXCLUDED.ring,
              updated_at = NOW()
          `
          n++
        } catch (err) {
          console.warn(`  skip osm ${h.osmId}:`, err instanceof Error ? err.message : err)
        }
      }
    }
  }
  return n
}

async function ingestCity(db: PrismaClient, city: string, bbox: Bbox, fromTile = 0) {
  const grid = tiles(bbox)
  console.log(`${city}: ${grid.length} tiles (from ${fromTile})`)
  let total = 0
  for (let i = fromTile; i < grid.length; i++) {
    const t = grid[i]!
    let els: OsmEl[] = []
    try {
      els = await overpass(t)
    } catch (e) {
      console.warn(`  tile ${i + 1} overpass fail:`, e instanceof Error ? e.message : e)
    }
    const hits = els.flatMap(hitsFromEl)
    const n = await upsertMany(db, city, hits)
    total += n
    console.log(`  [${i + 1}/${grid.length}] +${n} (Σ${total})`)
    await sleep(hits.length === 0 ? 400 : PAUSE_MS)
  }
  console.log(`${city}: done ${total}`)
}

function parseCity(): string[] {
  const arg = process.argv.find((a) => a.startsWith('--city='))?.slice(7) ?? 'tbilisi'
  if (arg === 'all') return Object.keys(CITIES)
  if (!CITIES[arg]) {
    console.error(`unknown city ${arg}; use ${Object.keys(CITIES).join('|')}|all`)
    process.exit(1)
  }
  return [arg]
}

function parseFromTile(): number {
  const raw = process.argv.find((a) => a.startsWith('--from-tile='))?.slice(12)
  const n = raw ? Number(raw) : 0
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL missing')
  const pool = new Pool({
    connectionString: /uselibpqcompat=/i.test(url)
      ? url
      : `${url}${url.includes('?') ? '&' : '?'}uselibpqcompat=true`,
    max: 2,
  })
  const db = new PrismaClient({ adapter: new PrismaPg(pool) })
  const fromTile = parseFromTile()
  try {
    for (const city of parseCity()) {
      await ingestCity(db, city, CITIES[city]!, fromTile)
    }
  } finally {
    await db.$disconnect()
    await pool.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
