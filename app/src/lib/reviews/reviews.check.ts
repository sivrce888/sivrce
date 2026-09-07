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

  console.log("reviews.check: all assertions passed")
}

main()
