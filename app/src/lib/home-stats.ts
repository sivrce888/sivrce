/**
 * Homepage trust metrics — live DB counts only.
 * ponytail: never invent inventory; product SLAs (24/7) stay CMS copy.
 */
import { db } from '@/lib/db'
import { safeQuery } from '@/lib/guards'
import { projectsLive } from '@/lib/directory-live'
import { AGENT_PROFILES, DEVELOPERS } from '@/data/professionals'

export type HomeStats = {
  listings: number
  professionals: number
  projects: number
  cities: number
}

export async function getHomeStats(): Promise<HomeStats> {
  const fallback: HomeStats = {
    listings: 0,
    professionals: AGENT_PROFILES.length + DEVELOPERS.length,
    projects: 0,
    cities: 0,
  }

  return safeQuery(async () => {
    const [listings, agents, agencies, projectRows, cityRows] = await Promise.all([
      db.listing.count({ where: { deletedAt: null, status: 'active' } }),
      db.agentProfile.count({ where: { deletedAt: null } }),
      db.agencyProfile.count({ where: { deletedAt: null } }),
      projectsLive().then((p) => p.length),
      db.listing.findMany({
        where: { deletedAt: null, status: 'active' },
        select: { city: true },
        distinct: ['city'],
      }),
    ])

    const professionals = agents + agencies
    return {
      listings,
      professionals: professionals > 0 ? professionals : fallback.professionals,
      projects: projectRows,
      cities: cityRows.length,
    }
  }, fallback)
}
