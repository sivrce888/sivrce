/**
 * Domain constitution LOCK — sivrce.ge stays Georgian-only, forever.
 *
 *   sivrce.ge  = Georgia-only inventory, server-enforced at every surface
 *   sivrce.com = worldwide (global hub + country markets + /ge mirror)
 *
 * Runtime half: enforcedCountry() + requestMarket()'s prod-.ge early return
 * + the proxy's country-path redirects (host-redirect.check.ts).
 * This file is the build-time half (runs in prebuild): pure semantics plus
 * source scans that FAIL THE BUILD when a surface stops consulting the host
 * kind or starts serving non-GE inventory on production .ge.
 *
 * Runnable: npx tsx src/lib/domain-ge-lock.check.ts
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { enforcedCountry } from './domain-scope'

// —— 1. Pure semantics: no requested country, alias or garbage widens prod .ge ——
for (const requested of ['DE', 'ALL', 'AE', 'ge', 'GE', 'xx', '', 'de;drop', undefined]) {
  assert.equal(
    enforcedCountry('ge', requested as string | undefined),
    'GE',
    `prod .ge must ignore requested country ${String(requested)}`,
  )
}
assert.equal(enforcedCountry('com', 'DE'), 'DE') // launched market on .com
assert.equal(enforcedCountry('com', 'XX'), undefined) // unknown → worldwide
assert.equal(enforcedCountry('dev', 'DE'), 'DE') // dev keeps global search
assert.equal(enforcedCountry('preview', 'ALL'), undefined)

// —— 2. requestMarket is host-authoritative on production .ge ——
// The early return must precede the MARKET_HEADER read so unstamped requests
// (edge passthroughs like /api/*) cannot smuggle a wider market.
const requestMarketSrc = readFileSync(new URL('./request-market.ts', import.meta.url), 'utf8')
assert.ok(
  /=== 'ge'\) return 'ge'/.test(requestMarketSrc),
  'requestMarket must hard-return ge on production sivrce.ge before reading MARKET_HEADER',
)
const headerPos = requestMarketSrc.indexOf("h.get(MARKET_HEADER)")
const lockPos = requestMarketSrc.search(/=== 'ge'\) return 'ge'/)
assert.ok(
  headerPos !== -1 && lockPos !== -1 && lockPos < headerPos,
  'prod-.ge lock must run before MARKET_HEADER is read',
)

// —— 3. Pinned call-site gates (the constitution has no invisible surfaces) ——
const searchPageSrc = readFileSync(
  new URL('../app/[lang]/search/page.tsx', import.meta.url),
  'utf8',
)
assert.ok(
  searchPageSrc.includes('enforcedCountry(kind'),
  'search page must clamp country via enforcedCountry',
)
assert.ok(
  searchPageSrc.includes("kind !== 'ge' && canCatalogFallback(filters)"),
  'search page must gate the non-GE catalog fallback off production sivrce.ge',
)

const searchApiSrc = readFileSync(new URL('../app/api/search/route.ts', import.meta.url), 'utf8')
assert.ok(
  searchApiSrc.includes('kind !== "ge" && canCatalogFallback(filters)'),
  '/api/search must gate the catalog fallback off production sivrce.ge',
)
assert.ok(
  searchApiSrc.includes('filters.country = lockedCountry'),
  '/api/search must overwrite (not merge) the requested country with the lock',
)

const listingPageSrc = readFileSync(
  new URL('../app/[lang]/listing/[id]/[[...slug]]/page.tsx', import.meta.url),
  'utf8',
)
assert.ok(
  listingPageSrc.includes("world && (await requestHostKind()) === 'ge'"),
  'world listings must 308 off production sivrce.ge to their sivrce.com canonical',
)

const mapPageSrc = readFileSync(new URL('../app/[lang]/map/page.tsx', import.meta.url), 'utf8')
assert.ok(
  mapPageSrc.includes("(p.cc ?? 'GE') === marketIso"),
  'map must ship only the serving market\'s own project pins',
)

const sitemapSrc = readFileSync(new URL('../app/sitemap.ts', import.meta.url), 'utf8')
assert.ok(
  sitemapSrc.includes("getAllListings(5000, { country: 'GE' })"),
  'sitemap ge shard must be locked to GE listings',
)

// —— 3b. Publish ingestion: the wizard POST cannot mint non-GE rows on prod .ge ——
const publishApiSrc = readFileSync(
  new URL('../app/api/listings/route.ts', import.meta.url),
  'utf8',
)
assert.ok(
  publishApiSrc.includes('(await requestHostKind()) === "ge"') &&
    publishApiSrc.includes('body.country = "GE"'),
  'POST /api/listings must clamp body.country to GE on production sivrce.ge before parsePublishBody',
)

// —— 3c. Entity rails (agency/agent/developer/project profiles, buildings, u/*)
// clamp to GE on prod .ge via requestCountryLock — owner- and slug-scoped
// queries are inventory too. libSrc is read in the world-leak scan below. ——
const libSrc = readFileSync(new URL('./listings-db.ts', import.meta.url), 'utf8')
for (const call of [
  'getListingsByOwner',
  'getListingsForAgentProfile',
  'getListingsForProjectSlug',
  'getListingsForDeveloper',
]) {
  const fn = libSrc.slice(
    libSrc.indexOf(`async function ${call}`),
    libSrc.indexOf('export', libSrc.indexOf(`async function ${call}`)),
  )
  assert.ok(
    fn.includes('requestCountryLock'),
    `listings-db ${call} must clamp to GE on production sivrce.ge (requestCountryLock)`,
  )
}
assert.ok(
  (libSrc.match(/requestCountryLock/g) ?? []).length >= 5,
  'agent listing counts must clamp via requestCountryLock too (arg feeds the unstable_cache key)',
)
const dbBuildingsSrc = readFileSync(new URL('./map/db-buildings.ts', import.meta.url), 'utf8')
assert.ok(
  /getListingsForBuildingSlug[\s\S]*?requestCountryLock[\s\S]*?l\.country === lock/.test(
    dbBuildingsSrc,
  ),
  'buildings page rail must clamp the worldwide cached map listings to GE on prod .ge',
)

// getWorldListings is the only world-inventory query; the worldwide surface's
// sitemap is its sole legitimate consumer. Anything else importing it is a leak.
const worldImporters: string[] = []
for (const rel of readdirSync(new URL('../app', import.meta.url), {
  recursive: true,
}) as string[]) {
  if (!rel.endsWith('.tsx') && !rel.endsWith('.ts')) continue
  if (rel.endsWith('.check.ts')) continue
  const src = readFileSync(new URL(`../app/${rel}`, import.meta.url), 'utf8')
  if (src.includes('getWorldListings')) worldImporters.push(rel)
}
assert.deepEqual(
  worldImporters.sort(),
  ['sitemap.ts'],
  'getWorldListings must only be consumed by the sitemap (worldwide surface)',
)
assert.ok(
  libSrc.includes('country: { not: "GE" }'),
  'getWorldListings must select non-GE rows only',
)
// Georgian-first defaults: the geo rails query GE unless told otherwise.
assert.ok(
  libSrc.includes('country = "GE"'),
  'geo listing rails (districts/metro) must default to GE',
)

// —— 4. API scan: every route touching listing rows is host-enforced or on the
// transactional allowlist. New listing routes must import the host authority
// (enforcedCountry / requestKind / hostKind) or they fail this build. ——
const apiDir = new URL('../app/api', import.meta.url)
const HOST_AUTHORITY = /from ['"]@\/lib\/(domain-scope|site-host|request-market)['"]/
const TOUCHES_LISTINGS = /db\.listing|@\/lib\/listings-db|@\/data\/listings['"]/

/** Routes that touch single listing rows for a user action — not inventory. */
const TRANSACTIONAL = new Map<string, string>([
  ['listings/route.ts', 'POST publish wizard (auth, same-origin)'],
  ['listings/[id]/route.ts', 'owner manage PATCH/DELETE (canManageListing)'],
  ['listings/[id]/view/route.ts', 'view counter'],
  ['listings/[id]/blocked-dates/route.ts', 'stays availability'],
  ['listings/resolve/route.ts', 'public-id resolution for share links'],
  ['inquiries/route.ts', 'inquiry about one listing'],
  ['bookings/route.ts', 'booking of one stay'],
  ['reviews/route.ts', 'review on one entity'],
  ['phone/verify-code/route.ts', 'contact reveal verification'],
  ['payments/create-order/route.ts', 'promo order for one listing'],
  ['account/export/route.ts', 'user\'s own data export (GDPR)'],
])

const seen = new Set<string>()
for (const rel of readdirSync(apiDir, { recursive: true }) as string[]) {
  if (!rel.endsWith('route.ts') || rel.endsWith('.check.ts')) continue
  const src = readFileSync(new URL(`api/${rel}`, apiDir), 'utf8')
  if (!TOUCHES_LISTINGS.test(src)) continue
  seen.add(rel)
  if (HOST_AUTHORITY.test(src)) continue // search, map-data, suggest: enforced
  assert.ok(
    TRANSACTIONAL.has(rel),
    `API route api/${rel} reads listing rows but consults no host authority. ` +
      `If it serves inventory, gate it with enforcedCountry(requestKind(...)) like /api/search; ` +
      `if it is single-entity/transactional, add it to TRANSACTIONAL in domain-ge-lock.check.ts with a reason.`,
  )
}
for (const [rel] of TRANSACTIONAL) {
  assert.ok(seen.has(rel), `allowlisted route api/${rel} no longer exists — drop it from the lock`)
}

console.log('domain-ge-lock.check: ok — sivrce.ge stays Georgian-only')
