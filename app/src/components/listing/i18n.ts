import type { Lang } from '@/lib/i18n/context'

/**
 * Co-located copy for the listing detail page.
 * Shared dicts (@/lib/i18n/*) are frozen — new listing strings live here.
 * Languages without a map fall back to English.
 */
const en = {
  reviewsTitle: 'Reviews & rating',
  reviewsSub: 'What guests and buyers say about this listing',
  similarSub: 'Same city · {deal}',
} as const

export type ListingCopyKey = keyof typeof en

const ka: Record<ListingCopyKey, string> = {
  reviewsTitle: 'შეფასებები და რეიტინგი',
  reviewsSub: 'რას ამბობენ სტუმრები და მყიდველები ამ განცხადებაზე',
  similarSub: 'იგივე ქალაქი · {deal}',
}

const ru: Record<ListingCopyKey, string> = {
  reviewsTitle: 'Отзывы и рейтинг',
  reviewsSub: 'Что гости и покупатели говорят об этом объявлении',
  similarSub: 'Тот же город · {deal}',
}

const DICTS: Partial<Record<Lang, Record<ListingCopyKey, string>>> = { ka, en, ru }

/** Listing-page copy lookup with `{var}` substitution; English fallback. */
export function lt(lang: Lang, key: ListingCopyKey, vars?: Record<string, string | number>): string {
  const template = DICTS[lang]?.[key] ?? en[key]
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (m, name: string) =>
    vars[name] !== undefined ? String(vars[name]) : m,
  )
}
