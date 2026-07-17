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
    <div className="rounded-2xl border border-sv-ink/6 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-bold uppercase tracking-wide text-sv-ink/45">{label}</p>
        {icon ? <span className="text-sv-blue">{icon}</span> : null}
      </div>
      <p className="mt-2 text-3xl font-black tracking-tight text-sv-ink">{value}</p>
      {hint ? <p className="mt-1 text-[12px] font-medium text-sv-ink/50">{hint}</p> : null}
    </div>
  )
}
