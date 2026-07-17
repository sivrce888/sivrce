import { fmtNum } from "@/lib/admin/format"
import type { DistributionItem } from "@/lib/admin/metrics"

/** Mini horizontal bar distribution — pure CSS widths, no chart lib. */
export function DistributionBars({
  items,
  emptyHint,
}: {
  items: DistributionItem[]
  emptyHint: string
}) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-[13px] text-sv-ink/40">{emptyHint}</p>
    )
  }
  const max = Math.max(1, ...items.map((i) => i.count))
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 truncate text-[12.5px] font-semibold text-sv-ink/60">
            {item.label}
          </span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-sv-ink/6">
            <span
              className="block h-full rounded-full bg-sv-blue/70"
              style={{
                width: `${Math.max(3, Math.round((item.count / max) * 100))}%`,
              }}
            />
          </span>
          <span className="w-10 shrink-0 text-right text-[12.5px] font-bold tabular-nums text-sv-ink/75">
            {fmtNum(item.count)}
          </span>
        </li>
      ))}
    </ul>
  )
}
