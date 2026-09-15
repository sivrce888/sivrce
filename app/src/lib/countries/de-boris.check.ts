/**
 * Self-check for BORIS Bodenrichtwerte and Grundsteuer B reform.
 */
import assert from 'node:assert/strict'
import { getBorisLandValue, calculateLandBuildingSplit, estimateGrundsteuerB } from './de-boris'

console.log('de-boris.check: start')

// 1. Benchmark lookup
const berlinMitte = getBorisLandValue('berlin', 'Mitte')
assert.equal(berlinMitte.standardBodenrichtwertEurSqm, 4_500)
assert.equal(berlinMitte.reportingYear, 2026)

const munichSchwabing = getBorisLandValue('munich', 'Schwabing')
assert.equal(munichSchwabing.standardBodenrichtwertEurSqm, 6_800)

// 2. Kaufpreisaufteilung (Land vs Building)
const split = calculateLandBuildingSplit(500_000, 25, 75, 4_500)
assert.ok(split.landShareEur > 0)
assert.ok(split.buildingShareEur > 0)
assert.equal(split.landShareEur + split.buildingShareEur, 500_000)
assert.ok(split.depreciableAfABaseEur === split.buildingShareEur)

// 3. Grundsteuer B Reform 2025/2026
const gstBerlin = estimateGrundsteuerB('berlin', 80)
assert.equal(gstBerlin.model, 'BUNDESMODELL')
assert.ok(gstBerlin.estimatedAnnualTaxEur > 0)

const gstMunich = estimateGrundsteuerB('munich', 90)
assert.equal(gstMunich.model, 'BAYERN_FLAECHE')
assert.ok(gstMunich.estimatedAnnualTaxEur > 0)

console.log('de-boris.check: OK ✓')
