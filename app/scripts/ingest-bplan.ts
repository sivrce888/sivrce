/**
 * Berlin Bebauungspläne → geo_features (festgesetzt + im Verfahren).
 * Run: npx --yes tsx scripts/ingest-bplan.ts
 *
 * Source: GDI Berlin WFS bplan (dl-de-zero-2.0). TypeNames verified live
 * 2026-09. Repealed (`bplan:c_bp_ak`) is intentionally not ingested.
 * ponytail: full-layer GetFeature (~4k polygons); upgrade → tiled WFS if count grows.
 */

import { config } from 'dotenv'
import { resolve } from 'node:path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

const KIND = {
  festgesetzt: 'bplan_festgesetzt',
  verfahren: 'bplan_verfahren',
} as const

async function main() {
  const { fetchBplanLayer, BPLAN_LAYERS } = await import('../src/lib/map/berlin-gov')
  const { upsertGeoFeatures } = await import('../src/lib/geo/geo-features')
  const layers = Object.keys(BPLAN_LAYERS) as Array<keyof typeof BPLAN_LAYERS>
  let total = 0
  for (const layer of layers) {
    const feats = await fetchBplanLayer(layer)
    const n = await upsertGeoFeatures(
      feats.map((f) => ({
        kind: KIND[layer],
        sourceSlug: 'de-bplaene',
        externalId: `${layer}:${f.id}`,
        name: f.name,
        props: f.props,
        geometry: f.geometry,
        license: 'dl-de-zero-2.0',
        sourceUrl: BPLAN_LAYERS[layer],
        confidence: 100,
      })),
    )
    total += n
    console.log(`bplan/${layer}: ${n}/${feats.length}`)
  }
  console.log(`berlin/bplan: done ${total}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
