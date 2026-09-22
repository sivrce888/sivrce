"use client"

import { Sparkles } from "lucide-react"
import { useState } from "react"

interface Assist {
  summary: string
  buyerIntent: string
  urgency: "high" | "normal" | "low"
  nextBestAction: string
  suggestedReply: string
}

/** Staff-only AI assist: summary + next best action + a draft reply. */
export function AiAssist({ roomId }: { roomId: string }) {
  const [assist, setAssist] = useState<Assist | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/inbox/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      })
      if (!res.ok) {
        setError(res.status === 503 ? "AI is not configured" : "Assist failed — try again")
        return
      }
      const data = await res.json()
      setAssist(data.assist ?? null)
    } catch {
      setError("Network error — try again")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-module border border-sv-ink/10 bg-sv-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-[13.5px] font-black text-sv-ink">
          <Sparkles className="h-4 w-4 text-sv-blue" aria-hidden />
          AI assist
        </span>
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="rounded-control bg-sv-blue px-3 py-1.5 text-[12.5px] font-bold text-white transition-colors hover:bg-sv-blue-deep disabled:opacity-50"
        >
          {busy ? "Working…" : assist ? "Refresh" : "Summarize thread"}
        </button>
      </div>
      {error && <p className="mt-2 text-[12.5px] font-bold text-sv-orange">{error}</p>}
      {assist && (
        <dl className="mt-3 space-y-2 text-[13px] leading-relaxed">
          <div>
            <dt className="text-[11px] font-black uppercase tracking-wide text-sv-ink/50">Summary</dt>
            <dd className="text-sv-ink">{assist.summary}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-black uppercase tracking-wide text-sv-ink/50">Buyer wants</dt>
            <dd className="text-sv-ink">{assist.buyerIntent}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-black uppercase tracking-wide text-sv-ink/50">Urgency</dt>
            <dd className="text-sv-ink">{assist.urgency}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-black uppercase tracking-wide text-sv-ink/50">Next best action</dt>
            <dd className="text-sv-ink">{assist.nextBestAction}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-black uppercase tracking-wide text-sv-ink/50">Draft reply</dt>
            <dd className="rounded-control bg-sv-ink/[0.04] px-3 py-2 text-sv-ink">{assist.suggestedReply}</dd>
          </div>
        </dl>
      )}
      <p className="mt-3 text-[11.5px] font-semibold text-sv-ink/45">
        AI-generated from the thread — verify before acting or sending anything.
      </p>
    </div>
  )
}
