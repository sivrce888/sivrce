/**
 * Live directory: merges Neon rows over the static catalog.
 * Developers: owner-claimed rows (ownerId set) override their static entry.
 * Projects: any non-draft row (seeded, owner-claimed, or admin-approved
 * korter import) overrides the same-slug static entry; approved rows with no
 * static counterpart are appended as new cards. `draft` rows stay admin-only.
 *
 * ponytail: DB-only developer profiles (653 raw korter rows) stay off public
 * pages on purpose — no descriptions/photos. They surface after admin curation
 * or owner claim; add the fallback when the first one is actually curated.
 */
import { db } from '@/lib/db'
import { safeQuery } from '@/lib/guards'
import { DEVELOPERS, PROJECTS, type Developer, type Project } from '@/data/professionals'

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\u10d0-\u10ff]+/g, '')

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

export async function projectsLive(): Promise<Project[]> {
  const rows = await safeQuery(
    () =>
      db.projectDirectory.findMany({ where: { deletedAt: null, status: { not: 'draft' } } }),
    [],
  )
  if (rows.length === 0) return PROJECTS
  const bySlug = new Map(rows.map((r) => [r.slug, r]))
  const merged = PROJECTS.map((p) => {
    const r = bySlug.get(p.slug)
    if (!r) return p
    bySlug.delete(p.slug)
    return {
      ...p,
      name: r.name,
      city: r.city,
      location: r.district,
      finish: r.readyBy,
      priceFromM2:
        r.pricePerSqmFrom > 0 ? `$${r.pricePerSqmFrom.toLocaleString('en-US')}` : p.priceFromM2,
      flats: r.units || p.flats,
      img: r.image || p.img,
      done: r.status === 'completed' ? 100 : p.done,
    }
  })
  // Admin-approved imports with no static-catalog counterpart → new cards.
  const taken = new Set(PROJECTS.map((p) => norm(p.name)))
  const devSlug = new Map(DEVELOPERS.map((d) => [norm(d.name.en), d.slug]))
  for (const r of bySlug.values()) {
    if (taken.has(norm(r.name))) continue // same project under a korter slug — static card wins
    taken.add(norm(r.name))
    merged.push({
      slug: r.slug,
      name: r.name,
      developerSlug: devSlug.get(norm(r.developer)) ?? '',
      img: r.image,
      location: r.district,
      city: r.city,
      priceFromM2: r.pricePerSqmFrom > 0 ? `$${r.pricePerSqmFrom.toLocaleString('en-US')}` : '',
      done: r.status === 'completed' ? 100 : 0,
      finish: r.readyBy,
      flats: r.units,
      rating: 0,
      description: { ka: '', en: '', ru: '' },
      // ponytail: korter import carries no geocode — default pin. Map3D reads
      // the static catalog only, so these never render as 3D ghosts.
      coords: { lat: 41.7151, lng: 44.8271 },
    })
  }
  return merged
}
