/**
 * Real-estate services catalog — marketplace next to listings.
 * Hues reuse locked SERVICE_BRAND / CATEGORY_BRAND only (BRAND.md).
 */

import { CATEGORY_BRAND, SERVICE_BRAND, type CategoryBrand } from '@/lib/category-brand'

export type LocText = { ka: string; en: string; ru: string }

export const SERVICE_CATEGORY_IDS = [
  'renovation',
  'interior',
  'photography',
  'legal',
  'appraisal',
  'moving',
  'cleaning',
  'management',
  'inspection',
  'handyman',
  'climate',
  'security',
  'solar',
  'architecture',
] as const

export type ServiceCategoryId = (typeof SERVICE_CATEGORY_IDS)[number]

export type ServiceCategory = {
  id: ServiceCategoryId
  name: LocText
  blurb: LocText
  seo: LocText
  brand: CategoryBrand
}

export const SERVICE_CITIES = ['თბილისი', 'ბათუმი', 'ქუთაისი', 'რუსთავი'] as const

export const SERVICE_CATEGORIES: readonly ServiceCategory[] = [
  {
    id: 'renovation',
    name: { ka: 'რემონტი', en: 'Renovation', ru: 'Ремонт' },
    blurb: {
      ka: 'შავი / თეთრი / მწვანე კარკასი და გასაღების ჩაბარება',
      en: 'Black / white / green frame and turnkey finish',
      ru: 'Черновая / белая / зелёная отделка и под ключ',
    },
    seo: {
      ka: 'რემონტის კომპანიები თბილისში — ბიუჯეტი მ²-ზე და ვერიფიცირებული ბრიგადები',
      en: 'Renovation companies in Georgia — per-m² budget and verified crews',
      ru: 'Ремонтные компании в Грузии — бюджет за м² и проверенные бригады',
    },
    brand: SERVICE_BRAND.renovation,
  },
  {
    id: 'interior',
    name: { ka: 'ინტერიერი', en: 'Interior design', ru: 'Интерьер' },
    blurb: {
      ka: 'დიზაინ-პროექტი, 3D ვიზუალი, ავეჯი და მასალები',
      en: 'Design project, 3D visuals, furniture and materials',
      ru: 'Дизайн-проект, 3D, мебель и материалы',
    },
    seo: {
      ka: 'ინტერიერის დიზაინერები თბილისში და ბათუმში',
      en: 'Interior designers in Tbilisi and Batumi',
      ru: 'Дизайнеры интерьера в Тбилиси и Батуми',
    },
    brand: SERVICE_BRAND.renovation,
  },
  {
    id: 'photography',
    name: { ka: 'ფოტო და 3D', en: 'Photo & 3D', ru: 'Фото и 3D' },
    blurb: {
      ka: 'განცხადების ფოტო, Matterport და ვირტუალური ტური',
      en: 'Listing photography, Matterport and virtual tours',
      ru: 'Фото объявлений, Matterport и виртуальные туры',
    },
    seo: {
      ka: 'უძრავი ქონების ფოტოგრაფები და 3D ტური საქართველოში',
      en: 'Real-estate photographers and 3D tours in Georgia',
      ru: 'Фотографы недвижимости и 3D-туры в Грузии',
    },
    brand: SERVICE_BRAND.developers,
  },
  {
    id: 'legal',
    name: { ka: 'იურიდიული', en: 'Legal', ru: 'Юридические' },
    blurb: {
      ka: 'ნასყიდობა, იჯარა, ნოტარიუსი, საჯარო რეესტრი',
      en: 'Sale, lease, notary, public registry',
      ru: 'Купля-продажа, аренда, нотариус, реестр',
    },
    seo: {
      ka: 'უძრავი ქონების იურისტები და ნოტარიუსები საქართველოში',
      en: 'Real-estate lawyers and notaries in Georgia',
      ru: 'Юристы и нотариусы по недвижимости в Грузии',
    },
    brand: SERVICE_BRAND.agents,
  },
  {
    id: 'appraisal',
    name: { ka: 'შეფასება', en: 'Appraisal', ru: 'Оценка' },
    blurb: {
      ka: 'საბაზრო ღირებულება ბანკისა და ნასყიდობისთვის',
      en: 'Market value for banks and sale contracts',
      ru: 'Рыночная стоимость для банка и сделки',
    },
    seo: {
      ka: 'უძრავი ქონების შეფასება თბილისში — ბანკი და ნასყიდობა',
      en: 'Property appraisal in Tbilisi — banks and sales',
      ru: 'Оценка недвижимости в Тбилиси — банк и сделка',
    },
    brand: SERVICE_BRAND.mortgage,
  },
  {
    id: 'moving',
    name: { ka: 'გადატანა', en: 'Moving', ru: 'Переезд' },
    blurb: {
      ka: 'ბინის და ოფისის გადატანა, შეფუთვა, ლიფტი',
      en: 'Home and office moves, packing, lift',
      ru: 'Переезд квартиры и офиса, упаковка, лифт',
    },
    seo: {
      ka: 'ბინის გადატანა თბილისში და საქართველოში',
      en: 'Home moving in Tbilisi and Georgia',
      ru: 'Переезд квартир в Тбилиси и Грузии',
    },
    brand: CATEGORY_BRAND.land,
  },
  {
    id: 'cleaning',
    name: { ka: 'დასუფთავება', en: 'Cleaning', ru: 'Уборка' },
    blurb: {
      ka: 'რემონტის შემდეგ, ჩაბარება, დღიური ქირის როტაცია',
      en: 'Post-renovation, handover, daily-rental turnover',
      ru: 'После ремонта, сдача, оборот посуточной аренды',
    },
    seo: {
      ka: 'რემონტის შემდგომი დასუფთავება და ჩაბარება',
      en: 'Post-renovation and handover cleaning',
      ru: 'Уборка после ремонта и под сдачу',
    },
    brand: CATEGORY_BRAND.cottages,
  },
  {
    id: 'management',
    name: { ka: 'ქონების მართვა', en: 'Property management', ru: 'Управление' },
    blurb: {
      ka: 'ქირა, მოიჯარეები, კომუნალური, ინვესტორის ანგარიში',
      en: 'Rent, tenants, utilities, investor reporting',
      ru: 'Аренда, жильцы, коммуналка, отчёт инвестору',
    },
    seo: {
      ka: 'ქონების მართვა თბილისში — ქირა და ინვესტორები',
      en: 'Property management in Tbilisi — rentals and investors',
      ru: 'Управление недвижимостью в Тбилиси — аренда и инвесторы',
    },
    brand: SERVICE_BRAND.agents,
  },
  {
    id: 'inspection',
    name: { ka: 'ტექნიკური შემოწმება', en: 'Inspection', ru: 'Обследование' },
    blurb: {
      ka: 'ობიექტის ტექნიკური მდგომარეობა ყიდვამდე ან რემონტამდე',
      en: 'Technical condition before you buy or renovate',
      ru: 'Техническое состояние перед покупкой или ремонтом',
    },
    seo: {
      ka: 'ბინის ტექნიკური შემოწმება თბილისში — ინსპექცია ყიდვამდე',
      en: 'Home inspection in Georgia — pre-purchase surveys',
      ru: 'Технический осмотр квартиры в Тбилиси — перед покупкой',
    },
    brand: SERVICE_BRAND.agents,
  },
  {
    id: 'handyman',
    name: { ka: 'საყოფაცხოვრებო ოსტატი', en: 'Handyman', ru: 'Мастер на час' },
    blurb: {
      ka: 'პატარა შეკეთება, მონტაჟი, ტექნიკის ჩაყრა',
      en: 'Small repairs, mounting, appliance installs',
      ru: 'Мелкий ремонт, монтаж, установка техники',
    },
    seo: {
      ka: 'ოსტატი თბილისში — პატარა რემონტი და მონტაჟი',
      en: 'Handyman services in Tbilisi — small repairs and installs',
      ru: 'Мастер на час в Тбилиси — мелкий ремонт и монтаж',
    },
    brand: SERVICE_BRAND.renovation,
  },
  {
    id: 'climate',
    name: { ka: 'კლიმატი და გათბობა', en: 'Climate & heating', ru: 'Климат и отопление' },
    blurb: {
      ka: 'კონდიციონერი, გათბობა, ვენტილაცია — მონტაჟი და სერვისი',
      en: 'AC, heating, ventilation — install and service',
      ru: 'Кондиционеры, отопление, вентиляция — монтаж и сервис',
    },
    seo: {
      ka: 'კონდიციონერის მონტაჟი და გათბობის სერვისი საქართველოში',
      en: 'AC installation and heating service in Georgia',
      ru: 'Монтаж кондиционеров и сервис отопления в Грузии',
    },
    brand: CATEGORY_BRAND.hotels,
  },
  {
    id: 'security',
    name: { ka: 'უსაფრთხოება', en: 'Security', ru: 'Безопасность' },
    blurb: {
      ka: 'კამერები, განგაში, ჭკვიანი ჩაკეტილობა',
      en: 'Cameras, alarms, smart locks',
      ru: 'Камеры, сигнализация, умные замки',
    },
    seo: {
      ka: 'ვიდეოკამერები და განგაშის სისტემები სახლისთვის',
      en: 'Home cameras and alarm systems in Georgia',
      ru: 'Камеры и сигнализация для дома в Грузии',
    },
    brand: CATEGORY_BRAND.commercial,
  },
  {
    id: 'solar',
    name: { ka: 'მზის ენერგია', en: 'Solar', ru: 'Солнечная энергия' },
    blurb: {
      ka: 'პანელები, ინვერტორი, ქსელთან მიერთება',
      en: 'Panels, inverter, grid connection',
      ru: 'Панели, инвертор, подключение к сети',
    },
    seo: {
      ka: 'მზის პანელები სახლისთვის — მონტაჟი და ხარჯის გაანგარიშება',
      en: 'Solar panels for homes in Georgia — install and payback',
      ru: 'Солнечные панели для дома в Грузии — монтаж и окупаемость',
    },
    brand: CATEGORY_BRAND.land,
  },
  {
    id: 'architecture',
    name: { ka: 'არქიტექტურა', en: 'Architecture', ru: 'Архитектура' },
    blurb: {
      ka: 'პროექტი, ნებართვა, კონსტრუქციული და ინჟინერიული ნაწილი',
      en: 'Design, permits, structural and engineering plans',
      ru: 'Проект, разрешение, конструктив и инженерия',
    },
    seo: {
      ka: 'არქიტექტორები და პროექტირება საქართველოში',
      en: 'Architects and permitting in Georgia',
      ru: 'Архитекторы и проектирование в Грузии',
    },
    brand: CATEGORY_BRAND.newProjects,
  },
]

const CATEGORY_BY_ID = new Map(SERVICE_CATEGORIES.map((c) => [c.id, c]))

export function isServiceCategoryId(v: string): v is ServiceCategoryId {
  return CATEGORY_BY_ID.has(v as ServiceCategoryId)
}

export function serviceCategory(id: string): ServiceCategory | undefined {
  return CATEGORY_BY_ID.get(id as ServiceCategoryId)
}

export function pickLocText(text: LocText, lang: string): string {
  if (lang === 'ka') return text.ka
  if (lang === 'ru') return text.ru
  return text.en
}

export function serviceSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

/** Tbilisi mid-market GEL / m² — 2026. City multiplier applied at budget(). */
export const RENO_PACKAGES = [
  {
    id: 'cosmetic',
    gelPerM2: 180,
    name: { ka: 'კოსმეტიკური', en: 'Cosmetic', ru: 'Косметический' },
    hint: {
      ka: 'შპალერი, საღებავი, იატაკის განახლება',
      en: 'Paint, wallpaper, floor refresh',
      ru: 'Краска, обои, обновление пола',
    },
  },
  {
    id: 'white',
    gelPerM2: 550,
    name: { ka: 'თეთრი → გასაღები', en: 'White → turnkey', ru: 'Белая → ключ' },
    hint: {
      ka: 'სანტექნიკა, ელექტრო, იატაკი, კარი',
      en: 'Plumbing, electrics, floors, doors',
      ru: 'Сантехника, электрика, полы, двери',
    },
  },
  {
    id: 'black',
    gelPerM2: 900,
    name: { ka: 'შავი → გასაღები', en: 'Black → turnkey', ru: 'Черновая → ключ' },
    hint: {
      ka: 'სრული ციკლი შავი კარკასიდან',
      en: 'Full cycle from black frame',
      ru: 'Полный цикл с черновой',
    },
  },
  {
    id: 'premium',
    gelPerM2: 1400,
    name: { ka: 'პრემიუმი', en: 'Premium', ru: 'Премиум' },
    hint: {
      ka: 'დიზაინი, მასალები, ავეჯი',
      en: 'Design, materials, furniture',
      ru: 'Дизайн, материалы, мебель',
    },
  },
] as const

export type RenoPackageId = (typeof RENO_PACKAGES)[number]['id']

export const RENO_CITY_MULT: Record<string, number> = {
  თბილისი: 1,
  ბათუმი: 0.92,
  ქუთაისი: 0.72,
  რუსთავი: 0.7,
}

export function renoBudget(m2: number, gelPerM2: number, city = 'თბილისი'): number {
  const area = Number.isFinite(m2) ? Math.min(400, Math.max(10, m2)) : 10
  const rate = Number.isFinite(gelPerM2) ? Math.max(0, gelPerM2) : 0
  const mult = RENO_CITY_MULT[city] ?? 1
  return Math.round(area * rate * mult)
}

export type ServicePublic = {
  slug: string
  name: LocText
  category: ServiceCategoryId
  city: string
  district: string | null
  description: LocText
  phone: string
  email: string | null
  website: string | null
  verified: boolean
  yearsActive: number
  rating: number
  reviewCount: number
  features: string[]
  priceRangeMin: number | null
  priceRangeMax: number | null
  currency: string
  ownerId: string | null
}

export const SERVICE_PROVIDERS: readonly ServicePublic[] = [
  {
    slug: 'atelier-frame',
    name: { ka: 'Atelier Frame', en: 'Atelier Frame', ru: 'Atelier Frame' },
    category: 'renovation',
    city: 'თბილისი',
    district: 'საბურთალო',
    description: {
      ka: 'ბინის რემონტი თეთრი და შავი კარკასიდან. ფიქსირებული მ² ტარიფი, ხელშეკრულება და 24 თვის გარანტია.',
      en: 'Apartment renovation from white and black frame. Fixed per-m² rate, contract and 24-month warranty.',
      ru: 'Ремонт квартир с белой и черновой. Фикс за м², договор и гарантия 24 месяца.',
    },
    phone: '+995 500 333 111',
    email: null,
    website: null,
    verified: true,
    yearsActive: 11,
    rating: 4.8,
    reviewCount: 64,
    features: ['გასაღების ჩაბარება', 'ხელშეკრულება', 'გარანტია 24 თვე'],
    priceRangeMin: 180,
    priceRangeMax: 1400,
    currency: 'GEL',
    ownerId: null,
  },
  {
    slug: 'batumi-finish',
    name: { ka: 'Batumi Finish', en: 'Batumi Finish', ru: 'Batumi Finish' },
    category: 'renovation',
    city: 'ბათუმი',
    district: null,
    description: {
      ka: 'ზღვისპირა ბინების რემონტი და გასაღების ჩაბარება ინვესტორებისთვის. დღიური ქირის სტანდარტი.',
      en: 'Seaside apartment renovation and turnkey handover for investors. Daily-rental spec.',
      ru: 'Ремонт у моря и сдача под ключ для инвесторов. Стандарт под посуточную аренду.',
    },
    phone: '+995 500 333 111',
    email: null,
    website: null,
    verified: true,
    yearsActive: 7,
    rating: 4.6,
    reviewCount: 31,
    features: ['ინვესტორი', 'დღიური ქირა', 'ზღვის ხაზი'],
    priceRangeMin: 200,
    priceRangeMax: 1100,
    currency: 'GEL',
    ownerId: null,
  },
  {
    slug: 'studio-lisi',
    name: { ka: 'Studio Lisi', en: 'Studio Lisi', ru: 'Studio Lisi' },
    category: 'interior',
    city: 'თბილისი',
    district: 'ვაკე',
    description: {
      ka: 'ინტერიერის დიზაინ-პროექტი, 3D და ავტორის ზედამხედველობა. ვაკე, საბურთალო, მთაწმინდა.',
      en: 'Interior design project, 3D and author supervision. Vake, Saburtalo, Mtatsminda.',
      ru: 'Дизайн-проект, 3D и авторский надзор. Ваке, Сабуртало, Мтацминда.',
    },
    phone: '+995 500 333 111',
    email: null,
    website: null,
    verified: true,
    yearsActive: 9,
    rating: 4.9,
    reviewCount: 28,
    features: ['3D ვიზუალი', 'ავტორის ზედამხედველობა', 'ავეჯი'],
    priceRangeMin: 40,
    priceRangeMax: 80,
    currency: 'GEL',
    ownerId: null,
  },
  {
    slug: 'nord-rooms',
    name: { ka: 'Nord Rooms', en: 'Nord Rooms', ru: 'Nord Rooms' },
    category: 'interior',
    city: 'თბილისი',
    district: 'დიდუბე',
    description: {
      ka: 'კომპაქტური ბინების ინტერიერი — ახალი პროექტების თეთრი კარკასი და სტუდიოები.',
      en: 'Interiors for compact apartments — new-build white frame and studios.',
      ru: 'Интерьеры компактных квартир — белая отделка новостроек и студии.',
    },
    phone: '+995 500 333 111',
    email: null,
    website: null,
    verified: true,
    yearsActive: 5,
    rating: 4.7,
    reviewCount: 19,
    features: ['სტუდიო', 'ახალი პროექტი', 'ბიუჯეტი'],
    priceRangeMin: 25,
    priceRangeMax: 55,
    currency: 'GEL',
    ownerId: null,
  },
  {
    slug: 'lens-space',
    name: { ka: 'Lens Space', en: 'Lens Space', ru: 'Lens Space' },
    category: 'photography',
    city: 'თბილისი',
    district: null,
    description: {
      ka: 'განცხადების ფოტო, ჰორიზონტალური ტური და Matterport. იმავე დღეს ჩაბარება თბილისში.',
      en: 'Listing photos, horizontal tour and Matterport. Same-day delivery in Tbilisi.',
      ru: 'Фото объявления, горизонтальный тур и Matterport. Сдача в тот же день в Тбилиси.',
    },
    phone: '+995 500 333 111',
    email: null,
    website: null,
    verified: true,
    yearsActive: 8,
    rating: 4.9,
    reviewCount: 112,
    features: ['Matterport', 'იმავე დღეს', 'HDR'],
    priceRangeMin: 150,
    priceRangeMax: 450,
    currency: 'GEL',
    ownerId: null,
  },
  {
    slug: 'sea-frame-photo',
    name: { ka: 'Sea Frame', en: 'Sea Frame', ru: 'Sea Frame' },
    category: 'photography',
    city: 'ბათუმი',
    district: null,
    description: {
      ka: 'ბათუმის ახალი პროექტების ფოტო და დრონი. დეველოპერის კატალოგი და Airbnb პაკეტი.',
      en: 'Batumi new-build photography and drone. Developer catalogues and Airbnb packs.',
      ru: 'Фото новостроек Батуми и дрон. Каталоги застройщика и пакет Airbnb.',
    },
    phone: '+995 500 333 111',
    email: null,
    website: null,
    verified: true,
    yearsActive: 6,
    rating: 4.7,
    reviewCount: 44,
    features: ['დრონი', 'Airbnb', 'დეველოპერი'],
    priceRangeMin: 120,
    priceRangeMax: 400,
    currency: 'GEL',
    ownerId: null,
  },
  {
    slug: 'reestri-law',
    name: { ka: 'Reestri Law', en: 'Reestri Law', ru: 'Reestri Law' },
    category: 'legal',
    city: 'თბილისი',
    district: null,
    description: {
      ka: 'ნასყიდობა, იპოთეკა, უცხოელის რეგისტრაცია. ნოტარიუსი და საჯარო რეესტრი ერთ პაკეტში.',
      en: 'Sale, mortgage, foreigner registration. Notary and public registry in one pack.',
      ru: 'Купля-продажа, ипотека, регистрация иностранца. Нотариус и реестр в одном пакете.',
    },
    phone: '+995 500 333 111',
    email: null,
    website: null,
    verified: true,
    yearsActive: 14,
    rating: 4.8,
    reviewCount: 87,
    features: ['ნოტარიუსი', 'უცხოელი', 'იპოთეკა'],
    priceRangeMin: 250,
    priceRangeMax: 900,
    currency: 'GEL',
    ownerId: null,
  },
  {
    slug: 'coast-notary',
    name: { ka: 'Coast Notary', en: 'Coast Notary', ru: 'Coast Notary' },
    category: 'legal',
    city: 'ბათუმი',
    district: null,
    description: {
      ka: 'ბათუმის ნასყიდობები და საინვესტიციო ბინები. რუსული და ინგლისური ხელშეკრულება.',
      en: 'Batumi sales and investment apartments. Contracts in Russian and English.',
      ru: 'Сделки в Батуми и инвестиционные квартиры. Договоры на русском и английском.',
    },
    phone: '+995 500 333 111',
    email: null,
    website: null,
    verified: true,
    yearsActive: 10,
    rating: 4.6,
    reviewCount: 39,
    features: ['EN / RU', 'ინვესტიცია', 'ნასყიდობა'],
    priceRangeMin: 200,
    priceRangeMax: 700,
    currency: 'GEL',
    ownerId: null,
  },
  {
    slug: 'sqm-value',
    name: { ka: 'sqm value', en: 'sqm value', ru: 'sqm value' },
    category: 'appraisal',
    city: 'თბილისი',
    district: null,
    description: {
      ka: 'ბანკისთვის და ნასყიდობისთვის შეფასება. შედარებითი მეთოდი + რეესტრის ამონაწერი.',
      en: 'Appraisal for banks and sales. Comparables method plus registry extract.',
      ru: 'Оценка для банка и сделки. Сравнительный метод и выписка из реестра.',
    },
    phone: '+995 500 333 111',
    email: null,
    website: null,
    verified: true,
    yearsActive: 12,
    rating: 4.7,
    reviewCount: 53,
    features: ['ბანკი', 'რეესტრი', '48 სთ'],
    priceRangeMin: 180,
    priceRangeMax: 350,
    currency: 'GEL',
    ownerId: null,
  },
  {
    slug: 'basis-appraise',
    name: { ka: 'Basis Appraise', en: 'Basis Appraise', ru: 'Basis Appraise' },
    category: 'appraisal',
    city: 'თბილისი',
    district: 'ვაკე',
    description: {
      ka: 'პრემიუმ ბინებისა და კომერციული ფართის შეფასება. იპოთეკა და სასამართლო ექსპერტიზა.',
      en: 'Premium apartment and commercial appraisal. Mortgage and court expertise.',
      ru: 'Оценка премиум-квартир и коммерции. Ипотека и судебная экспертиза.',
    },
    phone: '+995 500 333 111',
    email: null,
    website: null,
    verified: true,
    yearsActive: 16,
    rating: 4.8,
    reviewCount: 41,
    features: ['კომერციული', 'იპოთეკა', 'ექსპერტიზა'],
    priceRangeMin: 250,
    priceRangeMax: 600,
    currency: 'GEL',
    ownerId: null,
  },
  {
    slug: 'move-one',
    name: { ka: 'Move One', en: 'Move One', ru: 'Move One' },
    category: 'moving',
    city: 'თბილისი',
    district: null,
    description: {
      ka: 'ბინის გადატანა თბილისში და რეგიონებში. ლიფტი, შეფუთვა, დაზღვევა.',
      en: 'Apartment moves in Tbilisi and the regions. Lift, packing, insurance.',
      ru: 'Переезд квартир в Тбилиси и регионах. Лифт, упаковка, страховка.',
    },
    phone: '+995 500 333 111',
    email: null,
    website: null,
    verified: true,
    yearsActive: 8,
    rating: 4.5,
    reviewCount: 76,
    features: ['ლიფტი', 'შეფუთვა', 'დაზღვევა'],
    priceRangeMin: 180,
    priceRangeMax: 800,
    currency: 'GEL',
    ownerId: null,
  },
  {
    slug: 'port-move',
    name: { ka: 'Port Move', en: 'Port Move', ru: 'Port Move' },
    category: 'moving',
    city: 'ბათუმი',
    district: null,
    description: {
      ka: 'თბილისი–ბათუმი ტრასა და ზღვისპირა კორპუსების გადატანა. ლიფტის ჯავშანი.',
      en: 'Tbilisi–Batumi corridor and seaside-tower moves. Lift booking included.',
      ru: 'Коридор Тбилиси–Батуми и переезд в приморских башнях. Бронь лифта.',
    },
    phone: '+995 500 333 111',
    email: null,
    website: null,
    verified: true,
    yearsActive: 6,
    rating: 4.4,
    reviewCount: 22,
    features: ['თბილისი–ბათუმი', 'კორპუსი', 'ლიფტი'],
    priceRangeMin: 250,
    priceRangeMax: 1200,
    currency: 'GEL',
    ownerId: null,
  },
  {
    slug: 'after-build',
    name: { ka: 'After Build', en: 'After Build', ru: 'After Build' },
    category: 'cleaning',
    city: 'თბილისი',
    district: null,
    description: {
      ka: 'რემონტის შემდგომი დასუფთავება და ჩაბარების სტანდარტი. დეველოპერისა და მესაკუთრის პაკეტი.',
      en: 'Post-renovation cleaning and handover spec. Developer and owner packs.',
      ru: 'Уборка после ремонта и стандарт сдачи. Пакеты застройщика и собственника.',
    },
    phone: '+995 500 333 111',
    email: null,
    website: null,
    verified: true,
    yearsActive: 7,
    rating: 4.8,
    reviewCount: 58,
    features: ['რემონტის შემდეგ', 'ჩაბარება', 'დეველოპერი'],
    priceRangeMin: 4,
    priceRangeMax: 12,
    currency: 'GEL',
    ownerId: null,
  },
  {
    slug: 'turn-daily',
    name: { ka: 'Turn Daily', en: 'Turn Daily', ru: 'Turn Daily' },
    category: 'cleaning',
    city: 'თბილისი',
    district: 'ვერა',
    description: {
      ka: 'დღიური ქირის როტაცია: დასუფთავება, თეთრეული, სტოკი. Airbnb ჰოსტებისთვის.',
      en: 'Daily-rental turnover: clean, linen, restock. For Airbnb hosts.',
      ru: 'Оборот посуточной аренды: уборка, бельё, сток. Для хостов Airbnb.',
    },
    phone: '+995 500 333 111',
    email: null,
    website: null,
    verified: true,
    yearsActive: 4,
    rating: 4.6,
    reviewCount: 91,
    features: ['Airbnb', 'თეთრეული', 'სათავსო'],
    priceRangeMin: 40,
    priceRangeMax: 90,
    currency: 'GEL',
    ownerId: null,
  },
  {
    slug: 'hold-keys',
    name: { ka: 'Hold Keys', en: 'Hold Keys', ru: 'Hold Keys' },
    category: 'management',
    city: 'თბილისი',
    district: null,
    description: {
      ka: 'ქირის მართვა მესაკუთრისთვის: მოიჯარე, კომუნალური, რემონტი, ყოველთვიური ანგარიში.',
      en: 'Rental management for owners: tenant, utilities, repairs, monthly report.',
      ru: 'Управление арендой для собственника: жилец, коммуналка, ремонт, отчёт.',
    },
    phone: '+995 500 333 111',
    email: null,
    website: null,
    verified: true,
    yearsActive: 9,
    rating: 4.7,
    reviewCount: 33,
    features: ['ქირა', 'ანგარიში', 'რემონტი'],
    priceRangeMin: 8,
    priceRangeMax: 12,
    currency: 'GEL',
    ownerId: null,
  },
  {
    slug: 'orbi-care-local',
    name: { ka: 'Riviera Care', en: 'Riviera Care', ru: 'Riviera Care' },
    category: 'management',
    city: 'ბათუმი',
    district: null,
    description: {
      ka: 'საინვესტიციო ბინების მართვა ბათუმში: დღიური ქირა, დასუფთავება, სეზონური ფასი.',
      en: 'Investment-apartment management in Batumi: daily rent, cleaning, seasonal pricing.',
      ru: 'Управление инвестквартирами в Батуми: посуточно, уборка, сезонные цены.',
    },
    phone: '+995 500 333 111',
    email: null,
    website: null,
    verified: true,
    yearsActive: 6,
    rating: 4.5,
    reviewCount: 27,
    features: ['დღიური ქირა', 'სეზონი', 'ინვესტორი'],
    priceRangeMin: 15,
    priceRangeMax: 25,
    currency: 'GEL',
    ownerId: null,
  },
  {
    slug: 'procheck-survey',
    name: { ka: 'ProCheck Survey', en: 'ProCheck Survey', ru: 'ProCheck Survey' },
    category: 'inspection',
    city: 'თბილისი',
    district: 'საბურთალო',
    description: {
      ka: 'ბინისა და სახლის ტექნიკური შემოწმება ყიდვამდე: კონსტრუქცია, ტენიანობა, ელექტრო და სანტექნიკა. ანგარიში 48 საათში.',
      en: 'Pre-purchase technical surveys for apartments and houses: structure, moisture, electrics, plumbing. Report in 48 hours.',
      ru: 'Техосмотр квартиры и дома перед покупкой: конструкция, влага, электрика, сантехника. Отчёт за 48 часов.',
    },
    phone: '+995 500 333 111',
    email: null,
    website: null,
    verified: true,
    yearsActive: 6,
    rating: 4.8,
    reviewCount: 37,
    features: ['ანგარიში 48 სთ', 'კონსტრუქცია', 'ტენიანობა'],
    priceRangeMin: 250,
    priceRangeMax: 600,
    currency: 'GEL',
    ownerId: null,
  },
  {
    slug: 'batumi-home-check',
    name: { ka: 'Batumi Home Check', en: 'Batumi Home Check', ru: 'Batumi Home Check' },
    category: 'inspection',
    city: 'ბათუმი',
    district: null,
    description: {
      ka: 'ზღვისპირა ბინების შემოწმება ინვესტორისთვის: ტენიანობა, კოროზია, ფასადის მდგომარეობა. ფოტო ანგარიში.',
      en: 'Seaside apartment surveys for investors: moisture, corrosion, facade condition. Photo report.',
      ru: 'Осмотр квартир у моря для инвестора: влага, коррозия, фасад. Фотоотчёт.',
    },
    phone: '+995 500 333 111',
    email: null,
    website: null,
    verified: true,
    yearsActive: 4,
    rating: 4.6,
    reviewCount: 18,
    features: ['ინვესტორი', 'ტენიანობა', 'ფოტო ანგარიში'],
    priceRangeMin: 200,
    priceRangeMax: 450,
    currency: 'GEL',
    ownerId: null,
  },
  {
    slug: 'fix-hour',
    name: { ka: 'Fix Hour', en: 'Fix Hour', ru: 'Fix Hour' },
    category: 'handyman',
    city: 'თბილისი',
    district: 'ვაკე',
    description: {
      ka: 'საათობრივი ოსტატი: თაროები, საკეტები, შრუმები, ტექნიკის მონტაჟი. იმავე დღეს გასვლა თბილისში.',
      en: 'Hourly handyman: shelves, locks, blinds, appliance installs. Same-day visit in Tbilisi.',
      ru: 'Мастер на час: полки, замки, жалюзи, установка техники. Выезд в тот же день.',
    },
    phone: '+995 500 333 111',
    email: null,
    website: null,
    verified: true,
    yearsActive: 5,
    rating: 4.7,
    reviewCount: 58,
    features: ['იმავე დღეს', 'საათობრივი', 'ტექნიკის მონტაჟი'],
    priceRangeMin: 40,
    priceRangeMax: 250,
    currency: 'GEL',
    ownerId: null,
  },
  {
    slug: 'kutaisi-master',
    name: { ka: 'Kutaisi Master', en: 'Kutaisi Master', ru: 'Kutaisi Master' },
    category: 'handyman',
    city: 'ქუთაისი',
    district: null,
    description: {
      ka: 'პატარა რემონტი და მონტაჟი ქუთაისსა და მიმდებარე რაიონებში. მასალის შეძენა და ტრანსპორტი ჩვენგან.',
      en: 'Small repairs and installs in Kutaisi and nearby districts. Materials and transport included.',
      ru: 'Мелкий ремонт и монтаж в Кутаиси и районах. Материалы и транспорт с нас.',
    },
    phone: '+995 500 333 111',
    email: null,
    website: null,
    verified: true,
    yearsActive: 8,
    rating: 4.5,
    reviewCount: 24,
    features: ['მასალა', 'რეგიონი', 'მონტაჟი'],
    priceRangeMin: 35,
    priceRangeMax: 200,
    currency: 'GEL',
    ownerId: null,
  },
  {
    slug: 'coolair-ge',
    name: { ka: 'Coolair GE', en: 'Coolair GE', ru: 'Coolair GE' },
    category: 'climate',
    city: 'თბილისი',
    district: 'დიდუბე',
    description: {
      ka: 'კონდიციონერის მონტაჟი და წლიური სერვისი. გათბობის სისტემის პროექტი, მონტაჟი და ბალანსირება.',
      en: 'AC installation and annual service. Heating system design, install and balancing.',
      ru: 'Монтаж кондиционеров и годовой сервис. Проект отопления, монтаж и балансировка.',
    },
    phone: '+995 500 333 111',
    email: null,
    website: null,
    verified: true,
    yearsActive: 9,
    rating: 4.8,
    reviewCount: 66,
    features: ['მონტაჟი', 'სერვისი', 'გათბობა'],
    priceRangeMin: 80,
    priceRangeMax: 1200,
    currency: 'GEL',
    ownerId: null,
  },
  {
    slug: 'termo-batumi',
    name: { ka: 'Termo Batumi', en: 'Termo Batumi', ru: 'Termo Batumi' },
    category: 'climate',
    city: 'ბათუმი',
    district: null,
    description: {
      ka: 'ტენიან ზღვის კლიმატზე მორგებული გადაწყვეტილებები: კონდიციონერი, დეჰუმიდატორი, შენობის ვენტილაცია.',
      en: 'Solutions tuned to the humid seaside climate: AC, dehumidifiers, building ventilation.',
      ru: 'Решения для влажного морского климата: кондиционеры, осушители, вентиляция.',
    },
    phone: '+995 500 333 111',
    email: null,
    website: null,
    verified: true,
    yearsActive: 6,
    rating: 4.6,
    reviewCount: 29,
    features: ['დეჰუმიდატორი', 'ვენტილაცია', 'ზღვის ჰავა'],
    priceRangeMin: 90,
    priceRangeMax: 900,
    currency: 'GEL',
    ownerId: null,
  },
  {
    slug: 'safeline-ge',
    name: { ka: 'SafeLine GE', en: 'SafeLine GE', ru: 'SafeLine GE' },
    category: 'security',
    city: 'თბილისი',
    district: 'საბურთალო',
    description: {
      ka: 'კამერების, განგაშისა და ჭკვიანი საკეტების მონტაჟი ბინასა და კერძო სახლში. მობილური აპლიკაცია და ღრუბელი.',
      en: 'Cameras, alarms and smart locks for apartments and houses. Mobile app and cloud storage.',
      ru: 'Камеры, сигнализация и умные замки для квартиры и дома. Приложение и облако.',
    },
    phone: '+995 500 333 111',
    email: null,
    website: null,
    verified: true,
    yearsActive: 11,
    rating: 4.8,
    reviewCount: 51,
    features: ['კამერა', 'ჭკვიანი საკეტი', 'აპლიკაცია'],
    priceRangeMin: 300,
    priceRangeMax: 2500,
    currency: 'GEL',
    ownerId: null,
  },
  {
    slug: 'camwatch-batumi',
    name: { ka: 'CamWatch', en: 'CamWatch', ru: 'CamWatch' },
    category: 'security',
    city: 'ბათუმი',
    district: null,
    description: {
      ka: 'კორპუსისა და კომერციული სივრცის ვიდეომხედველობა. ღრუბლის არქივი 30 დღე, შეხების გარეშე მონიტორინგი.',
      en: 'Video surveillance for buildings and commercial spaces. 30-day cloud archive, remote monitoring.',
      ru: 'Видеонаблюдение для корпусов и коммерции. Облачный архив 30 дней, удалённый мониторинг.',
    },
    phone: '+995 500 333 111',
    email: null,
    website: null,
    verified: true,
    yearsActive: 5,
    rating: 4.5,
    reviewCount: 21,
    features: ['ღრუბელი', 'კომერციული', '30 დღე'],
    priceRangeMin: 350,
    priceRangeMax: 1800,
    currency: 'GEL',
    ownerId: null,
  },
  {
    slug: 'sunrope-ge',
    name: { ka: 'SunRope GE', en: 'SunRope GE', ru: 'SunRope GE' },
    category: 'solar',
    city: 'თბილისი',
    district: null,
    description: {
      ka: 'მზის პანელების სრული ციკლი: აუდიტი, პროექტი, ინვერტორი, ქსელთან მიერთება. ამორტიზაციის გაანგარიშება.',
      en: 'Full-cycle solar: audit, design, inverter, grid connection. Payback calculation included.',
      ru: 'Солнце под ключ: аудит, проект, инвертор, подключение к сети. Расчёт окупаемости.',
    },
    phone: '+995 500 333 111',
    email: null,
    website: null,
    verified: true,
    yearsActive: 7,
    rating: 4.9,
    reviewCount: 33,
    features: ['აუდიტი', 'ინვერტორი', 'ქსელი'],
    priceRangeMin: 3500,
    priceRangeMax: 15000,
    currency: 'GEL',
    ownerId: null,
  },
  {
    slug: 'helio-batumi',
    name: { ka: 'Helio Batumi', en: 'Helio Batumi', ru: 'Helio Batumi' },
    category: 'solar',
    city: 'ბათუმი',
    district: null,
    description: {
      ka: 'სადახლე მზის სისტემები ზღვისპირა კორპუსებისთვის და ინვესტორებისთვის. კოროზიაგამძლე მასალები.',
      en: 'Balcony solar systems for seaside towers and investors. Corrosion-resistant materials.',
      ru: 'Балконные солнечные системы для приморских башен и инвесторов. Антикоррозийные материалы.',
    },
    phone: '+995 500 333 111',
    email: null,
    website: null,
    verified: true,
    yearsActive: 4,
    rating: 4.6,
    reviewCount: 15,
    features: ['ინვესტორი', 'კოროზია', 'სადახლე'],
    priceRangeMin: 3000,
    priceRangeMax: 12000,
    currency: 'GEL',
    ownerId: null,
  },
  {
    slug: 'form-bureau',
    name: { ka: 'Form Bureau', en: 'Form Bureau', ru: 'Form Bureau' },
    category: 'architecture',
    city: 'თბილისი',
    district: 'მთაწმინდა',
    description: {
      ka: 'საცხოვრებელი და კომერციული პროექტი, ნებართვის მოპოვება, კონსტრუქციული და ინჟინერიული ნაწილები.',
      en: 'Residential and commercial design, permitting, structural and engineering packages.',
      ru: 'Жилые и коммерческие проекты, разрешение, конструктив и инженерия.',
    },
    phone: '+995 500 333 111',
    email: null,
    website: null,
    verified: true,
    yearsActive: 13,
    rating: 4.9,
    reviewCount: 26,
    features: ['ნებართვა', 'კონსტრუქცია', '3D'],
    priceRangeMin: 1200,
    priceRangeMax: 5000,
    currency: 'GEL',
    ownerId: null,
  },
  {
    slug: 'urban-sketch',
    name: { ka: 'Urban Sketch', en: 'Urban Sketch', ru: 'Urban Sketch' },
    category: 'architecture',
    city: 'თბილისი',
    district: 'ვერა',
    description: {
      ka: 'ბინის გადაკეთების პროექტი და ავტორის ზედამხედველობა. განაწილების ოპტიმიზაცია პატარა ფართებზე.',
      en: 'Renovation layout design with author supervision. Space optimization for compact apartments.',
      ru: 'Проект перепланировки с авторским надзором. Оптимизация малых площадей.',
    },
    phone: '+995 500 333 111',
    email: null,
    website: null,
    verified: true,
    yearsActive: 8,
    rating: 4.7,
    reviewCount: 19,
    features: ['გადაკეთება', 'ზედამხედველობა', 'პატარა ფართი'],
    priceRangeMin: 800,
    priceRangeMax: 3500,
    currency: 'GEL',
    ownerId: null,
  },
]

export function providersOf(category?: string): ServicePublic[] {
  if (!category) return [...SERVICE_PROVIDERS]
  return SERVICE_PROVIDERS.filter((p) => p.category === category)
}

export function providerBySlug(slug: string): ServicePublic | undefined {
  return SERVICE_PROVIDERS.find((p) => p.slug === slug)
}

export function formatGel(n: number): string {
  // en-US grouping — ka-GE formats differently on Node vs browser ICU and breaks hydration
  return `${n.toLocaleString('en-US')} ₾`
}
