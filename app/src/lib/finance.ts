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

