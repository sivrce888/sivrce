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
import type { ProjectCard } from './card'

/** Server-side projection: resolves dev name + delivered once so the client grid never imports the catalog. */
export function toCard(p: Project, loc: DirLoc): ProjectCard {
  const dev = getDeveloper(p.developerSlug)
  const pin = cityByName(p.city)
  const cc = pin?.cc ?? (p.coords ? nearestMapCity(p.coords.lat, p.coords.lng)?.cc : null) ?? 'GE'
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
    rating: p.rating,
    delivered: isDelivered(p),
  }
}
