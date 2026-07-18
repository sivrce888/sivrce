import { useCallback, useEffect, useState } from 'react'

/**
 * Saved searches — same localStorage + CustomEvent pattern as
 * @/lib/favorites and @/lib/recent. Local-only until accounts sync lands.
 */
export interface SavedSearch {
  id: string
  label: string
  /** Query string without the leading '?' (e.g. 'deal=sale&type=apartment'). '' = unfiltered. */
  query: string
  createdAt: string // ISO
}

const KEY = 'sivrce:saved-searches'
const EVENT = 'sivrce:saved-searches-changed'
const MAX = 20

function readSaved(): SavedSearch[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (x): x is SavedSearch =>
        typeof x === 'object' &&
        x !== null &&
        typeof (x as SavedSearch).id === 'string' &&
        typeof (x as SavedSearch).label === 'string' &&
        typeof (x as SavedSearch).query === 'string' &&
        typeof (x as SavedSearch).createdAt === 'string',
    )
  } catch {
    return []
  }
}

function write(next: SavedSearch[]): SavedSearch[] {
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage full / private mode — ignore */
  }
  window.dispatchEvent(new CustomEvent(EVENT))
  return next
}

export function getSavedSearches(): SavedSearch[] {
  return readSaved()
}

/** Save a search. Dedupes by query — re-saving an identical filter set moves it to the top. */
export function saveSearch(input: { label: string; query: string }): SavedSearch[] {
  const entry: SavedSearch = {
    id:
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `s${Date.now()}`,
    label: input.label.trim() || '—',
    query: input.query,
    createdAt: new Date().toISOString(),
  }
  return write([entry, ...readSaved().filter((s) => s.query !== entry.query)].slice(0, MAX))
}

export function removeSavedSearch(id: string): SavedSearch[] {
  return write(readSaved().filter((s) => s.id !== id))
}

/** Saved searches, newest first. Empty on SSR; hydrates on mount. */
export function useSavedSearches() {
  const [searches, setSearches] = useState<SavedSearch[]>([])

  useEffect(() => {
    const sync = () => setSearches(readSaved())
    sync()
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const save = useCallback((input: { label: string; query: string }) => setSearches(saveSearch(input)), [])
  const remove = useCallback((id: string) => setSearches(removeSavedSearch(id)), [])

  return { searches, count: searches.length, save, remove }
}

/* ------------------------------------------------------------------ */
/*  Server sync (logged-in users) — /api/saved-searches                */
/*  localStorage stays the guest cache; the server copy drives alerts. */
/* ------------------------------------------------------------------ */

export interface ServerSavedSearch {
  id: string
  name: string
  query: string
  alertEnabled: boolean
  createdAt: string
}

/** null = logged out or unreachable — callers fall back to localStorage. */
export async function fetchServerSavedSearches(): Promise<ServerSavedSearch[] | null> {
  try {
    const res = await fetch('/api/saved-searches', { cache: 'no-store' })
    if (!res.ok) return null
    const json = (await res.json()) as { ok?: boolean; searches?: ServerSavedSearch[] }
    return json.ok && Array.isArray(json.searches) ? json.searches : null
  } catch {
    return null
  }
}

export async function saveServerSearch(input: {
  name: string
  query: string
  lang: string
}): Promise<'ok' | 'unauthorized' | 'error'> {
  try {
    const res = await fetch('/api/saved-searches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (res.status === 401) return 'unauthorized'
    return res.ok ? 'ok' : 'error'
  } catch {
    return 'error'
  }
}

export async function setServerSearchAlert(id: string, alertEnabled: boolean): Promise<boolean> {
  try {
    const res = await fetch('/api/saved-searches', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, alertEnabled }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function removeServerSearch(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/saved-searches?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    return res.ok
  } catch {
    return false
  }
}
