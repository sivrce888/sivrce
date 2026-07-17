import { useCallback, useEffect, useState } from 'react'

const KEY = 'sivrce:favs'
const EVENT = 'sivrce:favs-changed'

function readFavs(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function getFavorites(): string[] {
  return readFavs()
}

export function toggleFavorite(id: string): string[] {
  const favs = readFavs()
  const next = favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id]
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage full / private mode — ignore */
  }
  window.dispatchEvent(new CustomEvent(EVENT))
  return next
}

export function useFavorites() {
  // Init empty to match SSR, then hydrate from localStorage on mount —
  // otherwise returning users hit a hydration mismatch.
  const [favs, setFavs] = useState<string[]>([])

  useEffect(() => {
    const sync = () => setFavs(readFavs())
    sync()
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const toggle = useCallback((id: string) => setFavs(toggleFavorite(id)), [])
  const has = useCallback((id: string) => favs.includes(id), [favs])

  return { favs, count: favs.length, toggle, has }
}
