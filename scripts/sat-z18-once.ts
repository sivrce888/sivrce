import { mkdirSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
const TILE = 256, GRID = 3
const SPOTS: [string, number, number][] = [
  ['tempo-sensa-KORTER', 41.691044, 41.706957],
  ['centropolis-KORTER', 41.644855, 41.618306],
  ['swissotel-KORTER', 41.852199, 41.778709],
  ['blox-KORTER', 41.794634, 44.749217],
]
const lon2x = (lng: number, z: number) => Math.floor(((lng + 180) / 360) * 2 ** z)
const lat2y = (lat: number, z: number) => Math.floor(((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2) * 2 ** z)
async function tile(z: number, x: number, y: number) {
  const res = await fetch(`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(15000) })
  return Buffer.from(await res.arrayBuffer())
}
async function main() {
mkdirSync('/tmp/sat-z18', { recursive: true })
for (const [name, lat, lng] of SPOTS) {
  const z = 18, cx = lon2x(lng, z), cy = lat2y(lat, z), half = 1
  const tiles = []
  for (let dy = -half; dy <= half; dy++) for (let dx = -half; dx <= half; dx++) tiles.push(await tile(z, cx + dx, cy + dy))
  const fx = ((lng + 180) / 360) * 2 ** z - cx
  const fy = ((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2) * 2 ** z - cy
  const mx = Math.round((fx + half) * TILE), my = Math.round((fy + half) * TILE)
  const marker = Buffer.from(`<svg width="${TILE*GRID}" height="${TILE*GRID}"><circle cx="${mx}" cy="${my}" r="16" fill="none" stroke="#FF2D00" stroke-width="6"/><circle cx="${mx}" cy="${my}" r="4" fill="#FF2D00"/></svg>`)
  await sharp({ create: { width: TILE*GRID, height: TILE*GRID, channels: 3, background: '#222' } })
    .composite([...tiles.map((t, i) => ({ input: t, left: (i % GRID) * TILE, top: Math.floor(i / GRID) * TILE })), { input: marker, left: 0, top: 0 }])
    .jpeg({ quality: 85 }).toFile(path.join('/tmp/sat-z18', name + '.jpg'))
  console.log(name)
}
}
