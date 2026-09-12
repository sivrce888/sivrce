/**
 * Runnable check: npx tsx src/lib/host-redirect.check.ts
 */
import assert from 'node:assert/strict'
import { decideHost, mapCctldPath } from './host-redirect'
import { COM_ORIGIN, GE_ORIGIN } from './site-host'
import { sanitizePath, hostKind, isOwnHost, siteHostFor, isDeHost, safeRedirectUrl } from './site-host'
import { isCountryPath, COUNTRY_IDS, countryBasePath, intentHref } from './markets'
import { PREFIXED_LANGS } from './i18n/core'

assert.equal(hostKind('sivrce.ge').toString() && siteHostFor('sivrce.ge').market, 'ge')
assert.equal(siteHostFor('sivrce.ge').defaultLang, 'ka')
assert.equal(siteHostFor('sivrce.de').market, 'de')
assert.equal(siteHostFor('www.sivrce.de').defaultCitySlug, 'berlin')
assert.equal(siteHostFor('sivrce.de').homePath, '/de')
assert.equal(isDeHost('sivrce.de'), true)
assert.equal(isDeHost('sivrce.ge'), false)
assert.equal(isOwnHost('admin.sivrce.ge'), true)
assert.equal(isOwnHost('www.sivrce.de'), true)
assert.equal(isOwnHost('sivrce.ae'), true)
assert.equal(isOwnHost('ss.ge'), false)
assert.equal(hostKind('something.vercel.app'), 'preview')
assert.equal(hostKind('localhost'), 'dev')
assert.equal(hostKind('evil.com', 'production'), 'preview')

assert.equal(mapCctldPath('de', '/'), '/de')
assert.equal(mapCctldPath('de', '/en/berlin'), '/de/berlin')
assert.equal(mapCctldPath('de', '/berlin/buy'), '/de/berlin/buy')
assert.equal(mapCctldPath('ae', '/en'), '/ae')
assert.equal(mapCctldPath('ae', '/dubai'), '/ae/dubai')

const deApex = decideHost({ host: 'sivrce.de', pathname: '/', vercelEnv: 'production' })
assert.deepEqual(deApex, { type: 'redirect', origin: COM_ORIGIN, pathname: '/de' })

const deBerlin = decideHost({ host: 'sivrce.de', pathname: '/en/berlin', vercelEnv: 'production' })
assert.deepEqual(deBerlin, { type: 'redirect', origin: COM_ORIGIN, pathname: '/de/berlin' })

const aeApex = decideHost({ host: 'sivrce.ae', pathname: '/', vercelEnv: 'production' })
assert.deepEqual(aeApex, { type: 'redirect', origin: COM_ORIGIN, pathname: '/ae' })

const wwwCom = decideHost({ host: 'www.sivrce.com', pathname: '/de', vercelEnv: 'production' })
assert.equal(wwwCom.type, 'redirect')
if (wwwCom.type === 'redirect') assert.equal(wwwCom.origin, COM_ORIGIN)

const wwwGe = decideHost({ host: 'www.sivrce.ge', pathname: '/sale', vercelEnv: 'production' })
assert.deepEqual(wwwGe, { type: 'redirect', origin: GE_ORIGIN, pathname: '/sale' })

const geBerlin = decideHost({ host: 'sivrce.ge', pathname: '/berlin', vercelEnv: 'production' })
assert.deepEqual(geBerlin, { type: 'redirect', origin: COM_ORIGIN, pathname: '/de/berlin' })

const comSale = decideHost({ host: 'sivrce.com', pathname: '/sale', vercelEnv: 'production' })
assert.deepEqual(comSale, { type: 'redirect', origin: 'same', pathname: '/ge/sale' })

const comHome = decideHost({ host: 'sivrce.com', pathname: '/', vercelEnv: 'production' })
assert.deepEqual(comHome, { type: 'rewrite', pathname: '/en', market: 'global' })
// decideHost keeps / as the hub rewrite; proxy 302s humans by IP/cookie.

const comMap = decideHost({ host: 'sivrce.com', pathname: '/map', vercelEnv: 'production' })
assert.deepEqual(comMap, { type: 'rewrite', pathname: '/en/map', market: 'global' })

const comEnMap = decideHost({ host: 'sivrce.com', pathname: '/en/map', vercelEnv: 'production' })
assert.deepEqual(comEnMap, { type: 'rewrite', pathname: '/en/map', market: 'global' })

const comDe = decideHost({ host: 'sivrce.com', pathname: '/de/berlin', vercelEnv: 'production' })
assert.deepEqual(comDe, { type: 'rewrite', pathname: '/en/de/berlin', market: 'de' })

const previewDe = decideHost({ host: 'sivrce-git-foo.vercel.app', pathname: '/en/de' })
assert.deepEqual(previewDe, { type: 'pass', market: 'de' })

const localDe = decideHost({ host: 'localhost', pathname: '/en/de/berlin' })
assert.deepEqual(localDe, { type: 'pass', market: 'de' })

const localGerman = decideHost({ host: 'localhost', pathname: '/de' })
assert.deepEqual(localGerman, { type: 'pass', market: 'ge' })

const previewNoBounce = decideHost({ host: 'sivrce-git-foo.vercel.app', pathname: '/de', vercelEnv: 'preview' })
assert.deepEqual(previewNoBounce, { type: 'pass', market: 'ge' })

const caseNorm = decideHost({ host: 'localhost', pathname: '/DE/Berlin' })
assert.deepEqual(caseNorm, { type: 'redirect', origin: 'same', pathname: '/de/berlin' })

const slash = sanitizePath('/de/berlin/')
assert.equal(slash, '/de/berlin')
assert.equal(sanitizePath('//evil.com'), null)
assert.equal(sanitizePath('/\\evil'), null)
assert.equal(safeRedirectUrl('https://evil.com', '/de'), null)
assert.ok(safeRedirectUrl(COM_ORIGIN, '/de'))
assert.ok(isCountryPath('/de/berlin'))
assert.ok(!isCountryPath('/en/berlin'))

const geDeLang = decideHost({ host: 'sivrce.ge', pathname: '/de', vercelEnv: 'production' })
assert.deepEqual(geDeLang, { type: 'pass', market: 'ge' })
const geDeSale = decideHost({ host: 'sivrce.ge', pathname: '/de/sale', vercelEnv: 'production' })
assert.deepEqual(geDeSale, { type: 'pass', market: 'ge' })
assert.ok(PREFIXED_LANGS.includes('de'), 'German locale stays on sivrce.ge/de')
assert.ok((COUNTRY_IDS as readonly string[]).includes('de'))

const loopDe = decideHost({ host: 'sivrce.com', pathname: '/de', vercelEnv: 'production' })
assert.equal(loopDe.type, 'rewrite')

const comEnDe = decideHost({ host: 'sivrce.com', pathname: '/en/de', vercelEnv: 'production' })
assert.deepEqual(comEnDe, { type: 'redirect', origin: 'same', pathname: '/de' })

const localAe = decideHost({ host: 'localhost', pathname: '/ae/dubai' })
assert.deepEqual(localAe, { type: 'rewrite', pathname: '/en/ae/dubai', market: 'ae' })

const wwwAe = decideHost({ host: 'www.sivrce.ae', pathname: '/', vercelEnv: 'production' })
assert.deepEqual(wwwAe, { type: 'redirect', origin: COM_ORIGIN, pathname: '/ae' })

// Unlaunched ISO codes are not a thing anymore — FR is a live .com path.
const comFr = decideHost({ host: 'sivrce.com', pathname: '/fr/paris', vercelEnv: 'production' })
assert.deepEqual(comFr, { type: 'rewrite', pathname: '/en/fr/paris', market: 'fr' })

const comAbout = decideHost({ host: 'sivrce.com', pathname: '/about', vercelEnv: 'production' })
assert.deepEqual(comAbout, { type: 'rewrite', pathname: '/en/about', market: 'global' })

const comEnAbout = decideHost({ host: 'sivrce.com', pathname: '/en/about', vercelEnv: 'production' })
assert.deepEqual(comEnAbout, { type: 'rewrite', pathname: '/en/about', market: 'global' })

const comUae = decideHost({ host: 'sivrce.com', pathname: '/uae/dubai', vercelEnv: 'production' })
assert.deepEqual(comUae, { type: 'redirect', origin: 'same', pathname: '/ae/dubai' })

const comUk = decideHost({ host: 'sivrce.com', pathname: '/uk', vercelEnv: 'production' })
assert.deepEqual(comUk, { type: 'redirect', origin: 'same', pathname: '/gb' })

const localUae = decideHost({ host: 'localhost', pathname: '/uae' })
assert.deepEqual(localUae, { type: 'redirect', origin: 'same', pathname: '/ae' })

const geUkLang = decideHost({ host: 'sivrce.ge', pathname: '/uk', vercelEnv: 'production' })
assert.deepEqual(geUkLang, { type: 'pass', market: 'ge' })
const geTrLang = decideHost({ host: 'sivrce.ge', pathname: '/tr', vercelEnv: 'production' })
assert.deepEqual(geTrLang, { type: 'pass', market: 'ge' })

// Locale == country code: German Germany on .com stays /de/de/… (no /en force).
const comDeDe = decideHost({ host: 'sivrce.com', pathname: '/de/de/berlin', vercelEnv: 'production' })
assert.deepEqual(comDeDe, { type: 'pass', market: 'de' })
const comDeDeHub = decideHost({ host: 'sivrce.com', pathname: '/de/de', vercelEnv: 'production' })
assert.deepEqual(comDeDeHub, { type: 'pass', market: 'de' })
// Same form on the GE host keeps serving (unchanged behavior, market label only).
const geDeDe = decideHost({ host: 'sivrce.ge', pathname: '/de/de/berlin', vercelEnv: 'production' })
assert.equal(geDeDe.type, 'pass')
// English market URL untouched by the rule.
const comDeBerlin = decideHost({ host: 'sivrce.com', pathname: '/de/berlin', vercelEnv: 'production' })
assert.deepEqual(comDeBerlin, { type: 'rewrite', pathname: '/en/de/berlin', market: 'de' })

assert.ok(isCountryPath('/ae/dubai'))
assert.ok(isCountryPath('/fr/paris'))
assert.ok(isCountryPath('/gb'))
assert.ok(!isCountryPath('/en/madrid'))
assert.ok(safeRedirectUrl(COM_ORIGIN, '/de', '?utm=1')?.search.includes('utm=1'))

assert.equal(countryBasePath('de', '/en/de'), '/en/de')
assert.equal(countryBasePath('de', '/en/de/berlin'), '/en/de')
assert.equal(countryBasePath('de', '/de/berlin'), '/de')
assert.equal(countryBasePath('de', '/de/de/berlin'), '/de/de')
assert.equal(intentHref('de', 'munich', 'buy', 'en', '/en/de'), '/en/de/munich')
assert.equal(intentHref('de', 'berlin', 'buy', 'en', '/en/de'), '/en/de/berlin/buy')
assert.equal(intentHref('de', 'munich', 'buy', 'en'), '/de/munich')
assert.equal(intentHref('de', 'berlin', 'buy', 'en'), '/de/berlin/buy')

// /ge mirror on sivrce.com: full Georgian catalog, market ge (canonicals stay sivrce.ge).
const comGeRoot = decideHost({ host: 'sivrce.com', pathname: '/ge', vercelEnv: 'production' })
assert.deepEqual(comGeRoot, { type: 'rewrite', pathname: '/ka', market: 'ge' })
const comGeSale = decideHost({ host: 'sivrce.com', pathname: '/ge/sale', vercelEnv: 'production' })
assert.deepEqual(comGeSale, { type: 'rewrite', pathname: '/ka/sale', market: 'ge' })
const comGeEnSale = decideHost({ host: 'sivrce.com', pathname: '/ge/en/sale', vercelEnv: 'production' })
assert.deepEqual(comGeEnSale, { type: 'rewrite', pathname: '/en/sale', market: 'ge' })
const comGeDeSale = decideHost({ host: 'sivrce.com', pathname: '/ge/de/sale', vercelEnv: 'production' })
assert.deepEqual(comGeDeSale, { type: 'rewrite', pathname: '/de/sale', market: 'ge' })
const comGeMap = decideHost({ host: 'sivrce.com', pathname: '/ge/map', vercelEnv: 'production' })
assert.deepEqual(comGeMap, { type: 'rewrite', pathname: '/ka/map', market: 'ge' })
const comGeListing = decideHost({ host: 'sivrce.com', pathname: '/ge/listing/123/x', vercelEnv: 'production' })
assert.deepEqual(comGeListing, { type: 'rewrite', pathname: '/ka/listing/123/x', market: 'ge' })
// /ge/ka/… folds to the unprefixed mirror form.
const comGeKaSale = decideHost({ host: 'sivrce.com', pathname: '/ge/ka/sale', vercelEnv: 'production' })
assert.deepEqual(comGeKaSale, { type: 'redirect', origin: 'same', pathname: '/ge/sale' })
// Internal-form leak folds to the public mirror form.
const comEnGeSale = decideHost({ host: 'sivrce.com', pathname: '/en/ge/sale', vercelEnv: 'production' })
assert.deepEqual(comEnGeSale, { type: 'redirect', origin: 'same', pathname: '/ge/en/sale' })
// Locale-prefixed Georgian paths stay on .com under /ge.
const comEnSale = decideHost({ host: 'sivrce.com', pathname: '/en/sale', vercelEnv: 'production' })
assert.deepEqual(comEnSale, { type: 'redirect', origin: 'same', pathname: '/ge/en/sale' })
const comKaSale = decideHost({ host: 'sivrce.com', pathname: '/ka/sale', vercelEnv: 'production' })
assert.deepEqual(comKaSale, { type: 'redirect', origin: 'same', pathname: '/ge/sale' })
// Listing detail serves directly on .com (worldwide inventory, market global —
// canonicals inside the page point each listing at its own origin).
const comRuListing = decideHost({ host: 'sivrce.com', pathname: '/ru/listing/5', vercelEnv: 'production' })
assert.deepEqual(comRuListing, { type: 'rewrite', pathname: '/ru/listing/5', market: 'global' })
const comBareListing = decideHost({ host: 'sivrce.com', pathname: '/listing/5', vercelEnv: 'production' })
assert.deepEqual(comBareListing, { type: 'rewrite', pathname: '/en/listing/5', market: 'global' })
// sivrce.ge folds /ge/… to the unprefixed canonical URL.
const geMirrorSale = decideHost({ host: 'sivrce.ge', pathname: '/ge/sale', vercelEnv: 'production' })
assert.deepEqual(geMirrorSale, { type: 'redirect', origin: 'same', pathname: '/sale' })
const geMirrorEn = decideHost({ host: 'sivrce.ge', pathname: '/ge/en/sale', vercelEnv: 'production' })
assert.deepEqual(geMirrorEn, { type: 'redirect', origin: 'same', pathname: '/en/sale' })
const geMirrorRoot = decideHost({ host: 'sivrce.ge', pathname: '/ge', vercelEnv: 'production' })
assert.deepEqual(geMirrorRoot, { type: 'redirect', origin: 'same', pathname: '/' })
// Dev/preview mirror matches prod.
const localGeSale = decideHost({ host: 'localhost', pathname: '/ge/sale' })
assert.deepEqual(localGeSale, { type: 'rewrite', pathname: '/ka/sale', market: 'ge' })
const localGeEn = decideHost({ host: 'localhost', pathname: '/ge/en/sale' })
assert.deepEqual(localGeEn, { type: 'rewrite', pathname: '/en/sale', market: 'ge' })
// Country paths on .ge still move to .com; /ge on .ge is not a country path.
const geCountryPath = decideHost({ host: 'sivrce.ge', pathname: '/fr/paris', vercelEnv: 'production' })
assert.deepEqual(geCountryPath, { type: 'redirect', origin: COM_ORIGIN, pathname: '/fr/paris' })
// /search: worldwide on .com (global market), Georgian catalog on .ge.
const comSearch = decideHost({ host: 'sivrce.com', pathname: '/search', vercelEnv: 'production' })
assert.deepEqual(comSearch, { type: 'rewrite', pathname: '/en/search', market: 'global' })
const comEnSearch = decideHost({ host: 'sivrce.com', pathname: '/en/search', vercelEnv: 'production' })
assert.deepEqual(comEnSearch, { type: 'rewrite', pathname: '/en/search', market: 'global' })
const geSearch = decideHost({ host: 'sivrce.ge', pathname: '/search', vercelEnv: 'production' })
assert.deepEqual(geSearch, { type: 'pass', market: 'ge' })

// Root-mounted paths under /ge must rewrite to the root mount, not /[lang] (was a 404).
const comGeAuth = decideHost({ host: 'sivrce.com', pathname: '/ge/auth/signin', vercelEnv: 'production' })
assert.deepEqual(comGeAuth, { type: 'rewrite', pathname: '/auth/signin', market: 'ge' })
const comGeEnAuth = decideHost({ host: 'sivrce.com', pathname: '/ge/en/auth/signin', vercelEnv: 'production' })
assert.deepEqual(comGeEnAuth, { type: 'rewrite', pathname: '/auth/signin', market: 'ge' })
const comGeApi = decideHost({ host: 'sivrce.com', pathname: '/ge/api/health', vercelEnv: 'production' })
assert.deepEqual(comGeApi, { type: 'rewrite', pathname: '/api/health', market: 'ge' })
const localGeAuth = decideHost({ host: 'localhost', pathname: '/ge/auth/signin' })
assert.deepEqual(localGeAuth, { type: 'rewrite', pathname: '/auth/signin', market: 'ge' })

console.log('host-redirect.check: ok')
