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
 * Every locale ships native title + description — English is not a silent fallback.
 */
export const SITE_META: Record<Lang, { title: string; description: string }> = {
  ka: {
    title: 'უძრავი ქონება საქართველოში — ბინები დღიურად თბილისში | sivrce',
    description:
      'ბინები დღიურად თბილისში და საბურთალოზე, იყიდება და ქირავდება ბინები, სახლები, მიწა. სივრცე — უძრავი ქონება ერთ სივრცეში. 3D რუკა, ვერიფიკაცია, AI ფასი.',
  },
  en: {
    title: 'Real Estate in Georgia — Daily Apartments in Tbilisi | sivrce',
    description:
      'Daily apartments in Tbilisi and Saburtalo. Buy, rent or list apartments, houses and land in Georgia. sivrce — 3D map, verification, AI price estimates.',
  },
  ru: {
    title: 'Недвижимость в Грузии — квартиры посуточно в Тбилиси | sivrce',
    description:
      'Квартиры посуточно в Тбилиси и Сабуртало, продажа и аренда квартир, домов и земли. sivrce — 3D-карта, верификация, ИИ-оценка цены.',
  },
  he: {
    title: 'נדל״ן בגאורגיה — דירות להשכרה יומית בטביליסי | sivrce',
    description:
      'sivrce — נדל״ן במקום אחד. הדרך הפשוטה, המהירה והבטוחה לקנות, לשכור או לפרסם בגאורגיה: דירות, בתים, קרקע ומסחר — מפה תלת־ממדית, אימות והערכת מחיר בבינה מלאכותית.',
  },
  ar: {
    title: 'عقارات في جورجيا — شقق يومية في تبليسي | sivrce',
    description:
      'sivrce — العقارات في مكان واحد. الطريقة البسيطة والسريعة والآمنة للشراء أو الإيجار أو النشر في جورجيا: شقق ومنازل وأراضٍ وعقارات تجارية — مع خريطة ثلاثية الأبعاد والتحقق وتقدير السعر بالذكاء الاصطناعي.',
  },
  tr: {
    title: 'Gürcistan’da emlak — Tiflis günlük kiralık daireler | sivrce',
    description:
      'sivrce — emlak tek yerde. Gürcistan’da almak, kiralamak veya ilan vermek için basit, hızlı ve güvenli yol: daireler, evler, arsa ve ticari — 3B harita, doğrulama ve yapay zekâ fiyat tahmini.',
  },
  uk: {
    title: 'Нерухомість у Грузії — квартири подобово в Тбілісі | sivrce',
    description:
      'sivrce — нерухомість в одному місці. Простий, швидкий і безпечний спосіб купити, орендувати або розмістити в Грузії: квартири, будинки, земля і комерція — 3D-карта, верифікація та ШІ-оцінка ціни.',
  },
  hy: {
    title: 'Անշարժ գույք Վրաստանում — օրավարձով բնակարաններ Թբիլիսիում | sivrce',
    description:
      'sivrce — անշարժ գույք մեկ տեղում. Վրաստանում գնելու, վարձակալելու կամ հայտարարություն տեղադրելու պարզ, արագ և ապահով ճանապարհ՝ բնակարաններ, տներ, հող և առևտուր — 3D քարտեզ, ստուգում և AI գնահատում.',
  },
  az: {
    title: 'Gürcüstanda daşınmaz əmlak — Tbilisidə günlük mənzillər | sivrce',
    description:
      'Tbilisi və Saburtaloda günlük mənzillər, satış və icarə. sivrce — 3D xəritə, təsdiq, AI qiymət.',
  },
}

/** Per-locale keyword set — Bing/Yandex still read this; Google mostly ignores it. */
export const SITE_KEYWORDS: Record<Lang, string[]> = {
  ka: [
    'უძრავი ქონება საქართველოში',
    'უძრავი ქონება თბილისში',
    'ბინები დღიურად თბილისში',
    'ბინები დღიურად საბურთალოზე',
    'ბინები დღიურად',
    'ბინები დღიურად ვაკეში',
    'იყიდება ბინა თბილისში',
    'ქირავდება ბინა თბილისში',
    'ბინები საბურთალოზე',
    'ბინები ვაკეში',
    'უძრავი ქონება ბათუმში',
    'ახალი პროექტები თბილისში',
    'sivrce',
    'სივრცე',
  ],
  en: [
    'real estate georgia',
    'apartments tbilisi',
    'daily rent tbilisi',
    'apartments saburtalo',
    'apartments batumi',
    'sivrce',
  ],
  ru: [
    'недвижимость в грузии',
    'квартиры тбилиси',
    'квартиры посуточно тбилиси',
    'сабуртало посуточно',
    'sivrce',
  ],
  he: ['נדל״ן בגאורגיה', 'דירות בטביליסי', 'השכרה יומית טביליסי', 'sivrce'],
  ar: ['عقارات جورجيا', 'شقق تبليسي', 'إيجار يومي تبليسي', 'sivrce'],
  tr: ['gürcistan emlak', 'tiflis günlük kiralık', 'saburtalo daire', 'sivrce'],
  uk: ['нерухомість грузія', 'квартири тбілісі подобово', 'sivrce'],
  hy: ['անշարժ գույք վրաստան', 'բնակարաններ թբիլիսի', 'sivrce'],
  az: ['gürcüstan daşınmaz əmlak', 'tbilisi günlük mənzil', 'sivrce'],
}
