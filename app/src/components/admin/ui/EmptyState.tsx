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
    <div className="sv-empty border-dashed py-16">
      {Icon ? (
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-sv-blue/10 text-sv-blue">
          <Icon className="h-6 w-6" aria-hidden />
        </div>
      ) : null}
      <p className="text-[15px] font-bold text-sv-ink/70">{title}</p>
      {hint ? (
        <p className="mt-1 max-w-[420px] text-[13px] text-sv-ink/60">{hint}</p>
      ) : null}
    </div>
  )
}
