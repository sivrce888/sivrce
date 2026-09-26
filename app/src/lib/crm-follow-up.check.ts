/**
 * Run: npx tsx src/lib/crm-follow-up.check.ts
 */
import assert from "node:assert/strict"

import { endOfToday, followUpInputValue, followUpState, parseFollowUp } from "./crm-follow-up"

const now = new Date("2026-09-26T21:30:00Z") // 01:30 next day in Tbilisi — UTC day still rules
const fd = (entries: Record<string, string>) => {
  const f = new FormData()
  for (const [k, v] of Object.entries(entries)) f.set(k, v)
  return f
}

// Presets land on UTC noon N days ahead.
assert.equal(parseFollowUp(fd({ followUpDays: "0" }), now)?.toISOString(), "2026-09-26T12:00:00.000Z")
assert.equal(parseFollowUp(fd({ followUpDays: "7" }), now)?.toISOString(), "2026-10-03T12:00:00.000Z")
// The pressed preset beats a typed date.
assert.equal(
  parseFollowUp(fd({ followUpDays: "1", followUpDate: "2026-12-01" }), now)?.toISOString(),
  "2026-09-27T12:00:00.000Z",
)
assert.throws(() => parseFollowUp(fd({ followUpDays: "5" }), now))
assert.throws(() => parseFollowUp(fd({ followUpDays: "-1" }), now))

// Custom dates: valid, rollover, past, far future, garbage.
assert.equal(parseFollowUp(fd({ followUpDate: "2026-10-15" }), now)?.toISOString(), "2026-10-15T12:00:00.000Z")
assert.equal(parseFollowUp(fd({ followUpDate: "2026-09-26" }), now)?.toISOString(), "2026-09-26T12:00:00.000Z")
assert.throws(() => parseFollowUp(fd({ followUpDate: "2026-02-31" }), now))
assert.throws(() => parseFollowUp(fd({ followUpDate: "2026-09-25" }), now))
assert.throws(() => parseFollowUp(fd({ followUpDate: "2029-01-01" }), now))
assert.throws(() => parseFollowUp(fd({ followUpDate: "tomorrow" }), now))
assert.equal(parseFollowUp(fd({}), now), null)
assert.equal(parseFollowUp(fd({ followUpDate: "" }), now), null)

// States by calendar day, not by hour.
assert.equal(followUpState(null, now), "none")
assert.equal(followUpState(new Date("2026-09-25T12:00:00Z"), now), "overdue")
assert.equal(followUpState(new Date("2026-09-26T12:00:00Z"), now), "today")
assert.equal(followUpState(new Date("2026-09-27T12:00:00Z"), now), "upcoming")

// A follow-up set for today is inside the "due now" window.
assert.ok(new Date("2026-09-26T12:00:00Z") <= endOfToday(now))
assert.ok(new Date("2026-09-27T12:00:00Z") > endOfToday(now))
assert.equal(followUpInputValue(new Date("2026-10-15T12:00:00Z")), "2026-10-15")
assert.equal(followUpInputValue(null), "")

console.log("crm-follow-up.check: ok")
