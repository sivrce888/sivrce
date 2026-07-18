/**
 * Live directory: merges owner-claimed Neon profiles over the static catalog.
 * Platform-seeded rows (ownerId null) mirror the static file, so the richer
 * static entry always wins; owner-edited rows (ownerId set) override it —
 * that is what makes the directory live without a code push.
 *
 * ponytail: DB-only profiles (claimed, not yet catalogued) are skipped on
 * purpose — they surface once /developers/[slug] + /projects/[slug] get a DB
 * fallback. Add when the first profile is actually claimed.
 */
import { db } from '@/lib/db'
import { safeQuery } from '@/lib/guards'
import { DEVELOPERS, PROJECTS, type Developer, type Project } from '@/data/professionals'

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
      db.projectDirectory.findMany({ where: { deletedAt: null, ownerId: { not: null } } }),
    [],
  )
  if (rows.length === 0) return PROJECTS
  const owned = new Map(rows.map((r) => [r.slug, r]))
  return PROJECTS.map((p) => {
    const r = owned.get(p.slug)
    if (!r) return p
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
}
