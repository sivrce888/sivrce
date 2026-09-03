import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { FULL_TILE_CACHE, LITE_BOOT, isLiteDevice, mapRuntimeOptions } from "./device-budget"

assert.equal(typeof window, "undefined")
assert.equal(isLiteDevice(), false)

const map = mapRuntimeOptions()
assert.equal(map.antialias, true)
assert.equal(map.maxTileCacheSize, FULL_TILE_CACHE)
assert.equal(map.collectResourceTiming, false)
assert.equal(map.preserveDrawingBuffer, false)
assert.ok(map.maxTileCacheSize <= FULL_TILE_CACHE)

assert.ok(LITE_BOOT.includes("data-lite"))
assert.ok(LITE_BOOT.includes("sv-lite"))
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
  "accent-color: var(--sv-blue)",
  "scrollbar-color:",
  ".sv-spinner",
  "-webkit-tap-highlight-color:",
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
  "/icons/favicon-32.png",
  "/apple-icon.png",
  "BRAND.colors.navy",
], ["maximumScale"])
lock("src/app/auth/layout.tsx", [
  "LITE_BOOT",
  "beforeInteractive",
  "suppressHydrationWarning",
  'viewportFit: "cover"',
  "/icons/favicon-32.png",
  "/apple-icon.png",
  "BRAND.colors.navy",
], ["maximumScale"])
lock("src/lib/map/maplibre-worker.ts", ["/maplibre/maplibre-gl-worker.mjs", "setWorkerUrl", "prewarm"], ["setWorkerCount"])
lock("src/components/map/Map3D.tsx", ["...mapRuntimeOptions()", "isLiteDevice()", "bindMaplibreWorker("], ["setWorkerCount"])
lock("src/components/map/BuildingFloorsMap.tsx", ["...mapRuntimeOptions()", "bindMaplibreWorker("], ["setWorkerCount"])
lock("src/components/search/SearchMapView.tsx", [
  "...mapRuntimeOptions()",
  "new ResizeObserver",
  "STYLE_SATELLITE",
  "mapStyleUrl(dark)",
  "from '@/lib/map/map-geo'",
  "bindMaplibreWorker(",
], ["from '@/lib/map/buildings'", "setWorkerCount"])
lock("src/components/MapEmbed.tsx", ["from '@/lib/map/map-geo'", "bindMaplibreWorker("], ["from '@/lib/map/buildings'", "from '@/lib/map/geocode'", "setWorkerCount"])
lock("src/lib/map/floorLayers.ts", ["from '@/lib/map/map-geo'"], ["from '@/lib/map/buildings'"])
lock("src/components/listing/ListingDetailClient.tsx", [
  "from '@/lib/map/map-href'",
  "from '@/lib/map/map-geo'",
  "next/dynamic",
  "import('@/lib/map/pois')",
], ["from '@/lib/map/buildings'", "from '@/lib/map/geocode'", "from '@/lib/map/pois'"])
lock("src/components/GoogleTags.tsx", ["isLiteDevice", "lazyOnload", "requestIdleCallback"], ["afterInteractive"])
lock("src/components/chat/ChatShell.tsx", ["next/dynamic"])
lock("src/lib/db.ts", ["max: 1"], ["max: 10"])
lock("sentry.client.config.ts", ["replaysSessionSampleRate: 0"], ["replaysSessionSampleRate: 1"])

for (const f of [
  "src/app/favicon.ico",
  "src/app/icon.png",
  "src/app/apple-icon.png",
  "public/icon.png",
  "public/apple-icon.png",
  "public/icons/favicon-32.png",
  "public/icons/icon-192.png",
  "public/icons/icon-512.png",
  "public/images/og-brand.png",
]) {
  assert.ok(existsSync(join(root, f)), `missing chrome asset ${f}`)
}

console.log("device-budget: ssr-safe + glitch locks ✓")
