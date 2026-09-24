/**
 * Client-bundle leak lock.
 *
 * The recurring failure here is not a big module — it is a *small symbol* in a
 * big module. One `import { AGENT_PROFILES } from '@/data/professionals'` in a
 * component used by the listing page shipped the whole new-build catalog:
 * measured 251 KB gzipped on /listing and 249 KB on /projects before the split.
 *
 * Tree-shaking does not save us: these catalogs are `export const X = [...]`
 * arrays built from spreads of other catalogs, and webpack keeps them.
 *
 * So we lock the graph instead: walk value-imports (type-only imports are
 * erased and therefore free) from each hot client entry and assert the heavy
 * catalogs stay unreachable.
 *
 * Run: npx tsx src/lib/bundle-leak.check.ts
 */
import assert from "node:assert/strict"
import { readFileSync, statSync } from "node:fs"
import { dirname, join, resolve } from "node:path"

const SRC = join(process.cwd(), "src")
const EXTS = [".ts", ".tsx", ".js", ".jsx", ".json"]

function resolveImport(from: string, spec: string): string | null {
  let base: string
  if (spec.startsWith("@/")) base = join(SRC, spec.slice(2))
  else if (spec.startsWith(".")) base = resolve(dirname(from), spec)
  else return null // bare package specifier — not our graph
  for (const e of EXTS) {
    try {
      if (statSync(base + e).isFile()) return base + e
    } catch {}
  }
  for (const e of EXTS) {
    try {
      if (statSync(join(base, "index" + e)).isFile()) return join(base, "index" + e)
    } catch {}
  }
  return null
}

/**
 * Value imports only. `import type {...}` and named lists whose every specifier
 * is `type X` are erased by the compiler and cost zero bytes, so counting them
 * would flag false leaks (every client file "reaches" Prisma through types).
 */
function valueImports(file: string): string[] {
  if (file.endsWith(".json")) return []
  const text = readFileSync(file, "utf8")
  const out: string[] = []
  const re = /(?:^|[\n;])\s*(?:import|export)\s+(type\s+)?([\s\S]*?)\s*from\s*["']([^"']+)["']/g
  for (const m of text.matchAll(re)) {
    const [, typeKeyword, clause, spec] = m
    if (typeKeyword) continue
    const named = clause.match(/\{([\s\S]*)\}/)
    if (named) {
      const specifiers = named[1].split(",").map((s) => s.trim()).filter(Boolean)
      const bare = clause.replace(/\{[\s\S]*\}/, "").replace(/,/g, "").trim()
      if (!specifiers.some((s) => !/^type\s/.test(s)) && !bare) continue
    }
    const r = resolveImport(file, spec)
    if (r) out.push(r)
  }
  return out
}

/** Shortest value-import path entry -> target, or null when unreachable. */
function pathTo(entry: string, target: string): string[] | null {
  const start = join(SRC, entry)
  assert.ok(statSync(start).isFile(), `bundle-leak: entry ${entry} not found — update this check`)
  const goal = join(SRC, target)
  const seen = new Set([start])
  const queue: [string, string[]][] = [[start, [start]]]
  while (queue.length) {
    const [file, trail] = queue.shift()!
    for (const dep of valueImports(file)) {
      if (dep === goal) return [...trail, dep].map((p) => p.replace(SRC + "/", ""))
      if (seen.has(dep)) continue
      seen.add(dep)
      queue.push([dep, [...trail, dep]])
    }
  }
  return null
}

// Hot client entries that must never reach a bulk catalog. These are the pages
// where the leak was measured; the map/add-listing flows legitimately need
// geocoding + building data and ride a lazily-loaded map chunk, so they are
// deliberately not listed here.
const BANNED: { entry: string; forbidden: string; why: string }[] = [
  {
    entry: "components/listing/ListingDetailClient.tsx",
    forbidden: "data/professionals.ts",
    why: "agent lookup must come from data/agent-profiles.ts (leaf)",
  },
  {
    entry: "components/compare/CompareClient.tsx",
    forbidden: "data/professionals.ts",
    why: "compare only needs the projected card shape",
  },
  {
    entry: "app/[lang]/projects/ProjectsExplorer.tsx",
    forbidden: "data/professionals.ts",
    why: "toCard lives in ./to-card.ts so ./card stays a pure leaf",
  },
  {
    entry: "components/listing/ListingDetailClient.tsx",
    forbidden: "lib/countries/de.ts",
    why: "DE city catalog must stay server-side; exposé parser is de-expose.ts",
  },
  {
    entry: "components/add-listing/AddListingClient.tsx",
    forbidden: "lib/countries/de-proptech-os.ts",
    why: "the GEG § 87 fieldset needs de-geg.ts (leaf), not the 557-line underwriting OS",
  },
  {
    entry: "components/add-listing/AddListingClient.tsx",
    forbidden: "lib/countries/de.ts",
    why: "the DE city catalog must never ride the publish wizard to a phone",
  },
  {
    entry: "components/sections/Navbar.tsx",
    forbidden: "lib/map/user-place.ts",
    why: "the navbar renders on ~208 routes: one city label here shipped data/world-places (88 KB of rows, measured 106 KB raw in the shared chunk) to every page. The 3D-map link passes ?city=<slug> and /map resolves it via user-place.server; NavLocationBadge shows country only",
  },
  {
    entry: "components/sections/Footer.tsx",
    forbidden: "lib/map/user-place.ts",
    why: "same ~208 routes as the navbar — the footer address line uses the market-city-label leaf (74 rows, drift-locked by market-city-label.check.ts)",
  },
  {
    entry: "components/sections/HeroSearch.tsx",
    forbidden: "components/search/LocationPicker.tsx",
    why: "the homepage hero island loads the picker (framer-motion + world city catalog) via dynamic import on first open — a static import puts it back on every home visit",
  },
  {
    entry: "components/ListingCard.tsx",
    forbidden: "lib/map/user-place.ts",
    why: "place-label shipped data/world-places (~36 KB gz) to every card page for a ka↔en city label; it reads lib/city-names.gen.ts (names-only leaf, drift-locked by place-label.check.ts)",
  },
  {
    entry: "components/country/GeoGate.tsx",
    forbidden: "lib/map/user-place.ts",
    why: "[lang]/page.tsx imports GlobalHome statically, so GeoGate rides the .ge home's client entry too — geo-market resolves cities from lib/city-names.gen.ts",
  },
  {
    entry: "proxy.ts",
    forbidden: "lib/map/user-place.ts",
    why: "edge middleware runs on every request; geo-market must stay catalog-free (marketCenter lives in map/user-place for server callers)",
  },
  {
    entry: "components/sections/HeroSearch.tsx",
    forbidden: "lib/map/user-place.ts",
    why: "the hero island must not reach data/world-places; locationLabel comes from lib/search-location (leaf)",
  },
]

for (const { entry, forbidden, why } of BANNED) {
  const leak = pathTo(entry, forbidden)
  assert.equal(
    leak,
    null,
    `bundle-leak: ${entry} value-imports ${forbidden} — ${why}\n  path: ${leak?.join("\n     -> ")}`,
  )
}

// ./card is the shape contract shared with the client grid. Any value import
// here re-opens the leak that to-card.ts was split out to close.
const cardImports = valueImports(join(SRC, "app/[lang]/projects/card.ts"))
assert.deepEqual(
  cardImports.map((p) => p.replace(SRC + "/", "")),
  [],
  "bundle-leak: app/[lang]/projects/card.ts must stay import-free (client leaf)",
)

// data/agent-profiles.ts exists to be a leaf — it may only carry type imports.
const agentImports = valueImports(join(SRC, "data/agent-profiles.ts"))
assert.deepEqual(
  agentImports.map((p) => p.replace(SRC + "/", "")),
  [],
  "bundle-leak: data/agent-profiles.ts must stay a leaf (type-only imports)",
)

// countries/de-geg.ts rides the publish wizard into the browser. It may reach
// de-expose (itself a leaf) and nothing else — one convenience import of
// de-proptech-os would put the whole underwriting OS on a German seller's phone.
const gegImports = valueImports(join(SRC, "lib/countries/de-geg.ts"))
assert.deepEqual(
  gegImports.map((p) => p.replace(SRC + "/", "")),
  ["lib/countries/de-expose.ts"],
  "bundle-leak: lib/countries/de-geg.ts must stay a leaf (de-expose only)",
)

// framer-motion is a bare package, invisible to the graph walk above. The hero
// island dropped it (~41 KB gz on every home visit) for CSS — keep it out.
assert.ok(
  !/from\s+["']framer-motion["']/.test(readFileSync(join(SRC, "components/sections/HeroSearch.tsx"), "utf8")),
  "bundle-leak: components/sections/HeroSearch.tsx must not import framer-motion (CSS only)",
)

console.log(`bundle-leak: ${BANNED.length} entry/catalog locks + 3 leaf locks + hero framer lock ✓`)
