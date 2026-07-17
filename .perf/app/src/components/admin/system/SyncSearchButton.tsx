"use client"

import { RefreshCw } from "lucide-react"
import { useState } from "react"

/** Triggers a full Meilisearch reindex via the admin-guarded API route. */
export function SyncSearchButton() {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  async function run() {
    setBusy(true)
    setResult(null)
    try {
      const res = await fetch("/api/admin/sync-search", { method: "POST" })
      const data = (await res.json()) as {
        ok?: boolean
        indexed?: number
        total?: number
        error?: string
      }
      setResult(
        data.ok
          ? { ok: true, text: `Indexed ${data.indexed ?? 0} of ${data.total ?? 0} listings` }
          : { ok: false, text: data.error ?? "Sync failed" },
      )
    } catch {
      setResult({ ok: false, text: "Request failed" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-control)] border border-sv-ink/12 bg-white px-3.5 text-[12.5px] font-bold text-sv-ink/75 transition-colors hover:border-sv-ink/25 hover:text-sv-ink disabled:cursor-not-allowed disabled:opacity-40"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
        {busy ? "Syncing…" : "Sync search index"}
      </button>
      {result ? (
        <p
          role={result.ok ? undefined : "alert"}
          className={`text-[12.5px] font-semibold ${result.ok ? "text-emerald-600" : "text-rose-600"}`}
        >
          {result.text}
        </p>
      ) : null}
    </div>
  )
}
