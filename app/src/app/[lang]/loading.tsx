/** Route-level wait — spinner only, no decorative chrome. */
export default function Loading() {
  return (
    <div className="sv-pt-nav grid min-h-[50vh] place-items-center" role="status" aria-live="polite">
      <span className="sv-spinner" aria-hidden />
      <span className="sr-only">Loading</span>
    </div>
  )
}
