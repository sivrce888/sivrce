/**
 * Runnable check: npx tsx src/components/nav/nav-location-badge.check.ts
 * Verifies Navbar location badge component imports, SSR-safety, and market route resolutions.
 */
import assert from 'node:assert/strict'
import { chromeMarket, parseCountryPath } from '../../lib/markets'
import { decideHost } from '../../lib/host-redirect'
import { marketHref } from './NavLocationBadge'

// 1. Verify country path parsing for nav location badge across all locale prefixes
assert.deepEqual(parseCountryPath('/de'), { country: 'de', city: undefined, intent: undefined })
assert.deepEqual(parseCountryPath('/de/berlin'), { country: 'de', city: 'berlin', intent: undefined })
assert.deepEqual(parseCountryPath('/ka/de'), { country: 'de', city: undefined, intent: undefined })
assert.deepEqual(parseCountryPath('/ru/de'), { country: 'de', city: undefined, intent: undefined })
assert.deepEqual(parseCountryPath('/de/de'), { country: 'de', city: undefined, intent: undefined })
assert.deepEqual(parseCountryPath('/en/de/berlin'), { country: 'de', city: 'berlin', intent: undefined })
assert.deepEqual(parseCountryPath('/ka/de/berlin'), { country: 'de', city: 'berlin', intent: undefined })
assert.deepEqual(parseCountryPath('/de/projects'), { country: 'de', city: undefined, intent: undefined })
assert.deepEqual(parseCountryPath('/ae/dubai'), { country: 'ae', city: 'dubai', intent: undefined })
assert.deepEqual(parseCountryPath('/us/new-york'), { country: 'us', city: 'new-york', intent: undefined })
assert.equal(parseCountryPath('/'), null)
assert.equal(parseCountryPath('/projects'), null)
assert.equal(parseCountryPath('/ka/projects'), null)
assert.equal(chromeMarket('/de'), 'de')
assert.equal(chromeMarket('/ka/de'), 'de')
assert.equal(chromeMarket('/ru/de'), 'de')
assert.equal(chromeMarket('/de/de'), 'de')
assert.equal(chromeMarket('/en/de/berlin'), 'de')
assert.equal(chromeMarket('/de/projects'), 'de')
assert.equal(chromeMarket('/en/search', 'DE'), 'de')
assert.equal(chromeMarket('/en/search', 'all'), 'global')
assert.equal(chromeMarket('/ae/dubai', 'GE'), 'ae')

// 2. Every href the badge emits must resolve on BOTH origins — the badge is
// server-rendered and cannot know the host. Georgia via the /ge mirror form,
// countries via /en/<cc> (or the market's own locale form).
assert.equal(marketHref('ge', 'ka'), '/ge')
assert.equal(marketHref('ge', 'ru'), '/ge/ru')
assert.equal(marketHref('de', 'ka'), '/en/de')
assert.equal(marketHref('de', 'de'), '/de/de')
assert.equal(marketHref('ae', 'ar'), '/ar/ae')
assert.equal(marketHref('ae', 'en'), '/en/ae')
assert.equal(marketHref('fr', 'ru'), '/en/fr')

for (const [id, lang, market] of [
  ['ge', 'ka', 'ge'],
  ['ge', 'ru', 'ge'],
  ['de', 'ka', 'de'],
  ['de', 'de', 'de'],
  ['ae', 'ar', 'ae'],
  ['fr', 'ru', 'fr'],
  ['us', 'en', 'us'],
] as const) {
  for (const host of ['sivrce.ge', 'sivrce.com'] as const) {
    let d = decideHost({ host, pathname: marketHref(id, lang), vercelEnv: 'production' })
    // At most one hop: .ge bounces country paths to .com, .com folds /en/<cc>.
    if (d.type === 'redirect') {
      const next = d.origin === 'same' ? host : d.origin === 'https://sivrce.ge' ? 'sivrce.ge' : 'sivrce.com'
      d = decideHost({ host: next, pathname: d.pathname, vercelEnv: 'production' })
    }
    assert.notEqual(d.type, 'redirect', `${host}${marketHref(id, lang)} still redirecting`)
    if (d.type === 'redirect') continue // unreachable, narrows the union
    assert.equal(d.market, market, `${host}${marketHref(id, lang)} → market ${d.market}`)
  }
}

console.log('nav-location-badge.check: OK')
