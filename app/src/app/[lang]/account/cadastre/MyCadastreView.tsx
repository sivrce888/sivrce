'use client'

/**
 * /account/cadastre — the signed-in user's own listings on the cadastral map.
 * Listings with a cadastral code get their official NAPR ring (client fetch,
 * chunked); the rest are locatable points. Sidebar drives selection.
 */

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Layers, Loader2, MapPin, MapPinned } from 'lucide-react'
import LocalizedLink from '@/components/LocalizedLink'
import { useTheme } from 'next-themes'
import { statusPaint, type CadastreParcel, type CadastreStatus } from '@/lib/map/cadastre'
import { CadastreMapLazy } from '@/components/map/CadastreMapLazy'

export type MyListingPin = {
  slug: string
  publicId: number
  title: string
  price: number
  currency: string
  status: CadastreStatus
  city: string
  district: string
  lat: number
  lng: number
  cadastral: string | null
}

const STATUS_KA: Record<CadastreStatus, string> = {
  active: 'აქტიური',
  pending: 'მოლოდინში',
  sold: 'გაყიდული',
  expired: 'ვადაგასული',
  withdrawn: 'გაუქმებული',
}

function priceLabel(price: number, currency: string): string {
  return new Intl.NumberFormat('ka-GE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price)
}

export default function MyCadastreView({ pins, name }: { pins: MyListingPin[]; name?: string | null }) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [rings, setRings] = useState<Map<string, [number, number][]>>(new Map())
  const [settled, setSettled] = useState(false)
  const loading = pins.length > 0 && !settled
  const [selected, setSelected] = useState<string | null>(null)
  const [focus, setFocus] = useState<{ code: string; ring?: [number, number][]; lat: number; lng: number } | null>(null)

  // Fetch official rings per unique cadastral code — chunked, 4 at a time.
  useEffect(() => {
    if (pins.length === 0) return
    let cancelled = false
    const codes = [...new Set(pins.map((p) => p.cadastral).filter((c): c is string => Boolean(c)))]
    const got = new Map<string, [number, number][]>()
    const next = async (batch: string[]) => {
      await Promise.all(
        batch.map(async (code) => {
          try {
            const res = await fetch(`/api/napr?code=${encodeURIComponent(code)}`)
            if (!res.ok) return
            const data = await res.json()
            if (data?.ok && Array.isArray(data.ring) && data.ring.length >= 3) {
              got.set(code, data.ring)
            }
          } catch {
            /* registry hiccup — listing still shows as a point */
          }
        }),
      )
    }
    ;(async () => {
      for (let i = 0; i < codes.length; i += 4) {
        if (cancelled) return
        await next(codes.slice(i, i + 4))
      }
      if (!cancelled) {
        setRings(new Map(got))
        setSettled(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [pins])

  const parcels: CadastreParcel[] = useMemo(
    () =>
      pins
        .filter((p) => p.cadastral && rings.has(p.cadastral))
        .map((p) => ({
          code: p.cadastral!,
          ring: rings.get(p.cadastral!)!,
          lat: p.lat,
          lng: p.lng,
          status: p.status,
        })),
    [pins, rings],
  )

  const select = (pin: MyListingPin) => {
    setSelected(pin.slug)
    const ring = pin.cadastral ? rings.get(pin.cadastral) : undefined
    setFocus({ code: pin.cadastral ?? pin.slug, ring, lat: pin.lat, lng: pin.lng })
  }

  const chip = isDark
    ? 'border-white/10 bg-sv-navy/95 text-white shadow-soft backdrop-blur-xl'
    : 'border-sv-ink/[0.06] bg-sv-surface text-sv-ink shadow-soft'
  const hair = isDark ? 'border-white/10' : 'border-sv-ink/[0.06]'
  const muted = isDark ? 'text-white/50' : 'text-sv-ink/50'

  const counts = useMemo(() => {
    const c: Partial<Record<CadastreStatus, number>> = {}
    for (const p of pins) c[p.status] = (c[p.status] ?? 0) + 1
    return c
  }, [pins])

  return (
    <div className="flex h-dvh flex-col bg-sv-cloud dark:bg-sv-navy">
      <header
        className={`z-40 flex h-[calc(4rem+env(safe-area-inset-top,0px))] shrink-0 items-center gap-3 border-b px-4 pt-[env(safe-area-inset-top,0px)] md:px-6 ${hair} ${chip}`}
      >
        <LocalizedLink
          href="/account"
          aria-label="უკან, ჩემს სივრცეში"
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border transition focus-visible:outline-2 focus-visible:outline-sv-blue/50 focus-visible:-outline-offset-2 ${hair} ${muted}`}
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
        </LocalizedLink>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-black tracking-tight">
            ჩემი ქონება საკადასტრო რუკაზე
          </h1>
          <p className={`truncate text-[12px] font-medium ${muted}`}>
            {name ? `${name} · ` : ''}
            {pins.length > 0
              ? `${pins.length} განცხადება${counts.active ? ` · ${counts.active} აქტიური` : ''}${
                  counts.sold ? ` · ${counts.sold} გაყიდული` : ''
                }`
              : 'განცხადებები არ არის'}
          </p>
        </div>
        {loading && (
          <p className={`flex shrink-0 items-center gap-2 text-[12px] font-bold ${muted}`}>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            <span className="hidden sm:inline">ნაკვეთების საზღვრები იტვირთება…</span>
          </p>
        )}
      </header>

      {pins.length === 0 ? (
        <div className="grid flex-1 place-items-center px-4">
          <div className={`max-w-sm rounded-tile border p-8 text-center ${hair} ${chip}`}>
            <MapPinned className="mx-auto h-8 w-8 text-sv-blue" strokeWidth={1.75} aria-hidden />
            <h2 className="mt-4 text-[17px] font-black tracking-tight">საკადასტრო ნაკვეთები ჯერ არ არის</h2>
            <p className={`mt-2 text-[13px] font-medium leading-relaxed ${muted}`}>
              განცხადებებს საკადასტრო კოდი არ აქვთ — დაამატეთ კოდი და თქვენი ქონება რუკაზე
              ოფიციალური საზღვრებით გამოჩნდება.
            </p>
            <LocalizedLink
              href="/add-listing"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-pill bg-sv-orange px-5 text-[13px] font-extrabold text-white shadow-glow-orange transition hover:-translate-y-0.5"
            >
              განცხადების დამატება
            </LocalizedLink>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* Map — first on mobile, main pane on desktop */}
          <div className="relative order-1 h-[52dvh] min-h-[20rem] lg:order-2 lg:h-auto lg:min-h-0 lg:flex-1">
            <CadastreMapLazy
              parcels={parcels}
              selectedCode={
                pins.find((p) => p.slug === selected)?.cadastral ?? null
              }
              focus={focus}
              onSelectParcel={(code) => {
                const pin = pins.find((p) => p.cadastral === code)
                if (pin) setSelected(pin.slug)
              }}
            />
          </div>

          {/* Sidebar */}
          <aside
            className={`order-2 flex min-h-0 flex-col border-t lg:order-1 lg:w-80 lg:shrink-0 lg:border-r lg:border-t-0 ${hair}`}
            aria-label="განცხადებების სია"
          >
            <ul className="min-h-0 flex-1 divide-y overflow-y-auto overscroll-contain lg:divide-y">
              {pins.map((pin) => {
                const active = selected === pin.slug
                const hasRing = Boolean(pin.cadastral && rings.has(pin.cadastral))
                return (
                  <li key={pin.slug}>
                    <button
                      type="button"
                      onClick={() => select(pin)}
                      aria-pressed={active}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition focus-visible:outline-2 focus-visible:outline-sv-blue/50 focus-visible:-outline-offset-2 ${
                        active ? (isDark ? 'bg-white/[0.07]' : 'bg-sv-blue/[0.06]') : ''
                      } hover:bg-sv-ink/[0.03] dark:hover:bg-white/[0.05]`}
                    >
                      <span
                        aria-hidden
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          background: statusPaint(pin.status).fill,
                          boxShadow: hasRing ? undefined : 'inset 0 0 0 2px rgba(255,255,255,0.45)',
                        }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-extrabold">
                          {pin.title || `${pin.city}${pin.district ? ` · ${pin.district}` : ''}`}
                        </span>
                        <span className={`mt-0.5 flex items-center gap-1.5 text-[11px] font-bold ${muted}`}>
                          {priceLabel(pin.price, pin.currency)}
                          <span aria-hidden>·</span>
                          {STATUS_KA[pin.status]}
                        </span>
                        <span className={`mt-0.5 flex items-center gap-1 truncate text-[11px] font-medium ${muted}`}>
                          {pin.cadastral ? (
                            hasRing ? (
                              <>
                                <Layers className="h-3 w-3 shrink-0" aria-hidden />
                                {pin.cadastral}
                              </>
                            ) : (
                              <>
                                <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                                მხოლოდ მდებარეობა · {pin.cadastral}
                              </>
                            )
                          ) : (
                            <>
                              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                              საკადასტრო კოდი არ აქვს
                            </>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <p className={`shrink-0 border-t px-4 py-2.5 text-[11px] font-medium ${hair} ${muted}`}>
              საზღვრები საჯარო რეესტრიდან (NAPR) — მწვანე: აქტიური, ნარინჯისფერი: მოლოდინში,
              მუქი: დახურული.
            </p>
          </aside>
        </div>
      )}
    </div>
  )
}
