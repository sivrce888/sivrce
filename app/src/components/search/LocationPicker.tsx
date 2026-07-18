'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { X, Search, MapPin, ChevronRight } from 'lucide-react'
import { GEO_CITIES, GEO_MUNICIPALITIES } from '@/data/georgia-locations'
import { districtsOf } from '@/data/listings'

const POPULAR = GEO_CITIES.slice(0, 10)

export type LocationValue = { city: string; district: string; street: string }

type Props = {
  open: boolean
  value: LocationValue
  onClose: () => void
  onApply: (v: LocationValue) => void
}

/** SS/MyHome-class location modal — search + popular cities + districts. Brand-locked. */
export default function LocationPicker({ open, value, onClose, onApply }: Props) {
  const [city, setCity] = useState(value.city)
  const [district, setDistrict] = useState(value.district)
  const [street, setStreet] = useState(value.street)
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    // ponytail: microtask defer — sync setState in the effect body trips
    // react-hooks/set-state-in-effect; still runs before paint, so no visible change.
    queueMicrotask(() => {
      setCity(value.city)
      setDistrict(value.district)
      setStreet(value.street)
      setQ('')
    })
    const t = window.setTimeout(() => inputRef.current?.focus(), 40)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { window.clearTimeout(t); window.removeEventListener('keydown', onKey) }
  }, [open, value, onClose])

  const districts = useMemo(() => (city ? districtsOf(city) : []), [city])

  const qn = q.trim().toLowerCase()
  const cityHits = useMemo(() => {
    if (!qn) return []
    return [...GEO_CITIES, ...GEO_MUNICIPALITIES].filter((c) => c.toLowerCase().includes(qn)).slice(0, 12)
  }, [qn])
  const distHits = useMemo(() => {
    if (!qn || !city) return []
    return districts.filter((d) => d.toLowerCase().includes(qn)).slice(0, 16)
  }, [qn, city, districts])

  // Alphabet groups for municipalities when browsing (no query, no city).
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

  if (!open) return null

  const pickCity = (c: string) => {
    setCity(c)
    setDistrict('')
    setQ('')
  }

  const apply = () => onApply({ city, district, street: street.trim() })

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-sv-navy/55 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="მდებარეობა"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-[720px] flex-col overflow-hidden rounded-t-tile bg-sv-surface shadow-card-hover sm:rounded-tile"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sv-ink/[0.06] px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-[17px] font-extrabold tracking-tight text-sv-ink">მდებარეობა</h2>
            {(city || district) && (
              <p className="mt-1 flex flex-wrap items-center gap-1 text-[13px] font-semibold text-sv-ink/50">
                {city && (
                  <button
                    type="button"
                    onClick={() => { setCity(''); setDistrict('') }}
                    className="inline-flex items-center gap-1 rounded-full bg-sv-blue/10 px-2.5 py-0.5 text-sv-blue hover:bg-sv-blue/15"
                  >
                    {city}
                    <X className="h-3 w-3" />
                  </button>
                )}
                {district && (
                  <>
                    <ChevronRight className="h-3.5 w-3.5 text-sv-ink/30" />
                    <button
                      type="button"
                      onClick={() => setDistrict('')}
                      className="inline-flex items-center gap-1 rounded-full bg-sv-blue/10 px-2.5 py-0.5 text-sv-blue hover:bg-sv-blue/15"
                    >
                      {district}
                      <X className="h-3 w-3" />
                    </button>
                  </>
                )}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="დახურვა"
            className="grid h-10 w-10 place-items-center rounded-control text-sv-ink/45 transition-colors hover:bg-sv-ink/[0.05] hover:text-sv-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-sv-ink/[0.06] px-5 py-3">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sv-ink/35" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ჩაწერე ქალაქი, უბანი ან ქუჩა"
              className="h-12 w-full rounded-control border border-sv-ink/10 bg-sv-cloud pl-10 pr-3.5 text-[14px] font-bold text-sv-ink outline-none placeholder:text-sv-ink/35 focus:border-sv-blue focus-visible:ring-2 focus-visible:ring-sv-blue/25"
            />
          </label>
          {city && (
            <input
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="ქუჩა (არასავალდებულო)"
              className="mt-2 h-11 w-full rounded-control border border-sv-ink/10 bg-sv-surface px-3.5 text-[13px] font-bold text-sv-ink outline-none placeholder:text-sv-ink/35 focus:border-sv-blue"
            />
          )}
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {qn ? (
            <div className="space-y-4">
              {cityHits.length > 0 && (
                <section>
                  <h3 className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-sv-ink/40">ქალაქები</h3>
                  <ul className="space-y-0.5">
                    {cityHits.map((c) => (
                      <li key={c}>
                        <button
                          type="button"
                          onClick={() => pickCity(c)}
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
                  <h3 className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-sv-ink/40">უბნები · {city}</h3>
                  <ul className="space-y-0.5">
                    {distHits.map((d) => (
                      <li key={d}>
                        <button
                          type="button"
                          onClick={() => { setDistrict(d); setQ('') }}
                          className="flex w-full items-center gap-2.5 rounded-control px-3 py-2.5 text-left text-[14px] font-bold text-sv-ink hover:bg-sv-ink/[0.04]"
                        >
                          <MapPin className="h-4 w-4 text-sv-blue" />
                          {d}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {cityHits.length === 0 && distHits.length === 0 && (
                <p className="py-8 text-center text-[14px] font-semibold text-sv-ink/45">ვერაფერი მოიძებნა</p>
              )}
            </div>
          ) : city ? (
            <section>
              <h3 className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-sv-ink/40">უბნები · {city}</h3>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setDistrict('')}
                  className={`rounded-control px-3 py-2.5 text-left text-[13px] font-bold transition-colors ${
                    !district ? 'bg-sv-blue text-white' : 'bg-sv-cloud text-sv-ink hover:bg-sv-ink/[0.06]'
                  }`}
                >
                  ყველა უბანი
                </button>
                {districts.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDistrict(d)}
                    className={`rounded-control px-3 py-2.5 text-left text-[13px] font-bold transition-colors ${
                      district === d ? 'bg-sv-blue text-white' : 'bg-sv-cloud text-sv-ink hover:bg-sv-ink/[0.06]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <>
              <section className="mb-6">
                <h3 className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-sv-ink/40">პოპულარული ქალაქები</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-2">
                  {POPULAR.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => pickCity(c)}
                      className="flex items-center gap-2.5 rounded-control px-2 py-2.5 text-left text-[14px] font-bold text-sv-ink hover:bg-sv-ink/[0.04]"
                    >
                      <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 ${
                        city === c ? 'border-sv-blue bg-sv-blue' : 'border-sv-ink/20'
                      }`}>
                        {city === c && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                      {c}
                    </button>
                  ))}
                </div>
              </section>
              <section>
                <h3 className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-sv-ink/40">მუნიციპალიტეტები</h3>
                <div className="columns-2 gap-6 sm:columns-3">
                  {muniGroups.map(([letter, list]) => (
                    <div key={letter} className="mb-4 break-inside-avoid">
                      <div className="mb-1 rounded-md bg-sv-cloud px-2 py-1 text-[12px] font-extrabold text-sv-ink/50">{letter}</div>
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
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-sv-ink/[0.06] px-5 py-4">
          <button
            type="button"
            onClick={() => { setCity(''); setDistrict(''); setStreet(''); setQ('') }}
            className="h-11 rounded-control px-4 text-[13px] font-extrabold text-sv-ink/55 transition-colors hover:bg-sv-ink/[0.04] hover:text-sv-ink"
          >
            გასუფთავება
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-control border border-sv-ink/10 px-5 text-[13px] font-extrabold text-sv-ink transition-colors hover:bg-sv-ink/[0.04]"
            >
              გაუქმება
            </button>
            <button
              type="button"
              onClick={apply}
              className="h-11 rounded-control bg-sv-blue px-6 text-[13px] font-extrabold text-white transition-colors hover:bg-sv-blue-deep"
            >
              არჩევა
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Compact label for the hero location trigger. */
export function locationLabel(v: LocationValue): string {
  if (v.district && v.city) return `${v.district}, ${v.city}`
  if (v.city) return v.city
  if (v.district) return v.district
  if (v.street) return v.street
  return 'აირჩიე ქალაქი'
}
