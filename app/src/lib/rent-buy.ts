/**
 * SIVRCE — rent-vs-buy comparison model (deterministic, monthly loop).
 *
 * Both paths build wealth for `horizonYears`; the owner builds equity,
 * the renter invests the money a buyer would have sunk into down payment
 * and purchase costs, plus whoever pays less per month invests the
 * difference. No tax deductions — Georgia has no individual
 * mortgage-interest deduction.
 *
 * ponytail: NYT-lite model; per-country tax/cost config in
 * lib/countries/costs when a second market needs different rules.
 */

import { monthlyPayment } from './finance'

export interface RentBuyInput {
  /** Property price. */
  price: number
  /** Down payment, % of price. */
  downPct: number
  /** Mortgage annual rate, %. */
  ratePct: number
  /** Loan term, years. */
  mortgageYears: number
  /** How long you stay before selling, years. */
  horizonYears: number
  /** Month-1 rent for an equivalent home. */
  rentMonthly: number
  /** Annual rent growth, %. */
  rentInflationPct: number
  /** Annual home-value growth, %. */
  appreciationPct: number
  /** Annual return on invested savings, %. */
  altReturnPct: number
  /** One-off purchase costs (taxes, notary/registry, agent), % of price. */
  buyCostsPct: number
  /** One-off selling costs at horizon end, % of sale value. */
  sellCostsPct: number
  /** Annual property tax + maintenance + insurance, % of price. */
  ownershipCostsPct: number
}

/** Georgian-market assumptions the UI does not expose as sliders. */
export const FIXED_ASSUMPTIONS = {
  rentInflationPct: 5,
  // GE: no transfer tax; NAPR fee ₾50–350 + notary/translation + title check. Seller pays the agent.
  buyCostsPct: 0.5,
  sellCostsPct: 2,
  ownershipCostsPct: 0.8,
} as const

export interface RentBuyResult {
  /** First-month cost of owning (mortgage payment + ownership costs). */
  ownFirstMonth: number
  rentFirstMonth: number
  /** Wealth at horizon end on each path. */
  buyNetWorth: number
  rentNetWorth: number
  delta: number
  buyWins: boolean
  /** First whole year where owning pulls ahead; null if never within the horizon. */
  breakEvenYear: number | null
}

export function rentVsBuy(i: RentBuyInput): RentBuyResult {
  const months = Math.max(1, Math.round(i.horizonYears * 12))
  const loanMonths = Math.max(1, Math.round(i.mortgageYears * 12))
  const loan = i.price * (1 - i.downPct / 100)
  const pi = monthlyPayment(loan, i.ratePct, i.mortgageYears)
  const ownBase = (i.price * i.ownershipCostsPct) / 100 / 12
  const r = i.altReturnPct / 100 / 12
  const rentGrowth = Math.pow(1 + i.rentInflationPct / 100, 1 / 12)
  const valueGrowth = Math.pow(1 + i.appreciationPct / 100, 1 / 12)

  let balance = loan
  let value = i.price
  let rent = i.rentMonthly
  let renterPot = i.price * (i.downPct / 100) + (i.price * i.buyCostsPct) / 100
  let ownerPot = 0
  let breakEvenYear: number | null = null

  for (let m = 1; m <= months; m++) {
    const ownCost = ownBase + (m <= loanMonths ? pi : 0)
    if (m <= loanMonths) balance = Math.max(0, balance * (1 + i.ratePct / 100 / 12) - pi)
    value *= valueGrowth
    renterPot = renterPot * (1 + r) + Math.max(0, ownCost - rent)
    ownerPot = ownerPot * (1 + r) + Math.max(0, rent - ownCost)
    rent *= rentGrowth
    if (breakEvenYear === null && m % 12 === 0) {
      const equity = value - balance - (value * i.sellCostsPct) / 100
      if (equity + ownerPot >= renterPot) breakEvenYear = m / 12
    }
  }

  const buyNetWorth = value - balance - (value * i.sellCostsPct) / 100 + ownerPot
  const rentNetWorth = renterPot
  return {
    ownFirstMonth: ownBase + pi,
    rentFirstMonth: i.rentMonthly,
    buyNetWorth,
    rentNetWorth,
    delta: buyNetWorth - rentNetWorth,
    buyWins: buyNetWorth >= rentNetWorth,
    breakEvenYear,
  }
}
