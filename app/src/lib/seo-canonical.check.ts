/**
 * Canonical/hreflang consistency lock.
 *
 * The P1 regression this guards against: emitting
 *   alternates: { canonical: <ka path>, languages: langAlternates(path) }
 * on a locale page. The canonical then points at the ka URL while hreflang
 * declares the current locale — Google honours the canonical and drops every
 * non-ka URL from the index. Alternates must come from pageAlternates()
 * (self-canonical per locale) or kaOnlyAlternates() (ka-only content).
 */
import { readFileSync } from "node:fs"
import { execFileSync } from "node:child_process"

let out = ""
try {
  out = execFileSync(
    "git",
    ["grep", "-l", "languages: langAlternates(", "--", "src/app", "src/components"],
    { encoding: "utf8", cwd: new URL("../../", import.meta.url).pathname },
  ).trim()
} catch {
  // git grep exits 1 on zero matches — that is the passing case
}

const offenders = out ? out.split("\n") : []
if (offenders.length > 0) {
  console.error(
    "seo-canonical: inline `canonical + langAlternates` found — use pageAlternates() or kaOnlyAlternates():\n  " +
      offenders.join("\n  "),
  )
  process.exit(1)
}

const server = readFileSync(new URL("./i18n/server.ts", import.meta.url), "utf8")
for (const helper of ["pageAlternates", "kaOnlyAlternates", "langCanonical"]) {
  if (!server.includes(`export function ${helper}`)) {
    console.error(`seo-canonical: ${helper} missing from lib/i18n/server.ts`)
    process.exit(1)
  }
}

console.log("seo-canonical: no inline canonical/hreflang contradictions, helpers present ✓")
