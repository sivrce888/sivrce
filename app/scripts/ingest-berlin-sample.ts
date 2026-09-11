/**
 * Representative Berlin geo seed — StEP Wohnen 2040 (full) + one ALKIS tile.
 * Run: npx --yes tsx scripts/ingest-berlin-sample.ts
 *
 * Does NOT invent projects. Official WFS only (dl-de-zero-2.0).
 * Full-city ALKIS: npm run ingest:alkis -- --geo
 */

import { config } from 'dotenv'
import { resolve } from 'node:path'
import {
  fetchAlkisBuildingsInBbox,
  fetchStepLayer,
  STEP_LAYERS,
  type StepLayerKey,
} from '../src/lib/map/berlin-gov'
import { ringToPolygon, upsertGeoFeature, type GeoKind } from '../src/lib/geo/geo-features'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

/** Alexanderplatz / Mitte — known ALKIS coverage. */
const SAMPLE_BBOX = { west: 13.405, south: 52.518, east: 13.415, north: 52.525 }

const KIND: Record<StepLayerKey, GeoKind> = {
  potential: 'step_potential',
  gemeinwohl: 'step_gemeinwohl',
  quartier: 'step_quartier',
  priority: 'step_priority',
  konzept: 'step_konzept',
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL missing')
  const retrieved = new Date()
  let total = 0

  for (const layer of Object.keys(KIND) as StepLayerKey[]) {
    const feats = await fetchStepLayer(layer)
    let n = 0
    for (const f of feats) {
      if (
        await upsertGeoFeature({
          kind: KIND[layer],
          sourceSlug: 'de-step-wohnen-2040',
          externalId: `${layer}:${f.id}`,
          name: f.name,
          props: f.props,
          geometry: f.geometry,
          sourceUrl: STEP_LAYERS[layer],
          retrievedAt: retrieved,
          confidence: 100,
        })
      )
        n++
    }
    total += n
    console.log(`step ${layer}: +${n}/${feats.length}`)
  }

  const blds = await fetchAlkisBuildingsInBbox(SAMPLE_BBOX, 200)
  let ab = 0
  for (const h of blds) {
    const ext = h.id ?? `${h.lat.toFixed(6)},${h.lng.toFixed(6)}`
    if (
      await upsertGeoFeature({
        kind: 'alkis_building',
        sourceSlug: 'de-alkis',
        externalId: ext,
        name: h.name,
        props: { funktion: h.funktion },
        geometry: ringToPolygon(h.ring),
        sourceUrl: 'https://gdi.berlin.de/services/wfs/alkis_gebaeude',
        retrievedAt: retrieved,
        confidence: 100,
      })
    )
      ab++
  }
  total += ab
  console.log(`alkis sample Mitte: +${ab}/${blds.length}`)
  console.log(`berlin-sample: done ${total}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
