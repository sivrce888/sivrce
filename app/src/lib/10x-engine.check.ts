import { compareProperties, calculateTotalCostOfOwnership, calculate5YearRoiForecast, calculateMortgageEstimate } from './10x-engine'

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

// 3. ROI Forecast Test
const roi = calculate5YearRoiForecast(100000, 800, 5.0)
if (roi.total5YearRoiPct < 50) throw new Error('Expected solid 5-year total ROI')

// 4. Mortgage Estimate Test
const mortgage = calculateMortgageEstimate(100000, 20, 8.5, 20)
if (mortgage.loanAmountUSD !== 80000 || mortgage.downPaymentUSD !== 20000 || mortgage.monthlyPaymentUSD <= 0) {
  throw new Error(`Unexpected mortgage calculation output: ${JSON.stringify(mortgage)}`)
}

console.log('10x-engine.check: OK ✓')

