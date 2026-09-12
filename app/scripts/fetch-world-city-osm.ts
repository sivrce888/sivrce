/**
 * Geodata: city shell (neighborhoods + landmarks) for every SIVRCE city.
 * Run: npx --yes tsx scripts/fetch-world-city-osm.ts   (~20–35 min, throttled per-city Overpass)
 * Output: src/data/world-city-osm.json — compact, server-only (never import from client).
 * Source: OpenStreetMap via Overpass (ODbL — attribution in map footer + JSON header).
 * Re-run quarterly; data goes stale slowly (neighborhoods/landmarks rarely move).
 * Union: WORLD_PLACES (capitals/megacities) ∪ metro cities ∪ launched-market MAP_CITIES.
 * ponytail: per-city bbox (no 55 km snap errors); hoods ≤80, landmarks ≤50,
 * scored by wikidata/wikipedia/heritage so famous places survive the cap.
 * Ceiling: city-chunk files only if the single JSON hurts lambda cold starts.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { WORLD_PLACES } from '../src/data/world-places'
import { MAP_CITIES_ALL, cityBySlug } from '../src/lib/map/user-place.server'
import metroRaw from '../src/data/world-metro-all.json'

const UA = 'sivrce-maps/1.0 (sivrce888@gmail.com)'
// ponytail: mail.ru-only 2026-09 — de is in 429 cooldown after burst testing;
// re-add 'https://overpass-api.de/api/interpreter' as fallback for later runs.
const ENDPOINTS = ['https://maps.mail.ru/osm/tools/overpass/api/interpreter']

const OUT = new URL('../src/data/world-city-osm.json', import.meta.url)

const HOOD_CAP = 80
const LANDMARK_CAP = 50
/** Same-place fold radius (hood nodes repeat per relation/member). */
const HOOD_MERGE_M = 300
const LANDMARK_MERGE_M = 120
/** ~0.25° lat span ≈ 28 km; lng stretched by 1/cos(lat) to stay round. */
const SPAN_LAT = 0.25

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function overpass(query: string, epOffset = 0): Promise<any[]> {
  const data = `[out:json][timeout:25];${query}`
  for (let e = 0; e < ENDPOINTS.length; e++) {
    const ep = ENDPOINTS[(e + epOffset) % ENDPOINTS.length]!
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(data)}`,
          signal: AbortSignal.timeout(45_000),
        })
        if (res.status === 429 || res.status === 504 || res.status === 509) {
          console.warn(`${ep} ${res.status} — backoff`)
          await sleep(8_000 * (attempt + 1))
          continue
        }
        if (!res.ok) throw new Error(`http ${res.status}`)
        const json = await res.json()
        return json.elements ?? []
      } catch (e) {
        console.warn(`${ep} attempt ${attempt + 1}:`, e instanceof Error ? e.message : e)
        await sleep(3_000 * (attempt + 1))
      }
    }
  }
  return [] // ponytail: skip a dead city rather than kill a multi-hr sweep; re-run fills it
}

function nameOf(tags: Record<string, string>): string {
  return (
    tags.name?.trim() ||
    tags['name:en']?.trim() ||
    tags.int_name?.trim() ||
    tags['name:ru']?.trim() ||
    tags['name:ka']?.trim() ||
    tags['name:fr']?.trim() ||
    tags['name:de']?.trim() ||
    tags['name:es']?.trim() ||
    ''
  )
}

/** Fame score — famous places must survive the cap; 0-score unnamed drop. */
function landmarkScore(tags: Record<string, string>): number {
  let s = 0
  if (tags.wikidata) s += 2
  if (tags.wikipedia) s += 1
  if (tags.heritage || tags['heritage:operator']) s += 1
  if (tags['name:en']) s += 1
  if (tags.tourism === 'museum') s += 1
  if (tags.tourism === 'attraction') s += 1
  return s
}

function haversineM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6_371_000
  const toR = Math.PI / 180
  const dLat = (bLat - aLat) * toR
  const dLng = (bLng - aLng) * toR
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(aLat * toR) * Math.cos(bLat * toR) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)))
}

type Pick = { n: string; la: number; ln: number; score: number }

/** Sort-by-lat fold of same-kind picks within radius (metro-script pattern). */
function fold(raw: Pick[], mergeM: number): Pick[] {
  raw.sort((a, b) => a.la - b.la)
  const kept: Pick[] = []
  for (const p of raw) {
    let target: Pick | null = null
    for (let i = kept.length - 1; i >= 0; i--) {
      const k = kept[i]!
      if (p.la - k.la > 0.004) break
      if (haversineM(p.la, p.ln, k.la, k.ln) <= mergeM) {
        target = k
        break
      }
    }
    if (!target) {
      kept.push(p)
      continue
    }
    if (p.score > target.score || (p.score === target.score && p.n.length > target.n.length)) {
      target.n = p.n
    }
    target.score = Math.max(target.score, p.score)
  }
  return kept
}

async function fetchCity(
  slug: string,
  lat: number,
  lng: number,
  epOffset = 0,
) {
  const latS = Math.max(-85, lat - SPAN_LAT)
  const latN = Math.min(85, lat + SPAN_LAT)
  const lngSpan = Math.min(1.5, SPAN_LAT / Math.max(0.15, Math.cos((lat * Math.PI) / 180)))
  const bb = `${latS.toFixed(4)},${(lng - lngSpan).toFixed(4)},${latN.toFixed(4)},${(lng + lngSpan).toFixed(4)}`

  // One combined query per city (halves sweep wall time); split by tag below.
  // Single in-flight query per worker — mirrors 504 under same-IP parallel load.
  const els = await overpass(`(
  nwr["place"~"^(suburb|quarter|borough)$"](${bb});
  node["place"="neighbourhood"](${bb});
  nwr["tourism"="museum"](${bb});
  nwr["tourism"="attraction"](${bb});
  nwr["historic"~"^(monument|castle)$"](${bb});
);
out center tags;`, epOffset)
  const isHood = (tags: Record<string, string>) =>
    /^(suburb|quarter|borough|neighbourhood)$/.test(tags.place ?? '')
  const hoods: any[] = []
  const marks: any[] = []
  for (const el of els) {
    const tags = (el.tags ?? {}) as Record<string, string>
    ;(isHood(tags) ? hoods : marks).push(el)
  }

  const toPick = (el: any): Pick | null => {
    const lat = typeof el.lat === 'number' ? el.lat : el.center?.lat
    const lon = typeof el.lon === 'number' ? el.lon : el.center?.lon
    if (typeof lat !== 'number' || typeof lon !== 'number') return null
    const tags = (el.tags ?? {}) as Record<string, string>
    if (tags.abandoned === 'yes' || tags.disused === 'yes') return null
    const name = nameOf(tags)
    if (!name) return null
    return { n: name.slice(0, 60), la: Math.round(lat * 1e6) / 1e6, ln: Math.round(lon * 1e6) / 1e6, score: landmarkScore(tags) }
  }

  const hoodRows = fold(hoods.map(toPick).filter((p): p is Pick => !!p), HOOD_MERGE_M)
    .sort((a, b) => a.n.localeCompare(b.n))
    .slice(0, HOOD_CAP)
  const markRows = fold(marks.map(toPick).filter((p): p is Pick => !!p), LANDMARK_MERGE_M)
    .sort((a, b) => b.score - a.score || a.n.localeCompare(b.n))
    .slice(0, LANDMARK_CAP)

  return { h: hoodRows.map(({ n, la, ln }) => [n, la, ln] as [string, number, number]), l: markRows.map(({ n, la, ln }) => [n, la, ln] as [string, number, number]) }
}

async function main() {
  // Union: world places ∪ metro cities ∪ launched-market base cities.
  const slugs = new Map<string, { lat: number; lng: number }>()
  for (const p of WORLD_PLACES) slugs.set(p.slug, { lat: p.lat, lng: p.lng })
  const metroSlugs = [
    ...new Set((metroRaw as { stations: { c: string }[] }).stations.map((s) => s.c)),
  ]
  for (const s of metroSlugs) {
    if (!slugs.has(s)) {
      const c = cityBySlug(s)
      if (c) slugs.set(s, { lat: c.lat, lng: c.lng })
    }
  }
  for (const c of MAP_CITIES_ALL) {
    if (!slugs.has(c.slug)) {
      // Launched-market + base corpus cities only — the 21k GeoNames tail
      // stays live-Overpass-only (a 22k-city sweep would take hours).
      if (c.cc === 'GE' || c.cc === 'DE') slugs.set(c.slug, { lat: c.lat, lng: c.lng })
    }
  }
  console.log(`cities in sweep: ${slugs.size}`)

  // Resume: keep rows for cities already in the checkpointed output.
  const places: { n: string; la: number; ln: number; k: 'h' | 'l'; c: string }[] = []
  let done = new Set<string>()
  try {
    const prev = JSON.parse(readFileSync(OUT, 'utf8')) as { places?: typeof places }
    if (Array.isArray(prev.places) && prev.places.length > 0) {
      places.push(...prev.places)
      done = new Set(prev.places.map((p) => p.c))
      console.log(`resume: ${done.size} cities already fetched`)
    }
  } catch {
    /* first run */
  }

  const todo = [...slugs].filter(([slug]) => !done.has(slug))
  console.log(`to fetch: ${todo.length}`)

  // Single worker — one Overpass query in flight at a time (mirrors 504 under
  // same-IP parallel load; de 429s after bursts). ~3–5 s/city, resume-safe.
  let cursor = 0
  let fetched = 0
  async function worker(w: number) {
    for (;;) {
      const idx = cursor++
      if (idx >= todo.length) return
      const [slug, { lat, lng }] = todo[idx]!
      const shell = await fetchCity(slug, lat, lng, (idx + w) % ENDPOINTS.length)
      for (const [n, la, ln] of shell.h) places.push({ n, la, ln, k: 'h', c: slug })
      for (const [n, la, ln] of shell.l) places.push({ n, la, ln, k: 'l', c: slug })
      fetched++
      if (fetched % 20 === 0) {
        console.log(`[${done.size + fetched}/${slugs.size}] ${slug}: +${shell.h.length}h +${shell.l.length}l (total ${places.length})`)
        writeFileSync(
          OUT,
          JSON.stringify({ attribution: '© OpenStreetMap contributors (ODbL)', fetchedAt: new Date().toISOString().slice(0, 10), count: places.length, places }),
        )
      }
      await sleep(500)
    }
  }
  await Promise.all([worker(0)])

  writeFileSync(
    OUT,
    JSON.stringify({ attribution: '© OpenStreetMap contributors (ODbL)', fetchedAt: new Date().toISOString().slice(0, 10), count: places.length, places }),
  )
  const cities = new Set(places.map((p) => p.c))
  console.log(`wrote ${places.length} places across ${cities.size} cities → ${OUT.pathname}`)
}

main()
