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
  // Fluid / Apple-level chrome — build fails if these regress to breakpoint jumps
  "--sv-gutter: clamp(",
  "--sv-card-min:",
  "--sv-type-title: clamp(",
  "--sv-type-h1: clamp(",
  "--sv-type-display: clamp(",
  "line-height: 1.18",
  "min-width: 26rem",
  "overflow-x: clip",
  "text-size-adjust: 100%",
  "repeat(auto-fill, minmax(min(100%, var(--sv-card-min))",
  "sv-card-grid",
  "sv-card-specs",
  "max(var(--sv-gutter), env(safe-area-inset-left",
  "img, video, iframe, canvas",
], ["overflow-x: hidden"])
lock("src/components/ListingCard.tsx", ["@container", "sv-card-specs", "w-[clamp(16.5rem,82%,23.75rem)]"], [
  "sm:w-[380px]",
  "grid-cols-4",
])
lock("src/components/search/SearchClient.tsx", ["sv-card-grid"], [
  "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
])
lock("src/components/seo/SeoFilterableListings.tsx", ["sv-card-grid"], [
  "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
])
lock("src/components/sections/Footer.tsx", ["sv-link-grid", "minmax(0,1.3fr)"], ["xl:grid-cols-5"])
lock("src/components/sections/HeroBackground.tsx", ["sv-skyline-front"], ["min-w-[900px]"])
lock("src/components/HScroll.tsx", ["min-w-0 max-w-full"])
lock("src/components/Reveal.tsx", ["data-reveal"], ["reducedMotion=\"never\""])
lock("src/components/I18nProvider.tsx", ['reducedMotion="user"'], ['reducedMotion="never"'])
lock("src/app/[lang]/layout.tsx", [
  "LITE_BOOT",
  "beforeInteractive",
  "suppressHydrationWarning",
  'viewportFit: "cover"',
], ["maximumScale"])
lock("src/app/auth/layout.tsx", [
  "LITE_BOOT",
  "beforeInteractive",
  "suppressHydrationWarning",
  'viewportFit: "cover"',
], ["maximumScale"])
lock("src/components/map/Map3D.tsx", ["...mapRuntimeOptions()"])
lock("src/components/map/BuildingFloorsMap.tsx", ["...mapRuntimeOptions()"])
lock("src/components/search/SearchMapView.tsx", [
  "...mapRuntimeOptions()",
  "new ResizeObserver",
  "STYLE_SATELLITE",
  "mapStyleUrl(dark)",
])
lock("src/lib/db.ts", ["max: 1"], ["max: 10"])
lock("sentry.client.config.ts", ["replaysSessionSampleRate: 0"], ["replaysSessionSampleRate: 1"])

console.log("device-budget: ssr-safe + glitch locks ✓")
