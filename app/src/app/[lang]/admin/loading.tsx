/**
 * Segment-level skeleton for the whole /admin tree — the admin layout stays
 * mounted, so every page navigation shows this instead of a blank screen.
 */
export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="mb-6">
        <div className="h-7 w-56 animate-pulse rounded-[8px] bg-sv-ink/8" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded-[8px] bg-sv-ink/6" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white p-5 shadow-[var(--shadow-card)]"
          >
            <div className="h-3 w-20 animate-pulse rounded-[6px] bg-sv-ink/8" />
            <div className="mt-3 h-7 w-24 animate-pulse rounded-[8px] bg-sv-ink/8" />
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white p-5 shadow-[var(--shadow-card)]">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="h-5 animate-pulse rounded-[6px] bg-sv-ink/6"
            style={{ width: `${88 - i * 9}%`, marginTop: i === 0 ? 0 : 14 }}
          />
        ))}
      </div>
    </div>
  )
}
