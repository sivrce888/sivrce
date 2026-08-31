import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { LITE_BOOT, isLiteDevice, mapRuntimeOptions } from "./device-budget"

assert.equal(typeof window, "undefined")
assert.equal(isLiteDevice(), false)

const map = mapRuntimeOptions()
assert.equal(map.antialias, true)
assert.equal(map.maxTileCacheSize, 80)
assert.equal(map.collectResourceTiming, false)
assert.equal(map.preserveDrawingBuffer, false)
assert.ok(map.maxTileCacheSize <= 80)

assert.ok(LITE_BOOT.includes("data-lite"))
assert.ok(LITE_BOOT.includes("deviceMemory"))
assert.ok(LITE_BOOT.includes("saveData"))
assert.ok(LITE_BOOT.includes("hardwareConcurrency"))
assert.ok(LITE_BOOT.includes("try{"))

const root = process.cwd()
const read = (rel: string) => readFileSync(join(root, rel), "utf8")
const lock = (file: string, need: string[], ban: string[] = []) => {
  const t = read(file)
  for (const s of need) assert.ok(t.includes(s), `${file} missing ${JSON.stringify(s)}`)
  for (const s of ban) assert.ok(!t.includes(s), `${file} unlocked ${JSON.stringify(s)}`)
}

lock("src/app/globals.css", [
  "html[data-lite] [data-reveal]",
  "opacity: 1 !important",
  "html[data-lite]",
])
lock("src/components/Reveal.tsx", ["data-reveal"], ["reducedMotion=\"never\""])
lock("src/components/I18nProvider.tsx", ['reducedMotion="user"'], ['reducedMotion="never"'])
lock("src/app/[lang]/layout.tsx", ["LITE_BOOT", "beforeInteractive", "suppressHydrationWarning"])
lock("src/app/auth/layout.tsx", ["LITE_BOOT", "beforeInteractive", "suppressHydrationWarning"])
lock("src/components/map/Map3D.tsx", ["...mapRuntimeOptions()"])
lock("src/components/map/BuildingFloorsMap.tsx", ["...mapRuntimeOptions()"])
lock("src/components/search/SearchMapView.tsx", [
  "...mapRuntimeOptions()",
  "new ResizeObserver",
  "STYLE_SATELLITE",
])
lock("src/lib/db.ts", ["max: 1"], ["max: 10"])
lock("sentry.client.config.ts", ["replaysSessionSampleRate: 0"], ["replaysSessionSampleRate: 1"])

console.log("device-budget: ssr-safe + glitch locks ✓")
