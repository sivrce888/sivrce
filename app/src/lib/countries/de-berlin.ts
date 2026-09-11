/**
 * Berlin Bezirk aggregation — joins the street-verified project catalog and
 * the OSM Ortsteile table onto the 12 official Bezirke. Pure derived data:
 * every number on a Bezirk page is computed here, never hand-written, so
 * counts can't drift from the catalog.
 * Sources: projects-new-berlin.ts (developer press, tracked 2026-09),
 * berlin-ortsteile.ts (© OpenStreetMap contributors, ODbL).
 */
import { BERLIN_BEZIRKE, type BerlinBezirk } from './de'
import { BERLIN_ORTSTEILE } from '@/data/berlin-ortsteile'
import { NEW_DEVELOPERS_BERLIN, NEW_PROJECTS_BERLIN } from '@/data/projects-new-berlin'
import { NEW_DEVELOPERS_GERMANY } from '@/data/projects-new-germany'
import type { Developer, Project } from '@/data/professionals'
import { hasPriceFrom } from '@/lib/directory-seo-lite'

/** Berlin-active developers live in both batches (e.g. ART INVEST is national). */
const DEVELOPERS: Developer[] = (() => {
  const seen = new Set<string>()
  const out: Developer[] = []
  for (const d of [NEW_DEVELOPERS_BERLIN, NEW_DEVELOPERS_GERMANY].flat()) {
    if (seen.has(d.slug)) continue
    seen.add(d.slug)
    out.push(d)
  }
  return out
})()

/** Ortsteil-level ka labels the catalog uses where the Bezirk ka doesn't apply. */
const KA_ORTSTEIL_TO_BEZIRK: Record<string, string> = {
  'კროიცბერგი': 'friedrichshain-kreuzberg',
  'პრენცლაუერ-ბერგი': 'pankow',
  'ფრიდრიხსფელდე': 'lichtenberg',
  'შონებერგი': 'tempelhof-schoeneberg',
  'ტემპელჰოფი': 'tempelhof-schoeneberg',
  'ლიხტერფელდე': 'steglitz-zehlendorf',
  'რაინიკენდორფი': 'reinickendorf',
  'შარლოტენბერგი': 'charlottenburg-wilmersdorf',
}

function distKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/** Canonical project→Bezirk join: ka label first, nearest-Ortsteil coords as backstop. */
export function bezirkSlugOfProject(p: Project): string {
  if (p.district) {
    const byKa = BERLIN_BEZIRKE.find((b) => b.ka === p.district) ??
      BERLIN_BEZIRKE.find((b) => KA_ORTSTEIL_TO_BEZIRK[p.district!] === b.slug)
    if (byKa) return byKa.slug
  }
  let best = BERLIN_ORTSTEILE[0]
  let bestD = Infinity
  for (const o of BERLIN_ORTSTEILE) {
    const d = distKm(p.coords, o)
    if (d < bestD) {
      bestD = d
      best = o
    }
  }
  return best.bezirk
}

export function bezirkBySlug(slug: string): BerlinBezirk | null {
  return BERLIN_BEZIRKE.find((b) => b.slug === slug) ?? null
}

export function ortsteileOfBezirk(slug: string) {
  return BERLIN_ORTSTEILE.filter((o) => o.bezirk === slug)
}

/** Bezirk anchor = mean of its Ortsteil centers (OSM), rounded to 4 dp. */
export function bezirkCenter(slug: string): { lat: number; lng: number } | null {
  const os = ortsteileOfBezirk(slug)
  if (!os.length) return null
  const lat = os.reduce((n, o) => n + o.lat, 0) / os.length
  const lng = os.reduce((n, o) => n + o.lng, 0) / os.length
  return { lat: Math.round(lat * 1e4) / 1e4, lng: Math.round(lng * 1e4) / 1e4 }
}

export function projectsOfBezirk(slug: string): Project[] {
  return NEW_PROJECTS_BERLIN.filter((p) => bezirkSlugOfProject(p) === slug)
}

export function developersOfBezirk(slug: string): Developer[] {
  const slugs = new Set(projectsOfBezirk(slug).map((p) => p.developerSlug))
  return DEVELOPERS.filter((d) => slugs.has(d.slug)).sort(
    (a, b) => b.unitsDelivered - a.unitsDelivered,
  )
}

export interface BezirkStats {
  projects: number
  /** Units in the ground or later (done < 100). */
  pipelineUnits: number
  underConstruction: number
  developers: number
  ortsteile: number
  /** Median published €/m² across priced projects; null under 3 samples. */
  medianEurM2: number | null
  priced: number
}

export function bezirkStats(slug: string): BezirkStats {
  const projects = projectsOfBezirk(slug)
  const prices = projects
    .filter((p) => hasPriceFrom(p.priceFromM2))
    .map((p) => Number(p.priceFromM2.replace(/[^\d]/g, '')))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b)
  const median =
    prices.length >= 3 ? prices[Math.floor((prices.length - 1) / 2)] : null
  return {
    projects: projects.length,
    pipelineUnits: projects.filter((p) => p.done < 100).reduce((n, p) => n + (p.flats || 0), 0),
    underConstruction: projects.filter((p) => p.done > 0 && p.done < 100).length,
    developers: developersOfBezirk(slug).length,
    ortsteile: ortsteileOfBezirk(slug).length,
    medianEurM2: median,
    priced: prices.length,
  }
}
