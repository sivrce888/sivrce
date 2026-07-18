/**
 * Self-check for phone mask / normalize — run: npx tsx src/lib/inquiries/phone.check.ts
 */
import assert from 'node:assert/strict'
import { formatPhone, maskPhone, normalizePhone, phoneRevealsOf, telHref } from './phone'

assert.equal(maskPhone('+995 555 12 34 56'), '555 *** ***')
assert.equal(maskPhone('555123456'), '555 *** ***')
assert.equal(maskPhone('12'), '*** *** ***')
assert.equal(normalizePhone('555123456'), '+995 555 12 34 56')
assert.equal(formatPhone('555123456'), '+995 555 12 34 56')
assert.equal(telHref('+995 555 12 34 56'), 'tel:+995555123456')
assert.equal(phoneRevealsOf({ phoneReveals: 3 }), 3)
assert.equal(phoneRevealsOf(null), 0)
assert.equal(phoneRevealsOf({ phoneReveals: -1 }), 0)

console.log('phone.check: ok')
