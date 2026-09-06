import { listReviewsCached } from '@/lib/reviews/list'
import { ReviewsSection, type ReviewTargetType } from './ReviewsSection'

/**
 * Server-rendered page 1 (newest) — review text lands in the HTML for
 * crawlers and AI systems; sorting/pagination hydrate from ReviewsSection.
 */
export default async function ReviewsSectionServer({
  targetType,
  targetId,
  className,
}: {
  targetType: ReviewTargetType
  targetId: string
  className?: string
}) {
  const initial = await listReviewsCached(targetType, targetId, 1, 'newest')
  // count > 0 ⇒ average is non-null; empty targets fall back to the client's own empty state.
  const seed =
    initial && initial.count > 0 ? { ...initial, average: initial.average ?? 0 } : undefined
  return (
    <ReviewsSection
      targetType={targetType}
      targetId={targetId}
      className={className}
      initialData={seed}
    />
  )
}
