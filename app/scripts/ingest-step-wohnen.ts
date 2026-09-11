/**
 * StEP Wohnen 2040 (Berlin) → geo_features.
 * Run: npx --yes tsx scripts/ingest-step-wohnen.ts
 *
 * Source: GDI Berlin WFS step_wo_2040 (dl-de-zero-2.0). Official housing
 * potentials + Neue Stadtquartiere — verified typeNames in berlin-gov.ts.
 * ponytail: full-layer GetFeature (sets ≤1055); upgrade → tiled WFS if count grows.
 */

import { config } from 'dotenv'
import { resolve } from 'node:path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

const KIND = {
  potential: 'step_potential',
  gemeinwohl: 'step_gemeinwohl',
  quartier: 'step_quartier',
  priority: 'step_priority',
  konzept: 'step_konzept',
} as const

async function main() {
  const { fetchStepLayer, STEP_LAYERS } = await import('../src/lib/map/berlin-gov')
  const { upsertGeoFeatures } = await import('../src/lib/geo/geo-features')
  const layers = Object.keys(STEP_LAYERS) as Array<keyof typeof STEP_LAYERS>
  let total = 0
  for (const layer of layers) {
    const feats = await fetchStepLayer(layer)
    const n = await upsertGeoFeatures(
      feats.map((f) => ({
        kind: KIND[layer],
        sourceSlug: 'de-step-wohnen-2040',
        externalId: `${layer}:${f.id}`,
        name: f.name,
        props: f.props,
        geometry: f.geometry,
        license: 'dl-de-zero-2.0',
        sourceUrl: 'https://gdi.berlin.de/services/wfs/step_wo_2040',
        confidence: 100,
      })),
    )
    total += n
    console.log(`step/${layer}: ${n}/${feats.length}`)
  }
  console.log(`berlin/step: done ${total}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
