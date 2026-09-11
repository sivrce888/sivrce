/**
 * Germany country adapter — canonical DE geography + market constants.
 * Pure data, no DB, no network. Shared canonical schema lives in
 * lib/intel/core.ts; Georgia stays the reference adapter.
 *
 * Facts: 12 Berlin Bezirke (official), city centers (approximate map
 * anchors, not survey pins), Grunderwerbsteuer rates (public state law,
 * stable for years — re-check yearly, not per request).
 * ponytail: one file, not a per-city fan-out — split only when a city
 * needs its own ingest quirks (permits HTML, cadastre dialect).
 */

export interface BerlinBezirk {
  slug: string
  de: string
  /** ka label as used by the project catalog (Ortsteil-level display). */
  ka: string
}

export const BERLIN_BEZIRKE: BerlinBezirk[] = [
  { slug: "mitte", de: "Mitte", ka: "მიტე" },
  { slug: "friedrichshain-kreuzberg", de: "Friedrichshain-Kreuzberg", ka: "ფრიდრიხსჰაინი" },
  { slug: "pankow", de: "Pankow", ka: "პანკოვი" },
  { slug: "charlottenburg-wilmersdorf", de: "Charlottenburg-Wilmersdorf", ka: "შარლოტენბურგი" },
  { slug: "spandau", de: "Spandau", ka: "შპანდაუ" },
  { slug: "steglitz-zehlendorf", de: "Steglitz-Zehlendorf", ka: "ლიხტერფელდე" },
  { slug: "tempelhof-schoeneberg", de: "Tempelhof-Schöneberg", ka: "ტემპელჰოფი" },
  { slug: "neukoelln", de: "Neukölln", ka: "ნოიკოლნი" },
  { slug: "treptow-koepenick", de: "Treptow-Köpenick", ka: "ტრეპტოვ-კეპენიკი" },
  { slug: "marzahn-hellersdorf", de: "Marzahn-Hellersdorf", ka: "Marzahn-Hellersdorf" },
  { slug: "lichtenberg", de: "Lichtenberg", ka: "ლიხტენბერგი" },
  { slug: "reinickendorf", de: "Reinickendorf", ka: "Reinickendorf" },
]

/** Well-known Ortsteil / quarter → parent Bezirk (project-location normalization). */
const ORTSTEIL_TO_BEZIRK: Record<string, string> = {
  kreuzberg: "friedrichshain-kreuzberg",
  friedrichshain: "friedrichshain-kreuzberg",
  "prenzlauer berg": "pankow",
  charlottenburg: "charlottenburg-wilmersdorf",
  wilmersdorf: "charlottenburg-wilmersdorf",
  schoeneberg: "tempelhof-schoeneberg",
  schoneberg: "tempelhof-schoeneberg",
  tempelhof: "tempelhof-schoeneberg",
  neukoelln: "neukoelln",
  neukolln: "neukoelln",
  buckow: "neukoelln",
  gruenau: "treptow-koepenick",
  grunau: "treptow-koepenick",
  koepenick: "treptow-koepenick",
  kopenick: "treptow-koepenick",
  lichtenberg: "lichtenberg",
  karlshorst: "lichtenberg",
  buch: "pankow",
  haselhorst: "spandau",
  lichterfelde: "steglitz-zehlendorf",
  wedding: "mitte",
  moabit: "mitte",
}

export function bezirkSlugOfOrtsteil(raw: string): string | null {
  const key = raw
    .toLowerCase()
    .replace(/[ä]/g, "a")
    .replace(/[ö]/g, "o")
    .replace(/[ü]/g, "u")
    .replace(/ß/g, "ss")
    .trim()
  if (!key) return null
  if (ORTSTEIL_TO_BEZIRK[key]) return ORTSTEIL_TO_BEZIRK[key]
  const hit = BERLIN_BEZIRKE.find((b) => b.slug === key || b.de.toLowerCase() === key)
  return hit ? hit.slug : null
}

export function bezirkKaLabel(slug: string): string | null {
  return BERLIN_BEZIRKE.find((b) => b.slug === slug)?.ka ?? null
}

export interface DeCity {
  slug: string
  de: string
  ka: string
  state: string
  /** Grunderwerbsteuer % (public state law — verify yearly). */
  transferTaxPct: number
  center: { lat: number; lng: number }
}

export const DE_CITIES: DeCity[] = [
  { slug: "berlin", de: "Berlin", ka: "ბერლინი", state: "Berlin", transferTaxPct: 6.0, center: { lat: 52.52, lng: 13.405 } },
  { slug: "hamburg", de: "Hamburg", ka: "ჰამბურგი", state: "Hamburg", transferTaxPct: 5.5, center: { lat: 53.5511, lng: 9.9937 } },
  { slug: "munich", de: "München", ka: "მიუნხენი", state: "Bayern", transferTaxPct: 3.5, center: { lat: 48.1351, lng: 11.582 } },
  { slug: "cologne", de: "Köln", ka: "ქელნი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 50.9375, lng: 6.9603 } },
  { slug: "frankfurt", de: "Frankfurt am Main", ka: "ფრანკფურტი", state: "Hessen", transferTaxPct: 6.0, center: { lat: 50.1109, lng: 8.6821 } },
  { slug: "stuttgart", de: "Stuttgart", ka: "შტუტგარტი", state: "Baden-Württemberg", transferTaxPct: 5.0, center: { lat: 48.7758, lng: 9.1829 } },
  { slug: "duesseldorf", de: "Düsseldorf", ka: "დიუსელდორფი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 51.2277, lng: 6.7735 } },
  { slug: "leipzig", de: "Leipzig", ka: "ლაიფციგი", state: "Sachsen", transferTaxPct: 5.5, center: { lat: 51.3397, lng: 12.3731 } },
  { slug: "dortmund", de: "Dortmund", ka: "დორტმუნდი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 51.5136, lng: 7.4653 } },
  { slug: "essen", de: "Essen", ka: "ესენი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 51.4556, lng: 7.0116 } },
  { slug: "bremen", de: "Bremen", ka: "ბრემენი", state: "Bremen", transferTaxPct: 5.0, center: { lat: 53.0793, lng: 8.8017 } },
  { slug: "dresden", de: "Dresden", ka: "დრეზდენი", state: "Sachsen", transferTaxPct: 5.5, center: { lat: 51.0504, lng: 13.7373 } },
  { slug: "hanover", de: "Hannover", ka: "ჰანოვერი", state: "Niedersachsen", transferTaxPct: 5.0, center: { lat: 52.3759, lng: 9.732 } },
  { slug: "nuremberg", de: "Nürnberg", ka: "ნიურნბერგი", state: "Bayern", transferTaxPct: 3.5, center: { lat: 49.4521, lng: 11.0767 } },
  { slug: "duisburg", de: "Duisburg", ka: "დუისბურგი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 51.4344, lng: 6.7623 } },
  { slug: "bochum", de: "Bochum", ka: "ბოხუმი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 51.4818, lng: 7.2162 } },
]

export function deCityBySlug(slug: string): DeCity | null {
  return DE_CITIES.find((c) => c.slug === slug) ?? null
}

/** Buyer-side acquisition-cost anchor: price × (1 + tax + ~2% notary/register). */
export function acquisitionCostEstimate(priceEur: number, citySlug: string): number | null {
  const city = deCityBySlug(citySlug)
  if (!city || !Number.isFinite(priceEur) || priceEur <= 0) return null
  return Math.round(priceEur * (1 + (city.transferTaxPct + 2) / 100))
}
