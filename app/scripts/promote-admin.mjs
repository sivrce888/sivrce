/**
 * Promote an email to admin. Usage:
 *   node --env-file=.env.local scripts/promote-admin.mjs giotskr@gmail.com
 *
 * ponytail: one-shot ops script. ADMIN_EMAILS env covers future signups.
 */
import pg from "pg"

const email = (process.argv[2] || "").trim().toLowerCase()
if (!email || !email.includes("@")) {
  console.error("usage: node --env-file=.env.local scripts/promote-admin.mjs <email>")
  process.exit(1)
}

const url = process.env.DATABASE_URL || process.env.DIRECT_URL
if (!url) {
  console.error("DATABASE_URL missing")
  process.exit(1)
}

const client = new pg.Client({ connectionString: url })
await client.connect()

const existing = await client.query(
  `select id, email, role from users where lower(email) = $1`,
  [email],
)

if (existing.rows.length === 0) {
  // Seed stub so first Google login links via allowDangerousEmailAccountLinking
  const inserted = await client.query(
    `insert into users (id, email, role, trust_score, created_at, updated_at)
     values (gen_random_uuid()::text, $1, 'admin'::user_role, 100, now(), now())
     returning id, email, role`,
    [email],
  )
  console.log("created admin user:", inserted.rows[0])
} else {
  const updated = await client.query(
    `update users set role = 'admin'::user_role, updated_at = now()
     where lower(email) = $1
     returning id, email, role`,
    [email],
  )
  console.log("promoted:", updated.rows[0])
}

await client.end()
