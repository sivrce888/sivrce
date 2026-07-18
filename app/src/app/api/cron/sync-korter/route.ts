import { syncKorterDirectory } from "@/lib/directory/sync-korter"
import { db } from "@/lib/db"
import { MAP_BUILDINGS_TAG } from "@/lib/map/db-buildings"
import { revalidatePath, revalidateTag } from "next/cache"

/**
 * Daily korter → Neon sync (Vercel Cron).
 * Auth: Authorization: Bearer $CRON_SECRET (set in Vercel env).
 *
 * ponytail: full refresh ~3–4 min; Fluid maxDuration 300s. If korter grows
 * past that, shard by geo and fan out.
 */
export const maxDuration = 300
export const dynamic = "force-dynamic"

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get("authorization")
  return auth === `Bearer ${secret}`
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  const started = Date.now()
  try {
    const result = await syncKorterDirectory(db, {
      log: (msg) => console.log(`[cron/sync-korter] ${msg}`),
    })
    revalidateTag(MAP_BUILDINGS_TAG, "max")
    revalidatePath("/map")
    revalidatePath("/projects")
    return Response.json({
      ok: true,
      ms: Date.now() - started,
      ...result,
    })
  } catch (e) {
    console.error("[cron/sync-korter]", e)
    return Response.json(
      { ok: false, error: (e as Error).message, ms: Date.now() - started },
      { status: 500 },
    )
  }
}
