'use client'

/**
 * Co-located i18n for entity pages (developers / agents / projects).
 * Shared dicts in src/lib/i18n are untouched; ka/en/ru defined here,
 * all other languages fall back to en.
 */

import { useI18n } from '@/lib/i18n/context'
import type { Lang } from '@/lib/i18n/context'
import type { LocalName, LocalText } from '@/data/professionals'

const ka = {
  developer: 'დეველოპერი',
  agent: 'აგენტი',
  verified: 'ვერიფიცირებული',
  call: 'დარეკვა',
  yearsActive: 'წელი ბაზარზე',
  projectsDone: 'დასრულებული პროექტი',
  unitsDelivered: 'ჩაბარებული ბინა',
  dealsClosed: 'დახურული გარიგება',
  activeListings: 'აქტიური განცხადება',
  listingsShort: 'განცხადება',
  reviewsSoon: 'მიმოხილვები მალე დაემატება',
  reviewsCount: 'მიმოხილვა',
  viewProfile: 'პროფილის ნახვა',
  listingsByEntity: 'განცხადებები',
  projectsByDeveloper: 'პროექტები',
  about: 'შესახებ',
  contactEntity: 'დაგვიკავშირდით',
  languages: 'ენები',
} as const

export type EntitiesKey = keyof typeof ka

const en: Record<EntitiesKey, string> = {
  developer: 'Developer',
  agent: 'Agent',
  verified: 'Verified',
  call: 'Call',
  yearsActive: 'Years on market',
  projectsDone: 'Completed projects',
  unitsDelivered: 'Units delivered',
  dealsClosed: 'Deals closed',
  activeListings: 'Active listings',
  listingsShort: 'listings',
  reviewsSoon: 'Reviews coming soon',
  reviewsCount: 'reviews',
  viewProfile: 'View profile',
  listingsByEntity: 'Listings',
  projectsByDeveloper: 'Projects',
  about: 'About',
  contactEntity: 'Get in touch',
  languages: 'Languages',
}

const ru: Record<EntitiesKey, string> = {
  developer: 'Девелопер',
  agent: 'Агент',
  verified: 'Проверен',
  call: 'Позвонить',
  yearsActive: 'Лет на рынке',
  projectsDone: 'Завершённых проектов',
  unitsDelivered: 'Сданных квартир',
  dealsClosed: 'Закрытых сделок',
  activeListings: 'Активных объявлений',
  listingsShort: 'объявлений',
  reviewsSoon: 'Отзывы скоро появятся',
  reviewsCount: 'отзывов',
  viewProfile: 'Смотреть профиль',
  listingsByEntity: 'Объявления',
  projectsByDeveloper: 'Проекты',
  about: 'О компании',
  contactEntity: 'Связаться',
  languages: 'Языки',
}

const DICTS: Record<string, Record<EntitiesKey, string>> = { ka, en, ru }

export function entitiesDict(lang: Lang): Record<EntitiesKey, string> {
  return DICTS[lang] ?? en
}

export function useEntities() {
  const { lang } = useI18n()
  return { lang, d: entitiesDict(lang) }
}

/** Pick a localized name/text; non-ka/en/ru languages fall back to en. */
export function pick(text: LocalName | LocalText, lang: Lang): string {
  if (lang === 'ka') return text.ka
  if (lang === 'ru') return text.ru
  return text.en
}

const CITY: Record<string, { en: string; ru: string }> = {
  'თბილისი': { en: 'Tbilisi', ru: 'Тбилиси' },
  'ბათუმი': { en: 'Batumi', ru: 'Батуми' },
}

/** Listing.city values are stored in ka; localize for display. */
export function localizeCity(kaCity: string, lang: Lang): string {
  if (lang === 'ka') return kaCity
  return CITY[kaCity]?.[lang === 'ru' ? 'ru' : 'en'] ?? kaCity
}
