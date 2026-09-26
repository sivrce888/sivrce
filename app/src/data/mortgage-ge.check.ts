/**
 * Self-check for the Georgian mortgage corpus (no network).
 * Run: npx tsx src/data/mortgage-ge.check.ts
 *
 * Guards the two ways this file rots: an invented rate cell (every band must
 * carry the source it came from and stay inside NBG-plausible bounds) and the
 * calculator page drifting back to fabricated numbers — it must render the
 * bank table from this file and must never resurrect the "1% transfer tax"
 * claim that Georgia's no-transfer-tax reality contradicts.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  downCell,
  MORTGAGE_GE_AS_OF,
  MORTGAGE_GE_BANKS,
  MORTGAGE_SUBSIDY,
  NBG_MAX_LTV,
  nbgPtiCap,
  NBG_POLICY_RATE,
  rateBand,
  termYrs,
} from './mortgage-ge'

// Policy anchor: a rate outside 1–30 means the constant was mistyped, and
// anything under 5 is implausible for Georgia this decade.
assert.ok(NBG_POLICY_RATE >= 5 && NBG_POLICY_RATE <= 30, `nbg policy rate: ${NBG_POLICY_RATE}`)
assert.ok(/^\d{4}-\d{2}$/.test(MORTGAGE_GE_AS_OF), `as-of stamp: ${MORTGAGE_GE_AS_OF}`)

// Subsidy mechanics (enterprisegeorgia.gov.ge).
assert.ok(
  MORTGAGE_SUBSIDY.maxLoanGEL >= 100_000 && MORTGAGE_SUBSIDY.maxLoanGEL <= 500_000,
  'subsidy loan cap',
)
assert.ok(MORTGAGE_SUBSIDY.subsidyMonths >= 12 && MORTGAGE_SUBSIDY.subsidyMonths <= 120, 'subsidy months')
const pts = MORTGAGE_SUBSIDY.pointsByChildren
assert.equal(pts.length, 3, 'subsidy points: 1 / 2 / 3+ children')
for (const p of pts) assert.ok(p >= 1 && p <= 15, `subsidy point sane: ${p}`)
assert.ok(pts[0]! < pts[1]! && pts[1]! < pts[2]!, 'more children → more subsidy points')

// Every bank row: sourced, plausible, no invented cells.
for (const b of MORTGAGE_GE_BANKS) {
  assert.ok(b.name && b.nameKa, `names: ${b.slug}`)
  assert.ok(b.source.startsWith('https://'), `source url: ${b.slug}`)
  for (const [key, band] of [['gel', b.gel], ['fx', b.fx]] as const) {
    if (!band) continue
    assert.ok(band.from >= 3 && band.from <= 30, `${b.slug} ${key} from: ${band.from}`)
    if (band.to !== undefined) {
      assert.ok(band.to > band.from && band.to <= 35, `${b.slug} ${key} band: ${band.from}–${band.to}`)
    }
  }
  if (b.termMonths !== null) {
    assert.ok(b.termMonths >= 60 && b.termMonths <= 360, `${b.slug} term: ${b.termMonths}`)
  }
  if (b.minDownPct !== null) {
    assert.ok(b.minDownPct >= 10 && b.minDownPct <= 60, `${b.slug} down: ${b.minDownPct}`)
  }
}

// The two anchors the page copy leans on must stay present.
assert.ok(MORTGAGE_GE_BANKS.some((b) => b.slug === 'tbc'), 'TBC row')
assert.ok(
  MORTGAGE_GE_BANKS.some((b) => b.slug === 'basisbank' && b.fx !== null),
  'BasisBank carries the only published FX band',
)

// Cell formatters — the table renders these verbatim.
assert.equal(rateBand({ from: 10.9, to: 17.5 }), '10.9–17.5%')
assert.equal(rateBand({ from: 9.9 }), 'from 9.9%')
assert.equal(rateBand({ from: 10, to: 10 }), '10%')
assert.equal(rateBand(null), '—')
assert.equal(termYrs(240), '20')
assert.equal(termYrs(null), '—')
assert.equal(downCell(15), 'min 15%')
assert.equal(downCell(null), '—')

// The calculator page must render THIS corpus and must never resurrect the
// invented "1% transfer tax on the first 100,000 GEL" FAQ answer.
const page = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../app/[lang]/mortgage-calculator/page.tsx'),
  'utf8',
)
assert.ok(
  page.includes("from '@/data/mortgage-ge'"),
  'calculator page renders the mortgage-ge corpus',
)
for (const lie of ['transfer tax is 1', 'first 100,000', 'first 100 000']) {
  assert.ok(!page.includes(lie), `page must not claim "${lie}"`)
}

// NBG LTV is the legal floor: FX stricter than GEL, and no bank may publish a down payment under it.
assert.ok(NBG_MAX_LTV.fx < NBG_MAX_LTV.gel, 'NBG: FX LTV cap stricter than GEL')
// NBG PTI grid: ₾1,500 net split, unhedged FX stricter at every income.
assert.equal(nbgPtiCap(1_499, false), 25)
assert.equal(nbgPtiCap(1_500, false), 50)
assert.equal(nbgPtiCap(1_499, true), 20)
assert.equal(nbgPtiCap(4_000, true), 30)
for (const b of MORTGAGE_GE_BANKS) {
  if (b.minDownPct !== null) assert.ok(b.minDownPct >= 100 - NBG_MAX_LTV.gel, `${b.slug}: min down under NBG floor`)
}
// Rent-vs-buy must not charge buyers a Georgian transfer tax that does not exist.
const rvb = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../app/[lang]/rent-vs-buy/page.tsx'),
  'utf8',
)
assert.ok(!rvb.includes('(transfer tax, notary'), 'rent-vs-buy: no invented transfer tax')

console.log(`mortgage-ge.check: ${MORTGAGE_GE_BANKS.length} banks / NBG ${NBG_POLICY_RATE}% / as of ${MORTGAGE_GE_AS_OF} ✓`)
