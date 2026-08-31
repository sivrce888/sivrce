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
    title: 'უძრავი ქონება საქართველოში — ბინები, სახლები იყიდება და ქირავდება | sivrce',
    description:
      'სივრცე — უძრავი ქონება ერთ სივრცეში. მარტივი, სწრაფი და დაცული ძიება საქართველოში: ბინები, სახლები, მიწა და კომერციული ფართები იყიდება, ქირავდება და დღიურად — 3D რუკა, ვერიფიკაცია და AI ფასის შეფასება.',
  },
  en: {
    title: 'Real Estate in Georgia — Apartments & Houses for Sale and Rent | sivrce',
    description:
      'sivrce — Real Estate in one place. The simple, fast, secure way to buy, rent or list in Georgia: apartments, houses, land and commercial property — with a 3D map, verification and AI price estimates.',
  },
  ru: {
    title: 'Недвижимость в Грузии — квартиры и дома: продажа и аренда | sivrce',
    description:
      'sivrce — недвижимость в одном пространстве. Простой, быстрый и безопасный поиск в Грузии: квартиры, дома, земля и коммерция — продажа, аренда и посуточно. 3D-карта, верификация и ИИ-оценка цены.',
  },
  he: {
    title: 'נדל״ן בגאורגיה — דירות ובתים למכירה ולהשכרה | sivrce',
    description:
      'sivrce — נדל״ן במקום אחד. הדרך הפשוטה, המהירה והבטוחה לקנות, לשכור או לפרסם בגאורגיה: דירות, בתים, קרקע ומסחר — מפה תלת־ממדית, אימות והערכת מחיר בבינה מלאכותית.',
  },
  ar: {
    title: 'عقارات في جورجيا — شقق ومنازل للبيع والإيجار | sivrce',
    description:
      'sivrce — العقارات في مكان واحد. الطريقة البسيطة والسريعة والآمنة للشراء أو الإيجار أو النشر في جورجيا: شقق ومنازل وأراضٍ وعقارات تجارية — مع خريطة ثلاثية الأبعاد والتحقق وتقدير السعر بالذكاء الاصطناعي.',
  },
  tr: {
    title: 'Gürcistan’da emlak — satılık ve kiralık daireler ve evler | sivrce',
    description:
      'sivrce — emlak tek yerde. Gürcistan’da almak, kiralamak veya ilan vermek için basit, hızlı ve güvenli yol: daireler, evler, arsa ve ticari — 3B harita, doğrulama ve yapay zekâ fiyat tahmini.',
  },
  uk: {
    title: 'Нерухомість у Грузії — квартири та будинки: продаж і оренда | sivrce',
    description:
      'sivrce — нерухомість в одному місці. Простий, швидкий і безпечний спосіб купити, орендувати або розмістити в Грузії: квартири, будинки, земля і комерція — 3D-карта, верифікація та ШІ-оцінка ціни.',
  },
  hy: {
    title: 'Անշարժ գույք Վրաստանում — բնակարաններ և տներ վաճառք և վարձակալություն | sivrce',
    description:
      'sivrce — անշարժ գույք մեկ տեղում. Վրաստանում գնելու, վարձակալելու կամ հայտարարություն տեղադրելու պարզ, արագ և ապահով ճանապարհ՝ բնակարաններ, տներ, հող և առևտուր — 3D քարտեզ, ստուգում և AI գնահատում.',
  },
  az: {
    title: 'Gürcüstanda daşınmaz əmlak — mənzillər və evlər: satış və icarə | sivrce',
    description:
      'sivrce — daşınmaz əmlak bir yerdə. Gürcüstanda almaq, icarəyə götürmək və ya elan yerləşdirmək üçün sadə, sürətli və təhlükəsiz yol: mənzillər, evlər, torpaq və kommersiya — 3D xəritə, təsdiq və AI qiymət qiymətləndirməsi.',
  },
}
