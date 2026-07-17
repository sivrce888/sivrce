'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Bookmark, Check, Trash2 } from 'lucide-react'
import { useI18n, type DictKey } from '@/lib/i18n/context'
import { useSavedSearches } from '@/lib/saved-searches'
import { useSearchStrings } from './i18n'

/* Deal/type labels reuse the shared dict keys already used by SearchClient */
const DEAL_KEYS: Record<string, DictKey> = {
  sale: 'search.sale',
  rent: 'search.rent',
  daily: 'add.deal.daily',
}
const TYPE_KEYS: Record<string, DictKey> = {
  apartment: 'prop.apartment',
  house: 'prop.house',
  commercial: 'prop.commercial',
  land: 'prop.land',
}

export default function SaveSearchControl() {
  const params = useSearchParams()
  const router = useRouter()
  const { t, lang } = useI18n()
  const tt = useSearchStrings()
  const { searches, save, remove } = useSavedSearches()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const query = params.toString()
  const isSaved = searches.some((s) => s.query === query)

  // Auto-label from the main facets: "იყიდება · ბინა · თბილისი · …"
  const currentLabel = () => {
    const parts: string[] = []
    const dealKey = DEAL_KEYS[params.get('deal') ?? '']
    if (dealKey) parts.push(t(dealKey))
    const typeKey = TYPE_KEYS[params.get('type') ?? '']
    if (typeKey) parts.push(t(typeKey))
    const city = params.get('city')
    if (city) parts.push(city)
    const district = params.get('district')
    if (district) parts.push(district)
    const q = params.get('q')
    if (q) parts.push(`„${q}"`)
    return parts.join(' · ') || tt('allListings')
  }

  const apply = (q: string) => {
    setOpen(false)
    router.push(q ? `/search?${q}` : '/search')
  }

  return (
    <div ref={rootRef} className="relative ml-auto">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={tt('saveSearch')}
        className="flex h-11 items-center gap-2 rounded-control border border-sv-ink/10 bg-sv-surface px-4 text-[13px] font-extrabold text-sv-ink/75 transition-colors hover:border-sv-blue/50 hover:text-sv-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue/30"
      >
        <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current text-sv-blue' : ''}`} aria-hidden="true" />
        {tt('saveSearch')}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={tt('savedSearches')}
          className="absolute right-0 top-full z-50 mt-2 w-[320px] max-w-[calc(100vw-2rem)] rounded-card border border-sv-ink/[0.08] bg-sv-surface p-2 shadow-card-hover"
        >
          <button
            onClick={() => save({ label: currentLabel(), query })}
            disabled={isSaved}
            className="flex h-11 w-full items-center gap-2 rounded-module px-3 text-[13px] font-extrabold text-sv-blue transition-colors hover:bg-sv-blue/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue/30 disabled:text-sv-ink/40 disabled:hover:bg-transparent"
          >
            {isSaved ? <Check className="h-4 w-4" aria-hidden="true" /> : <Bookmark className="h-4 w-4" aria-hidden="true" />}
            {isSaved ? tt('savedAlready') : tt('saveCurrent')}
          </button>

          <div className="mt-1 border-t border-sv-ink/[0.06] pt-1">
            {searches.length === 0 ? (
              <p className="px-3 py-4 text-center text-[13px] font-semibold text-sv-ink/45">{tt('empty')}</p>
            ) : (
              <ul className="max-h-[300px] overflow-y-auto">
                {searches.map((s) => (
                  <li key={s.id} className="flex items-center gap-1">
                    <button
                      onClick={() => apply(s.query)}
                      className="min-h-[44px] min-w-0 flex-1 rounded-module px-3 py-1.5 text-left transition-colors hover:bg-sv-ink/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue/30"
                    >
                      <span className="block truncate text-[13px] font-extrabold text-sv-ink">{s.label}</span>
                      <span className="block text-[11px] font-semibold text-sv-ink/40">
                        {new Date(s.createdAt).toLocaleDateString(lang)}
                      </span>
                    </button>
                    <button
                      onClick={() => remove(s.id)}
                      aria-label={`${tt('remove')}: ${s.label}`}
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-module text-sv-ink/35 transition-colors hover:bg-sv-orange/10 hover:text-sv-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue/30"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
