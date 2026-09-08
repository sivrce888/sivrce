import 'server-only'

/**
 * SIVRCE — land profile for plot listings via Open-Meteo (free, no API key,
 * the same provider weather.ts already trusts). One elevation call samples the
 * centre + 4 neighbours ~67 m out → slope & facing; one archive call gives the
 * observed last-365-days climate. Both fetches ride the Next data cache keyed
 * by the rounded coordinate, so ISR re-renders never re-hit upstream.
 *
 * ponytail: ISRIC SoilGrids would add texture/pH but its REST API is officially
 * paused (isric.org, 2025) — revisit when it returns. Upgrade path: sand/silt/
 * clay + pH layer on the same card.
 */

export interface LandInsights {
  /** Centre elevation, m above sea level. */
  elev: number
  /** Steepest descent across the 4 sampled directions, degrees from horizontal. */
  slopeDeg: number
  /** Direction the land slopes toward (the way water and cold air drain). */
  aspect: Aspect
  /** Observed precipitation total over the last 365 days, mm. */
  precipMm: number
  /** Observed mean temperature over the last 365 days, °C. */
  meanTemp: number
}

export type Aspect = 'flat' | 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'

/** Georgia bounding box — junk/default coords must never hit the APIs. */
const GEO = { latMin: 41.02, latMax: 43.62, lngMin: 39.95, lngMax: 46.75 }

export function inGeorgia(lat: number, lng: number): boolean {
  return lat >= GEO.latMin && lat <= GEO.latMax && lng >= GEO.lngMin && lng <= GEO.lngMax
}

/** Sample offset ≈ 67 m north–south; east–west shrinks with latitude. */
const STEP = 0.0006
const RAD = Math.PI / 180

/**
 * Slope & aspect from [centre, north, south, east, west] elevations (metres).
 * `aspect` is the downhill bearing; below 0.5° (~1%) the plot reads flat.
 */
export function slopeAspect(elev: number[], lat: number): { slopeDeg: number; aspect: Aspect } {
  const [c, n, s, e, w] = elev
  if ([c, n, s, e, w].some((v) => typeof v !== 'number' || Number.isNaN(v))) {
    return { slopeDeg: 0, aspect: 'flat' }
  }
  const dNS = STEP * 111_320
  const dEW = dNS * Math.cos(lat * RAD)
  let best: { slopeDeg: number; aspect: Aspect } = { slopeDeg: 0, aspect: 'flat' }
  for (const [aspect, dz, d] of [
    ['N', c - n, dNS],
    ['S', c - s, dNS],
    ['E', c - e, dEW],
    ['W', c - w, dEW],
  ] as const) {
    const deg = Math.atan(Math.abs(dz) / d) / RAD
    if (deg > best.slopeDeg) best = { slopeDeg: deg, aspect }
  }
  if (best.slopeDeg < 0.5) return { slopeDeg: best.slopeDeg, aspect: 'flat' }
  return best
}

/** Last full archive day (Open-Meteo lags ~5 days) and the 364 days before it. */
function climateWindow(): { start: string; end: string } {
  const end = new Date(Date.now() - 6 * 86_400_000)
  const start = new Date(end.valueOf() - 364 * 86_400_000)
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

/**
 * Land insights for a plot coordinate. Returns null on any failure or thin
 * data — the card is informative and must never break a page render. No
 * AbortSignal: passing one would opt the request out of the Next data cache.
 */
export async function getLandInsights(coords: { lat: number; lng: number }): Promise<LandInsights | null> {
  const { lat, lng } = coords
  if (!inGeorgia(lat, lng)) return null
  // 3dp centre ≈ 110 m — the cache key for a plot and its ISR re-renders.
  // Neighbours stay 4dp (≈11 m grid) so sampled offsets match STEP exactly;
  // rounding them to 3dp would collapse a direction onto the centre point.
  const la = lat.toFixed(3)
  const lo = lng.toFixed(3)
  const cs = Math.cos(lat * RAD)
  const lats = [la, (lat + STEP).toFixed(4), (lat - STEP).toFixed(4), la, la].join(',')
  const lngs = [lo, lo, lo, (lng + STEP / cs).toFixed(4), (lng - STEP / cs).toFixed(4)].join(',')
  const { start, end } = climateWindow()
  try {
    const [elR, clR] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lngs}`, {
        next: { revalidate: 2_592_000 }, // terrain doesn't drift — 30 days
      }),
      fetch(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${la}&longitude=${lo}&start_date=${start}&end_date=${end}&daily=temperature_2m_mean,precipitation_sum&timezone=auto`,
        { next: { revalidate: 604_800 } }, // rolling 365-day climate — refresh weekly
      ),
    ])
    const el = await elR.json()
    const cl = await clR.json()
    const elev: unknown[] = el?.elevation
    if (!Array.isArray(elev) || elev.length !== 5) return null
    const { slopeDeg, aspect } = slopeAspect(elev as number[], lat)
    const days: number = cl?.daily?.time?.length ?? 0
    const temps = (cl?.daily?.temperature_2m_mean as (number | null)[] | undefined)?.filter(
      (v): v is number => typeof v === 'number',
    )
    const precip = (cl?.daily?.precipitation_sum as (number | null)[] | undefined)?.reduce<number>(
      (sum, v) => (typeof v === 'number' ? sum + v : sum),
      0,
    )
    // Thin or broken archive year → say nothing rather than mislead.
    if (!temps || precip === undefined || temps.length < 300 || days < 300) return null
    return {
      elev: Math.round(elev[0] as number),
      slopeDeg,
      aspect,
      precipMm: Math.round(precip!),
      meanTemp: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length * 10) / 10,
    }
  } catch {
    return null
  }
}
