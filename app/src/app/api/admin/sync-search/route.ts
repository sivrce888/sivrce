import { logAdminAction } from "@/lib/admin/audit"
import { requireAdminAction } from "@/lib/admin/guard"
import { syncSearchIndexJob } from "@/lib/jobs/expire-and-sync"

/**
 * POST /api/admin/sync-search
 * Admin-only endpoint to trigger a full Meilisearch reindex.
 */

export async function POST() {
  let session
  try {
    session = await requireAdminAction()
  } catch {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 })
  }

  try {
    const result = await syncSearchIndexJob()
    if (!result.ok) {
      return Response.json(
        { ok: false, error: result.error ?? "sync_failed", indexed: result.indexed },
        { status: 500 },
      )
    }

    await logAdminAction(session, "search.sync_listings", "search_index", "listings", {
      indexed: result.indexed,
      total: result.total,
    })

    return Response.json({
      ok: true,
      indexed: result.indexed,
      total: result.total,
    })
  } catch (e) {
    console.error("[admin/sync-search] failed:", (e as Error).message)
    return Response.json(
      { ok: false, error: "db_error", detail: (e as Error).message },
      { status: 500 },
    )
  }
}
