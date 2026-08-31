import { NextResponse } from "next/server"

import { auth } from "@/auth"
import {
  finishRegistration,
  loginOptions,
  registrationOptions,
} from "@/lib/auth-passkey"
import { db } from "@/lib/db"
import { clientIp, rateLimitOk } from "@/lib/reviews/rate-limit"
import { isSameOrigin } from "@/lib/security/origin"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: Request) {
  const op = new URL(req.url).searchParams.get("op") ?? "login"
  if (op === "login") {
    if (!rateLimitOk(`passkey:${clientIp(req.headers)}`)) {
      return NextResponse.json({ error: "rate" }, { status: 429 })
    }
    return NextResponse.json(await loginOptions())
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "bad_origin" }, { status: 403 })
  }
  if (op === "register") {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "auth" }, { status: 401 })
    }
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true },
    })
    if (!user) return NextResponse.json({ error: "auth" }, { status: 401 })
    return NextResponse.json(await registrationOptions(user))
  }
  return NextResponse.json({ error: "bad_op" }, { status: 400 })
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "bad_origin" }, { status: 403 })
  }
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "auth" }, { status: 401 })
  }
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 })
  }
  const result = await finishRegistration(session.user.id, body)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
