import { useI18n } from '@/lib/i18n/context'

/**
 * Co-located strings for the favorites page (shared dicts are locked).
 * All 10 langs covered; falls back to en.
 */
const STRINGS = {
  ka: {
    priceAlertOn: 'ფასის ალერტი ჩართულია',
    priceAlertOff: 'ფასის ალერტი (ელფოსტით — შესვლის შემდეგ)',
  },
  en: {
    priceAlertOn: 'Price alert on',
    priceAlertOff: 'Price alert (email when signed in)',
  },
  ru: {
    priceAlertOn: 'Уведомление о цене включено',
    priceAlertOff: 'Уведомление о цене (email после входа)',
  },
  tr: {
    priceAlertOn: 'Fiyat alarmı açık',
    priceAlertOff: 'Fiyat alarmı (giriş yaptıktan sonra e-posta ile)',
  },
  ar: {
    priceAlertOn: 'تنبيه السعر مُفعّل',
    priceAlertOff: 'تنبيه السعر (بريد إلكتروني بعد تسجيل الدخول)',
  },
  de: {
    priceAlertOn: 'Preisalarm aktiv',
    priceAlertOff: 'Preisalarm (E-Mail nach der Anmeldung)',
  },
  he: {
    priceAlertOn: 'התראת מחיר פעילה',
    priceAlertOff: 'התראת מחיר (אימייל לאחר התחברות)',
  },
  hy: {
    priceAlertOn: 'Գնի ծանուցը միացված է',
    priceAlertOff: 'Գնի ծանուց (էլ. փոստով՝ մուտք գործելուց հետո)',
  },
  az: {
    priceAlertOn: 'Qiymət siqnalı aktivdir',
    priceAlertOff: 'Qiymət siqnalı (daxil olduqdan sonra e-poçtla)',
  },
  uk: {
    priceAlertOn: 'Цінове сповіщення увімкнено',
    priceAlertOff: 'Цінове сповіщення (email після входу)',
  },
} as const

export type FavoritesStringKey = keyof (typeof STRINGS)['en']

export function useFavoritesStrings(): (key: FavoritesStringKey) => string {
  const { lang } = useI18n()
  const dict: Record<FavoritesStringKey, string> = STRINGS[lang] ?? STRINGS.en
  return (key) => dict[key]
}
