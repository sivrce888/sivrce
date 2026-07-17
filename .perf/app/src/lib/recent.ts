import { useEffect, useState } from 'react'

const KEY = 'sivrce:recent'
const EVENT = 'sivrce:recent-changed'
const MAX = 10

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

/** Prepend id (deduped, capped). Called from listing detail on mount. */
export function pushRecent(id: string) {
  const next = [id, ...readRecent().filter((x) => x !== id)].slice(0, MAX)
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage full / private mode — ignore */
  }
  window.dispatchEvent(new CustomEvent(EVENT))
}

/** Recently viewed ids, newest first. Empty on SSR; hydrates on mount. */
export function useRecentIds(): string[] {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    const sync = () => setIds(readRecent())
    sync()
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return ids
}
