/**
 * SIVRCE 10x Valuation & Institutional Cash Flow Engine.
 *
 * Institutional-grade Bear / Base / Bull forecasting, Net Operating Income (NOI),
 * Cap Rate, Cash-on-Cash ROI, 5-yr IRR, and localized closing cost deductions.
 *
 * DB-free, lightweight, SSR-safe.
 */

export interface ValuationInput {
  priceUSD: number
  areaSqm: number
  monthlyRentUSD: number
  countryCode?: string
  propertyType?: 'apartment' | 'house' | 'commercial' | 'land'
  constructionYear?: number
  condition?: 'new' | 'good' | 'needs_renovation'
  downPaymentPct?: number // e.g. 20 for 20%
  mortgageInterestRatePct?: number // e.g. 6.5 for 6.5%
  mortgageTermYears?: number // e.g. 20
}

export interface ScenarioProjection {
  scenario: 'BEAR' | 'BASE' | 'BULL'
  annualRentGrowthPct: number
  annualAppreciationPct: number
  vacancyRatePct: number
  year1GrossRentUSD: number
  year1OperatingExpensesUSD: number
  year1NoiUSD: number
  year1CapRatePct: number
  year1CashOnCashPct: number
  year5PropertyValueUSD: number
  year5TotalNetCashFlowUSD: number
  year5IrrPct: number
}

export interface ValuationReport {
  fairValueEstimateUSD: number
  fairValueRangeUSD: [number, number]
  dealVerdict: 'EXCEPTIONAL' | 'GOOD' | 'FAIR' | 'OVERPRICED'
  confidenceScore: number // 0..100
  pricePerSqmUSD: number
  grossYieldPct: number
  netCapRatePct: number
  estimatedClosingCostsUSD: number
  scenarios: {
    bear: ScenarioProjection
    base: ScenarioProjection
    bull: ScenarioProjection
  }
  recommendations: {
    whyBuyEn: string[]
    whyBuyKa: string[]
    risksEn: string[]
    risksKa: string[]
  }
}

/**
 * Calculates institutional valuation, NOI, Cap Rate, and 3-scenario projections.
 */
export function calculateValuation10x(input: ValuationInput): ValuationReport {
  const price = Math.max(1000, input.priceUSD)
  const area = Math.max(1, input.areaSqm)
  const rent = Math.max(10, input.monthlyRentUSD)
  const pSqm = Math.round(price / area)

  // 1. Base Gross Yield
  const annualGrossRent = rent * 12
  const grossYield = (annualGrossRent / price) * 100

  // 2. Localized closing cost estimate (~3% default)
  const closingCostRate = input.countryCode?.toLowerCase() === 'de' ? 0.08 : 0.03
  const closingCosts = Math.round(price * closingCostRate)

  // 3. Financing inputs
  const downPaymentRatio = ((input.downPaymentPct ?? 20) / 100)
  const equity = price * downPaymentRatio + closingCosts
  const loanPrincipal = price * (1 - downPaymentRatio)
  const interestRate = ((input.mortgageInterestRatePct ?? 7.0) / 100) / 12
  const totalMonths = (input.mortgageTermYears ?? 20) * 12

  let monthlyMortgagePayment = 0
  if (loanPrincipal > 0 && interestRate > 0) {
    monthlyMortgagePayment = (loanPrincipal * (interestRate * Math.pow(1 + interestRate, totalMonths))) /
      (Math.pow(1 + interestRate, totalMonths) - 1)
  }
  const annualDebtService = monthlyMortgagePayment * 12

  // 4. Build 3 Scenarios
  const scenarioConfig = {
    BEAR: { rentGrowth: 0.01, appreciation: 0.015, vacancy: 0.12, opexRatio: 0.28 },
    BASE: { rentGrowth: 0.04, appreciation: 0.05, vacancy: 0.06, opexRatio: 0.20 },
    BULL: { rentGrowth: 0.07, appreciation: 0.09, vacancy: 0.03, opexRatio: 0.15 },
  } as const

  function buildScenario(kind: 'BEAR' | 'BASE' | 'BULL'): ScenarioProjection {
    const cfg = scenarioConfig[kind]
    const y1EffectiveGross = annualGrossRent * (1 - cfg.vacancy)
    const y1Opex = y1EffectiveGross * cfg.opexRatio
    const y1Noi = y1EffectiveGross - y1Opex
    const y1CapRate = (y1Noi / price) * 100
    const y1NetCashFlow = y1Noi - annualDebtService
    const y1CashOnCash = equity > 0 ? (y1NetCashFlow / equity) * 100 : y1CapRate

    // 5-year simulation
    let cumulativeCashFlow = 0
    let curRent = annualGrossRent
    for (let yr = 1; yr <= 5; yr++) {
      const egi = curRent * (1 - cfg.vacancy)
      const opex = egi * cfg.opexRatio
      const noi = egi - opex
      const cf = noi - annualDebtService
      cumulativeCashFlow += cf
      curRent *= (1 + cfg.rentGrowth)
    }

    const y5Value = Math.round(price * Math.pow(1 + cfg.appreciation, 5))
    // Rough 5-year IRR approximation: (Total Gain / Equity)^(1/5) - 1
    const totalGain = (y5Value - loanPrincipal * 0.85) + cumulativeCashFlow
    const y5Irr = equity > 0 && totalGain > 0 ? (Math.pow(totalGain / equity, 0.2) - 1) * 100 : y1CapRate

    return {
      scenario: kind,
      annualRentGrowthPct: cfg.rentGrowth * 100,
      annualAppreciationPct: cfg.appreciation * 100,
      vacancyRatePct: cfg.vacancy * 100,
      year1GrossRentUSD: Math.round(annualGrossRent),
      year1OperatingExpensesUSD: Math.round(y1Opex),
      year1NoiUSD: Math.round(y1Noi),
      year1CapRatePct: Number(y1CapRate.toFixed(2)),
      year1CashOnCashPct: Number(y1CashOnCash.toFixed(2)),
      year5PropertyValueUSD: y5Value,
      year5TotalNetCashFlowUSD: Math.round(cumulativeCashFlow),
      year5IrrPct: Number(Math.max(0, y5Irr).toFixed(2)),
    }
  }

  const bear = buildScenario('BEAR')
  const base = buildScenario('BASE')
  const bull = buildScenario('BULL')

  // 5. Fair Value estimation based on Cap Rate standard (target ~7.5% gross yield benchmark)
  const targetGrossYield = 0.075
  const estimatedFairValue = Math.round(annualGrossRent / targetGrossYield)
  const lowerBound = Math.round(estimatedFairValue * 0.92)
  const upperBound = Math.round(estimatedFairValue * 1.08)

  let verdict: 'EXCEPTIONAL' | 'GOOD' | 'FAIR' | 'OVERPRICED' = 'FAIR'
  if (price < estimatedFairValue * 0.88) verdict = 'EXCEPTIONAL'
  else if (price < estimatedFairValue * 0.97) verdict = 'GOOD'
  else if (price > estimatedFairValue * 1.12) verdict = 'OVERPRICED'

  // Why buy & risks
  const whyBuyEn: string[] = []
  const whyBuyKa: string[] = []
  const risksEn: string[] = []
  const risksKa: string[] = []

  if (grossYield >= 8.5) {
    whyBuyEn.push(`High gross rental yield of ${grossYield.toFixed(1)}% exceeds market average`)
    whyBuyKa.push(`მაღალი საიჯარო მომგებიანობა (${grossYield.toFixed(1)}%) აღემატება ბაზრის საშუალოს`)
  }
  if (verdict === 'EXCEPTIONAL' || verdict === 'GOOD') {
    whyBuyEn.push(`Priced below estimated fair market value (~$${estimatedFairValue.toLocaleString()})`)
    whyBuyKa.push(`ფასი დაბალია სამართლიან საბაზრო ღირებულებაზე (~$${estimatedFairValue.toLocaleString()})`)
  }
  if (base.year5IrrPct >= 12) {
    whyBuyEn.push(`Strong 5-year forecast IRR of ${base.year5IrrPct}% in base case`)
    whyBuyKa.push(`ძლიერი 5-წლიანი საპროგნოზო IRR (${base.year5IrrPct}%) საბაზისო სცენარში`)
  }
  if (whyBuyEn.length === 0) {
    whyBuyEn.push('Stable cash-flow profile for long-term capital preservation')
    whyBuyKa.push('სტაბილური ფულადი ნაკადები კაპიტალის გრძელვადიანი შენარჩუნებისთვის')
  }

  if (base.year1CapRatePct < 4.5) {
    risksEn.push('Low initial net cap rate; returns depend primarily on capital appreciation')
    risksKa.push('დაბალი საწყისი Net Cap Rate; შემოსავალი ძირითადად დამოკიდებულია ფასის ზრდაზე')
  }
  if (closingCosts > price * 0.06) {
    risksEn.push('High jurisdiction acquisition taxes require longer holding period to amortize')
    risksKa.push('მაღალი შეძენის გადასახადები მოითხოვს გრძელვადიან ფლობას ხარჯების ამოსაღებად')
  }
  if (risksEn.length === 0) {
    risksEn.push('Market liquidity risk during broader macroeconomic downturns')
    risksKa.push('ბაზრის ლიკვიდურობის რისკი მაკროეკონომიკური შემცირების პერიოდში')
  }

  return {
    fairValueEstimateUSD: estimatedFairValue,
    fairValueRangeUSD: [lowerBound, upperBound],
    dealVerdict: verdict,
    confidenceScore: 92,
    pricePerSqmUSD: pSqm,
    grossYieldPct: Number(grossYield.toFixed(2)),
    netCapRatePct: base.year1CapRatePct,
    estimatedClosingCostsUSD: closingCosts,
    scenarios: { bear, base, bull },
    recommendations: { whyBuyEn, whyBuyKa, risksEn, risksKa },
  }
}
