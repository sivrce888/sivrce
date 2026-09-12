import { compareProperties, calculateTotalCostOfOwnership, calculate5YearRoiForecast } from './10x-engine'

console.log('10x-engine.check: start')

// 1. Property Comparison test
const comp = compareProperties(
  { id: 'a', name: 'Vake 2BR', priceUSD: 140000, areaSqm: 70, score: 88, grossYieldPct: 9.2 },
  { id: 'b', name: 'Saburtalo 2BR', priceUSD: 130000, areaSqm: 60, score: 75, grossYieldPct: 8.1 }
)
if (comp.overallWinner !== 'A') throw new Error('Vake 2BR should win on lower $/m², higher score, and higher yield')
if (comp.dimensions.length < 3) throw new Error('Expected at least 3 comparison dimensions')

// 2. TCO Test
const tcoGe = calculateTotalCostOfOwnership(100000, 'GE')
if (tcoGe.totalAcquisitionCostUSD <= 100000) throw new Error('Acquisition cost should include taxes & legal fees')

const tcoDe = calculateTotalCostOfOwnership(100000, 'DE')
if (tcoDe.registrationTaxUSD !== 6000) throw new Error('DE Grunderwerbsteuer should be 6%')

// 3. ROI Forecast Test
const roi = calculate5YearRoiForecast(100000, 800, 5.0)
if (roi.total5YearRoiPct < 50) throw new Error('Expected solid 5-year total ROI')

console.log('10x-engine.check: OK ✓')
