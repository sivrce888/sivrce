'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Search, Building2, MapPin, Route } from 'lucide-react'

/**
 * Keyword / street input with location autocomplete (cities · districts · streets).
 * Grouped listbox. Keyboard: ↑↓ Enter Esc. aria combobox pattern.
 */

export interface Suggestion {
  kind: 'city' | 'district' | 'street'
  ka: string
  en?: string
}

const KIND_LABEL: Record<Suggestion['kind'], string> = {
  city: 'ქალაქი',
  district: 'უბანი',
  street: 'ქუჩა',
}

const KIND_ORDER: Suggestion['kind'][] = ['city', 'district', 'street']

const KIND_ICON = { city: Building2, district: MapPin, street: Route } as const

interface Props {
  variant: 'dark' | 'light'
  value: string
  onChange: (v: string) => void
  /** Picked a suggestion — parent maps kind → city/district/q. */
  onPick: (s: Suggestion) => void
  /** Enter pressed with no highlighted suggestion. */
  onSubmit: () => void
  placeholder: string
  ariaLabel: string
  className?: string
  inputRef?: React.Ref<HTMLInputElement>
  /** Scope street matches to this city (passed to /api/suggest). */
  city?: string
  /** No leading search icon / outer chrome — parent owns the label shell. */
  bare?: boolean
}

export default function SearchSuggest({
  variant, value, onChange, onPick, onSubmit, placeholder, ariaLabel,
  className = '', inputRef, city, bare = false,
}: Props) {
  const dark = variant === 'dark'
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Suggestion[]>([])
  const [hi, setHi] = useState(-1)
  const abortRef = useRef<AbortController | null>(null)
  const listId = useId()

  useEffect(() => {
    const q = value.trim()
    if (q.length < 2) {
      const t = window.setTimeout(() => { setItems([]); setOpen(false) }, 0)
      return () => window.clearTimeout(t)
    }
    const timer = window.setTimeout(async () => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      try {
        const sp = new URLSearchParams({ q })
        if (city) sp.set('city', city)
        const res = await fetch(`/api/suggest?${sp}`, { signal: ctrl.signal })
        const json = (await res.json()) as { ok: boolean; suggestions?: Suggestion[] }
        if (ctrl.signal.aborted) return
        const next = json.ok ? (json.suggestions ?? []) : []
        setItems(next)
        setHi(-1)
        setOpen(next.length > 0)
      } catch {
        /* aborted or offline — keep previous state */
      }
    }, 150)
    return () => window.clearTimeout(timer)
  }, [value, city])

  const pick = (s: Suggestion) => {
    setOpen(false)
    setItems([])
    onPick(s)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && open) {
      e.preventDefault()
      setHi((h) => (h + 1) % items.length)
    } else if (e.key === 'ArrowUp' && open) {
      e.preventDefault()
      setHi((h) => (h <= 0 ? items.length - 1 : h - 1))
    } else if (e.key === 'Enter') {
      if (open && hi >= 0 && items[hi]) {
        e.preventDefault()
        pick(items[hi])
      } else {
        setOpen(false)
        onSubmit()
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  // Flat index → grouped render (headers don't count as options).
  const groups = KIND_ORDER
    .map((kind) => ({ kind, rows: items.map((s, i) => ({ s, i })).filter((x) => x.s.kind === kind) }))
    .filter((g) => g.rows.length > 0)

  const inputClass = bare
    ? dark
      ? 'w-full bg-transparent px-3.5 pb-2.5 pt-0.5 text-[14px] font-bold text-white outline-none placeholder:text-white/40'
      : 'w-full bg-transparent px-3.5 pb-2.5 pt-0.5 text-[13px] font-bold text-sv-ink outline-none placeholder:text-sv-ink/35'
    : dark
      ? 'w-full rounded-control bg-white/[0.07] py-3.5 pl-11 pr-4 text-[15px] font-semibold text-white transition-colors placeholder:text-white/45 focus:bg-white/[0.12] focus:outline-none'
      : 'h-11 w-full rounded-control border border-sv-ink/10 bg-sv-surface pl-10 pr-3.5 text-[13px] font-bold text-sv-ink outline-none transition-colors placeholder:text-sv-ink/35 focus:border-sv-blue focus-visible:ring-2 focus-visible:ring-sv-blue/30'

  return (
    <div className={`relative ${className}`}>
      {!bare && (
        <Search
          className={`pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 ${
            dark ? 'text-white/50' : 'left-3.5 h-4 w-4 text-sv-ink/35'
          }`}
        />
      )}
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={hi >= 0 ? `${listId}-${hi}` : undefined}
        aria-autocomplete="list"
        aria-label={ariaLabel}
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => items.length > 0 && setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        className={inputClass}
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute inset-x-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-module p-1 ${
            dark
              ? 'border border-white/10 bg-sv-navy/95 shadow-panel-dark backdrop-blur-xl'
              : 'border border-sv-ink/10 bg-sv-surface shadow-card-hover'
          }`}
        >
          {groups.map((g) => (
            <li key={g.kind} role="presentation">
              <div
                className={`px-3 pb-1 pt-2 text-[10px] font-extrabold uppercase tracking-[0.08em] ${
                  dark ? 'text-white/35' : 'text-sv-ink/35'
                }`}
              >
                {KIND_LABEL[g.kind]}
              </div>
              <ul role="group" aria-label={KIND_LABEL[g.kind]}>
                {g.rows.map(({ s, i }) => {
                  const Icon = KIND_ICON[s.kind]
                  return (
                    <li
                      id={`${listId}-${i}`}
                      key={`${s.kind}:${s.ka}`}
                      role="option"
                      aria-selected={hi === i}
                    >
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); pick(s) }}
                        onMouseEnter={() => setHi(i)}
                        className={`flex w-full items-center gap-2.5 rounded-control px-3 py-2.5 text-left transition-colors ${
                          hi === i
                            ? dark ? 'bg-white/10' : 'bg-sv-ink/[0.05]'
                            : ''
                        }`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${dark ? 'text-sv-blue-light' : 'text-sv-blue'}`} />
                        <span className={`min-w-0 flex-1 truncate text-[13px] font-bold ${dark ? 'text-white' : 'text-sv-ink'}`}>
                          {s.ka}
                          {s.en && (
                            <span className={`ml-1.5 font-semibold ${dark ? 'text-white/40' : 'text-sv-ink/40'}`}>
                              {s.en}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
