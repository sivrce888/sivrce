/**
 * Ranked developer cards for /developers + its page/[pg] segments.
 * Aggregates reviews ONLY for the visible slice — ranking uses the cheap
 * listing-count map, so page N costs one aggregate batch, not 800.
 */
import { PER_PAGE } from '@/app/[lang]/projects/ProjectsGrid'
import { developersLive, projectsLive } from '@/lib/directory-live'
import { requestMarket } from '@/lib/request-market'
import { getDeveloperListingCountsBySlug } from '@/lib/listings-db'
import { getReviewAggregate } from '@/lib/reviews/aggregate'
import type { Developer } from '@/data/professionals'

export interface RankedDeveloperCard {
  d: Developer
  listingsCount: number
  aggregate: Awaited<ReturnType<typeof getReviewAggregate>>
}

export async function rankedDevelopers(page = 1): Promise<{ cards: RankedDeveloperCard[]; total: number }> {
  const [developers, projects] = await Promise.all([developersLive(), projectsLive()])
  const projectToDev = new Map(
    projects.filter((p) => p.developerSlug).map((p) => [p.slug, p.developerSlug!]),
  )
  const listingCounts = await getDeveloperListingCountsBySlug(projectToDev)

  // ponytail: GE devs first on sivrce.ge — world devs (US/CN listings) otherwise
  // outrank locals on count. GE = has a project inside Georgia's bbox (cities are
  // ka-localized everywhere, so names can't tell Tbilisi from Dubai).
  // Ceiling: GE dev with zero catalog projects ranks world; upgrade: country-scoped counts.
  const geMarket = (await requestMarket()) === 'ge'
  const geDevSlugs = new Set(
    projects
      .filter((p) => p.coords.lat >= 40.9 && p.coords.lat <= 43.7 && p.coords.lng >= 39.9 && p.coords.lng <= 46.9)
      .map((p) => p.developerSlug),
  )
  const ranked = developers
    .map((d) => ({ d, listingsCount: listingCounts[d.slug] ?? 0 }))
    .sort(
      (x, y) =>
        (geMarket ? Number(geDevSlugs.has(y.d.slug)) - Number(geDevSlugs.has(x.d.slug)) : 0) ||
        y.listingsCount - x.listingsCount ||
        y.d.projectsDone - x.d.projectsDone,
    )

  const slice = ranked.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const cards = await Promise.all(
    slice.map(async ({ d, listingsCount }) => ({
      d,
      listingsCount,
      aggregate: await getReviewAggregate('developer', d.slug),
    })),
  )
  return { cards, total: ranked.length }
}
