'use client'

/**
 * SearchHistory — recent search persistence in localStorage.
 * ponytail: localStorage only, no server roundtrip, max 10 entries.
 */

const STORAGE_KEY = 'siv_search_history'
const MAX_ENTRIES = 10

export interface SearchHistoryEntry {
  query: string
  filters: string
  timestamp: number
  /** Human-readable label for display */
  label: string
}

function isEntry(x: unknown): x is SearchHistoryEntry {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return (
    typeof o.query === 'string' &&
    typeof o.filters === 'string' &&
    typeof o.label === 'string' &&
    typeof o.timestamp === 'number' &&
    Number.isFinite(o.timestamp)
  )
}

/** Trust-boundary parse — localStorage is attacker-writable. */
export function parseSearchHistory(raw: string | null): SearchHistoryEntry[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isEntry).slice(0, MAX_ENTRIES)
  } catch {
    return []
  }
}

export function getSearchHistory(): SearchHistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    return parseSearchHistory(localStorage.getItem(STORAGE_KEY))
  } catch {
    return []
  }
}

export function addSearchHistory(entry: Omit<SearchHistoryEntry, 'timestamp'>): void {
  if (typeof window === 'undefined') return
  try {
    const history = getSearchHistory()
    // Dedupe: remove same query+filters combo
    const filtered = history.filter(
      (h) => h.query !== entry.query || h.filters !== entry.filters,
    )
    filtered.unshift({ ...entry, timestamp: Date.now() })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ENTRIES)))
  } catch {
    // Private mode or quota — silently ignore
  }
}

export function clearSearchHistory(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function removeSearchHistoryEntry(index: number): void {
  if (typeof window === 'undefined') return
  try {
    const history = getSearchHistory()
    history.splice(index, 1)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch {
    // ignore
  }
}
