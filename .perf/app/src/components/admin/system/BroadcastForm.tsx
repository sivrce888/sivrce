"use client"

import { useActionState } from "react"

import { sendBroadcast } from "@/app/admin/system/actions"
import type { BroadcastFormState } from "@/lib/admin/system"

const inputCls =
  "h-10 w-full rounded-[var(--radius-control)] border border-sv-ink/10 bg-white px-3 text-[13.5px] text-sv-ink outline-none placeholder:text-sv-ink/30 focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/25"
const textareaCls =
  "w-full rounded-[var(--radius-control)] border border-sv-ink/10 bg-white px-3 py-2.5 text-[13.5px] leading-relaxed text-sv-ink outline-none placeholder:text-sv-ink/30 focus:border-sv-blue focus:ring-2 focus:ring-sv-blue/25"

export function BroadcastForm() {
  const [state, formAction, pending] = useActionState<BroadcastFormState, FormData>(
    sendBroadcast,
    { error: null, createdCount: null },
  )

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="kind"
          required
          pattern="[a-z0-9_]{1,40}"
          placeholder="kind, e.g. announcement"
          aria-label="Kind"
          className={`${inputCls} font-mono text-[12.5px]`}
        />
        <input
          name="actionUrl"
          placeholder="Action URL — /path or https://… (optional)"
          aria-label="Action URL"
          className={inputCls}
        />
      </div>
      <input
        name="title"
        required
        maxLength={240}
        placeholder="Title"
        aria-label="Title"
        className={inputCls}
      />
      <textarea
        name="body"
        rows={4}
        placeholder="Body (optional)"
        aria-label="Body"
        className={textareaCls}
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center rounded-[var(--radius-control)] bg-sv-blue px-4 text-[12.5px] font-bold text-white transition-colors hover:bg-sv-blue-deep disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Sending…" : "Send broadcast"}
        </button>
        {state.error ? (
          <p role="alert" className="text-[12.5px] font-bold text-rose-600">
            {state.error}
          </p>
        ) : state.createdCount !== null ? (
          <p className="text-[12.5px] font-semibold text-emerald-600">
            Sent to {state.createdCount} users
          </p>
        ) : null}
      </div>
    </form>
  )
}
