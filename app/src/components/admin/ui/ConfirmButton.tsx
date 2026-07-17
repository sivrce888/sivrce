"use client"

import { useRef } from "react"

type Tone = "primary" | "danger" | "ghost" | "warning"

const TONE_CLS: Record<Tone, string> = {
  primary: "bg-sv-blue text-white hover:bg-sv-blue-deep",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
  warning: "bg-amber-500 text-white hover:bg-amber-600",
  ghost:
    "border border-sv-ink/12 bg-white text-sv-ink/75 hover:border-sv-ink/25 hover:text-sv-ink",
}

/**
 * Server-action submit button with a native confirm() gate.
 * `fields` are posted as hidden inputs; the action receives FormData.
 */
export function ConfirmButton({
  action,
  fields,
  label,
  confirm,
  tone = "ghost",
  disabled,
}: {
  action: (formData: FormData) => void | Promise<void>
  fields: Record<string, string>
  label: string
  /** When set, shows window.confirm; omit for non-destructive actions. */
  confirm?: string
  tone?: Tone
  disabled?: boolean
}) {
  const ref = useRef<HTMLButtonElement>(null)
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault()
      }}
      className="inline-flex"
    >
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button
        ref={ref}
        type="submit"
        disabled={disabled}
        className={`inline-flex h-9 items-center justify-center rounded-[var(--radius-control)] px-3.5 text-[12.5px] font-bold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${TONE_CLS[tone]}`}
      >
        {label}
      </button>
    </form>
  )
}
