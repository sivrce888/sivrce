'use client'

/**
 * Market page i18n — co-located per HARD RULES (shared dicts are read-only).
 * All 10 locales complete (ka/en/ru/tr/ar/de/he/hy/az/uk); unknown langs fall back to en.
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
  districtsSub: 'დალაგებულია განცხადებების რაოდენობით — აირჩიე უბან და ნახე აქტიური განცხადებები',
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

const tr: Record<MarketKey, string> = {
  eyebrow: 'Piyasa analizi',
  h1: 'Gürcistan’daki emlak fiyatları',
  sub: 'm² başına canlı ortalama fiyatlar, medyanlar ve talep — aktif ilanlardan doğrudan derlenir, her gün güncellenir.',
  updated: 'Güncellendi',
  avgM2: 'Ort. fiyat / m²',
  median: 'Medyan fiyat',
  active: 'Aktif ilan',
  newListings: 'Bu ay yeni',
  vsPrevMonth: 'geçen aya göre',
  districtsTitle: 'Semtlere göre fiyatlar',
  districtsSub: 'İlan sayısına göre sıralandı — canlı ilanlar için bir semt seçin',
  listingsShort: 'ilan',
  methodologyTitle: 'Nasıl hesaplıyoruz',
  methodology:
    'Fiyatlar, aktif sivrce ilanlarında m² başına USD olarak normalize edilir. Semt istatistikleri en az 3 ilan gerektirir; aylık değişim geçen ayın kayıtlı anlık görüntüsüyle karşılaştırılır.',
  ctaSearch: 'İlanlara göz at',
  ctaNeighborhoods: 'Semt rehberleri',
  emptyTitle: 'İstatistikler birikiyor',
  emptyBody:
    'Piyasa verileri yeterli sayıda doğrulanmış ilan yayımlandığında görünür. Sizinkini ekleyin — semtinizde ilk siz olun.',
  perM2: '/m²',
  breadcrumbHome: 'Ana sayfa',
}

const ar: Record<MarketKey, string> = {
  eyebrow: 'تحليلات السوق',
  h1: 'أسعار العقارات في جورجيا',
  sub: 'متوسطات الأسعار لكل m² والوسيطات والطلب — مجمعة مباشرة من الإعلانات النشطة، وتُحدَّث يوميًا.',
  updated: 'محدَّث',
  avgM2: 'متوسط السعر / m²',
  median: 'السعر الوسيط',
  active: 'الإعلانات النشطة',
  newListings: 'جديد هذا الشهر',
  vsPrevMonth: 'مقارنة بالشهر السابق',
  districtsTitle: 'الأسعار حسب الحي',
  districtsSub: 'مرتبة حسب عدد الإعلانات — اختر حيًا لعرض الإعلانات النشطة',
  listingsShort: 'إعلان',
  methodologyTitle: 'كيف نحسب',
  methodology:
    'تُوحَّد الأسعار بالدولار لكل m² عبر إعلانات sivrce النشطة. تتطلب إحصاءات الحي 3 إعلانات على الأقل؛ وتُقارن التغييرات الشهرية بلقطة الشهر الماضي.',
  ctaSearch: 'تصفح الإعلانات',
  ctaNeighborhoods: 'أدلة الأحياء',
  emptyTitle: 'تتراكم الإحصاءات',
  emptyBody:
    'تظهر إحصاءات السوق بعد نشر عدد كافٍ من الإعلانات الموثقة. أضف إعلانك وكن الأول في حيك.',
  perM2: '/m²',
  breadcrumbHome: 'الرئيسية',
}

const de: Record<MarketKey, string> = {
  eyebrow: 'Marktanalyse',
  h1: 'Immobilienpreise in Georgien',
  sub: 'Live-Durchschnittspreise pro m², Mediane und Nachfrage — direkt aus aktiven Inseraten aggregiert, täglich aktualisiert.',
  updated: 'Aktualisiert',
  avgM2: 'Ø-Preis / m²',
  median: 'Medianpreis',
  active: 'Aktive Inserate',
  newListings: 'Neu diesen Monat',
  vsPrevMonth: 'gegenüber Vormonat',
  districtsTitle: 'Preise nach Stadtteil',
  districtsSub: 'Nach Anzahl der Inserate sortiert — tippen Sie auf einen Stadtteil für Live-Inserate',
  listingsShort: 'Inserate',
  methodologyTitle: 'So rechnen wir',
  methodology:
    'Preise werden über aktive sivrce-Inserate in USD pro m² normalisiert. Stadtteil-Statistiken benötigen mindestens 3 Inserate; der Monatsergleich nutzt den gespeicherten Snapshot des Vormonats.',
  ctaSearch: 'Inserate ansehen',
  ctaNeighborhoods: 'Stadtteilführer',
  emptyTitle: 'Statistiken sammeln sich',
  emptyBody:
    'Marktdaten erscheinen, sobald genügend verifizierte Inserate veröffentlicht sind. Fügen Sie Ihres hinzu — seien Sie der Erste in Ihrem Stadtteil.',
  perM2: '/m²',
  breadcrumbHome: 'Start',
}

const he: Record<MarketKey, string> = {
  eyebrow: 'ניתוח שוק',
  h1: 'מחירי נדל״ן בגאורגיה',
  sub: 'מחירים ממוצעים חיים ל-m², חציונים וביקוש — נאספים ישירות ממודעות פעילות, מתעדכן מדי יום.',
  updated: 'עודכן',
  avgM2: 'מחיר ממוצע / m²',
  median: 'מחיר חציוני',
  active: 'מודעות פעילות',
  newListings: 'חדש החודש',
  vsPrevMonth: 'מול החודש הקודם',
  districtsTitle: 'מחירים לפי שכונה',
  districtsSub: 'ממוין לפי מספר מודעות — הקישו על שכונה לצפייה במודעות פעילות',
  listingsShort: 'מודעות',
  methodologyTitle: 'איך אנחנו מחשבים',
  methodology:
    'המחירים מנורמלים לדולר ל-m² על פני מודעות sivrce פעילות. נתוני שכונה דורשים לפחות 3 מודעות; השינוי החודשי מושווה לתמונת המצב של החודש שעבר.',
  ctaSearch: 'עיינו במודעות',
  ctaNeighborhoods: 'מדריכי שכונות',
  emptyTitle: 'הנתונים נאספים',
  emptyBody:
    'נתוני השוק יופיעו לאחר פרסום מספיק מודעות מאומתות. הוסיפו שלכם — היו הראשונים בשכונה שלכם.',
  perM2: '/m²',
  breadcrumbHome: 'ראשי',
}

const hy: Record<MarketKey, string> = {
  eyebrow: 'Շուկայի վերլուծություն',
  h1: 'Անշարժ գույքի գներ Վրաստանում',
  sub: 'Միջին գներ m²-ի համար, մեդիաններ և պահանջարկ — ուղղակիորեն ակտիվ հայտարարություններից, թարմացվում է ամեն օր։',
  updated: 'Թարմացված',
  avgM2: 'Միջին գին / m²',
  median: 'Մեդիան գին',
  active: 'Ակտիվ հայտարարություններ',
  newListings: 'Նոր այս ամիս',
  vsPrevMonth: 'նախորդ ամսվա համեմատ',
  districtsTitle: 'Գները ըստ թաղամասի',
  districtsSub: 'Դասավորված ըստ հայտարարությունների քանակի — ընտրեք թաղամասը ակտիվ հայտարարությունները տեսնելու համար',
  listingsShort: 'հայտարարություն',
  methodologyTitle: 'Ինչպես ենք հաշվում',
  methodology:
    'Գները նորմալացվում են դոլարով՝ m²-ի համար՝ ակտիվ sivrce հայտարարությունների հիման վրա։ Թաղամասի վիճակագրության համար անհրաժեշտ է առնվազն 3 հայտարարություն, իսկ ամսական փոփոխությունը համեմատվում է նախորդ ամսվա պահված տվյալների հետ։',
  ctaSearch: 'Դիտել հայտարարությունները',
  ctaNeighborhoods: 'Թաղամասերի ուղեցույցներ',
  emptyTitle: 'Վիճակագրությունը կուտակվում է',
  emptyBody:
    'Շուկայի ցուցանիշները կհայտնվեն բավարար թվով ստուգված հայտարարություններից հետո։ Ավելացրեք ձերը — եղեք առաջինը ձեր թաղամասում։',
  perM2: '/m²',
  breadcrumbHome: 'Գլխավոր',
}

const az: Record<MarketKey, string> = {
  eyebrow: 'Bazar analitikası',
  h1: 'Gürcüstanda daşınmaz mülk qiymətləri',
  sub: 'm² üzrə canlı orta qiymətlər, medianlar və tələb — aktiv elanlardan birbaşa toplanır, hər gün yenilənir.',
  updated: 'Yeniləndi',
  avgM2: 'Ort. qiymət / m²',
  median: 'Median qiymət',
  active: 'Aktiv elanlar',
  newListings: 'Bu ay yeni',
  vsPrevMonth: 'əvvəlki aya görə',
  districtsTitle: 'Məhəllələr üzrə qiymətlər',
  districtsSub: 'Elan sayına görə sıralanıb — canlı elanlar üçün məhəllə seçin',
  listingsShort: 'elan',
  methodologyTitle: 'Necə hesablayırıq',
  methodology:
    'Qiymətlər aktiv sivrce elanları üzrə m² başına USD ilə normallaşdırılır. Məhəllə statistikası üçün ən azı 3 elan lazımdır; aylıq dəyişim keçən ayın saxlanmış məlumatları ilə müqayisə olunur.',
  ctaSearch: 'Elanlara bax',
  ctaNeighborhoods: 'Məhəllə bələdçiləri',
  emptyTitle: 'Statistika toplanır',
  emptyBody:
    'Bazar göstəriciləri kifayət qədər təsdiqlənmiş elan dərc olunduqdan sonra görünəcək. Öz elanınızı əlavə edin — məhəllənizdə birinci siz olun.',
  perM2: '/m²',
  breadcrumbHome: 'Ana səhifə',
}

const uk: Record<MarketKey, string> = {
  eyebrow: 'Аналітика ринку',
  h1: 'Ціни на нерухомість у Грузії',
  sub: 'Середні ціни за м², медіани та попит — безпосередньо з активних оголошень, оновлюється щодня.',
  updated: 'Оновлено',
  avgM2: 'Сер. ціна / м²',
  median: 'Медіанна ціна',
  active: 'Активні оголошення',
  newListings: 'Нові за місяць',
  vsPrevMonth: 'до попереднього місяця',
  districtsTitle: 'Ціни за районами',
  districtsSub: 'Відсортовано за кількістю оголошень — оберіть район, щоб побачити активні оголошення',
  listingsShort: 'оголошень',
  methodologyTitle: 'Як ми рахуємо',
  methodology:
    'Ціни нормалізовано в USD за м² за активними оголошеннями sivrce. Статистика району — від 3 оголошень; зміна за місяць порівнюється зі знімком минулого місяця.',
  ctaSearch: 'Переглянути оголошення',
  ctaNeighborhoods: 'Гіди районами',
  emptyTitle: 'Статистика накопичується',
  emptyBody:
    'Ринкові показники з’являться після достатньої кількості перевірених оголошень. Додайте своє — будьте першим у своєму районі.',
  perM2: '/м²',
  breadcrumbHome: 'Головна',
}

const DICTS: Record<string, Record<MarketKey, string>> = { ka, en, ru, tr, ar, de, he, hy, az, uk }

/** Market strings for the active language (falls back to en for unknown langs). */
export function useMarket(): Record<MarketKey, string> {
  const { lang } = useI18n()
  return DICTS[lang] ?? en
}
