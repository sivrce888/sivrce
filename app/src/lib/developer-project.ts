/**
 * Developer project form parse — used by /developer/projects actions.
 * ponytail: ProjectDirectory already exists; no new model.
 */

export const PROJECT_STATUSES = ["construction", "completed", "planned", "draft"] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export const PROJECT_STATUS_KA: Record<ProjectStatus, string> = {
  construction: "მშენებარე",
  completed: "დასრულებული",
  planned: "დაგეგმილი",
  draft: "მონახაზი",
}

export const PROJECT_PLACEHOLDER_IMG = "/images/np1.webp"

export function isProjectStatus(v: string): v is ProjectStatus {
  return (PROJECT_STATUSES as readonly string[]).includes(v)
}

export function slugifyProject(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100)
}

export type ProjectInput = {
  name: string
  city: string
  district: string
  address: string
  status: ProjectStatus
  readyBy: string
  priceFrom: number
  pricePerSqmFrom: number
  units: number
  body: string
  lat: number | null
  lng: number | null
  image: string
}

function asInt(raw: string, min: number, max: number, fallback: number): number {
  const n = Number.parseInt(raw.replace(/\s/g, ""), 10)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

function asCoord(raw: string): number | null {
  const n = Number(String(raw).trim().replace(",", "."))
  return Number.isFinite(n) ? n : null
}

/** Soft Georgia box — same halo as map clamp. */
export function coordsInGeorgia(lat: number, lng: number): boolean {
  return lat >= 40.35 && lat <= 44.25 && lng >= 38.7 && lng <= 47.8
}

export function isOwnedCover(url: string): boolean {
  return (
    url.startsWith("/images/") ||
    url.includes("cdn.sivrce.ge") ||
    url.includes("images.sivrce.ge")
  )
}

export function parseProjectFields(raw: Record<string, string>): ProjectInput | null {
  const name = raw.name.trim().slice(0, 180)
  const city = raw.city.trim().slice(0, 100)
  const district = raw.district.trim().slice(0, 120)
  const address = raw.address.trim().slice(0, 240)
  const status = raw.status.trim()
  const readyBy = raw.readyBy.trim().slice(0, 80)
  const body = raw.body.trim().slice(0, 4000)
  if (!name || !city || !district || !isProjectStatus(status)) return null

  const lat = asCoord(raw.lat)
  const lng = asCoord(raw.lng)
  let geo: { lat: number | null; lng: number | null } = { lat: null, lng: null }
  if (lat != null && lng != null && coordsInGeorgia(lat, lng)) {
    geo = { lat, lng }
  }

  const imageRaw = raw.image.trim().slice(0, 320)
  const image = imageRaw && isOwnedCover(imageRaw) ? imageRaw : PROJECT_PLACEHOLDER_IMG

  return {
    name,
    city,
    district,
    address,
    status,
    readyBy,
    priceFrom: asInt(raw.priceFrom, 0, 1_000_000_000, 0),
    pricePerSqmFrom: asInt(raw.pricePerSqmFrom, 0, 100_000, 0),
    units: asInt(raw.units, 1, 50_000, 1),
    body,
    lat: geo.lat,
    lng: geo.lng,
    image,
  }
}

export function canMutateProject(
  row: { ownerId: string | null; developer: string },
  userId: string,
  profileName: string | null,
): boolean {
  if (row.ownerId === userId) return true
  return !row.ownerId && !!profileName && row.developer === profileName
}
