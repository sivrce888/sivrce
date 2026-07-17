/**
 * One-time geodata pipeline: pull real OSM building footprints for every
 * map cluster (catalog buildings, listing clusters, construction ghosts)
 * and write src/data/building-footprints.json.
 *
 * Run: npx --yes tsx scripts/fetch-footprints.ts
 * Source: OpenStreetMap via Overpass (ODbL — attribution in map footer).
 * ponytail: ways only (no multipolygon relations); committed JSON, no runtime fetch.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { BUILDINGS } from '../src/data/buildings'
import { LISTINGS } from '../src/data/listings'
import { PROJECTS } from '../src/data/professionals'

type Ring = [number, number][] // [lng, lat]

type Footprint = {
  ring: Ring
  osmId: number
  height?: number
}

const UA = 'sivrce-maps/1.0 (sivrce888@gmail.com)'
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

// ——— cluster targets: id + representative point ———

function targets(): { id: string; lat: number; lng: number }[] {
  const out = new Map<string, { lat: number; lng: number }>()

  for (const b of BUILDINGS) out.set(`bldg-${b.slug}`, { lat: b.coords.lat, lng: b.coords.lng })

  // listing clusters not in the catalog: cluster id is `bldg-${buildingSlug}`
  const catalogSlugs = new Set(BUILDINGS.map((b) => b.slug))
  const acc = new Map<string, { lat: number; lng: number; n: number }>()
  for (const l of LISTINGS) {
    if (!l.buildingSlug || catalogSlugs.has(l.buildingSlug)) continue
    const a = acc.get(l.buildingSlug) ?? { lat: 0, lng: 0, n: 0 }
    a.lat += l.coords.lat
    a.lng += l.coords.lng
    a.n++
    acc.set(l.buildingSlug, a)
  }
  for (const [slug, a] of acc) {
    out.set(`bldg-${slug}`, { lat: a.lat / a.n, lng: a.lng / a.n })
  }

  // construction ghosts: `dev-${project.slug}`, skipping ones the catalog covers
  const catalogProjects = new Set(BUILDINGS.map((b) => b.projectSlug).filter(Boolean))
  for (const p of PROJECTS) {
    if (p.done >= 100 || catalogProjects.has(p.slug)) continue
    out.set(`dev-${p.slug}`, { lat: p.coords.lat, lng: p.coords.lng })
  }

  return [...out.entries()].map(([id, c]) => ({ id, ...c }))
}

// ——— geometry helpers ———

function pointInRing(lat: number, lng: number, ring: Ring): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!
    const [xj, yj] = ring[j]!
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

function minDistM(lat: number, lng: number, ring: Ring): number {
  let best = Infinity
  for (const [x, y] of ring) {
    const dx = (x - lng) * 111_320 * Math.cos((lat * Math.PI) / 180)
    const dy = (y - lat) * 111_320
    best = Math.min(best, Math.hypot(dx, dy))
  }
  return best
}

// ——— overpass ———

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function query(lat: number, lng: number, radius: number): Promise<any[]> {
  const data = `[out:json][timeout:25];way(around:${radius},${lat},${lng})["building"];out geom;`
  for (const ep of ENDPOINTS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(data)}`,
          signal: AbortSignal.timeout(45_000),
        })
        if (res.status === 429 || res.status === 504 || res.status === 509) {
          await sleep(4000 * (attempt + 1))
          continue
        }
        if (!res.ok) throw new Error(`http ${res.status}`)
        const json = await res.json()
        return json.elements ?? []
      } catch {
        await sleep(2000 * (attempt + 1))
      }
    }
  }
  return []
}

function bestFootprint(lat: number, lng: number, elements: any[]): Footprint | null {
  let containing: Footprint | null = null
  let nearest: Footprint | null = null
  let nearestD = Infinity

  for (const el of elements) {
    if (el.type !== 'way' || !Array.isArray(el.geometry) || el.geometry.length < 4) continue
    const ring: Ring = el.geometry.map((g: { lon: number; lat: number }) => [g.lon, g.lat])
    // ensure closed ring
    const first = ring[0]!
    const last = ring[ring.length - 1]!
    if (first[0] !== last[0] || first[1] !== last[1]) ring.push(first)
    if (ring.length < 5) continue

    const levels = Number(el.tags?.['building:levels'])
    const fp: Footprint = {
      ring,
      osmId: el.id,
      ...(Number.isFinite(levels) && levels > 0 ? { height: Math.min(levels * 3.1, 160) } : {}),
    }
    if (pointInRing(lat, lng, ring)) {
      containing = containing && minDistM(lat, lng, containing.ring) < minDistM(lat, lng, ring) ? containing : fp
    } else {
      const d = minDistM(lat, lng, ring)
      if (d < nearestD) {
        nearestD = d
        nearest = fp
      }
    }
  }
  // trust containing; else nearest only if its edge is within 60 m of our point
  return containing ?? (nearestD <= 60 ? nearest : null)
}

const OUT = new URL('../src/data/building-footprints.json', import.meta.url)

function loadOut(): Record<string, Footprint | null> {
  if (!existsSync(OUT)) return {}
  try {
    return (JSON.parse(readFileSync(OUT, 'utf8')).footprints ?? {}) as Record<string, Footprint | null>
  } catch {
    return {}
  }
}

function saveOut(out: Record<string, Footprint | null>) {
  writeFileSync(
    OUT,
    JSON.stringify({ attribution: '© OpenStreetMap contributors (ODbL)', footprints: out }, null, 1),
  )
}

async function main() {
  const list = targets()
  const out = loadOut() // resumable: rerun continues where it stopped
  const todo = list.filter((t) => !(t.id in out))
  console.log(`footprints: ${list.length} clusters, ${todo.length} to fetch`)

  for (const [i, t] of todo.entries()) {
    let elements = await query(t.lat, t.lng, 70)
    if (elements.length === 0) elements = await query(t.lat, t.lng, 160)
    const fp = bestFootprint(t.lat, t.lng, elements)
    out[t.id] = fp // null = confirmed no footprint, don't retry on rerun
    saveOut(out)
    console.log(`${String(i + 1).padStart(2)}/${todo.length} ${t.id} ${fp ? `osm:${fp.osmId} (${fp.ring.length}pt)` : '— square fallback'}`)
    await sleep(800) // overpass courtesy
  }

  const hits = Object.values(out).filter(Boolean).length
  console.log(`done: ${hits}/${list.length} real footprints`)
}

main()
