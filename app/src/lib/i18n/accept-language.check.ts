/**
 * Runnable check for edge locale auto-detection.
 * Run: npx tsx src/lib/i18n/accept-language.check.ts
 */
import {
  bestLangFromHeader,
  suggestLangForCountry,
  autoLocalePath,
  LANG_COOKIE,
  LANG_LOCALE_TAG,
} from './accept-language'
import { LANGS } from './core'

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) {
    console.error(`accept-language: ${msg}`)
    process.exit(1)
  }
}

// Header parsing
assert(bestLangFromHeader(null) === null, 'null → null')
assert(bestLangFromHeader('') === null, 'empty → null')
assert(bestLangFromHeader('de-DE,de;q=0.9,en;q=0.8') === 'de', 'region tag + q order')
assert(bestLangFromHeader('en-US,en;q=0.9,ka;q=0.7') === 'en', 'first wins on q')
assert(bestLangFromHeader('fr-FR,fr;q=0.9,en;q=0.5') === 'en', 'unsupported first falls through')
assert(bestLangFromHeader('ka-GE,ka;q=0.9') === 'ka', 'ka region tag')
assert(bestLangFromHeader('ru-RU,uk;q=0.8') === 'ru', 'ru region tag')
assert(bestLangFromHeader('he,iw;q=0.5') === 'he', 'legacy iw dedupes to he')
assert(bestLangFromHeader('*') === null, 'wildcard alone → null')
assert(bestLangFromHeader('de;q=0') === null, 'q=0 refused')
assert(bestLangFromHeader('garbage!!!') === null, 'garbage → null')
assert(bestLangFromHeader('TR-tr,tr;q=0.9') === 'tr', 'case-insensitive')
assert(bestLangFromHeader('hy-AM,ru;q=0.8') === 'hy', 'hy region tag')
assert(bestLangFromHeader('az-Latn-AZ') === 'az', 'multi-subtag strips to primary')

// Country → suggestion (hint only, never forced)
assert(suggestLangForCountry('DE') === 'de', 'DE → de')
assert(suggestLangForCountry('de') === 'de', 'lowercase cc')
assert(suggestLangForCountry('AE') === 'ar', 'AE → ar')
assert(suggestLangForCountry('US') === null, 'US → null (browser lang wins)')
assert(suggestLangForCountry('CH') === null, 'CH → null (ambiguous)')
assert(suggestLangForCountry('FR') === null, 'FR → null (unlaunched)')
assert(suggestLangForCountry(null) === null, 'null → null')
assert(suggestLangForCountry('GE') === 'ka', 'GE → ka')

// Locale tags cover every Lang (Intl.DisplayNames must never throw)
for (const l of LANGS) {
  const tag = LANG_LOCALE_TAG[l]
  assert(typeof tag === 'string' && tag.length > 0, `missing locale tag for ${l}`)
  const name = new Intl.DisplayNames([tag], { type: 'language' }).of(l)
  assert(name && name.length > 0, `DisplayNames failed for ${l}`)
}
assert(LANG_COOKIE === 'sv-lang', 'cookie name locked')

// Auto-locale decision table (what the edge proxy redirects)
const A = autoLocalePath
assert(A({ pathname: '/', market: 'ge', acceptLanguage: 'de-DE,de;q=0.9' }) === '/de', 'first visit sniffs front door')
assert(A({ pathname: '/', market: 'ge', acceptLanguage: 'ka-GE' }) === null, 'ka browser stays')
assert(A({ pathname: '/', market: 'ge', acceptLanguage: 'fr-FR' }) === null, 'unsupported stays')
assert(A({ pathname: '/', market: 'ge' }) === null, 'no header stays')
assert(A({ pathname: '/search', market: 'ge', cookie: 'de' }) === '/de/search', 'cookie owns deep links')
assert(A({ pathname: '/', market: 'ge', cookie: 'de' }) === '/de', 'cookie owns root')
assert(A({ pathname: '/search', market: 'ge', cookie: 'ka', acceptLanguage: 'de' }) === null, 'explicit ka never bounced')
assert(A({ pathname: '/search', market: 'ge', acceptLanguage: 'de' }) === null, 'sniff is front-door only')
assert(A({ pathname: '/en/search', market: 'ge', cookie: 'de' }) === null, 'prefixed passes')
assert(A({ pathname: '/ka/search', market: 'ge', cookie: 'de' }) === null, 'internal ka target passes')
assert(A({ pathname: '/', market: 'ge', acceptLanguage: 'de', crawler: true }) === null, 'crawlers see canonical')
assert(A({ pathname: '/', market: 'global', acceptLanguage: 'de' }) === null, 'country markets untouched')
assert(A({ pathname: '/', market: 'de', acceptLanguage: 'de' }) === null, 'country markets untouched (de)')
assert(A({ pathname: '/', market: 'ge', cookie: 'de', internal: true }) === null, 'RSC/prefetch untouched')
assert(A({ pathname: '/', market: 'ge', cookie: 'xx' }) === null, 'unknown cookie = decided, no sniff')

console.log('accept-language: ok')
