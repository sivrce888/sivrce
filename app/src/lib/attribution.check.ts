import assert from "node:assert/strict"

import { normalizeSource } from "@/lib/attribution"

// utm sources keep sane chars, lowercase, capped.
assert.equal(normalizeSource("Telegram"), "telegram")
assert.equal(normalizeSource("  Google-Ads_01  "), "google-ads_01")
// Hostname cleanup.
assert.equal(normalizeSource("www.facebook.com"), "facebook.com")
// Hostile input → safe value.
assert.equal(normalizeSource("<script>x</script>"), "scriptxscript")
assert.equal(normalizeSource("x".repeat(100)), "x".repeat(60))
// Empty / null → explicit direct.
assert.equal(normalizeSource(""), "direct")
assert.equal(normalizeSource(null), "direct")
assert.equal(normalizeSource("///"), "direct")

console.log("attribution.check: OK")
