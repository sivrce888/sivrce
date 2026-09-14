"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { lt } from "./i18n"
import type { Lang } from "@/lib/i18n/core"

/**
 * Cancel control for the guest booking page. Posts the same HMAC token the
 * confirmation mail carried to the same same-origin endpoint StayBooker uses —
 * the server re-checks ownership and the state machine, this is only the UI.
 * ponytail: window.confirm, not a modal — cancelling is reversible by rebooking
 * and a dialog here would be a component nobody else needs.
 */
export function CancelStayButton({
  bookingId,
  token,
  lang,
}: {
  bookingId: string
  token: string
  lang: Lang
}) {
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  const onCancel = async () => {
    if (!window.confirm(lt(lang, "stayCancelConfirm"))) return
    setBusy(true)
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
      if (!res.ok) throw new Error(String(res.status))
      toast.success(lt(lang, "stayCancelled"))
      router.refresh()
    } catch {
      toast.error(lt(lang, "stayCancelFail"))
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
      {lt(lang, "stayCancelCta")}
    </button>
  )
}
