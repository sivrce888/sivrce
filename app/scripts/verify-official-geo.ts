/**
 * Verify every project pin against the official NAPR cadastral map (maps.gov.ge).
 * Fills napr-pin-overrides.json with legal lot rings; audits code mismatches.
 * Run: npx --yes tsx scripts/verify-official-geo.ts [--write]
 * Without --write: audit only, no files touched.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { PROJECTS } from '../src/data/professionals'
import { fetchNaprParcelAt, fetchNaprParcelByCode, type NaprParcel } from '../src/lib/map/napr-parcel'
import { haversineM } from '../src/lib/map/buildings'
import { ringBboxHalfM } from '../src/lib/map/footprint-circle'

/** Identify sometimes returns the surrounding tract (hill/forest), not the lot. */
const TRACT_HALF_M = 300

const WRITE = process.argv.includes('--write')
const OUT = new URL('../src/data/napr-pin-overrides.json', import.meta.url)

/** Ray casting, [lng,lat] closed-or-unclosed ring. */
function pinInRing(lat: number, lng: number, ring: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!
    const [xj, yj] = ring[j]!
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

async function main() {
  const list = PROJECTS.filter((p) => Number.isFinite(p.coords?.lat) && Number.isFinite(p.coords?.lng))
  console.log(`verify-official-geo: ${list.length} projects with coords`)

  const prev = existsSync(OUT)
    ? (JSON.parse(readFileSync(OUT, 'utf8')) as {
        overrides?: Record<string, { lat: number; lng: number; uniqCode: string; ring: [number, number][]; source: 'napr' }>
      }).overrides ?? {}
    : {}
  const overrides = { ...prev }

  let inside = 0
  let nearby = 0
  let noParcel = 0
  let codeMismatch = 0
  let codeOk = 0
  const mismatchRows: string[] = []
  const CHUNK = 3
  for (let i = 0; i < list.length; i += CHUNK) {
    const chunk = list.slice(i, i + CHUNK)
    await Promise.all(
      chunk.map(async (p) => {
        const atPin = await fetchNaprParcelAt(p.coords.lat, p.coords.lng)
        const dPin = atPin ? haversineM(p.coords.lat, p.coords.lng, atPin.lat, atPin.lng) : Infinity

        // Cadastral code cross-check — copy-pasted codes snap to the wrong lot.
        if (p.cadastral) {
          const byCode = await fetchNaprParcelByCode(p.cadastral)
          if (byCode) {
            const d = haversineM(p.coords.lat, p.coords.lng, byCode.lat, byCode.lng)
            const same = atPin && byCode.uniqCode === atPin.uniqCode
            if (d > 150 && !same) {
              codeMismatch++
              mismatchRows.push(
                `MISMATCH ${p.slug}: code ${p.cadastral} → ${Math.round(d)}m away` +
                  (atPin ? ` · pin lot = ${atPin.uniqCode}` : ' · no lot at pin'),
              )
            } else codeOk++
          }
        }

        if (!atPin) {
          noParcel++
          console.log(`${p.slug} — no parcel at pin`)
          return
        }
        if (ringBboxHalfM(atPin.ring) > TRACT_HALF_M) {
          noParcel++
          console.log(`${p.slug} — tract ${Math.round(ringBboxHalfM(atPin.ring) * 2)}m, not a lot — skip`)
          return
        }
        if (pinInRing(p.coords.lat, p.coords.lng, atPin.ring)) {
          inside++
          console.log(`${p.slug} ✓ inside ${atPin.uniqCode} (${atPin.ring.length}pt)`)
        } else if (dPin <= 60) {
          nearby++
          console.log(`${p.slug} ~ ${Math.round(dPin)}m from ${atPin.uniqCode}`)
        } else {
          noParcel++
          console.log(`${p.slug} ! nearest lot ${Math.round(dPin)}m (${atPin.uniqCode}) — skip`)
          return
        }
        overrides[p.slug] = {
          lat: atPin.lat,
          lng: atPin.lng,
          uniqCode: atPin.uniqCode,
          ring: atPin.ring,
          source: 'napr',
        }
      }),
    )
    if (i % 30 === 0) console.log(`… ${i}/${list.length}`)
    await new Promise((r) => setTimeout(r, 150))
  }

  if (WRITE) {
    writeFileSync(
      OUT,
      JSON.stringify(
        {
          attribution: 'NAPR CadRepGeo (reestri.gov.ge) via maps.gov.ge',
          updatedAt: new Date().toISOString(),
          overrides,
        },
        null,
        2,
      ) + '\n',
    )
  }
  console.log(
    `verify-official-geo: inside ${inside}, nearby ${nearby}, no/near-lot-fail ${noParcel}, code ok ${codeOk}, code MISMATCH ${codeMismatch}, overrides ${Object.keys(overrides).length}${WRITE ? ' (written)' : ' (dry run)'}`,
  )
  for (const row of mismatchRows) console.log(row)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
