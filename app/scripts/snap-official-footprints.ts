/**
 * Snap Tbilisi construction massing to TAS ARCHITECTURE_LR (permit outline).
 * NAPR CadRepGeo when up — pin + legal lot.
 * Run: npx --yes tsx scripts/snap-official-footprints.ts [slug ...] [--force]
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { PROJECTS } from '../src/data/professionals'
import { fetchNaprParcelAt, fetchNaprParcelByCode, probeNaprCadRep } from '../src/lib/map/napr-parcel'
import {
  fetchTasShapesAt,
  pickTasShapesForPin,
  probeTasArch,
  type TasArchShape,
} from '../src/lib/map/tas-arch'
import { haversineM } from '../src/lib/map/buildings'

type Ring = [number, number][]
type Footprint =
  | { ring: Ring; osmId: number; source?: 'tas' | 'napr' | 'osm'; parts?: undefined }
  | { parts: { ring: Ring }[]; osmId?: number; source?: 'tas' | 'napr' | 'osm'; ring?: undefined }

const FP_OUT = new URL('../src/data/building-footprints.json', import.meta.url)
const TAS_OUT = new URL('../src/data/tas-pin-overrides.json', import.meta.url)
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
  'm2-highlight',
  'archi-rivertown',
])

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function isCampus(slug: string, flats?: number): boolean {
  return CAMPUS.has(slug) || (flats ?? 0) >= 400
}

async function tasAt(lat: number, lng: number, campus: boolean): Promise<TasArchShape[]> {
  const tight = pickTasShapesForPin(await fetchTasShapesAt(lat, lng), lat, lng, {
    campus,
    maxPinM: campus ? 180 : 90,
  })
  if (tight.length) return tight
  // ponytail: street-geocode pins miss TAS by 90–250 m. Wider WFS; picker still drops district blobs.
  return pickTasShapesForPin(await fetchTasShapesAt(lat, lng, campus ? 0.004 : 0.003, 80), lat, lng, {
    campus,
    maxPinM: campus ? 180 : 90,
  })
}

function loadJson<T>(url: URL, fallback: T): T {
  if (!existsSync(url)) return fallback
  return JSON.parse(readFileSync(url, 'utf8')) as T
}

function patchCoords(slug: string, lat: number, lng: number): boolean {
  const latS = String(Number(lat.toFixed(8)))
  const lngS = String(Number(lng.toFixed(8)))
  for (const fileUrl of DATA_FILES) {
    const file = fileUrl.pathname
    let src = readFileSync(file, 'utf8')
    let from = 0
    while (from < src.length) {
      const slugIdx = src.slice(from).search(new RegExp(`slug: ['"]${slug}['"]`))
      if (slugIdx < 0) break
      const absSlug = from + slugIdx
      const window = src.slice(absSlug, absSlug + 1800)
      const m = window.match(/coords: \{ lat: (-?[0-9.]+), lng: (-?[0-9.]+) \}/)
      if (m && m.index != null) {
        const abs = absSlug + m.index
        const next = `coords: { lat: ${latS}, lng: ${lngS} }`
        if (m[0] === next) return true
        writeFileSync(file, src.slice(0, abs) + next + src.slice(abs + m[0].length))
        return true
      }
      from = absSlug + 8
    }
  }
  return false
}

async function main() {
  const force = process.argv.includes('--force')
  const only = new Set(process.argv.slice(2).filter((a) => !a.startsWith('-')))
  const tasUp = await probeTasArch()
  const naprUp = await probeNaprCadRep()
  console.log(`snap-official: TAS ${tasUp ? 'up' : 'DOWN'} · NAPR ${naprUp ? 'up' : 'DOWN'}`)

  const uc = PROJECTS.filter(
    (p) => p.done < 100 && Number.isFinite(p.coords.lat) && Number.isFinite(p.coords.lng),
  )
  const list = uc.filter(
    (p) => p.city === 'თბილისი' && (!only.size || only.has(p.slug) || only.has(`dev-${p.slug}`)),
  )

  const fpFile = loadJson<{ footprints?: Record<string, Footprint | null> }>(FP_OUT, {})
  const footprints = fpFile.footprints ?? {}
  const tasOverrides = loadJson<{
    overrides?: Record<string, { lat: number; lng: number; ring: Ring; source: 'tas' }>
  }>(TAS_OUT, {}).overrides ?? {}
  const naprOverrides = loadJson<{
    overrides?: Record<
      string,
      { lat: number; lng: number; uniqCode: string; ring: Ring; source: 'napr' }
    >
  }>(NAPR_OUT, {}).overrides ?? {}

  let tasHits = 0
  let naprHits = 0
  let miss = 0

  const CHUNK = 3
  for (let i = 0; i < list.length; i += CHUNK) {
    const chunk = list.slice(i, i + CHUNK)
    await Promise.all(
      chunk.map(async (p) => {
        const id = `dev-${p.slug}`
        const catId = `bldg-${p.slug}`
        const prev = footprints[id] ?? footprints[catId]
        if (!force && prev?.source === 'tas') return

        const campus = isCampus(p.slug, p.flats)
        const picked = tasUp ? await tasAt(p.coords.lat, p.coords.lng, campus) : []
        if (picked.length >= 1) {
          const d0 = haversineM(p.coords.lat, p.coords.lng, picked[0]!.lat, picked[0]!.lng)
          if (d0 > 90 && !campus) {
            miss++
            console.log(`${p.slug} — TAS ${Math.round(d0)}m off`)
            return
          }
        }
        if (picked.length >= 2) {
          const fp = { parts: picked.map((s) => ({ ring: s.ring })), osmId: 0, source: 'tas' as const }
          footprints[id] = fp
          footprints[catId] = fp
          let sLat = 0
          let sLng = 0
          for (const s of picked) {
            sLat += s.lat
            sLng += s.lng
          }
          const lat = sLat / picked.length
          const lng = sLng / picked.length
          tasOverrides[p.slug] = { lat, lng, ring: picked[0]!.ring, source: 'tas' }
          const drift = haversineM(p.coords.lat, p.coords.lng, lat, lng)
          if (drift > 6 && drift <= (campus ? 180 : 50)) patchCoords(p.slug, lat, lng)
          tasHits++
          console.log(`${p.slug} tas campus ${picked.length} @ ${lat.toFixed(6)},${lng.toFixed(6)}`)
        } else if (picked.length === 1) {
          const s = picked[0]!
          footprints[id] = { ring: s.ring, osmId: 0, source: 'tas' }
          footprints[catId] = { ring: s.ring, osmId: 0, source: 'tas' }
          tasOverrides[p.slug] = { lat: s.lat, lng: s.lng, ring: s.ring, source: 'tas' }
          const drift = haversineM(p.coords.lat, p.coords.lng, s.lat, s.lng)
          if (drift > 6 && drift <= (campus ? 180 : 50)) patchCoords(p.slug, s.lat, s.lng)
          tasHits++
          console.log(`${p.slug} tas ${s.ring.length}pt @ ${s.lat.toFixed(6)},${s.lng.toFixed(6)}`)
        } else {
          miss++
          console.log(`${p.slug} — no TAS`)
        }

        if (!naprUp) return
        const parcel = p.cadastral
          ? await fetchNaprParcelByCode(p.cadastral)
          : await fetchNaprParcelAt(p.coords.lat, p.coords.lng)
        if (!parcel) return
        naprOverrides[p.slug] = {
          lat: parcel.lat,
          lng: parcel.lng,
          uniqCode: parcel.uniqCode,
          ring: parcel.ring,
          source: 'napr',
        }
        naprHits++
      }),
    )
    await sleep(180)
  }

  // ponytail: catalog uses bldg-*; ghosts use dev-* — keep identical after snap.
  for (const p of list) {
    const dev = footprints[`dev-${p.slug}`]
    if (dev) footprints[`bldg-${p.slug}`] = dev
  }

  writeFileSync(
    FP_OUT,
    JSON.stringify(
      {
        attribution: '© OpenStreetMap contributors (ODbL); TAS ARCHITECTURE_LR; NAPR CadRepGeo',
        footprints,
      },
      null,
      1,
    ),
  )
  writeFileSync(
    TAS_OUT,
    JSON.stringify(
      {
        attribution: 'Tbilisi Architecture Service ARCHITECTURE_LR (tas.ge / mgis.tbilisi.gov.ge)',
        updatedAt: new Date().toISOString(),
        overrides: tasOverrides,
      },
      null,
      2,
    ) + '\n',
  )
  if (naprHits > 0) {
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
  }

  console.log(`snap-official: TAS ${tasHits} new, NAPR ${naprHits}, miss ${miss}, list ${list.length}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
