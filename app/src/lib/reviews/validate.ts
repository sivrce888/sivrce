/** Shared field validation for review create/update (POST + PUT). */
export interface ReviewInput {
  rating: number
  title?: string
  body: string
}

/** Returns the clean fields or an error code for the API to surface. */
export function parseReviewFields(p: unknown): { ok: true; data: ReviewInput } | { ok: false; error: string } {
  if (typeof p !== "object" || p === null) return { ok: false, error: "invalid_payload" }
  const o = p as Record<string, unknown>

  const rating = typeof o.rating === "number" ? o.rating : NaN
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "invalid_rating" }
  }

  const body = typeof o.body === "string" ? o.body.trim() : ""
  if (body.length < 10 || body.length > 2000) return { ok: false, error: "invalid_body" }

  const title = typeof o.title === "string" ? o.title.trim() : undefined
  if (title !== undefined && title.length > 200) return { ok: false, error: "invalid_title" }

  const data: ReviewInput = { rating, body }
  if (title) data.title = title
  return { ok: true, data }
}
