/**
 * Runnable check: npx tsx src/lib/countries/ae.check.ts
 */
import assert from 'node:assert/strict'
import { MARKETS } from '@/lib/markets'
import { sourcesFor } from '@/lib/intel/core'
import { marketCosts } from './costs'
import {
  AE_EMIRATES,
  AE_AS_OF,
  GOLDEN_VISA_AED,
  aeEmirateBySlug,
  aeEmirateByKa,
  aeTransferFeePct,
  isAeProjectCity,
  aeTitleLabel,
} from './ae'

assert.equal(AE_AS_OF.length, 4)
assert.equal(AE_EMIRATES.length, 4)
assert.equal(GOLDEN_VISA_AED, 2_000_000)

for (const slug of MARKETS.ae.citySlugs) {
  const e = AE_EMIRATES.find((x) => x.slug === slug)
  assert.ok(e, `emirate row for ${slug}`)
  assert.ok(e.ka.length > 2 && e.en.length > 2 && e.ar.length > 1, `names ${slug}`)
  assert.ok(e.authority.length > 8, `authority ${slug}`)
  assert.ok(e.tenancy.length > 2, `tenancy ${slug}`)
}

assert.equal(aeTransferFeePct('dubai'), 4)
assert.equal(aeTransferFeePct('abu-dhabi'), 2)
assert.equal(aeTransferFeePct('sharjah'), 2)
assert.equal(aeTransferFeePct('ras-al-khaimah'), 2)
assert.equal(aeTransferFeePct(), 4)
assert.equal(aeTransferFeePct('unknown'), 4)

const aeCosts = marketCosts('ae')
for (const e of AE_EMIRATES) {
  assert.equal(aeCosts.cities[e.slug]?.pct, e.transferFeePct, `costs.ts vs ae.ts fee ${e.slug}`)
}

assert.equal(aeEmirateBySlug('sharjah').title, 'usufruct-100y')
assert.equal(aeEmirateBySlug('dubai').title, 'freehold')
assert.ok(aeTitleLabel(aeEmirateBySlug('sharjah')).includes('usufruct'))
assert.ok(!aeTitleLabel(aeEmirateBySlug('dubai')).includes('usufruct'))

assert.equal(aeEmirateByKa('დუბაი')?.slug, 'dubai')
assert.equal(isAeProjectCity('დუბაი'), true)
assert.equal(isAeProjectCity('თბილისი'), false)
assert.equal(isAeProjectCity('აჯმანი'), false)

assert.ok(sourcesFor('AE', 'permit_status').some((s) => s.slug === 'ae-dld'), 'dld permits')
assert.ok(sourcesFor('AE', 'company_identity').some((s) => s.slug === 'ae-rera'), 'rera identity')
assert.ok(sourcesFor('AE', 'permit_status').some((s) => s.slug === 'ae-dmt'), 'dmt permits')

console.log('ae.check: ok')
