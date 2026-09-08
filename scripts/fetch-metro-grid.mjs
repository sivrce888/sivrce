// one-off: precompute walking-nearest metro per ~400 m grid cell via Valhalla demo (pedestrian).
// output: app/src/data/tbilisi-metro-grid.json — read by src/lib/map/pois.ts nearestMetro().
// ponytail: pedestrian profile matches the chip's walk-min semantics; rerun when OSM roads change.
//   usage: node scripts/fetch-metro-grid.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const VALHALLA = 'https://valhalla1.openstreetmap.de/sources_to_targets'
const LAT0 = 41.62
const LNG0 = 44.66
const STEP = 0.004 // ~445 m lat, ~335 m lng in Tbilisi
const NLAT = Math.round((41.84 - LAT0) / STEP) + 1
const NLNG = Math.round((44.92 - LNG0) / STEP) + 1
const REACH_M = 5500 // straight-line — cells beyond any station never show a chip
const MAX_PAIRS = 100 // demo matrix limit is sources x targets

const pois = JSON.parse(readFileSync(new URL('../app/src/data/tbilisi-pois.json', import.meta.url)))
const stations = pois.pois.filter((p) => p.category === 'metro' && Number.isFinite(p.lat))

function haversineM(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toR = Math.PI / 180
  const dLat = (lat2 - lat1) * toR
  const dLng = (lng2 - lng1) * toR
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * toR) * Math.cos(lat2 * toR) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)))
}

const cells = new Array(NLAT * NLNG).fill(-1)
const todo = []
for (let r = 0; r < NLAT; r++) {
  for (let c = 0; c < NLNG; c++) {
    const lat = LAT0 + r * STEP
    const lng = LNG0 + c * STEP
    let min = Infinity
    for (const s of stations) min = Math.min(min, haversineM(lat, lng, s.lat, s.lng))
    if (min <= REACH_M) todo.push([r * NLNG + c, lat, lng])
  }
}
console.log(`grid ${NLAT}x${NLNG}, ${todo.length}/${cells.length} cells in reach`)

const targets = stations.map((s) => ({ lat: s.lat, lon: s.lng }))
const TOTAL = todo.length
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let done = 0
while (todo.length > 0) {
  // dynamic chunk: only stations within 6 km straight of any chunked cell, keep pairs <= 100
  const size = Math.min(todo.length, 12)
  const chunk = todo.slice(0, size)
  const nearStations = stations
    .map((s, si) => ({
      si,
      near: chunk.some(([, lat, lng]) => haversineM(lat, lng, s.lat, s.lng) <= 6000),
    }))
    .filter((s) => s.near)
  while (chunk.length * nearStations.length > MAX_PAIRS) chunk.pop()
  if (chunk.length === 0 || nearStations.length === 0) {
    todo.splice(0, size)
    continue
  }
  const body = JSON.stringify({
    sources: chunk.map(([, lat, lng]) => ({ lat, lon: lng })),
    targets: nearStations.map((s) => targets[s.si]),
    costing: 'pedestrian',
  })
  let matrix = null
  for (let attempt = 1; attempt <= 3 && !matrix; attempt++) {
    try {
      const res = await fetch(VALHALLA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      if (res.ok) matrix = (await res.json()).sources_to_targets ?? null
    } catch {
      /* retry */
    }
    if (!matrix) {
      console.log(`  retry ${attempt} (${done}/${TOTAL})`)
      await sleep(1500)
    }
  }
  if (!matrix) {
    console.error(`giving up on chunk at cell ${chunk[0][0]}`)
    process.exit(1)
  }
  chunk.forEach(([flat], j) => {
    let bestI = -1
    let bestM = Infinity
    matrix[j].forEach((t, k) => {
      const m = t?.distance == null ? null : t.distance * 1000
      if (m != null && m < bestM) {
        bestM = m
        bestI = nearStations[k].si
      }
    })
    if (bestI >= 0) cells[flat] = bestI * 100000 + Math.round(bestM)
  })
  todo.splice(0, chunk.length)
  done += chunk.length
  if (done % 240 < size) console.log(`  ${done}/${TOTAL}`)
  await sleep(200)
}

const out = {
  lat0: LAT0,
  lng0: LNG0,
  step: STEP,
  nLat: NLAT,
  nLng: NLNG,
  stations: stations.map((s) => s.name),
  cells,
}
writeFileSync(
  new URL('../app/src/data/tbilisi-metro-grid.json', import.meta.url),
  JSON.stringify(out),
)
const filled = cells.filter((v) => v >= 0)
const sample = (lat, lng) => {
  const v = cells[Math.round((lat - LAT0) / STEP) * NLNG + Math.round((lng - LNG0) / STEP)]
  return v < 0 ? 'none' : `${stations[Math.floor(v / 100000)].name} ${v % 100000} m`
}
console.log(`wrote ${filled.length} cells`)
console.log('Beliashvili 68 →', sample(41.770753, 44.778825))
console.log('massive north  →', sample(41.788, 44.77))
console.log('Rustaveli      →', sample(41.703497, 44.7896467))
