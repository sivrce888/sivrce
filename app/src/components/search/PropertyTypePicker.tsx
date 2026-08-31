'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Building, Briefcase, Check, ChevronDown, Hotel, Home, Layers, Map, TreePalm } from 'lucide-react'
import { CATEGORY_BRAND } from '@/lib/category-brand'
import { useI18n, type DictKey } from '@/lib/i18n/context'
import type { PropType } from '@/data/listings'

export const SEARCH_PROP_TYPES = [
  { value: 'apartment' as const, key: 'prop.apartment' as DictKey, shortKey: 'prop.apartment' as DictKey, icon: Building, brand: CATEGORY_BRAND.apartments },
  { value: 'house' as const, key: 'prop.house' as DictKey, shortKey: 'prop.houseShort' as DictKey, icon: Home, brand: CATEGORY_BRAND.houses },
  { value: 'villa' as const, key: 'prop.villa' as DictKey, shortKey: 'prop.villa' as DictKey, icon: TreePalm, brand: CATEGORY_BRAND.cottages },
  { value: 'commercial' as const, key: 'prop.commercial' as DictKey, shortKey: 'prop.commercial' as DictKey, icon: Briefcase, brand: CATEGORY_BRAND.commercial },
  { value: 'land' as const, key: 'prop.land' as DictKey, shortKey: 'prop.land' as DictKey, icon: Map, brand: CATEGORY_BRAND.land },
  { value: 'hotel' as const, key: 'prop.hotel' as DictKey, shortKey: 'prop.hotel' as DictKey, icon: Hotel, brand: CATEGORY_BRAND.hotels },
]

export function isSearchPropType(v: string | null | undefined): v is PropType {
  return SEARCH_PROP_TYPES.some((p) => p.value === v)
}

type Props = {
  value?: PropType
  onChange: (v: PropType | undefined) => void
  /** hero = tall glass field; filter = search-page pill */
  variant?: 'hero' | 'filter'
  counts?: Record<string, number>
  className?: string
  onOpen?: () => void
}

export default function PropertyTypePicker({
  value,
  onChange,
  variant = 'filter',
  counts,
  className = '',
  onOpen,
}: Props) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const hero = variant === 'hero'
  const selected = SEARCH_PROP_TYPES.find((p) => p.value === value)
  const Icon = selected?.icon ?? Layers

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && e.target instanceof Node && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (next: PropType | undefined) => {
    onChange(next)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={selected ? `${t('search.propType')}: ${t(selected.shortKey)}` : t('search.propType')}
        onClick={() => {
          setOpen((o) => {
            const next = !o
            if (next) onOpen?.()
            return next
          })
        }}
        className={
          hero
            ? `flex h-12 w-full items-center gap-2 rounded-full px-3.5 text-left text-sv-ink transition-colors hover:bg-sv-ink/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue/30 dark:text-white lg:w-[156px] lg:max-w-[156px]`
            : `flex h-10 w-full items-center gap-2 rounded-full bg-sv-ink/[0.045] px-3.5 text-left text-[13px] font-bold outline-none transition-colors hover:bg-sv-ink/[0.08] focus-visible:ring-2 focus-visible:ring-sv-blue/30 ${
                selected ? 'text-sv-ink' : 'text-sv-ink/55'
              }`
        }
      >
        <Icon
          className={`h-4 w-4 shrink-0 ${selected ? '' : hero ? 'text-sv-ink/35 dark:text-white/40' : 'text-sv-ink/35'}`}
          style={selected ? { color: selected.brand.hue } : undefined}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          {hero ? (
            <>
              <span className="block text-[10px] font-extrabold uppercase tracking-[0.06em] text-sv-ink/40 dark:text-white/40">
                {t('search.propType')}
              </span>
              <span className="block truncate text-[14px] font-extrabold tracking-[-0.01em]">
                {selected ? t(selected.shortKey) : t('search.allTypes')}
              </span>
            </>
          ) : (
            <span className="block truncate">{selected ? t(selected.shortKey) : t('search.propType')}</span>
          )}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 opacity-40 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t('search.propType')}
          className="absolute left-0 top-full z-[90] mt-2 min-w-[min(100%,280px)] overflow-hidden rounded-module border border-sv-ink/10 bg-sv-surface p-1.5 shadow-card-hover dark:border-white/10 dark:bg-sv-navy dark:shadow-panel-dark"
        >
          <li role="option" aria-selected={!value}>
            <button
              type="button"
              onClick={() => pick(undefined)}
              className={`flex w-full items-center gap-2.5 rounded-control px-2.5 py-2 text-left transition-colors ${
                !value ? 'bg-sv-blue/[0.08]' : 'hover:bg-sv-ink/[0.04] dark:hover:bg-white/[0.06]'
              }`}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-control bg-sv-cloud text-sv-ink/50 dark:bg-white/10 dark:text-white/60">
                <Layers className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1 text-[13px] font-extrabold text-sv-ink dark:text-white">{t('search.allTypes')}</span>
              {!value && <Check className="h-4 w-4 shrink-0 text-sv-blue" strokeWidth={2.5} aria-hidden />}
            </button>
          </li>
          {SEARCH_PROP_TYPES.map((p) => {
            const active = value === p.value
            const n = counts?.[p.value]
            return (
              <li key={p.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => pick(p.value)}
                  className={`flex w-full items-center gap-2.5 rounded-control px-2.5 py-2 text-left transition-colors ${
                    active ? '' : 'hover:bg-sv-ink/[0.04] dark:hover:bg-white/[0.06]'
                  }`}
                  style={active ? { backgroundColor: p.brand.chipVar } : undefined}
                >
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-control"
                    style={{ backgroundColor: p.brand.chipVar, color: p.brand.hue }}
                  >
                    <p.icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-extrabold text-sv-ink dark:text-white">
                    {t(p.key)}
                    {n !== undefined && (
                      <span className="ml-1.5 font-semibold text-sv-ink/40 dark:text-white/40">{n}</span>
                    )}
                  </span>
                  {active && <Check className="h-4 w-4 shrink-0 text-sv-blue" strokeWidth={2.5} aria-hidden />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
