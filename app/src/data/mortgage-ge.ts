/**
 * Georgian mortgage market — the numbers a buyer actually compares, from
 * official sources only. A cell with no published figure stays null: never
 * invented. Verified 2026-09; re-verify when NBG moves the policy rate.
 *
 * Sources:
 *  - NBG max LTV 90% GEL / 70% FX: nbg.gov.ge/en/page/pti-and-ltv-requirements.
 *  - NBG max PTI (same page): income in loan currency 25% / 50%, FX loan on lari
 *    income 20% / 30%; low/high split at net income ₾1,500/month.
 *  - NBG policy rate 8.25%: nbg.gov.ge (hiked 2026-05-06, held 2026-09-09).
 *  - BasisBank bands: bb.ge/ge/personal/loans/mortgage (GEL 10.9–17.5%,
 *    USD/EUR 7.9–10.5%, term 3–240 mo GEL / 3–120 mo FX, own contribution
 *    min 15%, issuance fee 0.5–1%).
 *  - TBC "from 9.9%": tbcbank.ge mortgage financing examples; expat program
 *    own contribution from 20% (tbcbank.ge — იპოთეკური სესხი ექსპატებისთვის).
 *  - State subsidized mortgage: enterprisegeorgia.gov.ge — GEL loans up to
 *    ₾200k, rate subsidy for the first 60 months, points scale by children
 *    (4 / 5 / 6 for 1 / 2 / 3+), offered through partner banks.
 */

export interface MortgageBank {
  slug: string
  /** Latin brand as printed on the licence. */
  name: string
  /** Georgian name for the ka UI. */
  nameKa: string
  /** Advertised annual rate, GEL loans. `to` omitted when only a floor is published. */
  gel: { from: number; to?: number } | null
  /** Advertised annual rate, USD/EUR loans. */
  fx: { from: number; to?: number } | null
  /** Maximum term in months, or null when not published. */
  termMonths: number | null
  /** Minimum own contribution, % of price, or null. */
  minDownPct: number | null
  source: string
}

export const MORTGAGE_GE_AS_OF = '2026-09'

/** NBG monetary policy (refinancing) rate — the anchor every GEL rate floats on. */
export const NBG_POLICY_RATE = 8.25

/** NBG max loan-to-value by loan currency (nbg.gov.ge/en/page/pti-and-ltv-requirements).
 *  Binding on every bank — the legal floor under any published own-contribution. */
export const NBG_MAX_LTV = { gel: 90, fx: 70 } as const

/** NBG max payment-to-income, % of net monthly income. `matched` = income in the
 *  loan's currency; `fx` = FX loan repaid from lari income (unhedged). */
export const NBG_MAX_PTI = { matched: [25, 50], fx: [20, 30], thresholdGEL: 1_500 } as const

/** Legal PTI ceiling for one borrower — above it no Georgian bank may lend. */
export function nbgPtiCap(incomeGEL: number, fxOnLariIncome: boolean): number {
  const [low, high] = fxOnLariIncome ? NBG_MAX_PTI.fx : NBG_MAX_PTI.matched
  return incomeGEL < NBG_MAX_PTI.thresholdGEL ? low : high
}

export const MORTGAGE_SUBSIDY = {
  maxLoanGEL: 200_000,
  subsidyMonths: 60,
  /** Subsidized percentage points by number of children (1 / 2 / 3+). */
  pointsByChildren: [4, 5, 6] as readonly [number, number, number],
}

export const MORTGAGE_GE_BANKS: readonly MortgageBank[] = [
  {
    slug: 'tbc',
    name: 'TBC Bank',
    nameKa: 'თიბისი ბანკი',
    gel: { from: 9.9 },
    fx: null,
    termMonths: null,
    minDownPct: 20,
    source: 'https://www.tbcbank.ge/web/ka/personal/loans/mortgage',
  },
  {
    slug: 'basisbank',
    name: 'BasisBank',
    nameKa: 'ბაზისბანკი',
    gel: { from: 10.9, to: 17.5 },
    fx: { from: 7.9, to: 10.5 },
    termMonths: 240,
    minDownPct: 15,
    source: 'https://bb.ge/ge/personal/loans/mortgage',
  },
]

/** '10.9–17.5%' / 'from 9.9%' / '—' — unit included; locale header names the column. */
export function rateBand(b: { from: number; to?: number } | null): string {
  if (!b) return '—'
  const from = b.from.toFixed(1).replace(/\.0$/, '')
  if (b.to === undefined) return `from ${from}%`
  const to = b.to.toFixed(1).replace(/\.0$/, '')
  return from === to ? `${from}%` : `${from}–${to}%`
}

/** Years, bare — the locale header carries the unit ('Max term (yrs)'). */
export function termYrs(months: number | null): string {
  if (!months || months <= 0) return '—'
  return String(Math.round(months / 12))
}

/** Down-payment cell — 'min 15%' or '—'. */
export function downCell(pct: number | null): string {
  return pct ? `min ${pct}%` : '—'
}
