/**
 * Twilio helpers (no network).
 * Run: npx tsx src/lib/sms/twilio-verify.check.ts
 */

import assert from "node:assert/strict"

import { toE164 } from "@/lib/sms/twilio-verify"

assert.equal(toE164("+995 555 12 34 56"), "+995555123456")
assert.equal(toE164("+995555123456"), "+995555123456")
assert.equal(toE164("bad"), null)

console.log("twilio-verify.check: ok")
