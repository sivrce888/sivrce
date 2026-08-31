import { NextResponse } from "next/server"

/** Related Origin Requests — passkeys minted on sivrce.ge work on admin too. */
export function GET() {
  return NextResponse.json(
    {
      origins: [
        "https://sivrce.ge",
        "https://www.sivrce.ge",
        "https://admin.sivrce.ge",
      ],
    },
    {
      headers: {
        "Cache-Control": "public, max-age=86400",
        "Content-Type": "application/json",
      },
    },
  )
}
