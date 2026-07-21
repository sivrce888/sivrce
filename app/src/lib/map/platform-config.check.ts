/**
 * Self-check: map platform config parsers + style path lock.
 * Run: npx tsx src/lib/map/platform-config.check.ts
 */
import assert from "node:assert/strict"
import { CONFIG_REGISTRY, type ConfigValues } from "@/lib/config"
import { mapPlatformFromConfig } from "@/lib/map/platform-config"
import { FLOOR_STACKS_ENV } from "@/lib/map/floors"

const defaults = {} as ConfigValues
for (const key of Object.keys(CONFIG_REGISTRY) as (keyof ConfigValues)[]) {
  Object.assign(defaults, { [key]: CONFIG_REGISTRY[key].defaultValue })
}

const platform = mapPlatformFromConfig(defaults)
assert.equal(platform.defaultTerrain, "streets")
assert.equal(platform.minZoom, 7)
assert.equal(platform.center.lat, 41.7151)
assert.equal(platform.floorStacksEnabled, FLOOR_STACKS_ENV)
assert.match(platform.styleUrlLight, /^\/api\/map\/styles\//)

assert.equal(CONFIG_REGISTRY["map.styleUrlLight"].parse("https://evil.example/x"), null)
assert.equal(CONFIG_REGISTRY["map.styleUrlLight"].parse("/api/map/styles/liberty"), "/api/map/styles/liberty")
assert.equal(CONFIG_REGISTRY["map.floorStacksEnabled"].parse("true"), true)
assert.equal(CONFIG_REGISTRY["map.defaultTerrain"].parse("satellite"), "satellite")
assert.equal(CONFIG_REGISTRY["map.centerLat"].parse(50), null)
assert.ok(CONFIG_REGISTRY["map.centerLat"].parse(41.7) !== null)

console.log("platform-config.check: ok")
