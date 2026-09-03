/**
 * SIVRCE — server-side translator + per-locale site metadata.
 * Dicts are plain TS objects, so t() is synchronous; ka is the fallback.
 */

import type { Metadata } from 'next'
import { DEFAULT_LANG, LANGS, type DictKey, type Lang } from './core'
import { translate } from './dicts'

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

/** OpenGraph locale per lang. */export const OG_LOCALE: Record<Lang, string> = {
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
 * Every locale ships native title + description — English is not a silent fallback.
 */
export const SITE_META: Record<Lang, { title: string; description: string }> = {
  ka: {
    title: 'უძრავი ქონება საქართველოში — ბინები, სახლები, აგარაკები | sivrce',
    description:
      'ბინები, სახლები და აგარაკები საქართველოში — იყიდება, ქირავდება, გაიცემა იჯარით და ქირავდება დღიურად. თბილისში, საბურთალოზე, ბათუმში. 3D რუკა, ვერიფიკაცია, AI ფასი.',
  },
  en: {
    title: 'Real Estate in Georgia — Apartments, Houses, Cottages | sivrce',
    description:
      'Apartments, houses and cottages in Georgia — for sale, rent and daily stays. Tbilisi, Saburtalo, Batumi. 3D map, verification, AI price estimates.',
  },
  ru: {
    title: 'Недвижимость в Грузии — квартиры, дома, дачи | sivrce',
    description:
      'Квартиры, дома и дачи в Грузии — продажа, аренда и посуточно. Тбилиси, Сабуртало, Батуми. 3D-карта, верификация, ИИ-оценка цены.',
  },
  he: {
    title: 'נדל״ן בגאורגיה — דירות, בתים, צימרים | sivrce',
    description:
      'דירות, בתים וצימרים בגאורגיה — למכירה, להשכרה ולהשכרה יומית. טביליסי, סבורתלו, בתומי. מפה תלת־ממדית, אימות והערכת מחיר בבינה מלאכותית.',
  },
  ar: {
    title: 'عقارات في جورجيا — شقق، منازل، استراحات | sivrce',
    description:
      'شقق ومنازل واستراحات في جورجيا — للبيع والإيجار والإيجار اليومي. تبليسي، سابورتالو، باتومي. خريطة ثلاثية الأبعاد والتحقق وتقدير السعر بالذكاء الاصطناعي.',
  },
  tr: {
    title: 'Gürcistan’da emlak — daireler, evler, yazlıklar | sivrce',
    description:
      'Gürcistan’da daireler, evler ve yazlıklar — satılık, kiralık ve günlük. Tiflis, Saburtalo, Batum. 3B harita, doğrulama, yapay zekâ fiyat tahmini.',
  },
  uk: {
    title: 'Нерухомість у Грузії — квартири, будинки, дачі | sivrce',
    description:
      'Квартири, будинки та дачі в Грузії — продаж, оренда і подобово. Тбілісі, Сабуртало, Батумі. 3D-карта, верифікація, ШІ-оцінка ціни.',
  },
  hy: {
    title: 'Անշարժ գույք Վրաստանում — բնակարաններ, տներ, ամառանոցներ | sivrce',
    description:
      'Բնակարաններ, տներ և ամառանոցներ Վրաստանում — վաճառք, վարձակալություն և օրավարձ։ Թբիլիսի, Սաբուրթալո, Բաթում։ 3D քարտեզ, ստուգում և AI գնահատում։',
  },
  az: {
    title: 'Gürcüstanda daşınmaz əmlak — mənzillər, evlər, bağ evləri | sivrce',
    description:
      'Gürcüstanda mənzillər, evlər və bağ evləri — satış, kirayə və günlük. Tbilisi, Saburtalo, Batumi. 3D xəritə, təsdiq, AI qiymət.',
  },
}

/** Per-locale keyword set — Bing/Yandex still read this; Google mostly ignores it. */
export const SITE_KEYWORDS: Record<Lang, string[]> = {
  ka: [
    'უძრავი ქონება საქართველოში',
    'ბინები საქართველოში',
    'სახლები საქართველოში',
    'აგარაკები საქართველოში',
    'იყიდება ბინა',
    'ქირავდება ბინა',
    'ქირავდება დღიურად',
    'უძრავი ქონება თბილისში',
    'ბინები დღიურად თბილისში',
    'ბინები დღიურად საბურთალოზე',
    'ბინები დღიურად',
    'ბინები დღიურად ვაკეში',
    'ბინები დღიურად ბათუმში',
    'იყიდება ბინა თბილისში',
    'ქირავდება ბინა თბილისში',
    'იყიდება სახლი თბილისში',
    'ბინები საბურთალოზე',
    'ბინები ვაკეში',
    'უძრავი ქონება ბათუმში',
    'ახალი პროექტები თბილისში',
    'ბინა დეველოპერისგან',
    'იპოთეკა საქართველოში',
    'ბინები ბაკურიანში',
    'ბინები გუდაურში',
    'sivrce',
    'სივრცე',
  ],
  en: [
    'real estate georgia',
    'apartments georgia',
    'houses georgia',
    'cottages georgia',
    'apartments tbilisi',
    'daily rent tbilisi',
    'apartments saburtalo',
    'apartments batumi',
    'buy apartment tbilisi',
    'new buildings tbilisi',
    'bakuriani apartments',
    'sivrce',
  ],
  ru: [
    'недвижимость в грузии',
    'квартиры грузия',
    'дома грузия',
    'дачи грузия',
    'квартиры тбилиси',
    'квартиры посуточно тбилиси',
    'сабуртало посуточно',
    'купить квартиру в тбилиси',
    'новостройки тбилиси',
    'бакуриани квартиры',
    'sivrce',
  ],
  he: ['נדל״ן בגאורגיה', 'דירות בטביליסי', 'השכרה יומית טביליסי', 'sivrce'],
  ar: ['عقارات جورجيا', 'شقق تبليسي', 'إيجار يومي تبليسي', 'sivrce'],
  tr: ['gürcistan emlak', 'tiflis günlük kiralık', 'saburtalo daire', 'sivrce'],
  uk: ['нерухомість грузія', 'квартири тбілісі подобово', 'sivrce'],
  hy: ['անշարժ գույք վրաստան', 'բնակարաններ թբիլիսի', 'sivrce'],
  az: ['gürcüstan daşınmaz əmlak', 'tbilisi günlük mənzil', 'sivrce'],
}

export interface PageCopy {
  title: string
  description: string
}

/**
 * Standard static-page metadata: native ka/en/ru copy (the other six locales
 * read en — never serve ka copy on non-ka URLs) + per-path canonical/hreflang.
 * The [lang] layout title template appends "| sivrce" — don't hardcode it.
 */
export function pageMeta(
  path: string,
  lang: Lang,
  copy: { ka: PageCopy; en: PageCopy } & Partial<Record<Lang, PageCopy>>,
): Metadata {
  const c = copy[lang] ?? copy.en
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: path, languages: langAlternates(path) },
  }
}
