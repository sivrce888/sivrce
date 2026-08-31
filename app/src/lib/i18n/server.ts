/**
 * SIVRCE — server-side translator + per-locale site metadata.
 * Dicts are plain TS objects, so t() is synchronous; ka is the fallback.
 */

import { translate, DEFAULT_LANG, LANGS, type DictKey, type Lang } from './core'

/** t(key) bound to a lang, for server components/layouts. ka fallback inside translate(). */
export function getServerT(lang: Lang) {
  return (key: DictKey, vars?: Record<string, string | number>) => translate(lang, key, vars)
}

/** hreflang alternates for a path: ka unprefixed (canonical), others prefixed. */
export function langAlternates(path = '/'): Record<string, string> {
  const map: Record<string, string> = {}
  for (const l of LANGS) map[l] = l === DEFAULT_LANG ? path : `/${l}${path === '/' ? '' : path}`
  map['x-default'] = path
  return map
}

/** OpenGraph locale per lang. */
export const OG_LOCALE: Record<Lang, string> = {
  ka: 'ka_GE',
  en: 'en_US',
  ru: 'ru_RU',
  he: 'he_IL',
  ar: 'ar_SA',
  tr: 'tr_TR',
  uk: 'uk_UA',
  hy: 'hy_AM',
  az: 'az_AZ',
}

/**
 * Localized site title/description for the [lang] root layout metadata.
 * ponytail: only ka/en/ru have real translations today (lifted from the old
 * root layout + en/ru homepages); the other six fall back to English.
 * Upgrade path: translate meta per locale when the SEO corpus grows.
 */
export const SITE_META: Record<Lang, { title: string; description: string }> = {
  ka: {
    title: 'უძრავი ქონება საქართველოში — ბინები, სახლები იყიდება და ქირავდება | sivrce',
    description:
      'სივრცე — უძრავი ქონება ერთ სივრცეში. მარტივი, სწრაფი და დაცული ძიება საქართველოში: ბინები, სახლები, მიწა და კომერციული ფართები იყიდება, ქირავდება და დღიურად — 3D რუკა, ვერიფიკაცია და AI ფასის შეფასება.',
  },
  en: {
    title: 'Real Estate in Georgia — Apartments & Houses for Sale and Rent | sivrce',
    description:
      'sivrce — real estate in one space. The simple, fast, secure way to buy, rent or list in Georgia: apartments, houses, land and commercial property — with a 3D map, verification and AI price estimates.',
  },
  ru: {
    title: 'Недвижимость в Грузии — квартиры и дома: продажа и аренда | sivrce',
    description:
      'sivrce — недвижимость в одном пространстве. Простой, быстрый и безопасный поиск в Грузии: квартиры, дома, земля и коммерция — продажа, аренда и посуточно. 3D-карта, верификация и ИИ-оценка цены.',
  },
  he: { title: '', description: '' },
  ar: { title: '', description: '' },
  tr: { title: '', description: '' },
  uk: { title: '', description: '' },
  hy: { title: '', description: '' },
  az: { title: '', description: '' },
}
// Fill the untranslated locales with the English meta (see ponytail note above).
for (const l of LANGS) {
  if (!SITE_META[l].title) SITE_META[l] = SITE_META.en
}
