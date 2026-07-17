import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

import { hrefWithParams, mergeParams, type SearchParams } from "@/lib/admin/query"

const btn =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-[var(--radius-control)] px-2 text-[13px] font-bold transition-colors"

export function Pagination({
  basePath,
  page,
  pageSize,
  total,
  params,
}: {
  basePath: string
  page: number
  pageSize: number
  total: number
  params: SearchParams
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (pages <= 1) return null
  const go = (p: number) =>
    hrefWithParams(basePath, mergeParams(params, { page: p > 1 ? p : undefined }))

  // Window of up to 5 page numbers around the current page.
  const start = Math.max(1, Math.min(page - 2, pages - 4))
  const nums = Array.from({ length: Math.min(5, pages) }, (_, i) => start + i)

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex items-center justify-between gap-3"
    >
      <p className="text-[12.5px] text-sv-ink/50">
        Page {page} of {pages} · {total} total
      </p>
      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link href={go(page - 1)} className={`${btn} text-sv-ink/60 hover:bg-sv-ink/5`} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        ) : null}
        {nums.map((n) => (
          <Link
            key={n}
            href={go(n)}
            aria-current={n === page ? "page" : undefined}
            className={`${btn} ${n === page ? "bg-sv-navy text-white" : "text-sv-ink/60 hover:bg-sv-ink/5"}`}
          >
            {n}
          </Link>
        ))}
        {page < pages ? (
          <Link href={go(page + 1)} className={`${btn} text-sv-ink/60 hover:bg-sv-ink/5`} aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
    </nav>
  )
}
