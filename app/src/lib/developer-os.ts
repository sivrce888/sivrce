/**
 * SIVRCE Developer OS — Developer Project Management & Sales Inventory Intelligence.
 *
 * Provides inventory status analytics, sell-out velocity calculations, project launch metrics,
 * and price positioning insights.
 */

export interface DeveloperProjectInventory {
  projectId: string
  projectName: string
  totalUnits: number
  availableUnits: number
  reservedUnits: number
  soldUnits: number
  avgPricePerSqmUSD: number
  completionDate?: string
}

export interface InventoryAnalytics {
  sellOutRatePct: number // 0 to 100
  inventoryRemainingPct: number
  estimatedMonthsToSellOut: number
  totalRevenueProjectedUSD: number
  velocityStatus: 'High Velocity' | 'Balanced' | 'Low Velocity'
}

export interface TranchePricingOptimization {
  currentPricePerSqmUSD: number
  recommendedPricePerSqmUSD: number
  priceAdjustmentPct: number
  rationaleEn: string
  rationaleKa: string
}

/** Calculates project sell-out velocity and inventory analytics */
export function calculateDeveloperInventoryAnalytics(
  inventory: DeveloperProjectInventory,
  monthlySalesRate = 5
): InventoryAnalytics {
  const soldAndReserved = inventory.soldUnits + inventory.reservedUnits
  const sellOutRatePct = Math.round((soldAndReserved / Math.max(1, inventory.totalUnits)) * 100)
  const inventoryRemainingPct = 100 - sellOutRatePct

  const monthsToSellOut = monthlySalesRate > 0
    ? Math.round((inventory.availableUnits / monthlySalesRate) * 10) / 10
    : 99

  let velocityStatus: InventoryAnalytics['velocityStatus'] = 'Balanced'
  if (monthsToSellOut <= 6 && inventory.availableUnits > 0) velocityStatus = 'High Velocity'
  else if (monthsToSellOut > 18) velocityStatus = 'Low Velocity'

  const avgUnitAreaSqm = 65 // standard benchmark
  const totalRevenueProjectedUSD = Math.round(inventory.totalUnits * avgUnitAreaSqm * inventory.avgPricePerSqmUSD)

  return {
    sellOutRatePct,
    inventoryRemainingPct,
    estimatedMonthsToSellOut: monthsToSellOut,
    totalRevenueProjectedUSD,
    velocityStatus,
  }
}

/** Recommends optimal tranche pricing adjustments based on sell-out velocity and demand milestones */
export function calculateTranchePricingOptimization(
  inventory: DeveloperProjectInventory,
  analytics: InventoryAnalytics
): TranchePricingOptimization {
  let priceAdjustmentPct = 0
  let rationaleEn = 'Maintain current pricing strategy'
  let rationaleKa = 'სტანდარტული ფასწარმოქმნის სტრატეგიის შენარჩუნება'

  if (analytics.velocityStatus === 'High Velocity' && analytics.sellOutRatePct >= 50) {
    priceAdjustmentPct = 5.0
    rationaleEn = 'High demand & >50% sell-out milestone reached: +5% price escalation recommended'
    rationaleKa = 'მაღალი მოთხოვნა და >50% გაყიდვების ზღვარი: +5% ფასის ზრდის რეკომენდაცია'
  } else if (analytics.velocityStatus === 'High Velocity' && analytics.sellOutRatePct >= 30) {
    priceAdjustmentPct = 3.0
    rationaleEn = 'High demand velocity: +3% tranche price adjustment recommended'
    rationaleKa = 'მაღალი გაყიდვების ტემპი: +3% ტრანშის ფასის კორექტირება'
  } else if (analytics.velocityStatus === 'Low Velocity' && analytics.sellOutRatePct < 25) {
    priceAdjustmentPct = -2.5
    rationaleEn = 'Slow launch trajectory: -2.5% promotional tranche price boost recommended'
    rationaleKa = 'შენელებული სტარტი: -2.5% პრომო ფასდაკლების სტიმულირება'
  }

  const recommendedPricePerSqmUSD = Math.round(inventory.avgPricePerSqmUSD * (1 + priceAdjustmentPct / 100))

  return {
    currentPricePerSqmUSD: inventory.avgPricePerSqmUSD,
    recommendedPricePerSqmUSD,
    priceAdjustmentPct,
    rationaleEn,
    rationaleKa,
  }
}

