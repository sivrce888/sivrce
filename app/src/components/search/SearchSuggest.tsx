'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Search, Building2, MapPin, Route, X } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { exactSuggestHit } from '@/lib/search-location'
import { isExactLookupQuery, lookupKind } from '@/lib/listing-public-id'

/** Keyword input with city / district / street autocomplete. Keyboard: ↑↓ Enter Esc. */

export interface Suggestion {
  kind: 'city' | 'district' | 'street'
  ka: string
  en?: string
  city?: string
  district?: string
}

const KIND_LABEL: Record<Suggestion['kind'], string> = {
  city: 'ქალაქი',
  district: 'უბანი',
  street: 'ქუჩა',
}

const KIND_ORDER: Suggestion['kind'][] = ['city', 'district', 'street']

const KIND_ICON = { city: Building2, district: MapPin, street: Route } as const

interface Props {
  variant: 'dark' | 'light' | 'auto'
  value: string
  onChange: (v: string) => void
  onPick: (s: Suggestion) => void
  onSubmit: () => void
  placeholder: string
  ariaLabel: string
  className?: string
  inputRef?: React.Ref<HTMLInputElement>
  city?: string
  /** Compact chrome (nav / map). Default is the large search box. */
  size?: 'md' | 'lg'
}

export default function SearchSuggest({
  variant, value, onChange, onPick, onSubmit, placeholder, ariaLabel,
  className = '', inputRef, city, size = 'lg',
}: Props) {
  const dark = variant === 'dark'
  const auto = variant === 'auto'
  const md = size === 'md'
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Suggestion[]>([])
  const [hi, setHi] = useState(-1)
  const abortRef = useRef<AbortController | null>(null)
  const listId = useId()

  useEffect(() => {
    const q = value.trim()
    if (q.length < 2 || isExactLookupQuery(q)) {
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
        const exact = exactSuggestHit(items, value)
        if (exact) {
          e.preventDefault()
          pick(exact)
        } else {
          setOpen(false)
          onSubmit()
        }
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const groups = KIND_ORDER
    .map((kind) => ({ kind, rows: items.map((s, i) => ({ s, i })).filter((x) => x.s.kind === kind) }))
    .filter((g) => g.rows.length > 0)

  const inputClass = auto
    ? 'h-12 w-full rounded-full bg-transparent py-0 pl-11 pr-10 text-[15px] font-semibold tracking-[-0.01em] text-sv-ink outline-none placeholder:text-sv-ink/38 focus-visible:ring-0 dark:text-white dark:placeholder:text-white/45'
    : dark
    ? md
      ? 'h-10 w-full rounded-full bg-white/[0.08] py-0 pl-10 pr-9 text-[13px] font-semibold text-white outline-none placeholder:text-white/40 focus:bg-white/[0.12]'
      : 'h-12 w-full rounded-full bg-white/[0.07] py-0 pl-11 pr-10 text-[15px] font-semibold text-white outline-none placeholder:text-white/45 focus:bg-white/[0.12]'
    : md
      ? 'h-10 w-full rounded-full bg-sv-ink/[0.045] pl-10 pr-9 text-[13px] font-bold text-sv-ink outline-none placeholder:text-sv-ink/35 focus:bg-sv-ink/[0.07] focus-visible:ring-2 focus-visible:ring-sv-blue/30'
      : 'h-12 w-full rounded-full bg-sv-ink/[0.045] pl-11 pr-10 text-[14px] font-bold text-sv-ink outline-none placeholder:text-sv-ink/35 focus:bg-sv-ink/[0.07] focus-visible:ring-2 focus-visible:ring-sv-blue/30'

  return (
    <div className={`relative ${className}`}>
      <Search
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${
          auto
            ? 'left-4 h-[18px] w-[18px] text-sv-ink/35 dark:text-white/50'
            : dark
            ? md ? 'left-3.5 h-4 w-4 text-white/45' : 'left-4 h-[18px] w-[18px] text-white/50'
            : md ? 'left-3.5 h-4 w-4 text-sv-ink/35' : 'left-4 h-[18px] w-[18px] text-sv-ink/35'
        }`}
      />
      <input
        ref={inputRef}
        type="search"
        name="q"
        inputMode={lookupKind(value) === 'phone' ? 'tel' : 'search'}
        enterKeyHint="search"
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
        className={`${inputClass} [&::-webkit-search-cancel-button]:hidden`}
      />
      {value && (
        <button
          type="button"
          aria-label={t('search.clear')}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChange('')}
          className={`absolute top-1/2 -translate-y-1/2 rounded-full p-1 ${
            auto
              ? 'right-2.5 text-sv-ink/35 hover:text-sv-ink dark:text-white/45 dark:hover:text-white'
              : dark ? 'right-2.5 text-white/45 hover:text-white' : 'right-2.5 text-sv-ink/35 hover:text-sv-ink'
          }`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute inset-x-0 top-full z-[80] mt-2 max-h-72 overflow-y-auto rounded-module p-1 ${
            auto
              ? 'border border-sv-ink/10 bg-sv-surface shadow-card-hover dark:border-white/10 dark:bg-sv-navy/95 dark:shadow-panel-dark dark:backdrop-blur-xl'
              : dark
              ? 'border border-white/10 bg-sv-navy/95 shadow-panel-dark backdrop-blur-xl'
              : 'border border-sv-ink/10 bg-sv-surface shadow-card-hover'
          }`}
        >
          {groups.map((g) => (
            <li key={g.kind} role="presentation">
              <div
                className={`px-3 pb-1 pt-2 text-[10px] font-extrabold uppercase tracking-[0.08em] ${
                  auto ? 'text-sv-ink/35 dark:text-white/35' : dark ? 'text-white/35' : 'text-sv-ink/35'
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
                      key={`${s.kind}:${s.city ?? ''}:${s.ka}`}
                      role="option"
                      aria-selected={hi === i}
                    >
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); pick(s) }}
                        onMouseEnter={() => setHi(i)}
                        className={`flex w-full items-center gap-2.5 rounded-control px-3 py-2.5 text-left transition-colors ${
                          hi === i
                            ? auto ? 'bg-sv-ink/[0.05] dark:bg-white/10' : dark ? 'bg-white/10' : 'bg-sv-ink/[0.05]'
                            : ''
                        }`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${auto ? 'text-sv-blue dark:text-sv-blue-light' : dark ? 'text-sv-blue-light' : 'text-sv-blue'}`} />
                        <span className={`min-w-0 flex-1 truncate text-[13px] font-bold ${auto ? 'text-sv-ink dark:text-white' : dark ? 'text-white' : 'text-sv-ink'}`}>
                          {s.ka}
                          {(s.city || s.district || s.en) && (
                            <span className={`ml-1.5 font-semibold ${auto ? 'text-sv-ink/40 dark:text-white/40' : dark ? 'text-white/40' : 'text-sv-ink/40'}`}>
                              {[s.district, s.city, s.en].filter(Boolean).join(' · ')}
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

/** Nav / map / menu — one box, goes to /search (or the listing on ID/phone/cadastral). */
export async function resolveExactPlace(q: string, city?: string): Promise<Suggestion | undefined> {
  const needle = q.trim()
  if (needle.length < 2) return undefined
  try {
    const sp = new URLSearchParams({ q: needle })
    if (city) sp.set('city', city)
    const res = await fetch(`/api/suggest?${sp}`)
    const json = (await res.json()) as { ok?: boolean; suggestions?: Suggestion[] }
    return exactSuggestHit(json.ok ? (json.suggestions ?? []) : [], needle)
  } catch {
    return undefined
  }
}

/** Map overlay fly-to. Nav uses an icon; /search owns the full field. */
export function ChromeSearch({
  variant,
  className = '',
  onPlace,
}: {
  variant: 'dark' | 'light'
  className?: string
  onPlace: (q: string, s?: Suggestion) => void | Promise<void>
}) {
  const [q, setQ] = useState('')
  const { t } = useI18n()
  const go = (s?: Suggestion) => {
    void onPlace(s ? s.ka : q.trim(), s)
  }
  return (
    <SearchSuggest
      variant={variant}
      size="md"
      value={q}
      onChange={setQ}
      onPick={(s) => void go(s)}
      onSubmit={() => void go()}
      placeholder={t('search.keywordPlaceholder')}
      ariaLabel={t('nav.search')}
      className={className}
    />
  )
}
