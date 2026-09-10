import { headers } from 'next/headers'
import { MARKET_HEADER } from '@/lib/site-host'
import { isPathCountry, type MarketId } from '@/lib/markets'

export async function requestMarket(): Promise<MarketId> {
  const raw = (await headers()).get(MARKET_HEADER)
  if (raw === 'global' || raw === 'ge' || (raw && isPathCountry(raw))) return raw
  return 'ge'
}
