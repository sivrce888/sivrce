'use client'

/**
 * SIVRCE — i18n context, hook and translation core.
 * Kept component-free so this module stays fast-refresh clean; the provider
 * component lives in @/components/I18nProvider.
 */

import { createContext, useContext } from 'react'
import { ka, type DictKey } from './ka'
import { en } from './en'
import { ru } from './ru'
import { he } from './he'
import { ar } from './ar'
import { tr } from './tr'
import { uk } from './uk'
import { hy } from './hy'
import { az } from './az'

export type { DictKey }
export type Lang = 'ka' | 'en' | 'ru' | 'he' | 'ar' | 'tr' | 'uk' | 'hy' | 'az'

export const LANGS: readonly Lang[] = ['ka', 'en', 'ru', 'he', 'ar', 'tr', 'uk', 'hy', 'az']

/** Right-to-left languages — I18nProvider syncs <html dir> from this. */
export const RTL_LANGS: ReadonlySet<Lang> = new Set(['he', 'ar'])
const STORAGE_KEY = 'sivrce:lang'
const LANG_EVENT = 'sivrce:lang-changed'

const DICTS: Record<Lang, Record<DictKey, string>> = { ka, en, ru, he, ar, tr, uk, hy, az }

export interface I18nContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: DictKey, vars?: Record<string, string | number>) => string
}

export const I18nContext = createContext<I18nContextValue | null>(null)

/** Client-only: reads localStorage. Used as the useSyncExternalStore snapshot. */
export function readStoredLang(): Lang {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return LANGS.includes(raw as Lang) ? (raw as Lang) : 'ka'
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

/** Russian plural rule: n%10==1 && n%100!=11 → one; n%10 in 2..4 && n%100 not in 12..14 → few; else many. */
export function ruPlural(n: number, one: string, few: string, many: string): string {
  const mod100 = Math.abs(n) % 100
  const mod10 = mod100 % 10
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

/** Applies `{plural:one|other}` (2 forms) or `{plural:one|few|many}` (ru, 3 forms) markers using numeric var `n`. */
function applyPlurals(template: string, vars?: Record<string, string | number>): string {
  if (!template.includes('{plural:')) return template
  const n = Number(vars?.n)
  return template.replace(/\{plural:([^}]+)\}/g, (_m, forms: string) => {
    const f = forms.split('|')
    const one = f[0] ?? ''
    const few = f[1] ?? one
    const many = f[2] ?? few
    if (!Number.isFinite(n)) return many // pre-formatted n (e.g. "3.2კ") → most general form
    return f.length === 3 ? ruPlural(n, one, few, many) : n === 1 ? one : few
  })
}

export function translate(
  lang: Lang,
  key: DictKey,
  vars?: Record<string, string | number>,
): string {
  const template = applyPlurals(DICTS[lang][key] ?? ka[key], vars)
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    vars[name] !== undefined ? String(vars[name]) : match,
  )
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within <I18nProvider>')
  return ctx
}
