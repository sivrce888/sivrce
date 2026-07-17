"use client"

import { useRef } from "react"

/**
 * Reject button that captures a required reason via window.prompt before
 * submitting — same shape as ConfirmButton, plus the reason field.
 */
export function RejectVerificationButton({
  action,
  id,
}: {
  action: (formData: FormData) => void | Promise<void>
  id: string
}) {
  const reasonRef = useRef<HTMLInputElement>(null)
  return (
    <form
      action={action}
      onSubmit={(e) => {
        const reason = window.prompt("Rejection reason (required):")
        if (!reason?.trim()) {
          e.preventDefault()
          return
        }
        if (reasonRef.current) reasonRef.current.value = reason.trim()
      }}
      className="inline-flex"
    >
      <input type="hidden" name="id" value={id} />
      <input ref={reasonRef} type="hidden" name="reason" defaultValue="" />
      <button
        type="submit"
        className="inline-flex h-9 items-center justify-center rounded-[var(--radius-control)] bg-rose-600 px-3.5 text-[12.5px] font-bold whitespace-nowrap text-white transition-colors hover:bg-rose-700"
      >
        Reject
      </button>
    </form>
  )
}
