'use client'

/**
 * SIVRCE — language switcher. Compact trigger shows only the active language
 * (flag + code); a spring-animated frosted menu lists all nine with endonym
 * names and a check on the current one. RTL-aware placement.
 */

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'
import { Flag, type FlagCode } from '@/components/Flag'
import { useI18n, LANGS } from '@/lib/i18n/context'
import type { Lang } from '@/lib/i18n/context'

const LANG_FLAG: Record<Lang, FlagCode> = {
  ka: 'ge',
  en: 'gb',
  ru: 'ru',
  he: 'il',
  ar: 'sa',
  tr: 'tr',
  uk: 'ua',
  hy: 'am',
  az: 'az',
}
const LANG_NAME: Record<Lang, string> = {
  ka: 'ქართული',
  en: 'English',
  ru: 'Русский',
  he: 'עברית',
  ar: 'العربية',
  tr: 'Türkçe',
  uk: 'Українська',
  hy: 'Հայերեն',
  az: 'Azərbaycan',
}

export function LangSwitcher({ light = false }: { light?: boolean }) {
  const { lang, setLang, t } = useI18n()
  const reduceMotion = useReducedMotion()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Close on outside pointer / Escape while open
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
        aria-label={t('nav.language')}
        className={`flex h-10 items-center gap-1.5 rounded-full px-3 text-[12px] font-extrabold uppercase leading-none transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 ${
          light ? 'text-sv-ink/70 hover:bg-sv-ink/5' : 'text-white/85 hover:bg-white/10'
        }`}
      >
        <Flag code={LANG_FLAG[lang]} size={16} />
        {lang}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label={t('nav.language')}
            initial={reduceMotion ? false : { opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6, scale: 0.96 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 500, damping: 34, mass: 0.7 }
            }
            className="glass-light absolute end-0 top-full z-50 mt-2 w-44 origin-top-right rounded-2xl p-1.5 shadow-card"
          >
            {LANGS.map((code) => {
              const active = lang === code
              return (
                <button
                  key={code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    setLang(code)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-start text-[14px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue ${
                    active ? 'text-sv-blue' : 'text-sv-ink hover:bg-sv-ink/5'
                  }`}
                >
                  <Flag code={LANG_FLAG[code]} size={18} />
                  <span className="flex-1">{LANG_NAME[code]}</span>
                  {active && <Check className="h-4 w-4" />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
