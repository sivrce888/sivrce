/**
 * Self-check for phone mask / normalize — run: npx tsx src/lib/inquiries/phone.check.ts
 */
import assert from 'node:assert/strict'
import { CONTACT_PHONE, formatPhone, maskPhone, normalizePhone, phoneRevealsOf, telHref, waHref } from './phone'

// Switchboard must stay dialable through the canonical formatter — display keeps
// the owner's `500 333 111` grouping.
assert.equal(normalizePhone(CONTACT_PHONE)?.replace(/\D/g, ''), CONTACT_PHONE.replace(/\D/g, ''))
assert.equal(telHref(CONTACT_PHONE), 'tel:+995500333111')
assert.equal(waHref(CONTACT_PHONE), 'https://wa.me/995500333111')

assert.equal(maskPhone('+995 555 12 34 56'), '555 *** ***')
assert.equal(maskPhone('555123456'), '555 *** ***')
assert.equal(maskPhone('12'), '*** *** ***')
assert.equal(normalizePhone('555123456'), '+995 555 12 34 56')
assert.equal(formatPhone('555123456'), '+995 555 12 34 56')
assert.equal(telHref('+995 555 12 34 56'), 'tel:+995555123456')
assert.equal(waHref('+995 555 12 34 56'), 'https://wa.me/995555123456')
assert.equal(
  waHref('+995 555 12 34 56', 'გამარჯობა'),
  'https://wa.me/995555123456?text=' + encodeURIComponent('გამარჯობა'),
)
assert.equal(phoneRevealsOf({ phoneReveals: 3 }), 3)
assert.equal(phoneRevealsOf(null), 0)
assert.equal(phoneRevealsOf({ phoneReveals: -1 }), 0)

console.log('phone.check: ok')
