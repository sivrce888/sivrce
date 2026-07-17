import { useI18n } from '@/lib/i18n/context'

/**
 * Co-located strings for the favorites page (shared dicts are locked).
 * ka/en/ru covered; other langs fall back to en.
 */
const STRINGS = {
  ka: {
    priceAlertOn: 'ფასის შეტყობინება ჩართულია',
    priceAlertOff: 'ფასის შეტყობინების ჩართვა',
  },
  en: {
    priceAlertOn: 'Price alert on',
    priceAlertOff: 'Turn on price alert',
  },
  ru: {
    priceAlertOn: 'Уведомление о цене включено',
    priceAlertOff: 'Включить уведомление о цене',
  },
} as const

export type FavoritesStringKey = keyof (typeof STRINGS)['en']

export function useFavoritesStrings(): (key: FavoritesStringKey) => string {
  const { lang } = useI18n()
  const dict: Record<FavoritesStringKey, string> =
    lang === 'ka' || lang === 'ru' ? STRINGS[lang] : STRINGS.en
  return (key) => dict[key]
}
