/**
 * Runnable check: npx tsx src/lib/home-scope.check.ts
 */
import {
  cityCatalogName,
  cityNamesForSlug,
  citySearchValues,
  homeScopeCacheKey,
  homeScopeFor,
  homeScopeForCountry,
  homeScopeWhere,
  homeSearchHref,
} from './home-scope'

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg)
}

const world = homeScopeFor('global')
assert(world?.country === '*', 'worldwide hub sees the unified inventory')
assert(homeScopeWhere(world).country === undefined, 'worldwide where adds no country filter')
assert(homeSearchHref({}, world) === '/search', 'worldwide rail links to the global search')
assert(homeScopeFor('ge')?.country === 'GE', 'Georgia homepage is GE-only')
assert(!homeScopeFor('ge')?.cityNames, 'country root is not a city lock')
assert(!homeScopeFor('ge')?.deal, 'country root is not an intent lock')

const berlin = homeScopeFor('de', 'berlin', 'rent')
assert(berlin?.country === 'DE', 'Germany city hub is DE-only')
assert(berlin?.deal === 'rent', 'intent locks dealType')
assert(berlin?.cityNames?.includes('Berlin'), 'Berlin Latin name')
assert(berlin?.cityParam === 'Berlin', 'search city param is Latin off-GE')

const tbilisi = cityNamesForSlug('tbilisi')
assert(tbilisi.includes('თბილისი'), 'Tbilisi ka')
assert(tbilisi.includes('Tbilisi'), 'Tbilisi en')

const tbilisiEn = citySearchValues('Tbilisi')
assert(tbilisiEn.includes('თბილისი'), 'city=Tbilisi expands to ka')
assert(citySearchValues('tiflis').includes('თბილისი'), 'tiflis alias')
assert(citySearchValues('unknown-burg').length === 1 && citySearchValues('unknown-burg')[0] === 'unknown-burg', 'unknown city stays literal')
assert(cityCatalogName('Tbilisi') === 'თბილისი', 'catalog name is ka')

const geCity = homeScopeFor('ge', 'batumi')
assert(geCity?.cityParam === 'ბათუმი', 'GE search city is ka')

assert(homeScopeWhere(null).country === undefined, 'null scope adds no country filter')
assert(homeScopeWhere(homeScopeFor('ge')).country === 'GE', 'GE where')
assert(homeScopeWhere(berlin).dealType === 'rent', 'rent where')
assert(homeScopeWhere(berlin).city?.in.includes('Berlin'), 'city in-list')

assert(
  homeSearchHref({ tier: 'diamond' }, homeScopeFor('de')) === '/search?tier=diamond&country=DE',
  'rail view-all stays in-country',
)
assert(
  homeSearchHref({}, berlin) === '/search?country=DE&city=Berlin&deal=rent',
  'city+intent search lock',
)
assert(homeSearchHref({ tier: 'diamond' }, null) === '/search?tier=diamond', 'unscoped href')

assert(homeScopeCacheKey(null) === '', 'empty cache key')
assert(homeScopeCacheKey(homeScopeFor('ae')) === 'AE::', 'AE cache key')
assert(homeScopeForCountry('fr')?.country === 'FR', 'path country ISO')

console.log('home-scope.check: ok')
