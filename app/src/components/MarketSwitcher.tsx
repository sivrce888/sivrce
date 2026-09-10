'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { Flag } from '@/components/Flag'
import { COM_ORIGIN, GE_ORIGIN } from '@/lib/markets'

const MARKETS = [
  { id: 'ge', label: 'Georgia', href: '/', prod: `${GE_ORIGIN}/`, flag: 'ge' as const },
  { id: 'de', label: 'Germany', href: '/en/de', prod: `${COM_ORIGIN}/de`, flag: 'de' as const },
  { id: 'ae', label: 'UAE', href: '/en/ae', prod: `${COM_ORIGIN}/ae`, flag: 'ae' as const },
] as const

function isProdHost() {
  if (typeof window === 'undefined') return false
  const h = window.location.hostname
  return h === 'sivrce.ge' || h === 'sivrce.com' || h === 'www.sivrce.ge' || h === 'www.sivrce.com'
}

function activeId(pathname: string): 'ge' | 'de' | 'ae' {
  if (pathname === '/ae' || pathname.startsWith('/ae/') || pathname.includes('/ae/')) return 'ae'
  if (pathname === '/en/ae' || pathname.startsWith('/en/ae')) return 'ae'
  if (pathname === '/en/de' || pathname.startsWith('/en/de')) return 'de'
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('sivrce.com')) {
    if (pathname === '/de' || pathname.startsWith('/de/')) return 'de'
  }
  return 'ge'
}

export function MarketSwitcher({ light = false }: { light?: boolean }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const active = activeId(pathname)
  const prod = isProdHost()

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
        className="sv-pop glass-light absolute end-0 top-full z-50 mt-2 w-44 origin-top-right rounded-2xl p-1.5 shadow-card"
      >
        {MARKETS.map((m) => {
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
