import assert from 'node:assert/strict'
import { DE_CITIES } from './countries/de'
import {
  countryNlNeedsGeocode,
  isOfficialGeoQuery,
  mergeNl,
  nlHasStructure,
  nlToSearchPatch,
  parseNlQuery,
  routeCountryNl,
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
assert.equal(countryNlNeedsGeocode('Alexanderplatz'), true)
assert.equal(countryNlNeedsGeocode('2 Zimmer Berlin'), false)

const berlin = DE_CITIES.find((c) => c.slug === 'berlin')!
const r1 = routeCountryNl({
  q: '2 Zimmer Wohnung in Berlin unter 500.000 € mit Balkon',
  tab: 'buy',
  country: 'de',
  cityKa: berlin.ka,
  lat: berlin.center.lat,
  lng: berlin.center.lng,
})
assert.equal(r1.go, 'map')
assert.ok(r1.href.includes('deal=sale'))
assert.ok(r1.href.includes(`lat=${berlin.center.lat.toFixed(5)}`))

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

// North-star queries — structured filters, never a keyword dump.
const ns1 = parseNlQuery('2 bedroom apartment in Tbilisi under $150,000 near metro with balcony')
assert.equal(ns1.bedrooms, 2)
assert.equal(ns1.propertyType, 'apartment')
assert.equal(ns1.city, 'თბილისი')
assert.equal(ns1.maxPrice, 150000)
assert.equal(ns1.nearMetro, true)
assert.ok(ns1.features?.includes('add.f.balcony'))
assert.equal(nlToSearchPatch(ns1).metro, '1')
assert.equal(nlToSearchPatch(ns1).max, '150000')
assert.equal(nlToSearchPatch(ns1).q, undefined)

const ns2 = parseNlQuery('new development in Berlin under €5,000/m²')
assert.equal(ns2.city, 'ბერლინი')
assert.equal(ns2.buildingStatus, 'add.status.new')
assert.equal(ns2.maxPrice, undefined, '€/m² is not a purchase cap')
assert.equal(ns2.currency, 'EUR')
assert.equal(ns2.nearMetro, undefined)
const rNs2 = routeCountryNl({
  q: 'new development in Berlin under €5,000/m²',
  tab: 'buy',
  country: 'de',
  lat: berlin.center.lat,
  lng: berlin.center.lng,
})
assert.equal(rNs2.go, 'projects')

const ns3 = parseNlQuery('investment property with high rental yield')
assert.equal(ns3.keywords, 'investment property with high rental yield')
assert.equal(nlHasStructure(ns3), false, 'no yield index — keep as Meili keywords, never fake a cap-rate filter')

const kaMetro = parseNlQuery('ბინა თბილისი მეტროსთან')
assert.equal(kaMetro.nearMetro, true)
assert.equal(parseNlQuery('Wohnung Berlin nahe U-Bahn').nearMetro, undefined)
assert.equal(parseNlQuery('Neubauwohnung Berlin').buildingStatus, 'add.status.new')

console.log('ok: nl-search')
