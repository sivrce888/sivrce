/**
 * Competitor cross-check — our project pins vs korter.ge pins for the same
 * developments (korter exposes location {lat,lng} per ongoing building).
 * Third leg of the geo triple-check: NAPR (legal lot) + TAS (permit outline)
 * + korter/OSM (competitor rendering). Audit only, writes nothing.
 * Run: npx --yes tsx scripts/crosscheck-korter-pins.ts [citySlug ...]
 */
import { writeFileSync } from 'node:fs'
import { PROJECTS } from '../src/data/professionals'
import { extractState } from '../src/lib/directory/sync-korter'
import { haversineM } from '../src/lib/map/buildings'
import { ensureNaprOverrides, naprOverrideFor } from '../src/lib/map/napr-overrides'

const BASE = 'https://korter.ge'
const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; sivrce-geo-audit/1.0)' }
const GEOS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['tbilisi', 'batumi', 'kutaisi', 'rustavi', 'kobuleti', 'bakuriani', 'poti', 'ureki', 'zugdidi', 'mtskheta', 'gori', 'gurjaani']

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function fetchState(url: string): Promise<Record<string, unknown> | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: UA })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const state = extractState(await res.text())
      if (state) return state as Record<string, unknown>
    } catch {
      /* retry */
    }
    await sleep(400 * (attempt + 1))
  }
  return null
}

const norm = (s: string): string => s.toLowerCase().replace(/m²|m2/g, 'm2').replace(/[^a-z0-9]+/g, '')

interface KorterBldg {
  name: string
  location?: { lat: number; lng: number } | null
  address?: string
}

async function main() {
  await ensureNaprOverrides()
  const ours = PROJECTS.filter(
    (p) =>
      p.done < 100 &&
      Number.isFinite(p.coords?.lat) &&
      Number.isFinite(p.coords?.lng) &&
      !p.cc, // Georgia market only — world rows match korter names by accident
  )
  const byNorm = new Map<string, typeof ours[number]>()
  for (const p of ours) byNorm.set(norm(p.name), p)

  const korter: { name: string; lat: number; lng: number }[] = []
  const devLinks = new Set<string>()
  for (const geo of GEOS) {
    const state = await fetchState(`${BASE}/en/developers-in-${geo}`)
    const devs = (state?.developerListingStore as { developers?: { link: string }[] } | undefined)
      ?.developers ?? []
    for (const d of devs) devLinks.add(d.link)
    console.log(`${geo}: ${devs.length} developers`)
    await sleep(300)
  }
  console.log(`fetching ${devLinks.size} developer pages…`)
  let i = 0
  for (const link of devLinks) {
    const state = await fetchState(`${BASE}${link}`)
    const bldgs = (state?.developerLandingStore as { ongoingBuildings?: { buildings?: KorterBldg[] } } | undefined)
      ?.ongoingBuildings?.buildings ?? []
    for (const b of bldgs) {
      if (b.location && Number.isFinite(b.location.lat) && Number.isFinite(b.location.lng)) {
        korter.push({ name: b.name, lat: b.location.lat, lng: b.location.lng })
      }
    }
    if (++i % 20 === 0) console.log(`… ${i}/${devLinks.size} (${korter.length} pinned buildings)`)
    await sleep(250)
  }
  console.log(`korter: ${korter.length} ongoing buildings with pins`)

  // Match by normalized name; fall back to containment. Distance uses the
  // EFFECTIVE pin (TAS/NAPR override wins over catalog coords) — that is what
  // the map actually renders.
  writeFileSync('/tmp/korter-pins.json', JSON.stringify(korter))
  let matched = 0
  const rows: { slug: string; d: number }[] = []
  const unmatchedOurs: string[] = []
  for (const p of ours) {
    const key = norm(p.name)
    const hit =
      korter.find((k) => norm(k.name) === key) ??
      korter.find((k) => {
        const nk = norm(k.name)
        return nk.length > 5 && (nk.includes(key) || key.includes(nk))
      })
    if (!hit) {
      unmatchedOurs.push(`${p.slug} (${p.city})`)
      continue
    }
    matched++
    const ov = naprOverrideFor(p.slug)
    const lat = ov?.lat ?? p.coords.lat
    const lng = ov?.lng ?? p.coords.lng
    const d = haversineM(lat, lng, hit.lat, hit.lng)
    rows.push({ slug: p.slug, d })
  }
  rows.sort((a, b) => b.d - a.d)
  console.log(`matched ${matched}/${ours.length} — distance distribution vs korter pin:`)
  const buckets = [25, 50, 100, 200, 500, Infinity]
  for (let b = 0; b < buckets.length; b++) {
    const lo = b === 0 ? 0 : buckets[b - 1]!
    console.log(`  ≤${buckets[b] === Infinity ? '∞' : buckets[b]}m: ${rows.filter((r) => r.d > lo && r.d <= buckets[b]!).length}`)
  }
  console.log('--- worst 30 ---')
  for (const r of rows.slice(0, 30)) console.log(`${Math.round(r.d)}m  ${r.slug}`)
  console.log('--- ours with no korter twin (sample) ---')
  for (const u of unmatchedOurs.slice(0, 25)) console.log(u)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
