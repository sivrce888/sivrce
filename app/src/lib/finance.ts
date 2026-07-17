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

/** Georgian property-transfer tax: 1% on first 100,000 GEL, 2% above. */
export function transferTaxGEL(assessedValueGEL: number): number {
  if (assessedValueGEL <= 0) return 0
  if (assessedValueGEL <= 100_000) return assessedValueGEL * 0.01
  return 1_000 + (assessedValueGEL - 100_000) * 0.02
}
