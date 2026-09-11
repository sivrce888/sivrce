/**
 * Runnable check: npx tsx src/lib/host-redirect.check.ts
 */
import assert from 'node:assert/strict'
import { decideHost, mapCctldPath } from './host-redirect'
import { COM_ORIGIN, GE_ORIGIN } from './site-host'
import { sanitizePath, hostKind, isOwnHost, siteHostFor, isDeHost, safeRedirectUrl } from './site-host'
import { isCountryPath, COUNTRY_IDS } from './markets'
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
assert.deepEqual(comSale, { type: 'redirect', origin: GE_ORIGIN, pathname: '/sale' })

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

console.log('host-redirect.check: ok')
