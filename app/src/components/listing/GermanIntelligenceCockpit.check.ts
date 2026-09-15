import assert from 'node:assert/strict'
import {
  underwriteDeProperty,
  analyzeDeEnergyState,
  calculateDeAcquisitionCosts,
} from '../../lib/countries/de-proptech-os'

// 1. Energy analysis assertions (A+ vs H)
const energyA = analyzeDeEnergyState('A+', 85, 'waermepumpe', 2024)
assert.equal(energyA.energyClass, 'A+')
assert.equal(energyA.co2LandlordSharePct, 0, 'Class A+ has 0% landlord carbon penalty')
assert.equal(energyA.gegComplianceStatus, 'COMPLIANT_RENEWABLE')

const energyH = analyzeDeEnergyState('H', 85, 'oelzentral', 1972)
assert.equal(energyH.energyClass, 'H')
assert.equal(energyH.co2LandlordSharePct, 95, 'Class H has 95% landlord carbon penalty under CO2KostAufG')
assert.equal(energyH.gegComplianceStatus, 'CRITICAL_RENOVATION_MANDATE')
assert.ok(energyH.estimatedRenovationCapexEur > 0, 'Requires substantial renovation capex')
assert.ok(energyH.kfwSubsidyEligibleEur > 0, 'Eligible for KfW 261 / BEG 458 grant')

// 2. Acquisition costs (Berlin 6.0% Grunderwerbsteuer vs Bayern 3.5%)
const acqBerlin = calculateDeAcquisitionCosts(500_000, 'berlin')
assert.equal(acqBerlin.transferTaxPct, 6.0)
assert.equal(acqBerlin.transferTaxEur, 30_000)
assert.equal(acqBerlin.notaryPct, 1.5)
assert.equal(acqBerlin.registerPct, 0.5)
assert.equal(acqBerlin.maklerPct, 3.57)

const acqBayern = calculateDeAcquisitionCosts(500_000, 'munich')
assert.equal(acqBayern.transferTaxPct, 3.5)
assert.equal(acqBayern.transferTaxEur, 17_500)

// 3. Full Underwriting & SPI Score
const report = underwriteDeProperty({
  purchasePriceEur: 400_000,
  areaSqm: 70,
  monthlyColdRentEur: 1_600,
  citySlug: 'berlin',
  yearBuilt: 2018,
  energyClass: 'B',
  heatingType: 'fernwaerme',
})

assert.ok(report.spiScore >= 70, `Expected SPI score >= 70, got ${report.spiScore}`)
assert.ok(report.grossYieldPct > 4.0, `Expected gross yield > 4%, got ${report.grossYieldPct}%`)
assert.equal(report.scenarios.base.scenario, 'BASE')
assert.ok(report.scenarios.base.year10IrrPct > 0, 'Base scenario 10y IRR must be positive')
assert.ok(report.whyThisDealDe.length > 0, 'Deal strengths must be populated')

console.log('GermanIntelligenceCockpit.check: OK ✓ — German property intelligence & energy cockpit verified')
