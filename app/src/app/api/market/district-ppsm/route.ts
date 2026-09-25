import { NextResponse } from 'next/server'
import { USD_GEL } from '@/lib/listing-format'
import { getMarketOverview, MIN_SAMPLE } from '@/lib/market-stats'

export const revalidate = 3600

/** District → avg $/m² for the card price-position chip. Sale market only
 *  (getMarketOverview), districts below MIN_SAMPLE omitted — honesty over
 *  coverage, same contract as the /market board. GE inventory only. */
export async function GET() {
  const data = await getMarketOverview(USD_GEL)
  const map: Record<string, number> = {}
  for (const d of data.districts) {
    if (d.stats.sample >= MIN_SAMPLE) map[d.district] = d.stats.avgPerM2USD
  }
  return NextResponse.json(map, {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  })
}
