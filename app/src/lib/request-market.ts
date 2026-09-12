import { headers, cookies } from 'next/headers'
import { MARKET_HEADER } from '@/lib/site-host'
import { isPathCountry, type MarketId } from '@/lib/markets'
import { GEO_COOKIE, isGeoLaunch, marketFromIso } from '@/lib/geo-market'

export async function requestMarket(): Promise<MarketId> {
  const h = await headers()
  const raw = h.get(MARKET_HEADER)
  if (raw === 'global' || raw === 'ge' || (raw && isPathCountry(raw))) return raw

  try {
    const c = await cookies()
    const cook = c.get(GEO_COOKIE)?.value
    if (cook === 'global' || cook === 'ge' || (cook && isGeoLaunch(cook))) return cook
  } catch {
    /* cookies unavailable in static context */
  }

  const iso = h.get('x-vercel-ip-country') || h.get('cf-ipcountry')
  const m = marketFromIso(iso)
  if (m === 'ge' || (m && isPathCountry(m))) return m

  return 'ge'
}

