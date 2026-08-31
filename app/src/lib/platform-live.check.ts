/**
 * Live probe: Postgres + Prisma + auth round-trip.
 * Run: npx tsx src/lib/platform-live.check.ts
 * Needs DATABASE_URL. Writes one throwaway user, then deletes it.
 */
import assert from "node:assert/strict"
import { config } from "dotenv"

config({ path: ".env.local" })
config({ path: ".env" })

async function main() {
  const { db, dbAvailable } = await import("./db")
  const { hashPassword, verifyPassword } = await import("./password")
  const { buildDbWhere } = await import("./search-filters")

  const email = `probe+${Date.now()}@sivrce.internal`

  try {
    assert.equal(await dbAvailable(), true, "dbAvailable")

    const listings = await db.listing.count({
      where: { deletedAt: null, status: "active" },
    })
    assert.ok(listings > 0, "active listings")

    const where = buildDbWhere({ city: "თბილისი" })
    const hits = await db.listing.findMany({
      where,
      take: 3,
      select: { id: true, publicId: true, city: true, agent: true, extendedFields: true },
    })
    assert.ok(hits.length > 0, "tbilisi search")

    await db.review.findMany({ take: 1 })
    await db.user.count()
    await db.account.count()
    await db.authenticator.count()

    const passwordHash = await hashPassword("ProbePass9!")
    const created = await db.user.create({
      data: { email, name: "Probe", passwordHash, role: "buyer" },
    })
    const found = await db.user.findUnique({ where: { email } })
    assert.ok(found?.passwordHash)
    assert.equal(await verifyPassword("ProbePass9!", found.passwordHash), true)
    assert.equal(await verifyPassword("wrong", found.passwordHash), false)
    await db.user.delete({ where: { id: created.id } })
    assert.equal(await db.user.findUnique({ where: { email } }), null)

    console.log(
      `platform-live.check: ok listings=${listings} tbilisi=${hits.length} user=${created.id}`,
    )
  } catch (e) {
    try {
      await db.user.deleteMany({ where: { email } })
    } catch {
      /* ignore */
    }
    throw e
  }
}

main().catch((e) => {
  console.error("platform-live.check FAIL:", (e as Error).message)
  process.exit(1)
})
