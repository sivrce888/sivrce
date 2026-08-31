/**
 * Pull real OSM building footprints for every map cluster.
 * Run: npx --yes tsx scripts/fetch-footprints.ts [--repair] [--force] [--force-parts]
 * Source: OpenStreetMap via Overpass (ODbL — attribution in map footer).
 *
 * Picker: tallest/largest nearby way — never a 3-storey neighbour glued to a tower.
 * Campus (twins / 400+ flats): all nearby tall buildings as `parts`.
 * ponytail: committed JSON, no runtime fetch. `--repair` skips curated parts.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { BUILDINGS } from '../src/data/buildings'
import { LISTINGS } from '../src/data/listings'
import { PROJECTS } from '../src/data/professionals'

type Ring = [number, number][]
type Part = { ring: Ring; floors?: number }
type Footprint =
  | { ring: Ring; osmId: number; height?: number; parts?: undefined; source?: 'osm' | 'tas' | 'napr' }
  | { parts: Part[]; osmId?: number; ring?: undefined; height?: undefined; source?: 'osm' | 'tas' | 'napr' }

const UA = 'sivrce-maps/1.0 (sivrce888@gmail.com)'
const ENDPOINTS = [
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

/** Multi-tower sites — collect every nearby tall building, not one slab. */
const CAMPUS = new Set([
  'axis-towers',
  'dirsi-riverside',
  'orbi-sea-towers',
  'orbi-city',
  'orbi-continental',
  'orbi-millennium',
  'm2-highlight',
  'grada-park',
  'grada-saburtalo',
  'anagi-police-city',
  'tbilisi-waterfront',
  'maqro-city-tbilisi',
  'monolith-dighomi-city',
  'alliance-palace',
  'metropol-kavtaradze',
  'blox-didi-digomi',
  'archi-rivertown',
  'silk-towers',
  'ambassadori-island-first-tower',
  'coordinate-by-keystone',
  'dighomi-gardens',
  'solum-ponichala',
  'gwg-krtsanisi',
  'mega-gldani',
  'astoria-isani',
  'summer-365',
])

type Target = {
  id: string
  lat: number
  lng: number
  floors?: number
  flats?: number
  campus?: boolean
  ghost?: boolean
}

function isCampus(slug: string, flats?: number): boolean {
  return CAMPUS.has(slug) || (flats ?? 0) >= 400
}

function targets(): Target[] {
  const out = new Map<string, Target>()

  for (const b of BUILDINGS) {
    out.set(`bldg-${b.slug}`, {
      id: `bldg-${b.slug}`,
      lat: b.coords.lat,
      lng: b.coords.lng,
      floors: b.floors,
      campus: isCampus(b.slug, b.units),
      flats: b.units,
      ghost: b.status === 'construction',
    })
  }

  const catalogSlugs = new Set(BUILDINGS.map((b) => b.slug))
  const acc = new Map<string, { lat: number; lng: number; n: number; floors: number }>()
  for (const l of LISTINGS) {
    if (!l.buildingSlug || catalogSlugs.has(l.buildingSlug)) continue
    const a = acc.get(l.buildingSlug) ?? { lat: 0, lng: 0, n: 0, floors: 0 }
    a.lat += l.coords.lat
    a.lng += l.coords.lng
    a.n++
    a.floors = Math.max(a.floors, l.totalFloors || 0)
    acc.set(l.buildingSlug, a)
  }
  for (const [slug, a] of acc) {
    out.set(`bldg-${slug}`, {
      id: `bldg-${slug}`,
      lat: a.lat / a.n,
      lng: a.lng / a.n,
      floors: a.floors || undefined,
    })
  }

  const catalogProjects = new Set(BUILDINGS.map((b) => b.projectSlug).filter(Boolean))
  for (const p of PROJECTS) {
    if (catalogProjects.has(p.slug)) continue
    out.set(`dev-${p.slug}`, {
      id: `dev-${p.slug}`,
      lat: p.coords.lat,
      lng: p.coords.lng,
      floors: p.floors,
      // ponytail: auto-campus glues neighbouring blocks onto unbuilt towers.
      campus: CAMPUS.has(p.slug),
      flats: p.flats,
      ghost: p.done < 100,
    })
  }

  return [...out.values()]
}

function closeRing(ring: Ring): Ring {
  if (ring.length < 4) return ring
  const a = ring[0]!
  const b = ring[ring.length - 1]!
  if (a[0] !== b[0] || a[1] !== b[1]) ring.push([a[0], a[1]])
  return ring
}

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

function ringCentroid(ring: Ring): { lat: number; lng: number } {
  let sLat = 0
  let sLng = 0
  let n = 0
  const last = ring.length - 1
  const closed = last > 0 && ring[0]![0] === ring[last]![0] && ring[0]![1] === ring[last]![1]
  const end = closed ? last : ring.length
  for (let i = 0; i < end; i++) {
    sLng += ring[i]![0]!
    sLat += ring[i]![1]!
    n++
  }
  return { lat: n ? sLat / n : 0, lng: n ? sLng / n : 0 }
}

function haversineM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6_371_000
  const toR = (d: number) => (d * Math.PI) / 180
  const dLat = toR(bLat - aLat)
  const dLng = toR(bLng - aLng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(aLat)) * Math.cos(toR(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
}

function ringBboxHalfM(ring: Ring): number {
  let minLng = Infinity
  let maxLng = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity
  for (const [lng, lat] of ring) {
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  }
  const latC = (minLat + maxLat) / 2
  const w = (maxLng - minLng) * 111_320 * Math.cos((latC * Math.PI) / 180)
  const h = (maxLat - minLat) * 111_320
  return Math.max(w, h) / 2
}

type OsmHit = { ring: Ring; osmId: number; levels?: number }

function geomToRing(geom: Array<{ lon: number; lat: number }> | undefined): Ring | null {
  if (!geom || geom.length < 4) return null
  const ring = closeRing(geom.map((g) => [g.lon, g.lat] as [number, number]))
  return ring.length >= 5 ? ring : null
}

function elementHits(el: {
  type: string
  id: number
  tags?: Record<string, string>
  geometry?: Array<{ lon: number; lat: number }>
  members?: Array<{ type: string; role?: string; geometry?: Array<{ lon: number; lat: number }> }>
}): OsmHit[] {
  const levels = Number(el.tags?.['building:levels'])
  const meta = {
    osmId: el.id,
    ...(Number.isFinite(levels) && levels > 0 ? { levels } : {}),
  }
  if (el.type === 'way') {
    const ring = geomToRing(el.geometry)
    return ring ? [{ ring, ...meta }] : []
  }
  if (el.type !== 'relation' || !el.members) return []
  const out: OsmHit[] = []
  for (const m of el.members) {
    if (m.type !== 'way') continue
    if (m.role && m.role !== 'outer') continue
    const ring = geomToRing(m.geometry)
    if (ring) out.push({ ring, ...meta })
  }
  return out
}

/** Reject sheds + neighbour houses glued onto a planned tower. */
function scoreHit(
  hit: OsmHit,
  lat: number,
  lng: number,
  planned?: number,
  ghost?: boolean,
): number {
  const half = ringBboxHalfM(hit.ring)
  if (half < 14) return -1
  const c = ringCentroid(hit.ring)
  const d = haversineM(lat, lng, c.lat, c.lng)
  const inside = pointInRing(lat, lng, hit.ring)
  if (!inside && d > 90) return -1
  if (ghost && planned && planned >= 12 && half < 18) return -1
  if (ghost && planned && planned >= 12 && hit.levels && hit.levels < planned * 0.5) return -1
  const levels = hit.levels ?? half / 3.5
  return (inside ? 1200 : 0) + levels * 10 + half * 0.35 - d * 0.2
}

function bestFootprint(
  lat: number,
  lng: number,
  hits: OsmHit[],
  planned?: number,
  ghost?: boolean,
): Footprint | null {
  let best: OsmHit | null = null
  let bestS = -1
  for (const hit of hits) {
    const s = scoreHit(hit, lat, lng, planned, ghost)
    if (s > bestS) {
      bestS = s
      best = hit
    }
  }
  if (!best) return null
  if (
    !ghost &&
    planned &&
    planned >= 12 &&
    best.levels &&
    best.levels < planned * 0.35
  ) {
    return null
  }
  // Construction: 1–3 storey OSM neighbour is not the tower.
  if (ghost && best.levels && best.levels < 4 && (planned ?? 10) >= 8) return null
  return {
    ring: best.ring,
    osmId: best.osmId,
    ...(best.levels ? { height: Math.min(best.levels * 3.1, 160) } : {}),
  }
}

/** Legal lot when OSM has no tower yet. ponytail: identify only; skip district-sized polygons. */
async function naprRing(lat: number, lng: number, campus?: boolean): Promise<Footprint | null> {
  const pad = 0.004
  const url =
    'http://gisappsn.reestri.gov.ge/ArcGIS/rest/services/CadRepGeo/MapServer/identify?' +
    new URLSearchParams({
      geometry: `${lng},${lat}`,
      geometryType: 'esriGeometryPoint',
      sr: '4326',
      layers: 'all:10,14,19,24,29,34,39,44,49,54,59',
      tolerance: '3',
      mapExtent: `${lng - pad},${lat - pad},${lng + pad},${lat + pad}`,
      imageDisplay: '600,600,96',
      returnGeometry: 'true',
      f: 'json',
    })
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(14_000),
    })
    if (!res.ok) return null
    const json = (await res.json()) as {
      results?: Array<{
        attributes?: { 'SHAPE.AREA'?: number; SHAPE_Area?: number }
        geometry?: { rings?: number[][][] }
      }>
    }
    let best: Ring | null = null
    let bestArea = Infinity
    for (const r of json.results ?? []) {
      const raw = r.geometry?.rings?.[0]
      if (!raw || raw.length < 4) continue
      const pts: Ring = []
      for (const p of raw) {
        const x = Number(p[0])
        const y = Number(p[1])
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
          pts.length = 0
          break
        }
        pts.push([x, y])
      }
      const ring = closeRing(pts)
      if (ring.length < 5) continue
      const half = ringBboxHalfM(ring)
      if (half < 14 || half > (campus ? 400 : 250)) continue
      const area = Number(r.attributes?.['SHAPE.AREA'] ?? r.attributes?.SHAPE_Area)
      const a = Number.isFinite(area) && area > 0 ? area : half * half
      if (a < bestArea) {
        bestArea = a
        best = ring
      }
    }
    return best ? { ring: best, osmId: 0 } : null
  } catch {
    return null
  }
}

function campusParts(
  lat: number,
  lng: number,
  hits: OsmHit[],
  planned?: number,
  flats?: number,
): Part[] {
  const minLevels = Math.max(8, Math.round((planned ?? 12) * 0.55))
  const maxDist = (flats ?? 0) >= 800 ? 280 : 140
  const seen = new Set<string>()
  const parts: Part[] = []
  for (const hit of hits) {
    const half = ringBboxHalfM(hit.ring)
    if (half < 16) continue
    const c = ringCentroid(hit.ring)
    if (haversineM(lat, lng, c.lat, c.lng) > maxDist) continue
    if (!hit.levels || hit.levels < minLevels) continue
    const key = `${hit.osmId}:${hit.ring[0]![0]!.toFixed(6)}`
    if (seen.has(key)) continue
    seen.add(key)
    parts.push({ ring: hit.ring, floors: hit.levels ?? planned })
  }
  if (parts.length < 2) return []
  // Dense Tbilisi: 9+ similar towers in 140m is the neighbourhood, not the project.
  const maxParts = (flats ?? 0) >= 800 ? 24 : 8
  return parts.length <= maxParts ? parts : []
}

const OSM_MAP = 'https://api.openstreetmap.org/api/0.6/map'

function parseOsmXml(xml: string): OsmHit[] {
  const nodes = new Map<string, [number, number]>()
  for (const m of xml.matchAll(/<node\s+id="(\d+)"[^>]*\/>/g)) {
    const tag = m[0]!
    const id = m[1]!
    const lat = Number(/lat="([^"]+)"/.exec(tag)?.[1])
    const lon = Number(/lon="([^"]+)"/.exec(tag)?.[1])
    if (Number.isFinite(lat) && Number.isFinite(lon)) nodes.set(id, [lon, lat])
  }
  const out: OsmHit[] = []
  for (const m of xml.matchAll(/<way\s+id="(\d+)"[\s\S]*?<\/way>/g)) {
    const body = m[0]!
    if (!/k="building"/.test(body)) continue
    const ring: Ring = []
    for (const nd of body.matchAll(/<nd\s+ref="(\d+)"/g)) {
      const pt = nodes.get(nd[1]!)
      if (pt) ring.push([pt[0], pt[1]])
    }
    const closed = closeRing(ring)
    if (closed.length < 5) continue
    const levels = Number(/k="building:levels"\s+v="([^"]+)"/.exec(body)?.[1])
    out.push({
      ring: closed,
      osmId: Number(m[1]),
      ...(Number.isFinite(levels) && levels > 0 ? { levels } : {}),
    })
  }
  return out
}

async function fetchOsmBbox(lat: number, lng: number, radiusM: number): Promise<OsmHit[]> {
  const dLat = radiusM / 111_320
  const dLng = radiusM / (111_320 * Math.cos((lat * Math.PI) / 180))
  const bbox = `${lng - dLng},${lat - dLat},${lng + dLng},${lat + dLat}`
  const res = await fetch(`${OSM_MAP}?bbox=${bbox}`, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(25_000),
  })
  if (!res.ok) throw new Error(`osm ${res.status}`)
  return parseOsmXml(await res.text())
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function queryBatch(points: { lat: number; lng: number }[], radius: number): Promise<unknown[]> {
  const union = points
    .map(
      (p) =>
        `way(around:${radius},${p.lat},${p.lng})["building"];relation(around:${radius},${p.lat},${p.lng})["building"];`,
    )
    .join('')
  const data = `[out:json][timeout:60];(${union});out geom;`
  for (const ep of ENDPOINTS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(data)}`,
          signal: AbortSignal.timeout(8_000),
        })
        if (res.status === 429 || res.status === 504 || res.status === 509) {
          await sleep(5000 * (attempt + 1))
          continue
        }
        if (!res.ok) throw new Error(`http ${res.status}`)
        const json = (await res.json()) as { elements?: unknown[] }
        return json.elements ?? []
      } catch {
        await sleep(2000 * (attempt + 1))
      }
    }
  }
  return []
}

function flattenHits(elements: unknown[]): OsmHit[] {
  const out: OsmHit[] = []
  for (const el of elements) {
    if (!el || typeof el !== 'object') continue
    out.push(...elementHits(el as Parameters<typeof elementHits>[0]))
  }
  return out
}

const OUT = new URL('../src/data/building-footprints.json', import.meta.url)

function hasParts(fp: Footprint | null | undefined): fp is { parts: Part[] } {
  return !!fp && Array.isArray(fp.parts) && fp.parts.length >= 2
}

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
    JSON.stringify({ attribution: '© OpenStreetMap contributors (ODbL); TAS ARCHITECTURE_LR; NAPR CadRepGeo', footprints: out }, null, 1),
  )
}

function needsRepair(t: Target, fp: Footprint | null | undefined, forceParts: boolean): boolean {
  if (fp?.source === 'tas') return false
  if (hasParts(fp) && !forceParts) {
    const maxParts = (t.flats ?? 0) >= 800 ? 24 : 8
    if (fp.parts.length <= maxParts) return false
    return true
  }
  if (!fp) return true
  if (fp.parts && fp.parts.length < 2) return true
  if (!fp.ring) return true
  if (ringBboxHalfM(fp.ring) < 14) return true
  if (t.floors && t.floors >= 12 && ringBboxHalfM(fp.ring) < 20) return true
  const c = ringCentroid(fp.ring)
  if (haversineM(t.lat, t.lng, c.lat, c.lng) > 90) return true
  if (t.floors && t.floors >= 12 && fp.height) {
    const levels = fp.height / 3.1
    if (levels < t.floors * 0.5) return true
  }
  return false
}

async function main() {
  const fileArg = process.argv.find((a) => a.startsWith('--file='))
  const fromFile = fileArg
    ? readFileSync(fileArg.slice('--file='.length), 'utf8')
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter((s) => s.startsWith('dev-') || s.startsWith('bldg-'))
    : []
  const only = new Set([
    ...fromFile,
    ...process.argv.slice(2).filter((a) => !a.startsWith('-')),
  ])
  const force = process.argv.includes('--force')
  const forceParts = process.argv.includes('--force-parts')
  const repair = process.argv.includes('--repair') || force
  const osmOnly = process.argv.includes('--osm')
  const list = only.size > 0 ? targets().filter((t) => only.has(t.id)) : targets()
  const out = loadOut()
  const todo = list.filter((t) => {
    if (only.size > 0 && force) return true
    if (repair) return needsRepair(t, out[t.id], forceParts)
    return !(t.id in out)
  })
  console.log(
    `footprints: ${list.length} clusters, ${todo.length} to fetch${only.size ? ` (allowlist ${only.size})` : ''}${repair ? ' [repair]' : ''}`,
  )

  if (todo.length === 0) {
    console.log('nothing to fetch')
    return
  }

  const CHUNK = 4
  for (let c = 0; c < todo.length; c += CHUNK) {
    const chunk = todo.slice(c, c + CHUNK)
    const radius = chunk.some((t) => t.campus) ? 220 : 90
    let hits: OsmHit[] = []
    if (!osmOnly) hits = flattenHits(await queryBatch(chunk, radius))
    if (hits.length === 0) {
      for (const t of chunk) {
        try {
          hits = hits.concat(await fetchOsmBbox(t.lat, t.lng, t.campus ? 250 : 160))
        } catch (err) {
          console.log(`${t.id} osm-api ${(err as Error).message}`)
        }
        await sleep(1100)
      }
    }
    for (const t of chunk) {
      const near = hits.filter((h) => {
        const c0 = ringCentroid(h.ring)
        return haversineM(t.lat, t.lng, c0.lat, c0.lng) < (t.campus ? 300 : 120)
      })
      if (t.campus) {
        const parts = campusParts(t.lat, t.lng, near, t.floors, t.flats)
        if (parts.length >= 2) {
          out[t.id] = { parts, osmId: 0 }
          console.log(`${t.id} campus ${parts.length} towers`)
          continue
        }
      }
      // Ghost / under-construction: NAPR lot first (OSM often matches a neighbour shed).
      if (t.ghost && !osmOnly) {
        const napr = await naprRing(t.lat, t.lng, t.campus)
        if (napr) {
          out[t.id] = napr
          console.log(`${t.id} napr (${(napr.ring ?? napr.parts?.[0]?.ring)?.length ?? 0}pt)`)
          continue
        }
      }
      const fp = bestFootprint(t.lat, t.lng, near, t.floors, t.ghost)
      if (fp) {
        out[t.id] = fp
        console.log(`${t.id} osm:${fp.osmId} (${(fp.ring ?? fp.parts?.[0]?.ring)?.length ?? 0}pt${fp.height ? ` ${Math.round(fp.height / 3.1)}fl` : ''})`)
        continue
      }
      if (!osmOnly && !t.ghost) {
        const napr = await naprRing(t.lat, t.lng, t.campus)
        if (napr) {
          out[t.id] = napr
          console.log(`${t.id} napr (${(napr.ring ?? napr.parts?.[0]?.ring)?.length ?? 0}pt)`)
          continue
        }
      }
      out[t.id] = null
      console.log(`${t.id} — square fallback`)
    }
    saveOut(out)
    await sleep(osmOnly ? 200 : 2500)
  }

  const hitsN = Object.values(out).filter(Boolean).length
  const partsN = Object.values(out).filter((v) => hasParts(v)).length
  console.log(`done: ${hitsN} footprints (${partsN} campus); this run ${todo.length} targets`)
}

main()
