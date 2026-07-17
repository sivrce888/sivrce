'use client'

import Link from 'next/link'
import { Search, Trash2 } from 'lucide-react'
import { useSavedSearches } from '@/lib/saved-searches'
import SectionHeader from './SectionHeader'
import { useAccountStrings } from './i18n'

export default function SavedSearchesCard() {
  const { searches, remove } = useSavedSearches()
  const tt = useAccountStrings()

  return (
    <section aria-label={tt('savedSearches')} className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card">
      <SectionHeader icon={Search} title={tt('savedSearches')} count={searches.length} chipClass="bg-sv-blue/10 text-sv-blue" />
      {searches.length === 0 ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-[14px] font-semibold text-sv-ink/50">
            {tt('noSavedSearches')} — {tt('saveSearchHint')}
          </p>
          <Link
            href="/search"
            className="inline-flex h-11 items-center rounded-full px-1 text-[14px] font-extrabold text-sv-blue transition-colors hover:text-sv-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue/30"
          >
            {tt('browse')}
          </Link>
        </div>
      ) : (
        <ul className="max-h-[260px] divide-y divide-sv-ink/[0.06] overflow-y-auto">
          {searches.map((s) => (
            <li key={s.id} className="flex items-center gap-1">
              <Link
                href={s.query ? `/search?${s.query}` : '/search'}
                className="flex min-h-[44px] min-w-0 flex-1 items-center rounded-module px-2 text-[14px] font-bold text-sv-ink transition-colors hover:bg-sv-ink/[0.04] hover:text-sv-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue/30"
              >
                <span className="truncate">{s.label}</span>
              </Link>
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
    </section>
  )
}
