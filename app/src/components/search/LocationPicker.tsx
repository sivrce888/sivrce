'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Search, MapPin, ChevronLeft, Route, Check, TrainFront, Globe, LocateFixed, History } from 'lucide-react'
import { GEO_CITIES, GEO_MUNICIPALITIES, geoPickerColumns, geoRaionsOf } from '@/data/georgia-locations'
import { districtsOf } from '@/data/listings'
import { useI18n } from '@/lib/i18n/context'
import {
  compactDistrictParam,
  locationLabel,
  pushLocRecent,
  readLocRecent,
  locStamp,
  splitDistricts,
  type LocationValue,
} from '@/lib/search-location'
import type { Suggestion } from '@/components/search/SearchSuggest'
import { nearestMapCity } from '@/lib/map/user-place'

export type { LocationValue }
export { locationLabel }

const POPULAR = GEO_CITIES.slice(0, 10)
const ease = [0.21, 0.65, 0.2, 1] as const

type Pane = 'districts' | 'streets'

type Props = {
  open: boolean
  value: LocationValue
  onClose: () => void
  onApply: (v: LocationValue) => void
  /** Search: many უბანი. Add-listing: one. */
  multi?: boolean
  showMetro?: boolean
  /** Search can be Georgia-wide. Add-listing must pick a city. */
  nationwide?: boolean
}

export default function LocationPicker({
  open,
  value,
  onClose,
  onApply,
  multi = true,
  showMetro = false,
  nationwide = true,
}: Props) {
  const { t } = useI18n()
  const [city, setCity] = useState(value.city)
  const [picked, setPicked] = useState<string[]>(() => splitDistricts(value.district))
  const [street, setStreet] = useState(value.street)
  const [metro, setMetro] = useState(Boolean(value.metro))
  const [q, setQ] = useState('')
  const [pane, setPane] = useState<Pane>('districts')
  const [remote, setRemote] = useState<Suggestion[]>([])
  const [streets, setStreets] = useState<Suggestion[]>([])
  const [mounted, setMounted] = useState(false)
  const [nearby, setNearby] = useState<'idle' | 'locating' | 'denied' | 'miss'>('idle')
  const [recent, setRecent] = useState<LocationValue[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!open) return
    // ponytail: sync once per open. Parent `value`/`onClose` identity must not wipe in-progress picks.
    setCity(value.city)
    setPicked(splitDistricts(value.district))
    setStreet(value.street)
    setMetro(Boolean(value.metro))
    setQ('')
    setPane('districts')
    setNearby('idle')
    setRecent(readLocRecent())
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const tFocus = window.setTimeout(() => {
      // ponytail: skip mobile autofocus — keyboard covers destination cards.
      if (window.matchMedia('(pointer: fine)').matches) inputRef.current?.focus()
    }, 40)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.clearTimeout(tFocus)
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open-only
  }, [open])

  const distCsv = picked.join(',')

  useEffect(() => {
    if (!open) return
    const qn = q.trim()
    const browsing = pane === 'streets' && qn.length < 2
    if (qn.length < 2 && !browsing) {
      const tClr = window.setTimeout(() => { setRemote([]); setStreets([]) }, 0)
      return () => window.clearTimeout(tClr)
    }
    if (browsing && !city) {
      const tClr = window.setTimeout(() => setStreets([]), 0)
      return () => window.clearTimeout(tClr)
    }
    const ac = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const sp = new URLSearchParams()
        if (city) sp.set('city', city)
        if (distCsv) sp.set('district', distCsv)
        if (qn.length >= 2) sp.set('q', qn)
        else sp.set('browse', '1')
        const res = await fetch(`/api/suggest?${sp}`, { signal: ac.signal })
        const json = (await res.json()) as { ok?: boolean; suggestions?: Suggestion[] }
        if (ac.signal.aborted) return
        const list = json.ok ? (json.suggestions ?? []) : []
        if (qn.length >= 2) setRemote(list)
        else setStreets(list.filter((s) => s.kind === 'street'))
      } catch {
        /* aborted or offline */
      }
    }, 150)
    return () => { ac.abort(); window.clearTimeout(timer) }
  }, [open, q, city, distCsv, pane])

  const districts = useMemo(() => (city ? districtsOf(city) : []), [city])
  const raions = useMemo(() => (city ? geoRaionsOf(city) : {}), [city])
  const pickerCols = useMemo(() => (city ? geoPickerColumns(city) : []), [city])
  const leftover = useMemo(() => {
    const inPicker = new Set(pickerCols.flatMap((col) => col.flatMap((g) => g.items)))
    if (inPicker.size === 0) return districts
    return districts.filter((d) => !inPicker.has(d))
  }, [districts, pickerCols])
  const pickedSet = useMemo(() => new Set(picked), [picked])
  const chipDistricts = useMemo(
    () => splitDistricts(compactDistrictParam(picked, raions)),
    [picked, raions],
  )

  const qn = q.trim().toLowerCase()
  const cityHits = useMemo(() => {
    if (!qn) return []
    return [...GEO_CITIES, ...GEO_MUNICIPALITIES].filter((c) => c.toLowerCase().includes(qn)).slice(0, 12)
  }, [qn])
  const distHits = useMemo(() => {
    if (!qn || !city) return []
    return districts.filter((d) => d.toLowerCase().includes(qn)).slice(0, 24)
  }, [qn, city, districts])
  const streetHits = useMemo(
    () => remote.filter((s) => s.kind === 'street').slice(0, 16),
    [remote],
  )
  const remoteDistHits = useMemo(
    () => (city ? [] : remote.filter((s) => s.kind === 'district').slice(0, 8)),
    [remote, city],
  )

  const muniGroups = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const m of GEO_MUNICIPALITIES) {
      const letter = m[0] ?? '#'
      const list = map.get(letter) ?? []
      list.push(m)
      map.set(letter, list)
    }
    return [...map.entries()]
  }, [])

  const sidebarCities = useMemo(() => {
    const list = GEO_CITIES.slice(0, 14)
    if (city && !list.includes(city)) return [city, ...list]
    return list
  }, [city])

  const pickCity = (c: string) => {
    setCity(c)
    setPicked([])
    setStreet('')
    setQ('')
    setPane('districts')
  }

  const toggleDistrict = (name: string) => {
    if (multi) {
      setPicked((cur) => (cur.includes(name) ? cur.filter((x) => x !== name) : [...cur, name]))
      return
    }
    setPicked((cur) => (cur[0] === name ? [] : [name]))
  }

  const adoptDistrict = (name: string, nextCity?: string) => {
    if (nextCity) setCity(nextCity)
    setPicked([name])
    setQ('')
  }

  const pickStreet = (s: Suggestion) => {
    if (s.city) setCity(s.city)
    if (s.district) setPicked(splitDistricts(s.district))
    setStreet((cur) => (cur === s.ka ? '' : s.ka))
    setQ('')
  }

  const apply = () => {
    const next: LocationValue = {
      city,
      district: compactDistrictParam(picked, raions),
      street: street.trim(),
      ...(showMetro ? { metro } : {}),
    }
    setRecent(pushLocRecent(next))
    onApply(next)
  }

  const applyNationwide = () => {
    setCity('')
    setPicked([])
    setStreet('')
    setMetro(false)
    onApply({ city: '', district: '', street: '', ...(showMetro ? { metro: false } : {}) })
  }

  const adoptRecent = (v: LocationValue) => {
    setRecent(pushLocRecent(v))
    onApply({
      city: v.city,
      district: v.district,
      street: v.street,
      ...(showMetro ? { metro: Boolean(v.metro) } : {}),
    })
  }

  // ponytail: city snap via MAP_CITIES (55km). Street GPS stays on the map locate button.
  const locateNearby = () => {
    if (!navigator.geolocation || nearby === 'locating') return
    setNearby('locating')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const hit = nearestMapCity(pos.coords.latitude, pos.coords.longitude)
        if (!hit) {
          setNearby('miss')
          return
        }
        setNearby('idle')
        pickCity(hit.ka)
      },
      () => setNearby('denied'),
      { enableHighAccuracy: false, timeout: 8_000, maximumAge: 120_000 },
    )
  }

  const sheet = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-sv-navy/55 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="loc-title"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease }}
        >
          <motion.div
            className="flex h-[92dvh] w-full max-w-[1080px] flex-col overflow-hidden rounded-t-tile bg-sv-surface shadow-card-hover sm:h-[min(820px,92dvh)] sm:rounded-tile"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.35, ease }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-sv-ink/[0.06] px-5 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {city ? (
                    <button
                      type="button"
                      onClick={() => pickCity('')}
                      className="grid h-8 w-8 place-items-center rounded-control text-sv-ink/45 transition-colors hover:bg-sv-ink/[0.05] hover:text-sv-ink"
                      aria-label={t('loc.cities')}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                  ) : null}
                  <h2 id="loc-title" className="text-[17px] font-extrabold tracking-tight text-sv-ink">
                    {t('loc.title')}
                  </h2>
                </div>
                {(city || picked.length > 0 || street) && (
                  <div className="mt-2 flex max-h-[52px] flex-wrap items-center gap-1.5 overflow-y-auto">
                    {city ? (
                      <Chip onClear={() => pickCity('')}>{city}</Chip>
                    ) : null}
                    {chipDistricts.map((d) => (
                      <Chip key={d} onClear={() => toggleDistrict(d)}>
                        {d}
                      </Chip>
                    ))}
                    {street ? (
                      <Chip onClear={() => setStreet('')}>{street}</Chip>
                    ) : null}
                    {showMetro ? (
                      <button
                        type="button"
                        onClick={() => setMetro((m) => !m)}
                        aria-pressed={metro}
                        className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-extrabold transition-colors ${
                          metro
                            ? 'bg-sv-blue text-white'
                            : 'bg-sv-cloud text-sv-ink/70 hover:bg-sv-ink/[0.06]'
                        }`}
                      >
                        <TrainFront className="h-3.5 w-3.5" />
                        {t('search.nearMetro')}
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('loc.close')}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-control text-sv-ink/45 transition-colors hover:bg-sv-ink/[0.05] hover:text-sv-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-sv-ink/[0.06] px-5 py-3">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sv-ink/35" />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t('loc.searchPh')}
                  className="h-12 w-full rounded-control border border-sv-ink/10 bg-sv-cloud pl-10 pr-3.5 text-[14px] font-bold text-sv-ink outline-none placeholder:text-sv-ink/35 focus:border-sv-blue focus-visible:ring-2 focus-visible:ring-sv-blue/25"
                />
              </label>
            </div>

            {city && !qn ? (
              <div className="flex gap-1 border-b border-sv-ink/[0.06] px-5">
                {(['districts', 'streets'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPane(p)}
                    className={`relative h-11 px-3 text-[13px] font-extrabold transition-colors ${
                      pane === p ? 'text-sv-blue' : 'text-sv-ink/45 hover:text-sv-ink'
                    }`}
                  >
                    {p === 'districts' ? t('loc.districts') : t('loc.streets')}
                    {pane === p && (
                      <motion.span
                        layoutId="loc-tab"
                        className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-sv-blue"
                        transition={{ type: 'spring', bounce: 0.18, duration: 0.45 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
              {city && !qn ? (
                <nav
                  className="hidden w-[168px] shrink-0 overflow-y-auto border-r border-sv-ink/[0.06] bg-sv-cloud/60 py-2 sm:block"
                  aria-label={t('loc.cities')}
                >
                  {nationwide ? (
                    <button
                      type="button"
                      onClick={applyNationwide}
                      className="flex w-full items-center border-l-2 border-transparent px-3 py-2.5 text-left text-[13px] font-bold text-sv-ink/70 transition-colors hover:bg-sv-surface hover:text-sv-ink"
                    >
                      {t('search.allGeorgia')}
                    </button>
                  ) : null}
                  {sidebarCities.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => pickCity(c)}
                      className={`flex w-full items-center border-l-2 px-3 py-2.5 text-left text-[13px] font-bold transition-colors ${
                        city === c
                          ? 'border-sv-blue bg-sv-surface text-sv-blue'
                          : 'border-transparent text-sv-ink/70 hover:bg-sv-surface hover:text-sv-ink'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </nav>
              ) : null}

              <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-5 py-4">
                {qn ? (
                  <SearchResults
                    city={city}
                    cityHits={cityHits}
                    distHits={distHits}
                    remoteDistHits={remoteDistHits}
                    streetHits={streetHits}
                    pickedSet={pickedSet}
                    street={street}
                    onCity={pickCity}
                    onDistrict={toggleDistrict}
                    onAdoptDistrict={adoptDistrict}
                    onStreet={pickStreet}
                    empty={t('search.emptyTitle')}
                    citiesLabel={t('loc.cities')}
                    distLabel={t('search.district')}
                    streetsLabel={t('loc.streets')}
                  />
                ) : !city ? (
                  <>
                    <div className={`mb-7 grid min-w-0 gap-2 ${nationwide ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {nationwide ? (
                        <DestCard
                          selected
                          icon={Globe}
                          title={t('search.allGeorgia')}
                          hint={t('loc.georgiaHint')}
                          onClick={applyNationwide}
                        />
                      ) : null}
                      <DestCard
                        icon={LocateFixed}
                        title={t('loc.nearby')}
                        hint={
                          nearby === 'locating'
                            ? t('loc.locating')
                            : nearby === 'denied'
                              ? t('loc.denied')
                              : nearby === 'miss'
                                ? t('loc.nearbyFail')
                                : t('loc.nearbyHint')
                        }
                        hintWarn={nearby === 'denied' || nearby === 'miss'}
                        busy={nearby === 'locating'}
                        onClick={locateNearby}
                      />
                    </div>
                    {recent.length > 0 ? (
                      <section className="mb-7">
                        <h3 className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-sv-ink/40">
                          {t('loc.recents')}
                        </h3>
                        <ul className="space-y-0.5">
                          {recent.map((v) => (
                            <li key={locStamp(v)}>
                              <button
                                type="button"
                                onClick={() => adoptRecent(v)}
                                className="flex w-full items-center gap-2.5 rounded-control px-3 py-2.5 text-left text-[14px] font-bold text-sv-ink transition-colors hover:bg-sv-ink/[0.04]"
                              >
                                <History className="h-4 w-4 shrink-0 text-sv-blue" />
                                <span className="min-w-0 truncate">{locationLabel(v)}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ) : null}
                    <section className="mb-7">
                      <h3 className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-sv-ink/40">
                        {t('loc.popular')}
                      </h3>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                        {POPULAR.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => pickCity(c)}
                            className="flex items-center gap-2.5 rounded-control bg-sv-cloud px-3 py-2.5 text-left text-[13px] font-bold text-sv-ink transition-colors hover:bg-sv-ink/[0.06]"
                          >
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-control bg-sv-surface text-sv-ink/35">
                              <MapPin className="h-3.5 w-3.5" />
                            </span>
                            {c}
                          </button>
                        ))}
                      </div>
                    </section>
                    <section>
                      <h3 className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-sv-ink/40">
                        {t('loc.muni')}
                      </h3>
                      <div className="columns-2 gap-6 sm:columns-3">
                        {muniGroups.map(([letter, list]) => (
                          <div key={letter} className="mb-4 break-inside-avoid">
                            <div className="mb-1 rounded-md bg-sv-cloud px-2 py-1 text-[12px] font-extrabold text-sv-ink/50">
                              {letter}
                            </div>
                            <ul>
                              {list.map((m) => (
                                <li key={m}>
                                  <button
                                    type="button"
                                    onClick={() => pickCity(m)}
                                    className="w-full rounded-md px-2 py-1.5 text-left text-[13px] font-semibold text-sv-ink/80 hover:bg-sv-ink/[0.04] hover:text-sv-ink"
                                  >
                                    {m}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                ) : pane === 'streets' ? (
                  <StreetList
                    items={streets}
                    street={street}
                    onPick={pickStreet}
                    hint={t('loc.streetHint')}
                    empty={t('search.emptyTitle')}
                  />
                ) : (
                  <section>
                    <button
                      type="button"
                      onClick={() => { setPicked([]); setStreet('') }}
                      className={`mb-4 inline-flex items-center gap-2 rounded-control px-3 py-2 text-[13px] font-bold transition-colors ${
                        picked.length === 0
                          ? 'bg-sv-blue text-white'
                          : 'bg-sv-cloud text-sv-ink hover:bg-sv-ink/[0.06]'
                      }`}
                    >
                      {t('loc.wholeCity')}
                    </button>
                    {pickerCols.length > 0 ? (
                      <div className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
                        {pickerCols.map((col, i) => (
                          <div key={i} className="space-y-6">
                            {col.map((g) => (
                              <div key={g.title}>
                                <div className="mb-1.5 px-1 text-[13px] font-extrabold tracking-tight text-sv-ink">
                                  {g.title}
                                </div>
                                <ul className="space-y-0.5">
                                  {g.items.map((u) => (
                                    <li key={u}>
                                      <button
                                        type="button"
                                        onClick={() => toggleDistrict(u)}
                                        className="flex w-full items-center gap-2 rounded-control px-1 py-1.5 text-left text-[13px] font-semibold text-sv-ink/80 hover:bg-sv-ink/[0.04] hover:text-sv-ink"
                                      >
                                        <Tick on={pickedSet.has(u)} />
                                        {u}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        ))}
                        {leftover.map((d) => (
                          <div key={d}>
                            <button
                              type="button"
                              onClick={() => toggleDistrict(d)}
                              className="flex w-full items-center gap-2 rounded-control px-1 py-1.5 text-left text-[13px] font-semibold text-sv-ink/80 hover:bg-sv-ink/[0.04]"
                            >
                              <Tick on={pickedSet.has(d)} />
                              {d}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-2 lg:grid-cols-3">
                        {districts.map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => toggleDistrict(d)}
                            className="flex items-center gap-2 rounded-control px-2 py-2 text-left text-[13px] font-bold text-sv-ink hover:bg-sv-ink/[0.04]"
                          >
                            <Tick on={pickedSet.has(d)} />
                            {d}
                          </button>
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-sv-ink/[0.06] px-5 py-3.5">
              <button
                type="button"
                onClick={() => { setCity(''); setPicked([]); setStreet(''); setQ(''); setMetro(false) }}
                className="h-11 rounded-control px-3 text-[13px] font-extrabold text-sv-blue transition-colors hover:bg-sv-blue/10"
              >
                {t('search.clear')}
              </button>
              <button
                type="button"
                onClick={apply}
                className="h-11 min-w-[120px] rounded-full bg-sv-blue px-7 text-[13px] font-extrabold text-white shadow-glow-blue-sm transition-colors hover:bg-sv-blue-deep"
              >
                {t('loc.choose')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  if (!mounted) return null
  return createPortal(sheet, document.body)
}

function DestCard({
  selected,
  icon: Icon,
  title,
  hint,
  hintWarn,
  busy,
  onClick,
}: {
  selected?: boolean
  icon: typeof Globe
  title: string
  hint: string
  hintWarn?: boolean
  busy?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={Boolean(selected)}
      disabled={busy}
      onClick={onClick}
      className={`flex min-h-[104px] min-w-0 w-full flex-col items-start gap-3 rounded-module border p-3.5 text-left transition-colors disabled:opacity-70 ${
        selected
          ? 'border-sv-blue bg-sv-blue/[0.06] shadow-glow-blue-sm'
          : 'border-sv-ink/[0.06] bg-sv-cloud hover:border-sv-ink/12 hover:bg-sv-ink/[0.04]'
      }`}
    >
      <span
        className={`grid h-9 w-9 place-items-center rounded-control ${
          selected ? 'bg-sv-blue text-white' : 'bg-sv-surface text-sv-ink/45'
        }`}
      >
        {busy ? (
          <span className={`sv-spinner-sm ${selected ? 'sv-spinner-light' : ''}`} aria-hidden />
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-[14px] font-extrabold tracking-tight text-sv-ink">{title}</span>
        <span className={`mt-0.5 block text-[12px] font-semibold ${hintWarn ? 'text-sv-orange' : 'text-sv-ink/40'}`}>
          {hint}
        </span>
      </span>
    </button>
  )
}

function Tick({ on }: { on: boolean }) {
  return (
    <span
      className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border-2 transition-colors ${
        on ? 'border-sv-blue bg-sv-blue' : 'border-sv-ink/20 bg-sv-surface'
      }`}
    >
      {on ? <Check className="h-3 w-3 text-white" strokeWidth={3} /> : null}
    </span>
  )
}

function Chip({ children, onClear }: { children: string; onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="inline-flex max-w-[220px] items-center gap-1 rounded-full bg-sv-blue/10 px-2.5 py-0.5 text-[12px] font-bold text-sv-blue hover:bg-sv-blue/15"
    >
      <span className="truncate">{children}</span>
      <X className="h-3 w-3 shrink-0" />
    </button>
  )
}

function SearchResults({
  city,
  cityHits,
  distHits,
  remoteDistHits,
  streetHits,
  pickedSet,
  street,
  onCity,
  onDistrict,
  onAdoptDistrict,
  onStreet,
  empty,
  citiesLabel,
  distLabel,
  streetsLabel,
}: {
  city: string
  cityHits: string[]
  distHits: string[]
  remoteDistHits: Suggestion[]
  streetHits: Suggestion[]
  pickedSet: Set<string>
  street: string
  onCity: (c: string) => void
  onDistrict: (d: string) => void
  onAdoptDistrict: (d: string, city?: string) => void
  onStreet: (s: Suggestion) => void
  empty: string
  citiesLabel: string
  distLabel: string
  streetsLabel: string
}) {
  if (cityHits.length === 0 && distHits.length === 0 && remoteDistHits.length === 0 && streetHits.length === 0) {
    return <p className="py-10 text-center text-[14px] font-semibold text-sv-ink/45">{empty}</p>
  }
  return (
    <div className="space-y-4">
      {cityHits.length > 0 && (
        <section>
          <h3 className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-sv-ink/40">{citiesLabel}</h3>
          <ul className="space-y-0.5">
            {cityHits.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  onClick={() => onCity(c)}
                  className="flex w-full items-center gap-2.5 rounded-control px-3 py-2.5 text-left text-[14px] font-bold text-sv-ink hover:bg-sv-ink/[0.04]"
                >
                  <MapPin className="h-4 w-4 text-sv-blue" />
                  {c}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {distHits.length > 0 && (
        <section>
          <h3 className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-sv-ink/40">
            {distLabel}{city ? ` · ${city}` : ''}
          </h3>
          <ul className="space-y-0.5">
            {distHits.map((d) => (
              <li key={d}>
                <button
                  type="button"
                  onClick={() => onDistrict(d)}
                  className="flex w-full items-center gap-2.5 rounded-control px-3 py-2.5 text-left text-[14px] font-bold text-sv-ink hover:bg-sv-ink/[0.04]"
                >
                  <Tick on={pickedSet.has(d)} />
                  {d}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {remoteDistHits.length > 0 && (
        <section>
          <h3 className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-sv-ink/40">{distLabel}</h3>
          <ul className="space-y-0.5">
            {remoteDistHits.map((s) => (
              <li key={`${s.city}:${s.ka}`}>
                <button
                  type="button"
                  onClick={() => onAdoptDistrict(s.ka, s.city)}
                  className="flex w-full items-center gap-2.5 rounded-control px-3 py-2.5 text-left text-[14px] font-bold text-sv-ink hover:bg-sv-ink/[0.04]"
                >
                  <MapPin className="h-4 w-4 text-sv-blue" />
                  <span className="min-w-0">
                    <span className="block truncate">{s.ka}</span>
                    {s.city ? <span className="block text-[12px] font-semibold text-sv-ink/40">{s.city}</span> : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {streetHits.length > 0 && (
        <section>
          <h3 className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-sv-ink/40">{streetsLabel}</h3>
          <ul className="space-y-0.5">
            {streetHits.map((s) => (
              <li key={`${s.city}:${s.ka}`}>
                <button
                  type="button"
                  onClick={() => onStreet(s)}
                  className="flex w-full items-center gap-2.5 rounded-control px-3 py-2.5 text-left text-[14px] font-bold text-sv-ink hover:bg-sv-ink/[0.04]"
                >
                  <Route className="h-4 w-4 shrink-0 text-sv-blue" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{s.ka}</span>
                    <span className="block truncate text-[12px] font-semibold text-sv-ink/40">
                      {[s.district, s.city].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  {street === s.ka ? <Check className="h-4 w-4 text-sv-blue" /> : null}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function StreetList({
  items,
  street,
  onPick,
  hint,
  empty,
}: {
  items: Suggestion[]
  street: string
  onPick: (s: Suggestion) => void
  hint: string
  empty: string
}) {
  if (items.length === 0) {
    return <p className="py-10 text-center text-[14px] font-semibold text-sv-ink/45">{hint || empty}</p>
  }
  return (
    <ul className="space-y-0.5">
      {items.map((s) => (
        <li key={`${s.city}:${s.ka}`}>
          <button
            type="button"
            onClick={() => onPick(s)}
            className="flex w-full items-center gap-2.5 rounded-control px-2 py-2.5 text-left text-[14px] font-bold text-sv-ink hover:bg-sv-ink/[0.04]"
          >
            <Tick on={street === s.ka} />
            <span className="min-w-0">
              <span className="block truncate">{s.ka}</span>
              {s.district ? (
                <span className="block truncate text-[12px] font-semibold text-sv-ink/40">{s.district}</span>
              ) : null}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
