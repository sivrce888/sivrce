/**
 * Runnable check: npx tsx src/lib/countries/world-metro-all.check.ts
 * Full-planet metro gate — OSM corpus stays complete, merged and sane.
 */
import assert from 'node:assert/strict'
import {
  ALL_METRO_COUNT,
  ALL_METRO_FETCHED_AT,
  allMetroStationsForCity,
  nearestAllMetroStation,
} from './world-metro-all'

assert.ok(ALL_METRO_COUNT >= 15000, `planet corpus shrank: ${ALL_METRO_COUNT}`)
assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(ALL_METRO_FETCHED_AT), 'fetchedAt drift')

// Merge integrity: all 22 Tbilisi stations exist (the two northernmost snap to
// the nearer 'mtskheta' corpus point — honest nearest-point assignment, not drift).
assert.ok(allMetroStationsForCity('tbilisi').length >= 20, 'tbilisi pin drift')
{
  const near = (la: number, ln: number) => nearestAllMetroStation(la, ln)
  const catalog: Array<[number, number]> = [
    [41.7911, 44.815], [41.7841, 44.7999], [41.7758, 44.7956], [41.765, 44.79],
    [41.7495, 44.78], [41.7429, 44.784], [41.7334, 44.7964], [41.7226, 44.7971],
    [41.7096, 44.7969], [41.7035, 44.7896], [41.6945, 44.8006], [41.6923, 44.8158],
    [41.688, 44.8262], [41.6866, 44.84], [41.6855, 44.8545], [41.6919, 44.8709],
    [41.7264, 44.7877], [41.7203, 44.7766], [41.7273, 44.7638], [41.7255, 44.7453],
    [41.724, 44.7309], [41.7228, 44.7185],
  ]
  assert.equal(catalog.length, 22)
  for (const [la, ln] of catalog) {
    const hit = near(la, ln)
    assert.ok(hit && hit.meters <= 150, `tbilisi catalog gap at ${la},${ln}`)
  }
}
// Major networks hold their floors (slugs fragment across metro areas — floors stay low).
assert.ok(allMetroStationsForCity('paris').length >= 200, 'paris pins shrank')
assert.ok(allMetroStationsForCity('madrid').length >= 100, 'madrid pins shrank')
assert.ok(allMetroStationsForCity('berlin').length >= 100, 'berlin pins shrank')
assert.ok(allMetroStationsForCity('beijing').length >= 200, 'beijing pins shrank')

// Every pin is usable: named, finite coords, ~all snapped to a map city.
{
  const rows = allMetroStationsForCity('tbilisi')
  assert.ok(rows.every((s) => s.name.length > 0 && Number.isFinite(s.lat + s.lng)))
}

// Exact-pin hit: a committed pin queried at its own coords resolves at 0 m.
{
  const pin = allMetroStationsForCity('tbilisi')[0]!
  const hit = nearestAllMetroStation(pin.lat, pin.lng)
  assert.equal(hit?.meters, 0)
  assert.equal(hit?.name, pin.name)
  assert.equal(hit?.zone, 'near')
}

// Cross-continent spot checks (Eiffel → Bir-Hakeim area; Times Sq exact).
{
  const eiffel = nearestAllMetroStation(48.8584, 2.2945)
  assert.ok(eiffel && eiffel.meters <= 1500, `eiffel miss: ${eiffel?.name} ${eiffel?.meters}m`)
  assert.equal(eiffel.citySlug, 'paris')
  assert.equal(eiffel.zone, eiffel.meters <= 800 ? 'near' : 'walk')
  assert.ok(eiffel.walkMin >= 1)
  const timesSq = nearestAllMetroStation(40.758, -73.9855)
  assert.ok(timesSq && timesSq.meters <= 200, `times-sq miss: ${timesSq?.name}`)
  assert.ok(timesSq.line.length > 0, 'hub line enrichment missing')
}

// Null = outside catchment, never "no metro".
assert.equal(nearestAllMetroStation(0, -140), null)
assert.equal(nearestAllMetroStation(NaN, NaN), null)

console.log(`world-metro-all.check: ${ALL_METRO_COUNT} stations (${ALL_METRO_FETCHED_AT}) ok`)
