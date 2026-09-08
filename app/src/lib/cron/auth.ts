/**
 * Vercel Cron + manual ops: Bearer CRON_SECRET.
 * ponytail: no session — cron routes must not depend on cookies.
 */

import { timingSafeEqual } from "node:crypto"

import { NextResponse } from "next/server"

function bearerOk(auth: string | null, secret: string): boolean {
  const expected = `Bearer ${secret}`
  const a = Buffer.from(auth ?? "")
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function assertCronAuth(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ ok: false, error: "cron_secret_unset" }, { status: 503 })
  }
  if (!bearerOk(req.headers.get("authorization"), secret)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }
  return null
}
