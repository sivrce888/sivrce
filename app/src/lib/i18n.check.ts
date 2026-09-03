/**
 * Runnable check for the i18n bundle split.
 * Run: npx tsx src/lib/i18n.check.ts
 *
 * Invariants that keep ~92KB gzip of dictionaries out of the client bundle:
 * 1. No 'use client' module imports i18n/dicts (all-locale table) or
 *    i18n/server (imports dicts transitively).
 * 2. core/context no longer export `translate` (its absence is a compile-time
 *    guard against new client-side dict imports).
 * 3. I18nProvider receives non-ka dictionaries only via RSC props.
 *
 * ponytail: direct-import scan, not a module graph — a client-safe module
 * that re-exports dicts is still possible; the missing-export compile error
 * plus this scan cover the realistic regression paths.
 */
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) {
    console.error(`i18n: ${msg}`)
    process.exit(1)
  }
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) {
      if (name === "node_modules" || name === ".next") continue
      yield* walk(p)
    } else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".check.ts")) {
      yield p
    }
  }
}

const BANNED = /from\s+['"][^'"]*i18n\/(dicts|server)['"]/

let scanned = 0
for (const file of walk(root)) {
  const src = readFileSync(file, "utf8")
  scanned++
  if (/^\s*['"]use client['"]/m.test(src) && BANNED.test(src)) {
    assert(false, `${file} is a client module importing i18n/dicts|server — dictionaries would ship in the client bundle`)
  }
}

const core = readFileSync(join(root, "lib/i18n/core.ts"), "utf8")
const context = readFileSync(join(root, "lib/i18n/context.ts"), "utf8")
assert(!/export function translate\(/.test(core), "core.ts must not export translate (use i18n/dicts server-side)")
assert(!/\btranslate\b/.test(context.match(/export \{[^}]+\}/)?.[0] ?? ""), "context.ts must not re-export translate")

console.log(`i18n: ${scanned} files scanned, no client dict imports ✓`)
