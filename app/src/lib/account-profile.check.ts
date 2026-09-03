/**
 * Runnable check for account profile parsers.
 * Run: npx tsx src/lib/account-profile.check.ts
 */
import assert from "node:assert/strict"

import {
  DELETE_CONFIRM,
  isDeleteConfirm,
  parseAccountPhone,
  parseDisplayName,
} from "./account-profile"

assert.equal(parseDisplayName("  ნინო  გელაშვილი ").ok, true)
assert.equal(parseDisplayName("ა").ok, false)
assert.equal(parseDisplayName("").ok, false)

const phone = parseAccountPhone("555123456")
assert.equal(phone.ok, true)
if (phone.ok) assert.equal(phone.phone, "+995 555 12 34 56")

const empty = parseAccountPhone("  ")
assert.equal(empty.ok, true)
if (empty.ok) assert.equal(empty.phone, null)

assert.equal(parseAccountPhone("12").ok, false)
assert.equal(isDeleteConfirm(DELETE_CONFIRM), true)
assert.equal(isDeleteConfirm("delete"), false)

console.log("account-profile.check: ok")
