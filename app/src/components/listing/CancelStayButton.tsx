"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

/**
 * Cancel control for the guest booking page. Posts the same HMAC token the
 * confirmation mail carried to the same same-origin endpoint StayBooker uses —
 * the server re-checks ownership and the state machine, this is only the UI.
 *
 * Copy arrives as props, resolved by the server page. Importing `lt` here
 * instead would ship all ten language dicts (~33KB of source) to the browser
 * for three strings — the catalog-leak pattern this repo already guards.
 * ponytail: window.confirm, not a modal — cancelling is reversible by
 * rebooking, and a dialog here would be a component nobody else needs.
 */
export function CancelStayButton({
  bookingId,
  token,
  copy,
}: {
  bookingId: string
  token: string
  copy: { cta: string; confirm: string; done: string; failed: string }
}) {
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  const onCancel = async () => {
    if (!window.confirm(copy.confirm)) return
    setBusy(true)
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
      if (!res.ok) throw new Error(String(res.status))
      toast.success(copy.done)
      router.refresh()
    } catch {
      toast.error(copy.failed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onCancel}
      disabled={busy}
      className="rounded-control px-5 py-2.5 text-[14px] font-bold text-sv-ink/60 ring-1 ring-sv-ink/15 transition hover:text-sv-ink disabled:opacity-50"
    >
      {copy.cta}
    </button>
  )
}
