'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import LocalizedLink from '@/components/LocalizedLink'
import { Bell, BellRing, Heart, Search } from 'lucide-react'
import ListingCard from '@/components/ListingCard'
import { useFavorites } from '@/lib/favorites'
import { useListingsByIds } from '@/lib/use-listings-by-ids'
import { useI18n } from '@/lib/i18n/context'
import { usePriceAlerts } from './price-alerts'
import { useFavoritesStrings } from './i18n'

export default function FavoritesClient() {
  const { favs } = useFavorites()
  const { has: hasLocal, toggle: toggleLocal } = usePriceAlerts()
  const { data: session } = useSession()
  const { lang } = useI18n()
  const tt = useFavoritesStrings()
  const [mounted, setMounted] = useState(false)
  const [serverIds, setServerIds] = useState<Set<string> | null>(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Logged-in: hydrate watches from server (email path). Guest: localStorage only.
  useEffect(() => {
    if (!session?.user) return
    let alive = true
    fetch('/api/price-watches')
      .then((r) => r.json())
      .then((j) => {
        if (!alive || !j.ok || !Array.isArray(j.ids)) return
        setServerIds(new Set(j.ids as string[]))
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [session?.user])

  const activeServerIds = session?.user ? serverIds : null

  const { items, loading } = useListingsByIds(mounted ? favs : [])

  const hasAlert = useCallback(
    (id: string) => (activeServerIds ? activeServerIds.has(id) : hasLocal(id)),
    [activeServerIds, hasLocal],
  )

  const toggleAlert = useCallback(
    async (id: string) => {
      if (!session?.user) {
        toggleLocal(id)
        return
      }
      const on = serverIds?.has(id) ?? false
      const next = new Set(serverIds ?? [])
      if (on) {
        next.delete(id)
        setServerIds(next)
        const res = await fetch(`/api/price-watches?listingId=${encodeURIComponent(id)}`, { method: 'DELETE' })
        if (!res.ok) {
          next.add(id)
          setServerIds(new Set(next))
        }
      } else {
        next.add(id)
        setServerIds(next)
        const res = await fetch('/api/price-watches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId: id, lang }),
        })
        if (!res.ok) {
          next.delete(id)
          setServerIds(new Set(next))
        }
      }
    },
    [session?.user, serverIds, toggleLocal, lang],
  )

  if (!mounted || (favs.length > 0 && loading)) {
    return (
      <div className="sv-card-grid-3" aria-busy="true">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-card border border-sv-ink/[0.06] bg-sv-surface shadow-card">
            <div className="sv-skeleton aspect-[4/3]" />
            <div className="space-y-3 p-4">
              <div className="sv-skeleton h-6 w-2/5 rounded-full" />
              <div className="sv-skeleton h-4 w-3/4 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (favs.length === 0 || items.length === 0) {
    return (
      <div className="sv-empty">
        <div className="grid h-16 w-16 place-items-center rounded-module bg-sv-orange/10 text-sv-orange">
          <Heart className="h-8 w-8" aria-hidden />
        </div>
        <h2 className="sv-h2 mt-5 text-sv-ink">{tt('emptyTitle')}</h2>
        <p className="sv-lead mx-auto mt-3 max-w-md text-sv-ink/60">{tt('emptyText')}</p>
        <LocalizedLink href="/search" className="sv-cta mt-8">
          <Search className="h-4 w-4" aria-hidden />
          {tt('searchCta')}
        </LocalizedLink>
      </div>
    )
  }

  return (
    <>
      <p className="mb-6 text-[15px] font-semibold text-sv-ink/60">
        {tt('savedCount')}: <span className="font-black text-sv-ink">{items.length}</span>
        {session?.user ? (
          <span className="ml-2 text-[13px] font-medium text-sv-ink/60">
            · {tt('alertHint')}
          </span>
        ) : null}
      </p>
      <div className="sv-card-grid-3">
        {items.map((l, i) => {
          const alertOn = hasAlert(l.id)
          return (
            <div key={l.id} className="relative">
              <ListingCard l={l} i={i} layout="wide" />
              <button
                aria-label={alertOn ? tt('priceAlertOn') : tt('priceAlertOff')}
                aria-pressed={alertOn}
                onClick={() => void toggleAlert(l.id)}
                className={`absolute right-4 top-[68px] z-10 grid h-11 w-11 place-items-center rounded-full backdrop-blur transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-blue ${
                  alertOn
                    ? 'bg-sv-surface text-sv-orange'
                    : 'bg-white/90 text-sv-ink hover:bg-sv-surface hover:text-sv-orange'
                }`}
              >
                {alertOn ? (
                  <BellRing className="h-4 w-4 fill-current" aria-hidden="true" />
                ) : (
                  <Bell className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          )
        })}
      </div>
    </>
  )
}
