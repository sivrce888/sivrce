import { headers } from 'next/headers'
import { MARKET_HEADER, hostKind, publicOriginKind, type HostKind } from '@/lib/site-host'
import { isPathCountry, type MarketId } from '@/lib/markets'
import { surfaceOrigin, surfacePathPrefix, type DomainId } from '@/lib/domain-scope'

/**
 * Exact host class of this request — 'ge' only for production sivrce.ge
 * (dev/preview stay 'dev'/'preview' so local global search and world-listing
 * previews keep working). Domain constitution checks key off this, never off
 * the client-visible DomainId collapse.
 */
export async function requestHostKind(): Promise<HostKind> {
  try {
    const h = await headers()
    const host = (h.get('x-forwarded-host') || h.get('host') || '')
      .split(',')[0]!
      .trim()
      .split(':')[0]!
      .toLowerCase()
    if (!host) return 'dev'
    return hostKind(host, process.env.VERCEL_ENV)
  } catch {
    return 'dev'
  }
}

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
