import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { GLOBAL_DIMENSIONS, GLOBAL_PLAYERS, getRankedGlobalPlayers } from './global-competitive'
import { globalOsStats } from './countries/global-os'
import { MARKET_COSTS } from './countries/costs'
import { COUNTRY_IDS, MARKETS } from './markets'
import worldMetro from '../data/world-metro-all.json'

console.log('global-competitive.check: start')

// 1. Weights sum to 1.0
const sumWeight = GLOBAL_DIMENSIONS.reduce((acc, d) => acc + d.weight, 0)
assert.ok(Math.abs(sumWeight - 1.0) < 0.0001, `weights sum to ${sumWeight}, expected 1.0`)

// 2. Evidence files exist on disk for sivrce
const appRoot = path.resolve(__dirname, '..', '..')
const sivrce = GLOBAL_PLAYERS.find((p) => p.id === 'sivrce')
assert.ok(sivrce, 'sivrce player must exist')

for (const dim of GLOBAL_DIMENSIONS) {
  const cell = sivrce.cells[dim.id]
  assert.ok(cell, `sivrce missing cell for ${dim.id}`)
  // Deliberately NOT a floor: a score floor would forbid the card from ever
  // reporting a regression, which is the opposite of an evidence-gated card.
  assert.ok(
    Number.isFinite(cell.score) && cell.score >= 0 && cell.score <= 100,
    `sivrce score for ${dim.id} out of range: ${cell.score}`,
  )
  assert.ok(cell.evidence, `sivrce cell ${dim.id} missing evidence`)
  const fullPath = path.resolve(appRoot, cell.evidence)
  assert.ok(
    fs.existsSync(fullPath),
    `Evidence file for ${dim.id} does not exist: ${fullPath} (repo path: ${cell.evidence})`
  )
}

// 2b. Every number the sivrce notes claim must come from the shipped data.
//     A card that cites counts nobody re-derives is marketing, not evidence.
const stats = globalOsStats()
const stations = (worldMetro as { count?: number; stations?: unknown[] }).stations?.length ?? 0
const currencies = new Set(Object.values(MARKETS).map((m) => m.currency)).size
const claimed = (id: string) => sivrce.cells[id].noteEn
const contains = (id: string, n: number, label: string) =>
  assert.ok(
    claimed(id).includes(n.toLocaleString('en-US')) || claimed(id).includes(String(n)),
    `${id} note must cite the real ${label} (${n.toLocaleString('en-US')}): "${claimed(id)}"`,
  )

contains('globalEntityGraph', stats.countries, 'country count')
contains('globalEntityGraph', stats.metros, 'metro count')
contains('globalEntityGraph', stats.developers, 'developer count')
contains('globalEntityGraph', stats.projects, 'project count')
contains('institutionalValuation', Object.keys(MARKET_COSTS).length, 'costed-market count')
contains('transitConnectivity', stations, 'transit station count')
contains('dualCurrencySettlement', currencies, 'market-currency count')
contains('deepLocalization', COUNTRY_IDS.length, 'localized hub count')

// 3. Derived rankings show SIVRCE as #1
const ranked = getRankedGlobalPlayers()
assert.equal(ranked[0].id, 'sivrce', 'SIVRCE must be ranked #1 globally')
// Rank is the claim; the total is whatever the evidence adds up to. Asserting a
// minimum total would turn a regression into a build that lies instead of fails.
assert.ok(
  ranked[0].total > ranked[1].total,
  `#1 must be strictly ahead of #2: ${ranked[0].total} vs ${ranked[1].total}`,
)

// Print leaderboard
console.log('--- GLOBAL REAL ESTATE INTELLIGENCE LEADERBOARD ---')
for (const p of ranked) {
  const bar = '█'.repeat(Math.round(p.total / 5)).padEnd(20, '·')
  console.log(`  #${p.rank} ${p.name.padEnd(16)} ${p.total.toFixed(1).padStart(5)} /100  ${bar}  [${p.region}]`)
}

console.log('global-competitive.check: OK ✓')
