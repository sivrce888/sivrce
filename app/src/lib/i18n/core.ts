/**
 * SIVRCE — isomorphic i18n core (no 'use client', no React).
 * Safe to import from server components, middleware and client code.
 * The React context/hook lives in ./context; a server-bound t() in ./server.
 */

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

/** ka is the canonical default and stays URL-unprefixed. */
export const DEFAULT_LANG: Lang = 'ka'

/** Every locale that carries a URL prefix (all except ka). */
export const PREFIXED_LANGS = LANGS.filter((l) => l !== DEFAULT_LANG)

/** Right-to-left languages — the [lang] root layout sets <html dir> from this. */
export const RTL_LANGS: ReadonlySet<Lang> = new Set(['he', 'ar'])

export function isValidLang(seg: string): seg is Lang {
  return (LANGS as readonly string[]).includes(seg)
}

const DICTS: Record<Lang, Record<DictKey, string>> = { ka, en, ru, he, ar, tr, uk, hy, az }

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

/** Interpolate a raw template (plural markers + {vars}) — shared by translate() and CMS overrides. */
export function translateRaw(
  template: string,
  vars?: Record<string, string | number>,
): string {
  const out = applyPlurals(template, vars)
  if (!vars) return out
  return out.replace(/\{(\w+)\}/g, (match, name: string) =>
    vars[name] !== undefined ? String(vars[name]) : match,
  )
}

export function translate(
  lang: Lang,
  key: DictKey,
  vars?: Record<string, string | number>,
): string {
  return translateRaw(DICTS[lang][key] ?? ka[key] ?? String(key), vars)
}

/** Locale-aware internal href: ka stays unprefixed, others get /{lang}. */
export function localizedHref(path: string, lang: Lang): string {
  return lang === DEFAULT_LANG ? path : `/${lang}${path === '/' ? '' : path}`
}

// ponytail: localizedHref is wired into the chrome that owns cross-locale
// navigation (Navbar, Footer, LangSwitcher, Logo). Deeper call sites (cards,
// breadcrumbs, in-body links) still emit unprefixed hrefs — middleware serves
// them in ka and the URL-pinned provider keeps UX correct; sweeping the long
// tail is a follow-up wave.

const LANG_PREFIX_RE = /^\/(ka|en|ru|he|ar|tr|uk|hy|az)(?=\/|$)/

/**
 * Strip any locale prefix (incl. the internal /ka rewrite target) so pathname
 * comparisons match the unprefixed route map. "/" when the path is a bare root.
 */
export function stripLangPrefix(pathname: string): string {
  return pathname.replace(LANG_PREFIX_RE, '') || '/'
}
