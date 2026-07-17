import { Search } from "lucide-react"

import type { SearchParams } from "@/lib/admin/query"

/** GET search form — preserves active filters, resets page. */
export function SearchForm({
  action,
  params,
  placeholder = "Search…",
}: {
  action: string
  params: SearchParams
  placeholder?: string
}) {
  const hidden = Object.entries(params).filter(
    ([k, v]) => k !== "q" && k !== "page" && typeof v === "string" && v !== "",
  )
  const q = typeof params.q === "string" ? params.q : ""
  return (
    <form action={action} method="get" className="relative">
      {hidden.map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v as string} />
      ))}
      <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-sv-ink/35" />
      <input
        type="search"
        name="q"
        defaultValue={q}
        placeholder={placeholder}
        aria-label="Search"
        className="h-11 w-full rounded-[var(--radius-control)] border border-sv-ink/10 bg-white pr-24 pl-10 text-[14px] text-sv-ink shadow-[var(--shadow-card)] outline-none placeholder:text-sv-ink/35 focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/25 sm:w-[340px]"
      />
      <button
        type="submit"
        className="absolute top-1/2 right-1.5 h-8 -translate-y-1/2 rounded-[9px] bg-sv-navy px-4 text-[13px] font-bold text-white transition-colors hover:bg-sv-navy-soft"
      >
        Search
      </button>
    </form>
  )
}
