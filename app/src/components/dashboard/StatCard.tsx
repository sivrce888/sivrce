import type { ReactNode } from "react"

interface StatCardProps {
  label: string
  value: string | number
  hint?: string
  icon?: ReactNode
}

/** Single metric tile for dashboard overview pages. Server component. */
export default function StatCard({ label, value, hint, icon }: StatCardProps) {
  return (
    <div className="min-w-0 overflow-hidden rounded-card border border-sv-ink/6 bg-sv-surface p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate text-[11px] font-bold uppercase tracking-wide text-sv-ink/45 sm:text-[12px]">
          {label}
        </p>
        {icon ? <span className="shrink-0 text-sv-blue">{icon}</span> : null}
      </div>
      <p className="mt-2 truncate text-[26px] font-black tracking-[-0.03em] text-sv-ink tabular-nums sm:text-3xl">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 truncate text-[11.5px] font-medium text-sv-ink/50 sm:text-[12px]">{hint}</p>
      ) : null}
    </div>
  )
}
