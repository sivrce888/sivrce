/**
 * Server-side Project -> ProjectCard projection.
 *
 * Split out of ./card so that module stays a leaf: toCard is the only thing
 * that needs the professionals catalog, and co-locating it dragged ~249 KB of
 * projects/developers into the client ProjectsExplorer chunk.
 */
import { finishMaxYear, getDeveloper, isDelivered, type Project } from '@/data/professionals'
import { canonicalizeDistrict } from '@/lib/district-canon'
import { pickLoc, type DirLoc } from '@/lib/directory-seo'
import { cityByName, nearestMapCity } from '@/lib/map/user-place'
import { scopeLabel, type marketDeltas } from '@/lib/project-insights'
import type { ProjectCard } from './card'

/**
 * Strict Georgia geography verification.
 * A project is in Georgia only if its known city or coordinates are inside Georgia.
 */
export function isProjectInGeorgia(p: { city?: string; coords?: { lat: number; lng: number } }): boolean {
  const pin = p.city ? cityByName(p.city) : null
  if (pin && pin.cc !== 'GE') return false
  if (p.coords && (p.coords.lat !== 0 || p.coords.lng !== 0)) {
    const near = nearestMapCity(p.coords.lat, p.coords.lng)
    if (near && near.cc !== 'GE') return false
    return p.coords.lat >= 41.05 && p.coords.lat <= 43.6 && p.coords.lng >= 40.0 && p.coords.lng <= 46.75
  }
  return pin?.cc === 'GE'
}

/** Server-side projection: resolves dev name + delivered once so the client grid never imports the catalog. */
export function toCard(p: Project, loc: DirLoc | 'de', deltas?: ReturnType<typeof marketDeltas>): ProjectCard {
  const vs = deltas?.get(p.slug)
  const dev = getDeveloper(p.developerSlug)
  const pin = cityByName(p.city)
  const isGe = isProjectInGeorgia(p)
  const cc = isGe ? 'GE' : (pin?.cc ?? (p.coords ? nearestMapCity(p.coords.lat, p.coords.lng)?.cc : null) ?? 'OTHER')
  return {
    slug: p.slug,
    name: loc === 'ka' && p.nameKa ? p.nameKa : p.name,
    img: p.img,
    location: p.location,
    city: p.city,
    district: p.district ?? canonicalizeDistrict(p.location, p.city),
    country: cc,
    developerSlug: p.developerSlug,
    devName: dev ? pickLoc(dev.name, loc) : '',
    priceFromM2: p.priceFromM2,
    done: p.done,
    finish: p.finish,
    year: finishMaxYear(p.finish),
    flats: p.flats,
    delivered: isDelivered(p),
    ...(vs ? { vs: vs.deltaPct, vsIn: scopeLabel(p, vs.scope, loc) } : {}),
  }
}
