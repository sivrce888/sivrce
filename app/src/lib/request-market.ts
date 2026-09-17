import { headers } from 'next/headers'
import { MARKET_HEADER, hostKind, publicOriginKind } from '@/lib/site-host'
import { isPathCountry, type MarketId } from '@/lib/markets'
import { surfaceOrigin, surfacePathPrefix, type DomainId } from '@/lib/domain-scope'

export async function requestMarket(): Promise<MarketId> {
  try {
    const h = await headers()
    const raw = h.get(MARKET_HEADER)
    if (raw === 'global' || raw === 'ge' || (raw && isPathCountry(raw))) return raw
  } catch {
    /* headers unavailable in static context */
  }
  return 'ge'
}

export async function requestDomain(): Promise<DomainId> {
  try {
    const h = await headers()
    const host = (h.get('x-forwarded-host') || h.get('host') || '')
      .split(',')[0]!
      .trim()
      .split(':')[0]!
      .toLowerCase()
    if (!host) return 'ge'
    return publicOriginKind(hostKind(host, process.env.VERCEL_ENV))
  } catch {
    return 'ge'
  }
}

/** Absolute origin of the surface serving this request — host, not IP, not cookie. */
export async function requestOrigin(): Promise<string> {
  return surfaceOrigin(await requestDomain())
}

/** `/ge` prefix when the Georgia catalog is served on sivrce.com. */
export async function requestPathPrefix(): Promise<string> {
  return surfacePathPrefix(await requestDomain(), await requestMarket())
}
