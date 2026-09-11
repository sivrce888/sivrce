import type { Lang } from '@/lib/i18n/context'

/**
 * Co-located copy for the listing detail page.
 * Shared dicts (@/lib/i18n/*) are frozen — new listing strings live here.
 * All 10 locales complete; unknown languages fall back to English.
 */
const en = {
  reviewsTitle: 'Reviews & rating',
  reviewsSub: 'What guests and buyers say about this listing',
  similarSub: 'Same city · {deal}',
  tourTitle: 'Book a tour',
  tourSubtitle: 'Schedule a visit with the agent — choose a date and time that works for you.',
} as const

export type ListingCopyKey = keyof typeof en

const ka: Record<ListingCopyKey, string> = {
  reviewsTitle: 'შეფასებები და რეიტინგი',
  reviewsSub: 'რას ამბობენ სტუმრები და მყიდველები ამ განცხადებაზე',
  similarSub: 'იგივე ქალაქი · {deal}',
  tourTitle: 'ტურის დაჯავშნა',
  tourSubtitle: 'დაგეგმე ვიზიტი აგენტთან — აირჩიე შენთვის ხელსაყრელი თარიღი და დრო.',
}

const ru: Record<ListingCopyKey, string> = {
  reviewsTitle: 'Отзывы и рейтинг',
  reviewsSub: 'Что гости и покупатели говорят об этом объявлении',
  similarSub: 'Тот же город · {deal}',
  tourTitle: 'Записаться на просмотр',
  tourSubtitle: 'Запланируйте визит с агентом — выберите удобную дату и время.',
}

const tr: Record<ListingCopyKey, string> = {
  reviewsTitle: 'Yorumlar ve puan',
  reviewsSub: 'Misafirlerin ve alıcıların bu ilan hakkında söyledikleri',
  similarSub: 'Aynı şehir · {deal}',
  tourTitle: 'Tur rezervasyonu',
  tourSubtitle: 'Danışmanla bir ziyaret planlayın — size uygun tarih ve saati seçin.',
}

const ar: Record<ListingCopyKey, string> = {
  reviewsTitle: 'المراجعات والتقييم',
  reviewsSub: 'ما يقوله الضيوف والمشترون عن هذا الإعلان',
  similarSub: 'نفس المدينة · {deal}',
  tourTitle: 'احجز جولة',
  tourSubtitle: 'حدّد موعد زيارة مع الوكيل — اختر التاريخ والوقت المناسبين لك.',
}

const de: Record<ListingCopyKey, string> = {
  reviewsTitle: 'Bewertungen & Rating',
  reviewsSub: 'Was Gäste und Käufer über dieses Inserat sagen',
  similarSub: 'Gleiche Stadt · {deal}',
  tourTitle: 'Besichtigung buchen',
  tourSubtitle: 'Planen Sie einen Besuch mit dem Makler — wählen Sie Datum und Uhrzeit, die Ihnen passen.',
}

const he: Record<ListingCopyKey, string> = {
  reviewsTitle: 'ביקורות ודירוג',
  reviewsSub: 'מה אורחים וקונים אומרים על מודעה זו',
  similarSub: 'אותה עיר · {deal}',
  tourTitle: 'הזמינו סיור',
  tourSubtitle: 'קבעו ביקור עם הסוכן — בחרו תאריך ושעה שנוחים לכם.',
}

const hy: Record<ListingCopyKey, string> = {
  reviewsTitle: 'Կարծիքներ և վարկանիշ',
  reviewsSub: 'Ինչ են ասում հյուրերն ու գնորդները այս հայտարարության մասին',
  similarSub: 'Նույն քաղաքը · {deal}',
  tourTitle: 'Ամրագրել այց',
  tourSubtitle: 'Պլանավորեք այց գործակալի հետ — ընտրեք ձեզ հարմար ամսաթիվն ու ժամը։',
}

const az: Record<ListingCopyKey, string> = {
  reviewsTitle: 'Rəylər və reytinq',
  reviewsSub: 'Qonaqlar və alıcılar bu elan barədə nə deyir',
  similarSub: 'Eyni şəhər · {deal}',
  tourTitle: 'Baxış rezervasyonu',
  tourSubtitle: 'Agentlə görüş planlaşdırın — sizə uyğun tarix və saatı seçin.',
}

const uk: Record<ListingCopyKey, string> = {
  reviewsTitle: 'Відгуки й рейтинг',
  reviewsSub: 'Що гості та покупці кажуть про це оголошення',
  similarSub: 'Те саме місто · {deal}',
  tourTitle: 'Записатися на перегляд',
  tourSubtitle: 'Заплануйте візит з агентом — оберіть зручну для вас дату й час.',
}

const DICTS: Partial<Record<Lang, Record<ListingCopyKey, string>>> = {
  ka, en, ru, tr, ar, de, he, hy, az, uk,
}

/** Listing-page copy lookup with `{var}` substitution; English fallback. */
export function lt(lang: Lang, key: ListingCopyKey, vars?: Record<string, string | number>): string {
  const template = DICTS[lang]?.[key] ?? en[key]
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (m, name: string) =>
    vars[name] !== undefined ? String(vars[name]) : m,
  )
}
