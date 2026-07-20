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
    if (!session?.user) {
      setServerIds(null)
      return
    }
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

  const { items, loading } = useListingsByIds(mounted ? favs : [])

  const hasAlert = useCallback(
    (id: string) => (serverIds ? serverIds.has(id) : hasLocal(id)),
    [serverIds, hasLocal],
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
        await fetch(`/api/price-watches?listingId=${encodeURIComponent(id)}`, { method: 'DELETE' })
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
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-80 animate-pulse rounded-card bg-sv-cloud ring-1 ring-sv-ink/5" />
        ))}
      </div>
    )
  }

  if (favs.length === 0 || items.length === 0) {
    return (
      <div className="rounded-card bg-white px-6 py-16 text-center shadow-card ring-1 ring-sv-ink/5">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-module bg-sv-orange/10">
          <Heart className="h-8 w-8 text-sv-orange" />
        </div>
        <h2 className="mt-6 text-2xl font-black tracking-[-0.02em] text-sv-ink text-balance">
          ფავორიტები ჯერ ცარიელია
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[15px] font-medium text-sv-ink/60">
          დააჭირე გულის ხატულას ნებისმიერ განცხადებაზე და ის აქ შეინახება — შენს მოწყობილობაზე.
        </p>
        <LocalizedLink
          href="/search"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-sv-orange px-7 py-3.5 text-sm font-bold text-white shadow-glow-orange transition hover:-translate-y-0.5 hover:shadow-glow-orange-lg"
        >
          <Search className="h-4 w-4" />
          განცხადებების ძიება
        </LocalizedLink>
      </div>
    )
  }

  return (
    <>
      <p className="mb-6 text-[15px] font-semibold text-sv-ink/60">
        შენახული განცხადება: <span className="font-black text-sv-ink">{items.length}</span>
        {session?.user ? (
          <span className="ml-2 text-[13px] font-medium text-sv-ink/45">
            · ზარის ნიშანი = ფასის ელფოსტა (პარამეტრებში ჩართული ალერტები)
          </span>
        ) : null}
      </p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((l, i) => {
          const alertOn = hasAlert(l.id)
          return (
            <div key={l.id} className="relative">
              <ListingCard l={l} i={i} layout="wide" />
              <button
                aria-label={alertOn ? tt('priceAlertOn') : tt('priceAlertOff')}
                aria-pressed={alertOn}
                onClick={() => void toggleAlert(l.id)}
                className={`absolute right-4 top-[68px] z-10 grid h-11 w-11 place-items-center rounded-full backdrop-blur transition-all duration-300 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-blue ${
                  alertOn
                    ? 'bg-sv-surface text-sv-orange'
                    : 'bg-white/90 text-sv-navy hover:bg-sv-surface hover:text-sv-orange'
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
