/**
 * Luxury = a derived segment, never a seller checkbox (every agent would tick
 * it). A listing is luxury when it is residential AND its price clears the
 * market's prime floor for its deal. Objective, un-gameable, zero schema.
 *
 * Floors are USD-equivalent (search indexes priceUSD; DB converts per stored
 * currency). GE: Tbilisi prime (Vake / Mtatsminda / Old Tbilisi) opens around
 * $3k/m² × 110 m²; rent + nightly floors match the same segment.
 * ponytail: GE + one global row. Add a per-market row when a launched market's
 * prime segment diverges (e.g. AE, GB) — search already scopes by country.
 */

export type LuxuryDeal = 'buy' | 'rent' | 'daily'

type Floors = Readonly<Record<LuxuryDeal, number>>

export const LUXURY_FLOOR_USD: Readonly<Record<'GE' | 'default', Floors>> = {
  GE: { buy: 350_000, rent: 2_500, daily: 200 },
  default: { buy: 1_000_000, rent: 6_000, daily: 600 },
}

/** Land and commercial are priced by size/yield, not prestige. */
export const LUXURY_PROPERTY_TYPES = ['apartment', 'house', 'villa'] as const

/** DB dialect deal ('buy' | 'rent' | 'daily' | 'mortgage'); pledge prices like a sale. */
export function luxuryDeal(dealType: string | undefined): LuxuryDeal | undefined {
  if (dealType === 'buy' || dealType === 'mortgage') return 'buy'
  if (dealType === 'rent' || dealType === 'daily') return dealType
  return undefined
}

export function luxuryFloorUsd(country: string | undefined, deal: LuxuryDeal): number {
  return (country === 'GE' ? LUXURY_FLOOR_USD.GE : LUXURY_FLOOR_USD.default)[deal]
}

type DbDeal = 'buy' | 'rent' | 'daily' | 'mortgage'

export type LuxuryRule = { ge: boolean; deals: DbDeal[]; minUsd: number }

const DB_DEALS: Readonly<Record<LuxuryDeal, readonly DbDeal[]>> = {
  buy: ['buy', 'mortgage'],
  rent: ['rent'],
  daily: ['daily'],
}

/** OR-ed (market × deal → floor) rows; Meili and Prisma render the same list. */
export function luxuryRules(country?: string, dealType?: string): LuxuryRule[] {
  const markets = country ? [country === 'GE'] : [true, false]
  const one = luxuryDeal(dealType)
  const deals: LuxuryDeal[] = one ? [one] : ['buy', 'rent', 'daily']
  return markets.flatMap((ge) =>
    deals.map((d) => ({ ge, deals: [...DB_DEALS[d]], minUsd: luxuryFloorUsd(ge ? 'GE' : undefined, d) })),
  )
}
