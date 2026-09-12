import { NextResponse } from "next/server"

import { rpIdFor } from "@/lib/auth-passkey"
import { normalizeHostname } from "@/lib/site-host"

/**
 * Related Origin Requests — passkeys minted on an apex work on its subdomains.
 * Scoped per registrable domain: the manifest may only declare same-site
 * origins, so .ge and .com each serve their own list.
 */
export function GET(req: Request) {
  const rpID = rpIdFor(
    normalizeHostname(req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? ""),
  )
  const origins =
    rpID === "sivrce.ge"
      ? ["https://sivrce.ge", "https://www.sivrce.ge", "https://admin.sivrce.ge"]
      : rpID === "sivrce.com"
        ? ["https://sivrce.com", "https://www.sivrce.com"]
        : []
  return NextResponse.json(
    { origins },
    {
      headers: {
        "Cache-Control": "public, max-age=86400",
        "Content-Type": "application/json",
      },
    },
  )
}
