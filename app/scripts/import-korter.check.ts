/**
 * Self-check: korter redirect → official site URL + door number parse.
 * Run: npx tsx scripts/import-korter.check.ts
 */
import assert from "node:assert/strict"
import { officialWebsite, buildingNumberOf } from "../src/lib/directory/sync-korter"

assert.equal(
  officialWebsite({
    url: "/redirect?category=click_building&action=developer_page_site&to=https%3A%2F%2Farchi.ge%2Fru&checksum=abc",
    name: "archi.ge",
  }),
  "https://archi.ge/ru",
)
assert.equal(officialWebsite({ name: "m2.ge" }), "https://m2.ge")
assert.equal(officialWebsite(null), "")
assert.equal(buildingNumberOf("ჩავჭავაძის გამზ. 37, ვაკე"), "37")
assert.equal(buildingNumberOf("Vakhtang Gorgasali St, 99"), "99")
assert.equal(buildingNumberOf("ვაკე"), "")
console.log("import-korter.check: ok")
