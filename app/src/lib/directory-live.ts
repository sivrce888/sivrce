/**
 * Live directory: merges Neon rows over the static catalog.
 * Developers: owner-claimed rows (ownerId set) override their static entry.
 * Projects: any non-draft row overrides same-slug OR same-name static entry
 * with exact address / lat / lng from korter; unmatched rows append as cards.
 *
 * ponytail: DB-only developer profiles stay off public pages until curated.
 */
import { db } from '@/lib/db'
import { safeQuery } from '@/lib/guards'
import { DEVELOPERS, PROJECTS, type Developer, type Project } from '@/data/professionals'

export const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\u10d0-\u10ff]+/g, '')

export function isValidCoords(lat: number | null | undefined, lng: number | null | undefined): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(Math.abs(lat) < 0.01 && Math.abs(lng) < 0.01)
  )
}

const DEV_BY_NAME = new Map(DEVELOPERS.map((d) => [norm(d.name.en), d.slug]))
for (const d of DEVELOPERS) DEV_BY_NAME.set(norm(d.name.ka), d.slug)

type ProjectRow = {
  slug: string
  name: string
  developer: string
  city: string
  district: string
  address: string | null
  lat: number | null
  lng: number | null
  readyBy: string
  pricePerSqmFrom: number
  units: number
  image: string
  status: string
}

/** Overlay korter/DB geo onto a catalog project — address + pin win when present. */
export function applyProjectRow(base: Project, r: ProjectRow): Project {
  const coords = isValidCoords(r.lat, r.lng) ? { lat: r.lat!, lng: r.lng! } : base.coords
  const location = (r.address || '').trim() || r.district || base.location
  const developerSlug =
    base.developerSlug || DEV_BY_NAME.get(norm(r.developer)) || ''
  return {
    ...base,
    name: r.name || base.name,
    developerSlug,
    city: r.city || base.city,
    location,
    finish: r.readyBy || base.finish,
    priceFromM2:
      r.pricePerSqmFrom > 0 ? `$${r.pricePerSqmFrom.toLocaleString('en-US')}` : base.priceFromM2,
    flats: r.units || base.flats,
    img: r.image || base.img,
    done: r.status === 'completed' ? 100 : base.done,
    coords,
  }
}

export function rowToProject(r: ProjectRow): Project {
  const hasGeo = isValidCoords(r.lat, r.lng)
  return {
    slug: r.slug,
    name: r.name,
    developerSlug: DEV_BY_NAME.get(norm(r.developer)) ?? '',
    img: r.image || '/images/np1.webp',
    location: (r.address || '').trim() || r.district,
    city: r.city,
    priceFromM2: r.pricePerSqmFrom > 0 ? `$${r.pricePerSqmFrom.toLocaleString('en-US')}` : '',
    done: r.status === 'completed' ? 100 : 35,
    finish: r.readyBy,
    flats: r.units,
    rating: 0,
    description: { ka: '', en: '', ru: '' },
    // ponytail: NaN coords keep card on /projects but drop from map ghosts.
    coords: hasGeo ? { lat: r.lat!, lng: r.lng! } : { lat: Number.NaN, lng: Number.NaN },
  }
}

/** Pure merge used by projectsLive + self-check. */
export function mergeProjectsLive(staticProjects: Project[], rows: ProjectRow[]): Project[] {
  if (rows.length === 0) return staticProjects
  const bySlug = new Map(rows.map((r) => [r.slug, r]))
  const merged = staticProjects.map((p) => {
    const r = bySlug.get(p.slug)
    if (!r) return p
    bySlug.delete(p.slug)
    return applyProjectRow(p, r)
  })

  // Same name, different korter slug → overlay exact address/coords onto static card.
  const byName = new Map(merged.map((p) => [norm(p.name), p.slug]))
  for (const r of [...bySlug.values()]) {
    const staticSlug = byName.get(norm(r.name))
    if (staticSlug) {
      const i = merged.findIndex((p) => p.slug === staticSlug)
      if (i >= 0) {
        merged[i] = applyProjectRow(merged[i]!, r)
        bySlug.delete(r.slug)
      }
    }
  }

  const taken = new Set(merged.map((p) => norm(p.name)))
  for (const r of bySlug.values()) {
    if (taken.has(norm(r.name))) continue
    taken.add(norm(r.name))
    merged.push(rowToProject(r))
  }
  return merged
}

export async function developersLive(): Promise<Developer[]> {
  const rows = await safeQuery(
    () =>
      db.developerProfile.findMany({ where: { deletedAt: null, ownerId: { not: null } } }),
    [],
  )
  if (rows.length === 0) return DEVELOPERS
  const owned = new Map(rows.map((r) => [r.slug, r]))
  return DEVELOPERS.map((d) => {
    const r = owned.get(d.slug)
    if (!r) return d
    return {
      ...d,
      name: { ka: r.name, en: r.name, ru: r.name },
      city: r.headquarters,
      description: { ka: r.description, en: r.description, ru: r.description },
      projectsDone: r.completedCount || d.projectsDone,
      verified: true,
    }
  })
}

const PROJECT_SELECT = {
  slug: true,
  name: true,
  developer: true,
  city: true,
  district: true,
  address: true,
  lat: true,
  lng: true,
  readyBy: true,
  pricePerSqmFrom: true,
  units: true,
  image: true,
  status: true,
} as const

async function loadProjectRows(): Promise<ProjectRow[]> {
  return safeQuery(
    () =>
      db.projectDirectory.findMany({
        where: { deletedAt: null, status: { not: 'draft' } },
        select: PROJECT_SELECT,
      }),
    [],
  )
}

export async function projectsLive(): Promise<Project[]> {
  return mergeProjectsLive(PROJECTS, await loadProjectRows())
}

/** Single project with DB address/coords overlay (slug or exact-name match). */
export async function getLiveProject(slug: string): Promise<Project | null> {
  const staticHit = PROJECTS.find((p) => p.slug === slug)
  const bySlug = await safeQuery(
    () =>
      db.projectDirectory.findFirst({
        where: { slug, deletedAt: null, status: { not: 'draft' } },
        select: PROJECT_SELECT,
      }),
    null,
  )
  if (staticHit && bySlug) return applyProjectRow(staticHit, bySlug)
  if (staticHit) {
    const byName = await safeQuery(
      () =>
        db.projectDirectory.findFirst({
          where: { name: staticHit.name, deletedAt: null, status: { not: 'draft' } },
          select: PROJECT_SELECT,
        }),
      null,
    )
    if (byName) return applyProjectRow(staticHit, byName)
    return staticHit
  }
  if (bySlug) return rowToProject(bySlug)
  return null
}

export async function projectsLiveByDeveloper(developerSlug: string): Promise<Project[]> {
  const all = await projectsLive()
  return all.filter((p) => p.developerSlug === developerSlug)
}
