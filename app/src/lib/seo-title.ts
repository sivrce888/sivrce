/**
 * SIVRCE — SEO listing title engine.
 * Builds MyHome.ge/SS.ge-style keyword-first titles:
 *   "იყიდება 2-ოთახიანი ბინა ჭავჭავაძეზე ვაკეში"
 *   "2-bedroom apartment for sale in Vake, Tbilisi"
 * Georgian locatives come from the curated seo-pages registry first
 * (ვაკე → ვაკეში), with a suffix heuristic as fallback for free-form input.
 */

import { CITIES as SEO_CITIES, DEALS as SEO_DEALS, DISTRICTS as SEO_DISTRICTS } from '@/lib/seo-pages'
import type { DealType } from '@/data/listings'
import type { Lang } from '@/lib/i18n/context'

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

const enName = (n: string): string =>
  SEO_DISTRICTS.find((d) => d.ka === n)?.en ?? SEO_CITIES.find((c) => c.ka === n)?.en ?? n
const ruName = (n: string): string =>
  SEO_DISTRICTS.find((d) => d.ka === n)?.ru ?? SEO_CITIES.find((c) => c.ka === n)?.ru ?? n

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
  street?: string
  district?: string
  city?: string
}): { deal: string; where: string } {
  const deal = !o.deal
    ? ''
    : o.lang === 'en'
      ? SEO_DEALS[o.deal].en
      : o.lang === 'ru'
        ? SEO_DEALS[o.deal].ru
        : o.dealLabel

  const place = o.district || o.city || ''
  let where: string
  if (o.lang === 'ka') {
    const loc = locIn(place)
    where = o.street?.trim() ? `${locOn(o.street)} ${loc}`.trim() : loc
  } else if (o.lang === 'en' || o.lang === 'ru') {
    const name = o.lang === 'en' ? enName : ruName
    const d = o.district ? name(o.district) : ''
    const c = o.city ? name(o.city) : ''
    where = d && c && d !== c ? `${d}, ${c}` : d || c
  } else {
    where = place
  }
  return { deal, where: where || '—' }
}
