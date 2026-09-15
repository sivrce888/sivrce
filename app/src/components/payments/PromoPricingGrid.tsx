"use client"

import { useState } from "react"
import { Check, Flame, Crown, type LucideIcon } from "lucide-react"
import LocalizedLink from "@/components/LocalizedLink"
import { Reveal } from "@/components/Reveal"
import { BRAND } from "@/lib/brand"
import {
  ADDON_TETRI,
  DEFAULT_PROMO_DAYS,
  PRODUCT_TO_TIER,
  PROMO_DAY_OPTIONS,
  PROMO_INTENT_KEY,
  dailyRateTetri,
  formatGel,
  savingsPct,
  totalTetri,
  type PromoProduct,
} from "@/lib/promo-pricing"
import type { Lang } from "@/lib/i18n/core"
import { ruPlural } from "@/lib/i18n/core"

type GridLang = Lang

/** день / дня / дней */
const ruDays = (d: number) => ruPlural(d, "день", "дня", "дней")

/** день / дні / днів */
const ukDays = (d: number) => ruPlural(d, "день", "дні", "днів")

/** Hebrew: 1 יום, 2 יומיים, 3+ ימים */
const heDays = (d: number) => (d === 1 ? "יום" : d === 2 ? "יומיים" : "ימים")

/** Arabic: 1 يوم, 2 يومان, 3–10 أيام, 11+ يومًا */
const arDays = (d: number) =>
  d === 1 ? "يوم" : d === 2 ? "يومان" : d >= 3 && d <= 10 ? "أيام" : "يومًا"

interface TierCard {
  product: PromoProduct | "free"
  name: string
  features: string[]
  badge?: { style: string; icon: LucideIcon; label: string }
  recommended?: boolean
}

const BADGES: Partial<Record<PromoProduct, TierCard["badge"]>> = {
  vip: { style: BRAND.vipTiers.VIP.style, icon: Flame, label: "VIP" },
  vip_plus: { style: BRAND.vipTiers["VIP+"].style, icon: Flame, label: "VIP+" },
  super_vip: { style: BRAND.vipTiers["SUPER VIP"].style, icon: Crown, label: "SUPER VIP" },
}

type GridCopy = {
  pickDays: string
  dayOpt: (d: number, save: number) => string
  per: (d: number) => string
  perDay: string
  save: (p: number) => string
  recommended: string
  ctaPaid: (name: string, d: number) => string
  ctaFree: string
  footnote: string
  addonsHead: string
  addonsTail: string
  addonWords: { urgent: string; drop: string; story: string; refresh: string; color: string }
  freeName: string
  cards: Record<"vip" | "vip_plus" | "super_vip", { name?: string; features: string[] }>
}

const GRID: Record<GridLang, GridCopy> = {
  ka: {
    pickDays: "აირჩიეთ დღეების რაოდენობა",
    dayOpt: (d, save) => `${d} დღე${save ? ` · −${save}% SUPER VIP` : ""}`,
    per: (d) => `/ ${d} დღე`,
    perDay: "/დღე",
    save: (p) => ` · დაზოგე ${p}%`,
    recommended: "რეკომენდებული",
    ctaPaid: (n, d) => `განთავსება · ${d}დ ${n}`,
    ctaFree: "უფასოდ განთავსება",
    footnote:
      "მითითებული ფასი საბოლოოა. სთორი და სასწრაფოდ 24 საათით მოქმედებს. გამოქვეყნების შემდეგ აირჩიე ბუსტი იმავე ხანგრძლივობით.",
    addonsHead: "ტარიფები უძრავი ქონებისთვის. ",
    addonsTail: " · სხვა რუბრიკები — უფრო იაფი.",
    addonWords: { urgent: "სასწრაფოდ", drop: "ფასი↓", story: "სთორი", refresh: "განახლება", color: "ფერი" },
    freeName: "უფასო",
    cards: {
      vip: {
        features: [
          "სიაში სტანდარტულებზე წინ",
          "VIP ნიშანი განცხადებაზე",
          "კატეგორიის VIP ბლოკში",
          "2× მეტი ნახვა საშუალოდ",
        ],
      },
      vip_plus: {
        features: [
          "VIP-ის ყველა უპირატესობა",
          "სიაში VIP-ებზე წინ",
          "VIP+ კარუსელი მთავარ გვერდზე",
          "3× მეტი ნახვა საშუალოდ",
        ],
      },
      super_vip: {
        features: [
          "VIP+-ის ყველა უპირატესობა",
          "ტოპი ყველა განცხადებაზე",
          "SUPER VIP სლაიდერი მთავარზე",
          "5× მეტი ნახვა საშუალოდ",
        ],
      },
    },
  },
  en: {
    pickDays: "Choose duration",
    dayOpt: (d, save) => `${d} ${d === 1 ? "day" : "days"}${save ? ` · −${save}% SUPER VIP` : ""}`,
    per: (d) => `/ ${d} ${d === 1 ? "day" : "days"}`,
    perDay: "/day",
    save: (p) => ` · save ${p}%`,
    recommended: "Recommended",
    ctaPaid: (n, d) => `Post · ${d}d ${n}`,
    ctaFree: "Post for free",
    footnote:
      "Prices shown are final. Story and Urgent last 24 hours. After publishing, pick the boost with the same duration.",
    addonsHead: "Rates for residential property. ",
    addonsTail: " · Other categories — cheaper.",
    addonWords: { urgent: "Urgent", drop: "Price↓", story: "Story", refresh: "Refresh", color: "Color" },
    freeName: "Free",
    cards: {
      vip: {
        features: [
          "Ahead of standard listings",
          "VIP badge on your listing",
          "Featured in the category VIP block",
          "2× more views on average",
        ],
      },
      vip_plus: {
        features: [
          "Everything in VIP",
          "Ahead of VIP listings",
          "VIP+ carousel on the homepage",
          "3× more views on average",
        ],
      },
      super_vip: {
        features: [
          "Everything in VIP+",
          "Top position on every list",
          "SUPER VIP slider on the homepage",
          "5× more views on average",
        ],
      },
    },
  },
  ru: {
    pickDays: "Выберите длительность",
    dayOpt: (d, save) => `${d} ${ruDays(d)}${save ? ` · −${save}% SUPER VIP` : ""}`,
    per: (d) => `/ ${d} ${ruDays(d)}`,
    perDay: "/день",
    save: (p) => ` · экономия ${p}%`,
    recommended: "Рекомендуем",
    ctaPaid: (n, d) => `Разместить · ${d}д ${n}`,
    ctaFree: "Разместить бесплатно",
    footnote:
      "Указанная цена итоговая. Стори и «Срочно» действуют 24 часа. После публикации выберите буст той же длительности.",
    addonsHead: "Тарифы для недвижимости. ",
    addonsTail: " · Другие рубрики — дешевле.",
    addonWords: { urgent: "Срочно", drop: "Цена↓", story: "Стори", refresh: "Обновление", color: "Цвет" },
    freeName: "Бесплатно",
    cards: {
      vip: {
        features: [
          "Выше обычных объявлений",
          "Значок VIP на объявлении",
          "В VIP-блоке категории",
          "В среднем 2× больше просмотров",
        ],
      },
      vip_plus: {
        features: [
          "Все преимущества VIP",
          "Выше VIP-объявлений",
          "VIP+ карусель на главной",
          "В среднем 3× больше просмотров",
        ],
      },
      super_vip: {
        features: [
          "Все преимущества VIP+",
          "Топ-позиция во всех списках",
          "SUPER VIP слайдер на главной",
          "В среднем 5× больше просмотров",
        ],
      },
    },
  },
  de: {
    pickDays: "Laufzeit wählen",
    dayOpt: (d, save) => `${d} ${d === 1 ? "Tag" : "Tage"}${save ? ` · −${save}% SUPER VIP` : ""}`,
    per: (d) => `/ ${d} ${d === 1 ? "Tag" : "Tage"}`,
    perDay: "/Tag",
    save: (p) => ` · ${p}% sparen`,
    recommended: "Empfohlen",
    ctaPaid: (n, d) => `Inserieren · ${d}T ${n}`,
    ctaFree: "Kostenlos inserieren",
    footnote:
      "Alle Preise sind Endpreise. Story und Dringend gelten 24 Stunden. Wählen Sie nach dem Inserieren den Boost mit derselben Laufzeit.",
    addonsHead: "Tarife für Immobilien. ",
    addonsTail: " · Andere Kategorien — günstiger.",
    addonWords: { urgent: "Dringend", drop: "Preis↓", story: "Story", refresh: "Aktualisieren", color: "Farbe" },
    freeName: "Kostenlos",
    cards: {
      vip: {
        features: [
          "Vor Standardanzeigen",
          "VIP-Badge auf Ihrem Inserat",
          "Im VIP-Block der Kategorie",
          "Im Schnitt 2× mehr Aufrufe",
        ],
      },
      vip_plus: {
        features: [
          "Alle Vorteile von VIP",
          "Vor VIP-Anzeigen",
          "VIP+ Karussell auf der Startseite",
          "Im Schnitt 3× mehr Aufrufe",
        ],
      },
      super_vip: {
        features: [
          "Alle Vorteile von VIP+",
          "Top-Position in jeder Liste",
          "SUPER VIP Slider auf der Startseite",
          "Im Schnitt 5× mehr Aufrufe",
        ],
      },
    },
  },
  tr: {
    pickDays: "Süre seçin",
    dayOpt: (d, save) => `${d} gün${save ? ` · −${save}% SUPER VIP` : ""}`,
    per: (d) => `/ ${d} gün`,
    perDay: "/gün",
    save: (p) => ` · %${p} tasarruf`,
    recommended: "Önerilen",
    ctaPaid: (n, d) => `Yayınla · ${d}g ${n}`,
    ctaFree: "Ücretsiz yayınla",
    footnote:
      "Gösterilen fiyatlar nettir. Hikâye ve Acil 24 saat geçerlidir. Yayından sonra aynı süreli yükseltmeyi seçin.",
    addonsHead: "Konut için tarifeler. ",
    addonsTail: " · Diğer kategoriler — daha uygun.",
    addonWords: { urgent: "Acil", drop: "Fiyat↓", story: "Hikâye", refresh: "Yenile", color: "Renk" },
    freeName: "Ücretsiz",
    cards: {
      vip: {
        features: [
          "Standart ilanların önünde",
          "İlanınızda VIP rozeti",
          "Kategorinin VIP bloğunda",
          "Ortalama 2× daha fazla görüntüleme",
        ],
      },
      vip_plus: {
        features: [
          "VIP'nin tüm avantajları",
          "VIP ilanların önünde",
          "Ana sayfada VIP+ karusel",
          "Ortalama 3× daha fazla görüntüleme",
        ],
      },
      super_vip: {
        features: [
          "VIP+'nin tüm avantajları",
          "Her listede zirve",
          "Ana sayfada SUPER VIP slider",
          "Ortalama 5× daha fazla görüntüleme",
        ],
      },
    },
  },
  ar: {
    pickDays: "اختر المدة",
    dayOpt: (d, save) => `${d} ${arDays(d)}${save ? ` · −${save}% SUPER VIP` : ""}`,
    per: (d) => `/ ${d} ${arDays(d)}`,
    perDay: "/يوم",
    save: (p) => ` · وفّر ${p}%`,
    recommended: "موصى به",
    ctaPaid: (n, d) => `انشر · ${d}ي ${n}`,
    ctaFree: "انشر مجانًا",
    footnote:
      "الأسعار المعروضة نهائية. ستوري وعاجل صالحان 24 ساعة. بعد النشر اختر التمييز بالمدة نفسها.",
    addonsHead: "أسعار العقارات السكنية. ",
    addonsTail: " · الفئات الأخرى — أرخص.",
    addonWords: { urgent: "عاجل", drop: "السعر↓", story: "ستوري", refresh: "تحديث", color: "لون" },
    freeName: "مجاني",
    cards: {
      vip: {
        features: [
          "قبل الإعلانات العادية",
          "شارة VIP على إعلانك",
          "ضمن بلوك VIP في الفئة",
          "ضعف المشاهدات في المتوسط",
        ],
      },
      vip_plus: {
        features: [
          "كل مزايا VIP",
          "قبل إعلانات VIP",
          "دائرة VIP+ في الصفحة الرئيسية",
          "3 أضعاف المشاهدات في المتوسط",
        ],
      },
      super_vip: {
        features: [
          "كل مزايا VIP+",
          "المركز الأول في كل قائمة",
          "شريط SUPER VIP في الرئيسية",
          "5 أضعاف المشاهدات في المتوسط",
        ],
      },
    },
  },
  he: {
    pickDays: "בחרו משך",
    dayOpt: (d, save) => `${d} ${heDays(d)}${save ? ` · −${save}% SUPER VIP` : ""}`,
    per: (d) => `/ ${d} ${heDays(d)}`,
    perDay: "/יום",
    save: (p) => ` · חוסך ${p}%`,
    recommended: "מומלץ",
    ctaPaid: (n, d) => `פרסום · ${d}י ${n}`,
    ctaFree: "פרסום בחינם",
    footnote:
      "המחירים המוצגים סופיים. סטורי ודחוף תקפים 24 שעות. אחרי הפרסום בחרו קידום באותו משך.",
    addonsHead: "תעריפים לנדל״ן למגורים. ",
    addonsTail: " · קטגוריות אחרות — זול יותר.",
    addonWords: { urgent: "דחוף", drop: "מחיר↓", story: "סטורי", refresh: "רענון", color: "צבע" },
    freeName: "חינם",
    cards: {
      vip: {
        features: [
          "לפני המודעות הרגילות",
          "תג VIP על המודעה",
          "בבלוק ה-VIP של הקטגוריה",
          "פי 2 צפיות בממוצע",
        ],
      },
      vip_plus: {
        features: [
          "כל יתרונות ה-VIP",
          "לפני מודעות VIP",
          "קרוסלת VIP+ בדף הבית",
          "פי 3 צפיות בממוצע",
        ],
      },
      super_vip: {
        features: [
          "כל יתרונות ה-VIP+",
          "ראש כל רשימה",
          "סליידר SUPER VIP בדף הבית",
          "פי 5 צפיות בממוצע",
        ],
      },
    },
  },
  hy: {
    pickDays: "Ընտրեք տևողությունը",
    dayOpt: (d, save) => `${d} օր${save ? ` · −${save}% SUPER VIP` : ""}`,
    per: (d) => `/ ${d} օր`,
    perDay: "/օր",
    save: (p) => ` · խնայեք ${p}%`,
    recommended: "Խորհուրդ ենք տալիս",
    ctaPaid: (n, d) => `Հրապարակել · ${d}օ ${n}`,
    ctaFree: "Հրապարակել անվճար",
    footnote:
      "Նշված գները վերջնական են։ Սթորին և հրատապը գործում են 24 ժամ։ Հրապարակումից հետո ընտրեք նույն տևողությամբ առաջմղում։",
    addonsHead: "Բնակելի անշարժ գույքի սակագներ։ ",
    addonsTail: " · Այլ կատեգորիաներ — ավելի էժան։",
    addonWords: { urgent: "Հրատապ", drop: "Գին↓", story: "Սթորի", refresh: "Թարմացում", color: "Գույն" },
    freeName: "Անվճար",
    cards: {
      vip: {
        features: [
          "Սովորական հայտարարություններից առաջ",
          "VIP նշան ձեր հայտարարության վրա",
          "Կատեգորիայի VIP բլոկում",
          "Միջինում 2× ավելի շատ դիտում",
        ],
      },
      vip_plus: {
        features: [
          "VIP-ի բոլոր առավելությունները",
          "VIP հայտարարություններից առաջ",
          "VIP+ կարուսել գլխավոր էջում",
          "Միջինում 3× ավելի շատ դիտում",
        ],
      },
      super_vip: {
        features: [
          "VIP+-ի բոլոր առավելությունները",
          "Բոլոր ցանկերի գագաթին",
          "SUPER VIP սլայդեր գլխավոր էջում",
          "Միջինում 5× ավելի շատ դիտում",
        ],
      },
    },
  },
  az: {
    pickDays: "Müddət seçin",
    dayOpt: (d, save) => `${d} gün${save ? ` · −${save}% SUPER VIP` : ""}`,
    per: (d) => `/ ${d} gün`,
    perDay: "/gün",
    save: (p) => ` · ${p}% qənaət`,
    recommended: "Tövsiyə olunur",
    ctaPaid: (n, d) => `Yerləşdir · ${d}g ${n}`,
    ctaFree: "Pulsuz yerləşdir",
    footnote:
      "Göstərilən qiymətlər yekundur. Story və Təcili 24 saat etibarlıdır. Dərcdən sonra eyni müddətli yüksəltməni seçin.",
    addonsHead: "Yaşayış əmlakı üçün tariflər. ",
    addonsTail: " · Digər kateqoriyalar — daha ucuz.",
    addonWords: { urgent: "Təcili", drop: "Qiymət↓", story: "Story", refresh: "Yeniləmə", color: "Rəng" },
    freeName: "Pulsuz",
    cards: {
      vip: {
        features: [
          "Standart elanların önündə",
          "Elanınızda VIP nişanı",
          "Kateqoriyanın VIP blokunda",
          "Ortalama 2× çox baxış",
        ],
      },
      vip_plus: {
        features: [
          "VIP-in bütün üstünlükləri",
          "VIP elanların önündə",
          "Ana səhifədə VIP+ karusel",
          "Ortalama 3× çox baxış",
        ],
      },
      super_vip: {
        features: [
          "VIP+-in bütün üstünlükləri",
          "Bütün siyahıların zirvəsində",
          "Ana səhifədə SUPER VIP slayder",
          "Ortalama 5× çox baxış",
        ],
      },
    },
  },
  uk: {
    pickDays: "Оберіть тривалість",
    dayOpt: (d, save) => `${d} ${ukDays(d)}${save ? ` · −${save}% SUPER VIP` : ""}`,
    per: (d) => `/ ${d} ${ukDays(d)}`,
    perDay: "/день",
    save: (p) => ` · економія ${p}%`,
    recommended: "Рекомендуємо",
    ctaPaid: (n, d) => `Розмістити · ${d}д ${n}`,
    ctaFree: "Розмістити безкоштовно",
    footnote:
      "Указана ціна остаточна. Сторі та «Терміново» діють 24 години. Після публікації оберіть просування тієї ж тривалості.",
    addonsHead: "Тарифи для нерухомості. ",
    addonsTail: " · Інші рубрики — дешевше.",
    addonWords: { urgent: "Терміново", drop: "Ціна↓", story: "Сторі", refresh: "Оновлення", color: "Колір" },
    freeName: "Безкоштовно",
    cards: {
      vip: {
        features: [
          "Попереду звичайних оголошень",
          "Значок VIP на оголошенні",
          "У VIP-блоці категорії",
          "У середньому 2× більше переглядів",
        ],
      },
      vip_plus: {
        features: [
          "Усі переваги VIP",
          "Попереду VIP-оголошень",
          "VIP+ карусель на головній",
          "У середньому 3× більше переглядів",
        ],
      },
      super_vip: {
        features: [
          "Усі переваги VIP+",
          "Топ-позиція в усіх списках",
          "SUPER VIP слайдер на головній",
          "У середньому 5× більше переглядів",
        ],
      },
    },
  },
}

const FREE_FEATURES: Record<GridLang, string[]> = {
  ka: [
    "სტანდარტული განთავსება",
    "აქტიურია 30 დღე",
    "ძიების შედეგებში გამოჩენა",
    "პირდაპირი შეტყობინებები",
  ],
  en: [
    "Standard placement",
    "Active for 30 days",
    "Appears in search results",
    "Direct messages",
  ],
  ru: [
    "Стандартное размещение",
    "Активно 30 дней",
    "Показ в результатах поиска",
    "Прямые сообщения",
  ],
  de: [
    "Standardplatzierung",
    "30 Tage aktiv",
    "Erscheint in den Suchergebnissen",
    "Direktnachrichten",
  ],
  tr: [
    "Standart yayın",
    "30 gün aktif",
    "Arama sonuçlarında görünür",
    "Direkt mesajlar",
  ],
  ar: [
    "نشر عادي",
    "فعّال 30 يومًا",
    "يظهر في نتائج البحث",
    "رسائل مباشرة",
  ],
  he: [
    "פרסום רגיל",
    "פעיל 30 יום",
    "מופיע בתוצאות החיפוש",
    "הודעות ישירות",
  ],
  hy: [
    "Ստանդարտ տեղադրում",
    "Ակտիվ է 30 օր",
    "Երևում է որոնման արդյունքներում",
    "Ուղիղ հաղորդագրություններ",
  ],
  az: [
    "Standart yerləşdirmə",
    "30 gün aktivdir",
    "Axtarış nəticələrində görünür",
    "Birbaşa mesajlar",
  ],
  uk: [
    "Стандартне розміщення",
    "Активне 30 днів",
    "Показ у результатах пошуку",
    "Прямі повідомлення",
  ],
}

export default function PromoPricingGrid({ lang = "ka" }: { lang?: Lang }) {
  // All 10 locales have native copy; unknown langs fall back to en — never ka.
  const gridLang: GridLang = GRID[lang] ? lang : "en"
  const t = GRID[gridLang]
  const [days, setDays] = useState<number>(DEFAULT_PROMO_DAYS)

  const cards: TierCard[] = [
    { product: "free", name: t.freeName, features: FREE_FEATURES[gridLang] },
    { product: "vip", name: "VIP", badge: BADGES.vip, features: t.cards.vip.features },
    {
      product: "vip_plus",
      name: "VIP+",
      recommended: true,
      badge: BADGES.vip_plus,
      features: t.cards.vip_plus.features,
    },
    { product: "super_vip", name: "SUPER VIP", badge: BADGES.super_vip, features: t.cards.super_vip.features },
  ]

  return (
    <div>
      <div className="mb-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <label htmlFor="promo-days" className="text-[13px] font-bold text-sv-ink/60">
          {t.pickDays}
        </label>
        <select
          id="promo-days"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-full border border-sv-ink/10 bg-sv-surface px-5 py-2.5 text-[14px] font-extrabold text-sv-ink shadow-card outline-none focus:border-sv-blue/40"
        >
          {PROMO_DAY_OPTIONS.map((d) => {
            const save = savingsPct("super_vip", "real_estate", d)
            return (
              <option key={d} value={d}>
                {t.dayOpt(d, save ?? 0)}
              </option>
            )
          })}
        </select>
      </div>
      <p className="mb-8 text-center text-[12px] font-semibold text-sv-ink/60">{t.footnote}</p>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((tier, i) => {
          const product = tier.product
          const paid = product !== "free"
          const rate = product !== "free" ? dailyRateTetri(product, "real_estate", days) : 0
          const total = product !== "free" ? totalTetri(product, "real_estate", days) : 0
          const save = product !== "free" ? savingsPct(product, "real_estate", days) : null
          const highlight = Boolean(tier.recommended)

          return (
            <Reveal key={tier.name} delay={i * 0.07}>
              <div
                className={`relative flex h-full flex-col rounded-card p-7 transition hover:-translate-y-1.5 ${
                  highlight
                    ? "bg-sv-navy shadow-soft ring-1 ring-sv-orange/30"
                    : "bg-sv-surface shadow-card ring-1 ring-sv-ink/5 hover:shadow-card-hover"
                }`}
              >
                {highlight && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-sv-orange px-4 py-1.5 text-xs font-bold text-sv-ink shadow-glow-orange">
                    {t.recommended}
                  </span>
                )}
                {tier.badge && (
                  <span
                    className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold ${tier.badge.style}`}
                  >
                    <tier.badge.icon className="h-3.5 w-3.5" />
                    {tier.badge.label}
                  </span>
                )}
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-4xl font-black tracking-[-0.02em] ${highlight ? "text-white" : "text-sv-ink"}`}
                    >
                      {paid && rate != null && total != null ? formatGel(total) : "0₾"}
                    </span>
                    {paid && (
                      <span className={`text-sm font-semibold ${highlight ? "text-white/60" : "text-sv-ink/60"}`}>
                        {t.per(days)}
                      </span>
                    )}
                  </div>
                  {paid && rate != null && (
                    <p className={`mt-1 text-[13px] font-semibold ${highlight ? "text-white/55" : "text-sv-ink/60"}`}>
                      {formatGel(rate)}{t.perDay}
                      {save ? (
                        <span className={highlight ? " text-sv-success" : " text-sv-blue"}>{t.save(save)}</span>
                      ) : null}
                    </p>
                  )}
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check
                        className={`mt-0.5 h-4 w-4 shrink-0 ${highlight ? "text-sv-success" : "text-sv-blue"}`}
                      />
                      <span
                        className={`text-[14px] font-medium ${highlight ? "text-white/75" : "text-sv-ink/65"}`}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
                <LocalizedLink
                  href="/add-listing"
                  onClick={() => {
                    if (product === "free") return
                    try {
                      sessionStorage.setItem(
                        PROMO_INTENT_KEY,
                        JSON.stringify({
                          tier: PRODUCT_TO_TIER[product],
                          days,
                        }),
                      )
                    } catch {
                      /* private mode */
                    }
                  }}
                  className={`mt-8 inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-bold transition hover:-translate-y-0.5 ${
                    highlight
                      ? "bg-sv-orange text-sv-ink shadow-glow-orange hover:shadow-glow-orange-lg"
                      : "bg-sv-ink text-white shadow-glow-navy hover:bg-sv-navy"
                  }`}
                >
                  {/* ponytail: publish free; days/tier intent → TierPurchaseButton after publish */}
                  {paid ? t.ctaPaid(tier.name, days) : t.ctaFree}
                </LocalizedLink>
              </div>
            </Reveal>
          )
        })}
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-[12px] font-medium text-sv-ink/60">
        {t.addonsHead}
        Turbo {formatGel(ADDON_TETRI.turbo_7)} / {formatGel(ADDON_TETRI.turbo_14)} /{" "}
        {formatGel(ADDON_TETRI.turbo_30)} · {t.addonWords.urgent}{" "}
        {formatGel(ADDON_TETRI.sticker_urgent)} · {t.addonWords.drop}{" "}
        {formatGel(ADDON_TETRI.sticker_price_drop)} · {t.addonWords.story}{" "}
        {formatGel(ADDON_TETRI.story)} · {t.addonWords.refresh}{" "}
        {formatGel(ADDON_TETRI.refresh_once)} · {t.addonWords.color} {formatGel(ADDON_TETRI.color)} ·
        Facebook {formatGel(ADDON_TETRI.facebook)}+{t.addonsTail}
      </p>
    </div>
  )
}
