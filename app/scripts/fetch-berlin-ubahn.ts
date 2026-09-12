/**
 * Geodata: canonical Berlin U-Bahn stations + line membership from OSM route
 * relations (operator BVG, route=subway). Closed stations (e.g. Französische
 * Straße) are excluded automatically — they are not route members.
 * Run: npx --yes tsx scripts/fetch-berlin-ubahn.ts
 * Output: src/data/berlin-ubahn-osm.json (stations merged by name, lines union).
 * Source: OpenStreetMap via Overpass (ODbL). Re-run when BVG opens a station.
 * ponytail: one foreach query; per-line chunking never needed for ~175 rows.
 */

import { writeFileSync } from 'node:fs'

const UA = 'sivrce-maps/1.0 (sivrce888@gmail.com)'
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]
const OUT = new URL('../src/data/berlin-ubahn-osm.json', import.meta.url)

const QUERY = `[out:json][timeout:180];
rel["type"="route"]["route"="subway"]["operator"~"BVG|Berliner Verkehrsbetriebe"];
foreach->.r(
  .r out tags;
  node(r.r)["name"];
  out tags center;
);`

async function main() {
  let elements: any[] | null = null
  for (const ep of ENDPOINTS) {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(QUERY)}`,
        signal: AbortSignal.timeout(120_000),
      })
      if (!res.ok) throw new Error(`http ${res.status}`)
      elements = ((await res.json()) as { elements?: any[] }).elements ?? []
      break
    } catch (e) {
      console.warn(`${ep}:`, e instanceof Error ? e.message : e)
    }
  }
  if (!elements) throw new Error('all Overpass endpoints failed')

  const byName = new Map<string, { n: string; la: number; ln: number; l: string[] }>()
  let currentLine = ''
  let lines = new Set<string>()
  for (const el of elements) {
    if (el.type === 'relation') {
      currentLine = el.tags?.ref?.trim() ?? ''
      if (currentLine) lines.add(currentLine)
      continue
    }
    if (el.type !== 'node' || !currentLine) continue
    const t = el.tags ?? {}
    const isStop =
      t.railway === 'station' || t.railway === 'stop_position' ||
      t.public_transport === 'station' || t.public_transport === 'stop_position'
    if (!isStop) continue
    const name = t.name?.trim()
    const lat = typeof el.lat === 'number' ? el.lat : el.center?.lat
    const lon = typeof el.lon === 'number' ? el.lon : el.center?.lon
    if (!name || typeof lat !== 'number' || typeof lon !== 'number') continue
    if (lat < 52.2 || lat > 52.8 || lon < 12.9 || lon > 13.9) continue // Berlin bbox sanity
    const prev = byName.get(name)
    if (!prev) byName.set(name, { n: name, la: lat, ln: lon, l: [currentLine] })
    else if (!prev.l.includes(currentLine)) prev.l.push(currentLine)
  }
  const stations = [...byName.values()]
    .sort((a, b) => a.n.localeCompare(b.n, 'de'))
    .map((s) => ({ ...s, la: Math.round(s.la * 1e6) / 1e6, ln: Math.round(s.ln * 1e6) / 1e6 }))
  console.log(`lines: ${[...lines].sort().join(', ')}`)
  console.log(`stations: ${stations.length}`)

  writeFileSync(
    OUT,
    JSON.stringify(
      {
        attribution: '© OpenStreetMap contributors (ODbL)',
        fetchedAt: new Date().toISOString().slice(0, 10),
        count: stations.length,
        stations,
      },
      null,
      0,
    ),
  )
  console.log(`wrote → ${OUT.pathname}`)
}

main()
