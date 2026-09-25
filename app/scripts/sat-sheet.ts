/**
 * Satellite evidence sheets — fetch ArcGIS World Imagery tiles around two
 * candidate pins and compose side-by-side sheets (marker = pin) for eyeballing
 * where the real construction is. Run: npx --yes tsx scripts/sat-sheet.ts
 */
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

type Spot = { name: string; lat: number; lng: number }
type Pair = { project: string; z: number; spots: Spot[] }

const PAIRS: Pair[] = [
  {
    project: 'tempo-sensa',
    z: 17,
    spots: [
      { name: 'OURS', lat: 41.7014, lng: 41.7199 },
      { name: 'KORTER', lat: 41.691044, lng: 41.706957 },
    ],
  },
  {
    project: 'alliance-centropolis-b',
    z: 17,
    spots: [
      { name: 'OURS', lat: 41.6508, lng: 41.6295 },
      { name: 'KORTER', lat: 41.644855, lng: 41.618306 },
    ],
  },
  {
    project: 'blox-didi-dighomi',
    z: 18,
    spots: [
      { name: 'OURS', lat: 41.795332, lng: 44.743175 },
      { name: 'KORTER', lat: 41.794634, lng: 44.749217 },
    ],
  },
  {
    project: 'swissotel-kobuleti',
    z: 17,
    spots: [
      { name: 'OURS', lat: 41.820353, lng: 41.776068 },
      { name: 'KORTER', lat: 41.852199, lng: 41.778709 },
    ],
  },
  {
    project: 'domus-sera',
    z: 18,
    spots: [
      { name: 'OURS', lat: 41.708879, lng: 44.761399 },
      { name: 'KORTER', lat: 41.708474, lng: 44.776171 },
    ],
  },
]

const TILE = 256
const GRID = 3 // 3x3 tiles per spot
const OUT = path.resolve(import.meta.dirname ?? '.', '../..', 'research', 'sat-sheets')

function lon2x(lng: number, z: number): number {
  return Math.floor(((lng + 180) / 360) * 2 ** z)
}
function lat2y(lat: number, z: number): number {
  const r = (lat * Math.PI) / 180
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z)
}

async function fetchTile(z: number, x: number, y: number): Promise<Buffer> {
  const url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`
  for (let a = 0; a < 3; a++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
        signal: AbortSignal.timeout(15000),
      })
      if (res.ok) return Buffer.from(await res.arrayBuffer())
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`tile ${z}/${x}/${y} failed`)
}

async function spotImage(z: number, s: Spot): Promise<sharp.Sharp> {
  const cx = lon2x(s.lng, z)
  const cy = lat2y(s.lat, z)
  const tiles: sharp.SharpInput[] = []
  const half = Math.floor(GRID / 2)
  for (let dy = -half; dy <= half; dy++) {
    for (let dx = -half; dx <= half; dx++) {
      tiles.push(await fetchTile(z, cx + dx, cy + dy))
    }
  }
  const size = TILE * GRID
  // ponytail: sharp's bundled Buffer typing predates @types/node 24 — cast, doesn't affect runtime.
  const composites = tiles.map((input, i) => ({
    input,
    left: (i % GRID) * TILE,
    top: Math.floor(i / GRID) * TILE,
  })) as unknown as sharp.OverlayOptions[]
  // Pin marker at exact fractional tile position.
  const fx = ((s.lng + 180) / 360) * 2 ** z - cx
  const fy =
    ((1 - Math.log(Math.tan((s.lat * Math.PI) / 180) + 1 / Math.cos((s.lat * Math.PI) / 180)) / Math.PI) / 2) *
      2 ** z -
    cy
  const mx = Math.round((fx + half) * TILE)
  const my = Math.round((fy + half) * TILE)
  const marker = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${mx}" cy="${my}" r="14" fill="none" stroke="#FF2D00" stroke-width="5"/><circle cx="${mx}" cy="${my}" r="3" fill="#FF2D00"/></svg>`,
  )
  return sharp({ create: { width: size, height: size, channels: 3, background: '#222' } })
    .composite([...composites, { input: marker, left: 0, top: 0 }])
}

async function main() {
  mkdirSync(OUT, { recursive: true })
  for (const pair of PAIRS) {
    const sheets: sharp.Sharp[] = []
    for (const s of pair.spots) sheets.push(await spotImage(pair.z, s))
    const metas = await Promise.all(sheets.map((s) => s.metadata()))
    const h = metas[0]!.height!
    const pngs = await Promise.all(sheets.map((s) => s.png().toBuffer()))
    const buf = await sharp({ create: { width: metas.reduce((a, m) => a + m.width!, 0) + 20, height: h + 40, channels: 3, background: '#fff' } })
      .composite([
        ...pngs.map((png, i) => ({
          input: png,
          left: i * (metas[i]!.width! + 20),
          top: 40,
        })),
        ...pair.spots.map((s, i) => ({
          input: Buffer.from(
            `<svg width="${metas[i]!.width}" height="36"><text x="12" y="26" font-size="26" font-family="sans-serif" fill="#000">${pair.project} · ${s.name}</text></svg>`,
          ),
          left: i * (metas[i]!.width! + 20),
          top: 2,
        })),
      ])
      .jpeg({ quality: 82 })
      .toFile(path.join(OUT, `${pair.project}.jpg`))
    console.log(`${pair.project}.jpg ${buf.width}x${buf.height}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
