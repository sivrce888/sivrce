'use client'

/**
 * Market page i18n — co-located per HARD RULES (shared dicts are read-only).
 * Languages beyond ka/en/ru fall back to English.
 */

import { useI18n } from '@/lib/i18n/context'

const en = {
  eyebrow: 'Market analytics',
  h1: 'Property prices in Georgia',
  sub: 'Live average prices per m², medians and demand — aggregated directly from active listings, updated daily.',
  updated: 'Updated',
  avgM2: 'Avg. price / m²',
  median: 'Median price',
  active: 'Active listings',
  newListings: 'New this month',
  vsPrevMonth: 'vs previous month',
  districtsTitle: 'Prices by district',
  districtsSub: 'Sorted by listing volume — tap a district to see live listings',
  listingsShort: 'listings',
  methodologyTitle: 'How we calculate',
  methodology:
    'Prices are USD-normalized per m² across active sivrce listings. District stats need at least 3 listings to display; month-over-month compares against last month’s stored snapshot.',
  ctaSearch: 'Browse listings',
  ctaNeighborhoods: 'Neighborhood guides',
  emptyTitle: 'Statistics are accumulating',
  emptyBody:
    'Market stats appear once enough verified listings are published. Add yours and be first in your district.',
  perM2: '/m²',
  breadcrumbHome: 'Home',
} as const

export type MarketKey = keyof typeof en

const ka: Record<MarketKey, string> = {
  eyebrow: 'ბაზრის ანალიტიკა',
  h1: 'უძრავი ქონების ფასები საქართველოში',
  sub: 'საშუალო ფასები მ²-ზე, მედიანები და მოთხოვნა — პირდაპირ აქტიური განცხადებებიდან, ყოველდღიური განახლებით.',
  updated: 'განახლდა',
  avgM2: 'საშუალო ფასი / მ²',
  median: 'მედიანური ფასი',
  active: 'აქტიური განცხადება',
  newListings: 'ახალი ამ თვეს',
  vsPrevMonth: 'წინა თვესთან შედარებით',
  districtsTitle: 'ფასები უბნების მიხედვით',
  districtsSub: 'დალაგებულია განცხადებების რაოდენობით — აირჩიე უბან და ნახე ლაივ განცხადებები',
  listingsShort: 'განცხადება',
  methodologyTitle: 'როგორ ვითვლით',
  methodology:
    'ფასები ნორმალიზებულია დოლარში ერთ მ²-ზე აქტიური sivrce-განცხადებების საფუძველზე. უბნის სტატისტიკა ჩნდება მინიმუმ 3 განცხადებიდან; თვეების ცვლილება შედარებულია წინა თვის სნაპშოტთან.',
  ctaSearch: 'განცხადებების ნახვა',
  ctaNeighborhoods: 'უბნების გზამკვლევი',
  emptyTitle: 'სტატისტიკა გროვდება',
  emptyBody:
    'საბაზრო მაჩვენებლები გამოჩნდება საკმარისი ვერიფიცირებული განცხადებების შემდეგ. დაამატე შენი — პირველი იყავი შენს უბანში.',
  perM2: '/მ²',
  breadcrumbHome: 'მთავარი',
}

const ru: Record<MarketKey, string> = {
  eyebrow: 'Аналитика рынка',
  h1: 'Цены на недвижимость в Грузии',
  sub: 'Средние цены за м², медианы и спрос — напрямую из активных объявлений, обновляется ежедневно.',
  updated: 'Обновлено',
  avgM2: 'Сред. цена / м²',
  median: 'Медианная цена',
  active: 'Активные объявления',
  newListings: 'Новые за месяц',
  vsPrevMonth: 'к предыдущему месяцу',
  districtsTitle: 'Цены по районам',
  districtsSub: 'Отсортировано по количеству объявлений — выберите район для живых объявлений',
  listingsShort: 'объявлений',
  methodologyTitle: 'Как мы считаем',
  methodology:
    'Цены нормализованы в USD за м² по активным объявлениям sivrce. Статистика района — от 3 объявлений; изменение за месяц сравнивается со снапшотом прошлого месяца.',
  ctaSearch: 'Смотреть объявления',
  ctaNeighborhoods: 'Гиды по районам',
  emptyTitle: 'Статистика накапливается',
  emptyBody:
    'Рыночные показатели появятся после достаточного числа проверенных объявлений. Добавьте своё — будьте первым в своём районе.',
  perM2: '/м²',
  breadcrumbHome: 'Главная',
}

const DICTS: Record<string, Record<MarketKey, string>> = { ka, en, ru }

/** Market strings for the active language (en fallback for he/ar/tr/uk/hy/az). */
export function useMarket(): Record<MarketKey, string> {
  const { lang } = useI18n()
  return DICTS[lang] ?? en
}
