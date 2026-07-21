/**
 * Live Nominatim smoke — npm run check:geocode already covers pure logic.
 * Run: npx tsx src/lib/map/geocode.live.check.ts
 */
import assert from 'node:assert/strict'
import {
  geocodeListingAddress,
  reverseGeocode,
  suggestAddresses,
} from './geocode'

async function main() {
  const hit = await geocodeListingAddress({
    street: 'ილია ჭავჭავაძის გამზირი',
    houseNo: '47',
    city: 'თბილისი',
  })
  assert.ok(hit, 'listing geocode miss')
  assert.ok(hit.houseNo === '47' || hit.lat > 41.7, 'expected Vake pin')
  assert.ok(Math.abs(hit.lat - 41.7118) < 0.01)
  assert.ok(Math.abs(hit.lng - 44.7477) < 0.01)

  const sug = await suggestAddresses('ჭავჭავაძის 47', 'თბილისი')
  assert.ok(sug.length >= 1, 'suggest empty')

  const rev = await reverseGeocode(41.7098, 44.7723)
  assert.ok(rev?.street, 'reverse missing street')
  assert.equal(rev.city, 'თბილისი')

  // Digomi Massiv II / building 13 — must not land on V კვარტალი (~41.765).
  const digomi = await geocodeListingAddress({
    street: 'მეორე კვარტალი',
    houseNo: '13',
    district: 'დიღმის მასივი',
    city: 'თბილისი',
  })
  assert.ok(digomi, 'Digomi II/13 miss')
  assert.ok(Math.abs(digomi.lat - 41.75486) < 0.005, `Digomi lat ${digomi.lat}`)
  assert.ok(Math.abs(digomi.lng - 44.77269) < 0.005, `Digomi lng ${digomi.lng}`)

  const digomiCatalog = await geocodeListingAddress({
    street: 'დიღმის მასივი, II კვარტალი',
    houseNo: '13',
    district: 'დიღმის მასივი',
    city: 'თბილისი',
  })
  assert.ok(digomiCatalog, 'Digomi catalog label miss')
  assert.ok(Math.abs(digomiCatalog.lat - 41.75486) < 0.005)

  const gldani = await geocodeListingAddress({
    street: 'გლდანის მე-5 მიკრო რაიონი',
    city: 'თბილისი',
  })
  assert.ok(gldani, 'Gldani 5 miss')
  assert.ok(Math.abs(gldani.lat - 41.80054) < 0.005, `Gldani lat ${gldani.lat}`)

  // Nominatim false-hits მე-7 — catalog coords must win.
  const vark3 = await geocodeListingAddress({
    street: 'ვარკეთილის მე-3 მასივი, მე-3 კვარტალი',
    city: 'თბილისი',
  })
  assert.ok(vark3, 'Varketili III/3 miss')
  assert.ok(Math.abs(vark3.lat - 41.68783) < 0.002, `Varketili3 lat ${vark3.lat}`)
  assert.ok(Math.abs(vark3.lng - 44.88001) < 0.002, `Varketili3 lng ${vark3.lng}`)

  console.log('geocode.live: ok', {
    pin: `${hit.lat.toFixed(5)},${hit.lng.toFixed(5)}`,
    street: hit.street,
    suggests: sug.length,
    reverse: rev.street,
    digomi: `${digomi.lat.toFixed(5)},${digomi.lng.toFixed(5)}`,
    gldani: `${gldani.lat.toFixed(5)},${gldani.lng.toFixed(5)}`,
    vark3: `${vark3.lat.toFixed(5)},${vark3.lng.toFixed(5)}`,
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
