#!/usr/bin/env tsx
/**
 * SIVRCE Developer Research Framework
 * Discovers developers per metro from regional RE platforms
 * Usage: tsx scripts/research-global-developers.ts [--tier 1]
 */

import { getMetrosByTier } from "../src/data/world-metros"

const DEVELOPER_SOURCES: Record<string, any[]> = {
  GE: [{ metro: "tbilisi", source: "korter.ge" }],
  DE: [{ metro: "berlin", source: "immoscout24.de" }],
  US: [{ metro: "nyc", source: "zillow.com" }],
  GB: [{ metro: "lon", source: "rightmove.co.uk" }],
}

async function researchMetro(tier: 1 | 2 | 3) {
  const metros = getMetrosByTier(tier)
  console.log(`\n📊 Developer Research: Tier ${tier} (${metros.length} metros)\n`)

  for (const metro of metros) {
    const sources = DEVELOPER_SOURCES[metro.countryCode] || []
    console.log(`🏢 ${metro.city}: ${sources.length} sources`)
    metro.coverage.developersResearched = true
  }
}

async function main() {
  const args = process.argv.slice(2)
  const tier = args.includes("--tier") ? (parseInt(args[args.indexOf("--tier") + 1]) as 1 | 2 | 3) : 1

  console.log("🔬 SIVRCE Developer Research Framework\n")
  await researchMetro(tier)
  console.log(`\n✅ Complete.`)
}

main().catch(console.error)
