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
import { useI18n } from '@/lib/i18n/context'

function parseUrls(raw: string): string[] {
  return raw.split(/[\s,]+/).map((u) => u.trim()).filter((u) => /^https?:\/\//i.test(u))
}

const L = {
  ka: {
    errPaste: 'ჩასვი ss.ge, myhome.ge ან korter.ge ბმული',
    errAuth: 'შესვლა საჭიროა',
    errRate: 'ცოტა ხანში სცადე',
    errImport: 'ვერ ჩაიტვირთა',
    heading: 'სხვა საიტიდან',
    subline: 'ss.ge · myhome.ge · livo.ge · korter.ge — ფოტოების გარეშე',
    textareaAria: 'იმპორტის ბმულები',
    loading: 'იტვირთება…',
    importBtn: 'იმპორტი',
    applyBtn: 'ფორმაზე გადატანა',
    manualAdd: 'ხელით დამატება →',
    bestOf: (n: number) => `★ ${n}-დან საუკეთესო`,
  },
  en: {
    errPaste: 'Paste an ss.ge, myhome.ge or korter.ge link',
    errAuth: 'Sign-in required',
    errRate: 'Try again soon',
    errImport: 'Import failed',
    heading: 'From another site',
    subline: 'ss.ge · myhome.ge · livo.ge · korter.ge — no photos',
    textareaAria: 'Import links',
    loading: 'Loading…',
    importBtn: 'Import',
    applyBtn: 'Apply to form',
    manualAdd: 'Add manually →',
    bestOf: (n: number) => `★ Best of ${n}`,
  },
  de: {
    errPaste: 'Fügen Sie einen Link von ss.ge, myhome.ge oder korter.ge ein',
    errAuth: 'Anmeldung erforderlich',
    errRate: 'Versuchen Sie es später erneut',
    errImport: 'Import fehlgeschlagen',
    heading: 'Von einer anderen Website',
    subline: 'ss.ge · myhome.ge · livo.ge · korter.ge — ohne Fotos',
    textareaAria: 'Import-Links',
    loading: 'Wird geladen…',
    importBtn: 'Importieren',
    applyBtn: 'In das Formular übernehmen',
    manualAdd: 'Manuell hinzufügen →',
    bestOf: (n: number) => `★ Beste von ${n}`,
  },
} as const

export default function ImportCompetitorPanel() {
  const { lang } = useI18n()
  const T = L[lang === 'en' ? 'en' : lang === 'de' ? 'de' : 'ka']
  const router = useRouter()
  const [urls, setUrls] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [best, setBest] = useState<ImportedListing | null>(null)
  const [count, setCount] = useState(0)

  async function onImport() {
    const list = parseUrls(urls)
    if (!list.length) {
      setErr(T.errPaste)
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
      if (res.status === 401) throw new Error(T.errAuth)
      if (res.status === 429) throw new Error(T.errRate)
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
      setErr(e instanceof Error ? e.message : T.errImport)
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
        <span className="flex h-9 w-9 items-center justify-center rounded-module bg-sv-blue/10 text-sv-blue-deep">
          <Link2 size={18} strokeWidth={2.25} />
        </span>
        <div>
          <h2 className="text-[15px] font-extrabold text-sv-ink">{T.heading}</h2>
          <p className="text-[12px] font-medium text-sv-ink/60">{T.subline}</p>
        </div>
      </div>

      <textarea
        aria-label={T.textareaAria}
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
        rows={2}
        placeholder="https://ss.ge/ka/... · https://www.myhome.ge/ka/pr/... · https://korter.ge/binebis-yidva-gayidva-tbilisi/..."
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
          {busy ? T.loading : T.importBtn}
        </button>
        {best ? (
          <button
            type="button"
            onClick={onApply}
            className="inline-flex items-center gap-1.5 rounded-full bg-sv-orange px-5 py-2.5 text-[13px] font-bold text-sv-ink shadow-glow-orange transition hover:opacity-95"
          >
            {T.applyBtn}
          </button>
        ) : null}
        <LocalizedLink
          href="/add-listing"
          className="text-[12px] font-bold text-sv-blue hover:underline"
        >
          {T.manualAdd}
        </LocalizedLink>
      </div>

      {err ? <p className="mt-3 text-[12px] font-semibold text-sv-orange">{err}</p> : null}

      {best ? (
        <pre className="mt-4 max-h-56 overflow-auto whitespace-pre-wrap rounded-module border border-sv-ink/6 bg-sv-cloud/80 p-3 text-[11.5px] font-medium leading-relaxed text-sv-ink/80">
          {count > 1 ? `${T.bestOf(count)}\n` : ''}
          {formatImportedListing(best)}
        </pre>
      ) : null}
    </section>
  )
}
