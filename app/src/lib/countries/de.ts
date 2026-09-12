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
  /** Bestands-level anchor €/m² buy (portals median tier — verify quarterly). */
  buyEurSqm: number
  /** Cold-rent anchor €/m²/month (portals median tier — verify quarterly). */
  rentEurSqm: number
}

/**
 * Every German city above 100k residents (Großstädte, Zensus 2022 level).
 * Prices are market anchors for orientation, not listings; states mirror
 * GRUNDERWERBSTEUER_BY_STATE 1:1.
 */
export const DE_CITIES: DeCity[] = [
  { slug: "berlin", de: "Berlin", ka: "ბერლინი", state: "Berlin", transferTaxPct: 6.0, center: { lat: 52.52, lng: 13.405 }, buyEurSqm: 5300, rentEurSqm: 15.5 },
  { slug: "hamburg", de: "Hamburg", ka: "ჰამბურგი", state: "Hamburg", transferTaxPct: 5.5, center: { lat: 53.5511, lng: 9.9937 }, buyEurSqm: 6300, rentEurSqm: 15.5 },
  { slug: "munich", de: "München", ka: "მიუნხენი", state: "Bayern", transferTaxPct: 3.5, center: { lat: 48.1351, lng: 11.582 }, buyEurSqm: 8800, rentEurSqm: 23.0 },
  { slug: "cologne", de: "Köln", ka: "ქელნი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 50.9375, lng: 6.9603 }, buyEurSqm: 4700, rentEurSqm: 13.0 },
  { slug: "frankfurt", de: "Frankfurt am Main", ka: "ფრანკფურტი", state: "Hessen", transferTaxPct: 6.0, center: { lat: 50.1109, lng: 8.6821 }, buyEurSqm: 6900, rentEurSqm: 17.5 },
  { slug: "stuttgart", de: "Stuttgart", ka: "შტუტგარტი", state: "Baden-Württemberg", transferTaxPct: 5.0, center: { lat: 48.7758, lng: 9.1829 }, buyEurSqm: 5500, rentEurSqm: 15.0 },
  { slug: "duesseldorf", de: "Düsseldorf", ka: "დიუსელდორფი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 51.2277, lng: 6.7735 }, buyEurSqm: 5300, rentEurSqm: 14.0 },
  { slug: "leipzig", de: "Leipzig", ka: "ლაიფციგი", state: "Sachsen", transferTaxPct: 5.5, center: { lat: 51.3397, lng: 12.3731 }, buyEurSqm: 3300, rentEurSqm: 8.3 },
  { slug: "dortmund", de: "Dortmund", ka: "დორტმუნდი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 51.5136, lng: 7.4653 }, buyEurSqm: 2700, rentEurSqm: 8.0 },
  { slug: "essen", de: "Essen", ka: "ესენი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 51.4556, lng: 7.0116 }, buyEurSqm: 2600, rentEurSqm: 8.2 },
  { slug: "bremen", de: "Bremen", ka: "ბრემენი", state: "Bremen", transferTaxPct: 5.0, center: { lat: 53.0793, lng: 8.8017 }, buyEurSqm: 3200, rentEurSqm: 10.0 },
  { slug: "dresden", de: "Dresden", ka: "დრეზდენი", state: "Sachsen", transferTaxPct: 5.5, center: { lat: 51.0504, lng: 13.7373 }, buyEurSqm: 3600, rentEurSqm: 9.5 },
  { slug: "hanover", de: "Hannover", ka: "ჰანოვერი", state: "Niedersachsen", transferTaxPct: 5.0, center: { lat: 52.3759, lng: 9.732 }, buyEurSqm: 3900, rentEurSqm: 11.0 },
  { slug: "nuremberg", de: "Nürnberg", ka: "ნიურნბერგი", state: "Bayern", transferTaxPct: 3.5, center: { lat: 49.4521, lng: 11.0767 }, buyEurSqm: 4600, rentEurSqm: 12.5 },
  { slug: "duisburg", de: "Duisburg", ka: "დუისბურგი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 51.4344, lng: 6.7623 }, buyEurSqm: 2200, rentEurSqm: 7.5 },
  { slug: "bochum", de: "Bochum", ka: "ბოხუმი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 51.4818, lng: 7.2162 }, buyEurSqm: 2500, rentEurSqm: 8.3 },
  { slug: "wuppertal", de: "Wuppertal", ka: "ვუპერტალი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 51.2562, lng: 7.1508 }, buyEurSqm: 2600, rentEurSqm: 8.5 },
  { slug: "bielefeld", de: "Bielefeld", ka: "ბილეფელდი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 52.0217, lng: 8.5347 }, buyEurSqm: 3000, rentEurSqm: 9.5 },
  { slug: "bonn", de: "Bonn", ka: "ბონი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 50.7374, lng: 7.0982 }, buyEurSqm: 5200, rentEurSqm: 13.5 },
  { slug: "muenster", de: "Münster", ka: "მიუნსტერი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 51.9607, lng: 7.6261 }, buyEurSqm: 4100, rentEurSqm: 11.5 },
  { slug: "mannheim", de: "Mannheim", ka: "მანჰაიმი", state: "Baden-Württemberg", transferTaxPct: 5.0, center: { lat: 49.4875, lng: 8.466 }, buyEurSqm: 3900, rentEurSqm: 11.0 },
  { slug: "karlsruhe", de: "Karlsruhe", ka: "კარლსრუე", state: "Baden-Württemberg", transferTaxPct: 5.0, center: { lat: 49.0069, lng: 8.4037 }, buyEurSqm: 4300, rentEurSqm: 12.0 },
  { slug: "augsburg", de: "Augsburg", ka: "აუგსბურგი", state: "Bayern", transferTaxPct: 3.5, center: { lat: 48.3712, lng: 10.8983 }, buyEurSqm: 3800, rentEurSqm: 11.0 },
  { slug: "wiesbaden", de: "Wiesbaden", ka: "ვისბადენი", state: "Hessen", transferTaxPct: 6.0, center: { lat: 50.0782, lng: 8.2398 }, buyEurSqm: 4800, rentEurSqm: 13.0 },
  { slug: "moenchengladbach", de: "Mönchengladbach", ka: "მიონხენგლადბახი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 51.1947, lng: 6.4353 }, buyEurSqm: 2900, rentEurSqm: 9.0 },
  { slug: "gelsenkirchen", de: "Gelsenkirchen", ka: "გელზენკირხენი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 51.5172, lng: 7.0851 }, buyEurSqm: 1900, rentEurSqm: 7.2 },
  { slug: "aachen", de: "Aachen", ka: "აახენი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 50.7753, lng: 6.0839 }, buyEurSqm: 3200, rentEurSqm: 10.5 },
  { slug: "braunschweig", de: "Braunschweig", ka: "ბრაუნშვაიგი", state: "Niedersachsen", transferTaxPct: 5.0, center: { lat: 52.2689, lng: 10.5268 }, buyEurSqm: 3300, rentEurSqm: 9.8 },
  { slug: "chemnitz", de: "Chemnitz", ka: "კემნიცი", state: "Sachsen", transferTaxPct: 5.5, center: { lat: 50.8278, lng: 12.9214 }, buyEurSqm: 2100, rentEurSqm: 6.5 },
  { slug: "kiel", de: "Kiel", ka: "კილი", state: "Schleswig-Holstein", transferTaxPct: 6.5, center: { lat: 54.3233, lng: 10.1394 }, buyEurSqm: 3600, rentEurSqm: 11.0 },
  { slug: "halle", de: "Halle (Saale)", ka: "ჰალე", state: "Sachsen-Anhalt", transferTaxPct: 5.0, center: { lat: 51.4826, lng: 11.9705 }, buyEurSqm: 2300, rentEurSqm: 7.0 },
  { slug: "magdeburg", de: "Magdeburg", ka: "მაგდებურგი", state: "Sachsen-Anhalt", transferTaxPct: 5.0, center: { lat: 52.1205, lng: 11.6276 }, buyEurSqm: 2400, rentEurSqm: 7.5 },
  { slug: "freiburg", de: "Freiburg im Breisgau", ka: "ფრაიბურგი", state: "Baden-Württemberg", transferTaxPct: 5.0, center: { lat: 47.999, lng: 7.8421 }, buyEurSqm: 5600, rentEurSqm: 15.5 },
  { slug: "krefeld", de: "Krefeld", ka: "კრეფელდი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 51.3397, lng: 6.5899 }, buyEurSqm: 2700, rentEurSqm: 8.8 },
  { slug: "mainz", de: "Mainz", ka: "მაინცი", state: "Rheinland-Pfalz", transferTaxPct: 5.0, center: { lat: 49.9929, lng: 8.2473 }, buyEurSqm: 4800, rentEurSqm: 13.5 },
  { slug: "luebeck", de: "Lübeck", ka: "ლიუბეკი", state: "Schleswig-Holstein", transferTaxPct: 6.5, center: { lat: 53.8655, lng: 10.6866 }, buyEurSqm: 3600, rentEurSqm: 10.5 },
  { slug: "erfurt", de: "Erfurt", ka: "ერფურტი", state: "Thüringen", transferTaxPct: 6.5, center: { lat: 50.9848, lng: 11.0299 }, buyEurSqm: 3300, rentEurSqm: 9.5 },
  { slug: "oberhausen", de: "Oberhausen", ka: "ობერჰაუზენი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 51.4704, lng: 6.8517 }, buyEurSqm: 2200, rentEurSqm: 7.8 },
  { slug: "rostock", de: "Rostock", ka: "როსტოკი", state: "Mecklenburg-Vorpommern", transferTaxPct: 6.5, center: { lat: 54.0887, lng: 12.1405 }, buyEurSqm: 3400, rentEurSqm: 10.0 },
  { slug: "kassel", de: "Kassel", ka: "კასელი", state: "Hessen", transferTaxPct: 6.0, center: { lat: 51.3127, lng: 9.4797 }, buyEurSqm: 3100, rentEurSqm: 9.3 },
  { slug: "potsdam", de: "Potsdam", ka: "პოტსდამი", state: "Brandenburg", transferTaxPct: 6.5, center: { lat: 52.3906, lng: 13.0645 }, buyEurSqm: 4700, rentEurSqm: 12.5 },
  { slug: "saarbruecken", de: "Saarbrücken", ka: "ზაარბრიუკენი", state: "Saarland", transferTaxPct: 6.5, center: { lat: 49.2402, lng: 6.9969 }, buyEurSqm: 2800, rentEurSqm: 8.8 },
  { slug: "hamm", de: "Hamm", ka: "ჰამი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 51.6805, lng: 7.8163 }, buyEurSqm: 2200, rentEurSqm: 7.6 },
  { slug: "ludwigshafen", de: "Ludwigshafen am Rhein", ka: "ლუდვიგსჰაფენი", state: "Rheinland-Pfalz", transferTaxPct: 5.0, center: { lat: 49.4774, lng: 8.4452 }, buyEurSqm: 3100, rentEurSqm: 9.5 },
  { slug: "oldenburg", de: "Oldenburg", ka: "ოლდენბურგი", state: "Niedersachsen", transferTaxPct: 5.0, center: { lat: 53.1435, lng: 8.2146 }, buyEurSqm: 3400, rentEurSqm: 10.3 },
  { slug: "osnabrueck", de: "Osnabrück", ka: "ოსნაბრიუკი", state: "Niedersachsen", transferTaxPct: 5.0, center: { lat: 52.2799, lng: 8.0472 }, buyEurSqm: 3300, rentEurSqm: 9.8 },
  { slug: "leverkusen", de: "Leverkusen", ka: "ლევერკუზენი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 51.0486, lng: 6.9844 }, buyEurSqm: 3600, rentEurSqm: 10.5 },
  { slug: "heidelberg", de: "Heidelberg", ka: "ჰაიდელბერგი", state: "Baden-Württemberg", transferTaxPct: 5.0, center: { lat: 49.3988, lng: 8.6724 }, buyEurSqm: 5400, rentEurSqm: 15.0 },
  { slug: "darmstadt", de: "Darmstadt", ka: "დარმშტადტი", state: "Hessen", transferTaxPct: 6.0, center: { lat: 49.8728, lng: 8.6512 }, buyEurSqm: 4600, rentEurSqm: 12.5 },
  { slug: "solingen", de: "Solingen", ka: "ზოლინგენი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 51.1652, lng: 7.0671 }, buyEurSqm: 2700, rentEurSqm: 8.5 },
  { slug: "herne", de: "Herne", ka: "ჰერნე", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 51.5392, lng: 7.2223 }, buyEurSqm: 2000, rentEurSqm: 7.2 },
  { slug: "regensburg", de: "Regensburg", ka: "რეგენსბურგი", state: "Bayern", transferTaxPct: 3.5, center: { lat: 49.0134, lng: 12.1016 }, buyEurSqm: 4400, rentEurSqm: 12.5 },
  { slug: "neuss", de: "Neuss", ka: "ნოისი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 51.1947, lng: 6.6931 }, buyEurSqm: 3400, rentEurSqm: 10.0 },
  { slug: "ingolstadt", de: "Ingolstadt", ka: "ინგოლშტადტი", state: "Bayern", transferTaxPct: 3.5, center: { lat: 48.7665, lng: 11.4258 }, buyEurSqm: 4300, rentEurSqm: 12.0 },
  { slug: "wuerzburg", de: "Würzburg", ka: "ვიურცბურგი", state: "Bayern", transferTaxPct: 3.5, center: { lat: 49.7913, lng: 9.9533 }, buyEurSqm: 4300, rentEurSqm: 11.5 },
  { slug: "wolfsburg", de: "Wolfsburg", ka: "ვოლფსბურგი", state: "Niedersachsen", transferTaxPct: 5.0, center: { lat: 52.4227, lng: 10.7865 }, buyEurSqm: 2600, rentEurSqm: 8.0 },
  { slug: "ulm", de: "Ulm", ka: "ულმი", state: "Baden-Württemberg", transferTaxPct: 5.0, center: { lat: 48.4011, lng: 9.9876 }, buyEurSqm: 4000, rentEurSqm: 11.5 },
  { slug: "paderborn", de: "Paderborn", ka: "პადერბორნი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 51.719, lng: 8.7544 }, buyEurSqm: 3000, rentEurSqm: 9.0 },
  { slug: "pforzheim", de: "Pforzheim", ka: "პფორცჰაიმი", state: "Baden-Württemberg", transferTaxPct: 5.0, center: { lat: 48.895, lng: 8.705 }, buyEurSqm: 3200, rentEurSqm: 9.5 },
  { slug: "offenbach", de: "Offenbach am Main", ka: "ოფენბახი", state: "Hessen", transferTaxPct: 6.0, center: { lat: 50.1006, lng: 8.7636 }, buyEurSqm: 3800, rentEurSqm: 11.0 },
  { slug: "bottrop", de: "Bottrop", ka: "ბოტროპი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 51.5236, lng: 6.9287 }, buyEurSqm: 2200, rentEurSqm: 7.5 },
  { slug: "fuerth", de: "Fürth", ka: "ფიურტი", state: "Bayern", transferTaxPct: 3.5, center: { lat: 49.4774, lng: 10.9883 }, buyEurSqm: 4100, rentEurSqm: 11.5 },
  { slug: "recklinghausen", de: "Recklinghausen", ka: "რეკლინგჰაუზენი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 51.6139, lng: 7.1966 }, buyEurSqm: 2300, rentEurSqm: 7.5 },
  { slug: "bremerhaven", de: "Bremerhaven", ka: "ბრემერჰაფენი", state: "Bremen", transferTaxPct: 5.0, center: { lat: 53.5499, lng: 8.5905 }, buyEurSqm: 2300, rentEurSqm: 8.0 },
  { slug: "reutlingen", de: "Reutlingen", ka: "როიტლინგენი", state: "Baden-Württemberg", transferTaxPct: 5.0, center: { lat: 48.492, lng: 9.2042 }, buyEurSqm: 3300, rentEurSqm: 9.5 },
  { slug: "remscheid", de: "Remscheid", ka: "რემშაიდი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 51.1794, lng: 7.1978 }, buyEurSqm: 2500, rentEurSqm: 8.0 },
  { slug: "koblenz", de: "Koblenz", ka: "კობლენცი", state: "Rheinland-Pfalz", transferTaxPct: 5.0, center: { lat: 50.3554, lng: 7.5752 }, buyEurSqm: 3300, rentEurSqm: 9.8 },
  { slug: "bergisch-gladbach", de: "Bergisch Gladbach", ka: "ბერგიშ-გლადბახი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 50.9852, lng: 7.1384 }, buyEurSqm: 3300, rentEurSqm: 9.5 },
  { slug: "erlangen", de: "Erlangen", ka: "ერლანგენი", state: "Bayern", transferTaxPct: 3.5, center: { lat: 49.5964, lng: 11.0044 }, buyEurSqm: 4800, rentEurSqm: 13.0 },
  { slug: "trier", de: "Trier", ka: "ტრიერი", state: "Rheinland-Pfalz", transferTaxPct: 5.0, center: { lat: 49.7596, lng: 6.642 }, buyEurSqm: 3400, rentEurSqm: 9.8 },
  { slug: "salzgitter", de: "Salzgitter", ka: "ზალცგიტერი", state: "Niedersachsen", transferTaxPct: 5.0, center: { lat: 52.15, lng: 10.3333 }, buyEurSqm: 1900, rentEurSqm: 6.8 },
  { slug: "jena", de: "Jena", ka: "იენა", state: "Thüringen", transferTaxPct: 6.5, center: { lat: 50.9272, lng: 11.5892 }, buyEurSqm: 3600, rentEurSqm: 10.0 },
  { slug: "cottbus", de: "Cottbus", ka: "კოტბუსი", state: "Brandenburg", transferTaxPct: 6.5, center: { lat: 51.7606, lng: 14.3345 }, buyEurSqm: 2100, rentEurSqm: 6.8 },
  { slug: "hildesheim", de: "Hildesheim", ka: "ჰილდესჰაიმი", state: "Niedersachsen", transferTaxPct: 5.0, center: { lat: 52.1522, lng: 9.9512 }, buyEurSqm: 2900, rentEurSqm: 8.8 },
  { slug: "moers", de: "Moers", ka: "მერსი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 51.4524, lng: 6.6214 }, buyEurSqm: 2600, rentEurSqm: 8.3 },
  { slug: "siegen", de: "Siegen", ka: "ზიგენი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 50.8751, lng: 8.017 }, buyEurSqm: 2500, rentEurSqm: 8.0 },
  { slug: "gera", de: "Gera", ka: "გერა", state: "Thüringen", transferTaxPct: 6.5, center: { lat: 50.8776, lng: 12.0889 }, buyEurSqm: 1900, rentEurSqm: 6.5 },
  { slug: "kaiserslautern", de: "Kaiserslautern", ka: "კაიზერსლაუტერნი", state: "Rheinland-Pfalz", transferTaxPct: 5.0, center: { lat: 49.4403, lng: 7.7607 }, buyEurSqm: 2400, rentEurSqm: 8.0 },
  { slug: "goettingen", de: "Göttingen", ka: "გოტინგენი", state: "Niedersachsen", transferTaxPct: 5.0, center: { lat: 51.5413, lng: 9.9128 }, buyEurSqm: 2900, rentEurSqm: 10.0 },
  { slug: "hagen", de: "Hagen", ka: "ჰაგენი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 51.3671, lng: 7.4633 }, buyEurSqm: 1900, rentEurSqm: 7.3 },
  { slug: "heilbronn", de: "Heilbronn", ka: "ჰაილბრონი", state: "Baden-Württemberg", transferTaxPct: 5.0, center: { lat: 49.1403, lng: 9.22 }, buyEurSqm: 3600, rentEurSqm: 10.5 },
  { slug: "muelheim", de: "Mülheim an der Ruhr", ka: "მიულჰაიმი", state: "Nordrhein-Westfalen", transferTaxPct: 6.5, center: { lat: 51.4272, lng: 6.8825 }, buyEurSqm: 2100, rentEurSqm: 7.6 },
]

/** Gross rental yield % from the price anchors (one decimal). */
export function grossYieldPct(city: DeCity): number {
  return Math.round(((city.rentEurSqm * 12) / city.buyEurSqm) * 1000) / 10
}

export function deCityBySlug(slug: string): DeCity | null {
  return DE_CITIES.find((c) => c.slug === slug) ?? null
}

/** Buyer-side acquisition-cost anchor: price × (1 + tax + ~2% notary/register). */
export function acquisitionCostEstimate(priceEur: number, citySlug: string): number | null {
  const city = deCityBySlug(citySlug)
  if (!city || !Number.isFinite(priceEur) || priceEur <= 0) return null
  return Math.round(priceEur * (1 + (city.transferTaxPct + 2) / 100))
}

/**
 * Grunderwerbsteuer by Bundesland, % (public state law, stable for years —
 * re-check yearly, not per request; Stand 2026). DE_CITIES.transferTaxPct
 * mirrors these values for every city.
 */
export const GRUNDERWERBSTEUER_BY_STATE: Record<string, number> = {
  'Baden-Württemberg': 5.0,
  Bayern: 3.5,
  Berlin: 6.0,
  Brandenburg: 6.5,
  Bremen: 5.0,
  Hamburg: 5.5,
  Hessen: 6.0,
  'Mecklenburg-Vorpommern': 6.5,
  Niedersachsen: 5.0,
  'Nordrhein-Westfalen': 6.5,
  'Rheinland-Pfalz': 5.0,
  Saarland: 6.5,
  Sachsen: 5.5,
  'Sachsen-Anhalt': 5.0,
  'Schleswig-Holstein': 6.5,
  Thüringen: 6.5,
}

/**
 * Kaufnebenkosten model (public fee schedules + market convention).
 * Notary ≈ 1.5 % and Grundbuch ≈ 0.5 % scale with price (GNotKG); the buyer
 * Makler share is 3.57 % incl. MwSt where commission is split 50/50
 * (Maklergesetz since Dec 2020) and 0 on provisionsfrei deals.
 * ponytail: constants + one pure function — no calculator UI until a
 * country page actually renders it.
 */
export const DE_NOTARY_PCT = 1.5
export const DE_REGISTER_PCT = 0.5
export const DE_MAKLER_BUYER_PCT = 3.57

export interface BuyerCostBreakdown {
  price: number
  transferTax: number
  notary: number
  register: number
  makler: number
  total: number
  /** Total surcharge over price, % (one decimal). */
  totalPct: number
}

export function buyerCostBreakdown(
  priceEur: number,
  citySlug: string,
  opts?: { withMakler?: boolean },
): BuyerCostBreakdown | null {
  const city = deCityBySlug(citySlug)
  if (!city || !Number.isFinite(priceEur) || priceEur <= 0) return null
  const withMakler = opts?.withMakler ?? true
  const transferTax = Math.round((priceEur * city.transferTaxPct) / 100)
  const notary = Math.round((priceEur * DE_NOTARY_PCT) / 100)
  const register = Math.round((priceEur * DE_REGISTER_PCT) / 100)
  const makler = withMakler ? Math.round((priceEur * DE_MAKLER_BUYER_PCT) / 100) : 0
  const total = priceEur + transferTax + notary + register + makler
  return {
    price: priceEur,
    transferTax,
    notary,
    register,
    makler,
    total,
    totalPct: Math.round((total / priceEur - 1) * 1000) / 10,
  }
}

/**
 * Rental-law anchors Germans check first (§551 / §558 BGB, Mietpreisbremse;
 * Stand 2026). Qualitative rules only — medians come from the city
 * Mietspiegel, never from a hardcoded table.
 */
export const DE_RENTAL_RULES = {
  /** Kaution cap in monthly Kaltmieten; payable in 3 instalments, segregated account. */
  maxDepositColdRents: 3,
  /** Mietpreisbremse cap above ortsübliche Vergleichsmiete on re-lets (Berlin). */
  rentBrakePctAboveComparative: 10,
  /** Neubau first occupied after this date is exempt from the rent brake. */
  newBuildExemptAfter: '2014-10-01',
  /** Warmmiete = Kaltmiete + heating + Betriebskosten; compare like with like. */
  compareBasis: 'kaltmiete',
} as const

/** Energieausweis efficiency classes (GEG scale, Bedarf or Verbrauch). */
export const DE_ENERGY_CLASSES = ['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const

/** KfW-relevant Effizienzhaus tiers buyers meet in Neubau listings (QNG = Nachhaltigkeitssiegel). */
export const DE_EFFICIENCY_TIERS = ['EH 40', 'EH 55', 'QNG-Plus', 'QNG-Premium'] as const
