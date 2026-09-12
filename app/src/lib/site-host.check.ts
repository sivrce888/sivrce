/**
 * Runnable check: npx tsx src/lib/site-host.check.ts
 */
import assert from 'node:assert/strict'
import { isDeHost, isOwnHost, siteHostFor, hostKind, COM_ORIGIN, publicOriginKind, sitemapScope, sessionCookieDomain } from './site-host'

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
assert.equal(publicOriginKind('com'), 'com')
assert.equal(publicOriginKind('de-cctld'), 'com')
assert.equal(publicOriginKind('ge'), 'ge')
assert.equal(publicOriginKind('dev'), 'ge')
assert.equal(sitemapScope('com'), 'com')
assert.equal(sitemapScope('ge'), 'ge')
assert.equal(sitemapScope('dev'), 'all')
assert.equal(sitemapScope('preview'), 'all')

// Session cookie domain — one platform, two registrable domains.
assert.equal(sessionCookieDomain('sivrce.ge'), '.sivrce.ge')
assert.equal(sessionCookieDomain('admin.sivrce.ge'), '.sivrce.ge')
assert.equal(sessionCookieDomain('www.sivrce.ge'), '.sivrce.ge')
assert.equal(sessionCookieDomain('sivrce.com'), '.sivrce.com')
assert.equal(sessionCookieDomain('www.sivrce.com'), '.sivrce.com')
assert.equal(sessionCookieDomain('SVRCE.com:443'), '.sivrce.com')
assert.equal(sessionCookieDomain('localhost'), undefined)
assert.equal(sessionCookieDomain('preview.vercel.app'), undefined)
assert.equal(sessionCookieDomain('evil-sivrce.com.attacker.io'), undefined)

console.log('site-host.check: ok')
