import type { LucideIcon } from "lucide-react"

export function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon?: LucideIcon
  title: string
  hint?: string
}) {
  return (
    <div className="grid place-items-center rounded-[var(--radius-tile)] border border-dashed border-sv-ink/12 bg-white/60 px-6 py-16 text-center">
      {Icon ? (
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-sv-cloud text-sv-ink/35">
          <Icon className="h-6 w-6" />
        </div>
      ) : null}
      <p className="text-[15px] font-bold text-sv-ink/70">{title}</p>
      {hint ? (
        <p className="mt-1 max-w-[420px] text-[13px] text-sv-ink/45">{hint}</p>
      ) : null}
    </div>
  )
}
