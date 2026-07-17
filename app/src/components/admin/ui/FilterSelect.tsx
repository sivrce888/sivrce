"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

/** Select that navigates with the chosen filter on change (no submit button). */
export function FilterSelect({
  name,
  label,
  options,
  value,
}: {
  name: string
  label: string
  options: readonly { value: string; label: string }[]
  value: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  return (
    <label className="flex items-center gap-2 text-[12.5px] font-semibold text-sv-ink/50">
      {label}
      <select
        name={name}
        defaultValue={value}
        disabled={pending}
        onChange={(e) => {
          const sp = new URLSearchParams(searchParams.toString())
          if (e.target.value) sp.set(name, e.target.value)
          else sp.delete(name)
          sp.delete("page")
          startTransition(() => router.push(`?${sp.toString()}`))
        }}
        className="h-10 rounded-[var(--radius-control)] border border-sv-ink/10 bg-white px-3 text-[13.5px] font-semibold text-sv-ink shadow-[var(--shadow-card)] outline-none focus:border-sv-blue"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
