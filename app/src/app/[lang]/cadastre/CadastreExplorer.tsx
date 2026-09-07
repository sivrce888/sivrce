'use client'

/**
 * /cadastre explorer — code search + tap-to-lookup over CadastreMap.
 * Registry data flows from the existing /api/napr route (NAPR official rings).
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, Loader2, MapPin, Search, TriangleAlert } from 'lucide-react'
import LocalizedLink from '@/components/LocalizedLink'
import { useI18n } from '@/lib/i18n/context'
import { parseCadastralCode } from '@/lib/listing-public-id'
import { parcelAreaM2 } from '@/lib/map/cadastre'
import { CadastreMapLazy } from '@/components/map/CadastreMapLazy'

type Parcel = { code: string; ring: [number, number][]; lat: number; lng: number }

type Status = 'idle' | 'loading' | 'invalid' | 'notfound' | 'error' | 'found'

function formatArea(ring: [number, number][]): string | null {
  const m2 = parcelAreaM2(ring)
  if (m2 === null || m2 <= 0) return null
  return m2 >= 10_000
    ? `${(m2 / 10_000).toLocaleString(undefined, { maximumFractionDigits: 2 })} ha`
    : `${Math.round(m2).toLocaleString()} m²`
}

export default function CadastreExplorer() {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [parcel, setParcel] = useState<Parcel | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const seqRef = useRef(0)

  const lookup = useCallback(
    async (raw: string, kind: 'code' | 'point', point?: { lat: number; lng: number }) => {
      const seq = ++seqRef.current
      setStatus('loading')
      try {
        const qs =
          kind === 'code'
            ? `code=${encodeURIComponent(raw)}`
            : `lat=${point!.lat}&lng=${point!.lng}`
        const res = await fetch(`/api/napr?${qs}`)
        if (seq !== seqRef.current) return
        if (!res.ok) {
          setStatus(res.status === 404 ? 'notfound' : 'error')
          return
        }
        const data = (await res.json()) as Partial<Parcel> & { ok: boolean }
        if (seq !== seqRef.current) return
        if (!data.ok || !Array.isArray(data.ring) || typeof data.code !== 'string') {
          setStatus('notfound')
          return
        }
        setParcel({
          code: data.code,
          ring: data.ring,
          lat: Number(data.lat),
          lng: Number(data.lng),
        })
        setStatus('found')
        if (kind === 'code') setQuery(data.code)
      } catch {
        if (seq === seqRef.current) setStatus('error')
      }
    },
    [],
  )

  // Deep link — /cadastre?code=01.10.01.001.001 is shareable and indexable.
  // Microtask defer: lookup flips state on entry, and effects must not setState synchronously.
  useEffect(() => {
    const code = searchParams.get('code')
    const parsed = code ? parseCadastralCode(code) : null
    if (!parsed) return
    queueMicrotask(() => void lookup(parsed, 'code'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = parseCadastralCode(query)
    if (!parsed) {
      setStatus('invalid')
      inputRef.current?.focus()
      return
    }
    void lookup(parsed, 'code')
  }

  const onPick = useCallback(
    (lat: number, lng: number) => void lookup('', 'point', { lat, lng }),
    [lookup],
  )

  const chip = 'border border-sv-ink/[0.06] bg-sv-surface/92 text-sv-ink shadow-soft backdrop-blur-xl'
  const area = parcel ? formatArea(parcel.ring) : null

  return (
    <>
      <CadastreMapLazy
        parcels={parcel ? [{ ...parcel, status: 'active' as const }] : []}
        selectedCode={parcel?.code ?? null}
        focus={parcel}
        onPick={onPick}
      />

      {/* Search panel */}
      <form
        onSubmit={onSubmit}
        className={`absolute left-1/2 top-3 z-20 w-[min(34rem,calc(100%-1.5rem))] -translate-x-1/2 rounded-tile p-2 md:top-4 ${chip}`}
        role="search"
        aria-label={t('cadastre.searchLabel')}
      >
        <div className="flex items-center gap-2">
          <Search className="ml-2 h-4 w-4 shrink-0 text-sv-ink/35" strokeWidth={2.25} aria-hidden />
          <input
            ref={inputRef}
            type="text"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (status === 'invalid' || status === 'notfound' || status === 'error') {
                setStatus('idle')
              }
            }}
            placeholder={t('cadastre.searchPlaceholder')}
            aria-label={t('cadastre.searchLabel')}
            aria-invalid={status === 'invalid'}
            className="h-10 min-w-0 flex-1 bg-transparent text-[14px] font-bold text-sv-ink outline-none placeholder:font-medium placeholder:text-sv-ink/35 focus-visible:outline-2 focus-visible:outline-sv-blue/50 focus-visible:-outline-offset-4 rounded-control"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            aria-busy={status === 'loading'}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-pill bg-sv-blue px-4 text-[13px] font-extrabold text-white shadow-glow-blue-sm transition hover:bg-sv-blue-deep disabled:opacity-60"
          >
            {status === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Search className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            )}
            <span className="hidden sm:inline">{t('cadastre.searchCta')}</span>
          </button>
        </div>
        {status === 'invalid' && (
          <p role="alert" className="flex items-center gap-1.5 px-2 pb-1 pt-1.5 text-[12px] font-bold text-sv-orange-deep">
            <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {t('cadastre.invalid')}
          </p>
        )}
        {status === 'notfound' && (
          <p role="alert" className="flex items-center gap-1.5 px-2 pb-1 pt-1.5 text-[12px] font-bold text-sv-ink/55">
            <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {t('cadastre.notFound')}
          </p>
        )}
        {status === 'error' && (
          <p role="alert" className="flex items-center gap-1.5 px-2 pb-1 pt-1.5 text-[12px] font-bold text-sv-ink/55">
            <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {t('cadastre.error')}
          </p>
        )}
        {status === 'idle' && (
          <p className="hidden px-2 pb-1 pt-1.5 text-[12px] font-medium text-sv-ink/45 sm:block">
            {t('cadastre.hint')}
          </p>
        )}
      </form>

      {/* Result card */}
      {status === 'found' && parcel && (
        <article
          className={`absolute bottom-3 left-1/2 z-20 w-[min(26rem,calc(100%-1.5rem))] -translate-x-1/2 rounded-tile p-4 md:bottom-4 ${chip}`}
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-sv-blue" strokeWidth={2.25} aria-hidden />
            <p className="min-w-0 flex-1 truncate text-[15px] font-black tracking-tight text-sv-ink">
              {parcel.code}
            </p>
            <span className="rounded-pill bg-sv-cloud px-2 py-0.5 text-[11px] font-extrabold text-sv-ink/55">
              {t('cadastre.code')}
            </span>
          </div>
          <dl className="mt-3 flex gap-4 text-[13px]">
            {area && (
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wide text-sv-ink/40">
                  {t('cadastre.area')}
                </dt>
                <dd className="mt-0.5 font-extrabold tabular-nums text-sv-ink">{area}</dd>
              </div>
            )}
            <div className="min-w-0">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-sv-ink/40">GPS</dt>
              <dd className="mt-0.5 truncate font-extrabold tabular-nums text-sv-ink">
                {parcel.lat.toFixed(5)}, {parcel.lng.toFixed(5)}
              </dd>
            </div>
          </dl>
          <LocalizedLink
            href={`/search?q=${encodeURIComponent(parcel.code)}`}
            className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-pill bg-sv-blue text-[13px] font-extrabold text-white shadow-glow-blue-sm transition hover:bg-sv-blue-deep"
          >
            {t('cadastre.searchListings')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" strokeWidth={2.25} aria-hidden />
          </LocalizedLink>
        </article>
      )}
    </>
  )
}
