/**
 * Homepage trust metrics — live DB where it exists, catalog for public directory.
 * ponytail: never invent listing inventory; projects/cities/pros are the shipped catalog.
 */
import { db } from '@/lib/db'
import { safeQuery } from '@/lib/guards'
import { projectsLive } from '@/lib/directory-live'
import { CITIES } from '@/data/listings'
import { AGENT_PROFILES, DEVELOPERS, PROJECTS } from '@/data/professionals'

export type HomeStats = {
  listings: number
  professionals: number
  projects: number
  cities: number
}

export async function getHomeStats(): Promise<HomeStats> {
  const catalog: HomeStats = {
    listings: 0,
    professionals: AGENT_PROFILES.length + DEVELOPERS.length,
    projects: PROJECTS.length,
    cities: CITIES.length,
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
      professionals: professionals > 0 ? professionals : catalog.professionals,
      projects: projectRows > 0 ? projectRows : catalog.projects,
      cities: cityRows.length > 0 ? cityRows.length : catalog.cities,
    }
  }, catalog)
}
