import assert from "node:assert/strict"

import {
  LISTING_LIFETIME_MS,
  listingExpiresAt,
  listingFilterStatus,
  listingLifeRemaining,
} from "./lifetime"

const t0 = Date.parse("2026-07-01T12:00:00Z")

assert.equal(listingExpiresAt(new Date(t0)).getTime(), t0 + LISTING_LIFETIME_MS)
assert.equal(listingLifeRemaining(new Date(t0), t0), 1)
assert.equal(listingLifeRemaining(new Date(t0), t0 + LISTING_LIFETIME_MS / 2), 0.5)
assert.equal(listingLifeRemaining(new Date(t0), t0 + LISTING_LIFETIME_MS), 0)
assert.equal(listingFilterStatus("active", new Date(t0), t0 + LISTING_LIFETIME_MS + 1), "expired")
assert.equal(listingFilterStatus("withdrawn", new Date(t0), t0 + LISTING_LIFETIME_MS + 1), "withdrawn")
assert.equal(listingFilterStatus("active", new Date(t0), t0), "active")

console.log("listings/lifetime.check.ts: ok")
