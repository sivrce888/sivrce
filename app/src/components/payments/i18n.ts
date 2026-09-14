import type { Lang } from '@/lib/i18n/core'

/**
 * Co-located strings for the boost checkout menu (TierPurchaseButton).
 * All 10 locales complete; unknown languages fall back to English.
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

const STRINGS: Record<Lang, PaymentsStrings> = {
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
  tr: {
    boost: 'Öne Çıkar',
    pick: 'Bir paket seçin',
    tiersHead: 'VIP · Süre',
    dUnit: 'g',
    renew: 'Yenile',
    renewHint: (d) => `Mevcut süreye +${d} gün ekler`,
    maxActive: 'En üst paket aktif',
    addonsHead: 'Ek özellikler',
    close: 'Kapat',
    errCooldown: 'Yenileme 1 saat sonra yapılabilir',
    errGeneric: 'Hata',
    errNetwork: 'Ağ hatası',
    tierDesc: {
      vip: 'Standart ilanların önünde · VIP rozeti',
      super_vip: 'VIP+ karusel · VIP ilanların önünde',
      diamond: 'Her listenin tepesinde · ana sayfa slider',
    },
    addons: {
      turbo_7: { label: 'Turbo · 7 gün', description: 'SÜPER VIP + renk + acil + öne çıkar' },
      story: { label: 'Hikâye · 1 gün', description: 'Ana sayfa hikâye şeridi · 3₾' },
      sticker_urgent: { label: 'Acil · 1 gün', description: 'Kartta turuncu etiket' },
      sticker_price_drop: { label: 'Fiyat düştü · 7 gün', description: 'İndirim rozeti' },
      refresh_once: { label: 'Yenile', description: 'İlanı yeniden en üste taşır' },
      color: { label: 'Renk · 7 gün', description: 'Aramada vurgulu çerçeve' },
      facebook: { label: 'Facebook · 3 gün', description: 'Sosyal erişim · sırayla yayınlanır' },
    },
  },
  ar: {
    boost: 'تمييز',
    pick: 'اختر باقة',
    tiersHead: 'VIP · المدة',
    dUnit: 'ي',
    renew: 'تجديد',
    renewHint: (d) => `يضيف +${d} يومًا إلى المدة الحالية`,
    maxActive: 'الباقة الأعلى مفعّلة',
    addonsHead: 'إضافات',
    close: 'إغلاق',
    errCooldown: 'التحديث متاح بعد ساعة',
    errGeneric: 'خطأ',
    errNetwork: 'خطأ في الشبكة',
    tierDesc: {
      vip: 'قبل الإعلانات العادية · شارة VIP',
      super_vip: 'دائرة VIP+ · قبل إعلانات VIP',
      diamond: 'أعلى كل قائمة · شريط الصفحة الرئيسية',
    },
    addons: {
      turbo_7: { label: 'تيربو · 7 أيام', description: 'SUPER VIP + لون + عاجل + تصدير' },
      story: { label: 'ستوري · يوم واحد', description: 'شريط الستوري في الرئيسية · 3₾' },
      sticker_urgent: { label: 'عاجل · يوم واحد', description: 'ملصق برتقالي على البطاقة' },
      sticker_price_drop: { label: 'انخفض السعر · 7 أيام', description: 'شارة تخفيض السعر' },
      refresh_once: { label: 'تحديث', description: 'يعيد الإعلان إلى الأعلى' },
      color: { label: 'لون · 7 أيام', description: 'إطار مميز في البحث' },
      facebook: { label: 'فيسبوك · 3 أيام', description: 'وصول اجتماعي · نشر بالترتيب' },
    },
  },
  he: {
    boost: 'קידום',
    pick: 'בחרו חבילה',
    tiersHead: 'VIP · משך',
    dUnit: 'י',
    renew: 'חידוש',
    renewHint: (d) => `מוסיף +${d} ימים לתקופה הנוכחית`,
    maxActive: 'החבילה הבכירה פעילה',
    addonsHead: 'תוספות',
    close: 'סגירה',
    errCooldown: 'הרענון יתאפשר בעוד שעה',
    errGeneric: 'שגיאה',
    errNetwork: 'שגיאת רשת',
    tierDesc: {
      vip: 'לפני המודעות הרגילות · תג VIP',
      super_vip: 'קרוסלת VIP+ · לפני מודעות VIP',
      diamond: 'ראש כל רשימה · סליידר בדף הבית',
    },
    addons: {
      turbo_7: { label: 'טורבו · 7 ימים', description: 'SUPER VIP + צבע + דחוף + הרמה' },
      story: { label: 'סטורי · יום', description: 'פס הסטוריז בדף הבית · 3₾' },
      sticker_urgent: { label: 'דחוף · יום', description: 'מדבקה כתומה על הכרטיס' },
      sticker_price_drop: { label: 'המחיר ירד · 7 ימים', description: 'תג הנחה' },
      refresh_once: { label: 'רענון', description: 'מעלה את המודעה חזרה למעלה' },
      color: { label: 'צבע · 7 ימים', description: 'מסגרת מודגשת בחיפוש' },
      facebook: { label: 'פייסבוק · 3 ימים', description: 'חשיפה חברתית · פרסום לפי תור' },
    },
  },
  hy: {
    boost: 'Առաջմղում',
    pick: 'Ընտրեք փաթեթը',
    tiersHead: 'VIP · Տևողություն',
    dUnit: 'օ',
    renew: 'Երկարացնել',
    renewHint: (d) => `Ընթացիկ ժամկետին ավելացնում է +${d} օր`,
    maxActive: 'Բարձրագույն փաթեթն ակտիվ է',
    addonsHead: 'Հավելումներ',
    close: 'Փակել',
    errCooldown: 'Թարմացումը հասանելի կլինի 1 ժամից',
    errGeneric: 'Սխալ',
    errNetwork: 'Ցանցային սխալ',
    tierDesc: {
      vip: 'Սովորական հայտարարություններից առաջ · VIP նշան',
      super_vip: 'VIP+ կարուսել · VIP հայտարարություններից առաջ',
      diamond: 'Բոլոր ցանկերի գագաթին · գլխավոր սլայդեր',
    },
    addons: {
      turbo_7: { label: 'Տուրբո · 7 օր', description: 'SUPER VIP + գույն + հրատապ + բարձրացում' },
      story: { label: 'Սթորի · 1 օր', description: 'Գլխավոր էջի Stories գոտի · 3₾' },
      sticker_urgent: { label: 'Հրատապ · 1 օր', description: 'Նարնջագույն ստիկեր քարտի վրա' },
      sticker_price_drop: { label: 'Գինը նվազել է · 7 օր', description: 'Գնի իջեցման նշան' },
      refresh_once: { label: 'Թարմացում', description: 'Հայտարարությունը կրկին կբարձրանա վերև' },
      color: { label: 'Գույն · 7 օր', description: 'Ընդգծված շրջանակ որոնման մեջ' },
      facebook: { label: 'Facebook · 3 օր', description: 'Սոցիալական ընդգրկում · հրապարակվում է հերթով' },
    },
  },
  az: {
    boost: 'Önə çıxar',
    pick: 'Paket seçin',
    tiersHead: 'VIP · Müddət',
    dUnit: 'g',
    renew: 'Yenilə',
    renewHint: (d) => `Mövcud müddətə +${d} gün əlavə edir`,
    maxActive: 'Ən yüksək paket aktivdir',
    addonsHead: 'Əlavələr',
    close: 'Bağla',
    errCooldown: 'Yeniləmə 1 saatdan sonra mümkündür',
    errGeneric: 'Xəta',
    errNetwork: 'Şəbəkə xətası',
    tierDesc: {
      vip: 'Standart elanların önündə · VIP nişanı',
      super_vip: 'VIP+ karusel · VIP elanların önündə',
      diamond: 'Bütün siyahıların zirvəsində · baş slayder',
    },
    addons: {
      turbo_7: { label: 'Turbo · 7 gün', description: 'SUPER VIP + rəng + təcili + yuxarı qaldırma' },
      story: { label: 'Story · 1 gün', description: 'Ana səhifədə Stories zolağı · 3₾' },
      sticker_urgent: { label: 'Təcili · 1 gün', description: 'Kartda narıncı stiker' },
      sticker_price_drop: { label: 'Qiymət endirildi · 7 gün', description: 'Qiymət endirimi nişanı' },
      refresh_once: { label: 'Yeniləmə', description: 'Elan yenidən ən yuxarı qalxacaq' },
      color: { label: 'Rəng · 7 gün', description: 'Axtarışda vurğulanmış çərçivə' },
      facebook: { label: 'Facebook · 3 gün', description: 'Sosial əhatə · növbə ilə dərc olunur' },
    },
  },
  uk: {
    boost: 'Просування',
    pick: 'Оберіть пакет',
    tiersHead: 'VIP · Тривалість',
    dUnit: 'д',
    renew: 'Продовжити',
    renewHint: (d) => `Додає +${d} днів до поточного терміну`,
    maxActive: 'Найвищий пакет активний',
    addonsHead: 'Додатково',
    close: 'Закрити',
    errCooldown: 'Оновлення буде доступне через 1 годину',
    errGeneric: 'Помилка',
    errNetwork: 'Помилка мережі',
    tierDesc: {
      vip: 'Попереду звичайних оголошень · значок VIP',
      super_vip: 'VIP+ карусель · попереду VIP-оголошень',
      diamond: 'Вершина всіх списків · слайдер на головній',
    },
    addons: {
      turbo_7: { label: 'Турбо · 7 днів', description: 'SUPER VIP + колір + терміново + підйом' },
      story: { label: 'Сторі · 1 день', description: 'Стрічка Stories на головній · 3₾' },
      sticker_urgent: { label: 'Терміново · 1 день', description: 'Помаранчева наліпка на картці' },
      sticker_price_drop: { label: 'Ціна знижена · 7 днів', description: 'Значок зниження ціни' },
      refresh_once: { label: 'Оновлення', description: 'Оголошення знову підніметься вгору' },
      color: { label: 'Колір · 7 днів', description: 'Виділена рамка в пошуку' },
      facebook: { label: 'Facebook · 3 дні', description: 'Соціальне охоплення · публікація за чергою' },
    },
  },
}

export function getPaymentsStrings(lang: Lang): PaymentsStrings {
  return STRINGS[lang]
}
