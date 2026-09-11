#!/usr/bin/env tsx
/**
 * Ingest OSM buildings + streets for world metros.
 * Fetches from Overpass API → TypeScript arrays
 * Usage: tsx scripts/ingest-global-osm.ts [--metro NYC] [--tier 1]
 */

import { WORLD_METROS } from "../src/data/world-metros"

async function fetchOverpassBuildings(bbox: string, metroCode: string) {
  const query = `[bbox:${bbox}];(way["building"];relation["building"];);out geom;`
  const url = "https://overpass-api.de/api/interpreter"
  const params = new URLSearchParams({ data: query })

  console.log(`⏳ Fetching buildings for ${metroCode}...`)
  try {
    const response = await fetch(`${url}?${params}`, {
      headers: { "Accept-Encoding": "gzip" },
    })
    if (!response.ok) {
      console.warn(`⚠ HTTP ${response.status}`)
      return []
    }
    const json = (await response.json()) as any
    const features = (json.elements || []).filter((el: any) => el.geometry)
    console.log(`✓ ${features.length} buildings for ${metroCode}`)
    return features
  } catch (err) {
    console.error(`✗ Failed:`, err)
    return []
  }
}

function bboxFromMetro(metro: any): string {
  const minLat = metro.lat - 0.5
  const maxLat = metro.lat + 0.5
  const minLng = metro.lng - 0.5
  const maxLng = metro.lng + 0.5
  return `${minLat},${minLng},${maxLat},${maxLng}`
}

async function main() {
  const args = process.argv.slice(2)
  const tierFilter = args.includes("--tier") ? parseInt(args[args.indexOf("--tier") + 1]) : null
  let metros = WORLD_METROS
  if (tierFilter) metros = metros.filter((m) => m.tier === tierFilter)

  console.log(`🌍 Ingesting OSM for ${metros.length} metros...\n`)
  for (const metro of metros) {
    const bbox = bboxFromMetro(metro)
    await fetchOverpassBuildings(bbox, metro.code)
    await new Promise((r) => setTimeout(r, 1000)) // Rate limit
  }
  console.log(`\n✅ Complete.`)
}

main().catch(console.error)
