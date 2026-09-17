/**
 * Runnable check: npx tsx src/lib/domain-scope.check.ts
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  domainFromHost,
  enforcedCountry,
  georgiaListingAlternates,
  hostFromRequest,
  surfaceOrigin,
  surfacePathPrefix,
} from './domain-scope'
import { COM_ORIGIN, GE_ORIGIN } from './markets'

assert.equal(domainFromHost('sivrce.ge'), 'ge')
assert.equal(domainFromHost('www.sivrce.ge'), 'ge')
assert.equal(domainFromHost('sivrce.com'), 'com')
assert.equal(domainFromHost('www.sivrce.com'), 'com')
assert.equal(domainFromHost('localhost'), 'ge')

assert.equal(enforcedCountry('ge', 'DE'), 'GE')
assert.equal(enforcedCountry('ge', 'ALL'), 'GE')
assert.equal(enforcedCountry('ge', undefined), 'GE')
assert.equal(enforcedCountry('com', 'DE'), 'DE')
assert.equal(enforcedCountry('com', 'all'), undefined)
assert.equal(enforcedCountry('com', undefined), undefined)
assert.equal(enforcedCountry('com', 'GE'), 'GE')
assert.equal(enforcedCountry('dev', 'DE'), 'DE')
assert.equal(enforcedCountry('preview', undefined), undefined)

assert.equal(surfacePathPrefix('ge', 'ge'), '')
assert.equal(surfacePathPrefix('com', 'ge'), '/ge')
assert.equal(surfacePathPrefix('com', 'de'), '')
assert.equal(surfaceOrigin('ge'), GE_ORIGIN)
assert.equal(surfaceOrigin('com'), COM_ORIGIN)

const geKa = georgiaListingAlternates('/listing/1/vake', 'ka', 'ge')
assert.equal(geKa.canonical, `${GE_ORIGIN}/listing/1/vake`)
assert.equal(geKa.languages['ka-GE'], `${GE_ORIGIN}/listing/1/vake`)
assert.equal(geKa.languages['en-001'], `${COM_ORIGIN}/ge/en/listing/1/vake`)

const comEn = georgiaListingAlternates('/listing/1/vake', 'en', 'com')
assert.equal(comEn.canonical, `${COM_ORIGIN}/ge/en/listing/1/vake`)
assert.equal(comEn.languages.ka, `${COM_ORIGIN}/ge/listing/1/vake`)
assert.ok(comEn.canonical !== geKa.canonical, 'surfaces must not share a canonical')

const req = { headers: new Headers({ host: 'sivrce.ge' }) }
assert.equal(hostFromRequest(req), 'sivrce.ge')

const requestMarketSrc = readFileSync(new URL('./request-market.ts', import.meta.url), 'utf8')
assert.ok(
  !requestMarketSrc.includes('x-vercel-ip-country'),
  'requestMarket must not use IP as market authority',
)
assert.ok(
  !requestMarketSrc.includes('cf-ipcountry'),
  'requestMarket must not use IP as market authority',
)

const geoSrc = readFileSync(new URL('./geo-market.ts', import.meta.url), 'utf8')
assert.ok(!/marketFromIso\(input\.iso\)/.test(geoSrc), 'geoLaunchTarget must not 302 from IP ISO')

console.log('domain-scope.check: ok')
