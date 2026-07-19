/**
 * SIVRCE — directory SEO copy corpus (developers / projects hubs + detail pages).
 * Same convention as lib/seo-pages.ts and components/entities/i18n.ts: ka/en/ru
 * real copy, every other locale falls back to English via dirLoc(). Kept out of
 * the shape-locked Dict system — ~60 long-form SEO strings would otherwise be
 * duplicated across all 9 i18n dicts (ponytail: seo-pages precedent).
 * Keyword corpus: research/directory-research-2026-07-19.md (agents 1 + 8).
 */

import { ruPlural, type Lang } from '@/lib/i18n/core'
import { CITIES } from '@/lib/seo-pages'
import type { Developer, Project } from '@/data/professionals'

export type DirLoc = 'ka' | 'en' | 'ru'

/** ka/ru have real directory copy; every other locale reads English. */
export function dirLoc(lang: Lang): DirLoc {
  return lang === 'ka' || lang === 'ru' ? lang : 'en'
}

/** Server-side LocalText/LocalName picker (entities/i18n pick() is a client module). */
export function pickLoc(text: { ka: string; en: string; ru: string }, loc: DirLoc): string {
  return loc === 'ka' ? text.ka : loc === 'ru' ? text.ru : text.en
}

/** 'გადაცემულია (2019)' → 'Completed (2019)' / 'Сдан (2019)'; quarters pass through. */
export function finishLabel(loc: DirLoc, finish: string): string {
  if (!finish.startsWith('გადაცემულია')) return finish
  const year = finish.match(/\((\d{4})\)/)?.[1]
  const base = loc === 'ka' ? 'გადაცემულია' : loc === 'ru' ? 'Сдан' : 'Completed'
  return year ? `${base} (${year})` : base
}

/** City display name per locale (seo-pages CITIES corpus, fallback raw). */
export function cityName(city: string, loc: DirLoc): string {
  const c = CITIES.find((c) => c.ka === city)
  return c ? (loc === 'ka' ? c.ka : loc === 'ru' ? c.ru : c.en) : city
}

/** ka locative ('თბილისში') / en 'in Tbilisi' / ru 'в Тбилиси'. */
export function cityIn(city: string, loc: DirLoc): string {
  const c = CITIES.find((c) => c.ka === city)
  if (!c) return loc === 'ka' ? `${city}ში` : loc === 'ru' ? `в ${city}` : `in ${city}`
  return loc === 'ka' ? c.loc : loc === 'ru' ? `в ${c.ru}` : `in ${c.en}`
}

/** '214 ბინა' / '214 flats' / '214 квартир'. */
export function unitsLabel(n: number, loc: DirLoc): string {
  if (loc === 'ka') return `${n} ბინა`
  if (loc === 'ru') return `${n} ${ruPlural(n, 'квартира', 'квартиры', 'квартир')}`
  return `${n} ${n === 1 ? 'flat' : 'flats'}`
}

/** '22 სართული' / '22 floors' / '22 этажа'. */
export function floorsLabel(n: number, loc: DirLoc): string {
  if (loc === 'ka') return `${n} სართული`
  if (loc === 'ru') return `${n} ${ruPlural(n, 'этаж', 'этажа', 'этажей')}`
  return `${n} ${n === 1 ? 'floor' : 'floors'}`
}

export interface FaqItem {
  q: string
  a: string
}

/** FAQPage JSON-LD matching a visible FaqSection one-to-one. */
export function faqPageLd(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
}

/** Shared micro-labels used on hub cards and detail stat rows. */
export const MICRO: Record<
  DirLoc,
  {
    builtPct: (n: number) => string
    handover: string
    flats: string
    perM2: string
    perM2From: string
    priceFromM2: string
    website: string
    listingsIn: (city: string) => string
  }
> = {
  ka: {
    builtPct: (n) => `აშენებულია ${n}%`,
    handover: 'ჩაბარება',
    flats: 'ბინა',
    perM2: '/მ²',
    perM2From: '/მ²-დან',
    priceFromM2: 'ფასი /მ²-დან',
    website: 'ვებგვერდი',
    listingsIn: (city) => `განცხადებები ქ. ${city}ში`,
  },
  en: {
    builtPct: (n) => `${n}% built`,
    handover: 'Handover',
    flats: 'Flats',
    perM2: '/m²',
    perM2From: '/m² from',
    priceFromM2: 'Price from /m²',
    website: 'Website',
    listingsIn: (city) => `Listings in ${cityName(city, 'en')}`,
  },
  ru: {
    builtPct: (n) => `построено ${n}%`,
    handover: 'Сдача',
    flats: 'Квартиры',
    perM2: '/м²',
    perM2From: '/м² от',
    priceFromM2: 'Цена от /м²',
    website: 'Сайт',
    listingsIn: (city) => `Объявления в ${cityName(city, 'ru')}`,
  },
}

export interface DirectoryHubCopy {
  title: string
  ogTitle: string
  description: string
  h1: string
  sub: string
  proseTitle: string
  prose: string[]
  faqTitle: string
  faqs: FaqItem[]
}

export const DEVELOPERS_HUB: Record<DirLoc, DirectoryHubCopy> = {
  ka: {
    title: 'დეველოპერები საქართველოში — თბილისი, ბათუმი, მიმდინარე პროექტები',
    ogTitle: 'დეველოპერები საქართველოში | sivrce',
    description:
      'ყველა დეველოპერი საქართველოში ერთ სივრცეზე: Archi, m², Alliance, ORBI, Domus, Blox, Eagle Hills, Mira, Ocean Capital — პროექტები, მისამართები, რუკა და ფასები.',
    h1: 'დეველოპერები საქართველოში',
    sub: 'ყველა სამშენებლო კომპანია თბილისში, ბათუმსა და საქართველოში — მიმდინარე პროექტებით, ფასებით, შიდა განვადებითა და მყიდველების მიმოხილვებით',
    proseTitle: 'ბინა დეველოპერისგან — რატომ ღირს',
    prose: [
      'sivrce-ზე შეგროვებულია საქართველოს ყველა მნიშვნელოვანი დეველოპერი: Archi, m², Alliance Group, ORBI, Domus, Blox, Eagle Hills, King David, White Square და სხვები. თითოეული კომპანიის პროფილზე ნახავთ მიმდინარე მშენებლობებს თბილისსა და ბათუმში, ჩაბარებულ პროექტებს, მისამართებს, რუკის კოორდინატებსა და მყიდველების შეფასებებს.',
      'ბინა დეველოპერისგან ყიდვა ნიშნავს საუკეთესო ფასს შუამავლის გარეშე, შიდა განვადებას პირველადი შენატანით და კარკასის არჩევას — შავი, თეთრი ან მწვანე. შეადარეთ კვადრატული მეტრის ფასები, ჩაბარების ვადები და კომპანიების სანდოობა ერთ სივრცეში, სანამ ახალ პროექტში ბინას შეიძენთ.',
    ],
    faqTitle: 'ხშირად დასმული კითხვები',
    faqs: [
      {
        q: 'როგორ ავირჩიო სანდო დეველოპერი საქართველოში?',
        a: 'შეამოწმეთ ჩაბარებული პროექტების რაოდენობა, გამოცდილება წლებში, მიმდინარე მშენებლობის რეალური პროგრესი და მყიდველების მიმოხილვები. sivrce-ზე თითოეული დეველოპერის პროფილი აერთიანებს ამ მონაცემებს — ვერიფიცირებული ნიშანი ნიშნავს, რომ კომპანიის მონაცემები გადამოწმებულია.',
      },
      {
        q: 'რა არის შიდა განვადება და როგორ მუშაობს?',
        a: 'შიდა განვადება დეველოპერის საკუთარი განვადებაა ბანკის გარეშე: იხდით პირველად შენატანს (ჩვეულებრივ 10–30%) და დარჩენილ თანხას თვიურად, ბინის ჩაბარებამდე — ხშირად 0%-იანი პროცენტით. პირობები თითოეულ დეველოპერთან ინდივიდუალურია.',
      },
      {
        q: 'რა განსხვავებაა შავ, თეთრ და მწვანე კარკასს შორის?',
        a: 'შავი კარკასი — მხოლოდ კონსტრუქცია და კარ-ფანჯარა. თეთრი კარკასი — მზა რემონტისთვის: მუყაოს კედლები, ელექტრო-სანტექნიკა, იატაკის ხვეული. მწვანე კარკასი — თითქმის სრული რემონტი, რჩება მხოლოდ ავეჯი. კვადრატული მეტრის ფასი პირდაპირ არის დამოკიდებული კარკასის ტიპზე.',
      },
      {
        q: 'შეუძლია თუ არა უცხოელს ბინის ყიდვა საქართველოში?',
        a: 'დიახ — უცხოელებს საქართველოში ბინის ყიდვა მთლიანად შეუძლიათ, მოქალაქეობის ან ვიზის გარეშე (შეზღუდვა ვრცელდება მხოლოდ სასოფლო-სამეურნეო მიწაზე). საკუთრების რეგისტრაცია საჯარო რეესტრში 1 სამუშაო დღეში ხდება.',
      },
      {
        q: 'რამდენი ღირს ბინები ახალ პროექტებში 2026 წელს?',
        a: 'კვადრატული მეტრის ფასი თბილისის ახალ პროექტებში დაახლოებით $1,100–1,200-დან იწყება გარე უბნებში და $3,000–4,000-ს აღწევს ვაკესა და ცენტრში; ბათუმში ზღვის პირველი ხაზი უფრო ძვირია. ზუსტი მიმდინარე ფასები ნახეთ თითოეული პროექტის გვერდზე.',
      },
    ],
  },
  en: {
    title: 'Real Estate Developers in Georgia — Tbilisi & Batumi Projects',
    ogTitle: 'Real Estate Developers in Georgia | sivrce',
    description:
      'Every developer in Georgia in one place: Archi, m², Alliance, ORBI, Domus, Blox, Eagle Hills, King David — new-build projects, addresses, map and prices.',
    h1: 'Real estate developers in Georgia',
    sub: 'Every construction company in Tbilisi, Batumi and across Georgia — with active projects, prices, installment plans and buyer reviews.',
    proseTitle: 'Buying directly from a developer — why it pays',
    prose: [
      'sivrce lists every major developer in Georgia: Archi, m², Alliance Group, ORBI, Domus, Blox, Eagle Hills, King David, White Square and more. Each company profile shows active construction projects in Tbilisi and Batumi, completed buildings, addresses, map coordinates and buyer ratings.',
      'Buying an apartment directly from a developer means the best price without intermediaries, an in-house installment plan with a down payment, and a choice of frame condition — black, white or green. Compare price per square meter, handover dates and company reliability in one place before you buy in a new development.',
    ],
    faqTitle: 'Frequently asked questions',
    faqs: [
      {
        q: 'How do I choose a reliable developer in Georgia?',
        a: 'Check the number of completed projects, years on the market, real construction progress and buyer reviews. Every developer profile on sivrce combines these signals — a verified badge means the company data has been confirmed.',
      },
      {
        q: 'What is a developer installment plan and how does it work?',
        a: "An installment plan is the developer's own financing without a bank: you pay a down payment (usually 10–30%) and the rest monthly until handover — often at 0% interest. Terms are individual per developer.",
      },
      {
        q: 'What is the difference between black, white and green frame?',
        a: 'Black frame is the bare structure with windows. White frame is ready for renovation: plastered walls, electrical wiring, floor screed. Green frame is a near-complete renovation — only furniture is left. The price per m² directly depends on the frame type.',
      },
      {
        q: 'Can foreigners buy an apartment in Georgia?',
        a: 'Yes — foreigners can freely buy apartments in Georgia without citizenship or a visa (only agricultural land is restricted). Ownership is registered at the Public Registry within one business day.',
      },
      {
        q: 'How much do apartments in new developments cost in 2026?',
        a: 'Price per m² in Tbilisi new builds starts at roughly $1,100–1,200 in outer districts and reaches $3,000–4,000 in Vake and the center; Batumi first-line units cost more. See each project page for current exact prices.',
      },
    ],
  },
  ru: {
    title: 'Застройщики Грузии — новостройки Тбилиси и Батуми',
    ogTitle: 'Застройщики Грузии | sivrce',
    description:
      'Все застройщики Грузии в одном месте: Archi, m², Alliance, ORBI, Domus, Blox, Eagle Hills, King David — проекты, адреса, карта и цены.',
    h1: 'Застройщики Грузии',
    sub: 'Все строительные компании Тбилиси, Батуми и Грузии — с текущими проектами, ценами, рассрочкой и отзывами покупателей.',
    proseTitle: 'Квартира от застройщика — почему это выгодно',
    prose: [
      'На sivrce собраны все крупные застройщики Грузии: Archi, m², Alliance Group, ORBI, Domus, Blox, Eagle Hills, King David, White Square и другие. В профиле каждой компании — строящиеся проекты в Тбилиси и Батуми, сданные дома, адреса, координаты на карте и оценки покупателей.',
      'Покупка квартиры напрямую от застройщика — это лучшая цена без посредников, внутренняя рассрочка с первым взносом и выбор состояния отделки: чёрный, белый или зелёный каркас. Сравнивайте цену за квадратный метр, сроки сдачи и надёжность компаний в одном месте, прежде чем купить квартиру в новостройке.',
    ],
    faqTitle: 'Частые вопросы',
    faqs: [
      {
        q: 'Как выбрать надёжного застройщика в Грузии?',
        a: 'Проверьте количество сданных проектов, опыт в годах, реальный прогресс строительства и отзывы покупателей. Профиль каждого застройщика на sivrce объединяет эти данные — знак «проверен» означает, что данные компании подтверждены.',
      },
      {
        q: 'Что такое внутренняя рассрочка и как она работает?',
        a: 'Рассрочка — это финансирование от самого застройщика без банка: вы платите первый взнос (обычно 10–30%), а остаток — ежемесячно до сдачи дома, часто под 0%. Условия индивидуальны у каждого застройщика.',
      },
      {
        q: 'Чем отличаются чёрный, белый и зелёный каркас?',
        a: 'Чёрный каркас — только конструкция и окна. Белый каркас — готово к ремонту: оштукатуренные стены, электрика, стяжка пола. Зелёный каркас — почти полный ремонт, остаётся только мебель. Цена за м² напрямую зависит от типа каркаса.',
      },
      {
        q: 'Могут ли иностранцы купить квартиру в Грузии?',
        a: 'Да — иностранцы могут свободно покупать квартиры в Грузии без гражданства и визы (ограничение действует только на сельхозземлю). Регистрация права собственности в Публичном реестре занимает один рабочий день.',
      },
      {
        q: 'Сколько стоят квартиры в новостройках в 2026 году?',
        a: 'Цена за м² в новостройках Тбилиси начинается примерно от $1,100–1,200 на окраинах и достигает $3,000–4,000 в Ваке и центре; первая линия в Батуми стоит дороже. Точные текущие цены смотрите на странице каждого проекта.',
      },
    ],
  },
}

export const PROJECTS_HUB: Record<DirLoc, DirectoryHubCopy> = {
  ka: {
    title: 'ახალი პროექტები თბილისში და ბათუმში — მშენებარე კორპუსები',
    ogTitle: 'ახალი პროექტები თბილისში და ბათუმში | sivrce',
    description:
      'ახალი საცხოვრებელი პროექტები თბილისში და ბათუმში: დეველოპერების შეფასებები, ფასები კვადრატულზე, მშენებლობის პროგრესი და ჩაბარების ვადები — ყველა პროექტი ერთ სივრცეში.',
    h1: 'ახალი პროექტები თბილისში და ბათუმში',
    sub: 'მშენებარე ბინები ყველა დეველოპერისგან — ფასები კვადრატულზე, ჩაბარების ვადები, შიდა განვადება და მშენებლობის რეალური პროგრესი ერთ სივრცეში',
    proseTitle: 'მშენებარე ბინები ახალ პროექტებში — ბაზრის მიმოხილვა',
    prose: [
      'აქ ნახავთ ყველა ახალ საცხოვრებელ კომპლექსს თბილისში, ბათუმსა და საქართველოს სხვა ქალაქებში — m², Archi, Alliance, ORBI და სხვა დეველოპერების მშენებარე კორპუსებით. თითოეული პროექტისთვის მითითებულია კვადრატული მეტრის ფასი, მშენებლობის პროგრესი პროცენტებში, ჩაბარების ვადა და ბინების რაოდენობა.',
      'მშენებარე ბინის ყიდვა იაფია დასრულებულზე — ფასი იზრდება ჩაბარებასთან მიახლოებით, ამიტომ ახალი პროექტები ერთ-ერთი ყველაზე პოპულარული ინვესტიციაა საქართველოში. შეადარეთ უბნები, კარკასის ტიპები და ფასები 2026 წელს და იპოვეთ ბინა საცხოვრებლად ან გასაქირავებლად.',
    ],
    faqTitle: 'ხშირად დასმული კითხვები',
    faqs: [
      {
        q: 'რამდენი ღირს ბინა ახალ პროექტში თბილისში 2026 წელს?',
        a: 'კვადრატული მეტრის ფასი თბილისში დაახლოებით $1,100–1,200-დან იწყება (გლდანი, დიდი დიღომი) და $3,000–4,000-ს აღწევს ვაკესა და მთაწმინდაზე. ბათუმში ზღვისპირა პროექტები $1,500–3,000-ში მერყეობს. ზუსტი ფასები ნახეთ თითოეული პროექტის გვერდზე.',
      },
      {
        q: 'უნდა ვიყიდო მშენებარე თუ დასრულებული ბინა?',
        a: 'მშენებარე ბინა ჩვეულებრივ იაფია დასრულებულზე და ხელმისაწვდომია შიდა განვადება — რისკი კი ჩაბარების ვადის გადაცილებაა. დასრულებული ბინა დაუყოვნებლივ შეგიძლიათ გამოიყენოთ ან გააქირაოთ. სანდო დეველოპერის მშენებარე პროექტი ხშირად უკეთესი ფასია გრძელვადიანი პერსპექტივით.',
      },
      {
        q: 'რა არის თეთრი კარკასი?',
        a: 'თეთრი კარკასი ბინის ის მდგომარეობაა, რომელიც მზადაა რემონტისთვის: დამუშავებული კედლები, ელექტრო-სანტექნიკის გაყვანილობა, იატაკის ხვეული და კარ-ფანჯარა. საქართველოში ახალი პროექტების უმეტესობა სწორედ თეთრი ან შავი კარკასით იყიდება.',
      },
      {
        q: 'შეიძლება თუ არა იპოთეკით ყიდვა მშენებარე ბინაში?',
        a: 'დიახ — ქართული ბანკები გასცემენ იპოთეკას მშენებარე ბინებზე, თუმცა პირობები დამოკიდებულია დეველოპერის აკრედიტაციაზე. ალტერნატივაა შიდა განვადება: პირველადი შენატანი 10–30% და თვიური გადახდა ჩაბარებამდე.',
      },
      {
        q: 'არის თუ არა ახალ პროექტში ყიდვა კარგი ინვესტიცია?',
        a: 'მშენებლობის ეტაპზე ყიდილი ბინა ჩაბარებამდე, როგორც წესი, იზრდება ღირებულებაში; თბილისსა და ბათუმში გაქირავების შემოსავალი (ROI) უბნისა და ტურისტული მოთხოვნილების მიხედვით მერყეობს. შეადარეთ პროექტების ფასი, ლოკაცია და დეველოპერის სანდოობა sivrce-ზე.',
      },
    ],
  },
  en: {
    title: 'New Developments in Tbilisi & Batumi — Under-Construction Apartments',
    ogTitle: 'New Developments in Tbilisi & Batumi | sivrce',
    description:
      'New residential projects in Tbilisi and Batumi: developer ratings, price per m², construction progress and handover dates — every project in one place.',
    h1: 'New developments in Tbilisi and Batumi',
    sub: 'Under-construction apartments from every developer — price per m², handover dates, installment plans and real construction progress in one place.',
    proseTitle: 'New-build apartments in Georgia — market overview',
    prose: [
      'Here you find every new residential complex in Tbilisi, Batumi and other Georgian cities — under-construction buildings by m², Archi, Alliance, ORBI and other developers. Each project shows price per square meter, construction progress in percent, handover date and unit count.',
      'Buying an apartment under construction is cheaper than a completed one — prices rise toward handover, which makes new developments one of the most popular investments in Georgia. Compare districts, frame conditions and 2026 prices, and find an apartment to live in or rent out.',
    ],
    faqTitle: 'Frequently asked questions',
    faqs: [
      {
        q: 'How much does an apartment in a new Tbilisi development cost in 2026?',
        a: 'Price per m² in Tbilisi starts at roughly $1,100–1,200 (Gldani, Didi Digomi) and reaches $3,000–4,000 in Vake and Mtatsminda. Batumi seaside projects range around $1,500–3,000. See each project page for exact prices.',
      },
      {
        q: 'Should I buy an off-plan or a completed apartment?',
        a: "Off-plan is usually cheaper and comes with an installment plan — the risk is a handover delay. A completed unit can be used or rented out immediately. A reliable developer's off-plan project is often the better price for a long-term view.",
      },
      {
        q: 'What is a white frame apartment?',
        a: 'White frame is a condition ready for renovation: finished walls, electrical and plumbing wiring, floor screed and windows. Most new developments in Georgia are sold in white or black frame.',
      },
      {
        q: 'Can you get a mortgage for an under-construction apartment?',
        a: "Yes — Georgian banks issue mortgages for new builds, though terms depend on the developer's bank accreditation. The alternative is a developer installment plan: 10–30% down and monthly payments until handover.",
      },
      {
        q: 'Is buying in a new development a good investment?',
        a: 'Units bought during construction typically appreciate by handover; rental yield (ROI) in Tbilisi and Batumi varies by district and tourist demand. Compare project prices, locations and developer reliability on sivrce.',
      },
    ],
  },
  ru: {
    title: 'Новостройки Тбилиси и Батуми — квартиры в строящихся домах',
    ogTitle: 'Новостройки Тбилиси и Батуми | sivrce',
    description:
      'Новые жилые комплексы Тбилиси и Батуми: рейтинги застройщиков, цена за м², ход строительства и сроки сдачи — все проекты в одном месте.',
    h1: 'Новостройки Тбилиси и Батуми',
    sub: 'Квартиры в строящихся домах от всех застройщиков — цена за м², сроки сдачи, рассрочка и реальный ход строительства в одном месте.',
    proseTitle: 'Квартиры в новостройках Грузии — обзор рынка',
    prose: [
      'Здесь собраны все новые жилые комплексы Тбилиси, Батуми и других городов Грузии — строящиеся дома от m², Archi, Alliance, ORBI и других застройщиков. Для каждого проекта указаны цена за квадратный метр, процент готовности, срок сдачи и количество квартир.',
      'Купить квартиру в строящемся доме дешевле, чем в готовом — цена растёт к сдаче, поэтому новостройки остаются одной из самых популярных инвестиций в Грузии. Сравнивайте районы, типы каркаса и цены 2026 года и найдите квартиру для жизни или сдачи в аренду.',
    ],
    faqTitle: 'Частые вопросы',
    faqs: [
      {
        q: 'Сколько стоит квартира в новостройке Тбилиси в 2026 году?',
        a: 'Цена за м² в Тбилиси начинается примерно от $1,100–1,200 (Глдани, Диди Дигоми) и достигает $3,000–4,000 в Ваке и на Мтацминде. Проекты у моря в Батуми стоят $1,500–3,000. Точные цены смотрите на странице каждого проекта.',
      },
      {
        q: 'Что лучше: строящийся или готовый дом?',
        a: 'Строящаяся квартира обычно дешевле и доступна в рассрочку — риск в переносе сроков сдачи. Готовой квартирой можно сразу пользоваться или сдавать. Новостройка надёжного застройщика часто выгоднее в долгосрочной перспективе.',
      },
      {
        q: 'Что такое белый каркас?',
        a: 'Белый каркас — состояние, готовое к ремонту: оштукатуренные стены, разводка электрики и сантехники, стяжка пола, окна. Большинство новостроек в Грузии продаются в белом или чёрном каркасе.',
      },
      {
        q: 'Можно ли купить новостройку в ипотеку?',
        a: 'Да — грузинские банки выдают ипотеку на строящееся жильё, но условия зависят от аккредитации застройщика. Альтернатива — внутренняя рассрочка: первый взнос 10–30% и ежемесячные платежи до сдачи.',
      },
      {
        q: 'Выгодно ли вкладываться в новостройки?',
        a: 'Квартиры, купленные на этапе строительства, как правило, дорожают к сдаче; доходность аренды (ROI) в Тбилиси и Батуми зависит от района и туристического спроса. Сравнивайте цены, локации и надёжность застройщиков на sivrce.',
      },
    ],
  },
}

/** Developer detail page chrome (titles, crumbs, headings). */
export const DEV_DETAIL: Record<
  DirLoc,
  {
    titleSuffix: string
    descFallback: (name: string, city: string) => string
    crumbHome: string
    crumbDevs: string
    about: string
    location: string
    projects: string
    faqTitle: string
  }
> = {
  ka: {
    titleSuffix: '— პროექტები, ფასები და მიმოხილვები',
    descFallback: (name, city) =>
      `${name} — დეველოპერი ${city}ში. პროექტები, ფასები და მიმოხილვები სივრცეზე.`,
    crumbHome: 'მთავარი',
    crumbDevs: 'დეველოპერები',
    about: 'შესახებ',
    location: 'მდებარეობა',
    projects: 'პროექტები',
    faqTitle: 'ხშირად დასმული კითხვები',
  },
  en: {
    titleSuffix: '— projects, prices & reviews',
    descFallback: (name, city) =>
      `${name} — developer in ${cityName(city, 'en')}. Projects, prices and reviews on Sivrce.`,
    crumbHome: 'Home',
    crumbDevs: 'Developers',
    about: 'About',
    location: 'Location',
    projects: 'Projects',
    faqTitle: 'Frequently asked questions',
  },
  ru: {
    titleSuffix: '— проекты, цены и отзывы',
    descFallback: (name, city) =>
      `${name} — застройщик: ${cityName(city, 'ru')}. Проекты, цены и отзывы на Sivrce.`,
    crumbHome: 'Главная',
    crumbDevs: 'Застройщики',
    about: 'О компании',
    location: 'Расположение',
    projects: 'Проекты',
    faqTitle: 'Частые вопросы',
  },
}

/** Project detail page chrome. */
export const PROJECT_DETAIL: Record<
  DirLoc,
  {
    titleOf: (p: Project) => string
    crumbHome: string
    crumbProjects: string
    building3d: string
    location: string
    gallery: string
    floorPlan: string
    aboutProject: string
    otherProjects: (devName: string) => string
    faqTitle: string
    renderAlt: (i: number) => string
    floorsCaption: (floors: number, flats: number, done: number) => string
    statsBuilt: string
  }
> = {
  ka: {
    titleOf: (p) =>
      `${p.name} — მშენებარე ბინები ${cityIn(p.city, 'ka')}, ფასი ${p.priceFromM2}/მ²-დან | sivrce`,
    crumbHome: 'მთავარი',
    crumbProjects: 'პროექტები',
    building3d: 'კორპუსი 3D-ში',
    location: 'მდებარეობა',
    gallery: 'გალერეა',
    floorPlan: 'სართულის გეგმა',
    aboutProject: 'პროექტის შესახებ',
    otherProjects: (devName) => `სხვა პროექტები — ${devName}`,
    faqTitle: 'ხშირად დასმული კითხვები',
    renderAlt: (i) => `რენდერი ${i}`,
    floorsCaption: (floors, flats, done) =>
      `${floorsLabel(floors, 'ka')} · ${unitsLabel(flats, 'ka')} · აშენებულია ${done}% · მიატრიე მაუსი სართულს`,
    statsBuilt: 'აშენებულია',
  },
  en: {
    titleOf: (p) =>
      `${p.name} — new-build apartments in ${cityName(p.city, 'en')}, from ${p.priceFromM2}/m² | sivrce`,
    crumbHome: 'Home',
    crumbProjects: 'Projects',
    building3d: 'Building in 3D',
    location: 'Location',
    gallery: 'Gallery',
    floorPlan: 'Floor plan',
    aboutProject: 'About the project',
    otherProjects: (devName) => `More projects — ${devName}`,
    faqTitle: 'Frequently asked questions',
    renderAlt: (i) => `render ${i}`,
    floorsCaption: (floors, flats, done) =>
      `${floorsLabel(floors, 'en')} · ${unitsLabel(flats, 'en')} · ${done}% built · hover a floor`,
    statsBuilt: 'Built',
  },
  ru: {
    titleOf: (p) =>
      `${p.name} — квартиры в новостройке в ${cityName(p.city, 'ru')}, цены от ${p.priceFromM2}/м² | sivrce`,
    crumbHome: 'Главная',
    crumbProjects: 'Новостройки',
    building3d: 'Корпус в 3D',
    location: 'Расположение',
    gallery: 'Галерея',
    floorPlan: 'План этажа',
    aboutProject: 'О проекте',
    otherProjects: (devName) => `Другие проекты — ${devName}`,
    faqTitle: 'Частые вопросы',
    renderAlt: (i) => `рендер ${i}`,
    floorsCaption: (floors, flats, done) =>
      `${floorsLabel(floors, 'ru')} · ${unitsLabel(flats, 'ru')} · построено ${done}% · наведите курсор на этаж`,
    statsBuilt: 'Построено',
  },
}

/** Developer detail FAQ — rendered visibly AND shipped as FAQPage JSON-LD. */
export function devFaqs(loc: DirLoc, dev: Developer, projects: Project[]): FaqItem[] {
  const name = pickLoc(dev.name, loc)
  const names = projects
    .slice(0, 5)
    .map((p) => p.name)
    .join(', ')
  const handovers = projects
    .slice(0, 3)
    .map((p) => `${p.name} — ${finishLabel(loc, p.finish)}`)
    .join('; ')
  if (loc === 'ka') {
    return [
      {
        q: `რა პროექტები აქვს ${name}-ს?`,
        a:
          projects.length > 0
            ? `${name}-ს აქვს ${projects.length} პროექტი სივრცეზე: ${names}${projects.length > 5 ? ' და სხვა' : ''}.`
            : `${name} — დეველოპერი ${dev.city}ში. პროექტები ხელმისაწვდომია სივრცეზე.`,
      },
      {
        q: `სად მუშაობს ${name}?`,
        a: `${name} მუშაობს ${dev.city}ში. ${dev.yearsActive > 0 ? `აქტიურია ${dev.yearsActive} წელია. ` : ''}${pickLoc(dev.description, loc).slice(0, 200)}`,
      },
      {
        q: `როგორ შევამოწმო ${name}-ის სანდოობა?`,
        a: `${name}-ის პროფილზე ნახავთ${dev.yearsActive > 0 ? ` ${dev.yearsActive} წლის გამოცდილებას,` : ''}${dev.unitsDelivered > 0 ? ` ${dev.unitsDelivered.toLocaleString('en-US')} ჩაბარებულ ბინას,` : ''} მიმდინარე მშენებლობის პროგრესსა და მყიდველების მიმოხილვებს — დეველოპერის სანდოობის შესამოწმებლად ეს ყველაზე სწრაფი გზაა.`,
      },
      {
        q: `გთავაზობს თუ არა ${name} შიდა განვადებას?`,
        a: `საქართველოში დეველოპერების უმეტესობა გთავაზობს შიდა განვადებას: პირველადი შენატანი ჩვეულებრივ 10–30%, დარჩენილი თანხა — თვიური გადასახადებით ჩაბარებამდე, ხშირად 0%-იანი პროცენტით. ${name}-ის ზუსტი პირობები დაადასტურეთ გაყიდვების ოფისთან ან დაგვიკავშირდით sivrce-ზე.`,
      },
      {
        q: `როდის ჩააბარებს ${name} მიმდინარე პროექტებს?`,
        a:
          projects.length > 0
            ? `მიმდინარე პროექტების ჩაბარების ვადები: ${handovers}${projects.length > 3 ? ' და სხვა' : ''}. ზუსტი ვადები მითითებულია თითოეული პროექტის გვერდზე.`
            : `ახალი პროექტების ჩაბარების ვადები რეგულარულად ქვეყნდება sivrce-ზე.`,
      },
    ]
  }
  if (loc === 'ru') {
    return [
      {
        q: `Какие проекты есть у ${name}?`,
        a:
          projects.length > 0
            ? `У ${name} — ${projects.length} ${ruPlural(projects.length, 'проект', 'проекта', 'проектов')} на Sivrce: ${names}${projects.length > 5 ? ' и другие' : ''}.`
            : `${name} — застройщик: ${cityName(dev.city, 'ru')}. Проекты опубликованы на Sivrce.`,
      },
      {
        q: `Где работает ${name}?`,
        a: `${name} работает: ${cityName(dev.city, 'ru')}. ${dev.yearsActive > 0 ? `На рынке ${dev.yearsActive} ${ruPlural(dev.yearsActive, 'год', 'года', 'лет')}. ` : ''}${pickLoc(dev.description, loc).slice(0, 200)}`,
      },
      {
        q: `Как проверить надёжность ${name}?`,
        a: `В профиле ${name} вы найдёте опыт в годах, количество сданных квартир, реальный ход строительства и отзывы покупателей — самый быстрый способ проверить застройщика в Грузии.`,
      },
      {
        q: `Предлагает ли ${name} внутреннюю рассрочку?`,
        a: `Большинство застройщиков в Грузии предлагают внутреннюю рассрочку: первый взнос обычно 10–30%, остаток — ежемесячно до сдачи дома, часто под 0%. Точные условия ${name} уточняйте в офисе продаж или напишите нам на Sivrce.`,
      },
      {
        q: `Когда ${name} сдаст текущие проекты?`,
        a:
          projects.length > 0
            ? `Сроки сдачи активных проектов: ${handovers}${projects.length > 3 ? ' и другие' : ''}. Точные даты указаны на странице каждого проекта.`
            : `Сроки сдачи новых проектов регулярно публикуются на Sivrce.`,
      },
    ]
  }
  return [
    {
      q: `Which projects does ${name} have?`,
      a:
        projects.length > 0
          ? `${name} has ${projects.length} projects on Sivrce: ${names}${projects.length > 5 ? ' and more' : ''}.`
          : `${name} is a developer in ${cityName(dev.city, 'en')}. Projects are listed on Sivrce.`,
    },
    {
      q: `Where does ${name} operate?`,
      a: `${name} operates in ${cityName(dev.city, 'en')}. ${dev.yearsActive > 0 ? `Active for ${dev.yearsActive} years. ` : ''}${pickLoc(dev.description, loc).slice(0, 200)}`,
    },
    {
      q: `How can I check ${name}'s reliability?`,
      a: `On ${name}'s profile you can see years of experience, delivered units, live construction progress and buyer reviews — the fastest way to verify a developer in Georgia.`,
    },
    {
      q: `Does ${name} offer an installment plan?`,
      a: `Most developers in Georgia offer an in-house installment plan: typically 10–30% down and monthly payments until handover, often at 0% interest. Confirm ${name}'s exact terms with the sales office or contact us on Sivrce.`,
    },
    {
      q: `When will ${name} hand over its current projects?`,
      a:
        projects.length > 0
          ? `Handover dates for active projects: ${handovers}${projects.length > 3 ? ' and more' : ''}. Exact dates are listed on each project page.`
          : `Handover dates for new projects are published regularly on Sivrce.`,
    },
  ]
}

/** Project detail FAQ — rendered visibly AND shipped as FAQPage JSON-LD. */
export function projectFaqs(loc: DirLoc, p: Project, dev: Developer | null): FaqItem[] {
  const finish = finishLabel(loc, p.finish)
  if (loc === 'ka') {
    return [
      {
        q: `რა ღირს კვადრატული მეტრი ${p.name}-ში?`,
        a: p.priceFromM2
          ? `${p.name}-ში ფასი იწყება ${p.priceFromM2}/მ²-დან. მდებარეობა: ${p.location}. ახალი პროექტების ფასები 2026 წელს მერყეობს სართულის, ხედისა და კარკასის ტიპის მიხედვით.`
          : `${p.name} — ${p.location}. ფასები ხელმისაწვდომია სივრცეზე.`,
      },
      {
        q: `როდის ჩაიბარება ${p.name}?`,
        a: `ჩაბარების ვადა: ${finish}. მშენებლობის პროგრესი: ${p.done}%. სულ ${unitsLabel(p.flats, loc)}${p.floors ? `, სართულიანობა ${p.floors}-მდე` : ''}.`,
      },
      {
        q: `რომელი კარკასით იყიდება ბინები ${p.name}-ში?`,
        a: `საქართველოში ახალი პროექტები ძირითადად სამი კარკასით იყიდება: შავი (მხოლოდ კონსტრუქცია), თეთრი (მზა რემონტისთვის — მუყაო, ელექტრო-სანტექნიკა, იატაკი) და მწვანე (თითქმის სრული რემონტი). ${p.name}-ში ბინების ზუსტი მდგომარეობა დაადასტურეთ დეველოპერის გაყიდვების ოფისში.`,
      },
      {
        q: `როგორ შევიძინო ბინა ${p.name}-ში შიდა განვადებით ან იპოთეკით?`,
        a: `${p.name}-ში ბინის შეძენა შესაძლებელია დეველოპერის შიდა განვადებით (პირველადი შენატანი ჩვეულებრივ 10–30%, გადახდა ჩაბარებამდე) ან საბანკო იპოთეკით. დეტალები დაადასტურეთ დეველოპერთან ან დაგვიკავშირდით sivrce-ზე.`,
      },
      ...(dev
        ? [
            {
              q: `ვინ აშენებს ${p.name}-ს?`,
              a: `დეველოპერი: ${pickLoc(dev.name, loc)}. სრული პროფილი, სხვა პროექტები და მიმოხილვები: sivrce.ge/developers/${dev.slug}.`,
            },
          ]
        : []),
      {
        q: `ღირს თუ არა ${p.name}-ში ბინის ყიდვა ინვესტიციისთვის?`,
        a: `მშენებლობის ეტაპზე ყიდვა ჩვეულებრივ იაფია, ვიდრე დასრულებული ბინა — ფასი იზრდება ჩაბარებასთან. ${cityIn(p.city, loc)} გაქირავების შემოსავალი და ROI დამოკიდებულია უბანსა და კარკასის ტიპზე; შეადარეთ მსგავსი პროექტები sivrce-ზე.`,
      },
    ]
  }
  if (loc === 'ru') {
    return [
      {
        q: `Сколько стоит квадратный метр в ${p.name}?`,
        a: p.priceFromM2
          ? `Цены в ${p.name} начинаются от ${p.priceFromM2}/м². Расположение: ${p.location}. Цены на новостройки в 2026 году зависят от этажа, вида и типа каркаса.`
          : `${p.name} — ${p.location}. Цены доступны на Sivrce.`,
      },
      {
        q: `Когда сдадут ${p.name}?`,
        a: `Срок сдачи: ${finish}. Готовность: ${p.done}%. Всего ${unitsLabel(p.flats, loc)}${p.floors ? `, этажность до ${p.floors}` : ''}.`,
      },
      {
        q: `В каком каркасе продаются квартиры в ${p.name}?`,
        a: `Новостройки в Грузии обычно продаются в трёх состояниях: чёрный каркас (только конструкция), белый каркас (готово к ремонту — штукатурка, электрика, стяжка) и зелёный каркас (почти полный ремонт). Точное состояние квартир в ${p.name} уточняйте в офисе продаж застройщика.`,
      },
      {
        q: `Можно ли купить квартиру в ${p.name} в рассрочку или ипотеку?`,
        a: `Квартиру в ${p.name} можно купить во внутреннюю рассрочку от застройщика (первый взнос обычно 10–30%, выплаты до сдачи) или в ипотеку. Детали уточняйте у застройщика или напишите нам на Sivrce.`,
      },
      ...(dev
        ? [
            {
              q: `Кто строит ${p.name}?`,
              a: `Застройщик: ${pickLoc(dev.name, loc)}. Полный профиль, другие проекты и отзывы: sivrce.ge/developers/${dev.slug}.`,
            },
          ]
        : []),
      {
        q: `Выгодно ли покупать квартиру в ${p.name} для инвестиций?`,
        a: `Покупка на этапе строительства обычно дешевле готового жилья — цена растёт к сдаче. Доходность аренды и ROI ${cityIn(p.city, loc)} зависят от района и типа каркаса; сравните похожие проекты на Sivrce.`,
      },
    ]
  }
  return [
    {
      q: `How much is a square meter in ${p.name}?`,
      a: p.priceFromM2
        ? `Prices in ${p.name} start from ${p.priceFromM2}/m². Location: ${p.location}. New-build prices in 2026 vary by floor, view and frame condition.`
        : `${p.name} — ${p.location}. Prices are available on Sivrce.`,
    },
    {
      q: `When will ${p.name} be handed over?`,
      a: `Handover date: ${finish}. Construction progress: ${p.done}%. Total ${unitsLabel(p.flats, loc)}${p.floors ? `, up to ${p.floors} floors` : ''}.`,
    },
    {
      q: `Which frame condition are apartments sold in at ${p.name}?`,
      a: `New developments in Georgia are typically sold in three conditions: black frame (shell only), white frame (ready for renovation — plaster, wiring, screed) and green frame (near-complete). Confirm the exact condition for ${p.name} with the developer's sales office.`,
    },
    {
      q: `Can I buy an apartment in ${p.name} with an installment plan or mortgage?`,
      a: `You can buy in ${p.name} with a developer installment plan (typically 10–30% down, payments until handover) or a bank mortgage. Confirm details with the developer or contact us on Sivrce.`,
    },
    ...(dev
      ? [
          {
            q: `Who builds ${p.name}?`,
            a: `Developer: ${pickLoc(dev.name, loc)}. Full profile, other projects and reviews: sivrce.ge/developers/${dev.slug}.`,
          },
        ]
      : []),
    {
      q: `Is buying in ${p.name} a good investment?`,
      a: `Buying under construction is usually cheaper than a completed unit — prices rise toward handover. Rental yield and ROI ${cityIn(p.city, loc)} depend on the district and frame condition; compare similar projects on Sivrce.`,
    },
  ]
}
