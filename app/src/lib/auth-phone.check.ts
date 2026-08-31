/**
 * Self-check for phone-auth identity helpers.
 * Run: npx tsx src/lib/auth-phone.check.ts
 */
import assert from "node:assert/strict"

import {
  accountLabel,
  displayFromEmail,
  isPhoneEmail,
  phoneEmail,
} from "./auth-phone"

assert.equal(phoneEmail("+995 555 12 34 56"), "p995555123456@phone.sivrce.internal")
assert.equal(phoneEmail("+995555123456"), "p995555123456@phone.sivrce.internal")
assert.equal(isPhoneEmail("p995555123456@phone.sivrce.internal"), true)
assert.equal(isPhoneEmail("you@email.com"), false)
assert.equal(displayFromEmail("p995555123456@phone.sivrce.internal"), "+995 555 12 34 56")
assert.equal(displayFromEmail("you@email.com"), "you@email.com")
assert.equal(accountLabel("Nino", "p995555123456@phone.sivrce.internal"), "Nino")
assert.equal(accountLabel(null, "p995555123456@phone.sivrce.internal"), "+995 555 12 34 56")

console.log("auth-phone.check: ok")
