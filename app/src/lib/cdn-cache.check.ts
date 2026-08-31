/**
 * Cost / CDN lock — fails the build if someone re-opens the expensive path.
 * Run: npx tsx src/lib/cdn-cache.check.ts
 */
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { cdnJson } from "./cdn-cache"
import { generateAllSeoParams, generateSeoBuildParams } from "./seo-pages"

const root = process.cwd()
const read = (rel: string) => readFileSync(join(root, rel), "utf8")
const has = (t: string, s: string) => t.includes(s)

function lock(file: string, need: string[], ban: string[] = []) {
  const t = read(file)
  for (const s of need) assert.ok(has(t, s), `${file} missing ${JSON.stringify(s)}`)
  for (const s of ban) assert.ok(!has(t, s), `${file} unlocked ${JSON.stringify(s)}`)
}

const build = generateSeoBuildParams()
const all = generateAllSeoParams()
assert.ok(build.length < 80, `build hubs ${build.length} too many`)
assert.ok(all.length > 100, "sitemap set shrank — crawler coverage")
assert.ok(build.some((s) => s.join("/") === "sale"))
assert.ok(build.some((s) => s.join("/") === "sale/apartments/tbilisi"))
assert.ok(!build.some((s) => s.length >= 4), "district/room pages must stay on-demand ISR")
assert.match(cdnJson({ ok: true }, 60).headers.get("Cache-Control") ?? "", /s-maxage=60/)

const nextCfg = read("next.config.ts")
assert.ok(has(nextCfg, "productionBrowserSourceMaps: false"))
assert.ok(has(nextCfg, "unoptimized: true"))
assert.ok(has(nextCfg, "expireTime: 86400"))
assert.ok(has(nextCfg, "compress: true"))
assert.ok(has(nextCfg, "staticGenerationMaxConcurrency: 3"))
assert.ok(!/^\s*inlineCss:\s*true/m.test(nextCfg), "inlineCss blows FCP")

const vercel = JSON.parse(read("vercel.json")) as {
  fluid: boolean
  regions: string[]
  crons: unknown[]
  functions: Record<string, { maxDuration?: number; memory?: number }>
  images: { minimumCacheTTL: number }
}
assert.equal(vercel.fluid, true)
assert.deepEqual(vercel.regions, ["fra1"])
assert.ok(vercel.crons.length <= 4, "extra crons = extra invocations")
assert.ok(vercel.images.minimumCacheTTL >= 31_536_000)
const caps: Record<string, { dur: number; ram: number }> = {
  "src/app/api/map/**/*": { dur: 8, ram: 256 },
  "src/app/api/sat/**/*": { dur: 8, ram: 256 },
  "src/app/api/napr/**/*": { dur: 8, ram: 256 },
  "src/app/api/tas/**/*": { dur: 8, ram: 256 },
  "src/app/api/site/**/*": { dur: 8, ram: 256 },
  "src/app/api/corpus/**/*": { dur: 8, ram: 256 },
  "src/app/api/geocode/**/*": { dur: 8, ram: 256 },
  "src/app/api/map-data/**/*": { dur: 10, ram: 1024 },
  "src/app/api/search/**/*": { dur: 15, ram: 1024 },
  "src/app/api/suggest/**/*": { dur: 5, ram: 256 },
  "src/app/api/ai/**/*": { dur: 15, ram: 1024 },
  "src/app/api/geo/**/*": { dur: 3, ram: 256 },
  "src/app/api/cron/**/*": { dur: 300, ram: 1024 },
}
for (const [glob, cap] of Object.entries(caps)) {
  const got = vercel.functions[glob]
  assert.ok(got?.maxDuration != null && got.maxDuration <= cap.dur, `${glob} maxDuration ${got?.maxDuration} > ${cap.dur}`)
  assert.ok(got?.memory != null && got.memory <= cap.ram, `${glob} memory ${got?.memory} > ${cap.ram}`)
}

lock("src/app/[lang]/[...seo]/page.tsx", [
  "generateSeoBuildParams",
  "export const revalidate = 300",
  "lang: 'ka'",
], ["generateAllSeoParams", "force-dynamic"])

lock("src/app/[lang]/listing/[id]/[[...slug]]/page.tsx", [
  "export const revalidate = 60",
  "getAllListings(80)",
], ["force-dynamic"])

lock("src/app/[lang]/buildings/[slug]/page.tsx", [
  "export const revalidate = 3600",
], ["generateStaticParams", "force-dynamic"])

lock("src/app/[lang]/tbilisi/[district]/[street]/page.tsx", [
  "export const revalidate = 300",
], ["generateStaticParams", "force-dynamic"])

lock("src/app/[lang]/forum/page.tsx", ["export const revalidate = 60"], ["force-dynamic"])
lock("src/app/[lang]/forum/[slug]/page.tsx", ["export const revalidate = 60"], ["force-dynamic"])
lock("src/app/[lang]/u/[id]/page.tsx", ["export const revalidate = 300"], ["force-dynamic"])
lock("src/app/[lang]/layout.tsx", ['["ka", "en", "ru"]'])
lock("src/app/[lang]/layout.tsx", ["preload: false"], ["preload: true", "setTimeout(boot,10000)"])

for (const api of [
  "src/app/api/napr/route.ts",
  "src/app/api/tas/route.ts",
  "src/app/api/site/route.ts",
  "src/app/api/corpus/route.ts",
  "src/app/api/geocode/route.ts",
  "src/app/api/map-data/route.ts",
]) {
  lock(api, ["cdnJson"], ["force-no-store", "force-dynamic"])
}

lock("src/app/api/search/route.ts", ["Vercel-CDN-Cache-Control", "s-maxage=60"])
lock("src/app/api/suggest/route.ts", ["Vercel-CDN-Cache-Control", "s-maxage=86400"])
lock("src/lib/posthog.ts", [
  "autocapture: false",
  "disable_session_recording: true",
  "capture_pageview: false",
  "disable_surveys: true",
])

lock("src/lib/device-budget.ts", ["maxTileCacheSize", "data-lite", "deviceMemory"])
lock("src/app/[lang]/layout.tsx", ["LITE_BOOT", "beforeInteractive", "slogan: BRAND.tagline.ka", "cdn.sivrce.ge"])
lock("src/components/ThemeProvider.tsx", ["session={null}", "refetchInterval={0}"], ["refetchOnWindowFocus={true}"])
lock("src/lib/brand.ts", ["Real Estate in one place", "უძრავი ქონება ერთ სივრცეში"])
lock("src/app/globals.css", ["html[data-lite] [data-reveal]"])
lock("next.config.ts", ["webpackMemoryOptimizations: true", "staleTimes"])
lock("package.json", ["max-old-space-size=4096", "max-old-space-size=768"])
lock(".npmrc", ["legacy-peer-deps=true"])
lock("src/components/sections/Listings.tsx", [
  "homeRailSearchHref('diamond')",
  "homeRailSearchHref('super_vip')",
])
lock("src/components/ListingCard.tsx", ['loading="lazy"', 'fetchPriority="low"', "cardOf"], ["from 'next/image'"])
lock("src/lib/media.ts", ["cardOf", ".card.webp"])
lock("src/app/[lang]/blog/page.tsx", ["export const revalidate = 86400"], ["force-dynamic"])
lock("src/data/georgia-locations.ts", ["georgia-locations.json"], ["tbilisi-streets.json"])
lock("src/app/llms.txt/route.ts", ["llmsTxt", "text/plain"])
lock("src/app/llms-full.txt/route.ts", ["llmsFullTxt", "text/plain"])
lock("src/app/.well-known/security.txt/route.ts", ["mailto:hi@sivrce.ge", "Expires:"])

for (const sentry of [
  "sentry.client.config.ts",
  "sentry.server.config.ts",
  "sentry.edge.config.ts",
]) {
  lock(sentry, ['process.env.NODE_ENV === "production" ? 0 : 1.0'])
}
lock("sentry.client.config.ts", ["replaysSessionSampleRate: 0", "maxBreadcrumbs: 20", "profilesSampleRate: 0"])

console.log(`cost-lock: ${build.length} hubs vs ${all.length} sitemap ✓`)
