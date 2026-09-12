/**
 * Metro distance formatting — zero dependencies, client-safe.
 * Split from lib/map/pois so cards can format server chips without shipping
 * the 1.1 MB POI JSON to the browser (device-budget lock).
 */

export interface NearMetro {
  name: string
  meters: number
  walkMin: number
}

export function formatMetroDist(n: NearMetro): string {
  if (n.meters < 1000) return `${n.meters} m · ${n.walkMin} min`
  return `${(n.meters / 1000).toFixed(1)} km · ${n.walkMin} min`
}
