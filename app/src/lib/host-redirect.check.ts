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

const geDe = decideHost({ host: 'sivrce.ge', pathname: '/de', vercelEnv: 'production' })
assert.deepEqual(geDe, { type: 'redirect', origin: COM_ORIGIN, pathname: '/de' })

const geBerlin = decideHost({ host: 'sivrce.ge', pathname: '/berlin', vercelEnv: 'production' })
assert.deepEqual(geBerlin, { type: 'redirect', origin: COM_ORIGIN, pathname: '/de/berlin' })

const comSale = decideHost({ host: 'sivrce.com', pathname: '/sale', vercelEnv: 'production' })
assert.deepEqual(comSale, { type: 'redirect', origin: GE_ORIGIN, pathname: '/sale' })

const comHome = decideHost({ host: 'sivrce.com', pathname: '/', vercelEnv: 'production' })
assert.deepEqual(comHome, { type: 'rewrite', pathname: '/en', market: 'global' })

const comDe = decideHost({ host: 'sivrce.com', pathname: '/de/berlin', vercelEnv: 'production' })
assert.deepEqual(comDe, { type: 'rewrite', pathname: '/en/de/berlin', market: 'de' })

const previewDe = decideHost({ host: 'sivrce-git-foo.vercel.app', pathname: '/de' })
assert.deepEqual(previewDe, { type: 'rewrite', pathname: '/en/de', market: 'de' })

const localDe = decideHost({ host: 'localhost', pathname: '/de/berlin' })
assert.deepEqual(localDe, { type: 'rewrite', pathname: '/en/de/berlin', market: 'de' })

const previewNoBounce = decideHost({ host: 'sivrce-git-foo.vercel.app', pathname: '/de', vercelEnv: 'preview' })
assert.equal(previewNoBounce.type, 'rewrite')

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

console.log('host-redirect.check: ok')
