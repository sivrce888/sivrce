/**
 * SIVRCE — Tbilisi Metro station catalog (programmatic SEO).
 * All 22 stations of both lines, coordinates from OSM (tbilisi-pois.json,
 * category=metro; Sadguris Moedani's twin nodes averaged).
 *
 * `near` is the pre-inflected genitive + adessive phrase used in the exact
 * search query „ბინები გლდანის მეტროსთან" — precomputed per station so
 * Georgian grammar is never generated at runtime.
 *
 * ponytail: order = riding order per line; re-run scripts/sync POIs to refresh coords.
 */

export interface MetroStation {
  slug: string
  /** Proper station name, nominative: გლდანის მეტროსთან → „სარაჯიშვილი" */
  ka: string
  /** Pre-inflected „near" phrase: სარაჯიშვილის მეტროსთან */
  near: string
  en: string
  line: 1 | 2
  /** Tbilisi district slug (tbilisi-streets / seo-pages DISTRICTS) */
  district: string
  lat: number
  lng: number
}

export const METRO_STATIONS: MetroStation[] = [
  // ——— მე-1 ხაზი: ახმეტელის თეატრი — ვარკეთილი ———
  { slug: 'akhmetelis-teatri', ka: 'ახმეტელის თეატრი', near: 'ახმეტელის თეატრის მეტროსთან', en: 'Akhmeteli Theatre', line: 1, district: 'gldani', lat: 41.7910558, lng: 44.8149983 },
  { slug: 'sarajishvili', ka: 'სარაჯიშვილი', near: 'სარაჯიშვილის მეტროსთან', en: 'Sarajishvili', line: 1, district: 'gldani', lat: 41.7840581, lng: 44.7999179 },
  { slug: 'guramishvili', ka: 'გურამიშვილი', near: 'გურამიშვილის მეტროსთან', en: 'Guramishvili', line: 1, district: 'gldani', lat: 41.7757645, lng: 44.7955795 },
  { slug: 'grmagele', ka: 'ღრმაღელე', near: 'ღრმაღელის მეტროსთან', en: 'Grmagele', line: 1, district: 'gldani', lat: 41.764974, lng: 44.7899602 },
  { slug: 'didube', ka: 'დიდუბე', near: 'დიდუბის მეტროსთან', en: 'Didube', line: 1, district: 'didube', lat: 41.7494522, lng: 44.779994 },
  { slug: 'gotsiridze', ka: 'გოცირიძე', near: 'გოცირიძის მეტროსთან', en: 'Gotsiridze', line: 1, district: 'didube', lat: 41.7429401, lng: 44.7840452 },
  { slug: 'nadzaladevi', ka: 'ნაძალადევი', near: 'ნაძალადევის მეტროსთან', en: 'Nadzaladevi', line: 1, district: 'nadzaladevi', lat: 41.7334036, lng: 44.7964257 },
  { slug: 'sadguris-moedani', ka: 'სადგურის მოედანი', near: 'სადგურის მოედნის მეტროსთან', en: 'Station Square', line: 1, district: 'nadzaladevi', lat: 41.7225607, lng: 44.7971052 },
  { slug: 'marjanishvili', ka: 'მარჯანიშვილი', near: 'მარჯანიშვილის მეტროსთან', en: 'Marjanishvili', line: 1, district: 'chughureti', lat: 41.7095941, lng: 44.7968749 },
  { slug: 'rustaveli', ka: 'რუსთაველი', near: 'რუსთაველის მეტროსთან', en: 'Rustaveli', line: 1, district: 'mtatsminda', lat: 41.703497, lng: 44.7896467 },
  { slug: 'tavisuplebis-moedani', ka: 'თავისუფლების მოედანი', near: 'თავისუფლების მოედნის მეტროსთან', en: 'Freedom Square', line: 1, district: 'mtatsminda', lat: 41.6945248, lng: 44.800563 },
  { slug: 'avlabari', ka: 'ავლაბარი', near: 'ავლაბარის მეტროსთან', en: 'Avlabari', line: 1, district: 'avlabari', lat: 41.6922591, lng: 44.8158409 },
  { slug: 'aragveli-300', ka: '300 არაგველი', near: '300 არაგველის მეტროსთან', en: '300 Aragveli', line: 1, district: 'isani', lat: 41.6879948, lng: 44.8262332 },
  { slug: 'isani', ka: 'ისანი', near: 'ისნის მეტროსთან', en: 'Isani', line: 1, district: 'isani', lat: 41.6866252, lng: 44.8399633 },
  { slug: 'samgori', ka: 'სამგორი', near: 'სამგორის მეტროსთან', en: 'Samgori', line: 1, district: 'samgori', lat: 41.6855176, lng: 44.8544828 },
  { slug: 'varketili', ka: 'ვარკეთილი', near: 'ვარკეთილის მეტროსთან', en: 'Varketili', line: 1, district: 'varketili', lat: 41.6918966, lng: 44.8708845 },
  // ——— მე-2 ხაზი (საბურთალო): სადგურის მოედანი — სახელმწიფო უნივერსიტეტი ———
  { slug: 'tsereteli', ka: 'წერეთელი', near: 'წერეთლის მეტროსთან', en: 'Tsereteli', line: 2, district: 'nadzaladevi', lat: 41.7264122, lng: 44.7876612 },
  { slug: 'teknikuri-universiteti', ka: 'ტექნიკური უნივერსიტეტი', near: 'ტექნიკური უნივერსიტეტის მეტროსთან', en: 'Technical University', line: 2, district: 'didube', lat: 41.7203488, lng: 44.7766431 },
  { slug: 'sameditsino-universiteti', ka: 'სამედიცინო უნივერსიტეტი', near: 'სამედიცინო უნივერსიტეტის მეტროსთან', en: 'Medical University', line: 2, district: 'saburtalo', lat: 41.7272794, lng: 44.7638395 },
  { slug: 'delisi', ka: 'დელისი', near: 'დელისის მეტროსთან', en: 'Delisi', line: 2, district: 'saburtalo', lat: 41.7254865, lng: 44.7453411 },
  { slug: 'vazha-pshavela', ka: 'ვაჟა-ფშაველა', near: 'ვაჟა-ფშაველას მეტროსთან', en: 'Vazha-Pshavela', line: 2, district: 'saburtalo', lat: 41.7240341, lng: 44.730853 },
  { slug: 'sakhelmtsipo-universiteti', ka: 'სახელმწიფო უნივერსიტეტი', near: 'სახელმწიფო უნივერსიტეტის მეტროსთან', en: 'State University', line: 2, district: 'saburtalo', lat: 41.7228253, lng: 44.7185112 },
]

export const METRO_LINES: Record<1 | 2, string> = {
  1: 'ახმეტელის თეატრი — ვარკეთილი',
  2: 'სადგურის მოედანი — სახელმწიფო უნივერსიტეტი',
}

export const metroByLine = (line: 1 | 2) => METRO_STATIONS.filter((s) => s.line === line)

export function getMetroStation(slug: string): MetroStation | undefined {
  return METRO_STATIONS.find((s) => s.slug === slug)
}

/** Neighbours in riding order — „წინა/შემდეგი სადგური" internal links. */
export function metroNeighbours(slug: string): MetroStation[] {
  const s = getMetroStation(slug)
  if (!s) return []
  const line = metroByLine(s.line)
  const i = line.indexOf(s)
  return [line[i - 1], line[i + 1]].filter((x): x is MetroStation => Boolean(x))
}

/** Walking radius used by the station pages' listing query — ~15 min on foot. */
export const METRO_RADIUS_M = 1200
