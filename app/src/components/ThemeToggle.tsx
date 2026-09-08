'use client'

/**
 * SIVRCE — theme toggle. iOS-style pill switch with a sliding thumb,
 * sun/moon morph, tiny stars in the dark track, spring physics.
 * SSR-safe: renders an inert placeholder of identical size until mounted,
 * so server HTML and first client paint always match.
 */

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useI18n } from '@/lib/i18n/context'

const W = 54 // track width
const H = 30 // track height
const THUMB = 24 // thumb diameter
const PAD = (H - THUMB) / 2
const TRAVEL = W - THUMB - PAD * 2

export function ThemeToggle({ light = false }: { light?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme()
  const { t } = useI18n()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const isDark = resolvedTheme === 'dark'

  // Placeholder keeps navbar layout rock-steady through hydration
  if (!mounted) {
    return (
      <span
        aria-hidden
        className={`inline-block shrink-0 rounded-full ${
          light ? 'bg-sv-ink/[0.05]' : 'bg-sv-ink/[0.05] dark:bg-white/10'
        }`}
        style={{ width: W, height: H }}
      />
    )
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={t('nav.themeToggle')}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`group relative inline-flex shrink-0 items-center rounded-full transition-colors duration-300 before:absolute before:-inset-[7px] before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 ${
        light ? 'bg-sv-ink/[0.07]' : 'bg-sv-ink/[0.07] dark:bg-white/10'
      }`}
      style={{ width: W, height: H }}
    >
      {/* Track inset hairline */}
      <span
        aria-hidden
        className={`absolute inset-0 rounded-full shadow-[inset_0_1px_2px_rgba(5,11,38,0.12)] ring-1 ring-inset transition-colors duration-300 ${
          light ? 'ring-sv-ink/[0.06]' : 'ring-sv-ink/[0.06] dark:ring-white/15'
        }`}
      />
      {/* Stars — fade in with the dark track */}
      <span
        aria-hidden
        className={`absolute left-[9px] top-1/2 -translate-y-1/2 transition-opacity delay-[80ms] duration-300 ${
          isDark ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span className="absolute h-[3px] w-[3px] rounded-full bg-white/80" />
        <span className="absolute left-[7px] top-[5px] h-[2px] w-[2px] rounded-full bg-white/50" />
        <span className="absolute left-[3px] top-[-6px] h-[2px] w-[2px] rounded-full bg-white/60" />
      </span>
      {/* Thumb — CSS spring (slight overshoot) instead of framer */}
      <span
        aria-hidden
        className="sv-toggle-thumb absolute z-10 grid place-items-center rounded-full bg-white shadow-[0_2px_6px_rgba(5,11,38,0.25),0_0_0_0.5px_rgba(5,11,38,0.06)] group-active:scale-95"
        style={{ left: PAD, width: THUMB, height: THUMB, transform: `translateX(${isDark ? TRAVEL : 0}px)` }}
      >
        <span aria-hidden className="relative grid place-items-center">
          <Moon
            className={`sv-toggle-icon col-start-1 row-start-1 h-[13px] w-[13px] text-sv-blue-deep ${
              isDark ? 'sv-icon-in' : 'sv-icon-in-late'
            }`}
            fill="currentColor"
            strokeWidth={0}
          />
          <Sun
            className={`sv-toggle-icon col-start-1 row-start-1 h-[14px] w-[14px] text-sv-orange ${
              isDark ? 'sv-icon-in-late' : 'sv-icon-in'
            }`}
            fill="currentColor"
            strokeWidth={0}
          />
        </span>
      </span>
    </button>
  )
}
