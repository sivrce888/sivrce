import {
  compareProperties,
  calculateTotalCostOfOwnership,
  calculate5YearRoiForecast,
  calculateMortgageEstimate,
  generateInvestmentScenarios,
  generatePropertyDecisionAnalysis,
} from './10x-engine'

console.log('10x-engine.check: start')

// 1. Property Comparison test
const comp = compareProperties(
  { id: 'a', name: 'Vake 2BR', priceUSD: 140000, areaSqm: 70, score: 88, grossYieldPct: 9.2, distanceMetroM: 350 },
  { id: 'b', name: 'Saburtalo 2BR', priceUSD: 130000, areaSqm: 60, score: 75, grossYieldPct: 8.1, distanceMetroM: 900 }
)
if (comp.overallWinner !== 'A') throw new Error('Vake 2BR should win on lower $/m², higher score, higher yield, and closer metro')
if (comp.dimensions.length < 4) throw new Error('Expected at least 4 comparison dimensions including metro distance')

// 2. TCO Test
const tcoGe = calculateTotalCostOfOwnership(100000, 'GE')
if (tcoGe.totalAcquisitionCostUSD <= 100000) throw new Error('Acquisition cost should include taxes & legal fees')

const tcoDe = calculateTotalCostOfOwnership(100000, 'DE')
if (tcoDe.registrationTaxUSD !== 6000) throw new Error('DE Grunderwerbsteuer should be 6%')
const tcoDeBy = calculateTotalCostOfOwnership(100000, 'DE', 'munich')
if (tcoDeBy.registrationTaxUSD !== 3500) throw new Error('Bavaria Grunderwerbsteuer should be 3.5%')

const tcoAe = calculateTotalCostOfOwnership(100000, 'AE')
if (tcoAe.registrationTaxUSD !== 4000) throw new Error('Dubai DLD should be 4%')
const tcoAeAd = calculateTotalCostOfOwnership(100000, 'AE', 'abu-dhabi')
if (tcoAeAd.registrationTaxUSD !== 2000) throw new Error('Abu Dhabi transfer should be 2%')

const tcoFr = calculateTotalCostOfOwnership(200000, 'FR')
if (tcoFr.registrationTaxUSD !== 15000) throw new Error('FR notaire transfer should be 7.5%')

const tcoCh = calculateTotalCostOfOwnership(500000, 'CH')
if (tcoCh.registrationTaxUSD !== 7500) throw new Error('CH cantonal transfer should be 1.5%')

// 3. ROI Forecast Test
const roi = calculate5YearRoiForecast(100000, 800, 5.0)
if (roi.total5YearRoiPct < 50) throw new Error('Expected solid 5-year total ROI')

// 4. Mortgage Estimate Test
const mortgage = calculateMortgageEstimate(100000, 20, 8.5, 20)
if (mortgage.loanAmountUSD !== 80000 || mortgage.downPaymentUSD !== 20000 || mortgage.monthlyPaymentUSD <= 0) {
  throw new Error(`Unexpected mortgage calculation output: ${JSON.stringify(mortgage)}`)
}

// 5. Investment Scenarios Test (Bear/Base/Bull + Sensitivity)
const scenarios = generateInvestmentScenarios(150000, 1200, {
  districtMedianPerSqm: 2200,
  areaSqm: 75,
  liquidityScore: 90,
})
if (!scenarios.scenarios.bear || !scenarios.scenarios.base || !scenarios.scenarios.bull) {
  throw new Error('Expected bear, base, bull scenarios')
}
if (scenarios.scenarios.bull.fiveYearRoiPct <= scenarios.scenarios.base.fiveYearRoiPct ||
    scenarios.scenarios.base.fiveYearRoiPct <= scenarios.scenarios.bear.fiveYearRoiPct) {
  throw new Error('Bull ROI should exceed Base ROI which should exceed Bear ROI')
}
if (scenarios.liquidityRating !== 'VERY_HIGH') {
  throw new Error('Expected VERY_HIGH liquidity rating for score 90')
}
if (scenarios.sensitivity.length < 3) {
  throw new Error('Expected at least 3 sensitivity analysis factors')
}

// 6. Decision Analysis Test (Why Recommends / Why Not / Diligence)
const decision = generatePropertyDecisionAnalysis({
  priceUSD: 120000,
  areaSqm: 80,
  districtMedianPerSqm: 1800,
  isCadastreVerified: true,
  distanceMetroM: 300,
  grossYieldPct: 9.0,
  floor: 4,
  hasElevator: true,
})
if (decision.whyRecommendEn.length < 2) {
  throw new Error('Expected at least 2 positive grounded recommendation points')
}
if (decision.confidenceScore < 85) {
  throw new Error('Verified and fully-parameterized listing should have >= 85 confidence')
}
if (!decision.dueDiligenceChecklist.some(d => d.isCritical && d.itemEn.includes('title deed'))) {
  throw new Error('Expected critical title deed diligence step')
}

console.log('10x-engine.check: OK ✓')


