import type { LucideIcon } from 'lucide-react'

/** Shared card/section header for account hub sections. */
export default function SectionHeader({
  icon: Icon,
  title,
  count,
  chipClass,
}: {
  icon: LucideIcon
  title: string
  count?: number
  /** Locked tint pair, e.g. 'bg-sv-orange/10 text-sv-orange' */
  chipClass: string
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className={`grid h-10 w-10 place-items-center rounded-module ${chipClass}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 className="text-[18px] font-black tracking-[-0.01em] text-sv-ink">{title}</h2>
      {count !== undefined && count > 0 && (
        <span className="rounded-full bg-sv-ink/[0.06] px-2.5 py-0.5 text-[12px] font-black text-sv-ink/60">
          {count}
        </span>
      )}
    </div>
  )
}
