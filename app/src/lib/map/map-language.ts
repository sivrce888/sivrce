/**
 * Basemap labels follow UI lang — local name first, English fallback.
 * ponytail: retarget text-field on stock OFM label layers only; sivrce
 * layers (price/label/point_count) never contain `name`, so untouched.
 * OMT fields: name (local) + name:en/name:de/… + name:latin. Ceiling: per-tile
 * `name:ka` when OFM ships it — recheck if Georgian labels vanish abroad.
 */
import type { Map as MlMap } from 'maplibre-gl'
import type { Lang } from '@/lib/i18n/core'

const LANG_FIELD: Record<Lang, string | null> = {
  ka: null,
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

/** Coalesce expr preferring UI lang → English → local → latin. */
export function mapLabelField(lang: Lang): unknown {
  const f = LANG_FIELD[lang]
  return f
    ? ['coalesce', ['get', f], ['get', 'name:en'], ['get', 'name'], ['get', 'name:latin']]
    : ['coalesce', ['get', 'name'], ['get', 'name:en'], ['get', 'name:latin']]
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
