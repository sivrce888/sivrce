import { useI18n } from '@/lib/i18n/context'

/**
 * Co-located strings for the favorites page (shared dicts are locked).
 * All 10 langs covered; falls back to en.
 */
const STRINGS = {
  ka: {
    priceAlertOn: 'ფასის ალერტი ჩართულია',
    priceAlertOff: 'ფასის ალერტი (ელფოსტით — შესვლის შემდეგ)',
    emptyTitle: 'ფავორიტები ჯერ ცარიელია',
    emptyText: 'დააჭირე ნებისმიერი განცხადების გულის ხატულას — ის აქ შეინახება. შესვლის შემდეგ ყველა მოწყობილობაზე გამოჩნდება.',
    searchCta: 'განცხადებების ძიება',
    savedCount: 'შენახული განცხადება',
    alertHint: 'ზარის ნიშანი = ფასის შეტყობინება ელფოსტაზე',
  },
  en: {
    priceAlertOn: 'Price alert on',
    priceAlertOff: 'Price alert (email when signed in)',
    emptyTitle: 'No saved listings yet',
    emptyText: 'Tap the heart on any listing — it lands here. Sign in and it follows you to every device.',
    searchCta: 'Search listings',
    savedCount: 'Saved listings',
    alertHint: 'Bell = email price alerts',
  },
  ru: {
    priceAlertOn: 'Уведомление о цене включено',
    priceAlertOff: 'Уведомление о цене (email после входа)',
    emptyTitle: 'Пока нет избранного',
    emptyText: 'Нажми сердце на объявлении — оно появится здесь. После входа — на всех твоих устройствах.',
    searchCta: 'Искать объявления',
    savedCount: 'Сохранённые объявления',
    alertHint: 'Колокольчик = уведомления о цене на email',
  },
  tr: {
    priceAlertOn: 'Fiyat alarmı açık',
    priceAlertOff: 'Fiyat alarmı (giriş yaptıktan sonra e-posta ile)',
    emptyTitle: 'Henüz kayıtlı ilan yok',
    emptyText: 'Bir ilandaki kalbe bas — burada saklanır. Giriş yaparsan tüm cihazlarında görünür.',
    searchCta: 'İlan ara',
    savedCount: 'Kayıtlı ilanlar',
    alertHint: 'Zil = e-posta fiyat uyarısı',
  },
  ar: {
    priceAlertOn: 'تنبيه السعر مُفعّل',
    priceAlertOff: 'تنبيه السعر (بريد إلكتروني بعد تسجيل الدخول)',
    emptyTitle: 'لا عقارات محفوظة بعد',
    emptyText: 'اضغط القلب على أي إعلان — يُحفظ هنا. سجّل الدخول ليظهر على جميع أجهزتك.',
    searchCta: 'ابحث عن العقارات',
    savedCount: 'العقارات المحفوظة',
    alertHint: 'الجرس = تنبيهات السعر بالبريد',
  },
  de: {
    priceAlertOn: 'Preisalarm aktiv',
    priceAlertOff: 'Preisalarm (E-Mail nach der Anmeldung)',
    emptyTitle: 'Noch keine Favoriten',
    emptyText: 'Tippe auf das Herz bei einem Inserat — es landet hier. Angemeldet auf all deinen Geräten.',
    searchCta: 'Inserate suchen',
    savedCount: 'Gespeicherte Inserate',
    alertHint: 'Glocke = Preisalarme per E-Mail',
  },
  he: {
    priceAlertOn: 'התראת מחיר פעילה',
    priceAlertOff: 'התראת מחיר (אימייל לאחר התחברות)',
    emptyTitle: 'אין עדיין מועדפים',
    emptyText: 'לחץ על הלב במודעה — היא תישמר כאן. התחבר והיא תופיע בכל המכשירים שלך.',
    searchCta: 'חיפוש מודעות',
    savedCount: 'מודעות שמורות',
    alertHint: 'פעמון = התראות מחיר באימייל',
  },
  hy: {
    priceAlertOn: 'Գնի ծանուցը միացված է',
    priceAlertOff: 'Գնի ծանուց (էլ. փոստով՝ մուտք գործելուց հետո)',
    emptyTitle: 'Դեռ ընտրյալներ չկան',
    emptyText: 'Սեղմիր սիրտը հայտարարության վրա — այն կպահվի այստեղ։ Մուտք գործիր, և այն կհայտնվի քո բոլոր սարքերում։',
    searchCta: 'Փնտրել հայտարարություններ',
    savedCount: 'Պահված հայտարարություններ',
    alertHint: 'Զանգակ = գնի ծանուց էլ. փոստով',
  },
  az: {
    priceAlertOn: 'Qiymət siqnalı aktivdir',
    priceAlertOff: 'Qiymət siqnalı (daxil olduqdan sonra e-poçtla)',
    emptyTitle: 'Hələ seçilmiş elan yoxdur',
    emptyText: 'Elanın ürəyinə bas — burada saxlanır. Daxil ol və bütün cihazlarında görünsün.',
    searchCta: 'Elan axtar',
    savedCount: 'Saxlanmış elanlar',
    alertHint: 'Zəng = e-poçt qiymət siqnalı',
  },
  uk: {
    priceAlertOn: 'Цінове сповіщення увімкнено',
    priceAlertOff: 'Цінове сповіщення (email після входу)',
    emptyTitle: 'Поки немає обраного',
    emptyText: 'Натисни серце на оголошенні — воно з’явиться тут. Після входу — на всіх твоїх пристроях.',
    searchCta: 'Шукати оголошення',
    savedCount: 'Збережені оголошення',
    alertHint: 'Дзвіночок = сповіщення про ціну на email',
  },
} as const

export type FavoritesStringKey = keyof (typeof STRINGS)['en']

export function useFavoritesStrings(): (key: FavoritesStringKey) => string {
  const { lang } = useI18n()
  const dict: Record<FavoritesStringKey, string> = STRINGS[lang] ?? STRINGS.en
  return (key) => dict[key]
}
