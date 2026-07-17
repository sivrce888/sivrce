#!/usr/bin/env node
/**
 * Prints Auth.js Google OAuth readiness + exact redirect URIs.
 * Usage: node scripts/check-auth-env.mjs
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, "..", ".env.local")
const raw = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : ""
const get = (k) => {
  const m = raw.match(new RegExp(`^${k}=(.*)$`, "m"))
  return (m?.[1] ?? "").trim().replace(/^["']|["']$/g, "")
}

const secret = get("AUTH_SECRET")
const id = get("AUTH_GOOGLE_ID")
const googleSecret = get("AUTH_GOOGLE_SECRET")
const authUrl = (get("AUTH_URL") || "http://localhost:3000").replace(/\/$/, "")

const rows = [
  ["AUTH_SECRET", secret ? `ok (${secret.length} chars)` : "MISSING"],
  [
    "AUTH_GOOGLE_ID",
    id
      ? id.includes("apps.googleusercontent.com")
        ? "ok"
        : "set but unexpected shape"
      : "EMPTY",
  ],
  ["AUTH_GOOGLE_SECRET", googleSecret ? `ok (${googleSecret.length} chars)` : "EMPTY"],
  ["AUTH_URL", authUrl],
]

console.log("sivrce auth env\n")
for (const [k, v] of rows) console.log(`  ${k.padEnd(20)} ${v}`)
console.log("\nGoogle Cloud → OAuth 2.0 Client (Web application)")
console.log("  Authorized JavaScript origins:")
console.log(`    ${authUrl}`)
console.log("  Authorized redirect URIs:")
console.log(`    ${authUrl}/api/auth/callback/google`)
console.log("\nDocs: https://authjs.dev/getting-started/providers/google")

process.exit(secret && id && googleSecret ? 0 : 1)
