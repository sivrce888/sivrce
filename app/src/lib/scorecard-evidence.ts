/**
 * Scorecard evidence guard (check-time only).
 *
 * "Evidence file exists on disk" is too weak a contract: a module can exist,
 * pass its own self-check, and still be reachable from no page in the product —
 * which is exactly how a card ends up scoring a capability users never get.
 * (Four such modules were cited by the cards and imported by nothing:
 * truth-engine, crm/agent-os, developer-os, global-entity-graph.)
 *
 * So the guard is: a cited source module must be imported by something other
 * than a scorecard or a `.check.ts`. Data and config files are exempt — a JSON
 * catalog or package.json is evidence by its contents, not by its import graph.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const CODE = new Set(['.ts', '.tsx'])

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (CODE.has(extname(entry))) out.push(full)
  }
  return out
}

/** True when the path is evidence-by-contents rather than evidence-by-use. */
function exempt(evidence: string): boolean {
  return (
    !CODE.has(extname(evidence)) || // .json data, package.json, .md
    evidence.startsWith('src/data/')
  )
}

/**
 * Returns the cited paths that nothing in the product imports.
 * `srcDir` is the absolute path to `app/src`.
 */
export function unshippedEvidence(srcDir: string, evidencePaths: readonly string[]): string[] {
  const files = walk(srcDir).filter(
    (f) => !f.endsWith('.check.ts') && !f.includes('competitive') && !f.endsWith('scorecard-evidence.ts'),
  )
  const sources = files.map((f) => readFileSync(f, 'utf8'))

  return evidencePaths.filter((evidence) => {
    if (exempt(evidence)) return false
    // 'src/lib/trust/scam-radar.ts' → '@/lib/trust/scam-radar' or './scam-radar'
    const withoutExt = evidence.replace(/\.tsx?$/, '')
    const alias = '@/' + withoutExt.replace(/^src\//, '')
    const leaf = withoutExt.split('/').pop()!
    return !sources.some(
      (text) => text.includes(alias) || new RegExp(`from ['"][^'"]*/${leaf}['"]`).test(text),
    )
  })
}
