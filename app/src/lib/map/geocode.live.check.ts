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

  console.log('geocode.live: ok', {
    pin: `${hit.lat.toFixed(5)},${hit.lng.toFixed(5)}`,
    street: hit.street,
    suggests: sug.length,
    reverse: rev.street,
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
