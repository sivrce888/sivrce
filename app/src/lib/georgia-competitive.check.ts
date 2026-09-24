/**
 * Self-check for the Georgia competitive scorecard (no network).
 * Run: npx tsx src/lib/georgia-competitive.check.ts
 *
 * The integrity contract: every sivrce score must point at a real, SHIPPED
 * repo file, the coverage number must equal the shipped GE data modules, and
 * the two honest gaps (board inventory, stays scale) must stay honest.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  GE_INVENTORY,
  GEORGIA_DIMENSIONS,
  GEORGIA_PLAYERS,
  georgiaCoverageScore,
  georgiaDimension,
  georgiaScorecard,
  sivrceGeorgiaStanding,
  weightedTotal,
} from './georgia-competitive'
import { STREETS } from '../data/tbilisi-streets'
import { BUILDINGS } from '../data/buildings'
import { DEVELOPERS, PROJECTS } from '../data/professionals'
import { unshippedEvidence } from './scorecard-evidence'

// Measured coverage cannot drift from the shipped data modules.
assert.equal(GE_INVENTORY.streets, STREETS.length, 'street count must match tbilisi-streets')
assert.equal(GE_INVENTORY.buildings, BUILDINGS.length, 'building count must match the catalog')
assert.equal(GE_INVENTORY.projects, PROJECTS.length, 'project count must match professionals')
assert.equal(GE_INVENTORY.developers, DEVELOPERS.length, 'developer count must match professionals')
assert.equal(
  georgiaCoverageScore(),
  Number(
    (
      (30 * Math.min(1, Math.log10(GE_INVENTORY.streets + 1) / Math.log10(8000))) +
      (30 * Math.min(1, Math.log10(GE_INVENTORY.buildings + 1) / Math.log10(4000))) +
      (20 * Math.min(1, Math.log10(GE_INVENTORY.projects + 1) / Math.log10(2000))) +
      (20 * Math.min(1, Math.log10(GE_INVENTORY.developers + 1) / Math.log10(800)))
    ).toFixed(0),
  ),
  'coverage score derives from the anchors',
)

// Weights form a proper distribution (sum to 1) — totals depend on it.
const weightSum = GEORGIA_DIMENSIONS.reduce((s, d) => s + d.weight, 0)
assert.ok(Math.abs(weightSum - 1) < 1e-9, `weights sum to 1, got ${weightSum}`)
assert.equal(new Set(GEORGIA_DIMENSIONS.map((d) => d.id)).size, GEORGIA_DIMENSIONS.length, 'dim ids unique')

// Every player scores every dimension, in range, with a reason.
const cwd = fs.existsSync(path.join(process.cwd(), 'src/lib/georgia-competitive.ts'))
  ? process.cwd()
  : path.join(process.cwd(), 'app')
for (const p of GEORGIA_PLAYERS) {
  for (const d of GEORGIA_DIMENSIONS) {
    const cell = p.cells[d.id]
    assert.ok(cell, `${p.id} missing ${d.id}`)
    assert.ok(Number.isFinite(cell.score) && cell.score >= 0 && cell.score <= 100, `${p.id}.${d.id} range: ${cell.score}`)
    assert.ok(cell.note.length >= 12, `${p.id}.${d.id} needs a real note`)
  }
  const t = weightedTotal(p)
  assert.ok(t >= 0 && t <= 100, `${p.id} total range: ${t}`)
}

// Integrity contract: every sivrce cell cites a repo file that actually exists.
const sivrce = GEORGIA_PLAYERS.find((p) => p.id === 'sivrce')!
for (const d of GEORGIA_DIMENSIONS) {
  const ev = sivrce.cells[d.id].evidence
  assert.ok(ev, `sivrce.${d.id} must cite evidence`)
  assert.ok(fs.existsSync(path.join(cwd, ev!)), `sivrce.${d.id} evidence missing on disk: ${ev}`)
}

// Evidence must be code the product actually ships, not code that merely exists.
assert.deepEqual(
  unshippedEvidence(
    path.join(cwd, 'src'),
    GEORGIA_DIMENSIONS.map((d) => sivrce.cells[d.id].evidence!),
  ),
  [],
  'georgia card cites modules nothing in the product imports',
)

// The home market must be in the field, and the scan must be honest about it.
assert.ok(GEORGIA_PLAYERS.filter((p) => p.tier === 'local-native').length >= 4, 'scan ≥4 local-native')
assert.ok(georgiaDimension('costTransparency'), 'dimension lookup works')

// Outcome: sivrce ranks #1 with two honest, structural gaps — never inflated.
const card = georgiaScorecard()
assert.equal(card[0].id, 'sivrce', 'sivrce ranks #1 in Georgia')
assert.equal(card[0].rank, 1, 'rank is 1-based')
const standing = sivrceGeorgiaStanding()
assert.equal(standing.rank, 1, 'standing rank #1')
assert.ok(standing.leadsDimensions.length >= 8, `sivrce leads ≥8 dims, got ${standing.leadsDimensions.length}`)
assert.equal(standing.trailsDimensions.length, 2, 'exactly two honest gaps')
assert.deepEqual(
  standing.trailsDimensions.map((t) => t.id),
  ['coverage', 'stays'],
  'the gaps are live board inventory and stays scale',
)
assert.equal(standing.trailsDimensions[0].leader, 'myhome-ge', 'MyHome leads live inventory')
assert.equal(standing.trailsDimensions[1].leader, 'airbnb', 'Airbnb leads stays')

// No ties at the top; #1 is strictly ahead of #2.
assert.ok(card[0].total > card[1].total, `#1 strictly ahead: ${card[0].total} > ${card[1].total}`)

const bar = (n: number) => '█'.repeat(Math.round(n / 5)) + '·'.repeat(20 - Math.round(n / 5))
console.log('georgia-competitive: SIVRCE #1 in Georgia — weighted scorecard')
for (const p of card) {
  console.log(`  #${p.rank} ${p.name.padEnd(12)} ${String(p.total).padStart(5)} /100  ${bar(p.total)}  [${p.tier}]`)
}
console.log(
  `  sivrce leads ${standing.leadsDimensions.length}/${GEORGIA_DIMENSIONS.length} dimensions; ` +
    `honest gaps: ${standing.trailsDimensions.map((t) => `"${t.id}" (leader ${t.leader} ${t.leaderScore})`).join(', ')}.`,
)
console.log('georgia-competitive.check: OK ✓')
