/**
 * Homepage trust metrics — live DB counts only. The project count is supplied
 * by the caller from the same scoped catalog the projects rail links to.
 * ponytail: never invent inventory; a DB outage hides the tiles (Stats skips 0)
 * instead of relabelling catalog sizes — 611 developers once rendered as
 * "611 agents & agencies".
 */
import { db } from '@/lib/db'
import { safeQuery } from '@/lib/guards'
import { unstable_cache } from 'next/cache'

export type HomeStats = {
  listings: number
  professionals: number
  projects: number
  cities: number
}

export type LiveHomeStats = Omit<HomeStats, 'projects'>

/** Outage fallback — zeros hide their tiles; nothing is proxied from the catalog. */
export const NO_LIVE_STATS: LiveHomeStats = { listings: 0, professionals: 0, cities: 0 }

// A fallback must never be cached: safeQuery resolves (not throws) on its
// deadline, and a cached fallback pinned the catalog numbers for 5 minutes.
const readHomeStats = unstable_cache(
  async (country: string): Promise<LiveHomeStats> => {
    const where = {
      deletedAt: null,
      status: 'active' as const,
      // '*' = worldwide hub — count the unified inventory, not one country.
      ...(country && country !== '*' ? { country } : {}),
    }
    const live = await safeQuery(async () => {
      const [listings, agents, agencies, cityRows] = await Promise.all([
        db.listing.count({ where }),
        db.agentProfile.count({ where: { deletedAt: null } }),
        db.agencyProfile.count({ where: { deletedAt: null } }),
        db.listing.groupBy({ by: ['city'], where }),
      ])
      return { listings, professionals: agents + agencies, cities: cityRows.length }
    }, null)
    if (!live) throw new Error('home-stats: DB unavailable')
    return live
  },
  ['home-stats-v3'],
  { revalidate: 300 },
)

export async function getHomeStats(country?: string): Promise<LiveHomeStats> {
  return readHomeStats(country ?? '').catch(() => NO_LIVE_STATS)
}
