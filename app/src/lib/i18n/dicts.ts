/**
 * SIVRCE — all-locale dictionary table (server + node only).
 * Client bundles must never import this: [lang] pages receive their dict as
 * an RSC prop on <I18nProvider>, ka (default + universal fallback) ships as
 * its own static chunk, and the other locales load on demand from the
 * provider. Keeps ~92KB gzip of dictionaries out of every page's initial JS.
 * Guarded by i18n.check.ts (no 'use client' module may import this file).
 */

import { ka, type DictKey } from "./ka"
import { en } from "./en"
import { ru } from "./ru"
import { he } from "./he"
import { ar } from "./ar"
import { tr } from "./tr"
import { uk } from "./uk"
import { hy } from "./hy"
import { az } from "./az"
import { translateRaw, type Lang } from "./core"

const DICTS: Record<Lang, Record<DictKey, string>> = { ka, en, ru, he, ar, tr, uk, hy, az }

export function getDict(lang: Lang): Record<DictKey, string> {
  return DICTS[lang]
}

export function translate(
  lang: Lang,
  key: DictKey,
  vars?: Record<string, string | number>,
): string {
  return translateRaw(DICTS[lang][key] ?? ka[key] ?? String(key), vars)
}
