import { useCallback, useEffect, useState } from "react"

/** Max homes side-by-side — rivals have zero; 4 keeps the table readable. */
export const COMPARE_MAX = 4

const KEY = "sivrce:compare"
const EVENT = "sivrce:compare-changed"

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : []
  } catch {
    return []
  }
}

function writeIds(ids: string[]): string[] {
  const next = ids.slice(0, COMPARE_MAX)
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* private mode / full */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT))
  }
  return next
}

export function getCompareIds(): string[] {
  return readIds()
}

/** Toggle id in tray. Returns next ids. No-op add when full and id not already in. */
export function toggleCompare(id: string): string[] {
  const cur = readIds()
  if (cur.includes(id)) return writeIds(cur.filter((x) => x !== id))
  if (cur.length >= COMPARE_MAX) return cur
  return writeIds([...cur, id])
}

export function clearCompare(): void {
  writeIds([])
}

export function useCompare() {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    const sync = () => setIds(readIds())
    sync()
    window.addEventListener(EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  const toggle = useCallback((id: string) => setIds(toggleCompare(id)), [])
  const clear = useCallback(() => {
    clearCompare()
    setIds([])
  }, [])
  const has = useCallback((id: string) => ids.includes(id), [ids])
  const full = ids.length >= COMPARE_MAX

  return { ids, count: ids.length, toggle, clear, has, full, max: COMPARE_MAX }
}
