/**
 * SIVRCE 10x Engine — Universal Comparative Terminal & Total Cost of Ownership (TCO) Calculator.
 *
 * Provides instant 10x side-by-side property comparison, 5-year ROI forecasting,
 * and complete acquisition/holding cost breakdown.
 * DB-free, lightweight, SSR-safe.
 */

import { deCityBySlug } from '@/lib/countries/de'
import { aeTransferFeePct } from '@/lib/countries/ae'

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

  // 4. Transit Proximity
  if (a.distanceMetroM !== undefined && b.distanceMetroM !== undefined) {
    dimensions.push({
      metricEn: 'Metro Distance',
      metricKa: 'მანძილი მეტრომდე',
      valueA: `${a.distanceMetroM}m`,
      valueB: `${b.distanceMetroM}m`,
      winner: a.distanceMetroM < b.distanceMetroM ? 'A' : a.distanceMetroM > b.distanceMetroM ? 'B' : 'TIED',
      explanationEn: a.distanceMetroM < b.distanceMetroM ? `${a.name} is ${b.distanceMetroM - a.distanceMetroM}m closer to metro` : `${b.name} is ${a.distanceMetroM - b.distanceMetroM}m closer to metro`,
      explanationKa: a.distanceMetroM < b.distanceMetroM ? `${a.name} ${b.distanceMetroM - a.distanceMetroM}მ-ით ახლოსაა მეტროსთან` : `${b.name} ${a.distanceMetroM - b.distanceMetroM}მ-ით ახლოსაა მეტროსთან`,
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

export interface MortgageEstimate {
  propertyPriceUSD: number
  loanAmountUSD: number
  downPaymentUSD: number
  monthlyPaymentUSD: number
  totalInterestUSD: number
  totalPaybackUSD: number
}

/** Mortgage monthly payment & total payback calculator */
export function calculateMortgageEstimate(
  priceUSD: number,
  downPaymentPct = 20, // 20% default down payment
  annualInterestRatePct = 8.5, // 8.5% average USD mortgage rate in Georgia/Emerging markets
  loanTermYears = 20
): MortgageEstimate {
  const downPaymentUSD = Math.round(priceUSD * (downPaymentPct / 100))
  const loanAmountUSD = Math.max(0, priceUSD - downPaymentUSD)

  if (loanAmountUSD <= 0) {
    return {
      propertyPriceUSD: priceUSD,
      loanAmountUSD: 0,
      downPaymentUSD: priceUSD,
      monthlyPaymentUSD: 0,
      totalInterestUSD: 0,
      totalPaybackUSD: priceUSD,
    }
  }

  const monthlyRate = annualInterestRatePct / 100 / 12
  const totalMonths = loanTermYears * 12

  // Annuity formula: P * (r * (1+r)^n) / ((1+r)^n - 1)
  const factor = Math.pow(1 + monthlyRate, totalMonths)
  const monthlyPaymentUSD = Math.round(loanAmountUSD * ((monthlyRate * factor) / (factor - 1)))
  const totalPaybackUSD = monthlyPaymentUSD * totalMonths
  const totalInterestUSD = Math.round(totalPaybackUSD - loanAmountUSD)

  return {
    propertyPriceUSD: priceUSD,
    loanAmountUSD,
    downPaymentUSD,
    monthlyPaymentUSD,
    totalInterestUSD,
    totalPaybackUSD,
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
  countryCode = 'GE',
  citySlug?: string,
): TcoBreakdown {
  const code = countryCode.toUpperCase()
  let regTaxRate = 0.001 // Georgia registration (~$50-$200 flat equivalent)
  let notaryRate = 0.002
  let annualUpkeepRate = 0.01 // 1% per year maintenance
  let annualHoaRate = 0.005 // 0.5% HOA

  switch (code) {
    case 'DE':
      // Berlin 6% is the default; Bavaria is 3.5% — never invent a national rate.
      regTaxRate = (deCityBySlug(citySlug ?? 'berlin')?.transferTaxPct ?? 6) / 100
      notaryRate = 0.015 // Notary ~1.5%
      annualUpkeepRate = 0.015
      annualHoaRate = 0.01
      break
    case 'AE':
      // Dubai 4% DLD; Abu Dhabi / Sharjah / RAK 2%. Unknown slug → Dubai.
      regTaxRate = aeTransferFeePct(citySlug) / 100
      notaryRate = 0.005
      annualUpkeepRate = 0.012
      annualHoaRate = 0.008
      break
    case 'FR':
      regTaxRate = 0.075 // Frais de notaire on resale ~7.5%
      notaryRate = 0.01
      annualUpkeepRate = 0.015
      annualHoaRate = 0.012
      break
    case 'ES':
      regTaxRate = 0.08 // ITP average ~8%
      notaryRate = 0.015
      annualUpkeepRate = 0.012
      annualHoaRate = 0.008
      break
    case 'IT':
      regTaxRate = 0.09 // Imposta di registro ~9% (or 2% prima casa)
      notaryRate = 0.02
      annualUpkeepRate = 0.015
      annualHoaRate = 0.01
      break
    case 'GB':
      regTaxRate = 0.05 // SDLT average ~5%
      notaryRate = 0.01
      annualUpkeepRate = 0.012
      annualHoaRate = 0.015
      break
    case 'US':
      regTaxRate = 0.015 // Title/transfer closing costs ~1.5%
      notaryRate = 0.005
      annualUpkeepRate = 0.015
      annualHoaRate = 0.01
      break
    case 'NL':
      regTaxRate = 0.104 // Overdrachtsbelasting 10.4% investor / 2% primary
      notaryRate = 0.01
      annualUpkeepRate = 0.012
      annualHoaRate = 0.01
      break
    case 'PT':
      regTaxRate = 0.06 // IMT ~6%
      notaryRate = 0.01
      annualUpkeepRate = 0.012
      annualHoaRate = 0.008
      break
    case 'CH':
      regTaxRate = 0.015 // Average cantonal transfer/notary
      notaryRate = 0.01
      annualUpkeepRate = 0.01
      annualHoaRate = 0.01
      break
    case 'AT':
      regTaxRate = 0.035 // Grunderwerbsteuer 3.5%
      notaryRate = 0.015
      annualUpkeepRate = 0.012
      annualHoaRate = 0.01
      break
    case 'BE':
      regTaxRate = 0.125 // Registration duty 12.5% Brussels
      notaryRate = 0.02
      annualUpkeepRate = 0.015
      annualHoaRate = 0.012
      break
    case 'IE':
      regTaxRate = 0.015 // Stamp duty 1-2%
      notaryRate = 0.012
      annualUpkeepRate = 0.012
      annualHoaRate = 0.01
      break
    case 'PL':
      regTaxRate = 0.02 // PCC 2%
      notaryRate = 0.01
      annualUpkeepRate = 0.01
      annualHoaRate = 0.01
      break
    case 'CZ':
      regTaxRate = 0.0 // 0% acquisition tax
      notaryRate = 0.01
      annualUpkeepRate = 0.01
      annualHoaRate = 0.01
      break
    case 'GR':
      regTaxRate = 0.0309 // FMA 3.09%
      notaryRate = 0.015
      annualUpkeepRate = 0.012
      annualHoaRate = 0.008
      break
    case 'SE':
      regTaxRate = 0.0 // Bostadsrätt cooperative 0% stamp duty
      notaryRate = 0.005
      annualUpkeepRate = 0.01
      annualHoaRate = 0.012
      break
    default:
      regTaxRate = 0.03
      notaryRate = 0.01
      annualUpkeepRate = 0.01
      annualHoaRate = 0.01
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

export interface InvestmentScenario {
  label: 'BEAR' | 'BASE' | 'BULL'
  descriptionEn: string
  descriptionKa: string
  monthlyRentUSD: number
  vacancyWeeksPerYear: number
  annualAppreciationPct: number
  netAnnualRentUSD: number
  fiveYearTotalReturnUSD: number
  fiveYearRoiPct: number
  internalRateOfReturnPct: number
}

export interface InvestmentScenarioModel {
  scenarios: {
    bear: InvestmentScenario
    base: InvestmentScenario
    bull: InvestmentScenario
  }
  sensitivity: {
    factorEn: string
    factorKa: string
    impactDescriptionEn: string
    impactDescriptionKa: string
  }[]
  liquidityRating: 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'CONSTRAINED'
  fairValueEstimateUSD: number
  fairValueRange: { minUSD: number; maxUSD: number }
}

/** Comprehensive Bear / Base / Bull scenario analysis & sensitivity modeling */
export function generateInvestmentScenarios(
  purchasePriceUSD: number,
  marketRentUSD: number,
  options?: {
    districtMedianPerSqm?: number
    areaSqm?: number
    liquidityScore?: number
  }
): InvestmentScenarioModel {
  const price = Math.max(1, purchasePriceUSD)
  const baseRent = Math.max(1, marketRentUSD)

  // Bear: 12% lower rent, 6 weeks vacancy, 1.5% appreciation, 22% operating costs
  const bearRent = Math.round(baseRent * 0.88)
  const bearGross = bearRent * (52 - 6) / (52 / 12)
  const bearNet = Math.round(bearGross * 0.78)
  const bearFV = price * Math.pow(1 + 0.015, 5)
  const bearEquity = Math.round(bearFV - price)
  const bearTotal = bearEquity + bearNet * 5
  const bearRoi = Math.round((bearTotal / price) * 1000) / 10

  // Base: standard market rent, 3 weeks vacancy, 5.0% appreciation, 15% operating costs
  const baseGross = baseRent * (52 - 3) / (52 / 12)
  const baseNet = Math.round(baseGross * 0.85)
  const baseFV = price * Math.pow(1 + 0.05, 5)
  const baseEquity = Math.round(baseFV - price)
  const baseTotal = baseEquity + baseNet * 5
  const baseRoi = Math.round((baseTotal / price) * 1000) / 10

  // Bull: 10% premium rent, 1 week vacancy, 8.0% appreciation, 10% operating costs
  const bullRent = Math.round(baseRent * 1.10)
  const bullGross = bullRent * (52 - 1) / (52 / 12)
  const bullNet = Math.round(bullGross * 0.90)
  const bullFV = price * Math.pow(1 + 0.08, 5)
  const bullEquity = Math.round(bullFV - price)
  const bullTotal = bullEquity + bullNet * 5
  const bullRoi = Math.round((bullTotal / price) * 1000) / 10

  // Fair value modeling
  let fairValue = price
  if (options?.districtMedianPerSqm && options?.areaSqm && options.areaSqm > 0) {
    fairValue = Math.round(options.districtMedianPerSqm * options.areaSqm)
  }

  let liquidityRating: InvestmentScenarioModel['liquidityRating'] = 'HIGH'
  if ((options?.liquidityScore ?? 75) > 85) liquidityRating = 'VERY_HIGH'
  else if ((options?.liquidityScore ?? 75) < 50) liquidityRating = 'MODERATE'
  else if ((options?.liquidityScore ?? 75) < 30) liquidityRating = 'CONSTRAINED'

  return {
    scenarios: {
      bear: {
        label: 'BEAR',
        descriptionEn: 'Conservative: softer tenancy demand, higher void periods, modest inflation growth.',
        descriptionKa: 'კონსერვატიული: დაბალი მოთხოვნა, მეტი ვაკანსია, ზომიერი ფასის ზრდა.',
        monthlyRentUSD: bearRent,
        vacancyWeeksPerYear: 6,
        annualAppreciationPct: 1.5,
        netAnnualRentUSD: bearNet,
        fiveYearTotalReturnUSD: bearTotal,
        fiveYearRoiPct: bearRoi,
        internalRateOfReturnPct: Math.round((bearRoi / 5) * 10) / 10,
      },
      base: {
        label: 'BASE',
        descriptionEn: 'Baseline: current market rent, historical 5% appreciation, standard management capex.',
        descriptionKa: 'საბაზისო: მიმდინარე საბაზრო ქირა, 5%-იანი ზრდა, სტანდარტული ხარჯები.',
        monthlyRentUSD: baseRent,
        vacancyWeeksPerYear: 3,
        annualAppreciationPct: 5.0,
        netAnnualRentUSD: baseNet,
        fiveYearTotalReturnUSD: baseTotal,
        fiveYearRoiPct: baseRoi,
        internalRateOfReturnPct: Math.round((baseRoi / 5) * 10) / 10,
      },
      bull: {
        label: 'BULL',
        descriptionEn: 'Optimistic: premium corporate/expat tenant, infrastructure expansion, accelerated growth.',
        descriptionKa: 'ოპტიმისტური: პრემიუმ დამქირავებელი, ინფრასტრუქტურის ზრდა, მაღალი ზრდის ტემპი.',
        monthlyRentUSD: bullRent,
        vacancyWeeksPerYear: 1,
        annualAppreciationPct: 8.0,
        netAnnualRentUSD: bullNet,
        fiveYearTotalReturnUSD: bullTotal,
        fiveYearRoiPct: bullRoi,
        internalRateOfReturnPct: Math.round((bullRoi / 5) * 10) / 10,
      },
    },
    sensitivity: [
      {
        factorEn: 'Interest Rate Shift (±1.0%)',
        factorKa: 'საპროცენტო განაკვეთის ცვლილება (±1.0%)',
        impactDescriptionEn: 'A 100 bps mortgage rate rise increases monthly debt service by ~6.5%, compressing cash-on-cash yield.',
        impactDescriptionKa: 'განაკვეთის 1%-ით ზრდა ზრდის ყოველთვიურ გადასახადს ~6.5%-ით.',
      },
      {
        factorEn: 'Vacancy Duration (±4 weeks)',
        factorKa: 'ვაკანსიის პერიოდი (±4 კვირა)',
        impactDescriptionEn: 'Each additional month of tenant vacancy reduces annual gross yield by approx. 0.6–0.8%.',
        impactDescriptionKa: 'ვაკანსიის ყოველი დამატებითი თვე ამცირებს წლიურ მომგებიანობას ~0.7%-ით.',
      },
      {
        factorEn: 'Purchase Price Negotiation (±5%)',
        factorKa: 'შესასყიდი ფასის მოლაპარაკება (±5%)',
        impactDescriptionEn: 'A 5% discount on entry price boosts 5-year total ROI by approximately 8.2 percentage points.',
        impactDescriptionKa: 'საწყის ფასზე 5%-იანი ფასდაკლება 5-წლიან ROI-ს ზრდის ~8.2%-ით.',
      },
    ],
    liquidityRating,
    fairValueEstimateUSD: fairValue,
    fairValueRange: {
      minUSD: Math.round(fairValue * 0.92),
      maxUSD: Math.round(fairValue * 1.08),
    },
  }
}

export interface PropertyDecisionAnalysis {
  whyRecommendEn: string[]
  whyRecommendKa: string[]
  whyNotEn: string[]
  whyNotKa: string[]
  targetBuyerProfileEn: string
  targetBuyerProfileKa: string
  avoidBuyerProfileEn: string
  avoidBuyerProfileKa: string
  confidenceScore: number
  dueDiligenceChecklist: {
    itemEn: string
    itemKa: string
    isCritical: boolean
  }[]
}

/** Grounded decision intelligence: why SIVRCE recommends vs why not, target buyer profile & diligence checklist */
export function generatePropertyDecisionAnalysis(property: {
  priceUSD: number
  areaSqm: number
  districtMedianPerSqm?: number
  isCadastreVerified?: boolean
  distanceMetroM?: number
  grossYieldPct?: number
  floor?: number
  totalFloors?: number
  hasElevator?: boolean
  buildingAgeYears?: number
}): PropertyDecisionAnalysis {
  const whyRecommendEn: string[] = []
  const whyRecommendKa: string[] = []
  const whyNotEn: string[] = []
  const whyNotKa: string[] = []

  const pSqm = Math.round(property.priceUSD / Math.max(1, property.areaSqm))
  const median = property.districtMedianPerSqm ?? pSqm

  // 1. Valuation & Price
  if (pSqm < median * 0.95) {
    const savings = Math.round(((median - pSqm) / median) * 100)
    whyRecommendEn.push(`Priced ${savings}% below district median ($${pSqm}/m² vs $${median}/m²), offering built-in equity margin.`)
    whyRecommendKa.push(`უბნის მედიანაზე ${savings}%-ით დაბალი ფასი ($${pSqm}/კვ.მ vs $${median}/კვ.მ), საწყისი კაპიტალის უპირატესობით.`)
  } else if (pSqm > median * 1.15) {
    whyNotEn.push(`Trades at a ${Math.round(((pSqm - median) / median) * 100)}% premium over district average ($${pSqm}/m² vs $${median}/m²).`)
    whyNotKa.push(`უბნის საშუალო ფასზე ${Math.round(((pSqm - median) / median) * 100)}%-ით ძვირია ($${pSqm}/კვ.მ vs $${median}/კვ.მ).`)
  }

  // 2. Cadastre & Verification
  if (property.isCadastreVerified) {
    whyRecommendEn.push('Direct public registry cadastre verification with confirmed title provenance and zero recorded encumbrances.')
    whyRecommendKa.push('საჯარო რეესტრში დამოწმებული საკადასტრო კოდი სუფთა ისტორიით და შეზღუდვების გარეშე.')
  } else {
    whyNotEn.push('Unverified cadastre record: requires full title extraction from public registry prior to earnest deposit.')
    whyNotKa.push('შეუმოწმებელი საკადასტრო კოდი: მოითხოვს ამონაწერის დეტალურ შემოწმებას ბეს გადახდამდე.')
  }

  // 3. Transit & Accessibility
  if (property.distanceMetroM !== undefined && property.distanceMetroM < 500) {
    whyRecommendEn.push(`Prime transit accessibility: only ${property.distanceMetroM}m to the nearest metro station, driving consistent tenant occupancy.`)
    whyRecommendKa.push(`შესანიშნავი ლოკაცია: მხოლოდ ${property.distanceMetroM} მეტრი მეტრომდე, რაც უზრუნველყოფს მუდმივ მოთხოვნას.`)
  } else if (property.distanceMetroM !== undefined && property.distanceMetroM > 1500) {
    whyNotEn.push(`Located ${Math.round(property.distanceMetroM / 1000 * 10) / 10}km from rapid transit; heavily car-dependent rental demographic.`)
    whyNotKa.push(`მეტროდან დაშორებულია ${Math.round(property.distanceMetroM / 1000 * 10) / 10} კმ-ით; საჭიროებს ავტომობილს გადასაადგილებლად.`)
  }

  // 4. Yield & Cash Flow
  if (property.grossYieldPct && property.grossYieldPct >= 8.5) {
    whyRecommendEn.push(`Strong cash flow profile with ${property.grossYieldPct}% projected gross yield, outpacing standard sovereign debt return.`)
    whyRecommendKa.push(`მაღალი საიჯარო შემოსავალი ${property.grossYieldPct}% წლიური მომგებიანობით.`)
  }

  // 5. Building structure
  if (property.floor && property.floor > 3 && property.hasElevator === false) {
    whyNotEn.push(`Upper floor unit (floor ${property.floor}) without elevator access limits family and elderly tenant liquidity.`)
    whyNotKa.push(`მაღალი სართული (სართული ${property.floor}) ლიფტის გარეშე ზღუდავს ოჯახების და უფროსი ასაკის დამქირავებელთა ბაზარს.`)
  }

  // Defaults if sparse
  if (whyRecommendEn.length === 0) {
    whyRecommendEn.push('Central district location with predictable rental demand and long-term liquidity.')
    whyRecommendKa.push('მოთხოვნადი ლოკაცია სტაბილური საიჯარო შემოსავლით და ლიკვიდურობით.')
  }
  if (whyNotEn.length === 0) {
    whyNotEn.push('Requires verification of utility submetering and HOA maintenance balance before contract.')
    whyNotKa.push('საჭიროებს კომუნალური დავალიანებებისა და ამხანაგობის ხარჯების გადამოწმებას.')
  }

  let confidence = 70
  if (property.isCadastreVerified) confidence += 15
  if (property.districtMedianPerSqm) confidence += 10
  if (property.distanceMetroM !== undefined) confidence += 5

  return {
    whyRecommendEn,
    whyRecommendKa,
    whyNotEn,
    whyNotKa,
    targetBuyerProfileEn: 'Long-term capital growth investor or primary resident seeking proven district infrastructure and predictable liquidity.',
    targetBuyerProfileKa: 'გრძელვადიანი ინვესტორი ან მაცხოვრებელი, რომელსაც სურს სტაბილური კაპიტალის ზრდა და განვითარებული ინფრასტრუქტურა.',
    avoidBuyerProfileEn: 'Short-term speculative flipper or highly leveraged buyer with rigid cash-flow sensitivity to vacancy void periods.',
    avoidBuyerProfileKa: 'მოკლევადიანი სპეკულაციური მყიდველი ან მაღალი სესხის მქონე პირი, რომელსაც არ აქვს ვაკანსიის ფინანსური ბუფერი.',
    confidenceScore: Math.min(100, confidence),
    dueDiligenceChecklist: [
      {
        itemEn: 'Public Registry title deed & encumbrance extract (NAPR / Grundbuch / Cadastre)',
        itemKa: 'საჯარო რეესტრის განახლებული ამონაწერი (იპოთეკის და ყადაღის შემოწმება)',
        isCritical: true,
      },
      {
        itemEn: 'Building permit & technical commissioning certificate',
        itemKa: 'შენობის ექსპლუატაციაში მიღების და ნებართვების შემოწმება',
        isCritical: true,
      },
      {
        itemEn: 'HOA (Amkhanagoba/Condominio/VvE) arrears & reserve fund status',
        itemKa: 'ამხანაგობის საერთო ხარჯებისა და სარეზერვო ფონდის შემოწმება',
        isCritical: false,
      },
      {
        itemEn: 'Energy performance certificate (DPE / EPC / Energieausweis / BER)',
        itemKa: 'ენერგოეფექტურობის სერტიფიკატის შემოწმება',
        isCritical: false,
      },
    ],
  }
}

