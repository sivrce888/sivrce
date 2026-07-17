import { ChevronRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"

import { fmtNum } from "@/lib/admin/format"

export interface AttentionItem {
  label: string
  hint: string
  count: number
  href: string
  icon: LucideIcon
}

/** "Needs attention" rows — counts that deep-link into the owning section. */
export function AttentionList({ items }: { items: AttentionItem[] }) {
  return (
    <ul className="-mx-2 flex flex-col">
      {items.map((item) => {
        const hot = item.count > 0
        return (
          <li key={item.label}>
            <Link
              href={item.href}
              className="group flex min-h-[52px] items-center gap-3 rounded-[12px] px-2 py-2 transition-colors hover:bg-sv-cloud/70 focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:outline-none"
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] ${
                  hot ? "bg-rose-50 text-rose-600" : "bg-sv-cloud text-sv-ink/35"
                }`}
              >
                <item.icon className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-bold text-sv-ink/85">
                  {item.label}
                </span>
                <span className="block truncate text-[12px] text-sv-ink/45">
                  {item.hint}
                </span>
              </span>
              <span
                className={`text-[17px] font-extrabold tabular-nums ${
                  hot ? "text-rose-600" : "text-sv-ink/25"
                }`}
              >
                {fmtNum(item.count)}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-sv-ink/25 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
