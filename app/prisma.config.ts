import { config } from "dotenv"
import { defineConfig, env } from "prisma/config"

// Prisma 7 CLI does not auto-load .env files; mirror Next.js precedence.
config({ path: [".env.local", ".env"] })

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Migrate/introspect over Neon's direct (non-pooled) endpoint.
  // The runtime client uses the pooled DATABASE_URL via src/lib/db.ts.
  datasource: {
    url: env("DIRECT_URL"),
  },
})
