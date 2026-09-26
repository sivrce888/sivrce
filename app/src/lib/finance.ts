/**
 * SIVRCE — tiny financial helpers shared by listing detail + mortgage hub.
 * ponytail: stdlib only; one formula, two call sites. No external lib.
 */

/** Standard amortized-loan monthly payment (annuity formula). */
export function monthlyPayment(principal: number, annualRatePct: number, years: number): number {
  const r = annualRatePct / 100 / 12
  const n = years * 12
  if (principal <= 0 || n <= 0) return 0
  if (r === 0) return principal / n
  return (principal * r) / (1 - Math.pow(1 + r, -n))
}

/** Differentiated (declining balance) payment for a specific month (1-indexed). */
export function differentiatedPayment(principal: number, annualRatePct: number, years: number, month: number): number {
  const n = years * 12
  if (principal <= 0 || n <= 0 || month <= 0 || month > n) return 0
  const monthlyPrincipal = principal / n
  const remainingPrincipal = principal - (month - 1) * monthlyPrincipal
  const monthlyInterest = (remainingPrincipal * (annualRatePct / 100)) / 12
  return monthlyPrincipal + monthlyInterest
}

export interface AmortizationPoint {
  year: number
  remainingBalance: number
  totalPrincipalPaid: number
  totalInterestPaid: number
}

/** Generates yearly amortization breakdown milestones without heavy libs. */
export function amortizationSchedule(principal: number, annualRatePct: number, years: number): AmortizationPoint[] {
  if (principal <= 0 || years <= 0) return []
  const monthly = monthlyPayment(principal, annualRatePct, years)
  const monthlyRate = annualRatePct / 100 / 12
  let balance = principal
  let totalInterest = 0
  let totalPrincipal = 0
  const schedule: AmortizationPoint[] = []

  for (let y = 1; y <= years; y++) {
    for (let m = 1; m <= 12; m++) {
      if (balance <= 0) break
      const interestPart = balance * monthlyRate
      const principalPart = Math.min(balance, monthly - interestPart)
      balance = Math.max(0, balance - principalPart)
      totalInterest += interestPart
      totalPrincipal += principalPart
    }
    schedule.push({
      year: y,
      remainingBalance: Math.round(balance),
      totalPrincipalPaid: Math.round(totalPrincipal),
      totalInterestPaid: Math.round(totalInterest),
    })
  }
  return schedule
}

export interface BankRateInfo {
  id: string
  name: string
  localName: string
  gelRate: number
  usdRate: number
  eurRate: number
  maxYears: number
  minDownResidentPct: number
  minDownNonResidentPct: number
  digitalPreApproval: boolean
}

export const GEORGIAN_BANKS: readonly BankRateInfo[] = [
  {
    id: 'bog',
    name: 'Bank of Georgia',
    localName: 'საქართველოს ბანკი',
    gelRate: 9.8,
    usdRate: 7.2,
    eurRate: 6.2,
    maxYears: 25,
    minDownResidentPct: 15,
    minDownNonResidentPct: 30,
    digitalPreApproval: true,
  },
  {
    id: 'tbc',
    name: 'TBC Bank',
    localName: 'თიბისი ბანკი',
    gelRate: 10.2,
    usdRate: 7.5,
    eurRate: 6.5,
    maxYears: 25,
    minDownResidentPct: 15,
    minDownNonResidentPct: 30,
    digitalPreApproval: true,
  },
  {
    id: 'basis',
    name: 'BasisBank',
    localName: 'ბაზისბანკი',
    gelRate: 10.5,
    usdRate: 7.8,
    eurRate: 6.8,
    maxYears: 20,
    minDownResidentPct: 20,
    minDownNonResidentPct: 30,
    digitalPreApproval: false,
  },
  {
    id: 'credo',
    name: 'Credo Bank',
    localName: 'კრედო ბანკი',
    gelRate: 11.5,
    usdRate: 8.2,
    eurRate: 7.2,
    maxYears: 20,
    minDownResidentPct: 15,
    minDownNonResidentPct: 35,
    digitalPreApproval: true,
  },
] as const

/** Georgian National Bank (NBG) macroprudential LTV limit validator */
export function validateLtv(downPct: number, isResident = true): { valid: boolean; minDownPct: number; currentLtvPct: number } {
  const minDownPct = isResident ? 15 : 30
  const currentLtvPct = Math.max(0, 100 - downPct)
  return {
    valid: downPct >= minDownPct,
    minDownPct,
    currentLtvPct,
  }
}

/** Georgian property-transfer tax: 1% on first 100,000 GEL, 2% above. */
export function transferTaxGEL(assessedValueGEL: number): number {
  if (assessedValueGEL <= 0) return 0
  if (assessedValueGEL <= 100_000) return assessedValueGEL * 0.01
  return 1_000 + (assessedValueGEL - 100_000) * 0.02
}

/** Gross monthly rent heuristic: 0.5% of price, rounded to $50. */
export function estimateMonthlyRent(priceUSD: number): number {
  if (priceUSD <= 0) return 0
  return Math.round((priceUSD * 0.005) / 50) * 50
}

/** Annual gross yield from monthly rent, one decimal. */
export function grossYieldPct(priceUSD: number, monthlyRent: number): number {
  if (priceUSD <= 0) return 0
  return Math.round(((monthlyRent * 12) / priceUSD) * 1000) / 10
}

/** Payment-to-income % for the mortgage eligibility pre-check (client + server parity).
 *  Null when income is unknown — a verdict without income is noise. */
export function dtiPct(monthlyUSD: number, otherDebtUSD: number, incomeUSD: number): number | null {
  return incomeUSD > 0 ? ((monthlyUSD + otherDebtUSD) / incomeUSD) * 100 : null
}

