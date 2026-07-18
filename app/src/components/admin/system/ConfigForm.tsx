"use client"

import { useActionState } from "react"

import { upsertConfig } from "@/app/[lang]/admin/system/actions"
import type { ConfigFormState } from "@/lib/admin/system"

const inputCls =
  "h-10 w-full rounded-[var(--radius-control)] border border-sv-ink/10 bg-white px-3 text-[13.5px] text-sv-ink outline-none placeholder:text-sv-ink/30 focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/25"
const textareaCls =
  "w-full rounded-[var(--radius-control)] border border-sv-ink/10 bg-white px-3 py-2.5 font-mono text-[12.5px] leading-relaxed text-sv-ink outline-none placeholder:text-sv-ink/30 focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/25"

/** With `row`: edit an existing key's JSON value. Without: create a new key. */
export function ConfigForm({ row }: { row?: { id: string; value: string } }) {
  const [state, formAction, pending] = useActionState<ConfigFormState, FormData>(upsertConfig, {
    error: null,
    saved: false,
  })

  return (
    <form action={formAction} className="space-y-3">
      {row ? (
        <input type="hidden" name="id" value={row.id} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="id"
            required
            pattern="[A-Za-z0-9_.:\-]{1,64}"
            placeholder="key.name"
            aria-label="Config key"
            className={`${inputCls} font-mono text-[12.5px]`}
          />
          <input
            name="description"
            placeholder="Description (optional)"
            aria-label="Description"
            className={inputCls}
          />
        </div>
      )}
      <textarea
        name="value"
        required
        rows={row ? Math.min(10, Math.max(3, row.value.split("\n").length + 1)) : 5}
        defaultValue={row?.value}
        placeholder='{ "enabled": true }'
        aria-label="Value (JSON)"
        className={textareaCls}
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center rounded-[var(--radius-control)] bg-sv-blue px-4 text-[12.5px] font-bold text-white transition-colors hover:bg-sv-blue-deep disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Saving…" : row ? "Save" : "Create config"}
        </button>
        {state.error ? (
          <p role="alert" className="text-[12.5px] font-bold text-rose-600">
            {state.error}
          </p>
        ) : state.saved ? (
          <p className="text-[12.5px] font-semibold text-emerald-600">Saved</p>
        ) : null}
      </div>
    </form>
  )
}
