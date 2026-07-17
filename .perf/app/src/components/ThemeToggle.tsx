'use client'

/**
 * SIVRCE — theme toggle. iOS-style pill switch with a sliding thumb,
 * sun/moon morph, tiny stars in the dark track, spring physics.
 * SSR-safe: renders an inert placeholder of identical size until mounted,
 * so server HTML and first client paint always match.
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
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
  const reduceMotion = useReducedMotion()
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
          light ? 'bg-sv-ink/[0.05]' : 'bg-white/10'
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
        light ? 'bg-sv-ink/[0.07]' : 'bg-white/10'
      }`}
      style={{ width: W, height: H }}
    >
      {/* Track inset hairline */}
      <span
        aria-hidden
        className={`absolute inset-0 rounded-full shadow-[inset_0_1px_2px_rgba(5,11,38,0.12)] ring-1 ring-inset transition-colors duration-300 ${
          light ? 'ring-sv-ink/[0.06]' : 'ring-white/15'
        }`}
      />
      {/* Stars — fade in with the dark track */}
      <AnimatePresence>
        {isDark && (
          <motion.span
            aria-hidden
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.08 }}
            className="absolute left-[9px] top-1/2 -translate-y-1/2"
          >
            <span className="absolute h-[3px] w-[3px] rounded-full bg-white/80" />
            <span className="absolute left-[7px] top-[5px] h-[2px] w-[2px] rounded-full bg-white/50" />
            <span className="absolute left-[3px] top-[-6px] h-[2px] w-[2px] rounded-full bg-white/60" />
          </motion.span>
        )}
      </AnimatePresence>
      {/* Thumb */}
      <motion.span
        aria-hidden
        initial={false}
        animate={{ x: isDark ? TRAVEL : 0 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 550, damping: 32, mass: 0.7 }
        }
        className="absolute z-10 grid place-items-center rounded-full bg-white shadow-[0_2px_6px_rgba(5,11,38,0.25),0_0_0_0.5px_rgba(5,11,38,0.06)] transition-transform duration-200 group-active:scale-95"
        style={{ left: PAD, width: THUMB, height: THUMB }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isDark ? 'moon' : 'sun'}
            initial={reduceMotion ? false : { opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.22, ease: [0.21, 0.65, 0.2, 1] }}
            className="grid place-items-center"
          >
            {isDark ? (
              <Moon className="h-[13px] w-[13px] text-sv-blue-deep" fill="currentColor" strokeWidth={0} />
            ) : (
              <Sun className="h-[14px] w-[14px] text-sv-orange" fill="currentColor" strokeWidth={0} />
            )}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </button>
  )
}
