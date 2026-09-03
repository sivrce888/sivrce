"use client"

import { useEffect } from "react"
import Link from "next/link"
import { RotateCcw, TriangleAlert } from "lucide-react"

/**
 * Admin-only error boundary — renders inside the admin shell (sidebar stays),
 * so a DB hiccup no longer dumps admins onto the public error page.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <span className="grid h-14 w-14 place-items-center rounded-[var(--radius-tile)] border border-sv-ink/6 bg-white shadow-[var(--shadow-card)]">
        <TriangleAlert className="h-6 w-6 text-sv-orange" />
      </span>
      <h1 className="mt-5 text-[20px] font-extrabold tracking-tight text-sv-ink">
        This screen failed to load
      </h1>
      <p className="mt-2 max-w-[420px] text-[13.5px] text-sv-ink/55">
        The data behind this page could not be fetched. Nothing was changed —
        retry, and if it keeps failing, check system health.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-[12px] text-sv-ink/40">
          Reference: {error.digest}
        </p>
      ) : null}
      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="flex h-10 items-center gap-2 rounded-full bg-sv-blue px-5 text-[13px] font-extrabold text-white transition-colors hover:opacity-90"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Retry
        </button>
        <Link
          href="/admin/system"
          className="flex h-10 items-center rounded-full border border-sv-ink/10 bg-white px-5 text-[13px] font-extrabold text-sv-ink/70 transition-colors hover:border-sv-blue hover:text-sv-blue"
        >
          System health
        </Link>
      </div>
    </div>
  )
}
