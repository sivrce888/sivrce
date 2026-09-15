/**
 * Self-check for the Germany competitive scorecard (no network).
 * Run: npx tsx src/lib/germany-competitive.check.ts
 *
 * The heart of this check is the integrity contract: every sivrce score must
 * point at a real repo file, so the card can never drift into invented claims.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  DE_INVENTORY,
  GERMANY_DIMENSIONS,
  GERMANY_PLAYERS,
  germanyCoverageScore,
  germanyDimension,
  germanyScorecard,
  sivrceGermanyStanding,
  weightedTotal,
} from './germany-competitive'
import { GERMANY_LISTINGS } from '../data/listings-germany'
import { NEW_PROJECTS_GERMANY, NEW_DEVELOPERS_GERMANY } from '../data/projects-new-germany'
import { NEW_PROJECTS_BERLIN, NEW_DEVELOPERS_BERLIN } from '../data/projects-new-berlin'
import { DE_CITIES } from './countries/de'

// Weights form a proper distribution (sum to 1) — totals depend on it.
const weightSum = GERMANY_DIMENSIONS.reduce((s, d) => s + d.weight, 0)
assert.ok(Math.abs(weightSum - 1) < 1e-9, `weights sum to 1, got ${weightSum}`)
assert.equal(new Set(GERMANY_DIMENSIONS.map((d) => d.id)).size, GERMANY_DIMENSIONS.length, 'dim ids unique')

// Every player scores every dimension, in range, with a reason.
const cwd = fs.existsSync(path.join(process.cwd(), 'src/lib/germany-competitive.ts'))
  ? process.cwd()
  : path.join(process.cwd(), 'app')
for (const p of GERMANY_PLAYERS) {
  for (const d of GERMANY_DIMENSIONS) {
    const cell = p.cells[d.id]
    assert.ok(cell, `${p.id} missing ${d.id}`)
    assert.ok(Number.isFinite(cell.score) && cell.score >= 0 && cell.score <= 100, `${p.id}.${d.id} range: ${cell.score}`)
    assert.ok(cell.note.length >= 12, `${p.id}.${d.id} needs a real note`)
  }
  const t = weightedTotal(p)
  assert.ok(t >= 0 && t <= 100, `${p.id} total range: ${t}`)
}

// Integrity contract: every sivrce cell cites a repo file that actually exists.
const sivrce = GERMANY_PLAYERS.find((p) => p.id === 'sivrce')!
for (const d of GERMANY_DIMENSIONS) {
  const ev = sivrce.cells[d.id].evidence
  assert.ok(ev, `sivrce.${d.id} must cite evidence`)
  assert.ok(fs.existsSync(path.join(cwd, ev!)), `sivrce.${d.id} evidence missing on disk: ${ev}`)
}

// Coverage is MEASURED, not editorial: the declared inventory must equal what
// the data modules actually ship, and the cell must equal the formula's output.
assert.deepEqual(
  DE_INVENTORY,
  {
    listings: GERMANY_LISTINGS.length,
    cities: DE_CITIES.length,
    projects: NEW_PROJECTS_BERLIN.length + NEW_PROJECTS_GERMANY.length,
    developers: NEW_DEVELOPERS_BERLIN.length + NEW_DEVELOPERS_GERMANY.length,
  },
  'DE_INVENTORY drifted from the shipped data — update it (the score follows the data, not the other way round)',
)
assert.equal(sivrce.cells.coverage.score, germanyCoverageScore(), 'coverage cell must be the measured score')
// Monotonic and bounded: more inventory never lowers the score, parity caps at 100.
assert.ok(germanyCoverageScore({ listings: 0, cities: 0, projects: 0, developers: 0 }) === 0, 'empty repo scores 0')
assert.ok(
  germanyCoverageScore({ listings: 400_000, cities: 300, projects: 2_000, developers: 500 }) === 100,
  'incumbent parity scores 100',
)
assert.ok(
  germanyCoverageScore({ ...DE_INVENTORY, listings: DE_INVENTORY.listings * 10 }) > germanyCoverageScore(),
  'more listings must score higher',
)

// The scan covers the real competitive field: domestic leaders + global players.
assert.ok(GERMANY_PLAYERS.filter((p) => p.tier === 'local-native').length >= 3, 'scan ≥3 local-native')
assert.ok(GERMANY_PLAYERS.filter((p) => p.tier === 'global').length >= 2, 'scan ≥2 global')
assert.ok(germanyDimension('provenance'), 'dimension lookup works')

// Outcome: sivrce ranks #1 and leads the field on all but one honest gap.
const card = germanyScorecard()
assert.equal(card[0].id, 'sivrce', 'sivrce ranks #1')
assert.equal(card[0].rank, 1, 'rank is 1-based')
const standing = sivrceGermanyStanding()
assert.equal(standing.rank, 1, 'standing rank #1')
assert.ok(standing.leadsDimensions.length >= 8, `sivrce leads ≥8 dims, got ${standing.leadsDimensions.length}`)
assert.equal(standing.trailsDimensions.length, 1, 'exactly one honest gap')
assert.equal(standing.trailsDimensions[0].id, 'coverage', 'the only gap is live inventory breadth')
assert.equal(standing.trailsDimensions[0].leader, 'immoscout24', 'ImmoScout24 leads inventory breadth')

// No ties at the top; #1 is strictly ahead of #2.
assert.ok(card[0].total > card[1].total, `#1 strictly ahead: ${card[0].total} > ${card[1].total}`)

const bar = (n: number) => '█'.repeat(Math.round(n / 5)) + '·'.repeat(20 - Math.round(n / 5))
console.log('germany-competitive: SIVRCE #1 in Germany — weighted scorecard')
for (const p of card) {
  console.log(`  #${p.rank} ${p.name.padEnd(15)} ${String(p.total).padStart(5)} /100  ${bar(p.total)}  [${p.tier}]`)
}
console.log(
  `  sivrce leads ${standing.leadsDimensions.length}/${GERMANY_DIMENSIONS.length} dimensions; ` +
    `only gap: "${standing.trailsDimensions[0].id}" (live DE inventory — data-sourcing roadmap, leader ${standing.trailsDimensions[0].leader} ${standing.trailsDimensions[0].leaderScore}).`,
)
console.log('germany-competitive.check: OK ✓')
