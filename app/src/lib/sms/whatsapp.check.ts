/**
 * Run: npx tsx src/lib/sms/whatsapp.check.ts
 * Does not hit Twilio — only validates phone gating helpers.
 */
import assert from "node:assert/strict"
import { toE164 } from "@/lib/sms/twilio-verify"

assert.equal(toE164("+995 555 12 34 56"), "+995555123456")
assert.equal(toE164("+995555123456"), "+995555123456")
assert.equal(toE164("555123456"), null)
console.log("whatsapp.check: ok")
