import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { GLOBAL_DIMENSIONS, GLOBAL_PLAYERS, getRankedGlobalPlayers } from './global-competitive'

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
  assert.ok(cell.score >= 90, `sivrce score for ${dim.id} should be >= 90`)
  assert.ok(cell.evidence, `sivrce cell ${dim.id} missing evidence`)
  const fullPath = path.resolve(appRoot, cell.evidence)
  assert.ok(
    fs.existsSync(fullPath),
    `Evidence file for ${dim.id} does not exist: ${fullPath} (repo path: ${cell.evidence})`
  )
}

// 3. Derived rankings show SIVRCE as #1
const ranked = getRankedGlobalPlayers()
assert.equal(ranked[0].id, 'sivrce', 'SIVRCE must be ranked #1 globally')
assert.ok(ranked[0].total >= 94, `SIVRCE total score should be >= 94, got ${ranked[0].total}`)

// Print leaderboard
console.log('--- GLOBAL REAL ESTATE INTELLIGENCE LEADERBOARD ---')
for (const p of ranked) {
  const bar = '█'.repeat(Math.round(p.total / 5)).padEnd(20, '·')
  console.log(`  #${p.rank} ${p.name.padEnd(16)} ${p.total.toFixed(1).padStart(5)} /100  ${bar}  [${p.region}]`)
}

console.log('global-competitive.check: OK ✓')
