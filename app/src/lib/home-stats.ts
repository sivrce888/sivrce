/**
 * Homepage trust metrics — live DB where it exists, catalog for public directory.
 * ponytail: never invent listing inventory; projects/cities/pros are the shipped catalog.
 */
import { db } from '@/lib/db'
import { safeQuery } from '@/lib/guards'
import { unstable_cache } from 'next/cache'
import { projectsLive } from '@/lib/directory-live'
import { CITIES } from '@/data/listings'
import { AGENT_PROFILES, DEVELOPERS, PROJECTS } from '@/data/professionals'

export type HomeStats = {
  listings: number
  professionals: number
  projects: number
  cities: number
}

export async function getHomeStats(country?: string): Promise<HomeStats> {
  return readHomeStats(country ?? '')
}

const readHomeStats = unstable_cache(
  async (country: string): Promise<HomeStats> => {
    const catalog: HomeStats = {
      listings: 0,
      professionals: AGENT_PROFILES.length + DEVELOPERS.length,
      projects: PROJECTS.length,
      cities: CITIES.length,
    }
    const listingWhere = {
      deletedAt: null,
      status: 'active' as const,
      // '*' = worldwide hub — count the unified inventory, not one country.
      ...(country && country !== '*' ? { country } : {}),
    }

    return safeQuery(async () => {
      const [listings, agents, agencies, projectRows, cityRows] = await Promise.all([
        db.listing.count({ where: listingWhere }),
        db.agentProfile.count({ where: { deletedAt: null } }),
        db.agencyProfile.count({ where: { deletedAt: null } }),
        projectsLive().then((p) => p.length),
        db.listing.groupBy({
          by: ['city'],
          where: listingWhere,
        }),
      ])

      const professionals = agents + agencies
      return {
        listings,
        professionals: professionals > 0 ? professionals : catalog.professionals,
        projects: projectRows > 0 ? projectRows : catalog.projects,
        cities: cityRows.length > 0 ? cityRows.length : catalog.cities,
      }
    }, catalog)
  },
  ['home-stats-v2'],
  { revalidate: 300 },
)
