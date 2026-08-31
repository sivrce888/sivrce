import assert from "node:assert/strict"
import { cdnJson } from "./cdn-cache"
import { generateAllSeoParams, generateSeoBuildParams } from "./seo-pages"

const build = generateSeoBuildParams()
const all = generateAllSeoParams()
assert.ok(build.length < 80, `build hubs ${build.length} too many`)
assert.ok(all.length > 100, "sitemap set shrank — crawler coverage")
assert.ok(build.some((s) => s.join("/") === "sale"))
assert.ok(build.some((s) => s.join("/") === "sale/apartments/tbilisi"))
assert.ok(!build.some((s) => s.length >= 4), "district/room pages must stay on-demand ISR")
assert.match(cdnJson({ ok: true }, 60).headers.get("Cache-Control") ?? "", /s-maxage=60/)

console.log(`cdn-cache/seo-build: ${build.length} hubs vs ${all.length} sitemap ✓`)
