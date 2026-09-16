/**
 * SIVRCE — German market config for the rent-vs-buy model.
 *
 * Wires the deterministic rentVsBuy() model to the statutory German purchase
 * cost structure: Grunderwerbsteuer per Bundesland, GNotKG notary, Grundbuch
 * and §656c BGB Makler share — all sourced from de.ts / de-proptech-os.ts,
 * never invented here. DB-free, SSR-safe.
 *
 * ponytail: market-level fixed assumptions are stated constants (2.5% rent
 * growth, 4% selling costs, 1.2% ownership costs) — visible in the page
 * disclaimer. Per-scenario Makler splits (provisionsfrei) when users ask.
 */

import { calculateDeAcquisitionCosts } from './de-proptech-os'
import { GRUNDERWERBSTEUER_BY_STATE } from './de'
import { rentVsBuy, type RentBuyInput, type RentBuyResult } from '../rent-buy'

/** Statutory states with Grunderwerbsteuer rates (same order as de.ts). */
export const DE_RENT_BUY_STATES = Object.keys(GRUNDERWERBSTEUER_BY_STATE)
export const DE_RENT_BUY_DEFAULT_STATE = 'Berlin'

/** Assumptions the DE UI does not expose as sliders. */
export const DE_FIXED_ASSUMPTIONS = {
  rentInflationPct: 2.5,
  sellCostsPct: 4,
  ownershipCostsPct: 1.2,
} as const

/** Annuity is modelled over the full term; Zinsbindung/Folgezins is disclosed in the page FAQ. */
export const DE_MORTGAGE_YEARS = 30

/**
 * One-off purchase costs as % of price, from the statutory engine.
 * Berlin 500k € → 6% GrESt + 1.5% Notar + 0.5% Grundbuch + 3.57% Makler = 11.57%.
 */
export function deBuyCostsPct(
  priceEur: number,
  state: string = DE_RENT_BUY_DEFAULT_STATE,
): { pct: number; totalEur: number; transferTaxPct: number } {
  const price = Math.max(0, priceEur)
  const costs = calculateDeAcquisitionCosts(price, state)
  return {
    pct: price > 0 ? (costs.totalClosingCostsEur / price) * 100 : 0,
    totalEur: costs.totalClosingCostsEur,
    transferTaxPct: costs.transferTaxPct,
  }
}

export function deRentVsBuy(i: Omit<RentBuyInput, keyof typeof DE_FIXED_ASSUMPTIONS | 'mortgageYears'>): RentBuyResult {
  return rentVsBuy({ ...i, mortgageYears: DE_MORTGAGE_YEARS, ...DE_FIXED_ASSUMPTIONS })
}
