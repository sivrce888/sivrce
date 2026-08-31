/**
 * Snap map massing to TAS Architecture Service permit polygons (Tbilisi)
 * and NAPR cadastral parcels when CadRepGeo is up.
 * Run: npx --yes tsx scripts/snap-official-footprints.ts
 *
 * Writes building-footprints.json (dev-/bldg-*) + napr-pin-overrides.json.
 * Patches project coords to the official centroid.
 * ponytail: one WFS hit per Tbilisi pin; OSM/Korter stay for TAS-miss / Adjara.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { BUILDINGS } from '../src/data/buildings'
import { PROJECTS } from '../src/data/professionals'
import {
  fetchNaprParcelByCode,
  fetchNaprParcelAt,
  probeNaprCadRep,
} from '../src/lib/map/napr-parcel'
import { fetchTasShapesAt, pickTasShapesForPin } from '../src/lib/map/tas-arch'
import { haversineM, ringBboxHalfM } from '../src/lib/map/buildings'
import { ringCentroid } from '../src/lib/map/pick-building'

type Ring = [number, number][]
type Footprint =
  | { ring: Ring; osmId: number; height?: number; parts?: undefined }
  | { parts: { ring: Ring; floors?: number }[]; osmId?: number; ring?: undefined }

const OUT = new URL('../src/data/building-footprints.json', import.meta.url)
const NAPR_OUT = new URL('../src/data/napr-pin-overrides.json', import.meta.url)
const DATA_FILES = [
  'src/data/projects-new-tbilisi.ts',
  'src/data/projects-new-batumi.ts',
  'src/data/projects-new-regions.ts',
  'src/data/projects-new-2026-08.ts',
  'src/data/professionals.ts',
].map((p) => new URL('../' + p, import.meta.url))

const CAMPUS = new Set([
  'coordinate-by-keystone',
  'dighomi-gardens',
  'solum-ponichala',
  'gwg-krtsanisi',
  'axis-towers',
  'dirsi-riverside',
  'orbi-sea-towers',
  'orbi-city',
  'm2-highlight',
  'archi-rivertown',
])

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function isTbilisi(city: string, lng: number, lat: number): boolean {
  if (city === 'თბილისი') return true
  return lng > 44.65 && lng < 45.05 && lat > 41.62 && lat < 41.85
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
    JSON.stringify(
      { attribution: '© OpenStreetMap contributors (ODbL); TAS ARCHITECTURE_LR; NAPR CadRepGeo', footprints: out },
      null,
      1,
    ),
  )
}

function hasParts(fp: Footprint | null | undefined): boolean {
  return !!fp && Array.isArray(fp.parts) && fp.parts.length >= 2
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
    if (m[0] === next) return true
    writeFileSync(file, src.slice(0, abs) + next + src.slice(abs + m[0].length))
    return true
  }
  return false
}

type Target = {
  id: string
  slug: string
  lat: number
  lng: number
  city: string
  cadastral?: string
  campus: boolean
  ghost: boolean
}

function targets(): Target[] {
  const out = new Map<string, Target>()
  for (const b of BUILDINGS) {
    out.set(`bldg-${b.slug}`, {
      id: `bldg-${b.slug}`,
      slug: b.slug,
      lat: b.coords.lat,
      lng: b.coords.lng,
      city: b.city,
      campus: CAMPUS.has(b.slug) || (b.units ?? 0) >= 250,
      ghost: b.status === 'construction',
    })
  }
  const catalog = new Set(BUILDINGS.map((b) => b.slug))
  for (const p of PROJECTS) {
    if (catalog.has(p.slug)) {
      const t = out.get(`bldg-${p.slug}`)
      if (t && p.cadastral) t.cadastral = p.cadastral
      continue
    }
    out.set(`dev-${p.slug}`, {
      id: `dev-${p.slug}`,
      slug: p.slug,
      lat: p.coords.lat,
      lng: p.coords.lng,
      city: p.city,
      cadastral: p.cadastral,
      campus: CAMPUS.has(p.slug) || p.flats >= 250,
      ghost: p.done < 100,
    })
  }
  return [...out.values()]
}

async function main() {
  const only = new Set(process.argv.slice(2).filter((a) => !a.startsWith('-')))
  const force = process.argv.includes('--force')
  const list = only.size ? targets().filter((t) => only.has(t.id) || only.has(t.slug)) : targets()
  const fps = loadFootprints()
  const naprUp = await probeNaprCadRep()
  console.log(`snap-official: ${list.length} targets, NAPR ${naprUp ? 'up' : 'down'}`)

  const naprOverrides: Record<
    string,
    { lat: number; lng: number; uniqCode: string; ring: Ring; source: 'napr' }
  > = {}

  let tasN = 0
  let naprN = 0
  let skipN = 0
  let missN = 0

  for (let i = 0; i < list.length; i++) {
    const t = list[i]!
    const existing = fps[t.id]
    if (hasParts(existing) && !force) {
      skipN++
      continue
    }
    if (
      existing?.ring &&
      existing.ring.length >= 8 &&
      ringBboxHalfM(existing.ring) >= 16 &&
      !force
    ) {
      skipN++
      continue
    }

    let wrote = false

    if (isTbilisi(t.city, t.lng, t.lat)) {
      const shapes = await fetchTasShapesAt(t.lat, t.lng)
      const picked = pickTasShapesForPin(shapes, t.lat, t.lng, {
        campus: t.campus,
        maxPinM: t.campus ? 280 : 90,
      })
      if (picked.length >= 2) {
        fps[t.id] = { parts: picked.map((s) => ({ ring: s.ring })), osmId: 0 }
        const c = ringCentroid(picked[0]!.ring)
        patchCoords(t.slug, c.lat, c.lng)
        tasN++
        wrote = true
        console.log(`${t.id} tas-campus ${picked.length}`)
      } else if (picked.length === 1) {
        const ring = picked[0]!.ring
        const half = ringBboxHalfM(ring)
        if (t.ghost && ring.length < 8 && half < 22) {
          /* TAS shed — leave for OSM */
        } else {
          fps[t.id] = { ring, osmId: 0 }
          const c = ringCentroid(ring)
          if (haversineM(t.lat, t.lng, c.lat, c.lng) > 6) patchCoords(t.slug, c.lat, c.lng)
          tasN++
          wrote = true
          console.log(`${t.id} tas ${ring.length}pt ${picked[0]!.statusName ?? ''}`)
        }
      }
      await sleep(280)
    }

    if (naprUp && (t.cadastral || (!wrote && t.ghost))) {
      const parcel = t.cadastral
        ? await fetchNaprParcelByCode(t.cadastral)
        : await fetchNaprParcelAt(t.lat, t.lng)
      if (parcel) {
        naprOverrides[t.slug] = {
          lat: parcel.lat,
          lng: parcel.lng,
          uniqCode: parcel.uniqCode,
          ring: parcel.ring,
          source: 'napr',
        }
        naprN++
        if (!wrote) {
          const half = ringBboxHalfM(parcel.ring)
          if (half >= 14 && half <= (t.campus ? 400 : 180)) {
            fps[t.id] = { ring: parcel.ring, osmId: 0 }
            patchCoords(t.slug, parcel.lat, parcel.lng)
            wrote = true
            console.log(`${t.id} napr ${parcel.uniqCode} ${parcel.ring.length}pt`)
          }
        }
      }
      await sleep(200)
    }

    if (!wrote) {
      if (!(t.id in fps)) fps[t.id] = existing ?? null
      missN++
    }

    if (i % 8 === 7) saveFootprints(fps)
  }

  saveFootprints(fps)
  writeFileSync(
    NAPR_OUT,
    JSON.stringify(
      {
        attribution: 'NAPR CadRepGeo (reestri.gov.ge)',
        updatedAt: new Date().toISOString(),
        overrides: naprOverrides,
      },
      null,
      2,
    ) + '\n',
  )
  console.log(`snap-official: tas ${tasN} napr ${naprN} skip ${skipN} miss ${missN}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
