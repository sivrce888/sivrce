/**
 * Self-check for review aggregate → denormalized profile rating sync.
 * Run: npx tsx src/lib/reviews/reviews.check.ts
 */
import assert from "node:assert/strict"
import { config } from "dotenv"

// aggregate.ts imports db.ts, which builds the pg pool at import time.
config({ path: ".env.local" })
config({ path: ".env" })

async function main() {
  const { profileRatingUpdate } = await import("./aggregate")
  const { parseReviewFields } = await import("./validate")

  // Rated profile targets carry reviewsCount; unrated ones don't.
  assert.deepEqual(profileRatingUpdate("agent", 3, 4.6667), {
    rating: 4.7,
    reviewsCount: 3,
  })
  assert.deepEqual(profileRatingUpdate("agency", 1, 5), { rating: 5, reviewsCount: 1 })
  assert.deepEqual(profileRatingUpdate("developer", 7, 3.2), { rating: 3.2 })

  // Unknown targets are not synced; emptied targets zero out (truth over seeds).
  assert.equal(profileRatingUpdate("listing", 2, 4), null)
  assert.equal(profileRatingUpdate("service", 2, 4), null)
  assert.deepEqual(profileRatingUpdate("agent", 0, null), { rating: 0, reviewsCount: 0 })

  // Average rounds to one decimal, matching getReviewAggregate display rounding.
  assert.equal(profileRatingUpdate("agent", 2, 4.25)?.rating, 4.3)
  assert.equal(profileRatingUpdate("agent", 2, 4.24)?.rating, 4.2)

  // Field validation shared by POST/PUT — trust boundary.
  assert.deepEqual(parseReviewFields({ rating: 4, body: "  great work here  ", title: " ok " }), {
    ok: true,
    data: { rating: 4, body: "great work here", title: "ok" },
  })
  assert.equal(parseReviewFields({ rating: 0, body: "great work here" }).ok, false)
  assert.equal(parseReviewFields({ rating: 4.5, body: "great work here" }).ok, false)
  assert.equal(parseReviewFields({ rating: 4, body: "short" }).ok, false)
  assert.equal(parseReviewFields({ rating: 4, body: "x".repeat(2001) }).ok, false)
  assert.equal(parseReviewFields({ rating: 4, body: "great work here", title: "x".repeat(201) }).ok, false)
  assert.equal(parseReviewFields("junk").ok, false)

  // Rate limiter: default budget + per-endpoint overrides (payments checkout).
  const { rateLimitOk } = await import("../rate-limit")
  assert.equal(rateLimitOk("t:default"), true)
  for (let i = 1; i < 10; i++) assert.equal(rateLimitOk("t:default"), true)
  assert.equal(rateLimitOk("t:default"), false)
  assert.equal(rateLimitOk("t:over", { max: 2 }), true)
  assert.equal(rateLimitOk("t:over", { max: 2 }), true)
  assert.equal(rateLimitOk("t:over", { max: 2 }), false)
  assert.equal(rateLimitOk("t:window", { windowMs: 50 }), true)
  await new Promise((r) => setTimeout(r, 60))
  assert.equal(rateLimitOk("t:window", { windowMs: 50 }), true) // window reset

  // Retry-After math, and the RAM ceiling under key-spraying abuse.
  const { rateLimit, trackedKeys, clientIp } = await import("../rate-limit")
  const t0 = 1_000_000
  assert.deepEqual(rateLimit("t:retry", { max: 1, windowMs: 30_000 }, t0), { ok: true, retryAfterSec: 0 })
  assert.deepEqual(rateLimit("t:retry", { max: 1, windowMs: 30_000 }, t0 + 10_500), { ok: false, retryAfterSec: 20 })
  for (let i = 0; i < 6000; i++) rateLimit(`t:spray:${i}`, { windowMs: 1e9 })
  assert.ok(trackedKeys() <= 5000, `limiter must cap tracked keys, has ${trackedKeys()}`)
  assert.equal(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" })), "1.2.3.4")
  assert.equal(clientIp(new Headers({ "x-forwarded-for": "", "x-real-ip": "5.6.7.8" })), "5.6.7.8")
  assert.equal(clientIp(new Headers()), "unknown")

  console.log("reviews.check: all assertions passed")
}

main()
