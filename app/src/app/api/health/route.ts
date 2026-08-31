/**
 * GET /api/health — process + Postgres + auth wiring.
 * Public: booleans only. Detail with Authorization: Bearer CRON_SECRET.
 */
import { NextResponse } from "next/server"

import { dbAvailable } from "@/lib/db"

export const dynamic = "force-dynamic"
export const maxDuration = 8
export const preferredRegion = "fra1"

export async function GET(req: Request) {
  const db = await dbAvailable()
  const body = {
    ok: db && Boolean(process.env.AUTH_SECRET),
    db,
    auth: Boolean(process.env.AUTH_SECRET),
    google: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
  }
  const secret = process.env.CRON_SECRET
  const authed =
    Boolean(secret) && req.headers.get("authorization") === `Bearer ${secret}`
  if (authed) {
    const url = process.env.DATABASE_URL ?? ""
    const host = (() => {
      try {
        return new URL(url.replace(/^postgresql:/, "https:")).hostname
      } catch {
        return null
      }
    })()
    const user = url.split("@")[0]?.split("://")[1]?.split(":")[0]?.split(".")[0] ?? null
    return NextResponse.json(
      { ...body, dbHost: host, dbUser: user },
      { headers: { "Cache-Control": "no-store" } },
    )
  }
  return NextResponse.json(body, {
    status: body.ok ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  })
}
