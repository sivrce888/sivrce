/**
 * Basemap labels: place-native + user lang (English fallback).
 * Germany (Latin script) gets München / Munich — OFM's name:latin+name:nonlatin
 * pair is a no-op there. Skip the second line when it matches the first.
 * ponytail: retarget text-field on stock OFM layers only; sivrce layers
 * (price/label/point_count) never contain `name`, so untouched.
 * Ceiling: per-tile `name:ka` is sparse abroad — local+en still paints.
 */
import type { Map as MlMap } from 'maplibre-gl'
import type { Lang } from '@/lib/i18n/core'

const LANG_FIELD: Record<Lang, string> = {
  ka: 'name:ka',
  en: 'name:en',
  ru: 'name:ru',
  de: 'name:de',
  ar: 'name:ar',
  tr: 'name:tr',
  uk: 'name:uk',
  hy: 'name:hy',
  az: 'name:az',
  he: 'name:he',
}

const EN_SCALE = { 'font-scale': 0.82 } as const

/** Two-line label; second line dropped when empty or identical. */
export function bilingualTextField(localExpr: unknown, enExpr: unknown): unknown {
  return [
    'let',
    'local',
    localExpr,
    'en',
    enExpr,
    [
      'case',
      ['any', ['==', ['var', 'en'], ''], ['==', ['var', 'local'], ['var', 'en']]],
      ['var', 'local'],
      ['format', ['var', 'local'], {}, '\n', {}, ['var', 'en'], EN_SCALE],
    ],
  ]
}

/**
 * Local official name on top (matches street signs).
 * Second line: UI lang if it differs, else English. Deduped.
 */
export function mapLabelField(lang: Lang): unknown {
  const user = LANG_FIELD[lang]
  return [
    'let',
    'local',
    ['coalesce', ['get', 'name'], ['get', 'name:latin'], ''],
    'user',
    ['coalesce', ['get', user], ''],
    'en',
    ['coalesce', ['get', 'name:en'], ''],
    'secondary',
    [
      'case',
      ['all', ['!=', ['var', 'user'], ''], ['!=', ['var', 'user'], ['var', 'local']]],
      ['var', 'user'],
      ['var', 'en'],
    ],
    [
      'case',
      [
        'any',
        ['==', ['var', 'secondary'], ''],
        ['==', ['var', 'local'], ['var', 'secondary']],
      ],
      ['var', 'local'],
      ['format', ['var', 'local'], {}, '\n', {}, ['var', 'secondary'], EN_SCALE],
    ],
  ]
}

/** Rewrite stock label layers in place. Idempotent, sync, no re-fetch. */
export function applyMapLanguage(map: MlMap, lang: Lang): void {
  const field = mapLabelField(lang)
  for (const l of map.getStyle()?.layers ?? []) {
    if (l.type !== 'symbol') continue
    if (/^sivrce-/i.test(l.id)) continue
    let cur: unknown
    try {
      cur = map.getLayoutProperty(l.id, 'text-field')
    } catch {
      continue
    }
    if (!cur || !JSON.stringify(cur).includes('name')) continue
    try {
      map.setLayoutProperty(l.id, 'text-field', field as never)
    } catch {
      /* style variant shape differs */
    }
  }
}
