/**
 * Vercel Cron + manual ops: Bearer CRON_SECRET.
 * ponytail: no session — cron routes must not depend on cookies.
 */

import { NextResponse } from "next/server"

export function assertCronAuth(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ ok: false, error: "cron_secret_unset" }, { status: 503 })
  }
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }
  return null
}
