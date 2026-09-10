/**
 * Runnable check: npx tsx src/lib/site-host.check.ts
 */
import assert from 'node:assert/strict'
import { isDeHost, isOwnHost, siteHostFor, hostKind, COM_ORIGIN } from './site-host'

assert.equal(siteHostFor('sivrce.ge').market, 'ge')
assert.equal(siteHostFor('sivrce.ge').defaultLang, 'ka')
assert.equal(siteHostFor('sivrce.de').market, 'de')
assert.equal(siteHostFor('www.sivrce.de').defaultCitySlug, 'berlin')
assert.equal(siteHostFor('sivrce.de').homePath, '/de')
assert.equal(siteHostFor('sivrce.de').apex, COM_ORIGIN)
assert.equal(isDeHost('sivrce.de'), true)
assert.equal(isDeHost('sivrce.ge'), false)
assert.equal(isOwnHost('admin.sivrce.ge'), true)
assert.equal(isOwnHost('www.sivrce.de'), true)
assert.equal(isOwnHost('ss.ge'), false)
assert.equal(hostKind('sivrce.com'), 'com')
assert.equal(hostKind('sivrce.ae'), 'ae-cctld')

console.log('site-host.check: ok')
