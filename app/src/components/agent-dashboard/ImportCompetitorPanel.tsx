'use client'

import { useState } from 'react'
import { Link2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

import LocalizedLink from '@/components/LocalizedLink'
import {
  formatImportedListing,
  saveAddListingDraft,
  type ImportedListing,
} from '@/lib/competitor-import'

function parseUrls(raw: string): string[] {
  return raw.split(/[\s,]+/).map((u) => u.trim()).filter((u) => /^https?:\/\//i.test(u))
}

export default function ImportCompetitorPanel() {
  const router = useRouter()
  const [urls, setUrls] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [best, setBest] = useState<ImportedListing | null>(null)
  const [count, setCount] = useState(0)

  async function onImport() {
    const list = parseUrls(urls)
    if (!list.length) {
      setErr('ჩასვი ss.ge ან myhome.ge ლინკი')
      return
    }
    setBusy(true)
    setErr(null)
    setBest(null)
    try {
      const res = await fetch('/api/agent/import-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: list }),
      })
      if (res.status === 401) throw new Error('შესვლა საჭიროა')
      if (res.status === 429) throw new Error('ცოტა ხანში სცადე')
      const data = (await res.json()) as {
        ok?: boolean
        error?: string
        best?: ImportedListing
        bestId?: string | null
        listings?: ImportedListing[]
      }
      const picked =
        data.best ??
        data.listings?.find((l) => l.sourceId === data.bestId) ??
        data.listings?.[0] ??
        null
      if (!res.ok || !data.ok || !picked) throw new Error(data.error ?? 'import_failed')
      setBest(picked)
      setCount(data.listings?.length ?? 1)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'ვერ ჩაიტვირთა')
    } finally {
      setBusy(false)
    }
  }

  function onApply() {
    if (!best) return
    saveAddListingDraft(best)
    router.push('/add-listing')
  }

  return (
    <section className="mb-6 rounded-card border border-sv-ink/[0.06] bg-sv-surface p-5 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-module bg-sv-blue/10 text-sv-blue">
          <Link2 size={18} strokeWidth={2.25} />
        </span>
        <div>
          <h2 className="text-[15px] font-extrabold text-sv-ink">სხვა საიტიდან</h2>
          <p className="text-[12px] font-medium text-sv-ink/50">ss.ge · myhome.ge · livo.ge — ფოტოების გარეშე</p>
        </div>
      </div>

      <textarea
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
        rows={2}
        placeholder="https://ss.ge/ka/... ან https://www.myhome.ge/ka/pr/..."
        className="w-full resize-none rounded-control border border-sv-ink/10 bg-sv-cloud px-3 py-2.5 text-[13px] font-medium text-sv-ink outline-none ring-sv-blue/20 placeholder:text-sv-ink/35 focus:border-sv-blue/40 focus:ring-2"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onImport}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full bg-sv-blue px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-sv-blue-deep disabled:opacity-60"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : null}
          {busy ? 'იტვირთება…' : 'ჩამოტვირთვა'}
        </button>
        {best ? (
          <button
            type="button"
            onClick={onApply}
            className="inline-flex items-center gap-1.5 rounded-full bg-sv-orange px-5 py-2.5 text-[13px] font-bold text-white shadow-glow-orange transition hover:opacity-95"
          >
            ფორმაზე გადატანა
          </button>
        ) : null}
        <LocalizedLink
          href="/add-listing"
          className="text-[12px] font-bold text-sv-blue hover:underline"
        >
          ხელით დამატება →
        </LocalizedLink>
      </div>

      {err ? <p className="mt-3 text-[12px] font-semibold text-sv-orange">{err}</p> : null}

      {best ? (
        <pre className="mt-4 max-h-56 overflow-auto whitespace-pre-wrap rounded-module border border-sv-ink/6 bg-sv-cloud/80 p-3 text-[11.5px] font-medium leading-relaxed text-sv-ink/80">
          {count > 1 ? `★ საუკეთესო ${count}-დან\n` : ''}
          {formatImportedListing(best)}
        </pre>
      ) : null}
    </section>
  )
}
