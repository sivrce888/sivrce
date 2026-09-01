/**
 * Runnable check: IndexNow URL filter + key shape.
 * Run: npx tsx src/lib/indexnow.check.ts
 */
import assert from "node:assert/strict"
import { INDEXNOW_KEY, INDEXNOW_KEY_URL, listingIndexUrl } from "./indexnow"

assert.ok(/^[a-f0-9]{32}$/.test(INDEXNOW_KEY), "IndexNow key must be 32 hex")
assert.equal(INDEXNOW_KEY_URL, `https://sivrce.ge/${INDEXNOW_KEY}.txt`)
assert.equal(listingIndexUrl("abc"), "https://sivrce.ge/listing/abc")
assert.ok(!listingIndexUrl("abc").includes("evil.com"))

console.log("indexnow.check: ok")
