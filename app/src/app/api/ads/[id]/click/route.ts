import { isSameOrigin } from "@/lib/security/origin"
import { db, dbAvailable } from "@/lib/db"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(req)) {
    return new Response(null, { status: 204 })
  }
  const { id } = await params
  if (!id || id.length > 120) return new Response(null, { status: 204 })
  try {
    if (await dbAvailable()) {
      await db.adBanner.updateMany({
        where: { id, status: "live" },
        data: { clicks: { increment: 1 } },
      })
    }
  } catch {
    /* click is best-effort */
  }
  return new Response(null, { status: 204 })
}
