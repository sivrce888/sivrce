/**
 * Snap construction ghosts to the live building outline + pin.
 * Source: each project's published map polygon (same outline Korter 3D uses).
 * Run: npx --yes tsx scripts/fetch-project-massing.ts
 *
 * Writes footprints (dev-*) and patches `coords` next to the slug.
 * ponytail: one GET per known page; OSM/NAPR stay for projects without a polygon.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { PROJECTS } from '../src/data/professionals'

type Ring = [number, number][]
type Footprint =
  | { ring: Ring; osmId: number; height?: number; parts?: undefined }
  | { parts: { ring: Ring; floors?: number }[]; osmId?: number; ring?: undefined }

const UA = 'Mozilla/5.0 (compatible; sivrce-maps/1.0)'
const OUT = new URL('../src/data/building-footprints.json', import.meta.url)
const MANIFEST = new URL('../../research/renders-manifest-2026-07.json', import.meta.url)
const DATA_FILES = [
  'src/data/projects-new-tbilisi.ts',
  'src/data/projects-new-batumi.ts',
  'src/data/projects-new-regions.ts',
  'src/data/projects-new-2026-08.ts',
  'src/data/professionals.ts',
].map((p) => new URL('../' + p, import.meta.url))

/** Developer-site sourceUrl → the page that actually publishes the map polygon. */
const EXTRA_URL: Record<string, string> = {
  'biograpi-sakeni': 'https://korter.ge/en/sakeni-by-biograpi-tbilisi',
  'biograpi-hisni': 'https://korter.ge/en/hisni-tbilisi',
  'biograpi-matiani': 'https://korter.ge/en/matiani-tbilisi',
  'biograpi-daira': 'https://korter.ge/en/daira-by-biograpi-tbilisi',
  'biograpi-mozaika': 'https://korter.ge/en/mozaika-tbilisi',
  'biograpi-gardani': 'https://korter.ge/en/gardani-tbilisi',
  'biograpi-libretto': 'https://korter.ge/en/libretto-by-biograpi-tbilisi',
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function extractState(html: string): unknown | null {
  const marker = 'window.INITIAL_STATE = '
  const start = html.indexOf(marker)
  if (start === -1) return null
  const from = start + marker.length
  let depth = 0
  for (let i = from; i < html.length; i++) {
    const ch = html[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(from, i + 1))
        } catch {
          return null
        }
      }
    }
  }
  return null
}

function closeRing(ring: Ring): Ring {
  if (ring.length < 4) return ring
  const a = ring[0]!
  const b = ring[ring.length - 1]!
  if (a[0] !== b[0] || a[1] !== b[1]) ring.push([a[0], a[1]])
  return ring
}

/** Publisher stores [lat, lng]; GeoJSON is [lng, lat]. */
function latLngPairsToRing(raw: unknown): Ring | null {
  let pairs: unknown = raw
  if (typeof raw === 'string') {
    try {
      pairs = JSON.parse(raw)
    } catch {
      return null
    }
  }
  if (!Array.isArray(pairs) || pairs.length < 4) return null
  const ring: Ring = []
  for (const p of pairs) {
    if (!Array.isArray(p) || p.length < 2) return null
    const lat = Number(p[0])
    const lng = Number(p[1])
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
    ring.push([lng, lat])
  }
  const closed = closeRing(ring)
  return closed.length >= 5 ? closed : null
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

type Massing = {
  lat: number
  lng: number
  floors?: number
  ring?: Ring
  parts?: { ring: Ring; floors?: number }[]
}

function massingFromState(state: unknown): Massing | null {
  const map = (state as { buildingLandingStore?: { map?: Record<string, unknown> } })
    ?.buildingLandingStore?.map
  if (!map) return null
  const lat = Number(map.lat)
  const lng = Number(map.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  const houses = Array.isArray(map.houses) ? map.houses : []
  const parts: { ring: Ring; floors?: number }[] = []
  for (const h of houses) {
    if (!h || typeof h !== 'object') continue
    const house = h as { polygon?: unknown; floorCount?: unknown }
    const ring = latLngPairsToRing(house.polygon)
    if (!ring || ringBboxHalfM(ring) < 12) continue
    const floors = Number(house.floorCount)
    parts.push({
      ring,
      ...(Number.isFinite(floors) && floors > 0 ? { floors } : {}),
    })
  }
  const poly = latLngPairsToRing(map.polygon)
  if (parts.length >= 2) {
    return { lat, lng, parts, floors: Number(houses[0]?.floorCount) || undefined }
  }
  const ring = parts[0]?.ring ?? poly
  if (!ring || ringBboxHalfM(ring) < 12) return { lat, lng }
  const floors = parts[0]?.floors
  return { lat, lng, ring, ...(floors ? { floors } : {}) }
}

function loadFootprints(): Record<string, Footprint | null> {
  if (!existsSync(OUT)) return {}
  return (JSON.parse(readFileSync(OUT, 'utf8')).footprints ?? {}) as Record<
    string,
    Footprint | null
  >
}

function saveFootprints(out: Record<string, Footprint | null>) {
  writeFileSync(
    OUT,
    JSON.stringify({ attribution: '© OpenStreetMap contributors (ODbL)', footprints: out }, null, 1),
  )
}

function patchCoords(slug: string, lat: number, lng: number): boolean {
  const latS = String(Number(lat.toFixed(8)))
  const lngS = String(Number(lng.toFixed(8)))
  for (const fileUrl of DATA_FILES) {
    const file = fileUrl.pathname
    const src = readFileSync(file, 'utf8')
    const slugIdx = src.search(new RegExp(`slug: ['"]${slug}['"]`))
    if (slugIdx < 0) continue
    const window = src.slice(slugIdx, slugIdx + 1800)
    const m = window.match(/coords: \{ lat: (-?[0-9.]+), lng: (-?[0-9.]+) \}/)
    if (!m || m.index == null) continue
    const abs = slugIdx + m.index
    const next = `coords: { lat: ${latS}, lng: ${lngS} }`
    writeFileSync(file, src.slice(0, abs) + next + src.slice(abs + m[0].length))
    return true
  }
  return false
}

function sourceUrls(): Map<string, string> {
  const out = new Map<string, string>()
  if (existsSync(MANIFEST)) {
    const rows = JSON.parse(readFileSync(MANIFEST, 'utf8')) as Array<{
      slug?: string
      sourceUrl?: string | null
    }>
    for (const r of rows) {
      if (!r.slug || !r.sourceUrl) continue
      if (!r.sourceUrl.includes('korter.')) continue
      out.set(r.slug, r.sourceUrl)
    }
  }
  for (const [slug, url] of Object.entries(EXTRA_URL)) out.set(slug, url)
  return out
}

async function fetchState(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) return null
    return extractState(await res.text())
  } catch {
    return null
  }
}

function mapRegion(lng: number): 'east' | 'ridge' | 'adjara' | 'other' {
  if (lng > 44.2) return 'east'
  if (lng > 42.4) return 'ridge'
  if (lng > 41.3) return 'adjara'
  return 'other'
}

function haversineM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6_371_000
  const p1 = (aLat * Math.PI) / 180
  const p2 = (bLat * Math.PI) / 180
  const dp = p2 - p1
  const dl = ((bLng - aLng) * Math.PI) / 180
  const h =
    Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

async function main() {
  const urls = sourceUrls()
  const fp = loadFootprints()
  let nPoly = 0
  let nPin = 0
  let nSkip = 0
  for (const p of PROJECTS) {
    const url = urls.get(p.slug)
    if (!url) {
      nSkip++
      continue
    }
    const state = await fetchState(url)
    const mass = state ? massingFromState(state) : null
    if (!mass) {
      console.log(`${p.slug} — no map polygon`)
      await sleep(250)
      continue
    }
    if (mapRegion(p.coords.lng) !== mapRegion(mass.lng)) {
      console.log(`${p.slug} — skip (page is another city)`)
      await sleep(250)
      continue
    }
    const campus = !!(mass.parts && mass.parts.length >= 2)
    const drift = haversineM(p.coords.lat, p.coords.lng, mass.lat, mass.lng)
    if (drift > (campus ? 2000 : 800)) {
      console.log(`${p.slug} — skip (${Math.round(drift)}m off current pin)`)
      await sleep(250)
      continue
    }
    const ids = [`dev-${p.slug}`, `bldg-${p.slug}`]
    if (mass.parts && mass.parts.length >= 2) {
      for (const id of ids) fp[id] = { parts: mass.parts, osmId: 0 }
      nPoly++
      console.log(`${p.slug} parts ${mass.parts.length}`)
    } else if (mass.ring) {
      const prev = fp[`dev-${p.slug}`] ?? fp[`bldg-${p.slug}`]
      const entry = {
        ring: mass.ring,
        osmId: prev && 'osmId' in prev && typeof prev.osmId === 'number' ? prev.osmId : 0,
      }
      for (const id of ids) fp[id] = entry
      nPoly++
      const c = ringCentroid(mass.ring)
      console.log(`${p.slug} ring ${mass.ring.length}pt @ ${c.lat.toFixed(5)},${c.lng.toFixed(5)}`)
    } else {
      console.log(`${p.slug} pin only`)
    }
    if (patchCoords(p.slug, mass.lat, mass.lng)) nPin++
    if (nPoly % 8 === 0) saveFootprints(fp)
    await sleep(250)
  }
  saveFootprints(fp)
  console.log(`done: ${nPoly} polygons, ${nPin} pins patched, ${nSkip} without page`)
}

main()
