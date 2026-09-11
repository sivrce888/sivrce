'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { Flag, type FlagCode } from '@/components/Flag'
import { COM_ORIGIN, COUNTRY_IDS, GE_ORIGIN, MARKETS, type PathCountryId } from '@/lib/markets'

const LABEL: Record<'ge' | PathCountryId, string> = {
  ge: 'Georgia',
  de: 'Germany',
  ae: 'UAE',
  fr: 'France',
  es: 'Spain',
  it: 'Italy',
  gb: 'United Kingdom',
  us: 'United States',
  ca: 'Canada',
  tr: 'Turkey',
  gr: 'Greece',
  cy: 'Cyprus',
  nl: 'Netherlands',
  pt: 'Portugal',
  ch: 'Switzerland',
}

const ITEMS: { id: 'ge' | PathCountryId; label: string; href: string; prod: string; flag: FlagCode }[] = [
  { id: 'ge', label: LABEL.ge, href: '/', prod: `${GE_ORIGIN}/`, flag: 'ge' },
  ...COUNTRY_IDS.map((id) => ({
    id,
    label: LABEL[id],
    href: `/en${MARKETS[id].pathPrefix}`,
    prod: `${COM_ORIGIN}${MARKETS[id].pathPrefix}`,
    flag: id as FlagCode,
  })),
]

function isComHost() {
  if (typeof window === 'undefined') return false
  const h = window.location.hostname
  return h === 'sivrce.com' || h === 'www.sivrce.com'
}

function activeId(pathname: string): 'ge' | PathCountryId {
  for (const cc of COUNTRY_IDS) {
    if (pathname === `/en/${cc}` || pathname.startsWith(`/en/${cc}/`)) return cc
    if (pathname === `/ar/${cc}` || pathname.startsWith(`/ar/${cc}/`)) return cc
  }
  if (isComHost()) {
    for (const cc of COUNTRY_IDS) {
      if (pathname === `/${cc}` || pathname.startsWith(`/${cc}/`)) return cc
    }
    if (pathname === '/uae' || pathname.startsWith('/uae/')) return 'ae'
    if (pathname === '/uk' || pathname.startsWith('/uk/')) return 'gb'
  }
  return 'ge'
}

export function MarketSwitcher({ light = false }: { light?: boolean }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const active = activeId(pathname)
  const prod = typeof window !== 'undefined' && (
    window.location.hostname === 'sivrce.ge' ||
    window.location.hostname === 'sivrce.com' ||
    window.location.hostname === 'www.sivrce.ge' ||
    window.location.hostname === 'www.sivrce.com'
  )

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Market"
        className={`flex h-10 items-center gap-1.5 rounded-full px-3 text-[12px] font-extrabold uppercase leading-none transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 ${
          light ? 'text-sv-ink/70 hover:bg-sv-ink/5' : 'text-sv-ink/70 hover:bg-sv-ink/5 dark:text-white/85 dark:hover:bg-white/10'
        }`}
      >
        <Globe className="h-3.5 w-3.5" aria-hidden />
        {active}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div
        role="menu"
        aria-label="Market"
        inert={!open}
        data-open={open || undefined}
        className="sv-pop glass-light absolute end-0 top-full z-50 mt-2 max-h-[min(24rem,70vh)] w-52 origin-top-right overflow-y-auto rounded-2xl p-1.5 shadow-card"
      >
        {ITEMS.map((m) => {
          const href = prod ? m.prod : m.href
          const on = m.id === active
          return (
            <a
              key={m.id}
              href={href}
              role="menuitemradio"
              aria-checked={on}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-start text-[14px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue ${
                on ? 'text-sv-blue' : 'text-sv-ink hover:bg-sv-ink/5'
              }`}
            >
              <Flag code={m.flag} size={18} />
              <span className="flex-1">{m.label}</span>
              {on && <Check className="h-4 w-4" />}
            </a>
          )
        })}
      </div>
    </div>
  )
}
