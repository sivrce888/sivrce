'use client'

import { useEffect, useState } from 'react'
import LocalizedLink from '@/components/LocalizedLink'
import { Bell, BellOff, Search, Trash2 } from 'lucide-react'
import {
  useSavedSearches,
  fetchServerSavedSearches,
  setServerSearchAlert,
  removeServerSearch,
  type ServerSavedSearch,
} from '@/lib/saved-searches'
import SectionHeader from './SectionHeader'
import { useAccountStrings } from './i18n'

export default function SavedSearchesCard() {
  const { searches, remove } = useSavedSearches()
  const tt = useAccountStrings()
  // null = guest/error → localStorage list; array = server-backed (alerts live).
  const [server, setServer] = useState<ServerSavedSearch[] | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetchServerSavedSearches().then((rows) => {
      if (!cancelled && rows) setServer(rows)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const toggle = async (s: ServerSavedSearch) => {
    const next = !s.alertEnabled
    setServer((rows) => rows?.map((r) => (r.id === s.id ? { ...r, alertEnabled: next } : r)) ?? rows)
    if (!(await setServerSearchAlert(s.id, next))) {
      setServer((rows) => rows?.map((r) => (r.id === s.id ? { ...r, alertEnabled: !next } : r)) ?? rows)
    }
  }

  const removeServer = async (s: ServerSavedSearch) => {
    setServer((rows) => rows?.filter((r) => r.id !== s.id) ?? rows)
    if (!(await removeServerSearch(s.id))) {
      setServer(await fetchServerSavedSearches())
    }
  }

  return (
    <section aria-label={tt('savedSearches')} className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card">
      <SectionHeader
        icon={Search}
        title={tt('savedSearches')}
        count={server ? server.length : searches.length}
        chipClass="bg-sv-blue/10 text-sv-blue"
      />
      {server ? (
        server.length === 0 ? (
          <p className="text-[14px] font-semibold text-sv-ink/50">
            {tt('noSavedSearches')} — {tt('saveSearchHint')}
          </p>
        ) : (
          <ul className="max-h-[260px] divide-y divide-sv-ink/[0.06] overflow-y-auto">
            {server.map((s) => (
              <li key={s.id} className="flex items-center gap-1">
                <LocalizedLink
                  href={s.query ? `/search?${s.query}` : '/search'}
                  className="flex min-h-[44px] min-w-0 flex-1 flex-col justify-center rounded-module px-2 transition-colors hover:bg-sv-ink/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue/30"
                >
                  <span className="truncate text-[14px] font-bold text-sv-ink hover:text-sv-blue">{s.name}</span>
                  <span className="text-[11px] font-semibold text-sv-ink/40">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </span>
                </LocalizedLink>
                <button
                  onClick={() => void toggle(s)}
                  aria-label={`${s.alertEnabled ? tt('alertsPause') : tt('alertsResume')}: ${s.name}`}
                  aria-pressed={s.alertEnabled}
                  title={s.alertEnabled ? tt('alertsPause') : tt('alertsResume')}
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-module transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue/30 ${
                    s.alertEnabled
                      ? 'text-sv-blue hover:bg-sv-blue/10'
                      : 'text-sv-ink/35 hover:bg-sv-ink/[0.06]'
                  }`}
                >
                  {s.alertEnabled ? <Bell className="h-4 w-4" aria-hidden="true" /> : <BellOff className="h-4 w-4" aria-hidden="true" />}
                </button>
                <button
                  onClick={() => void removeServer(s)}
                  aria-label={`${tt('remove')}: ${s.name}`}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-module text-sv-ink/35 transition-colors hover:bg-sv-orange/10 hover:text-sv-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue/30"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )
      ) : searches.length === 0 ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-[14px] font-semibold text-sv-ink/50">
            {tt('noSavedSearches')} — {tt('saveSearchHint')}
          </p>
          <LocalizedLink
            href="/search"
            className="inline-flex h-11 items-center rounded-full px-1 text-[14px] font-extrabold text-sv-blue transition-colors hover:text-sv-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue/30"
          >
            {tt('browse')}
          </LocalizedLink>
        </div>
      ) : (
        <ul className="max-h-[260px] divide-y divide-sv-ink/[0.06] overflow-y-auto">
          {searches.map((s) => (
            <li key={s.id} className="flex items-center gap-1">
              <LocalizedLink
                href={s.query ? `/search?${s.query}` : '/search'}
                className="flex min-h-[44px] min-w-0 flex-1 items-center rounded-module px-2 text-[14px] font-bold text-sv-ink transition-colors hover:bg-sv-ink/[0.04] hover:text-sv-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue/30"
              >
                <span className="truncate">{s.label}</span>
              </LocalizedLink>
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
