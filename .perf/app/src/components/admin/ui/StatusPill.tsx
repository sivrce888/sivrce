/** Status → tone. Unknown statuses fall back to neutral. */
const MAP: Record<string, { cls: string; dot: string }> = {
  // positive
  active: { cls: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  approved: { cls: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  verified: { cls: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  confirmed: { cls: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  completed: { cls: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  paid: { cls: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  resolved: { cls: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  live: { cls: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  won: { cls: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  closed_won: { cls: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  published: { cls: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  ready: { cls: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  // attention
  pending: { cls: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  scheduled: { cls: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  in_review: { cls: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  under_review: { cls: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  new: { cls: "bg-blue-50 text-sv-blue", dot: "bg-sv-blue" },
  open: { cls: "bg-blue-50 text-sv-blue", dot: "bg-sv-blue" },
  contacted: { cls: "bg-blue-50 text-sv-blue", dot: "bg-sv-blue" },
  processing: { cls: "bg-blue-50 text-sv-blue", dot: "bg-sv-blue" },
  draft: { cls: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  // negative
  rejected: { cls: "bg-rose-50 text-rose-700", dot: "bg-rose-500" },
  failed: { cls: "bg-rose-50 text-rose-700", dot: "bg-rose-500" },
  cancelled: { cls: "bg-rose-50 text-rose-700", dot: "bg-rose-500" },
  expired: { cls: "bg-rose-50 text-rose-700", dot: "bg-rose-500" },
  fraud: { cls: "bg-rose-50 text-rose-700", dot: "bg-rose-500" },
  urgent: { cls: "bg-rose-50 text-rose-700", dot: "bg-rose-500" },
  high: { cls: "bg-rose-50 text-rose-700", dot: "bg-rose-500" },
  banned: { cls: "bg-rose-50 text-rose-700", dot: "bg-rose-500" },
  suspended: { cls: "bg-rose-50 text-rose-700", dot: "bg-rose-500" },
  closed_lost: { cls: "bg-rose-50 text-rose-700", dot: "bg-rose-500" },
  // neutral-ish
  sold: { cls: "bg-violet-50 text-violet-700", dot: "bg-violet-500" },
  ended_sold: { cls: "bg-violet-50 text-violet-700", dot: "bg-violet-500" },
  withdrawn: { cls: "bg-sv-ink/6 text-sv-ink/55", dot: "bg-sv-ink/30" },
  dismissed: { cls: "bg-sv-ink/6 text-sv-ink/55", dot: "bg-sv-ink/30" },
  archived: { cls: "bg-sv-ink/6 text-sv-ink/55", dot: "bg-sv-ink/30" },
}

const FALLBACK = { cls: "bg-sv-ink/6 text-sv-ink/60", dot: "bg-sv-ink/30" }

export function StatusPill({ status }: { status: string }) {
  const t = MAP[status] ?? FALLBACK
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold whitespace-nowrap ${t.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
      {status.replaceAll("_", " ")}
    </span>
  )
}
