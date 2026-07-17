/** API contract shapes for /api/reviews (see parallel-worker brief). */

export type ReviewSort = 'newest' | 'highest' | 'helpful'

export interface ReviewOwnerReply {
  body: string
  authorName?: string
  createdAt?: string
}

export interface ReviewItem {
  id: string
  authorName: string
  rating: number
  title?: string
  body: string
  verified: boolean
  helpfulCount: number
  /** Server may send an object or a plain string — normalize at render. */
  ownerReply?: ReviewOwnerReply | string | null
  createdAt: string
}

export interface ReviewsResponse {
  average: number
  count: number
  /** Keys "1".."5" → count of reviews with that rating. */
  distribution: Record<string, number>
  reviews: ReviewItem[]
  page: number
  pages: number
}
