/**
 * Runnable check: npx tsx src/data/tbilisi-streets.check.ts
 */
import assert from 'node:assert/strict'
import { districtKaForStreet, streetCore } from './tbilisi-streets'

assert.equal(streetCore('ილია ჭავჭავაძის გამზირი'), 'ჭავჭავაძის')
assert.equal(districtKaForStreet('ილია ჭავჭავაძის გამზირი'), 'ვაკე')
assert.equal(districtKaForStreet('ჭავჭავაძის გამზირი'), 'ვაკე')
assert.equal(districtKaForStreet('ჭავჭავაძის გამზ.'), 'ვაკე')
assert.equal(districtKaForStreet('ვაჟა-ფშაველას გამზირი'), 'საბურთალო')
assert.equal(districtKaForStreet('შოთა რუსთაველის გამზირი'), 'მთაწმინდა')
// Bare surname — ambiguous (გამზირი vs ქუჩა); do not guess.
assert.equal(districtKaForStreet('ჭავჭავაძის'), undefined)

console.log('tbilisi-streets.check: ok')
