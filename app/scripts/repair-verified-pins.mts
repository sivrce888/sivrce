/**
 * One-off repair: move 6 verified-wrong pins onto the NAPR legal parcel at the
 * triangulated target (address geocode + korter pin + NAPR lot all agree).
 * Clears the TAS overrides that were snapped to the old wrong pins.
 * Run: npx --yes tsx scripts/repair-verified-pins.mts
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { geoJsonRound } from '../src/lib/map/map-geo'
import { fetchNaprParcelAt } from '../src/lib/map/napr-parcel'
import { haversineM, ringBboxHalfM } from '../src/lib/map/buildings'

const NAPR_OUT = new URL('../src/data/napr-pin-overrides.json', import.meta.url)
const TAS_OUT = new URL('../src/data/tas-pin-overrides.json', import.meta.url)
const DATA_FILES = [
  'src/data/projects-new-tbilisi.ts',
  'src/data/projects-new-batumi.ts',
  'src/data/projects-new-regions.ts',
  'src/data/projects-new-2026-08.ts',
  'src/data/professionals.ts',
].map((p) => new URL('../' + p, import.meta.url))

/** slug → triangulated target (korter pin, triple-verified against address + lot). */
const MOVES: Record<string, { lat: number; lng: number; lot: string }> = {
  'm2-mtatsminda-park': { lat: 41.68954, lng: 44.77015, lot: '01.15.01.004.070' },
  'biograpi-bare': { lat: 41.69641, lng: 44.81193, lot: '01.17.01.038.023' },
  'domus-sera': { lat: 41.70847, lng: 44.77617, lot: '01.14.11.009.035' },
  'domus-nea': { lat: 41.72118, lng: 44.73505, lot: '01.14.03.040.555' },
  'gumbati-boulevard-point': { lat: 41.62191, lng: 41.59679, lot: '05.32.14.196' },
  'orbi-central-park-towers': { lat: 41.72409, lng: 44.74923, lot: '01.10.16.002.018' },
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
  const naprFile = JSON.parse(readFileSync(NAPR_OUT, 'utf8')) as {
    overrides: Record<string, { lat: number; lng: number; uniqCode: string; ring: [number, number][]; source: 'napr' }>
  }
  const tasFile = JSON.parse(readFileSync(TAS_OUT, 'utf8')) as {
    overrides: Record<string, unknown>
  }

  for (const [slug, t] of Object.entries(MOVES)) {
    const parcel = await fetchNaprParcelAt(t.lat, t.lng)
    if (!parcel) {
      console.log(`${slug} — NAPR has no parcel at target, SKIP`)
      continue
    }
    const half = ringBboxHalfM(parcel.ring)
    if (half > 300) {
      console.log(`${slug} — parcel ${Math.round(half * 2)}m is a tract, SKIP`)
      continue
    }
    const okLot = parcel.uniqCode.endsWith(t.lot) || t.lot.endsWith(parcel.uniqCode) || parcel.uniqCode.includes(t.lot) || t.lot.includes(parcel.uniqCode)
    console.log(
      `${slug} → ${parcel.uniqCode} @ ${parcel.lat.toFixed(6)},${parcel.lng.toFixed(6)} ` +
        `${parcel.ring.length}pt half=${Math.round(half)}m ${okLot ? '(== expected ' + t.lot + ')' : '(DIFFERENT from expected ' + t.lot + ')'}`,
    )
    naprFile.overrides[slug] = {
      lat: parcel.lat,
      lng: parcel.lng,
      uniqCode: parcel.uniqCode,
      ring: parcel.ring,
      source: 'napr',
    }
    delete tasFile.overrides[slug]
    if (patchCoords(slug, parcel.lat, parcel.lng)) console.log(`  coords patched`)
    else console.log(`  !! coords NOT patched`)
    await new Promise((r) => setTimeout(r, 200))
  }

  writeFileSync(
    NAPR_OUT,
    JSON.stringify({ attribution: 'NAPR CadRepGeo (reestri.gov.ge) via maps.gov.ge', updatedAt: new Date().toISOString(), overrides: naprFile.overrides }, geoJsonRound, 2) + '\n',
  )
  writeFileSync(
    TAS_OUT,
    JSON.stringify({ attribution: 'Tbilisi Architecture Service ARCHITECTURE_LR (tas.ge / mgis.tbilisi.gov.ge)', updatedAt: new Date().toISOString(), overrides: tasFile.overrides }, geoJsonRound, 2) + '\n',
  )
  console.log('repair-verified-pins: done')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
