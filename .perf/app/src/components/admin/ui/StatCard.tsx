import type { LucideIcon } from "lucide-react"

const TONES = {
  blue: "text-sv-blue",
  orange: "text-sv-orange",
  ink: "text-sv-ink",
  success: "text-emerald-600",
  danger: "text-rose-600",
} as const

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "ink",
}: {
  label: string
  value: string
  hint?: string
  icon?: LucideIcon
  tone?: keyof typeof TONES
}) {
  return (
    <div className="rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] font-bold tracking-[0.08em] text-sv-ink/45 uppercase">
          {label}
        </p>
        {Icon ? <Icon className={`h-4.5 w-4.5 ${TONES[tone]}`} /> : null}
      </div>
      <p className={`mt-2 text-[28px] leading-none font-extrabold tracking-tight ${TONES[tone]}`}>
        {value}
      </p>
      {hint ? <p className="mt-2 text-[12.5px] text-sv-ink/50">{hint}</p> : null}
    </div>
  )
}
