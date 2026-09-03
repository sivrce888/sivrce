import { requireAdminAction } from "@/lib/admin/guard"
import { globalAdminSearch } from "@/lib/admin/search"

/**
 * GET /api/admin/search?q=… — grouped entity search behind the command palette.
 * Admin-only (middleware cookie gate + in-handler guard).
 */

export async function GET(req: Request) {
  try {
    await requireAdminAction()
  } catch {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 })
  }

  const q = new URL(req.url).searchParams.get("q") ?? ""
  if (q.trim().length < 2) {
    return Response.json({ ok: true, groups: [] })
  }

  try {
    const groups = await globalAdminSearch(q)
    return Response.json({ ok: true, groups })
  } catch (e) {
    console.error("[admin/search] failed:", (e as Error).message)
    return Response.json({ ok: false, error: "search_failed" }, { status: 500 })
  }
}
