import { useI18n } from '@/lib/i18n/context'

/**
 * Co-located strings for the favorites page (shared dicts are locked).
 * ka/en/ru covered; other langs fall back to en.
 */
const STRINGS = {
  ka: {
    priceAlertOn: 'ფასის ალერტი ჩართულია',
    priceAlertOff: 'ფასის ალერტი (ელფოსტა შესვლისას)',
  },
  en: {
    priceAlertOn: 'Price alert on',
    priceAlertOff: 'Price alert (email when signed in)',
  },
  ru: {
    priceAlertOn: 'Уведомление о цене включено',
    priceAlertOff: 'Уведомление о цене (email после входа)',
  },
} as const

export type FavoritesStringKey = keyof (typeof STRINGS)['en']

export function useFavoritesStrings(): (key: FavoritesStringKey) => string {
  const { lang } = useI18n()
  const dict: Record<FavoritesStringKey, string> =
    lang === 'ka' || lang === 'ru' ? STRINGS[lang] : STRINGS.en
  return (key) => dict[key]
}
