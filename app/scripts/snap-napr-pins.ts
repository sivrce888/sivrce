/**
 * Snap known project pins to NAPR parcel centroids when CadRepGeo is up.
 * Run: npx --yes tsx scripts/snap-napr-pins.ts
 * Writes src/data/napr-pin-overrides.json (lat/lng/uniqCode/ring). Merged at map runtime.
 * Exit 0 even when upstream is down (prints SKIP).
 */

import { writeFileSync } from 'node:fs'
import { fetchNaprParcelByCode, probeNaprCadRep } from '../src/lib/map/napr-parcel'

/** Curated cadastral codes — only human-verified UNIQ_CODE rows. */
const KNOWN: Array<{ slug: string; code: string }> = [
  { slug: 'axis-avlabari', code: '01.17.13.045.217' },
]

const OUT = new URL('../src/data/napr-pin-overrides.json', import.meta.url)

async function main() {
  const up = await probeNaprCadRep()
  if (!up) {
    console.log('snap-napr-pins: SKIP CadRepGeo down (503) — retry later')
    return
  }

  const overrides: Record<
    string,
    { lat: number; lng: number; uniqCode: string; ring: [number, number][]; source: 'napr' }
  > = {}

  for (const row of KNOWN) {
    const p = await fetchNaprParcelByCode(row.code)
    if (!p) {
      console.log(`${row.slug} ${row.code} — not found`)
      continue
    }
    overrides[row.slug] = {
      lat: p.lat,
      lng: p.lng,
      uniqCode: p.uniqCode,
      ring: p.ring,
      source: 'napr',
    }
    console.log(`${row.slug} → ${p.uniqCode} @ ${p.lat.toFixed(6)},${p.lng.toFixed(6)} (${p.ring.length}pt)`)
  }

  writeFileSync(
    OUT,
    JSON.stringify(
      {
        attribution: 'NAPR CadRepGeo (reestri.gov.ge)',
        updatedAt: new Date().toISOString(),
        overrides,
      },
      null,
      2,
    ) + '\n',
  )
  console.log(`snap-napr-pins: wrote ${Object.keys(overrides).length} overrides`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
