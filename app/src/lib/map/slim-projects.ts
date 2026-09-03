import type { Project } from '@/data/professionals'

/**
 * Wire format for the 3D map: geometry + status + pin card fields only.
 * Full Project objects with 3-locale descriptions and galleries measure
 * ~11MB serialized — Map3D never renders them, so the map page ships this
 * slim projection instead (<0.5MB). Listings/buildings come from
 * /api/map-data on mount (Map3D's existing empty-props fetch).
 */
export function slimProjectsForMap(projects: Project[]): Project[] {
  return projects.map((p) => ({
    slug: p.slug,
    name: p.name,
    developerSlug: p.developerSlug,
    img: p.img,
    location: p.location,
    city: p.city,
    priceFromM2: p.priceFromM2,
    done: p.done,
    finish: p.finish,
    flats: p.flats,
    rating: 0,
    description: { ka: '', en: '', ru: '' },
    coords: p.coords,
    ...(p.floors != null ? { floors: p.floors } : {}),
  }))
}
