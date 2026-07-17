'use client'

/**
 * Neighborhoods feature i18n — co-located per HARD RULES (shared dicts are
 * read-only). Languages beyond ka/en/ru fall back to English.
 */

import { useI18n } from '@/lib/i18n/context'

const en = {
  badge: 'Neighborhood guides',
  indexTitle: 'Where to live in Georgia',
  indexSub: 'Livability scores, real prices per m² and resident reviews for every district',
  scoreLabel: 'livability',
  perM2: '/m²',
  avgPrice: 'Avg. price',
  listingsHere: 'listings here',
  viewGuide: 'View guide',
  scoresTitle: 'Livability scores',
  transport: 'Transport',
  schools: 'Schools',
  green: 'Green & parks',
  safety: 'Safety',
  nightlife: 'Nightlife',
  quickStats: 'Quick stats',
  aboutTitle: 'About the area',
  listingsTitle: 'Listings in this area',
  noListings: 'No live listings in this area yet — explore the whole city instead.',
  exploreCity: 'Explore all listings',
  reviewsAria: 'Neighborhood reviews',
  breadcrumbHome: 'Home',
  breadcrumbAreas: 'Neighborhoods',
  georgia: 'Georgia',
} as const

export type NbKey = keyof typeof en

const ka: Record<NbKey, string> = {
  badge: 'უბნების გზამკვლევი',
  indexTitle: 'სად ცხოვრება ღირს საქართველოში',
  indexSub: 'ცხოვრების ხარისხის ქულები, რეალური ფასები მ²-ზე და მცხოვრებლების შეფასებები ყველა უბნისთვის',
  scoreLabel: 'ცხოვრების ხარისხი',
  perM2: '/მ²',
  avgPrice: 'საშ. ფასი',
  listingsHere: 'განცხადება',
  viewGuide: 'გზამკვლევის ნახვა',
  scoresTitle: 'ცხოვრების ხარისხის ქულები',
  transport: 'ტრანსპორტი',
  schools: 'სკოლები',
  green: 'მწვანე ზონები',
  safety: 'უსაფრთხოება',
  nightlife: 'ღამის ცხოვრება',
  quickStats: 'მთავარი ციფრები',
  aboutTitle: 'უბნის შესახებ',
  listingsTitle: 'განცხადებები ამ უბანში',
  noListings: 'ამ უბანში ჯერ არ არის აქტიური განცხადება — ნახე მთელი ქალაქი.',
  exploreCity: 'ყველა განცხადების ნახვა',
  reviewsAria: 'უბნის შეფასებები',
  breadcrumbHome: 'მთავარი',
  breadcrumbAreas: 'უბნები',
  georgia: 'საქართველო',
}

const ru: Record<NbKey, string> = {
  badge: 'Гиды по районам',
  indexTitle: 'Где жить в Грузии',
  indexSub: 'Оценки качества жизни, реальные цены за м² и отзывы жителей по каждому району',
  scoreLabel: 'качество жизни',
  perM2: '/м²',
  avgPrice: 'Сред. цена',
  listingsHere: 'объявлений',
  viewGuide: 'Открыть гид',
  scoresTitle: 'Оценки качества жизни',
  transport: 'Транспорт',
  schools: 'Школы',
  green: 'Зелень и парки',
  safety: 'Безопасность',
  nightlife: 'Ночная жизнь',
  quickStats: 'Ключевые цифры',
  aboutTitle: 'О районе',
  listingsTitle: 'Объявления в этом районе',
  noListings: 'В этом районе пока нет активных объявлений — посмотрите весь город.',
  exploreCity: 'Все объявления',
  reviewsAria: 'Отзывы о районе',
  breadcrumbHome: 'Главная',
  breadcrumbAreas: 'Районы',
  georgia: 'Грузия',
}

const DICTS: Record<string, Record<NbKey, string>> = { ka, en, ru }

/** Neighborhoods strings for the active language (en fallback for he/ar/tr/uk/hy/az). */
export function useNb(): Record<NbKey, string> {
  const { lang } = useI18n()
  return DICTS[lang] ?? en
}
