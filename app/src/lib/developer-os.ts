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
