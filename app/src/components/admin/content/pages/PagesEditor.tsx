"use client"

import { useMemo, useState, useActionState } from "react"

import { savePageContent } from "@/app/[lang]/admin/content/pages/actions"
import type { CmsRow, PagesFormState } from "@/lib/cms"

const textareaCls =
  "w-full rounded-[var(--radius-control)] border border-sv-ink/10 bg-white px-3 py-2 text-[13.5px] leading-relaxed text-sv-ink outline-none placeholder:text-sv-ink/30 focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/25"

/**
 * Page-content grid: one row per text key, filter box for big groups, one
 * save for the whole group. Blank textarea = revert to the default text.
 */
export function PagesEditor({
  lang,
  group,
  rows,
}: {
  lang: string
  group: string
  rows: CmsRow[]
}) {
  const [state, formAction, pending] = useActionState<PagesFormState, FormData>(
    savePageContent,
    { error: null, saved: false },
  )
  const [q, setQ] = useState("")
  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter(
      (r) =>
        r.key.toLowerCase().includes(needle) ||
        r.defaultText.toLowerCase().includes(needle) ||
        r.value.toLowerCase().includes(needle),
    )
  }, [rows, q])

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="group" value={group} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Filter ${rows.length} texts…`}
          aria-label="Filter texts"
          className="h-10 w-full max-w-[340px] rounded-[var(--radius-control)] border border-sv-ink/10 bg-white px-3 text-[13.5px] text-sv-ink outline-none placeholder:text-sv-ink/30 focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/25"
        />
        <div className="flex items-center gap-3">
          {state.error ? (
            <p role="alert" className="text-[12.5px] font-bold text-rose-600">
              {state.error}
            </p>
          ) : state.saved ? (
            <p className="text-[12.5px] font-semibold text-emerald-600">Saved — live on the site</p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-9 items-center rounded-[var(--radius-control)] bg-sv-blue px-4 text-[12.5px] font-bold text-white transition-colors hover:bg-sv-blue-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {visible.map((row) => (
          <div
            key={row.key}
            className="rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white p-4 shadow-[var(--shadow-card)]"
          >
            <p className="mb-1.5 font-mono text-[12px] font-bold text-sv-ink/45">{row.key}</p>
            <textarea
              name={`v.${row.key}`}
              defaultValue={row.value}
              placeholder={row.defaultText}
              rows={row.defaultText.length > 120 ? 3 : 2}
              maxLength={2000}
              aria-label={row.key}
              className={textareaCls}
            />
            <p className="mt-1 text-[11.5px] leading-snug text-sv-ink/40">
              Default: {row.defaultText}
            </p>
          </div>
        ))}
        {visible.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-sv-ink/45">No texts match “{q}”.</p>
        ) : null}
      </div>
    </form>
  )
}
