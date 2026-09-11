import type { Lang } from '@/lib/i18n/core'

/**
 * Co-located strings for the boost checkout menu (TierPurchaseButton).
 * ka/en/ru/de full; he/ar/tr/uk/hy/az fall back to en — never Georgian.
 * ponytail: add full dicts for the 7 when their seller volume exists.
 */
export interface PaymentsStrings {
  boost: string
  pick: string
  tiersHead: string
  dUnit: string
  renew: string
  renewHint: (days: number) => string
  maxActive: string
  addonsHead: string
  close: string
  errCooldown: string
  errGeneric: string
  errNetwork: string
  tierDesc: Record<'vip' | 'super_vip' | 'diamond', string>
  addons: Record<
    | 'turbo_7'
    | 'story'
    | 'sticker_urgent'
    | 'sticker_price_drop'
    | 'refresh_once'
    | 'color'
    | 'facebook',
    { label: string; description: string }
  >
}

const STRINGS: Record<'ka' | 'en' | 'ru' | 'de', PaymentsStrings> = {
  ka: {
    boost: 'ბუსტი',
    pick: 'აირჩიეთ პაკეტი',
    tiersHead: 'VIP · ხანგრძლივობა',
    dUnit: 'დ',
    renew: 'გაგრძელება',
    renewHint: (d) => `მიმდინარე ვადას დაემატება +${d} დღე`,
    maxActive: 'მაქსიმალური პაკეტი აქტიურია',
    addonsHead: 'დამატებითი',
    close: 'დახურვა',
    errCooldown: 'განახლება ხელმისაწვდომია 1 საათში',
    errGeneric: 'შეცდომა',
    errNetwork: 'ქსელის შეცდომა',
    tierDesc: {
      vip: 'სიაში სტანდარტულებზე წინ · VIP ნიშანი',
      super_vip: 'VIP+ კარუსელი · სიაში VIP-ზე წინ',
      diamond: 'ტოპი ყველას თავზე · მთავარი სლაიდერი',
    },
    addons: {
      turbo_7: { label: 'ტურბო · 7 დღე', description: 'SUPER VIP + ფერი + სასწრაფოდ + აწევა' },
      story: { label: 'სთორი · 1 დღე', description: 'მთავარი გვერდის Stories ზოლი · 3₾' },
      sticker_urgent: { label: 'სასწრაფოდ · 1 დღე', description: 'ნარინჯისფერი სტიკერი ბარათზე' },
      sticker_price_drop: { label: 'ფასი დაწეულია · 7 დღე', description: 'ფასის შემცირების ნიშანი' },
      refresh_once: { label: 'განახლება', description: 'განცხადება კვლავ ზემოთ ამოიწევს' },
      color: { label: 'ფერი · 7 დღე', description: 'გამორჩეული ჩარჩო ძიებაში' },
      facebook: { label: 'Facebook · 3 დღე', description: 'სოციალური გავრცელება · რიგით გამოქვეყნდება' },
    },
  },
  en: {
    boost: 'Boost',
    pick: 'Choose a package',
    tiersHead: 'VIP · Duration',
    dUnit: 'd',
    renew: 'Renew',
    renewHint: (d) => `Adds +${d} days to the current term`,
    maxActive: 'Top package is active',
    addonsHead: 'Add-ons',
    close: 'Close',
    errCooldown: 'Refresh available in 1 hour',
    errGeneric: 'Error',
    errNetwork: 'Network error',
    tierDesc: {
      vip: 'Ahead of standard listings · VIP badge',
      super_vip: 'VIP+ carousel · ahead of VIP listings',
      diamond: 'Top of every list · homepage slider',
    },
    addons: {
      turbo_7: { label: 'Turbo · 7 days', description: 'SUPER VIP + color + urgent + bump' },
      story: { label: 'Story · 1 day', description: 'Homepage stories strip · ₾3' },
      sticker_urgent: { label: 'Urgent · 1 day', description: 'Orange sticker on the card' },
      sticker_price_drop: { label: 'Price drop · 7 days', description: 'Reduced-price badge' },
      refresh_once: { label: 'Refresh', description: 'Bumps the listing back to the top' },
      color: { label: 'Color · 7 days', description: 'Highlighted border in search' },
      facebook: { label: 'Facebook · 3 days', description: 'Social reach · published in queue order' },
    },
  },
  ru: {
    boost: 'Буст',
    pick: 'Выберите пакет',
    tiersHead: 'VIP · Длительность',
    dUnit: 'д',
    renew: 'Продлить',
    renewHint: (d) => `Добавит +${d} дней к текущему сроку`,
    maxActive: 'Максимальный пакет активен',
    addonsHead: 'Дополнительно',
    close: 'Закрыть',
    errCooldown: 'Обновление будет доступно через 1 час',
    errGeneric: 'Ошибка',
    errNetwork: 'Ошибка сети',
    tierDesc: {
      vip: 'Выше обычных объявлений · значок VIP',
      super_vip: 'VIP+ карусель · выше VIP-объявлений',
      diamond: 'Топ всех списков · слайдер на главной',
    },
    addons: {
      turbo_7: { label: 'Турбо · 7 дней', description: 'SUPER VIP + цвет + срочно + подъём' },
      story: { label: 'Стори · 1 день', description: 'Полоса Stories на главной · 3₾' },
      sticker_urgent: { label: 'Срочно · 1 день', description: 'Оранжевый стикер на карточке' },
      sticker_price_drop: { label: 'Цена снижена · 7 дней', description: 'Знак снижения цены' },
      refresh_once: { label: 'Обновление', description: 'Объявление снова поднимется вверх' },
      color: { label: 'Цвет · 7 дней', description: 'Выделенная рамка в поиске' },
      facebook: { label: 'Facebook · 3 дня', description: 'Соцохват · публикация по очереди' },
    },
  },
  de: {
    boost: 'Boost',
    pick: 'Paket wählen',
    tiersHead: 'VIP · Laufzeit',
    dUnit: 'T',
    renew: 'Verlängern',
    renewHint: (d) => `Verlängert die Laufzeit um +${d} Tage`,
    maxActive: 'Top-Paket ist aktiv',
    addonsHead: 'Zusatzfunktionen',
    close: 'Schließen',
    errCooldown: 'Aktualisierung in 1 Stunde wieder möglich',
    errGeneric: 'Fehler',
    errNetwork: 'Netzwerkfehler',
    tierDesc: {
      vip: 'Vor Standardanzeigen · VIP-Badge',
      super_vip: 'VIP+ Karussell · vor VIP-Anzeigen',
      diamond: 'Oben in jeder Liste · Slider auf der Startseite',
    },
    addons: {
      turbo_7: { label: 'Turbo · 7 Tage', description: 'SUPER VIP + Farbe + Dringend + nach oben' },
      story: { label: 'Story · 1 Tag', description: 'Stories-Leiste auf der Startseite · 3₾' },
      sticker_urgent: { label: 'Dringend · 1 Tag', description: 'Orangenes Sticker auf der Karte' },
      sticker_price_drop: { label: 'Preis gesenkt · 7 Tage', description: 'Badge für Preissenkung' },
      refresh_once: { label: 'Aktualisieren', description: 'Anzeige wieder nach oben' },
      color: { label: 'Farbe · 7 Tage', description: 'Markanter Rahmen in der Suche' },
      facebook: { label: 'Facebook · 3 Tage', description: 'Reichweite · Veröffentlichung der Reihe nach' },
    },
  },
}

export function getPaymentsStrings(lang: Lang): PaymentsStrings {
  return STRINGS[lang as keyof typeof STRINGS] ?? STRINGS.en
}
