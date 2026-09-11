/**
 * Representative Berlin geo seed — StEP Wohnen 2040 (full) + ALKIS Mitte tile
 * (buildings + parcels) + B-Pläne in the same bbox.
 * Official WFS only (dl-de-zero-2.0).
 * Run: npx --yes tsx scripts/ingest-berlin-sample.ts
 * Full-city ALKIS: npm run ingest:alkis -- --geo
 *
 * ponytail: batch SQL for ALKIS; StEP stays row upserts (≤1.6k, already fast enough).
 */

import { config } from 'dotenv'
import { resolve } from 'node:path'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import {
  fetchAlkisBuildingsInBbox,
  fetchAlkisParcelsInBbox,
  fetchBplanInBbox,
  fetchStepLayer,
  BPLAN_LAYERS,
  STEP_LAYERS,
  type BplanLayerKey,
  type StepLayerKey,
} from '../src/lib/map/berlin-gov'
import { upsertGeoFeature, type GeoKind } from '../src/lib/geo/geo-features'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

const SAMPLE_BBOX = { west: 13.405, south: 52.518, east: 13.415, north: 52.525 }

const KIND: Record<StepLayerKey, GeoKind> = {
  potential: 'step_potential',
  gemeinwohl: 'step_gemeinwohl',
  quartier: 'step_quartier',
  priority: 'step_priority',
  konzept: 'step_konzept',
}

const BPLAN_KIND: Record<BplanLayerKey, GeoKind> = {
  festgesetzt: 'bplan_festgesetzt',
  verfahren: 'bplan_verfahren',
}

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL missing')
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

  const pool = new Pool({
    connectionString: /uselibpqcompat=/i.test(url)
      ? url
      : `${url}${url.includes('?') ? '&' : '?'}uselibpqcompat=true`,
    max: 1,
  })
  const db = new PrismaClient({ adapter: new PrismaPg(pool) })
  try {
    const blds = await fetchAlkisBuildingsInBbox(SAMPLE_BBOX, 200)
    if (blds.length) {
      const payload = JSON.stringify(
        blds.map((h) => ({
          id: h.id ?? `${h.lat.toFixed(6)},${h.lng.toFixed(6)}`,
          lat: h.lat,
          lng: h.lng,
          name: h.name,
          funktion: h.funktion,
          floors: h.floors,
          heightM: h.heightM,
          heightSource: h.heightSource,
          geom: JSON.stringify({ type: 'Polygon', coordinates: [h.ring] }),
        })),
      )
      await db.$executeRaw`
        INSERT INTO geo_features (
          kind, city, country, source_slug, external_id, name, props,
          geom, lat, lng, license, source_url, retrieved_at, confidence
        )
        SELECT
          'alkis_building', 'berlin', 'DE', 'de-alkis', x->>'id', NULLIF(x->>'name', ''),
          jsonb_build_object(
            'funktion', x->>'funktion',
            'floors', NULLIF(x->>'floors', '')::int,
            'height_m', NULLIF(x->>'heightM', '')::float8,
            'height_source', NULLIF(x->>'heightSource', '')
          ),
          ST_SetSRID(ST_GeomFromGeoJSON(x->>'geom'), 4326),
          (x->>'lat')::float8, (x->>'lng')::float8, 'dl-de-zero-2.0',
          'https://gdi.berlin.de/services/wfs/alkis_gebaeude', ${retrieved}, 100
        FROM jsonb_array_elements(${payload}::jsonb) AS t(x)
        ON CONFLICT (source_slug, external_id) DO UPDATE SET
          name = EXCLUDED.name, props = EXCLUDED.props, geom = EXCLUDED.geom,
          retrieved_at = EXCLUDED.retrieved_at, updated_at = NOW()
      `
      total += blds.length
    }
    console.log(`alkis buildings Mitte: +${blds.length}`)

    const parcels = await fetchAlkisParcelsInBbox(SAMPLE_BBOX, 200)
    if (parcels.length) {
      const payload = JSON.stringify(
        parcels.map((p) => ({
          id: p.kennzeichen,
          lat: p.lat,
          lng: p.lng,
          area: p.areaM2,
          geom: JSON.stringify({ type: 'Polygon', coordinates: [p.ring] }),
        })),
      )
      await db.$executeRaw`
        INSERT INTO geo_features (
          kind, city, country, source_slug, external_id, name, props,
          geom, lat, lng, license, source_url, retrieved_at, confidence
        )
        SELECT
          'alkis_parcel', 'berlin', 'DE', 'de-alkis', x->>'id', x->>'id',
          jsonb_build_object('area_m2', NULLIF(x->>'area', '')::float8, 'kennzeichen', x->>'id'),
          ST_SetSRID(ST_GeomFromGeoJSON(x->>'geom'), 4326),
          (x->>'lat')::float8, (x->>'lng')::float8, 'dl-de-zero-2.0',
          'https://gdi.berlin.de/services/wfs/alkis_flurstuecke', ${retrieved}, 100
        FROM jsonb_array_elements(${payload}::jsonb) AS t(x)
        ON CONFLICT (source_slug, external_id) DO UPDATE SET
          props = EXCLUDED.props, geom = EXCLUDED.geom,
          retrieved_at = EXCLUDED.retrieved_at, updated_at = NOW()
      `
      total += parcels.length
    }
    console.log(`alkis parcels Mitte: +${parcels.length}`)

    for (const layer of Object.keys(BPLAN_KIND) as BplanLayerKey[]) {
      const feats = await fetchBplanInBbox(layer, SAMPLE_BBOX, 200)
      let n = 0
      for (const f of feats) {
        if (
          await upsertGeoFeature({
            kind: BPLAN_KIND[layer],
            sourceSlug: 'de-bplaene',
            externalId: `${layer}:${f.id}`,
            name: f.name,
            props: f.props,
            geometry: f.geometry,
            sourceUrl: BPLAN_LAYERS[layer],
            retrievedAt: retrieved,
            confidence: 100,
          })
        )
          n++
      }
      total += n
      console.log(`bplan ${layer} Mitte: +${n}/${feats.length}`)
    }
  } finally {
    await db.$disconnect()
    await pool.end()
  }
  console.log(`berlin-sample: done ${total}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
