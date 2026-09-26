/**
 * SIVRCE — SEO listing title engine.
 * Builds MyHome.ge/SS.ge-style keyword-first titles:
 *   "იყიდება 2-ოთახიანი ბინა ჭავჭავაძეზე ვაკეში"
 *   "2-room apartment for sale in Vake, Tbilisi"
 * Georgian locatives come from the curated seo-pages registry first
 * (ვაკე → ვაკეში), with a suffix heuristic as fallback for free-form input.
 */

// Client-safe leaf on purpose: ListingCard → listing-slug → seo-title reaches
// every surface, and importing seo-pages here dragged the whole LISTINGS
// catalog (~1.1 MB) into the browser bundle. seo-title.check locks it.
import { CITIES as SEO_CITIES, DEALS as SEO_DEALS, DISTRICTS as SEO_DISTRICTS } from '@/lib/directory-seo-lite'
import type { DealType, PropType } from '@/data/listings'
import type { Lang } from '@/lib/i18n/context'
import { toLatin } from '@/lib/ka-latin'

/**
 * First letter uppercase. Georgian is excluded explicitly — V8 maps Mkhedruli
 * ი → Mtavruli Ი on toUpperCase(), which would corrupt every KA title.
 */
export const cap1 = (s: string): string =>
  s.replace(/^(?!\p{sc=Georgian})\p{Ll}/u, (c) => c.toUpperCase())

/** Fill an i18n template's `{var}` slots — server-safe mirror of context.translate's var pass. */
export const fillTpl = (tpl: string, vars: Record<string, string | number>): string =>
  tpl.replace(/\{(\w+)\}/g, (m, n) => (vars[n] !== undefined ? String(vars[n]) : m))

/* ————— Georgian locatives ————— */

/** Obstruents can't cluster with ზ → take -ეზე (ჭავჭავაძ-ეზე, მეფ-ეზე); sonorants/vowels take -ზე. */
const GEO_EZE = new Set(['ძ', 'ჯ', 'ჭ', 'ც', 'წ', 'ყ', 'ფ', 'ქ', 'თ', 'კ', 'გ', 'ბ', 'დ', 'ზ', 'შ', 'ჟ', 'ს', 'ხ'])

/** Inflect one Georgian word: strip genitive -ის, vowel-stem genitive -ს, or nominative -ი. */
const geoStem = (w: string): string =>
  w.endsWith('ის') ? w.slice(0, -2)
    : /[აეიოუ]ს$/.test(w) ? w.slice(0, -1)
      : w.endsWith('ი') ? w.slice(0, -1)
        : w

/**
 * "in X" locative: ვაკე → ვაკეში, გლდანი → გლდანში.
 * Curated registry wins (საბურთალო → საბურთალოზე, not -ში).
 * ponytail: heuristic inflects only the last word of free-form names —
 * multi-word places (დიდი დიღომი) must be added to seo-pages DISTRICTS.
 */
export function locIn(place: string): string {
  const name = place.trim()
  if (!name) return ''
  const curated =
    SEO_DISTRICTS.find((d) => d.ka === name)?.loc ?? SEO_CITIES.find((c) => c.ka === name)?.loc
  if (curated) return curated
  const words = name.split(/\s+/)
  const last = words[words.length - 1]
  words[words.length - 1] = (last.endsWith('ი') ? last.slice(0, -1) : last) + 'ში'
  return words.join(' ')
}

const STREET_WORDS = /(?:^|\s)(?:გამზირი|გამზ\.?|ქუჩა|ქ\.?|ბულვარი|შესახვევი|შეს\.?|ჩიხი|მოედანი|აღმართი|ხეივანი|გზატკეცილი)\s*$/i

/** Street-type head word keeps the name genitive and takes the locative itself
 *  (ss.ge/myhome style: ბელიაშვილის ქუჩაზე, not ბელიაშვილზე) — and the word
 *  ქუჩა/გამზირი stays in the title as its own search keyword. */
const STREET_LOC: Record<string, string> = {
  'ქუჩა': 'ქუჩაზე', 'გამზირი': 'გამზირზე', 'მოედანი': 'მოედანზე', 'აღმართი': 'აღმართზე',
  'ბულვარი': 'ბულვარზე', 'გზატკეცილი': 'გზატკეცილზე', 'სანაპირო': 'სანაპიროზე', 'გზა': 'გზაზე',
  'შესახვევი': 'შესახვევში', 'ჩიხი': 'ჩიხში', 'ხეივანი': 'ხეივანში',
}

/**
 * "on X" for a street phrase or raw address head: "ბელიაშვილის ქუჩა N24" →
 * "ბელიაშვილის ქუჩაზე", "ჭავჭავაძის 47" → "ჭავჭავაძეზე", "ნიჩბისი" → "ნიჩბისში".
 * ponytail: last-word inflection only — multi-word irregulars belong in the
 * curated DISTRICTS registry (locIn hits it for bare suburb names).
 */
export function streetLoc(street: string): string {
  let name = street.trim().replace(/\s+/g, ' ')
  if (!name) return ''
  // Curated district/city names win even in the street box (ახალი ბულვარი →
  // ახალ ბულვარზე, not *ახალი ბულვარზე).
  const curated =
    SEO_DISTRICTS.find((d) => d.ka === name)?.loc ?? SEO_CITIES.find((c) => c.ka === name)?.loc
  if (curated) return curated
  name = name
    .replace(/(^|\s)(ქ|გამზ|შეს)\.(?=\s|$)/g, (m, sp, ab) => `${sp}${{ 'ქ': 'ქუჩა', 'გამზ': 'გამზირი', 'შეს': 'შესახვევი' }[ab as 'ქ']}`)
    .replace(/(?:,\s*)?(?:[N№#]\s*|კორპ(?:უსი)?\.?\s*)?\d+\s*(?:კორპ(?:უსი)?\.?|ბინა\s*\d+)?\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!name) return ''
  const words = name.split(' ')
  const last = words[words.length - 1]
  const head = STREET_LOC[last]
  if (head) {
    words[words.length - 1] = head
    return words.join(' ')
  }
  if (STREET_WORDS.test(name) || /[აეიოუ]ს$/.test(last)) return locOn(name)
  return locIn(name)
}

/**
 * ka title chain, reader order: "თბილისში დიღმის მასივში ბელიაშვილის ქუჩაზე".
 * City drops when the district phrase already carries it (ძველ თბილისში);
 * street drops on exact duplication or when the chain outruns the SERP budget.
 */
function kaWhere(city?: string, district?: string, street?: string): string {
  const c = city?.trim() ?? ''
  const d = district?.trim() ?? ''
  const dPart = d && d !== c ? locIn(d) : ''
  const stem = c.replace(/ი$/, '')
  const cPart = c && !dPart.includes(stem) ? locIn(c) : ''
  const parts = [cPart, dPart].filter(Boolean)
  const stRaw = street?.trim() ?? ''
  const stPart = streetLoc(stRaw)
  // Street drops when its head word is already in the chain (ბათუმის ბულვარი
  // next to district ახალი ბულვარი) or the whole phrase duplicates a part.
  const stStem = stRaw.replace(/\d.*$/, '').trim().split(/\s+/).pop()?.replace(/ი$/, '') ?? ''
  if (stPart && stStem && !parts.some((p) => p.includes(stStem))) parts.push(stPart)
  if (stPart && parts[parts.length - 1] === stPart && parts.join(' ').length > 80) parts.pop()
  return parts.join(' ')
}

/**
 * "on X street" locative: ჭავჭავაძის (გამზ.) → ჭავჭავაძეზე, პეკინის → პეკინზე.
 * Suffix euphony: stems ending in ძ/ჯ/ჭ/ც/წ take -ეზე, others -ზე.
 * ponytail: inflects the last name token (აკაკი წერეთლის → წერეთელზე);
 * irregular names need the curated path — add a STREETS registry if mis-hits appear.
 */
export function locOn(street: string): string {
  let name = street.trim()
  while (STREET_WORDS.test(name)) name = name.replace(STREET_WORDS, '').trim()
  if (!name) return ''
  const words = name.split(/\s+/)
  // -ელი syncope: genitive hides the stem vowel (წერეთლის → წერეთელ-ზე)
  const stem = geoStem(words[words.length - 1]).replace(/([ბგდზთკლმნპჟრსტფქღყშჩცძწჭხჯ])ლ$/, '$1ელ')
  words[words.length - 1] = stem + (GEO_EZE.has(stem.charAt(stem.length - 1)) ? 'ეზე' : 'ზე')
  return words.join(' ')
}

/* ————— en/ru place names ————— */

// Registry miss → national romanization: a non-ka title never carries Mkhedruli.
const enName = (n: string): string =>
  SEO_DISTRICTS.find((d) => d.ka === n)?.en ?? SEO_CITIES.find((c) => c.ka === n)?.en ?? toLatin(n)
const ruName = (n: string): string =>
  SEO_DISTRICTS.find((d) => d.ka === n)?.ru ?? SEO_CITIES.find((c) => c.ka === n)?.ru ?? toLatin(n)

/* ————— title parts ————— */

/**
 * Deal word + locative "where" for the `add.autoTitle.*` i18n templates.
 * en/ru deal phrases come from the curated seo-pages registry
 * ("for sale" / "на продажу"), other locales use the deal chip label.
 */
export function seoTitleParts(o: {
  lang: Lang
  deal: DealType | null
  dealLabel: string
  propType?: PropType
  street?: string
  district?: string
  city?: string
}): { deal: string; where: string } {
  const slug = o.deal === 'rent' && o.propType === 'land' ? 'lease' : o.deal
  const deal = !o.deal
    ? ''
    : o.lang === 'en'
      ? (SEO_DEALS[slug!]?.en ?? o.dealLabel)
      : o.lang === 'ru'
        ? (SEO_DEALS[slug!]?.ru ?? o.dealLabel)
        : o.lang === 'de'
          ? (SEO_DEALS[slug!]?.de ?? o.dealLabel)
          : o.dealLabel

  const place = o.district || o.city || ''
  let where: string
  if (o.lang === 'ka') {
    where = kaWhere(o.city, o.district, o.street) || locIn(place)
  } else {
    const name = o.lang === 'ru' ? ruName : enName
    const d = o.district ? name(o.district) : ''
    const c = o.city ? name(o.city) : ''
    where = d && c && d !== c ? `${d}, ${c}` : d || c
  }
  return { deal, where: where || '—' }
}
