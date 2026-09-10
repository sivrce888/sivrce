/**
 * ALKIS Gebäude (Berlin cadastre) → osm_buildings city='berlin'.
 * Run: npx --yes tsx scripts/ingest-alkis-buildings.ts [--from-tile=N]
 *
 * Source: GDI Berlin WFS alkis_gebaeude (dl-de-zero-2.0). OSM Overpass
 * (--city=berlin in ingest-osm-buildings.ts) stays the live/write-through
 * path; ALKIS is the authoritative seed (600k footprints, exact walls).
 * ponytail: WFS tiles only; upgrade → Geofabrik Berlin PBF when volume hurts.
 */

import { createHash } from 'node:crypto'
import { config } from 'dotenv'
import { resolve } from 'node:path'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { alkisBuildingsFromFC, BERLIN_BBOX, type AlkisBuilding } from '../src/lib/map/berlin-gov'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

const TILE = 0.0125
const COUNT = 1000
const PAUSE_MS = 300
const BATCH = 250

/** Stable negative id: real OSM ids are positive — never collides. */
export function alkisSyntheticId(b: AlkisBuilding): string {
  const seed = b.id ?? `${b.lat.toFixed(6)},${b.lng.toFixed(6)}`
  const hex = createHash('sha1').update(`alkis:${seed}`).digest('hex').slice(0, 15)
  return `-${BigInt(`0x${hex}`).toString()}`
}

type Bbox = { west: number; south: number; east: number; north: number }

function tiles(): Bbox[] {
  const out: Bbox[] = []
  for (let s = BERLIN_BBOX.south; s < BERLIN_BBOX.north; s += TILE) {
    for (let w = BERLIN_BBOX.west; w < BERLIN_BBOX.east; w += TILE) {
      out.push({
        south: s,
        west: w,
        north: Math.min(s + TILE, BERLIN_BBOX.north),
        east: Math.min(w + TILE, BERLIN_BBOX.east),
      })
    }
  }
  return out
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function upsertMany(db: PrismaClient, hits: AlkisBuilding[]): Promise<number> {
  if (!hits.length) return 0
  const byId = new Map<string, AlkisBuilding>()
  for (const h of hits) byId.set(alkisSyntheticId(h), h)
  const list = [...byId.entries()]
  let n = 0
  for (let i = 0; i < list.length; i += BATCH) {
    const chunk = list.slice(i, i + BATCH)
    const payload = JSON.stringify(
      chunk.map(([id, h]) => ({
        osmId: id,
        lat: h.lat,
        lng: h.lng,
        name: h.name,
        building: (h.funktion ?? 'yes').slice(0, 40),
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
          'alkis',
          'berlin',
          (x->>'lat')::float8,
          (x->>'lng')::float8,
          NULL,
          NULL,
          x->>'name',
          x->>'building',
          (x->'ring')::jsonb,
          NOW()
        FROM jsonb_array_elements(${payload}::jsonb) AS t(x)
        ON CONFLICT (osm_id) DO UPDATE SET
          lat = EXCLUDED.lat,
          lng = EXCLUDED.lng,
          name = EXCLUDED.name,
          building = EXCLUDED.building,
          ring = EXCLUDED.ring,
          updated_at = NOW()
      `
      n += chunk.length
    } catch (e) {
      console.warn(`  batch fail @${i}:`, e instanceof Error ? e.message : e)
    }
  }
  return n
}

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL missing')
  const fromTile = Number(process.argv.find((a) => a.startsWith('--from-tile='))?.slice(12) ?? 0) || 0
  const pool = new Pool({
    connectionString: /uselibpqcompat=/i.test(url)
      ? url
      : `${url}${url.includes('?') ? '&' : '?'}uselibpqcompat=true`,
    max: 2,
  })
  const db = new PrismaClient({ adapter: new PrismaPg(pool) })
  try {
    const grid = tiles()
    console.log(`berlin/alkis: ${grid.length} tiles (from ${fromTile})`)
    let total = 0
    for (let i = fromTile; i < grid.length; i++) {
      const t = grid[i]!
      let hits: AlkisBuilding[] = []
      try {
        const { fetchAlkisBuildingsInBbox } = await import('../src/lib/map/berlin-gov')
        hits = await fetchAlkisBuildingsInBbox(t, COUNT)
      } catch (e) {
        console.warn(`  tile ${i + 1} wfs fail:`, e instanceof Error ? e.message : e)
      }
      const n = await upsertMany(db, hits)
      total += n
      console.log(`  [${i + 1}/${grid.length}] +${n} (Σ${total})`)
      await sleep(PAUSE_MS)
    }
    console.log(`berlin/alkis: done ${total}`)
  } finally {
    await db.$disconnect()
    await pool.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
