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
