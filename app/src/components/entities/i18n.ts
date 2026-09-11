'use client'

/**
 * Co-located i18n for entity pages (developers / agents / projects).
 * Shared dicts in src/lib/i18n are untouched; all 10 locales defined here.
 * pick() and the city map still fall back to en — the underlying data only
 * has ka/en/ru.
 */

import { useI18n } from '@/lib/i18n/context'
import type { Lang } from '@/lib/i18n/context'
import type { LocalName, LocalText } from '@/data/professionals'

const ka = {
  developer: 'დეველოპერი',
  agent: 'აგენტი',
  agency: 'სააგენტო',
  verified: 'ვერიფიცირებული',
  call: 'დარეკვა',
  yearsActive: 'წელი ბაზარზე',
  projectsDone: 'დასრულებული პროექტი',
  unitsDelivered: 'ჩაბარებული ბინა',
  dealsClosed: 'დახურული გარიგება',
  activeListings: 'აქტიური განცხადება',
  listingsShort: 'განცხადება',
  listingsShortOne: 'განცხადება',
  reviewsCount: 'შეფასება',
  viewProfile: 'პროფილის ნახვა',
  listingsByEntity: 'განცხადებები',
  projectsByDeveloper: 'პროექტები',
  about: 'შესახებ',
  contactEntity: 'კონტაქტი',
  languages: 'ენები',
  teamSize: 'გუნდი',
  teamMembers: 'გუნდის აგენტები',
  responseRate: 'პასუხის მაჩვენებელი',
  avgDealDays: 'საშ. დღე გარიგებამდე',
} as const

export type EntitiesKey = keyof typeof ka

const en: Record<EntitiesKey, string> = {
  developer: 'Developer',
  agent: 'Agent',
  agency: 'Agency',
  verified: 'Verified',
  call: 'Call',
  yearsActive: 'Years on market',
  projectsDone: 'Completed projects',
  unitsDelivered: 'Units delivered',
  dealsClosed: 'Deals closed',
  activeListings: 'Active listings',
  listingsShort: 'listings',
  listingsShortOne: 'listing',
  reviewsCount: 'reviews',
  viewProfile: 'View profile',
  listingsByEntity: 'Listings',
  projectsByDeveloper: 'Projects',
  about: 'About',
  contactEntity: 'Get in touch',
  languages: 'Languages',
  teamSize: 'Team',
  teamMembers: 'Team agents',
  responseRate: 'Response rate',
  avgDealDays: 'Avg. days to deal',
}

const ru: Record<EntitiesKey, string> = {
  developer: 'Девелопер',
  agent: 'Агент',
  agency: 'Агентство',
  verified: 'Проверен',
  call: 'Позвонить',
  yearsActive: 'Лет на рынке',
  projectsDone: 'Завершённых проектов',
  unitsDelivered: 'Сданных квартир',
  dealsClosed: 'Закрытых сделок',
  activeListings: 'Активных объявлений',
  listingsShort: 'объявлений',
  listingsShortOne: 'объявление',
  reviewsCount: 'отзывов',
  viewProfile: 'Смотреть профиль',
  listingsByEntity: 'Объявления',
  projectsByDeveloper: 'Проекты',
  about: 'О компании',
  contactEntity: 'Связаться',
  languages: 'Языки',
  teamSize: 'Команда',
  teamMembers: 'Агенты команды',
  responseRate: 'Показатель ответов',
  avgDealDays: 'Ср. дней до сделки',
}

const tr: Record<EntitiesKey, string> = {
  developer: 'Geliştirici',
  agent: 'Danışman',
  agency: 'Acente',
  verified: 'Doğrulanmış',
  call: 'Ara',
  yearsActive: 'Sektörde geçen yıl',
  projectsDone: 'Tamamlanan proje',
  unitsDelivered: 'Teslim edilen daire',
  dealsClosed: 'Kapanan anlaşma',
  activeListings: 'Aktif ilan',
  listingsShort: 'ilan',
  listingsShortOne: 'ilan',
  reviewsCount: 'değerlendirme',
  viewProfile: 'Profili görüntüle',
  listingsByEntity: 'İlanlar',
  projectsByDeveloper: 'Projeler',
  about: 'Hakkında',
  contactEntity: 'İletişime geç',
  languages: 'Diller',
  teamSize: 'Ekip',
  teamMembers: 'Ekip danışmanları',
  responseRate: 'Yanıt oranı',
  avgDealDays: 'Ort. anlaşma süresi (gün)',
}

const ar: Record<EntitiesKey, string> = {
  developer: 'مطوّر',
  agent: 'وكيل',
  agency: 'وكالة',
  verified: 'موثّق',
  call: 'اتصل',
  yearsActive: 'سنوات في السوق',
  projectsDone: 'مشاريع مكتملة',
  unitsDelivered: 'وحدات مُسلَّمة',
  dealsClosed: 'صفقات مُنجزة',
  activeListings: 'إعلانات نشطة',
  listingsShort: 'إعلان',
  listingsShortOne: 'إعلان',
  reviewsCount: 'مراجعة',
  viewProfile: 'عرض الملف',
  listingsByEntity: 'الإعلانات',
  projectsByDeveloper: 'المشاريع',
  about: 'نبذة',
  contactEntity: 'تواصل',
  languages: 'اللغات',
  teamSize: 'الفريق',
  teamMembers: 'وكلاء الفريق',
  responseRate: 'معدل الرد',
  avgDealDays: 'متوسط أيام الصفقة',
}

const de: Record<EntitiesKey, string> = {
  developer: 'Bauträger',
  agent: 'Makler',
  agency: 'Agentur',
  verified: 'Verifiziert',
  call: 'Anrufen',
  yearsActive: 'Jahre am Markt',
  projectsDone: 'Abgeschlossene Projekte',
  unitsDelivered: 'Übergebene Einheiten',
  dealsClosed: 'Abgeschlossene Deals',
  activeListings: 'Aktive Inserate',
  listingsShort: 'Inserate',
  listingsShortOne: 'Inserat',
  reviewsCount: 'Bewertungen',
  viewProfile: 'Profil ansehen',
  listingsByEntity: 'Inserate',
  projectsByDeveloper: 'Projekte',
  about: 'Über',
  contactEntity: 'Kontakt aufnehmen',
  languages: 'Sprachen',
  teamSize: 'Team',
  teamMembers: 'Team-Makler',
  responseRate: 'Antwortquote',
  avgDealDays: 'Ø Tage bis Abschluss',
}

const he: Record<EntitiesKey, string> = {
  developer: 'יזם',
  agent: 'סוכן',
  agency: 'סוכנות',
  verified: 'מאומת',
  call: 'התקשרו',
  yearsActive: 'שנים בשוק',
  projectsDone: 'פרויקטים שהושלמו',
  unitsDelivered: 'יחידות שנמסרו',
  dealsClosed: 'עסקאות שנסגרו',
  activeListings: 'מודעות פעילות',
  listingsShort: 'מודעות',
  listingsShortOne: 'מודעה',
  reviewsCount: 'ביקורות',
  viewProfile: 'צפו בפרופיל',
  listingsByEntity: 'מודעות',
  projectsByDeveloper: 'פרויקטים',
  about: 'אודות',
  contactEntity: 'צרו קשר',
  languages: 'שפות',
  teamSize: 'צוות',
  teamMembers: 'סוכני הצוות',
  responseRate: 'אחוז מענה',
  avgDealDays: 'ממוצע ימים לעסקה',
}

const hy: Record<EntitiesKey, string> = {
  developer: 'Դեվելոպեր',
  agent: 'Գործակալ',
  agency: 'Գործակալություն',
  verified: 'Հաստատված',
  call: 'Զանգել',
  yearsActive: 'Տարի շուկայում',
  projectsDone: 'Ավարտված նախագծեր',
  unitsDelivered: 'Հանձնված բնակարան',
  dealsClosed: 'Կնքված գործարքներ',
  activeListings: 'Ակտիվ հայտարարություններ',
  listingsShort: 'հայտարարություն',
  listingsShortOne: 'հայտարարություն',
  reviewsCount: 'կարծիք',
  viewProfile: 'Դիտել պրոֆիլը',
  listingsByEntity: 'Հայտարարություններ',
  projectsByDeveloper: 'Նախագծեր',
  about: 'Մասին',
  contactEntity: 'Կապվել',
  languages: 'Լեզուներ',
  teamSize: 'Թիմ',
  teamMembers: 'Թիմի գործակալներ',
  responseRate: 'Պատասխանելու մակարդակ',
  avgDealDays: 'Միջ. օր գործարքից առաջ',
}

const az: Record<EntitiesKey, string> = {
  developer: 'İnşaatçı',
  agent: 'Agent',
  agency: 'Agentlik',
  verified: 'Təsdiqlənib',
  call: 'Zəng edin',
  yearsActive: 'Bazarda il',
  projectsDone: 'Tamamlanmış layihələr',
  unitsDelivered: 'Təhvil verilən mənzil',
  dealsClosed: 'Bağlı sövdələşmələr',
  activeListings: 'Aktiv elanlar',
  listingsShort: 'elan',
  listingsShortOne: 'elan',
  reviewsCount: 'rəy',
  viewProfile: 'Profila bax',
  listingsByEntity: 'Elanlar',
  projectsByDeveloper: 'Layihələr',
  about: 'Haqqında',
  contactEntity: 'Əlaqə saxlayın',
  languages: 'Dillər',
  teamSize: 'Komanda',
  teamMembers: 'Komanda agentləri',
  responseRate: 'Cavab göstəricisi',
  avgDealDays: 'Ort. sövdələşmə müddəti (gün)',
}

const uk: Record<EntitiesKey, string> = {
  developer: 'Забудовник',
  agent: 'Агент',
  agency: 'Агентство',
  verified: 'Перевірено',
  call: 'Подзвонити',
  yearsActive: 'Років на ринку',
  projectsDone: 'Завершених проєктів',
  unitsDelivered: 'Зданих квартир',
  dealsClosed: 'Закритих угод',
  activeListings: 'Активних оголошень',
  listingsShort: 'оголошень',
  listingsShortOne: 'оголошення',
  reviewsCount: 'відгуків',
  viewProfile: 'Переглянути профіль',
  listingsByEntity: 'Оголошення',
  projectsByDeveloper: 'Проєкти',
  about: 'Про компанію',
  contactEntity: 'Зв’язатися',
  languages: 'Мови',
  teamSize: 'Команда',
  teamMembers: 'Агенти команди',
  responseRate: 'Показник відповідей',
  avgDealDays: 'Сер. днів до угоди',
}

const DICTS: Record<string, Record<EntitiesKey, string>> = { ka, en, ru, tr, ar, de, he, hy, az, uk }

export function entitiesDict(lang: Lang): Record<EntitiesKey, string> {
  return DICTS[lang] ?? en
}

export function useEntities() {
  const { lang } = useI18n()
  return { lang, d: entitiesDict(lang) }
}

/** Pick a localized name/text; non-ka/en/ru languages fall back to en. */
export function pick(text: LocalName | LocalText, lang: Lang): string {
  if (lang === 'ka') return text.ka
  if (lang === 'ru') return text.ru
  return text.en
}

const CITY: Record<string, { en: string; ru: string }> = {
  'თბილისი': { en: 'Tbilisi', ru: 'Тбилиси' },
  'ბათუმი': { en: 'Batumi', ru: 'Батуми' },
}

/** Listing.city values are stored in ka; localize for display. */
export function localizeCity(kaCity: string, lang: Lang): string {
  if (lang === 'ka') return kaCity
  return CITY[kaCity]?.[lang === 'ru' ? 'ru' : 'en'] ?? kaCity
}
