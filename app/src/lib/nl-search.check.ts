import assert from 'node:assert/strict'
import { DE_CITIES } from './countries/de'
import {
  isOfficialGeoQuery,
  mergeNl,
  nlHasStructure,
  nlToSearchPatch,
  parseNlQuery,
  routeCountryNl,
  explainPropertyMatch,
  nlFromSearchParams,
} from './nl-search'

const a = parseNlQuery('2 bedroom Vake apartment under 250k with parking')
assert.equal(a.district, 'ვაკე')
assert.equal(a.city, 'თბილისი')
assert.equal(a.bedrooms, 2)
assert.equal(a.rooms, undefined)
assert.equal(a.propertyType, 'apartment')
assert.equal(a.maxPrice, 250000)
assert.ok(a.features?.includes('add.f.parking'))
assert.equal(nlHasStructure(a), true)
assert.equal(nlToSearchPatch(a).district, 'ვაკე')
assert.equal(nlToSearchPatch(a).feat, 'add.f.parking')
assert.equal(nlToSearchPatch(a).max, '250000')
assert.equal(nlToSearchPatch(a).q, undefined)

const b = parseNlQuery(
  'I want a bright 3-bedroom apartment in Vake under $300,000 with parking.',
)
assert.equal(b.district, 'ვაკე')
assert.equal(b.bedrooms, 3)
assert.equal(b.rooms, undefined)
assert.equal(b.maxPrice, 300000)
assert.ok(b.features?.includes('add.f.parking'))
assert.ok(b.features?.includes('add.f.bright'))

const c = parseNlQuery('ვაკე')
assert.equal(c.district, 'ვაკე')
assert.equal(c.city, 'თბილისი')

const d = parseNlQuery('saburtalo 2 rooms')
assert.equal(d.district, 'საბურთალო')
assert.equal(d.rooms, 2)
assert.equal(nlToSearchPatch(a).beds, '2')
assert.equal(nlToSearchPatch(d).rooms, '2')
const kaBeds = parseNlQuery('2 საძინებელი ბათუმი დღიურად')
assert.equal(kaBeds.bedrooms, 2)
assert.equal(kaBeds.dealType, 'daily')
const kaRooms = parseNlQuery('3 ოთახიანი ვაკე')
assert.equal(kaRooms.rooms, 3)
assert.equal(kaRooms.bedrooms, undefined)

assert.equal(parseNlQuery('ID 24316314').keywords, 'ID 24316314')
assert.equal(nlHasStructure(parseNlQuery('xyz')), false)

const merged = mergeNl(a, { maxPrice: 200000, features: ['add.f.elevator'] })
assert.equal(merged.maxPrice, 200000)
assert.ok(merged.features?.includes('add.f.parking'))
assert.ok(merged.features?.includes('add.f.elevator'))

const loggia = parseNlQuery('ბინა ლოჯით ვაკეში')
assert.ok(loggia.features?.includes('add.f.loggia'))
const garage = parseNlQuery('house with garage in Vake')
assert.ok(garage.features?.includes('add.f.garage'))
assert.ok(!garage.features?.includes('add.f.parking'))

assert.equal(parseNlQuery('აგარაკი ვაკე').propertyType, 'villa')
assert.equal(parseNlQuery('სასტუმრო ბათუმი').propertyType, 'hotel')
assert.equal(parseNlQuery('კერძო სახლი თბილისი').propertyType, 'house')
assert.equal(nlToSearchPatch(parseNlQuery('აგარაკი ვაკე')).type, 'villa')

const partyKa = parseNlQuery('წვეულების სახლი თბილისი')
assert.equal(partyKa.dealType, 'daily')
assert.equal(partyKa.propertyType, undefined)
assert.ok(partyKa.features?.includes('add.f.partiesAllowed'))
assert.equal(nlToSearchPatch(partyKa).deal, 'daily')
assert.equal(nlToSearchPatch(partyKa).feat, 'add.f.partiesAllowed')
assert.equal(nlToSearchPatch(partyKa).type, undefined)

const birthday = parseNlQuery('birthday party house Batumi')
assert.equal(birthday.dealType, 'daily')
assert.ok(birthday.features?.includes('add.f.partiesAllowed'))
assert.equal(birthday.city, 'ბათუმი')

const eventKa = parseNlQuery('ივენთის სახლი ბადაბა')
assert.ok(eventKa.features?.includes('add.f.partiesAllowed'))
assert.equal(eventKa.dealType, 'daily')

// Hero rotating placeholder examples must parse to structured filters.
const exKaRooms = parseNlQuery('2 ოთახიანი ბინა ვაკეში')
assert.equal(exKaRooms.rooms, 2)
assert.equal(exKaRooms.district, 'ვაკე')
const exKaPrice = parseNlQuery('ბინა თბილისში $50k-მდე')
assert.equal(exKaPrice.propertyType, 'apartment')
assert.equal(exKaPrice.maxPrice, 50000)
const exKaRent = parseNlQuery('გასაქირავებელი ბინა პარკინგით')
assert.equal(exKaRent.dealType, 'rent')
assert.ok(exKaRent.features?.includes('add.f.parking'))
const exEn = parseNlQuery('2-bedroom apartment in Tbilisi')
assert.equal(exEn.bedrooms, 2)
assert.equal(exEn.city, 'თბილისი')

assert.equal(parseNlQuery('გირავდება ბინა ვაკე').dealType, 'pledge')
assert.equal(nlToSearchPatch(parseNlQuery('გირავდება ბინა ვაკე')).deal, 'pledge')
assert.equal(parseNlQuery('pledge apartment Vake').dealType, 'pledge')

const leaseKa = parseNlQuery('გაიცემა იჯარით მიწა გლდანი')
assert.equal(leaseKa.dealType, 'rent')
assert.equal(leaseKa.propertyType, 'land')
assert.equal(nlToSearchPatch(leaseKa).deal, 'rent')
assert.equal(nlToSearchPatch(leaseKa).type, 'land')
assert.equal(parseNlQuery('იჯარით ნაკვეთი თელავი').dealType, 'rent')
assert.equal(parseNlQuery('იჯარით ნაკვეთი თელავი').propertyType, 'land')

// German queries (sivrce.de audience types German)
const deBuy = parseNlQuery('2-Zimmer-Wohnung in Tiflis kaufen')
assert.equal(deBuy.propertyType, 'apartment')
assert.equal(deBuy.rooms, 2)
assert.equal(deBuy.bedrooms, undefined)
assert.equal(deBuy.dealType, 'sale')
const deBeds = parseNlQuery('3 Schlafzimmer Wohnung Vake unter 200.000 €')
assert.equal(deBeds.bedrooms, 3)
assert.equal(deBeds.rooms, undefined)
assert.equal(deBeds.maxPrice, 200000)
const deRent = parseNlQuery('Haus mieten Batumi mit Parkplatz')
assert.equal(deRent.dealType, 'rent')
assert.equal(deRent.propertyType, 'house')
assert.ok(deRent.features?.includes('add.f.parking'))
const deDaily = parseNlQuery('Ferienwohnung zur Tagesmiete mit Balkon')
assert.equal(deDaily.dealType, 'daily')
assert.equal(deDaily.propertyType, 'villa')
assert.ok(deDaily.features?.includes('add.f.balcony'))
const deLand = parseNlQuery('Grundstück kaufen')
assert.equal(deLand.propertyType, 'land')
assert.equal(deLand.dealType, 'sale')
const deFurn = parseNlQuery('möblierte Wohnung Tiflis')
assert.equal(deFurn.propertyType, 'apartment')
assert.ok(deFurn.features?.includes('add.f.furniture'))
assert.equal(parseNlQuery('Einfamilienhaus verkaufen').propertyType, 'house')
assert.equal(parseNlQuery('Wohnung bis zu €150k').maxPrice, 150000)
assert.equal(nlHasStructure(deBuy), true)

const deBerlin = parseNlQuery('2 Zimmer Wohnung in Berlin unter 500.000 € mit Balkon und U-Bahn unter 10 Minuten')
assert.equal(deBerlin.rooms, 2)
assert.equal(deBerlin.propertyType, 'apartment')
assert.equal(deBerlin.city, 'ბერლინი')
assert.equal(deBerlin.maxPrice, 500000)
assert.equal(deBerlin.currency, 'EUR')
assert.ok(deBerlin.features?.includes('add.f.balcony'))
assert.notEqual(deBerlin.maxPrice, 10, 'U-Bahn unter 10 Minuten must not become a price')

const deMitte = parseNlQuery('Neubau in Berlin Mitte bis 4.500 €/m²')
assert.equal(deMitte.city, 'ბერლინი')
assert.equal(deMitte.district, 'Mitte')
assert.equal(deMitte.buildingStatus, 'add.status.new')
assert.equal(deMitte.maxPrice, undefined, '€/m² is not a purchase cap')

const deAltbau = parseNlQuery('Altbau Wohnung Prenzlauer Berg')
assert.equal(deAltbau.district, 'Pankow')
assert.equal(deAltbau.buildingStatus, 'add.status.old')

assert.equal(parseNlQuery('Köln').city, DE_CITIES.find((c) => c.slug === 'cologne')?.ka)
assert.equal(nlToSearchPatch(deBerlin).cur, 'EUR')
assert.equal(nlToSearchPatch(deMitte).bstat, 'add.status.new')

assert.equal(isOfficialGeoQuery('Bebauungsplan Mitte'), true)

const berlin = DE_CITIES.find((c) => c.slug === 'berlin')!
const r1 = routeCountryNl({
  q: '2 Zimmer Wohnung in Berlin unter 500.000 € mit Balkon',
  tab: 'buy',
  country: 'de',
  cityKa: berlin.ka,
  lat: berlin.center.lat,
  lng: berlin.center.lng,
})
assert.equal(r1.go, 'search')
assert.ok(r1.href.startsWith('/search?'))
assert.ok(r1.href.includes('deal=sale'))
assert.ok(r1.href.includes('country=DE'))
assert.ok(r1.href.includes(`city=${encodeURIComponent(berlin.ka)}`))
assert.ok(r1.href.includes('max=500000'))
assert.ok(r1.href.includes('rooms=2'))

const rKind = routeCountryNl({
  q: '',
  tab: 'buy',
  country: 'de',
  cityKa: berlin.ka,
  lat: berlin.center.lat,
  lng: berlin.center.lng,
  kind: 'apartment',
})
assert.equal(rKind.go, 'search')
assert.ok(rKind.href.includes('type=apartment'))
assert.ok(rKind.href.includes('deal=sale'))
assert.ok(rKind.href.includes('city=%E1%83%91%E1%83%94%E1%83%A0%E1%83%9A%E1%83%98%E1%83%9C%E1%83%98'))

// Free text with no place and no constraints rides as `q`.
const rFree = routeCountryNl({
  q: 'Alexanderplatz',
  tab: 'buy',
  country: 'de',
  cityKa: berlin.ka,
  lat: berlin.center.lat,
  lng: berlin.center.lng,
})
assert.equal(rFree.go, 'search')
assert.ok(rFree.href.includes('q=Alexanderplatz'))

const r2 = routeCountryNl({
  q: 'Neubau in Berlin Mitte',
  tab: 'buy',
  country: 'de',
  lat: berlin.center.lat,
  lng: berlin.center.lng,
})
assert.equal(r2.go, 'projects')

const r3 = routeCountryNl({
  q: 'B-Plan festgesetzt',
  tab: 'buy',
  country: 'de',
  lat: berlin.center.lat,
  lng: berlin.center.lng,
})
assert.equal(r3.go, 'map')
assert.ok(r3.href.includes('country=DE'))

// Test Intent & Match Reasoning
const invQ = parseNlQuery('quiet family apartment in Vake for high rental yield')
assert.equal(invQ.investmentGoal, true)
assert.equal(invQ.lifestyleGoal, 'quiet')

const matchResult = explainPropertyMatch(
  { maxPrice: 200000, bedrooms: 2, nearMetro: true, district: 'ვაკე' },
  { price: 195000, bedrooms: 2, district: 'ვაკე', nearMetro: true }
)
assert.equal(matchResult.matchPercentage, 100)
assert.equal(matchResult.matched, 4)
assert.equal(matchResult.criteria, 4)
assert.ok(matchResult.reasons.length >= 3)

const enStar = parseNlQuery(
  '2-bedroom Berlin apartment under €2,000, quiet, balcony, lots of light, within 30 minutes of Mitte',
)
assert.equal(enStar.bedrooms, 2)
assert.equal(enStar.propertyType, 'apartment')
assert.equal(enStar.city, 'ბერლინი')
assert.equal(enStar.district, undefined, 'commute destination is not a district pin')
assert.equal(enStar.maxPrice, 2000)
assert.equal(enStar.dealType, 'rent')
assert.equal(enStar.currency, 'EUR')
assert.equal(enStar.lifestyleGoal, 'quiet')
assert.ok(enStar.features?.includes('add.f.balcony'))
assert.ok(enStar.features?.includes('add.f.bright'))
assert.equal(enStar.commute?.place, 'Mitte')
assert.equal(enStar.commute?.minutes, 30)
assert.equal(enStar.commute?.mode, 'transit')
const enPatch = nlToSearchPatch(enStar)
assert.equal(enPatch.deal, 'rent')
assert.equal(enPatch.district, undefined)
assert.equal(enPatch.cplace, 'Mitte')
assert.equal(enPatch.cmin, '30')
assert.ok(enPatch.west && enPatch.south && enPatch.east && enPatch.north)
assert.equal(enPatch.life, 'quiet')

const fromUrl = nlFromSearchParams(
  new URLSearchParams(Object.entries(enPatch).filter((e): e is [string, string] => Boolean(e[1]))),
)
assert.equal(fromUrl.commute?.place, 'Mitte')
assert.equal(fromUrl.dealType, 'rent')
assert.equal(fromUrl.lifestyleGoal, 'quiet')

// § 3 north-star example, in German — the full structured parse must survive.
const deQ = parseNlQuery(
  'Ruhige 2-Zimmer-Wohnung in Berlin unter 2.000 €, innerhalb 30 Minuten von Mitte, Balkon bevorzugt, helles Bad, kein Erdgeschoss',
)
assert.equal(deQ.rooms, 2)
assert.equal(deQ.city, 'ბერლინი')
assert.equal(deQ.district, undefined, 'innerhalb 30 Minuten von Mitte is commute, not Bezirk Mitte')
assert.equal(deQ.commute?.place, 'Mitte')
assert.equal(deQ.commute?.minutes, 30)
assert.equal(deQ.maxPrice, 2000)
assert.equal(deQ.dealType, 'rent')
assert.equal(deQ.currency, 'EUR')
assert.equal(deQ.lifestyleGoal, 'quiet')
assert.equal(deQ.floorMin, 1)
assert.ok(deQ.features!.includes('add.f.balcony'))
assert.ok(deQ.features!.includes('add.f.bright'))
const dePatch = nlToSearchPatch(deQ)
assert.equal(dePatch.fmin, '1')
assert.equal(dePatch.cur, 'EUR')
assert.equal(dePatch.deal, 'rent')
assert.equal(dePatch.cplace, 'Mitte')
assert.ok(!dePatch.district)

assert.equal(parseNlQuery('2 Zimmer Wohnung in Berlin unter 500.000 €').dealType, 'sale')
assert.equal(nlToSearchPatch(deBerlin).metro, '1')

// German garden/terrace/cellar wording maps to the real feature keys.
const gartenQ = parseNlQuery('Haus mit Garten und Terrasse in Potsdam kaufen, Keller bevorzugt')
for (const key of ['add.f.yard', 'add.f.terrace', 'add.f.cellar']) {
  assert.ok(gartenQ.features!.includes(key), `missing ${key}`)
}

console.log('ok: nl-search')
