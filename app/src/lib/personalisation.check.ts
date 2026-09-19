import assert from 'node:assert'
import {
  buildAffinityProfile,
  buildProfileFromStorage,
  calculateMedian,
  getPersonalizedRecommendations,
  getRecommendedFromStorage,
  hasPersonalisationSignal,
  scoreListingAffinity,
} from './personalisation'
import type { Listing } from '@/data/listings'
import { LANGS } from '@/lib/i18n/core'


console.log('personalisation.check: start')

// 1. Median Calculation Check
assert.strictEqual(calculateMedian([]), null)
assert.strictEqual(calculateMedian([100]), 100)
assert.strictEqual(calculateMedian([100, 200]), 150)
assert.strictEqual(calculateMedian([10, 30, 20]), 20)

const baseAgent = { name: 'Sivrce Agent', phone: '+995 500 333 111', agency: 'Sivrce' }

// Mock sample listings
const sampleA: Listing = {
  id: 'list-1',
  title: 'Vake 3-room modern apartment',
  address: 'Chavchavadze 47',
  city: 'tbilisi',
  district: 'vake',
  dealType: 'sale',
  propType: 'apartment',
  priceUSD: 120000,
  priceGEL: 324000,
  perM2USD: 1263,
  area: 95,
  rooms: 3,
  beds: 2,
  baths: 1,
  floor: 4,
  totalFloors: 10,
  views: 120,
  badge: 'SUPER VIP',
  img: 'https://cdn.sivrce.ge/p1.webp',
  images: ['1.webp', '2.webp', '3.webp', '4.webp'],
  ai: { score: 95, label: 'Top match' },
  features: ['balcony', 'parking'],
  coords: { lat: 41.71, lng: 44.75 },
  postedAt: '2026-09-01T00:00:00Z',
  agent: baseAgent,
  isNew: true,
}

const sampleB: Listing = {
  id: 'list-2',
  title: 'Saburtalo 2-room cozy flat',
  address: 'Pekini 12',
  city: 'tbilisi',
  district: 'saburtalo',
  dealType: 'rent',
  propType: 'apartment',
  priceUSD: 600,
  priceGEL: 1620,
  perM2USD: 11,
  area: 55,
  rooms: 2,
  beds: 1,
  baths: 1,
  floor: 2,
  totalFloors: 8,
  views: 45,
  badge: null,
  img: 'https://cdn.sivrce.ge/p2.webp',
  images: ['1.webp'],
  ai: { score: 80, label: 'Good' },
  features: ['elevator'],
  coords: { lat: 41.72, lng: 44.77 },
  postedAt: '2026-09-02T00:00:00Z',
  agent: baseAgent,
  isNew: false,
}

const sampleC: Listing = {
  id: 'list-3',
  title: 'Vake Luxury Penthouse',
  address: 'Abashidze 25',
  city: 'tbilisi',
  district: 'vake',
  dealType: 'sale',
  propType: 'apartment',
  priceUSD: 130000,
  priceGEL: 351000,
  perM2USD: 1181,
  area: 110,
  rooms: 4,
  beds: 3,
  baths: 2,
  floor: 9,
  totalFloors: 10,
  views: 240,
  badge: 'SUPER VIP',
  img: 'https://cdn.sivrce.ge/p3.webp',
  images: ['1.webp', '2.webp', '3.webp'],
  ai: { score: 98, label: 'Luxury' },
  features: ['balcony', 'pool', 'garage'],
  coords: { lat: 41.71, lng: 44.76 },
  postedAt: '2026-09-03T00:00:00Z',
  agent: baseAgent,
  isNew: true,
}

// 2. Profile Building Check
const profile = buildAffinityProfile([sampleA], ['deal=sale&city=tbilisi&district=vake&minPrice=100000&maxPrice=150000'])
assert.strictEqual(profile.districts['vake'] >= 5, true)
assert.strictEqual(profile.deals['sale'] >= 4, true)
assert.strictEqual(profile.viewedIds.has('list-1'), true)
assert.strictEqual(typeof profile.targetPriceMedian, 'number')

// 3. Affinity Scoring Check
const scoreViewed = scoreListingAffinity(sampleA, profile)
assert.strictEqual(scoreViewed.score < 0, true, 'Already viewed listing should be penalized')

const scoreMatch = scoreListingAffinity(sampleC, profile)
assert.strictEqual(scoreMatch.score > 50, true, 'Matching district, deal, budget and type should have high score')
assert.strictEqual(scoreMatch.reason, 'district_match')

// 4. Recommendation Output Check
const recommendations = getPersonalizedRecommendations([sampleA, sampleB, sampleC], profile, 5, 'ka')
assert.strictEqual(recommendations.length > 0, true)
assert.strictEqual(recommendations[0].listing.id, 'list-3')
assert.strictEqual(typeof recommendations[0].reasonLabel, 'string')

// 5. All 10 Locales verified for reason translations
for (const loc of LANGS) {
  const recs = getPersonalizedRecommendations([sampleC], profile, 1, loc)
  assert.strictEqual(recs.length, 1)
  assert.strictEqual(recs[0].reasonLabel.length > 0, true)
}

// 6. Client Storage Helper Checks (SSR fallback mode in node)
const storageProfile = buildProfileFromStorage([sampleA, sampleB, sampleC])
assert.strictEqual(storageProfile.totalInteractions, 0)
const storageRecs = getRecommendedFromStorage([sampleA, sampleB, sampleC], 3, 'ka')
assert.strictEqual(storageRecs.length > 0, true)

// 7. Favorites weighting — strongest signal, suppressed from recs
const favProfile = buildAffinityProfile([], [], [sampleA])
assert.strictEqual(favProfile.totalInteractions, 3)
assert.strictEqual(favProfile.viewedIds.has('list-1'), true)
assert.strictEqual(favProfile.districts['vake'] >= 4, true)
assert.strictEqual(favProfile.targetPriceMedian, 120000)
const favRecs = getPersonalizedRecommendations([sampleA, sampleB, sampleC], favProfile, 5, 'en')
assert.strictEqual(favRecs.some((r) => r.listing.id === 'list-1'), false, 'favorited listing suppressed')
assert.strictEqual(favRecs[0].listing.id, 'list-3', 'same-district/budget listing wins')

// 8. Render gate — no window in node → no signal
assert.strictEqual(hasPersonalisationSignal(), false)

console.log('personalisation.check: OK ✓')


