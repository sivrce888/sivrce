/**
 * Cron auth + expire job pure helpers.
 * Run: npx tsx src/lib/jobs/expire-and-sync.check.ts
 */

import assert from "node:assert/strict"

import { listingExpiresAt, LISTING_LIFETIME_MS } from "@/lib/listings/lifetime"
import { assertCronAuth } from "@/lib/cron/auth"

const created = new Date("2020-01-01T00:00:00Z")
const exp = listingExpiresAt(created)
assert.equal(exp.getTime() - created.getTime(), LISTING_LIFETIME_MS)

process.env.CRON_SECRET = "test-secret"
assert.equal(
  assertCronAuth(new Request("http://x", { headers: { authorization: "Bearer wrong" } }))?.status,
  401,
)
assert.equal(
  assertCronAuth(
    new Request("http://x", { headers: { authorization: "Bearer test-secret" } }),
  ),
  null,
)

console.log("expire-and-sync.check: ok")
