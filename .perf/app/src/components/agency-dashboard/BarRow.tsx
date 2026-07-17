interface BarRowProps {
  label: string
  count: number
  max: number
}

/** Label + proportional bar + count, for pipeline/status breakdowns. */
export default function BarRow({ label, count, max }: BarRowProps) {
  const pct = max > 0 ? Math.max(2, Math.round((count / max) * 100)) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 shrink-0 truncate text-[12.5px] font-bold text-sv-ink/60">{label}</span>
      <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-sv-ink/6">
        {count > 0 ? (
          <div className="h-full rounded-full bg-sv-blue" style={{ width: `${pct}%` }} />
        ) : null}
      </div>
      <span className="w-9 shrink-0 text-right text-[13px] font-black tabular-nums text-sv-ink">
        {count}
      </span>
    </div>
  )
}
