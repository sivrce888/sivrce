import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import {
  EXPORT_LIMITS,
  NEVER_EXPORTED,
  exportFilename,
  exportProfile,
  type ExportableUser,
} from "./account-export"

console.log("account-export.check: start")

const user = {
  id: "usr_123",
  name: "Nino",
  email: "nino@example.com",
  emailVerified: new Date("2026-01-02T03:04:05.000Z"),
  phone: null,
  phoneVerifiedAt: null,
  image: null,
  role: "buyer",
  trustScore: 70,
  signupSource: "direct",
  lastSeenAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-03T00:00:00.000Z"),
  // These must never survive the shaping, whatever the caller passes in.
  passwordHash: "$2b$12$notreal",
  sessions: [{ token: "secret" }],
} as unknown as ExportableUser

const out = exportProfile(user)
for (const secret of NEVER_EXPORTED) {
  assert.ok(!(secret in out), `${secret} must never be exported`)
}
assert.ok(!JSON.stringify(out).includes("$2b$12$notreal"), "password hash leaked into the export")
assert.equal(out.email, "nino@example.com")
assert.equal(out.emailVerified, "2026-01-02T03:04:05.000Z", "dates must be ISO strings")
assert.equal(out.createdAt, "2026-01-01T00:00:00.000Z")

// Filename: no path traversal, no quote-breaking out of the header, dated.
const name = exportFilename('../../etc/passwd"; rm -rf /', new Date("2026-09-15T10:00:00Z"))
assert.equal(name, "sivrce-data-export-etcpasswdrm-rf-2026-09-15.json")
assert.ok(!name.includes("/") && !name.includes('"'), "filename must not break the header")
assert.match(exportFilename("usr_123"), /^sivrce-data-export-usr_123-\d{4}-\d{2}-\d{2}\.json$/)

// Caps exist for every collection the route returns, and are sane.
for (const [key, limit] of Object.entries(EXPORT_LIMITS)) {
  assert.ok(Number.isInteger(limit) && limit > 0 && limit <= 5000, `${key} cap out of range: ${limit}`)
}

// The route must stay self-scoped: every query filtered by the session user,
// never cached, and served as a download.
const route = readFileSync(join(process.cwd(), "src/app/api/account/export/route.ts"), "utf8")
assert.ok(route.includes("session?.user?.id"), "export route must require a session")
assert.ok(route.includes('status: 401'), "export route must 401 anonymous callers")
assert.ok(route.includes('"cache-control": "private, no-store"'), "personal data must not be cached")
assert.ok(route.includes("content-disposition"), "export must download as a file")
const wheres = route.match(/where: \{[^}]*\}/g) ?? []
assert.ok(wheres.length >= 10, `expected a filtered query per collection, saw ${wheres.length}`)
for (const w of wheres) {
  assert.ok(
    /userId|authorId|guestId|ownerId|buyerEmail|id: userId/.test(w),
    `unscoped query in the export route: ${w}`,
  )
}

console.log("account-export.check: OK ✓")
