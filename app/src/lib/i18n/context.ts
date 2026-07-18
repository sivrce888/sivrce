'use client'

/**
 * SIVRCE — i18n context, hook and translation core.
 * Kept component-free so this module stays fast-refresh clean; the provider
 * component lives in @/components/I18nProvider. Locale data + pure helpers
 * live in ./core (isomorphic — server components and middleware import that).
 */

import { createContext, useContext } from 'react'
import { isValidLang, type Lang, type DictKey } from './core'
import type { CmsBlockKey } from '../cms-blocks'

export { translate, ruPlural, LANGS, RTL_LANGS, localizedHref, stripLangPrefix } from './core'
export type { DictKey, Lang } from './core'

export interface I18nContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: DictKey, vars?: Record<string, string | number>) => string
  /** CMS marketing block text — DB override → registry default. */
  b: (key: CmsBlockKey) => string
}

export const I18nContext = createContext<I18nContextValue | null>(null)

const STORAGE_KEY = 'sivrce:lang'
const LANG_EVENT = 'sivrce:lang-changed'

/** Client-only: locale source of truth = URL prefix ("/en/…"), then localStorage. */
export function readStoredLang(): Lang {
  try {
    const seg = window.location.pathname.split('/')[1] ?? ''
    if (isValidLang(seg)) {
      if (localStorage.getItem(STORAGE_KEY) !== seg) localStorage.setItem(STORAGE_KEY, seg)
      return seg
    }
    const raw = localStorage.getItem(STORAGE_KEY) ?? ''
    return isValidLang(raw) ? raw : 'ka'
  } catch {
    return 'ka'
  }
}

export function persistLang(lang: Lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    /* storage unavailable (private mode) — ignore */
  }
}

/** Server snapshot for useSyncExternalStore — always the default language. */
export function getServerLang(): Lang {
  return 'ka'
}

/** Subscribe to language changes (same-tab setter + cross-tab storage events). */
export function subscribeLang(onChange: () => void): () => void {
  window.addEventListener(LANG_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(LANG_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

export function emitLangChange() {
  window.dispatchEvent(new CustomEvent(LANG_EVENT))
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within <I18nProvider>')
  return ctx
}
