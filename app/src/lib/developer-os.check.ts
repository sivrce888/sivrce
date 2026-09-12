import { calculateDeveloperInventoryAnalytics, calculateTranchePricingOptimization } from './developer-os'

console.log('developer-os.check: start')

const inventory = {
  projectId: 'p1',
  projectName: 'Alliance Highrise',
  totalUnits: 100,
  availableUnits: 20,
  reservedUnits: 10,
  soldUnits: 70,
  avgPricePerSqmUSD: 1800,
}

const inv = calculateDeveloperInventoryAnalytics(inventory, 10)

if (inv.sellOutRatePct !== 80) throw new Error(`Expected 80% sell out, got ${inv.sellOutRatePct}`)
if (inv.estimatedMonthsToSellOut !== 2) throw new Error(`Expected 2 months, got ${inv.estimatedMonthsToSellOut}`)
if (inv.velocityStatus !== 'High Velocity') throw new Error('Expected High Velocity')

const pricing = calculateTranchePricingOptimization(inventory, inv)
if (pricing.priceAdjustmentPct !== 5) throw new Error(`Expected +5% price adjustment, got ${pricing.priceAdjustmentPct}`)
if (pricing.recommendedPricePerSqmUSD !== 1890) throw new Error(`Expected 1890 USD/sqm, got ${pricing.recommendedPricePerSqmUSD}`)

console.log('developer-os.check: OK ✓')

