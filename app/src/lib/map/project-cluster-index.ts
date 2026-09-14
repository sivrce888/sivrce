import 'server-only'

import { getMapListings } from '@/lib/map/db-buildings'
import { projectsLive } from '@/lib/directory-live'
import {
  applyLiveProjectPins,
  clusterListingsToBuildings,
  ensureFootprints,
  mergeMapBuildings,
  projectsToConstructionBuildings,
  type MapBuildingCluster,
} from '@/lib/map/buildings'

/**
 * Project-slug → map cluster, built once per process window.
 *
 * The inputs (every active listing × every live project) are identical for
 * every project page, but each page used to rebuild the whole cluster set just
 * to `.find()` one entry — O(listings × projects) work repeated ~840 times per
 * build, which is what pushed world-project prerenders past Next's 180s page
 * budget. One shared build, one Map lookup.
 *
 * ponytail: process-level memo with the same 60s window `getMapListings`
 * already caches on, so a page can be at most one window behind the map.
 * Upgrade path: unstable_cache with a revalidate tag if clusters ever need to
 * survive across isolates.
 */
const TTL_MS = 60_000

let cache: { at: number; index: Promise<Map<string, MapBuildingCluster>> } | undefined

async function build(): Promise<Map<string, MapBuildingCluster>> {
  const [mapListings, liveProjects] = await Promise.all([
    getMapListings().catch(() => []),
    projectsLive(),
  ])
  await ensureFootprints()
  const clusters = applyLiveProjectPins(
    mergeMapBuildings(
      clusterListingsToBuildings(mapListings),
      projectsToConstructionBuildings(liveProjects),
    ),
    liveProjects,
  )
  const index = new Map<string, MapBuildingCluster>()
  for (const c of clusters) {
    if (c.projectSlug && !index.has(c.projectSlug)) index.set(c.projectSlug, c)
  }
  return index
}

function clusterIndex(): Promise<Map<string, MapBuildingCluster>> {
  if (!cache || Date.now() - cache.at > TTL_MS) {
    cache = { at: Date.now(), index: build() }
    // A failed build must not be cached as a permanent empty map.
    cache.index = cache.index.catch(() => {
      cache = undefined
      return new Map<string, MapBuildingCluster>()
    })
  }
  return cache.index
}

/** Map cluster for a project page. Tries every slug alias the page knows. */
export async function projectCluster(
  ...slugs: (string | undefined | null)[]
): Promise<MapBuildingCluster | undefined> {
  const index = await clusterIndex()
  for (const s of slugs) {
    if (!s) continue
    const hit = index.get(s)
    if (hit) return hit
  }
  return undefined
}
