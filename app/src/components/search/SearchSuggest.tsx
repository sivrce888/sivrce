'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Search, Building2, MapPin, Route } from 'lucide-react'

/**
 * Keyword input with location autocomplete (cities / districts / Tbilisi
 * streets, ka·en·ru) backed by /api/suggest. Used in the hero (dark glass)
 * and on the results page (light). Keyboard: ↑↓ move, Enter pick/submit,
 * Esc close. aria combobox/listbox pattern.
 */

interface Suggestion {
  kind: 'city' | 'district' | 'street'
  ka: string
  en?: string
}

const KIND_LABEL: Record<Suggestion['kind'], string> = {
  city: 'ქალაქი',
  district: 'უბანი',
  street: 'ქუჩა',
}

const KIND_ICON = { city: Building2, district: MapPin, street: Route } as const

interface Props {
  variant: 'dark' | 'light'
  value: string
  onChange: (v: string) => void
  /** Picked a suggestion — parent commits the term and navigates. */
  onPick: (v: string) => void
  /** Enter pressed with no highlighted suggestion. */
  onSubmit: () => void
  placeholder: string
  ariaLabel: string
  className?: string
  inputRef?: React.Ref<HTMLInputElement>
}

export default function SearchSuggest({
  variant, value, onChange, onPick, onSubmit, placeholder, ariaLabel, className = '', inputRef,
}: Props) {
  const dark = variant === 'dark'
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Suggestion[]>([])
  const [hi, setHi] = useState(-1)
  const abortRef = useRef<AbortController | null>(null)
  const listId = useId()

  // Debounced fetch; abort in-flight on each keystroke.
  useEffect(() => {
    const q = value.trim()
    if (q.length < 2) {
      // Defer so the clear doesn't run synchronously inside the effect.
      const t = window.setTimeout(() => { setItems([]); setOpen(false) }, 0)
      return () => window.clearTimeout(t)
    }
    const timer = window.setTimeout(async () => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
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
  }, [value])

  const pick = (s: Suggestion) => {
    setOpen(false)
    setItems([])
    onPick(s.ka)
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

  return (
    <div className={`relative ${className}`}>
      <Search
        className={`pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 ${
          dark ? 'text-white/50' : 'left-3.5 h-4 w-4 text-sv-ink/35'
        }`}
      />
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
        className={
          dark
            ? 'w-full rounded-control bg-white/[0.07] py-3.5 pl-11 pr-4 text-[15px] font-semibold text-white transition-colors placeholder:text-white/45 focus:bg-white/[0.12] focus:outline-none'
            : 'h-11 w-full rounded-control border border-sv-ink/10 bg-sv-surface pl-10 pr-3.5 text-[13px] font-bold text-sv-ink outline-none transition-colors placeholder:text-sv-ink/35 focus:border-sv-blue focus-visible:ring-2 focus-visible:ring-sv-blue/30'
        }
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-module p-1 ${
            dark
              ? 'border border-white/10 bg-sv-navy/95 shadow-panel-dark backdrop-blur-xl'
              : 'border border-sv-ink/10 bg-sv-surface shadow-card-hover'
          }`}
        >
          {items.map((s, i) => {
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
                  <span className={`shrink-0 text-[11px] font-bold ${dark ? 'text-white/35' : 'text-sv-ink/35'}`}>
                    {KIND_LABEL[s.kind]}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
