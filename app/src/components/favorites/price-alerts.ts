import { useCallback, useEffect, useState } from 'react'

/**
 * Price-alert toggles per listing id (map id → true).
 * ponytail: UI + local persistence only — alert delivery (email/push) is
 * deferred until a notifications backend exists. 'sivrce:price-alerts' is
 * the storage contract the backend should read later.
 */
const KEY = 'sivrce:price-alerts'
const EVENT = 'sivrce:price-alerts-changed'

function readAlerts(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : {}
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {}
    const out: Record<string, boolean> = {}
    for (const [k, v] of Object.entries(parsed)) if (v === true) out[k] = true
    return out
  } catch {
    return {}
  }
}

export function usePriceAlerts() {
  const [alerts, setAlerts] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const sync = () => setAlerts(readAlerts())
    sync()
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const toggle = useCallback((id: string) => {
    const next = { ...readAlerts() }
    if (next[id]) delete next[id]
    else next[id] = true
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      /* storage full / private mode — ignore */
    }
    window.dispatchEvent(new CustomEvent(EVENT))
    setAlerts(next)
  }, [])

  const has = useCallback((id: string) => alerts[id] === true, [alerts])

  return { alerts, toggle, has }
}
