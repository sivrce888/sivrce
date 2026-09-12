/**
 * Geodata: EVERY metro/subway station in the world (OSM `station=subway` nodes).
 * Run: npx --yes tsx scripts/fetch-world-metro-osm.ts   (~5–10 min, one Overpass round-trip)
 * Output: src/data/world-metro-all.json — compact, server-only (never import from client).
 * Source: OpenStreetMap via Overpass (ODbL — attribution in map footer + JSON header).
 * Re-run quarterly or when global-os.check floors drift; builds fail otherwise.
 * ponytail: nodes only (entrances/platforms merged <180 m); line refs kept when
 * tagged, interchange lines enriched at runtime from data/world-metros. Ceiling:
 * per-city chunk files only if the single JSON ever hurts lambda cold starts.
 */

import { writeFileSync } from 'node:fs'
import { MAP_CITIES_ALL } from '../src/lib/map/user-place.server'

const UA = 'sivrce-maps/1.0 (sivrce888@gmail.com)'
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

const OUT = new URL('../src/data/world-metro-all.json', import.meta.url)

/** Entrance/platform nodes of one complex collapse into a single pin. */
const MERGE_M = 180
/** City snap — mirrors SNAP_MAX_KM in lib/map/user-place. */
const CITY_SNAP_KM = 55

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function overpass(query: string): Promise<any[]> {
  const data = `[out:json][timeout:590];${query}`
  for (const ep of ENDPOINTS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(data)}`,
          signal: AbortSignal.timeout(600_000),
        })
        if (res.status === 429 || res.status === 504 || res.status === 509) {
          await sleep(15000 * (attempt + 1))
          continue
        }
        if (!res.ok) throw new Error(`http ${res.status}`)
        const json = await res.json()
        return json.elements ?? []
      } catch (e) {
        console.warn(`${ep} attempt ${attempt + 1}:`, e instanceof Error ? e.message : e)
        await sleep(5000 * (attempt + 1))
      }
    }
  }
  throw new Error('all Overpass endpoints failed')
}

function nameOf(tags: Record<string, string>): string {
  return (
    tags.name?.trim() ||
    tags['name:en']?.trim() ||
    tags['name:ru']?.trim() ||
    tags['name:ka']?.trim() ||
    tags.int_name?.trim() ||
    tags['name:fr']?.trim() ||
    tags['name:de']?.trim() ||
    tags['name:es']?.trim() ||
    ''
  )
}

function lineOf(tags: Record<string, string>): string {
  return tags.route_ref?.trim() || tags.line?.trim() || tags['ref:line']?.trim() || ''
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371
  const toR = Math.PI / 180
  const dLat = (bLat - aLat) * toR
  const dLng = (bLng - aLng) * toR
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(aLat * toR) * Math.cos(bLat * toR) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)))
}

/** 1° grid over the 22k city corpus — city snap without a 330M-pair scan. */
function buildCityGrid() {
  const grid = new Map<string, typeof MAP_CITIES_ALL>()
  for (const c of MAP_CITIES_ALL) {
    const k = `${Math.floor(c.lat)}:${Math.floor(c.lng)}`
    const list = grid.get(k)
    if (list) (list as unknown as unknown[]).push(c)
    else grid.set(k, [c] as unknown as typeof MAP_CITIES_ALL)
  }
  return grid
}

function nearestCitySlug(
  grid: Map<string, typeof MAP_CITIES_ALL>,
  lat: number,
  lng: number,
): string {
  const c0 = Math.floor(lat)
  const g0 = Math.floor(lng)
  let best: { slug: string; km: number } | null = null
  for (let dc = -2; dc <= 2; dc++) {
    for (let dg = -2; dg <= 2; dg++) {
      const list = grid.get(`${c0 + dc}:${g0 + dg}`)
      if (!list) continue
      for (const c of list) {
        const km = haversineKm(lat, lng, c.lat, c.lng)
        if (km <= CITY_SNAP_KM && (!best || km < best.km)) best = { slug: c.slug, km }
      }
    }
  }
  return best?.slug ?? ''
}

type Raw = { name: string; lat: number; lng: number; line: string }

async function main() {
  console.log('fetching every subway station on earth from Overpass…')
  const elements = await overpass(`(
  node["station"="subway"];
  node["railway"="station"]["subway"="yes"];
  node["railway"="stop"]["subway"="yes"];
  node["public_transport"="station"]["subway"="yes"];
);
out center tags;`) // center: coords survive for nodes too (bare `out tags` drops them)
  console.log(`raw elements: ${elements.length}`)

  const seen = new Set<number>()
  const raw: Raw[] = []
  for (const el of elements) {
    if (el.type !== 'node') continue
    const lat = typeof el.lat === 'number' ? el.lat : el.center?.lat
    const lon = typeof el.lon === 'number' ? el.lon : el.center?.lon
    if (typeof lat !== 'number' || typeof lon !== 'number') continue
    if (seen.has(el.id)) continue
    seen.add(el.id)
    const tags = (el.tags ?? {}) as Record<string, string>
    if (tags.abandoned === 'yes' || tags.disused === 'yes' || tags.construction === 'yes') continue
    const name = nameOf(tags)
    if (!name) continue // ponytail: unnamed node is not a usable station pin
    raw.push({ name, lat, lng: lon, line: lineOf(tags) })
  }
  console.log(`named stations: ${raw.length}`)

  // Merge entrances/platforms: sort by lat, fold neighbours within MERGE_M.
  raw.sort((a, b) => a.lat - b.lat)
  const kept: Raw[] = []
  let merged = 0
  for (const s of raw) {
    let target: Raw | null = null
    for (let i = kept.length - 1; i >= 0; i--) {
      const k = kept[i]!
      if (s.lat - k.lat > 0.002) break
      if (haversineKm(s.lat, s.lng, k.lat, k.lng) * 1000 <= MERGE_M) {
        target = k
        break
      }
    }
    if (!target) {
      kept.push(s)
      continue
    }
    merged++
    if (s.name.length > target.name.length) target.name = s.name
    if (s.line && !target.line.split(';').includes(s.line)) {
      target.line = target.line ? `${target.line};${s.line}` : s.line
    }
  }
  console.log(`pins after ${MERGE_M}m merge: ${kept.length} (folded ${merged})`)

  const grid = buildCityGrid()
  const t0 = Date.now()
  const stations = kept.map((s) => ({
    n: s.name,
    la: Math.round(s.lat * 1e6) / 1e6,
    ln: Math.round(s.lng * 1e6) / 1e6,
    l: s.line,
    c: nearestCitySlug(grid, s.lat, s.lng),
  }))
  console.log(`city snap: ${((Date.now() - t0) / 1000).toFixed(1)}s`)
  const unassigned = stations.filter((s) => !s.c).length
  console.log(`unassigned city: ${unassigned}`)

  const byCity: Record<string, number> = {}
  for (const s of stations) {
    if (s.c) byCity[s.c] = (byCity[s.c] ?? 0) + 1
  }
  const top = Object.entries(byCity)
    .sort((a, b) => b[1]! - a[1]!)
    .slice(0, 15)
  console.log('top cities:', top)

  writeFileSync(
    OUT,
    JSON.stringify({
      attribution: '© OpenStreetMap contributors (ODbL)',
      fetchedAt: new Date().toISOString().slice(0, 10),
      count: stations.length,
      stations,
    }),
  )
  console.log(`wrote ${stations.length} stations → ${OUT.pathname}`)
}

main()
