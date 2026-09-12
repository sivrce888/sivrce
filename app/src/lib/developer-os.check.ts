import { calculateDeveloperInventoryAnalytics } from './developer-os'

console.log('developer-os.check: start')

const inv = calculateDeveloperInventoryAnalytics({
  projectId: 'p1',
  projectName: 'Alliance Highrise',
  totalUnits: 100,
  availableUnits: 20,
  reservedUnits: 10,
  soldUnits: 70,
  avgPricePerSqmUSD: 1800,
}, 10)

if (inv.sellOutRatePct !== 80) throw new Error(`Expected 80% sell out, got ${inv.sellOutRatePct}`)
if (inv.estimatedMonthsToSellOut !== 2) throw new Error(`Expected 2 months, got ${inv.estimatedMonthsToSellOut}`)
if (inv.velocityStatus !== 'High Velocity') throw new Error('Expected High Velocity')

console.log('developer-os.check: OK ✓')
