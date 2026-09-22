/**
 * SIVRCE — Organic Georgian SEO Engine Self-Check
 * Run: npx tsx src/lib/seo-organic.check.ts
 *
 * Verifies 100/100 Apple-grade organic URL routing, compound search queries,
 * transliteration support, percent-decoding, canonical paths, breadcrumbs,
 * and link chips for Georgian real-estate search.
 */

import assert from 'node:assert/strict'
import {
  parseSeoSlug,
  listingHubPath,
  breadcrumbsOf,
  linkChipsOf,
  toOrganicKaUrl,
} from './seo-pages'

// 1. Dual-native resolution (ASCII and Georgian script)
const asciiDef = parseSeoSlug(['sale', 'apartments'])
assert.ok(asciiDef, 'sale/apartments must resolve')
assert.equal(asciiDef.kind, 'deal-type')
assert.equal(asciiDef.kaPath, '/იყიდება/ბინები')
assert.equal(asciiDef.asciiPath, '/sale/apartments')

const kaDef = parseSeoSlug(['იყიდება', 'ბინები'])
assert.ok(kaDef, 'იყიდება/ბინები must resolve')
assert.equal(kaDef.kind, 'deal-type')
assert.equal(kaDef.kaPath, '/იყიდება/ბინები')
assert.equal(kaDef.path, '/იყიდება/ბინები')

// 2. Transliterated fallback (myhome/ss users typing latin keyboards)
const transDef = parseSeoSlug(['iyideba', 'binebi'])
assert.ok(transDef, 'iyideba/binebi must resolve')
assert.equal(transDef.kaPath, '/იყიდება/ბინები')

// 3. Deep hierarchy: Deal × Type × City × District
const vakeDef = parseSeoSlug(['იყიდება', 'ბინები', 'თბილისი', 'ვაკე'])
assert.ok(vakeDef, 'იყიდება/ბინები/თბილისი/ვაკე must resolve')
assert.equal(vakeDef.kind, 'deal-type-city-district')
assert.equal(vakeDef.kaPath, '/იყიდება/ბინები/თბილისი/ვაკე')
assert.equal(vakeDef.asciiPath, '/sale/apartments/tbilisi/vake')

// 4. Natural Compound Search Queries (Google search intent phrases)
// 4a. 2-segment compound: /იყიდება/ბინები-თბილისში
const compound2 = parseSeoSlug(['იყიდება', 'ბინები-თბილისში'])
assert.ok(compound2, 'იყიდება/ბინები-თბილისში must resolve')
assert.equal(compound2.kind, 'deal-type-city')
assert.equal(compound2.kaPath, '/იყიდება/ბინები/თბილისი')
assert.equal(compound2.compoundPath, '/იყიდება/ბინები-თბილისში')

// 4b. 3-segment compound: /იყიდება/ბინები-თბილისში/ვაკე
const compound3 = parseSeoSlug(['იყიდება', 'ბინები-თბილისში', 'ვაკე'])
assert.ok(compound3, 'იყიდება/ბინები-თბილისში/ვაკე must resolve')
assert.equal(compound3.kind, 'deal-type-city-district')
assert.equal(compound3.kaPath, '/იყიდება/ბინები/თბილისი/ვაკე')

// 4c. 1-segment compound: /იყიდება-ბინები-თბილისში
const compound1 = parseSeoSlug(['იყიდება-ბინები-თბილისში'])
assert.ok(compound1, 'იყიდება-ბინები-თბილისში must resolve')
assert.equal(compound1.kind, 'deal-type-city')
assert.equal(compound1.kaPath, '/იყიდება/ბინები/თბილისი')

// 5. Percent-encoded handling (raw browser URL pastes)
const encodedDef = parseSeoSlug([
  encodeURIComponent('იყიდება'),
  encodeURIComponent('ბინები'),
  encodeURIComponent('თბილისი'),
])
assert.ok(encodedDef, 'percent-encoded slug must resolve')
assert.equal(encodedDef.kaPath, '/იყიდება/ბინები/თბილისი')

// 6. Georgian Room Queries: e.g. /იყიდება/2-ოთახიანი-ბინები/თბილისი
const roomDef = parseSeoSlug(['იყიდება', '2-ოთახიანი-ბინები', 'თბილისი'])
assert.ok(roomDef, '2-ოთახიანი-ბინები must resolve')
assert.equal(roomDef.rooms, 2)
assert.equal(roomDef.kaPath, '/იყიდება/2-ოთახიანი-ბინები/თბილისი')

// 7. City & District hubs
const cityHub = parseSeoSlug(['თბილისი'])
assert.ok(cityHub, 'თბილისი city hub must resolve')
assert.equal(cityHub.kaPath, '/თბილისი')

const distHub = parseSeoSlug(['თბილისი', 'ვაკე'])
assert.ok(distHub, 'თბილისი/ვაკე district hub must resolve')
assert.equal(distHub.kaPath, '/თბილისი/ვაკე')

// 8. toOrganicKaUrl conversion helper
assert.equal(toOrganicKaUrl('/sale'), '/იყიდება')
assert.equal(toOrganicKaUrl('/rent'), '/ქირავდება')
assert.equal(toOrganicKaUrl('/daily'), '/დღიურად')
assert.equal(toOrganicKaUrl('/pledge'), '/გირავდება')
assert.equal(toOrganicKaUrl('/lease'), '/იჯარა')
assert.equal(toOrganicKaUrl('/sale/apartments'), '/იყიდება/ბინები')
assert.equal(toOrganicKaUrl('/sale/houses'), '/იყიდება/სახლები')
assert.equal(toOrganicKaUrl('/sale/apartments-2'), '/იყიდება/2-ოთახიანი-ბინები')
assert.equal(toOrganicKaUrl('/sale/apartments/tbilisi'), '/იყიდება/ბინები/თბილისი')
assert.equal(toOrganicKaUrl('/sale/apartments/tbilisi/vake'), '/იყიდება/ბინები/თბილისი/ვაკე')
assert.equal(toOrganicKaUrl('/sale/apartments?min=1000'), '/იყიდება/ბინები?min=1000')
assert.equal(toOrganicKaUrl('/იყიდება/ბინები'), '/იყიდება/ბინები')

// 9. breadcrumbsOf test (Georgian vs English)
const crumbsKa = breadcrumbsOf(vakeDef, 'ka')
assert.equal(crumbsKa[0].name, 'მთავარი')
assert.equal(crumbsKa[1].href, '/იყიდება')
assert.equal(crumbsKa[2].href, '/იყიდება/ბინები')
assert.equal(crumbsKa[3].href, '/იყიდება/ბინები/თბილისი')
assert.equal(crumbsKa[4].href, '/იყიდება/ბინები/თბილისი/ვაკე')

const crumbsEn = breadcrumbsOf(vakeDef, 'en')
assert.equal(crumbsEn[0].name, 'Home')
assert.equal(crumbsEn[1].href, '/en/sale')
assert.equal(crumbsEn[2].href, '/en/sale/apartments')
assert.equal(crumbsEn[3].href, '/en/sale/apartments/tbilisi')
assert.equal(crumbsEn[4].href, '/en/sale/apartments/tbilisi/vake')

// 10. linkChipsOf test
const chipsKa = linkChipsOf(vakeDef, 'ka')
assert.ok(chipsKa.dealSwitch?.href.includes('/ქირავდება/ბინები/თბილისი/ვაკე'))
assert.ok(chipsKa.types.some((t) => t.href.includes('/იყიდება/სახლები/თბილისი')))
assert.ok(chipsKa.rooms.some((r) => r.href.includes('/იყიდება/2-ოთახიანი-ბინები/თბილისი/ვაკე')))

// 11. listingHubPath test
const sampleListing = {
  dealType: 'sale' as const,
  propType: 'apartment' as const,
  city: 'თბილისი',
  district: 'ვაკე',
}
// Default returns ASCII (backwards-compatible with existing tests)
assert.equal(listingHubPath(sampleListing), '/sale/apartments/tbilisi/vake')
// Explicit 'ka' returns organic Georgian path
assert.equal(listingHubPath(sampleListing, 'ka'), '/იყიდება/ბინები/თბილისი/ვაკე')

console.log('seo-organic: 11/11 tests passed ✓ [100/100 Organic Georgian SEO Engine]')
