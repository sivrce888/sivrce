/**
 * Runnable check: npx tsx src/lib/governance.check.ts
 *
 * Guards the master engineering rule (AGENTS.md § Master engineering rule) so it
 * cannot silently rot: the rule must stay readable by every agent (Claude Code,
 * Cursor, Codex), and the quality escapes it bans must stay at zero.
 */
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"

console.log("governance.check: start")

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const rootDir = join(appDir, "..")
const read = (...p: string[]) => readFileSync(join(...p), "utf8")

const RULE_HEADING = "# Master engineering rule"

// ── 1. The rule is where each agent looks for it.
// Claude Code reads CLAUDE.md, Cursor reads .cursor/rules/*.mdc, Codex reads the
// nearest AGENTS.md. Miss one and that agent silently ignores the rule.
const rootAgents = read(rootDir, "AGENTS.md")
const appAgents = read(appDir, "AGENTS.md")
assert.ok(rootAgents.includes(RULE_HEADING), "root AGENTS.md lost the master engineering rule")
assert.ok(appAgents.includes(RULE_HEADING), "app/AGENTS.md lost the master engineering rule pointer")

for (const dir of [rootDir, appDir]) {
  const claudeMd = read(dir, "CLAUDE.md")
  assert.match(
    claudeMd,
    /^@\.{0,2}\/?AGENTS\.md$/m,
    `${relative(rootDir, dir) || "."}/CLAUDE.md must @-import AGENTS.md, else Claude Code never loads the rules`,
  )
}

const cursorRule = read(rootDir, ".cursor", "rules", "sivrce-master-rule.mdc")
assert.ok(cursorRule.includes(RULE_HEADING), "cursor master rule lost its heading")
assert.match(cursorRule, /^alwaysApply: true$/m, "cursor master rule must be alwaysApply")

// ── 2. Quality gates stay switched on.
// A suppressed typecheck or lint turns every other check in prebuild into theatre.
const nextConfig = read(appDir, "next.config.ts")
for (const escape of ["ignoreBuildErrors", "ignoreDuringBuilds"]) {
  assert.ok(!nextConfig.includes(escape), `next.config.ts must never set ${escape}`)
}
assert.match(read(appDir, "tsconfig.json"), /"strict":\s*true/, "tsconfig must stay strict")

const pkg = JSON.parse(read(appDir, "package.json")) as { scripts: Record<string, string> }
assert.ok(
  pkg.scripts.prebuild.includes("governance.check.ts"),
  "prebuild must run governance.check.ts, or this guard stops guarding",
)
const ci = read(appDir, ".github", "workflows", "ci.yml")
assert.ok(ci.includes("npm run lint"), "CI must run lint")
assert.ok(ci.includes("npm run build"), "CI must run build (prebuild chain)")

// ── 3. Zero type/lint escapes in hand-written code.
// src/generated is Prisma output, not ours. Everything else is at zero today —
// this keeps it there instead of letting the first exception open the door.
// Directives live in comments, so they are matched against raw source.
const BANNED_DIRECTIVES = [/@ts-nocheck/, /@ts-ignore/, /^\/\* *eslint-disable *\*\//m] as const
// Code-level escapes are matched after comments are stripped, so prose about them is fine.
const BANNED_CODE = [/\bas any\b/, /:\s*any\b/] as const
const SKIP = new Set(["generated", "node_modules"])
const selfPath = fileURLToPath(import.meta.url) // this file names the escapes it bans
const offenders: string[] = []

const walk = (dir: string) => {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      walk(full)
      continue
    }
    if (full === selfPath || !/\.(ts|tsx)$/.test(entry)) continue
    const raw = readFileSync(full, "utf8")
    const code = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")
    for (const pattern of BANNED_DIRECTIVES) {
      if (pattern.test(raw)) offenders.push(`${relative(appDir, full)} — ${pattern.source}`)
    }
    for (const pattern of BANNED_CODE) {
      if (pattern.test(code)) offenders.push(`${relative(appDir, full)} — ${pattern.source}`)
    }
  }
}
walk(join(appDir, "src"))
assert.deepEqual(offenders, [], `type/lint escapes are banned by the master rule:\n${offenders.join("\n")}`)

console.log("governance.check: ok")
