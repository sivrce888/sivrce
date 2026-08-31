import assert from 'node:assert/strict'
import { suggestionToFilters, searchHref, filtersToParams, exactSuggestHit, locationLabel, compactDistrictParam, splitDistricts } from './search-location'

assert.deepEqual(suggestionToFilters({ kind: 'city', ka: 'თბილისი' }), {
  city: 'თბილისი',
  district: undefined,
  q: undefined,
})

assert.deepEqual(
  suggestionToFilters({ kind: 'district', ka: 'ვაკე', city: 'თბილისი' }),
  { city: 'თბილისი', district: 'ვაკე', q: undefined },
)

assert.deepEqual(
  suggestionToFilters({
    kind: 'street',
    ka: 'ჭავჭავაძის გამზირი',
    city: 'თბილისი',
    district: 'ვაკე',
  }),
  { city: 'თბილისი', district: 'ვაკე', q: 'ჭავჭავაძის გამზირი' },
)

// Street without catalog city must not wipe an existing city param.
assert.deepEqual(suggestionToFilters({ kind: 'street', ka: 'პეკინი' }), {
  q: 'პეკინი',
})

assert.equal(searchHref({ city: 'თბილისი', q: undefined }), `/search?${new URLSearchParams({ city: 'თბილისი' })}`)
assert.equal(searchHref({}), '/search')
assert.equal(filtersToParams({ deal: 'sale', q: '' }).toString(), 'deal=sale')

assert.equal(
  exactSuggestHit(
    [
      { kind: 'street', ka: 'ვაკე' },
      { kind: 'district', ka: 'ვაკე', city: 'თბილისი' },
    ],
    'ვაკე',
  )?.kind,
  'district',
)
assert.equal(exactSuggestHit([{ kind: 'city', ka: 'ბათუმი' }], 'ბათუმი')?.ka, 'ბათუმი')
assert.equal(exactSuggestHit([{ kind: 'city', ka: 'ბათუმი' }], 'xyz'), undefined)

assert.deepEqual(splitDistricts('ვაკე, საბურთალო'), ['ვაკე', 'საბურთალო'])
assert.equal(locationLabel({ city: 'თბილისი', district: '', street: '' }), 'თბილისი')
assert.equal(locationLabel({ city: 'თბილისი', district: 'ვაკე', street: '' }), 'ვაკე, თბილისი')
assert.equal(locationLabel({ city: 'თბილისი', district: 'ვაკე,საბურთალო,დიღომი', street: '' }), 'თბილისი · 3')
assert.equal(
  compactDistrictParam(['ვაკე', 'ბაგები', 'წყნეთი'], { ვაკე: ['ბაგები', 'წყნეთი'] }),
  'ვაკე',
)
assert.equal(
  compactDistrictParam(['ბაგები'], { ვაკე: ['ბაგები', 'წყნეთი'] }),
  'ბაგები',
)

console.log('ok: suggestionToFilters')
