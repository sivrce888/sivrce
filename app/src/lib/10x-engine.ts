/**
 * SIVRCE 10x Engine — Universal Comparative Terminal & Total Cost of Ownership (TCO) Calculator.
 *
 * Provides instant 10x side-by-side property comparison, 5-year ROI forecasting,
 * and complete acquisition/holding cost breakdown.
 * DB-free, lightweight, SSR-safe.
 */

export interface ComparisonDimension {
  metricEn: string
  metricKa: string
  valueA: string | number
  valueB: string | number
  winner: 'A' | 'B' | 'TIED'
  explanationEn: string
  explanationKa: string
}

export interface PropertyComparisonReport {
  propertyAId: string
  propertyBId: string
  dimensions: ComparisonDimension[]
  overallWinner: 'A' | 'B' | 'TIED'
  summaryEn: string
  summaryKa: string
}

export function compareProperties(
  a: { id: string; name: string; priceUSD: number; areaSqm: number; score: number; grossYieldPct?: number; distanceMetroM?: number },
  b: { id: string; name: string; priceUSD: number; areaSqm: number; score: number; grossYieldPct?: number; distanceMetroM?: number }
): PropertyComparisonReport {
  const dimensions: ComparisonDimension[] = []

  // 1. Price per sqm
  const pSqmA = Math.round(a.priceUSD / Math.max(1, a.areaSqm))
  const pSqmB = Math.round(b.priceUSD / Math.max(1, b.areaSqm))
  dimensions.push({
    metricEn: 'Price / m²',
    metricKa: 'ფასი კვ.მ-ზე',
    valueA: `$${pSqmA}`,
    valueB: `$${pSqmB}`,
    winner: pSqmA < pSqmB ? 'A' : pSqmA > pSqmB ? 'B' : 'TIED',
    explanationEn: pSqmA < pSqmB ? `${a.name} is $${pSqmB - pSqmA}/m² lower` : `${b.name} is $${pSqmA - pSqmB}/m² lower`,
    explanationKa: pSqmA < pSqmB ? `${a.name} $${pSqmB - pSqmA}-ით იაფია კვ.მ-ზე` : `${b.name} $${pSqmA - pSqmB}-ით იაფია კვ.მ-ზე`,
  })

  // 2. Sivrce Score
  dimensions.push({
    metricEn: 'Sivrce Score',
    metricKa: 'სივრცის ქულა',
    valueA: `${a.score}/100`,
    valueB: `${b.score}/100`,
    winner: a.score > b.score ? 'A' : a.score < b.score ? 'B' : 'TIED',
    explanationEn: a.score > b.score ? `${a.name} has higher verification & trust score` : `${b.name} has higher verification & trust score`,
    explanationKa: a.score > b.score ? `${a.name}-ს აქვს უკეთესი ნდობის ქულა` : `${b.name}-ს აქვს უკეთესი ნდობის ქულა`,
  })

  // 3. Gross Yield
  if (a.grossYieldPct !== undefined && b.grossYieldPct !== undefined) {
    dimensions.push({
      metricEn: 'Gross Rental Yield',
      metricKa: 'მომგებიანობა (Yield)',
      valueA: `${a.grossYieldPct}%`,
      valueB: `${b.grossYieldPct}%`,
      winner: a.grossYieldPct > b.grossYieldPct ? 'A' : a.grossYieldPct < b.grossYieldPct ? 'B' : 'TIED',
      explanationEn: a.grossYieldPct > b.grossYieldPct ? `${a.name} yields +${(a.grossYieldPct - b.grossYieldPct).toFixed(1)}% higher annual rent` : `${b.name} yields +${(b.grossYieldPct - a.grossYieldPct).toFixed(1)}% higher annual rent`,
      explanationKa: a.grossYieldPct > b.grossYieldPct ? `${a.name} იძლევა +${(a.grossYieldPct - b.grossYieldPct).toFixed(1)}%-ით მეტ იჯარას` : `${b.name} იძლევა +${(b.grossYieldPct - a.grossYieldPct).toFixed(1)}%-ით მეტ იჯარას`,
    })
  }

  const scoreAWins = dimensions.filter((d) => d.winner === 'A').length
  const scoreBWins = dimensions.filter((d) => d.winner === 'B').length
  const overallWinner = scoreAWins > scoreBWins ? 'A' : scoreBWins > scoreAWins ? 'B' : 'TIED'

  return {
    propertyAId: a.id,
    propertyBId: b.id,
    dimensions,
    overallWinner,
    summaryEn: overallWinner === 'A' ? `${a.name} wins overall across ${scoreAWins} metrics` : overallWinner === 'B' ? `${b.name} wins overall across ${scoreBWins} metrics` : 'Both properties are evenly matched',
    summaryKa: overallWinner === 'A' ? `${a.name} იმარჯვებს ${scoreAWins} მეტრიკაში` : overallWinner === 'B' ? `${b.name} იმარჯვებს ${scoreBWins} მეტრიკაში` : 'ორივე ბინა თანაბარ პოზიციაზეა',
  }
}

export interface TcoBreakdown {
  purchasePriceUSD: number
  registrationTaxUSD: number
  notaryLegalUSD: number
  estimatedAnnualUpkeepUSD: number
  estimatedAnnualHoaUSD: number
  totalAcquisitionCostUSD: number
  total5YearCostUSD: number
}

/** Total Cost of Ownership (TCO) calculator for Georgia, Germany, UAE, and Global markets */
export function calculateTotalCostOfOwnership(
  priceUSD: number,
  countryCode = 'GE'
): TcoBreakdown {
  let regTaxRate = 0.001 // Georgia registration (~$50-$200 flat equivalent)
  let notaryRate = 0.002
  let annualUpkeepRate = 0.01 // 1% per year maintenance
  let annualHoaRate = 0.005 // 0.5% HOA

  if (countryCode.toUpperCase() === 'DE') {
    regTaxRate = 0.06 // Grunderwerbsteuer ~6%
    notaryRate = 0.015 // Notary ~1.5%
    annualUpkeepRate = 0.015
    annualHoaRate = 0.01
  } else if (countryCode.toUpperCase() === 'AE') {
    regTaxRate = 0.04 // DLD fee 4%
    notaryRate = 0.005
    annualUpkeepRate = 0.012
    annualHoaRate = 0.008
  }

  const registrationTaxUSD = Math.round(priceUSD * regTaxRate)
  const notaryLegalUSD = Math.round(priceUSD * notaryRate)
  const estimatedAnnualUpkeepUSD = Math.round(priceUSD * annualUpkeepRate)
  const estimatedAnnualHoaUSD = Math.round(priceUSD * annualHoaRate)

  const totalAcquisitionCostUSD = priceUSD + registrationTaxUSD + notaryLegalUSD
  const total5YearCostUSD = totalAcquisitionCostUSD + (estimatedAnnualUpkeepUSD + estimatedAnnualHoaUSD) * 5

  return {
    purchasePriceUSD: priceUSD,
    registrationTaxUSD,
    notaryLegalUSD,
    estimatedAnnualUpkeepUSD,
    estimatedAnnualHoaUSD,
    totalAcquisitionCostUSD,
    total5YearCostUSD,
  }
}

export interface RoiForecast {
  grossAnnualRentUSD: number
  netAnnualRentUSD: number
  capRatePct: number
  projected5YearEquityGrowthUSD: number
  total5YearReturnUSD: number
  total5YearRoiPct: number
}

/** 5-year investment ROI & equity growth projection */
export function calculate5YearRoiForecast(
  purchasePriceUSD: number,
  monthlyRentUSD: number,
  annualAppreciationRatePct = 5.0
): RoiForecast {
  const grossAnnualRentUSD = monthlyRentUSD * 12
  const netAnnualRentUSD = Math.round(grossAnnualRentUSD * 0.85) // 15% operating buffer
  const capRatePct = Math.round((netAnnualRentUSD / Math.max(1, purchasePriceUSD)) * 1000) / 10

  // Compound appreciation over 5 years
  const futureValueUSD = purchasePriceUSD * Math.pow(1 + annualAppreciationRatePct / 100, 5)
  const projected5YearEquityGrowthUSD = Math.round(futureValueUSD - purchasePriceUSD)

  const totalNetRent5Years = netAnnualRentUSD * 5
  const total5YearReturnUSD = Math.round(projected5YearEquityGrowthUSD + totalNetRent5Years)
  const total5YearRoiPct = Math.round((total5YearReturnUSD / Math.max(1, purchasePriceUSD)) * 1000) / 10

  return {
    grossAnnualRentUSD,
    netAnnualRentUSD,
    capRatePct,
    projected5YearEquityGrowthUSD,
    total5YearReturnUSD,
    total5YearRoiPct,
  }
}
