import { NextResponse } from "next/server"

/** Vercel CDN cache for GET JSON keyed by query string. Origin runs once per TTL. */
export function cdnJson(body: unknown, sMaxAge = 3600, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=${sMaxAge * 24}`,
      "Vercel-CDN-Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=${sMaxAge * 24}`,
    },
  })
}
