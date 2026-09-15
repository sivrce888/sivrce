import 'server-only'

/**
 * SIVRCE — live VBB departures for Berlin U/S-Bahn stations (server-side).
 * Upstream: v6.vbb.transport.rest (BVG/VBB HAFAS gateway — free, no key).
 * Stop IDs resolve by name once (cached 7 d — stations don't move); the
 * departures fetch is CDN-cached 45 s by /api/departures. No AbortSignal in
 * cached fetches (opts out of the Next data cache — see lib/weather.ts).
 * All parsing is pure and covered by de-live.check.ts.
 */

const VBB = 'https://v6.vbb.transport.rest'

export interface LiveDeparture {
  line: string
  bg: string
  fg: string
  dir: string
  when: string // ISO realtime ETA, plannedWhen fallback
  planned: string
  cancelled: boolean
  platform?: string
  note?: string // first disruption remark, already trimmed
}

export function isStopId(id: unknown): id is string {
  return typeof id === 'string' && /^\d{7,10}$/.test(id)
}

/** Haversine, km. Coordinates are OSM-sourced and close (<50 km); small-angle form is plenty. */
export function distKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}

interface StopLike {
  type?: string
  id?: string
  location?: { latitude?: number; longitude?: number }
}

/** Nearest stop-type hit — guards against generic station names (e.g. "Stadtmitte"). */
export function pickStop(results: unknown, lat: number, lng: number): string | null {
  if (!Array.isArray(results)) return null
  let best: string | null = null
  let bestD = Infinity
  for (const r of results as StopLike[]) {
    if (r?.type !== 'stop' || !isStopId(r.id) || typeof r.location?.latitude !== 'number' || typeof r.location?.longitude !== 'number')
      continue
    const d = distKm(lat, lng, r.location.latitude, r.location.longitude)
    if (d < bestD) {
      bestD = d
      best = r.id
    }
  }
  return best
}

/** Resolve the VBB stop ID for a station by name + known coordinates. Cached 7 d per name. */
export async function resolveStopId(name: string, lat: number, lng: number): Promise<string | null> {
  try {
    const r = await fetch(
      `${VBB}/locations?query=${encodeURIComponent(name)}&results=5&stops=true&addresses=false&poi=false`,
      { next: { revalidate: 604_800 } },
    )
    if (!r.ok) return null
    return pickStop(await r.json(), lat, lng)
  } catch {
    return null
  }
}

interface DepLike {
  when?: string
  plannedWhen?: string
  cancelled?: boolean
  platform?: string
  direction?: string
  line?: { name?: string; color?: { bg?: string; fg?: string } }
  remarks?: { type?: string; text?: string }[]
}

const trimNote = (s: string) => (s.length > 90 ? `${s.slice(0, 87)}…` : s)

/** HAFAS departures payload → compact board rows, soonest first, capped at 8. */
export function parseDepartures(json: unknown, now = Date.now()): LiveDeparture[] {
  if (!json || typeof json !== 'object' || !Array.isArray((json as { departures?: unknown }).departures)) return []
  const rows: LiveDeparture[] = []
  for (const d of (json as { departures: DepLike[] }).departures) {
    const when = typeof d.when === 'string' ? d.when : typeof d.plannedWhen === 'string' ? d.plannedWhen : null
    if (!when || !d.line?.name || !d.direction) continue
    if (Date.parse(when) < now - 60_000) continue
    const warn = d.remarks?.find((r) => r.type === 'warning' && r.text)
    rows.push({
      line: d.line.name,
      bg: d.line.color?.bg ?? '#0a1030',
      fg: d.line.color?.fg ?? '#fff',
      dir: d.direction,
      when,
      planned: typeof d.plannedWhen === 'string' ? d.plannedWhen : when,
      cancelled: d.cancelled === true,
      platform: d.platform,
      note: warn?.text ? trimNote(warn.text) : undefined,
    })
  }
  rows.sort((a, b) => Date.parse(a.when) - Date.parse(b.when))
  return rows.slice(0, 8)
}

export async function getDepartures(stopId: string): Promise<LiveDeparture[] | null> {
  if (!isStopId(stopId)) return null
  try {
    const r = await fetch(`${VBB}/stops/${stopId}/departures?results=12&duration=90&subsequentStops=false`, {
      next: { revalidate: 45 },
    })
    if (!r.ok) return null
    return parseDepartures(await r.json())
  } catch {
    return null
  }
}
