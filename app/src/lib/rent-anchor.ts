/**
 * Market rent per m² / month — the anchor behind every "est. rent / gross yield"
 * line. Rent = area × anchor, so yield varies with the listing's own price per m²
 * (the old `price × 0.5%` made every listing yield exactly 6%).
 *
 * Sources:
 *  - GE (USD): Galt & Taggart Tbilisi Residential Market Watch — city avg
 *    $10.0/m² (May 2026); district avgs Feb 2026 (Vake 13.8, Mtatsminda 11.7,
 *    Saburtalo 11.7, Samgori 8.4, Gldani 8.4). galtandtaggart.com
 *  - DE (EUR): DE_CITIES.rentEurSqm (lib/countries/de.ts).
 * Unknown market → null: the UI hides the line rather than guess.
 * ponytail: city/district anchors; upgrade to live rent comps once rent
 * listings carry enough area data per district.
 */

import { DE_CITIES } from '@/lib/countries/de'

export const GE_RENT_AS_OF = '2026-05'

const TBILISI_AVG_USD = 10.0
const TBILISI_DISTRICT_USD: Record<string, number> = {
  vake: 13.8, 'ვაკე': 13.8,
  mtatsminda: 11.7, 'მთაწმინდა': 11.7,
  saburtalo: 11.7, 'საბურთალო': 11.7,
  samgori: 8.4, 'სამგორი': 8.4,
  gldani: 8.4, 'გლდანი': 8.4,
}
const TBILISI = new Set(['tbilisi', 'თბილისი', 'тбилиси'])

const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase()

/** Monthly rent per m² in the listing's native currency (GE: USD, DE: EUR), or null. */
export function rentPerSqm(country: string | null | undefined, city: string | null | undefined, district?: string | null): number | null {
  if ((country ?? 'GE') === 'GE') { // Listing.country defaults to GE
    if (!TBILISI.has(norm(city))) return null
    return TBILISI_DISTRICT_USD[norm(district)] ?? TBILISI_AVG_USD
  }
  if (country === 'DE') {
    const c = norm(city)
    return DE_CITIES.find((d) => d.slug === c || d.de.toLowerCase() === c)?.rentEurSqm ?? null
  }
  return null
}

/** Estimated monthly rent (rounded to 10) or null when no anchor / no area. */
export function estimateRent(areaSqm: number, country: string | null | undefined, city: string | null | undefined, district?: string | null): number | null {
  const a = rentPerSqm(country, city, district)
  return a && areaSqm > 0 ? Math.round((areaSqm * a) / 10) * 10 : null
}
