/**
 * Live directory: merges Neon rows over the static catalog.
 * Developers: logoUrl/website from any DB row; owner-claimed rows also
 * override name/city/description. Unmatched DB profiles append (public).
 * Projects: non-draft rows overlay address / lat / lng / render; unmatched append.
 *
 * Media: only cdn.sivrce.ge (and first-party /images) — no runtime third-party hosts.
 * Official developer websites live on Developer.website (sameAs), not scraped hosts.
 */
import { db } from '@/lib/db'
import { safeQuery } from '@/lib/guards'
import { DEVELOPERS, PROJECTS, getDeveloper, type Developer, type Project } from '@/data/professionals'

export const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\u10d0-\u10ff]+/g, '')

/** Seed/catalog stock art — not a real project render. */
export function isPlaceholderImg(img: string | null | undefined): boolean {
  return !img || img.startsWith('/images/')
}

/** First-party hosted media (R2). */
export function isOwnedMedia(img: string | null | undefined): boolean {
  return !!img && (img.includes('cdn.sivrce.ge') || img.includes('images.sivrce.ge'))
}

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

function nameTokens(s: string): Set<string> {
  return new Set(norm(s).match(/[a-z0-9\u10d0-\u10ff]{3,}/g) || [])
}

/** Token overlap for fuzzy catalog↔directory media match. */
export function nameOverlap(a: string, b: string): number {
  const A = nameTokens(a)
  const B = nameTokens(b)
  let n = 0
  for (const t of A) if (B.has(t)) n++
  return n
}

type DevRow = {
  slug: string
  name: string
  headquarters: string
  description: string
  completedCount: number
  projectsCount: number
  logoUrl: string | null
  website: string | null
  ownerId: string | null
}

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
  gallery: string[]
  body: string | null
  passportUrl: string | null
  status: string
}

/** Best real-image row for a catalog name (exact → contains → ≥2 token overlap). */
export function findRealMediaRow(
  name: string,
  rows: ProjectRow[],
): ProjectRow | undefined {
  const pn = norm(name)
  const real = rows.filter((r) => !isPlaceholderImg(r.image))
  const exact = real.find((r) => norm(r.name) === pn)
  if (exact) return exact
  const contains = real.find((r) => {
    const rn = norm(r.name)
    return (rn.includes(pn) || pn.includes(rn)) && Math.min(rn.length, pn.length) >= 8
  })
  if (contains) return contains
  let best: ProjectRow | undefined
  let bestO = 1
  for (const r of real) {
    const o = nameOverlap(name, r.name)
    if (o > bestO) {
      bestO = o
      best = r
    }
  }
  return best
}

const DEV_SELECT = {
  slug: true,
  name: true,
  headquarters: true,
  description: true,
  completedCount: true,
  projectsCount: true,
  logoUrl: true,
  website: true,
  ownerId: true,
} as const

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
  gallery: true,
  body: true,
  passportUrl: true,
  status: true,
} as const

/** Build name→slug lookup from curated + live developer rows. */
export function buildDevNameMap(devs: Developer[], rows: DevRow[] = []): Map<string, string> {
  const map = new Map<string, string>()
  for (const d of devs) {
    map.set(norm(d.name.en), d.slug)
    map.set(norm(d.name.ka), d.slug)
  }
  for (const r of rows) {
    if (!map.has(norm(r.name))) map.set(norm(r.name), r.slug)
  }
  return map
}

/** Overlay DB geo/media onto a catalog project — address + pin win when present. */
export function applyProjectRow(
  base: Project,
  r: ProjectRow,
  nameToSlug: Map<string, string> = buildDevNameMap(DEVELOPERS),
): Project {
  const coords = isValidCoords(r.lat, r.lng) ? { lat: r.lat!, lng: r.lng! } : base.coords
  const location = (r.address || '').trim() || r.district || base.location
  const developerSlug =
    base.developerSlug || nameToSlug.get(norm(r.developer)) || ''
  const body = (r.body || '').trim()
  // Never downgrade to seed stock art; prefer owned CDN, then any non-placeholder.
  const nextImg = !isPlaceholderImg(r.image)
    ? r.image
    : base.img
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
    img: nextImg,
    ...(r.gallery?.length ? { gallery: r.gallery } : {}),
    ...(r.passportUrl ? { passportUrl: r.passportUrl } : {}),
    ...(body
      ? { description: { ka: body, en: body, ru: body } }
      : {}),
    done: r.status === 'completed' ? 100 : base.done,
    coords,
  }
}

export function rowToProject(
  r: ProjectRow,
  nameToSlug: Map<string, string> = buildDevNameMap(DEVELOPERS),
): Project {
  const hasGeo = isValidCoords(r.lat, r.lng)
  const body = (r.body || '').trim()
  const fallback = `${r.name} — ${r.city}. პროექტი და მისამართი სივრცეზე.`
  return {
    slug: r.slug,
    name: r.name,
    developerSlug: nameToSlug.get(norm(r.developer)) ?? '',
    img: r.image || '/images/np1.webp',
    ...(r.gallery?.length ? { gallery: r.gallery } : {}),
    ...(r.passportUrl ? { passportUrl: r.passportUrl } : {}),
    location: (r.address || '').trim() || r.district,
    city: r.city,
    priceFromM2: r.pricePerSqmFrom > 0 ? `$${r.pricePerSqmFrom.toLocaleString('en-US')}` : '',
    done: r.status === 'completed' ? 100 : 35,
    finish: r.readyBy,
    flats: r.units,
    rating: 0,
    description: {
      ka: body || fallback,
      en: body || `${r.name} — ${r.city}. Project and address on Sivrce.`,
      ru: body || `${r.name} — ${r.city}. Проект и адрес на Sivrce.`,
    },
    // ponytail: NaN coords keep card on /projects but drop from map ghosts.
    coords: hasGeo ? { lat: r.lat!, lng: r.lng! } : { lat: Number.NaN, lng: Number.NaN },
  }
}

/** Pure merge used by projectsLive + self-check. */
export function mergeProjectsLive(
  staticProjects: Project[],
  rows: ProjectRow[],
  nameToSlug: Map<string, string> = buildDevNameMap(DEVELOPERS),
): Project[] {
  if (rows.length === 0) return staticProjects
  const bySlug = new Map(rows.map((r) => [r.slug, r]))
  const merged = staticProjects.map((p) => {
    const r = bySlug.get(p.slug)
    if (!r) return p
    bySlug.delete(p.slug)
    return applyProjectRow(p, r, nameToSlug)
  })

  // Exact name, different directory slug → overlay onto static card.
  const byName = new Map(merged.map((p) => [norm(p.name), p.slug]))
  for (const r of [...bySlug.values()]) {
    const staticSlug = byName.get(norm(r.name))
    if (staticSlug) {
      const i = merged.findIndex((p) => p.slug === staticSlug)
      if (i >= 0) {
        merged[i] = applyProjectRow(merged[i]!, r, nameToSlug)
        bySlug.delete(r.slug)
      }
    }
  }

  // Seed rows often keep /images placeholders — steal media from unmatched real rows.
  for (let i = 0; i < merged.length; i++) {
    const p = merged[i]!
    if (!isPlaceholderImg(p.img)) continue
    const hit = findRealMediaRow(p.name, [...bySlug.values()])
    if (!hit) continue
    merged[i] = applyProjectRow(p, hit, nameToSlug)
    bySlug.delete(hit.slug)
  }

  const taken = new Set(merged.map((p) => norm(p.name)))
  for (const r of bySlug.values()) {
    if (taken.has(norm(r.name))) continue
    taken.add(norm(r.name))
    merged.push(rowToProject(r, nameToSlug))
  }

  // ponytail: public list = real renders only when the corpus has them.
  // Stock /images ghosts hurt SEO; keep them only if DB is empty of real media.
  const hasReal = merged.some((p) => !isPlaceholderImg(p.img))
  const publicList = hasReal
    ? merged.filter((p) => !isPlaceholderImg(p.img) || (p.gallery?.length ?? 0) > 0)
    : merged

  // Owned CDN first, then other http, placeholders last.
  return publicList.sort((a, b) => {
    const score = (p: Project) =>
      isOwnedMedia(p.img) ? 0 : !isPlaceholderImg(p.img) ? 1 : 2
    return score(a) - score(b)
  })
}

export function applyDeveloperRow(d: Developer, r: DevRow): Developer {
  const owned = r.ownerId != null
  return {
    ...d,
    ...(r.logoUrl ? { logoUrl: r.logoUrl } : {}),
    ...(r.website ? { website: r.website } : {}),
    ...(owned
      ? {
          name: { ka: r.name, en: r.name, ru: r.name },
          city: r.headquarters,
          description: { ka: r.description, en: r.description, ru: r.description },
          projectsDone: r.completedCount || d.projectsDone,
          verified: true,
        }
      : {}),
  }
}

/** DB-only profile → public Developer card (slug, logo, HQ, official website). */
export function rowToDeveloper(r: DevRow): Developer {
  const name = { ka: r.name, en: r.name, ru: r.name }
  return {
    slug: r.slug,
    name,
    city: r.headquarters || 'თბილისი',
    yearsActive: 0,
    projectsDone: r.completedCount || r.projectsCount || 0,
    unitsDelivered: 0,
    description: {
      ka: r.description || `${r.name} — დეველოპერი საქართველოში. პროექტები და მისამართები სივრცეზე.`,
      en: r.description || `${r.name} — developer in Georgia. Projects and addresses on Sivrce.`,
      ru: r.description || `${r.name} — девелопер в Грузии. Проекты и адреса на Sivrce.`,
    },
    verified: false,
    phone: '',
    ...(r.logoUrl ? { logoUrl: r.logoUrl } : {}),
    ...(r.website ? { website: r.website } : {}),
  }
}

/** Pure merge: curated first, then unmatched DB profiles. */
export function mergeDevelopersLive(staticDevs: Developer[], rows: DevRow[]): Developer[] {
  if (rows.length === 0) return staticDevs
  const bySlug = new Map(rows.map((r) => [r.slug, r]))
  const merged = staticDevs.map((d) => {
    const r = bySlug.get(d.slug)
    if (r) bySlug.delete(d.slug)
    return r ? applyDeveloperRow(d, r) : d
  })
  const takenNames = new Set(merged.flatMap((d) => [norm(d.name.en), norm(d.name.ka)]))
  for (const r of bySlug.values()) {
    if (takenNames.has(norm(r.name))) continue
    takenNames.add(norm(r.name))
    merged.push(rowToDeveloper(r))
  }
  return merged
}

async function loadDevRows(): Promise<DevRow[]> {
  return safeQuery(
    () =>
      db.developerProfile.findMany({
        where: { deletedAt: null },
        select: DEV_SELECT,
      }),
    [],
  )
}

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

export async function developersLive(): Promise<Developer[]> {
  return mergeDevelopersLive(DEVELOPERS, await loadDevRows())
}

/** Single developer with DB logo/website overlay — curated or DB-only. */
export async function getLiveDeveloper(slug: string): Promise<Developer | null> {
  const base = getDeveloper(slug)
  const r = await safeQuery(
    () =>
      db.developerProfile.findFirst({
        where: { slug, deletedAt: null },
        select: DEV_SELECT,
      }),
    null,
  )
  if (base && r) return applyDeveloperRow(base, r)
  if (base) return base
  if (r) return rowToDeveloper(r)
  return null
}

export async function projectsLive(): Promise<Project[]> {
  const [rows, devRows] = await Promise.all([loadProjectRows(), loadDevRows()])
  const liveDevs = mergeDevelopersLive(DEVELOPERS, devRows)
  return mergeProjectsLive(PROJECTS, rows, buildDevNameMap(liveDevs, devRows))
}

/** Single project with DB address/coords/media overlay (slug, name, or fuzzy media). */
export async function getLiveProject(slug: string): Promise<Project | null> {
  const [staticHit, bySlug, rows, devRows] = await Promise.all([
    Promise.resolve(PROJECTS.find((p) => p.slug === slug)),
    safeQuery(
      () =>
        db.projectDirectory.findFirst({
          where: { slug, deletedAt: null, status: { not: 'draft' } },
          select: PROJECT_SELECT,
        }),
      null,
    ),
    loadProjectRows(),
    loadDevRows(),
  ])
  const nameToSlug = buildDevNameMap(mergeDevelopersLive(DEVELOPERS, devRows), devRows)

  let project: Project | null = null
  if (staticHit && bySlug) project = applyProjectRow(staticHit, bySlug, nameToSlug)
  else if (staticHit) {
    const byName = rows.find((r) => norm(r.name) === norm(staticHit.name))
    project = byName ? applyProjectRow(staticHit, byName, nameToSlug) : staticHit
  } else if (bySlug) project = rowToProject(bySlug, nameToSlug)

  if (project && isPlaceholderImg(project.img)) {
    const hit = findRealMediaRow(project.name, rows)
    if (hit) project = applyProjectRow(project, hit, nameToSlug)
  }
  return project
}

export async function projectsLiveByDeveloper(developerSlug: string): Promise<Project[]> {
  const all = await projectsLive()
  return all.filter((p) => p.developerSlug === developerSlug)
}
