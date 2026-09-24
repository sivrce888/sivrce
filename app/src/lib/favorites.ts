import { useCallback, useEffect, useState } from 'react'

import { ID_RE, favPatch, mergeFavs } from '@/lib/favorites-sync'

const KEY = 'sivrce:favs'
const EVENT = 'sivrce:favs-changed'
/** Last server list seen on this device, per user — the base of the 3-way merge. */
const BASE_KEY = 'sivrce:favs-base'
const ENDPOINT = '/api/account/favorites'

function readFavs(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

function writeFavs(next: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage full / private mode — ignore */
  }
  window.dispatchEvent(new CustomEvent(EVENT))
}

// Signed-in user id once a sync has run; null = guest, hearts stay local only.
let syncedUser: string | null = null

function post(patch: { add?: string[]; remove?: string[] }): Promise<string[] | null> {
  return fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { ids?: unknown } | null) => (Array.isArray(j?.ids) ? (j.ids as string[]) : null))
    .catch(() => null)
}

function readBase(): { u: string; ids: string[] } | null {
  try {
    const b = JSON.parse(localStorage.getItem(BASE_KEY) ?? 'null') as { u?: unknown; ids?: unknown } | null
    if (typeof b?.u !== 'string' || !Array.isArray(b.ids)) return null
    return { u: b.u, ids: b.ids.filter((x): x is string => typeof x === 'string') }
  } catch {
    return null
  }
}

/**
 * Reconcile this device with the signed-in user's saved listings. Called by
 * the session bridge when the user id changes; a no-op for the same user.
 */
export async function syncFavorites(userId: string | null): Promise<void> {
  if (userId === syncedUser) return
  syncedUser = userId
  if (!userId) return
  const stored = readBase()
  // Shared device: the hearts here were synced by someone else. They are safe
  // in that account — load this user's list instead of leaking theirs into it.
  const handover = stored !== null && stored.u !== userId
  const base = stored?.u === userId ? stored.ids : []
  const server = await post(handover ? {} : favPatch(readFavs().filter((id) => ID_RE.test(id)), base))
  if (!server || syncedUser !== userId) return
  writeFavs(handover ? server : mergeFavs(readFavs(), base, server))
  try {
    localStorage.setItem(BASE_KEY, JSON.stringify({ u: userId, ids: server }))
  } catch {
    /* ignore */
  }
}

export function getFavorites(): string[] {
  return readFavs()
}

export function toggleFavorite(id: string): string[] {
  const favs = readFavs()
  const on = !favs.includes(id)
  const next = on ? [...favs, id] : favs.filter((f) => f !== id)
  writeFavs(next)
  // Fire-and-forget: the heart never waits on the network. A failed write is
  // re-sent by the next sync's 3-way merge (the base still lacks/has it).
  if (syncedUser && ID_RE.test(id)) void post(on ? { add: [id] } : { remove: [id] })
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
