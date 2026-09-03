/**
 * Static tripwire for the admin trust boundary.
 * Fails if any exported admin server action / API handler touches the DB
 * before requireAdminAction(), if a mutating admin file stops writing audit
 * entries, or if an admin page skips its own requireAdmin() call.
 * Run: npx tsx src/lib/admin/admin-guard.check.ts
 */
import assert from "node:assert/strict"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

const adminRoot = join("src", "app", "[lang]", "admin")
const actionFiles = walk(adminRoot).filter((f) => f.endsWith("actions.ts"))
const routeFiles = walk(join("src", "app", "api", "admin")).filter((f) =>
  f.endsWith("route.ts"),
)
const pageFiles = walk(adminRoot).filter((f) => f.endsWith("page.tsx"))

const DB_USE = /\bdb\.|\$queryRaw|\$executeRaw/

// 1. Every exported async handler must pass requireAdminAction() BEFORE db access.
for (const file of [...actionFiles, ...routeFiles]) {
  const src = readFileSync(file, "utf8")
  const decls = [...src.matchAll(/export async function (\w+)\s*\(/g)]
  assert.ok(decls.length > 0, `${file}: no exported async handlers found`)
  for (let i = 0; i < decls.length; i++) {
    const name = decls[i]![1]!
    const start = decls[i]!.index! + decls[i]![0].length
    const end = i + 1 < decls.length ? decls[i + 1]!.index! : src.length
    const body = src.slice(start, end)
    const guard = body.indexOf("requireAdminAction(")
    const dbUse = body.search(DB_USE)
    // ponytail: lexical scan, not AST — delegating wrappers with no direct db
    // access pass by design (their delegate is checked in its own file).
    // Upgrade to AST parse only if this ever false-negatives.
    if (dbUse !== -1) {
      assert.ok(
        guard !== -1 && guard < dbUse,
        `${file}: ${name}() touches the DB before requireAdminAction()`,
      )
    }
  }
}

// 2. Mutating admin files must keep their audit trail (read-only files exempt —
// searches must not flood the audit log).
const WRITES = /\.(create|createMany|update|updateMany|upsert|delete|deleteMany)\(/
for (const file of [...actionFiles, ...routeFiles]) {
  const src = readFileSync(file, "utf8")
  if (!WRITES.test(src)) continue
  assert.ok(
    src.includes("logAdminAction"),
    `${file}: writes without logAdminAction — audit trail gap`,
  )
}

// 3. Every admin page self-guards (defense in depth on top of the layout).
for (const file of pageFiles) {
  const src = readFileSync(file, "utf8")
  assert.ok(
    src.includes("requireAdmin(") || src.includes("requireAdminAction("),
    `${file}: missing requireAdmin/requireAdminAction call`,
  )
}

console.log(
  `admin-guard.check: ok (${actionFiles.length} actions, ${routeFiles.length} routes, ${pageFiles.length} pages)`,
)
