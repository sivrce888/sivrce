/**
 * Self-check for the Sivrce German PropTech OS engine (no network, DB-free).
 */
import assert from 'node:assert/strict'
import {
  calculateDeAcquisitionCosts,
  analyzeDeEnergyState,
  underwriteDeProperty,
  ENERGY_CLASS_MIDPOINTS,
} from './de-proptech-os'

console.log('de-proptech-os.check: start')

// 1. Acquisition Costs check (Grunderwerbsteuer + Notary + Grundbuch + Makler)
const berlinCosts = calculateDeAcquisitionCosts(500_000, 'berlin')
assert.equal(berlinCosts.state, 'Berlin')
assert.equal(berlinCosts.transferTaxPct, 6.0)
assert.equal(berlinCosts.transferTaxEur, 30_000)
assert.equal(berlinCosts.notaryEur, 7_500) // 1.5%
assert.equal(berlinCosts.registerEur, 2_500) // 0.5%
assert.equal(berlinCosts.maklerEur, 17_850) // 3.57%
assert.equal(berlinCosts.totalClosingCostsEur, 57_850)
assert.equal(berlinCosts.totalCapitalRequiredEur, 557_850)

// Provisionsfrei check
const munichProvisionsfrei = calculateDeAcquisitionCosts(1_000_000, 'munich', { provisionsfrei: true })
assert.equal(munichProvisionsfrei.state, 'Bayern')
assert.equal(munichProvisionsfrei.transferTaxPct, 3.5)
assert.equal(munichProvisionsfrei.transferTaxEur, 35_000)
assert.equal(munichProvisionsfrei.maklerEur, 0)
assert.equal(munichProvisionsfrei.totalClosingCostsEur, 55_000) // 35k tax + 15k notary + 5k register

// Stand 2026 statutory rates — Bremen 5.5% (2025-07-01), Thüringen 5.0% (2024-01-01), MV 6.0%.
assert.equal(calculateDeAcquisitionCosts(100_000, 'bremen').transferTaxPct, 5.5)
assert.equal(calculateDeAcquisitionCosts(100_000, 'erfurt').transferTaxPct, 5.0)
assert.equal(calculateDeAcquisitionCosts(100_000, 'rostock').transferTaxPct, 6.0)

// 2. Energy & GEG 2026 check
const energyA = analyzeDeEnergyState('A+', 100, 'waermepumpe', 2024)
assert.equal(energyA.gegComplianceStatus, 'COMPLIANT_RENEWABLE')
assert.equal(energyA.co2LandlordSharePct, 0)
assert.equal(energyA.estimatedRenovationCapexEur, 0)

const energyH = analyzeDeEnergyState('H', 80, 'oelzentral', 1970)
assert.equal(energyH.gegComplianceStatus, 'CRITICAL_RENOVATION_MANDATE')
assert.equal(energyH.co2LandlordSharePct, 95)
assert.ok(energyH.estimatedRenovationCapexEur > 0)
assert.ok(energyH.kfwSubsidyEligibleEur > 0)
assert.ok(energyH.netRenovationCapexEur < energyH.estimatedRenovationCapexEur)

// Midpoints
assert.equal(ENERGY_CLASS_MIDPOINTS['A+'], 20)
assert.equal(ENERGY_CLASS_MIDPOINTS['H'], 280)

// 3. Institutional Underwriting Check (Berlin Apartment €400,000)
const uw = underwriteDeProperty({
  purchasePriceEur: 400_000,
  citySlug: 'berlin',
  areaSqm: 65,
  monthlyColdRentEur: 1_200,
  monthlyHausgeldEur: 250,
  downPaymentPct: 20,
  mortgageInterestPct: 3.5,
  mortgageRepaymentPct: 2.0,
  yearBuilt: 2018,
  energyClass: 'B',
  heatingType: 'fernwaerme',
  marginalTaxRatePct: 42,
})

assert.equal(uw.annualGrossColdRentEur, 14_400)
assert.ok(uw.grossYieldPct > 0)
assert.ok(uw.equityRequiredEur > 80_000) // down payment + closing costs
assert.ok(uw.loanPrincipalEur === 320_000)
assert.ok(uw.monthlyMortgageRateEur > 0)
assert.ok(uw.annualAfAEur > 0) // Depreciation deduction
assert.ok(uw.scenarios.bear.year10PropertyValueEur > 0)
assert.ok(uw.scenarios.base.year10PropertyValueEur > 0)
assert.ok(uw.scenarios.bull.year10PropertyValueEur > 0)
assert.ok(uw.scenarios.bull.year10PropertyValueEur > uw.scenarios.bear.year10PropertyValueEur)
assert.ok(uw.spiScore >= 0 && uw.spiScore <= 100)
assert.ok(['EXCELLENT_BUY', 'FAIR_VALUE', 'HOLD_ANALYZE', 'HIGH_RISK_OVERPRICED'].includes(uw.dealVerdict))
assert.ok(uw.whyThisDealDe.length > 0)
assert.ok(uw.whatCouldMakeItFailDe.length > 0)
assert.equal(uw.provenance.euAiActGovernance.riskTier, 'TRANSPARENCY_OBLIGATION')
assert.equal(uw.provenance.euAiActGovernance.humanAuditable, true)

console.log('de-proptech-os.check: OK ✓')
