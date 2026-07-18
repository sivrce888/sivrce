/**
 * Canonical Georgian district / უბანი labels.
 * Maps EN (korter), combined Soviet raions, and junk aliases → ka catalog names.
 */
import { geoDistrictsOf, geoRaionsOf } from '@/data/georgia-locations'

/** Exact renames (storage + write path). Combined Soviet labels → nearest official raion pair expand on search. */
const ALIAS: Record<string, string> = {
  // EN → KA (Tbilisi raions + common ubani)
  saburtalo: 'საბურთალო',
  vake: 'ვაკე',
  mtatsminda: 'მთაწმინდა',
  isani: 'ისანი',
  samgori: 'სამგორი',
  gldani: 'გლდანი',
  nadzaladevi: 'ნაძალადევი',
  didube: 'დიდუბე',
  chughureti: 'ჩუღურეთი',
  chugureti: 'ჩუღურეთი',
  krtsanisi: 'კრწანისი',
  ortachala: 'ორთაჭალა',
  avlabari: 'ავლაბარი',
  vera: 'ვერა',
  varketili: 'ვარკეთილი',
  digomi: 'დიღომი',
  dighomi: 'დიღომი',
  'didi dighomi': 'დიდი დიღომი',
  'didi digomi': 'დიდი დიღომი',
  baghebi: 'ბაგები',
  bagebi: 'ბაგები',
  temka: 'თემქა',
  mukhiani: 'მუხიანი',
  vazisubani: 'ვაზისუბანი',
  vashlijvari: 'ვაშლიჯვარი',
  sololaki: 'სოლოლაკი',
  'old tbilisi': 'ძველი თბილისი',
  'old city': 'ძველი თბილისი',
  downtown: 'ძველი თბილისი',
  // Batumi
  makhinjauri: 'მახინჯაური',
  'batumi boulevard': 'ახალი ბულვარი',
  boulevard: 'ახალი ბულვარი',
  'ბათუმის ბულვარი': 'ახალი ბულვარი',
  agmashenebeli: 'აღმაშენებლის უბანი',
  bagrationi: 'ბაგრატიონის უბანი',
  rustaveli: 'რუსთაველის უბანი',
  javakhishvili: 'ჯავახიშვილის უბანი',
  khimshiashvili: 'ხიმშიაშვილის უბანი',
  kakhaberi: 'კახაბრის უბანი',
  tamar: 'თამარის დასახლება',
  'boni-gorodok': 'ბონი-გოროდოკის უბანი',
  'airport (district)': 'აეროპორტის უბანი',
  airport: 'აეროპორტის უბანი',
  'აეროპორტის რაიონი': 'აეროპორტის უბანი',
  ბაგრატიონი: 'ბაგრატიონის უბანი',
  თამარი: 'თამარის დასახლება',
  კახაბერი: 'კახაბრის უბანი',
  'ძველი ქალაქი': 'ძველი ბათუმი',
  // Nominatim genitive "X რაიონი" leftovers
  ვაკის: 'ვაკე',
  საბურთალოს: 'საბურთალო',
  მთაწმინდის: 'მთაწმინდა',
  ისნის: 'ისანი',
  სამგორის: 'სამგორი',
  გლდანის: 'გლდანი',
  ნაძალადევის: 'ნაძალადევი',
  დიდუბის: 'დიდუბე',
  ჩუღურეთის: 'ჩუღურეთი',
  კრწანისის: 'კრწანისი',
  // Truncated / junk aliases
  'სან. ზონა': 'სანზონა',
  'ლისის ტბა': 'ლისი',
  'ლისის მიმდებარედ': 'ლისი',
  'აეროპორტის დას': 'აეროპორტის დასახლება',
  'დამპალოს დას': 'დამპალოს დასახლება',
  'აეროპორტის გზატ': 'აეროპორტის დასახლება',
  'აფრიკის დას': 'აფრიკა',
  'ვაჟა ფშაველას კვარტლები': 'ვაჟა-ფშაველას კვარტლები',
  'ძველი ბათუმის უბანი': 'ძველი ბათუმი',
  // Combined Soviet → pick primary raion for storage (search expands both)
  'ვაკე-საბურთალო': 'საბურთალო',
  'დიდუბე-ჩუღურეთი': 'დიდუბე',
  'გლდანი-ნაძალადევი': 'გლდანი',
  'ისანი-სამგორი': 'ისანი',
}

/** Search expansion for obsolete combined labels (and canonical itself). */
const EXPAND: Record<string, string[]> = {
  'ვაკე-საბურთალო': ['ვაკე', 'საბურთალო'],
  'დიდუბე-ჩუღურეთი': ['დიდუბე', 'ჩუღურეთი'],
  'გლდანი-ნაძალადევი': ['გლდანი', 'ნაძალადევი'],
  'ისანი-სამგორი': ['ისანი', 'სამგორი'],
}

const CITY_SUFFIX = /,\s*(თბილისი|ბათუმი|ქუთაისი|რუსთავი|ტbilisi|batumi)\s*$/iu

function normKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Pull first known catalog district from a messy "district, street, city" blob. */
function extractKnown(raw: string, city?: string): string | undefined {
  const catalog = geoDistrictsOf(city)
  // Longer names first so "დიდი დიღომი" wins over "დიღომი"
  const needles: { needle: string; out: string }[] = [
    ...[...catalog].map((d) => ({ needle: d, out: d })),
    ...Object.entries(ALIAS).map(([needle, out]) => ({ needle, out })),
  ].sort((a, b) => b.needle.length - a.needle.length)

  const lower = raw.toLowerCase()
  for (const { needle, out } of needles) {
    if (!needle) continue
    if (/[ა-ჰ]/.test(needle)) {
      if (raw.includes(needle)) return out
    } else if (new RegExp(`(?:^|[^a-z])${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|[^a-z])`, 'i').test(lower)) {
      return out
    }
  }
  return undefined
}

/**
 * Canonical ka district for storage / filters.
 * Returns trimmed original if unknown (don't invent).
 */
export function canonicalizeDistrict(raw: string | null | undefined, city?: string): string {
  if (!raw) return ''
  let s = raw.trim()
  if (!s) return ''
  s = s.replace(CITY_SUFFIX, '').trim()

  const key = normKey(s)
  if (ALIAS[key]) return ALIAS[key]

  // Exact catalog hit
  const catalog = new Set(geoDistrictsOf(city))
  if (catalog.has(s)) return s

  // Messy blob: "საბურთალო, ქუჩა…" / "Vake, Tbilisi"
  const extracted = extractKnown(s, city)
  if (extracted) return extracted

  // Strip " რაიონი"
  const stripped = s.replace(/\s*რაიონი\s*$/u, '').trim()
  if (stripped !== s) return canonicalizeDistrict(stripped, city)

  // Unknown: never store street/address blobs as district
  if (/,/.test(s) || /\d/.test(s) || /ქ\.|გამზ|შესახვევი|\bSt\b|\bAve\b|\bstreet\b/i.test(s)) {
    return ''
  }
  return s.slice(0, 120)
}

/** Values to match in DB/search for a user-picked district (handles legacy combined). */
export function districtSearchValues(raw: string | null | undefined, city?: string): string[] {
  if (!raw) return []
  const trimmed = raw.trim()
  if (EXPAND[trimmed]) return EXPAND[trimmed]
  const canon = canonicalizeDistrict(trimmed, city)
  if (EXPAND[canon]) return EXPAND[canon]
  // If user picked a raion, include its ubani so inventory tagged by leaf still matches.
  if (city) {
    const ubanis = geoRaionsOf(city)[canon]
    if (ubanis?.length) return [canon, ...ubanis]
  }
  return canon ? [canon] : []
}
