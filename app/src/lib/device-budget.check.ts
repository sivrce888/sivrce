import assert from "node:assert/strict"
import { existsSync, readFileSync, readdirSync } from "node:fs"
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
// Reduced motion is an animation preference, never a hardware budget. Folding
// it back in silently downgrades capable machines to antialias:off + pixelRatio
// 1.25 + 2D map. Motion is handled by globals.css / Reveal / MotionConfig / camMs.
assert.ok(
  !LITE_BOOT.includes("prefers-reduced-motion"),
  "LITE_BOOT must not treat reduced motion as a lite device",
)

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
lock("src/components/ListingCard.tsx", ["@container", "sv-card-specs", "w-[clamp(16.5rem,82%,23.75rem)]", "use-nearest-metro"], [
  "sm:w-[380px]",
  "grid-cols-4",
  "from '@/lib/map/pois'",
])
// 1.1 MB POI JSON never joins initial client bundles — dynamic import only.
for (const f of [
  "src/components/buildings/BuildingsCatalog.tsx",
  "src/components/map/BuildingPanel.tsx",
  "src/components/listing/WalkScore.tsx",
  "src/components/map/Map3D.tsx",
]) {
  const t = read(f)
  assert.ok(t.includes("import('@/lib/map/pois')") || !t.includes("map/pois"), `${f} must lazy-load pois`)
  assert.ok(!t.includes("from '@/lib/map/pois'"), `${f} statically ships pois JSON`)
  assert.ok(!t.includes("require('@/lib/map/pois')"), `${f} require() still bundles pois`)
}
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
// framer-motion fully out of I18nProvider — the CSS reduce-motion block
// (globals.css) zeroes every transition/animation app-wide.
lock("src/components/I18nProvider.tsx", [], ["framer-motion"])
lock("src/app/globals.css", ["@media (prefers-reduced-motion: reduce)"], [])
lock("src/app/[lang]/layout.tsx", [
  "LITE_BOOT",
  'id="lite-boot"',
  "suppressHydrationWarning",
  'viewportFit: "cover"',
  "/icons/favicon-32.png",
  "/apple-icon.png",
  "BRAND.colors.navy",
], ["maximumScale"])
lock("src/app/auth/layout.tsx", [
  "suppressHydrationWarning",
  'viewportFit: "cover"',
  "/icons/favicon-32.png",
  "/apple-icon.png",
  "BRAND.colors.navy",
], ["LITE_BOOT", "maximumScale"])
lock("src/lib/map/maplibre-worker.ts", ["/maplibre/maplibre-gl-worker.mjs", "setWorkerUrl", "prewarm"], ["setWorkerCount"])
lock("src/components/map/Map3D.tsx", [
  "...mapRuntimeOptions()",
  "isLiteDevice()",
  "bindMaplibreWorker(",
  "bindBerlinGeoTiles(",
  "bindIconicLandmarks(",
  "pickBerlinFeature(",
  // Motion + atmosphere contract — see src/lib/map/atmosphere.ts
  "camMs(",
  "applyAtmosphere(",
  "setProjection(mapProjection(",
  // Chrome motion is CSS and honours reduce-motion; framer cost ~44 KB gz here.
  "motion-reduce:transition-none",
  "motion-safe:animate-in",
], ["setWorkerCount", "framer-motion"])
lock("src/components/map/BuildingFloorsMap.tsx", ["...mapRuntimeOptions()", "bindMaplibreWorker("], ["setWorkerCount"])
lock("src/components/search/SearchMapView.tsx", [
  "...mapRuntimeOptions()",
  "new ResizeObserver",
  "STYLE_SATELLITE",
  "mapStyleUrl(dark)",
  "from '@/lib/map/map-geo'",
  "bindMaplibreWorker(",
  "bindBerlinGeoTiles(",
  "bindIconicLandmarks(",
  "pickBerlinFeature(",
], ["from '@/lib/map/buildings'", "setWorkerCount"])
lock("src/components/MapEmbed.tsx", ["from '@/lib/map/map-geo'", "bindMaplibreWorker("], ["from '@/lib/map/buildings'", "from '@/lib/map/geocode'", "setWorkerCount"])
lock("src/components/listing/ListingDetailClient.tsx", [
  "from '@/lib/map/map-href'",
  "from '@/lib/map/map-geo'",
  "next/dynamic",
  "import('@/lib/map/pois')",
], ["from '@/lib/map/buildings'", "from '@/lib/map/geocode'", "from '@/lib/map/pois'"])
lock("src/components/GoogleTags.tsx", ["isLiteDevice", "lazyOnload", "requestIdleCallback"], ["afterInteractive"])
lock("src/components/chat/ChatShell.tsx", ["next/dynamic"])
lock("src/lib/db.ts", ["max: 1"], ["max: 10"])
lock("src/instrumentation-client.ts", ["requestIdleCallback"], ["@sentry/nextjs"])
// Server/edge SDK loads via dynamic import only — static import bloats every
// serverless cold start even with no DSN.
lock("src/instrumentation.ts", ["NEXT_PUBLIC_SENTRY_DSN", "await import"], ["import * as Sentry from"])
lock("sentry.client.init.ts", ["replaysSessionSampleRate: 0"], ["replaysSessionSampleRate: 1"])

// ponytail: RAM ceiling — every function >1024 MB or an unpinned API route fails the build
const vercel = JSON.parse(read("vercel.json")) as { functions: Record<string, { memory?: number }> }
for (const [glob, fn] of Object.entries(vercel.functions)) {
  assert.ok(fn.memory !== undefined, `${glob} has no memory pin`)
  assert.ok(fn.memory <= 1024, `${glob} memory ${fn.memory} exceeds 1024 MB cap`)
}
assert.equal(vercel.functions["src/app/api/**/*"].memory, 256, "api catch-all must pin 256 MB (Vercel default is 1024)")
const heap = /max-old-space-size=(\d+)/.exec(JSON.parse(read("package.json")).scripts.start)
assert.ok(heap && Number(heap[1]) <= 768, "next start heap must stay ≤768 MB")
lock("package.json", ['"postbuild": "node ../scripts/check-repo-weight.mjs --build --verbose"'])
lock("next.config.ts", ["serverSourceMaps: false", "serverMinification: true", '"**/*.map"'])
// Freeze lock: local builds go through build-guard (serial + memory watchdog);
// next.config refuses a raw `next build` on macOS.
assert.match(JSON.parse(read("package.json")).scripts.build, /node scripts\/build-guard\.mjs$/, "build must run via scripts/build-guard.mjs")
lock("next.config.ts", ["!process.env.SIVRCE_BUILD_GUARD"])
void import("../../scripts/build-guard.mjs").then(({ treeRssMb }: { treeRssMb: (root: number, ps: string) => number }) => {
  // root 10 → 11 → 12 counted; sibling 20 not.
  const ps = "10 1 1048576\n11 10 1048576\n12 11 1024\n20 1 9999999\n"
  assert.equal(treeRssMb(10, ps), 2049)
  assert.equal(treeRssMb(99, ps), 0)
})

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

// `transition-all` also animates layout props (width/padding/top) and every
// theme-switch color: paint jank on low-end phones. Tailwind `transition`
// covers colors/opacity/shadow/transform; animate size via `transition-[width]`.
const walk = (dir: string): string[] =>
  readdirSync(join(root, dir), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : /\.(tsx?|css)$/.test(e.name) ? [join(dir, e.name)] : [],
  )
for (const f of walk("src")) {
  if (f.endsWith("device-budget.check.ts")) continue
  assert.ok(!/\btransition-all\b/.test(read(f)), `${f}: use transition / transition-[prop], not transition-all`)
}

console.log("device-budget: ssr-safe + glitch locks ✓")
