/**
 * Triangulate divergent pins: ours (effective) vs NAPR legal lot vs TAS permit
 * outline vs korter competitor pin. Read-only verdict table.
 * Run: npx --yes tsx scripts/triage-pin-divergence.ts
 */
import { readFileSync } from 'node:fs'
import { PROJECTS } from '../src/data/professionals'
import { ensureNaprOverrides, naprOverrideFor } from '../src/lib/map/napr-overrides'
import { haversineM } from '../src/lib/map/buildings'

const SUSPECTS = process.argv.slice(2)
const korter: { name: string; lat: number; lng: number }[] = JSON.parse(
  readFileSync('/tmp/korter-pins.json', 'utf8'),
)
const footprints = (
  JSON.parse(readFileSync(new URL('../src/data/building-footprints.json', import.meta.url), 'utf8')) as {
    footprints: Record<string, unknown>
  }
).footprints

function pinInRing(lat: number, lng: number, ring: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!
    const [xj, yj] = ring[j]!
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** Multi-part footprint support: any part containing the pin. */
function inFootprint(lat: number, lng: number, fp: unknown): boolean {
  if (!fp || typeof fp !== 'object') return false
  const f = fp as { ring?: [number, number][]; parts?: { ring: [number, number][] }[] }
  if (f.ring) return pinInRing(lat, lng, f.ring)
  if (f.parts) return f.parts.some((p) => pinInRing(lat, lng, p.ring))
  return false
}

const norm = (s: string): string => s.toLowerCase().replace(/m²|m2/g, 'm2').replace(/[^a-z0-9]+/g, '')

async function main() {
  await ensureNaprOverrides()

  for (const slug of SUSPECTS) {
    const p = PROJECTS.find((x) => x.slug === slug)
    if (!p) {
      console.log(`${slug}: not found`)
      continue
    }
    const ov = naprOverrideFor(slug)
    const lat = ov?.lat ?? p.coords.lat
    const lng = ov?.lng ?? p.coords.lng
    const k =
      korter.find((k) => norm(k.name) === norm(p.name)) ??
      korter.find((k) => {
        const nk = norm(k.name)
        return nk.length > 5 && (nk.includes(norm(p.name)) || norm(p.name).includes(nk))
      })
    const naprRing = ov?.source === 'napr' ? ov.ring : null
    const tasRing = ov?.source === 'tas' ? ov.ring : null
    const fp = footprints[`dev-${slug}`] ?? footprints[`bldg-${slug}`] ?? null
    const kInNapr = k && naprRing ? pinInRing(k.lat, k.lng, naprRing) : null
    const kInTas = k && tasRing ? pinInRing(k.lat, k.lng, tasRing) : null
    console.log(
      [
        slug,
        `ours ${lat.toFixed(6)},${lng.toFixed(6)} (${ov ? ov.source : 'catalog'})`,
        `korter ${k ? `${k.lat.toFixed(6)},${k.lng.toFixed(6)} @ ${Math.round(haversineM(lat, lng, k.lat, k.lng))}m` : 'none'}`,
        `korter-in-our-lot: napr=${kInNapr} tas=${kInTas}`,
        `ours-in-footprint=${inFootprint(lat, lng, fp)}`,
        `addr: ${p.location}`,
      ].join(' | '),
    )
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
