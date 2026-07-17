'use client'

/**
 * SIVRCE — i18n provider
 * Lightweight React context, no dependencies. Georgian by default,
 * persisted to localStorage('sivrce:lang'), keeps <html lang> in sync.
 *
 * SSR-safe: the language comes from useSyncExternalStore — the server
 * snapshot is always 'ka' (matching SSR + hydration), and the stored
 * language is picked up immediately after hydration. No localStorage
 * access during render, no hydration mismatch.
 *
 * Usage:
 *   import { useI18n } from '@/lib/i18n/context'
 *   const { lang, setLang, t } = useI18n()
 */

import { useCallback, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { MotionConfig } from 'framer-motion'
import {
  I18nContext,
  RTL_LANGS,
  emitLangChange,
  getServerLang,
  persistLang,
  readStoredLang,
  subscribeLang,
  translate,
  type I18nContextValue,
  type Lang,
} from '@/lib/i18n/context'

export type { DictKey, Lang } from '@/lib/i18n/context'

export default function I18nProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribeLang, readStoredLang, getServerLang)

  // Persist + sync <html lang> only on explicit user action
  const setLang = useCallback((next: Lang) => {
    persistLang(next)
    emitLangChange()
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = RTL_LANGS.has(lang) ? 'rtl' : 'ltr'
  }, [lang])

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      t: (key, vars) => translate(lang, key, vars),
    }),
    [lang, setLang],
  )

  return (
    <I18nContext.Provider value={value}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </I18nContext.Provider>
  )
}
