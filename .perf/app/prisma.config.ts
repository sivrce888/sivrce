import { config } from "dotenv"
import { defineConfig, env } from "prisma/config"

// Prisma 7 CLI does not auto-load .env files; mirror Next.js precedence.
config({ path: [".env.local", ".env"] })

// ponytail: fall back to DATABASE_URL when DIRECT_URL is unset (e.g. Vercel
// builds before env vars are configured). Migrate still needs DIRECT_URL but
// `prisma generate` (postinstall) only needs any reachable Postgres URL.
const dbUrl = (() => {
  try { return env("DIRECT_URL") } catch { /* missing */ }
  try { return env("DATABASE_URL") } catch { /* missing */ }
  // Last resort: dummy URL so `prisma generate` doesn't crash the build.
  // The actual DB connection is managed by src/lib/db.ts at runtime.
  return "postgresql://localhost:5432/placeholder?sslmode=disable"
})()

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Migrate/introspect over Neon's direct (non-pooled) endpoint.
  // The runtime client uses the pooled DATABASE_URL via src/lib/db.ts.
  datasource: {
    url: dbUrl,
  },
})
