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
    title: 'ბინა ახალ კორპუსში — ახალი პროექტები თბილისში და ბათუმში',
    ogTitle: 'ბინა ახალ კორპუსში — თბილისი და ბათუმი | sivrce',
    description:
      'ბინა ახალ კორპუსში თბილისში და ბათუმში: დეველოპერების შეფასებები, ფასები კვადრატულზე, მშენებლობის პროგრესი და ჩაბარების ვადები — ყველა პროექტი ერთ სივრცეში.',
    h1: 'ბინა ახალ კორპუსში — თბილისი და ბათუმი',
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
    title: 'Apartments in New Buildings in Tbilisi & Batumi — New Developments',
    ogTitle: 'Apartments in New Buildings in Tbilisi & Batumi | sivrce',
    description:
      'Apartments in new buildings in Tbilisi and Batumi: developer ratings, price per m², construction progress and handover dates — every project in one place.',
    h1: 'Apartments in new buildings in Tbilisi and Batumi',
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
    title: 'Квартиры в новостройках Тбилиси и Батуми — цены 2026',
    ogTitle: 'Квартиры в новостройках Тбилиси и Батуми | sivrce',
    description:
      'Квартиры в новостройках Тбилиси и Батуми: рейтинги застройщиков, цена за м², ход строительства и сроки сдачи — все проекты в одном месте.',
    h1: 'Квартиры в новостройках Тбилиси и Батуми',
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


/* -------------------------------------------------------------------------- */
/* New-build sub-hubs under /projects — city, district and modifier pages.    */
/* Copy corpus for /projects/tbilisi, /projects/batumi,                       */
/* /projects/batumi/sea-view, /projects/installment, /projects/ready and      */
/* /projects/tbilisi/[district]. Same DirectoryHubCopy shape as PROJECTS_HUB. */
/* -------------------------------------------------------------------------- */

export type ProjectHubKey = 'tbilisi' | 'batumi' | 'seaView' | 'installment' | 'ready'

/** Tbilisi district with enough new-build inventory to carry its own hub. */
export interface DistrictHub {
  slug: string
  /** ka name — also the substring matched against Project.location. */
  ka: string
  /** ka locative ('ვაკეში'). */
  kaIn: string
  en: string
  ru: string
  /** ru prepositional ('в Ваке'). */
  ruIn: string
}

export const PROJECT_DISTRICTS: DistrictHub[] = [
  { slug: 'saburtalo', ka: 'საბურთალო', kaIn: 'საბურთალოზე', en: 'Saburtalo', ru: 'Сабуртало', ruIn: 'в Сабуртало' },
  { slug: 'vake', ka: 'ვაკე', kaIn: 'ვაკეში', en: 'Vake', ru: 'Ваке', ruIn: 'в Ваке' },
  { slug: 'didi-dighomi', ka: 'დიდი დიღომი', kaIn: 'დიდ დიღომში', en: 'Didi Dighomi', ru: 'Диди-Дигоми', ruIn: 'в Диди-Дигоми' },
  { slug: 'gldani', ka: 'გლდანი', kaIn: 'გლდანში', en: 'Gldani', ru: 'Глдани', ruIn: 'в Глдани' },
  { slug: 'isani', ka: 'ისანი', kaIn: 'ისანში', en: 'Isani', ru: 'Исани', ruIn: 'в Исани' },
]

/** Coastal signals in Project.location / description.ka (Batumi-city projects only). */
export const SEA_VIEW_RE = /ზღვ|სანაპირო|ბულვარ|გონიო|მახინჯაური|წიხისძირი/

export const PROJECT_HUBS: Record<ProjectHubKey, Record<DirLoc, DirectoryHubCopy>> = {
  tbilisi: {
    ka: {
      title: 'მშენებარე ბინები თბილისში — ბინა ახალ კორპუსში, ფასები 2026',
      ogTitle: 'მშენებარე ბინები თბილისში | sivrce',
      description:
        'ბინა ახალ კორპუსში თბილისში: ყველა მშენებარე პროექტი ვაკეში, საბურთალოზე, ისანში, გლდანსა და დიდ დიღომში — ფასები კვადრატულზე, ჩაბარების ვადები და შიდა განვადება.',
      h1: 'მშენებარე ბინები თბილისში',
      sub: 'ბინა ახალ კორპუსში თბილისის ნებისმიერ უბანში — ფასები კვადრატულ მეტრზე, ჩაბარების ვადები და მშენებლობის რეალური პროგრესი ერთ სივრცეში',
      proseTitle: 'ბინა ახალ კორპუსში თბილისში — ბაზრის მიმოხილვა 2026',
      prose: [
        'თბილისში მშენებარე ბინების ყველაზე დიდი არჩევანი საბურთალოზეა — უნივერსიტეტებისა და მეტროს გამო; ვაკეში პრემიუმ კორპუსები $3,000–4,000/მ²-მდე ღირს, გლდანსა და დიდ დიღომში ბინა ახალ კორპუსში $1,100–1,300/მ²-დან იწყება, ისანი კი შუა სეგმენტია მეტროსთან სიახლოვით.',
        'მშენებარე ბინის ყიდვა თბილისში ჩვეულებრივ 20–30%-ით იაფია ჩაბარებულზე, დეველოპერები კი შიდა განვადებას სთავაზობენ 10–30% პირველადი შენატანით. შეადარეთ უბნები, კარკასის ტიპი და ჩაბარების ვადები, სანამ ახალ კორპუსში ბინას აირჩევთ.',
      ],
      faqTitle: 'ხშირად დასმული კითხვები',
      faqs: [
        {
          q: 'რამდენი ღირს ბინა ახალ კორპუსში თბილისში 2026 წელს?',
          a: 'ფასი უბნის მიხედვით მერყეობს: გლდანი და დიდი დიღომი — დაახლოებით $1,100–1,300/მ², ისანი და საბურთალო — $1,400–2,200/მ², ვაკე და მთაწმინდა — $3,000–4,000/მ². ზუსტი მიმდინარე ფასები ნახეთ თითოეული პროექტის გვერდზე.',
        },
        {
          q: 'რომელ უბანშია მშენებარე ბინების ყველაზე დიდი არჩევანი?',
          a: 'საბურთალოზე — ეს თბილისის ყველაზე აქტიური სამშენებლო უბანია; მას მოსდევს ისანი, ვაკე, გლდანი და დიდი დიღომი. თითოეული უბნისთვის sivrce-ზე ცალკე გვერდია ზუსტი პროექტების სიით.',
        },
        {
          q: 'შეიძლება თუ არა მშენებარე ბინის ყიდვა შიდა განვადებით?',
          a: 'დიახ — თბილისის დეველოპერების უმეტესობა გთავაზობს შიდა განვადებას: პირველადი შენატანი ჩვეულებრივ 10–30%, დარჩენილი თანხა თვიურად ჩაბარებამდე, ხშირად 0%-იანი პროცენტით.',
        },
        {
          q: 'უნდა ვიყიდო მშენებარე თუ ჩაბარებული ბინა თბილისში?',
          a: 'მშენებარე ბინა იაფია და ხელმისაწვდომია განვადებით, მაგრამ ჩაბარების ვადის გადაცილების რისკი არსებობს. ჩაბარებული ბინა მაშინვე საცხოვრებლად ან გასაქირავებლად გამოდგება — ჩაბარებული პროექტების სია ცალკე გვერდზეა.',
        },
      ],
    },
    en: {
      title: 'New Developments in Tbilisi — Apartments in New Buildings, 2026 Prices',
      ogTitle: 'New developments in Tbilisi | sivrce',
      description:
        'Apartments in new buildings in Tbilisi: every under-construction project in Vake, Saburtalo, Isani, Gldani and Didi Dighomi — price per m², handover dates and installment plans.',
      h1: 'New developments in Tbilisi',
      sub: 'Apartments in new buildings in every Tbilisi district — price per m², handover dates and real construction progress in one place.',
      proseTitle: 'Apartments in new buildings in Tbilisi — 2026 market overview',
      prose: [
        'The largest supply of new developments in Tbilisi is in Saburtalo thanks to the universities and metro; premium towers in Vake reach $3,000–4,000/m², new buildings in Gldani and Didi Dighomi start from roughly $1,100–1,300/m², and Isani is the mid-market option near the metro.',
        'Buying an under-construction apartment in Tbilisi is typically 20–30% cheaper than a completed one, and developers offer installment plans with 10–30% down. Compare districts, frame conditions and handover dates before choosing a new building.',
      ],
      faqTitle: 'Frequently asked questions',
      faqs: [
        {
          q: 'How much does an apartment in a new Tbilisi building cost in 2026?',
          a: 'Prices vary by district: Gldani and Didi Dighomi around $1,100–1,300/m², Isani and Saburtalo $1,400–2,200/m², Vake and Mtatsminda $3,000–4,000/m². See each project page for current exact prices.',
        },
        {
          q: 'Which district has the most new developments?',
          a: 'Saburtalo — it is Tbilisi’s most active construction district, followed by Isani, Vake, Gldani and Didi Dighomi. Each district has its own page on sivrce with the exact project list.',
        },
        {
          q: 'Can I buy a new-build apartment with an installment plan?',
          a: 'Yes — most Tbilisi developers offer in-house installment plans: typically 10–30% down and monthly payments until handover, often at 0% interest.',
        },
        {
          q: 'Should I buy off-plan or completed in Tbilisi?',
          a: 'Off-plan is cheaper and installment-friendly but carries handover-delay risk. A completed unit can be used or rented out immediately — see the separate completed-projects page.',
        },
      ],
    },
    ru: {
      title: 'Новостройки Тбилиси — квартиры в новых домах, цены 2026',
      ogTitle: 'Новостройки Тбилиси | sivrce',
      description:
        'Квартиры в новостройках Тбилиси: все строящиеся проекты в Ваке, Сабуртало, Исани, Глдани и Диди-Дигоми — цена за м², сроки сдачи и рассрочка от застройщика.',
      h1: 'Новостройки Тбилиси',
      sub: 'Квартиры в новостройках во всех районах Тбилиси — цена за м², сроки сдачи и реальный ход строительства в одном месте.',
      proseTitle: 'Квартиры в новостройках Тбилиси — обзор рынка 2026',
      prose: [
        'Больше всего новостроек Тбилиси строится в Сабуртало — из-за университетов и метро; премиум-корпуса в Ваке стоят $3,000–4,000/м², в Глдани и Диди-Дигоми квартиры в новостройках начинаются примерно от $1,100–1,300/м², а Исани — средний сегмент рядом с метро.',
        'Купить квартиру в строящемся доме Тбилиси обычно на 20–30% дешевле готовой, а застройщики предлагают рассрочку с первым взносом 10–30%. Сравнивайте районы, тип каркаса и сроки сдачи, прежде чем выбрать новостройку.',
      ],
      faqTitle: 'Частые вопросы',
      faqs: [
        {
          q: 'Сколько стоит квартира в новостройке Тбилиси в 2026 году?',
          a: 'Цена зависит от района: Глдани и Диди-Дигоми — около $1,100–1,300/м², Исани и Сабуртало — $1,400–2,200/м², Ваке и Мтацминда — $3,000–4,000/м². Точные цены — на странице каждого проекта.',
        },
        {
          q: 'В каком районе больше всего новостроек?',
          a: 'В Сабуртало — это самый активный строительный район Тбилиси, дальше идут Исани, Ваке, Глдани и Диди-Дигоми. Для каждого района на Sivrce есть отдельная страница со списком проектов.',
        },
        {
          q: 'Можно ли купить новостройку в рассрочку?',
          a: 'Да — большинство застройщиков Тбилиси предлагают внутреннюю рассрочку: первый взнос обычно 10–30%, остаток — ежемесячно до сдачи, часто под 0%.',
        },
        {
          q: 'Что лучше в Тбилиси: строящаяся или готовая квартира?',
          a: 'Строящаяся дешевле и доступна в рассрочку, но есть риск переноса сроков. Готовой квартирой можно сразу пользоваться — список сданных проектов на отдельной странице.',
        },
      ],
    },
  },
  batumi: {
    ka: {
      title: 'მშენებარე ბინები ბათუმში — ბინა ახალ კორპუსში ზღვასთან, ფასები 2026',
      ogTitle: 'მშენებარე ბინები ბათუმში | sivrce',
      description:
        'ბინები ბათუმის ახალ კორპუსებში: მშენებარე პროექტები ზღვის პირველ ხაზზე და ცენტრში — ფასები კვადრატულზე, ჩაბარების ვადები და შიდა განვადება ერთ სივრცეში.',
      h1: 'მშენებარე ბინები ბათუმში',
      sub: 'ბინა ახალ კორპუსში ბათუმში — ზღვისპირა პროექტებიდან ცენტრის კომპლექსებამდე, ფასებითა და ჩაბარების ვადებით',
      proseTitle: 'ბინა ახალ კორპუსში ბათუმში — ბაზრის მიმოხილვა 2026',
      prose: [
        'ბათუმი საქართველოს საკურორტო უძრავი ქონების დედაქალაქია: ახალი კორპუსები ზღვის პირველ ხაზზე, ახალ ბულვარსა და ცენტრში ერთდროულად შენდება. მშენებარე ბინების ფასი $1,200–1,500/მ²-დან იწყება, პირველი ხაზის პროექტები კი $2,500–3,500/მ²-ს აღწევს.',
        'ბათუმში ბინის ყიდვის მთავარი მოტივი გაქირავების შემოსავალია — ტურისტული სეზონი მოკლე ვადიანი ქირით მაღალ ROI-ს იძლევა. შეადარეთ ზღვასთან სიახლოვე, დეველოპერის სანდოობა და ჩაბარების ვადა, სანამ მშენებარე ბინას აირჩევთ.',
      ],
      faqTitle: 'ხშირად დასმული კითხვები',
      faqs: [
        {
          q: 'რამდენი ღირს ბინა ახალ კორპუსში ბათუმში 2026 წელს?',
          a: 'მეორე ხაზისა და ცენტრის პროექტები დაახლოებით $1,200–1,800/მ² ღირს, ზღვის პირველი ხაზი — $2,500–3,500/მ². ზუსტი მიმდინარე ფასები ნახეთ თითოეული პროექტის გვერდზე.',
        },
        {
          q: 'რომელ უბნებში ღირს ბათუმში ბინის ყიდვა?',
          a: 'ახალი ბულვარი და პირველი ხაზი — გაქირავებისთვის; ძველი ბათუმი — ატმოსფეროსთვის; მახინჯაური და გონიო — უფრო მშვიდი ზღვისპირა ვარიანტები. ზღვასთან პროექტების ცალკე სია sivrce-ზეა.',
        },
        {
          q: 'გაიცემა თუ არა შიდა განვადება ბათუმის პროექტებზე?',
          a: 'დიახ — ბათუმის დეველოპერების უმეტესობა იძლევა შიდა განვადებას 10–30% პირველადი შენატანით ჩაბარებამდე, ხშირად 0%-იანი პროცენტით.',
        },
        {
          q: 'კარგი ინვესტიციაა თუ არა ბათუმში ბინის ყიდვა?',
          a: 'ბათუმში მშენებლობის ეტაპზე ყიდილი ბინა ჩაბარებამდე, როგორც წესი, იზრდება ღირებულებაში; ზღვისპირა პროექტების სეზონური ქირა ქვეყანაში უმაღლესია. შეადარეთ პროექტების ფასი და ლოკაცია sivrce-ზე.',
        },
      ],
    },
    en: {
      title: 'New Developments in Batumi — Apartments in New Buildings by the Sea',
      ogTitle: 'New developments in Batumi | sivrce',
      description:
        'Apartments in new buildings in Batumi: under-construction projects on the first sea line and downtown — price per m², handover dates and installment plans in one place.',
      h1: 'New developments in Batumi',
      sub: 'Apartments in new buildings in Batumi — from first-line seaside projects to central complexes, with prices and handover dates.',
      proseTitle: 'Apartments in new buildings in Batumi — 2026 market overview',
      prose: [
        'Batumi is Georgia’s resort real-estate capital: new buildings rise on the first sea line, along the New Boulevard and downtown at once. Under-construction prices start around $1,200–1,500/m², while first-line projects reach $2,500–3,500/m².',
        'The main reason to buy in Batumi is rental income — the tourist season delivers some of the highest short-let ROI in the country. Compare sea proximity, developer reliability and handover dates before choosing a new building.',
      ],
      faqTitle: 'Frequently asked questions',
      faqs: [
        {
          q: 'How much does an apartment in a new Batumi building cost in 2026?',
          a: 'Second-line and downtown projects cost roughly $1,200–1,800/m², the first sea line $2,500–3,500/m². See each project page for current exact prices.',
        },
        {
          q: 'Which areas are best for buying in Batumi?',
          a: 'The New Boulevard and first line for rentals; Old Batumi for character; Makhinjauri and Gonio for quieter seaside options. Sea-side projects have their own list on sivrce.',
        },
        {
          q: 'Do Batumi projects offer installment plans?',
          a: 'Yes — most Batumi developers offer in-house installment plans with 10–30% down until handover, often at 0% interest.',
        },
        {
          q: 'Is buying an apartment in Batumi a good investment?',
          a: 'Units bought during construction in Batumi typically appreciate by handover, and seaside projects command the country’s highest seasonal rents. Compare project prices and locations on sivrce.',
        },
      ],
    },
    ru: {
      title: 'Новостройки Батуми — квартиры в новых домах у моря, цены 2026',
      ogTitle: 'Новостройки Батуми | sivrce',
      description:
        'Квартиры в новостройках Батуми: строящиеся проекты на первой линии моря и в центре — цена за м², сроки сдачи и рассрочка от застройщика в одном месте.',
      h1: 'Новостройки Батуми',
      sub: 'Квартиры в новостройках Батуми — от проектов на первой линии до комплексов в центре, с ценами и сроками сдачи.',
      proseTitle: 'Квартиры в новостройках Батуми — обзор рынка 2026',
      prose: [
        'Батуми — курортная столица недвижимости Грузии: новостройки растут на первой линии моря, на Новом бульваре и в центре одновременно. Цены на строящиеся квартиры начинаются от $1,200–1,500/м², проекты первой линии достигают $2,500–3,500/м².',
        'Главная причина покупки в Батуми — доход от аренды: туристический сезон даёт одну из самых высоких доходностей посуточной аренды в стране. Сравнивайте близость к морю, надёжность застройщика и сроки сдачи перед выбором новостройки.',
      ],
      faqTitle: 'Частые вопросы',
      faqs: [
        {
          q: 'Сколько стоит квартира в новостройке Батуми в 2026 году?',
          a: 'Проекты второй линии и центра стоят примерно $1,200–1,800/м², первая линия моря — $2,500–3,500/м². Точные цены смотрите на странице каждого проекта.',
        },
        {
          q: 'В каких районах Батуми лучше покупать квартиру?',
          a: 'Новый бульвар и первая линия — для аренды; Старый Батуми — ради атмосферы; Махинджаури и Гонио — более спокойные варианты у моря. Проекты у моря собраны на отдельной странице Sivrce.',
        },
        {
          q: 'Есть ли рассрочка на новостройки Батуми?',
          a: 'Да — большинство застройщиков Батуми предлагают внутреннюю рассрочку с первым взносом 10–30% до сдачи дома, часто под 0%.',
        },
        {
          q: 'Выгодно ли покупать квартиру в Батуми для инвестиций?',
          a: 'Квартиры, купленные в Батуми на этапе строительства, как правило, дорожают к сдаче, а проекты у моря дают самую высокую сезонную аренду в стране. Сравнивайте цены и локации на Sivrce.',
        },
      ],
    },
  },
  seaView: {
    ka: {
      title: 'ბინები ბათუმში ზღვასთან — ზღვის ხედით ახალ კორპუსებში, ფასები 2026',
      ogTitle: 'ბინები ბათუმში ზღვასთან | sivrce',
      description:
        'ბინები ბათუმში ზღვასთან: ზღვის ხედითა და პირველი ხაზის ახალი კორპუსები — ფასები კვადრატულზე, ჩაბარების ვადები და შიდა განვადება ერთ სივრცეში.',
      h1: 'ბინები ბათუმში ზღვასთან',
      sub: 'ზღვის ხედითა და სანაპიროსთან ახლოს ახალი კორპუსები ბათუმში — ფასებით, ჩაბარების ვადებითა და მშენებლობის პროგრესით',
      proseTitle: 'ბინები ბათუმში ზღვასთან — ბაზრის მიმოხილვა 2026',
      prose: [
        'ბათუმში ზღვასთან ბინა ყველაზე მოთხოვნადი ფორმატია: პირველი ხაზისა და ბულვარის ახალი კორპუსები სტაბილურად იქირავება ტურისტულ სეზონში. აქ შეგროვებულია პროექტები ზღვის ხედით ან სანაპიროსთან უშუალო სიახლოვით — მახინჯაურიდან ახალი ბულვარამდე.',
        'ზღვის ხედით ბინა მეორე ხაზზეც მაღალ სართულზე ხელმისაწვდომია — ფასი ხედის, სართულისა და ხაზის მიხედვით მერყეობს დაახლოებით $1,500–3,500/მ² შუალედში. შეადარეთ პროექტები და აირჩიეთ ბინა ბათუმში ზღვასთან საცხოვრებლად ან გასაქირავებლად.',
      ],
      faqTitle: 'ხშირად დასმული კითხვები',
      faqs: [
        {
          q: 'რამდენი ღირს ბინა ბათუმში ზღვასთან 2026 წელს?',
          a: 'ზღვის ხედით ან პირველ ხაზზე ფასი დაახლოებით $1,800–3,500/მ² მერყეობს, ხაზიდან დაშორებისა და სართულის მიხედვით. ზუსტი მიმდინარე ფასები ნახეთ თითოეული პროექტის გვერდზე.',
        },
        {
          q: 'რა განსხვავებაა პირველ და მეორე ხაზს შორის?',
          a: 'პირველი ხაზი — სანაპიროსთან უშუალო სიახლოვე, უმაღლესი ფასითა და გაქირავების შემოსავლით; მეორე ხაზი უფრო იაფია, ხოლო ზღვის ხედი მაღალ სართულებზე მაინც რჩება.',
        },
        {
          q: 'შეიძლება თუ არა ზღვასთან ბინის ყიდვა შიდა განვადებით?',
          a: 'დიახ — ზღვისპირა პროექტების უმეტესობა იძლევა შიდა განვადებას: პირველადი შენატანი ჩვეულებრივ 10–30%, გადახდა ჩაბარებამდე.',
        },
        {
          q: 'რამდენად მომგებიანია ზღვასთან ბინის გაქირავება?',
          a: 'ბათუმის ზღვისპირა ბინების სეზონური მოკლე ვადიანი ქირა ქვეყანაში უმაღლესია — ხედითა და პირველი ხაზით ფასი და დაკავება ორივე იზრდება. შეადარეთ პროექტების ლოკაცია და ფასი sivrce-ზე.',
        },
      ],
    },
    en: {
      title: 'Sea View Apartments in Batumi — New Buildings by the Sea, 2026 Prices',
      ogTitle: 'Sea view apartments in Batumi | sivrce',
      description:
        'Sea view apartments in Batumi: new buildings with sea views and first-line locations — price per m², handover dates and installment plans in one place.',
      h1: 'Sea view apartments in Batumi',
      sub: 'New buildings with sea views or right by the beach in Batumi — with prices, handover dates and construction progress.',
      proseTitle: 'Sea view apartments in Batumi — 2026 market overview',
      prose: [
        'An apartment by the sea is the most demanded format in Batumi: first-line and boulevard new buildings rent out steadily through the tourist season. This page collects projects with sea views or immediate beach proximity — from Makhinjauri to the New Boulevard.',
        'Sea-view units are also available on higher floors off the first line — prices vary by view, floor and line, roughly in the $1,500–3,500/m² range. Compare projects and pick an apartment by the sea in Batumi to live in or rent out.',
      ],
      faqTitle: 'Frequently asked questions',
      faqs: [
        {
          q: 'How much does a sea view apartment in Batumi cost in 2026?',
          a: 'With a sea view or on the first line, prices range around $1,800–3,500/m² depending on distance and floor. See each project page for current exact prices.',
        },
        {
          q: 'What is the difference between first and second line?',
          a: 'First line means immediate beach proximity with the highest price and rental income; the second line is cheaper while upper floors often keep the sea view.',
        },
        {
          q: 'Can I buy a sea view apartment with an installment plan?',
          a: 'Yes — most seaside projects offer in-house installment plans: typically 10–30% down with payments until handover.',
        },
        {
          q: 'How profitable is renting out a sea view apartment?',
          a: 'Batumi’s seaside apartments earn the country’s highest seasonal short-let income — a view and first line raise both the rate and occupancy. Compare locations and prices on sivrce.',
        },
      ],
    },
    ru: {
      title: 'Квартиры у моря в Батуми — новостройки с видом на море, цены 2026',
      ogTitle: 'Квартиры у моря в Батуми | sivrce',
      description:
        'Квартиры у моря в Батуми: новостройки с видом на море и на первой линии — цена за м², сроки сдачи и рассрочка от застройщика в одном месте.',
      h1: 'Квартиры у моря в Батуми',
      sub: 'Новостройки с видом на море и рядом с пляжем в Батуми — с ценами, сроками сдачи и ходом строительства.',
      proseTitle: 'Квартиры у моря в Батуми — обзор рынка 2026',
      prose: [
        'Квартира у моря — самый востребованный формат в Батуми: новостройки первой линии и бульвара стабильно сдаются в туристический сезон. Здесь собраны проекты с видом на море или в шаге от пляжа — от Махинджаури до Нового бульвара.',
        'Вид на море доступен и на высоких этажах второй линии — цена зависит от вида, этажа и линии и колеблется примерно в диапазоне $1,500–3,500/м². Сравнивайте проекты и выбирайте квартиру у моря в Батуми для жизни или сдачи в аренду.',
      ],
      faqTitle: 'Частые вопросы',
      faqs: [
        {
          q: 'Сколько стоит квартира у моря в Батуми в 2026 году?',
          a: 'С видом на море или на первой линии цены колеблются около $1,800–3,500/м² в зависимости от расстояния и этажа. Точные цены — на странице каждого проекта.',
        },
        {
          q: 'Чем первая линия отличается от второй?',
          a: 'Первая линия — непосредственная близость к пляжу, самая высокая цена и доход от аренды; вторая линия дешевле, а вид на море часто сохраняется на верхних этажах.',
        },
        {
          q: 'Можно ли купить квартиру у моря в рассрочку?',
          a: 'Да — большинство проектов у моря предлагают внутреннюю рассрочку: первый взнос обычно 10–30%, выплаты до сдачи дома.',
        },
        {
          q: 'Насколько выгодна аренда квартиры у моря?',
          a: 'Квартиры у моря в Батуми дают самый высокий сезонный доход посуточной аренды в стране — вид и первая линия повышают и ставку, и заполняемость. Сравнивайте локации и цены на Sivrce.',
        },
      ],
    },
  },
  installment: {
    ka: {
      title: 'ბინები შიდა განვადებით — ახალი კორპუსები თბილისსა და ბათუმში',
      ogTitle: 'ბინები შიდა განვადებით | sivrce',
      description:
        'ბინები შიდა განვადებით დეველოპერებისგან: 10–30% პირველადი შენატანი, 0% პროცენტი ჩაბარებამდე — ყველა მშენებარე პროექტი თბილისსა და ბათუმში ერთ სივრცეში.',
      h1: 'ბინები შიდა განვადებით',
      sub: 'დეველოპერის შიდა განვადება ყველა მშენებარე პროექტზე — პირველადი შენატანი 10–30%-დან, გადახდა ჩაბარებამდე',
      proseTitle: 'შიდა განვადება — როგორ მუშაობს',
      prose: [
        'შიდა განვადება დეველოპერის საკუთარი დაფინანსებაა ბანკის გარეშე: იხდით პირველად შენატანს — ჩვეულებრივ ღირებულების 10–30%-ს — და დარჩენილ თანხას თვიური გადასახადებით ბინის ჩაბარებამდე, ხშირად 0%-იანი პროცენტით. ეს ბინის ყიდვის ყველაზე მარტივი გზაა იპოთეკის შეწყვეტილი პროცედურების გარეშე.',
        'ამ გვერდზე შეგროვებულია ყველა მშენებარე პროექტი თბილისსა და ბათუმში, სადაც შიდა განვადება ხელმისაწვდომია — მშენებლობის დასრულებამდე განვადება თითქმის ყოველთვის გაიცემა. ზუსტი პირობები თითოეულ დეველოპერთან ინდივიდუალურია — დაადასტურეთ გაყიდვების ოფისში.',
      ],
      faqTitle: 'ხშირად დასმული კითხვები',
      faqs: [
        {
          q: 'რა არის შიდა განვადება?',
          a: 'შიდა განვადება დეველოპერის განვადებაა ბანკის გარეშე: პირველადი შენატანი ჩვეულებრივ 10–30%, დარჩენილი თანხა — თვიურად ჩაბარებამდე, ხშირად 0% პროცენტით. პირობები თითოეულ დეველოპერთან ინდივიდუალურია.',
        },
        {
          q: 'რა განსხვავებაა შიდა განვადებასა და იპოთეკას შორის?',
          a: 'იპოთეკა საბანკო სესხია პროცენტით, შემოსავლის დადასტურებითა და უფრო გრძელი ვადით; შიდა განვადება დეველოპერთან ხელშეკრულებაა — უფრო სწრაფი, უპროცენტო, მაგრამ ჩაბარებამდე შეზღუდული ვადით.',
        },
        {
          q: 'შეუძლია თუ არა უცხოელს შიდა განვადებით ყიდვა?',
          a: 'დიახ — შიდა განვადება დეველოპერის შინაგანი პირობაა და მოქალაქეობას არ უკავშირდება; უცხოელებს საქართველოში ბინის ყიდვა თავისუფლად შეუძლიათ.',
        },
        {
          q: 'რა ხდება, თუ გადასახადს ვერ დავიჭერ?',
          a: 'პირობები ხელშეკრულებით რეგულირდება — ჩვეულებრივ გრაფიკის კორექტირება ან პირველადი შენატანის ნაწილის დაკავებაა შესაძლებელი. ხელშეკრულების დეტალები წინასწარ წაიკითხეთ და დაადასტურეთ დეველოპერთან.',
        },
      ],
    },
    en: {
      title: 'Apartments with Developer Installment Plans — Tbilisi & Batumi',
      ogTitle: 'Apartments with installment plans | sivrce',
      description:
        'Apartments with developer installment plans: 10–30% down, 0% interest until handover — every under-construction project in Tbilisi and Batumi in one place.',
      h1: 'Apartments with an installment plan',
      sub: 'Developer installment plans on every under-construction project — from 10–30% down, payments until handover.',
      proseTitle: 'How a developer installment plan works',
      prose: [
        'A developer installment plan is the developer’s own financing without a bank: you pay a down payment — usually 10–30% of the price — and the rest in monthly installments until handover, often at 0% interest. It is the simplest way to buy an apartment without mortgage paperwork.',
        'This page collects every under-construction project in Tbilisi and Batumi where an installment plan is available — during construction it is almost always offered. Exact terms are individual per developer — confirm with the sales office.',
      ],
      faqTitle: 'Frequently asked questions',
      faqs: [
        {
          q: 'What is a developer installment plan?',
          a: 'It is the developer’s own financing without a bank: typically 10–30% down and monthly payments until handover, often at 0% interest. Terms are individual per developer.',
        },
        {
          q: 'How does it differ from a mortgage?',
          a: 'A mortgage is a bank loan with interest, income proof and a longer term; an installment plan is a contract with the developer — faster and interest-free, but limited to the construction period.',
        },
        {
          q: 'Can foreigners buy with an installment plan?',
          a: 'Yes — an installment plan is the developer’s internal term and is not tied to citizenship; foreigners can freely buy apartments in Georgia.',
        },
        {
          q: 'What happens if I miss a payment?',
          a: 'Terms are set by the contract — usually a schedule adjustment or partial retention of the down payment. Read the contract carefully and confirm details with the developer.',
        },
      ],
    },
    ru: {
      title: 'Квартиры в рассрочку от застройщика — Тбилиси и Батуми',
      ogTitle: 'Квартиры в рассрочку от застройщика | sivrce',
      description:
        'Квартиры в рассрочку от застройщика: первый взнос 10–30%, 0% до сдачи дома — все строящиеся проекты Тбилиси и Батуми в одном месте.',
      h1: 'Квартиры в рассрочку от застройщика',
      sub: 'Внутренняя рассрочка на все строящиеся проекты — первый взнос от 10–30%, выплаты до сдачи дома.',
      proseTitle: 'Как работает рассрочка от застройщика',
      prose: [
        'Рассрочка от застройщика — это собственное финансирование девелопера без банка: вы платите первый взнос — обычно 10–30% стоимости — и остаток ежемесячными платежами до сдачи дома, часто под 0%. Это самый простой способ купить квартиру без ипотечных процедур.',
        'На этой странице собраны все строящиеся проекты Тбилиси и Батуми, где доступна рассрочка — на этапе строительства она предлагается почти всегда. Точные условия индивидуальны у каждого застройщика — уточняйте в офисе продаж.',
      ],
      faqTitle: 'Частые вопросы',
      faqs: [
        {
          q: 'Что такое рассрочка от застройщика?',
          a: 'Это финансирование от самого застройщика без банка: первый взнос обычно 10–30%, остаток — ежемесячно до сдачи дома, часто под 0%. Условия индивидуальны у каждого застройщика.',
        },
        {
          q: 'Чем рассрочка отличается от ипотеки?',
          a: 'Ипотека — банковский кредит с процентом, подтверждением дохода и длинным сроком; рассрочка — договор с застройщиком: быстрее и без процентов, но ограничена сроком строительства.',
        },
        {
          q: 'Могут ли иностранцы купить в рассрочку?',
          a: 'Да — рассрочка является внутренним условием застройщика и не связана с гражданством; иностранцы могут свободно покупать квартиры в Грузии.',
        },
        {
          q: 'Что будет, если я пропущу платёж?',
          a: 'Условия определяются договором — обычно возможна корректировка графика или частичное удержание первого взноса. Внимательно читайте договор и уточняйте детали у застройщика.',
        },
      ],
    },
  },
  ready: {
    ka: {
      title: 'ჩაბარებული ბინები ახალ კორპუსებში — მზა საცხოვრებლად, ფასები 2026',
      ogTitle: 'ჩაბარებული ახალი კორპუსები | sivrce',
      description:
        'ჩაბარებული ბინები ახალ კორპუსებში თბილისსა და ბათუმში: მზა საცხოვრებლად ან გასაქირავებლად — ფასები კვადრატულზე და ლოკაციები ერთ სივრცეში.',
      h1: 'ჩაბარებული ახალი კორპუსები',
      sub: 'მზა ბინები ჩაბარებულ პროექტებში — შედი და იცხოვრე ან გააქირავე დაუყოვნებლივ',
      proseTitle: 'ჩაბარებული ბინა — რატომ ღირს',
      prose: [
        'ჩაბარებული ბინა ახალ კორპუსში ნიშნავს ნულოვან მოლოდინს: სახლი დასრულებულია, კომუნიკაციები შეერთებულია და ბინა მაშინვე შეგიძლიათ გამოიყენოთ ან გააქირაოთ. ამ გვერდზე შეგროვებულია პროექტები, რომლებიც უკვე 100%-ით აშენებულია.',
        'ჩაბარებული ბინა მშენებარეზე ოდნავ ძვირი ღირს, მაგრამ რისკების გარეშე — ხედავთ ზუსტად რას ყიდულობთ. შეადარეთ ფასები, უბნები და დარჩენილი ბინების მარაგი თბილისსა და ბათუმში.',
      ],
      faqTitle: 'ხშირად დასმული კითხვები',
      faqs: [
        {
          q: 'რას ნიშნავს ჩაბარებული ბინა?',
          a: 'კორპუსი სრულად დასრულებულია და ექსპლუატაციაშია ჩაბარებული — ბინის რეგისტრაცია და გამოყენება დაუყოვნებლივ შეიძლება. ამ სიაში მხოლოდ 100%-ით აშენებული პროექტებია.',
        },
        {
          q: 'რამდენით ძვირია ჩაბარებული ბინა მშენებარესთან შედარებით?',
          a: 'ჩვეულებრივ 15–30%-ით — მშენებლობის ეტაპზე ფასი უფრო დაბალია და ჩაბარებასთან იზრდება. ზუსტი სხვაობა პროექტისა და უბნის მიხედვით განსხვავდება.',
        },
        {
          q: 'შეიძლება თუ არა ჩაბარებული ბინის განვადებით ყიდვა?',
          a: 'ზოგი დეველოპერი ჩაბარებულ მარაგზეც ინარჩუნებს განვადებას, მაგრამ უფრო ხშირია სრული გადახდა ან იპოთეკა. პირობები თითოეული პროექტისთვის დაადასტურეთ გაყიდვების ოფისში.',
        },
        {
          q: 'როგორ შევამოწმო ჩაბარებული კორპუსის ხარისხს?',
          a: 'უპირატესობა სწორედ ისაა, რომ ყველაფერი თვალსაჩინოა: შეათვალიერეთ საერთო სივრცეები, ლიფტები, ეზო და ბინის კარკასი ადგილზე; დეველოპერის ჩაბარებული ისტორია და მიმოხილვები ნახეთ sivrce-ზე.',
        },
      ],
    },
    en: {
      title: 'Ready-to-Move Apartments in New Buildings — Completed Projects',
      ogTitle: 'Ready-to-move new buildings | sivrce',
      description:
        'Ready-to-move apartments in completed new buildings in Tbilisi and Batumi — move in or rent out immediately; price per m² and locations in one place.',
      h1: 'Ready-to-move new buildings',
      sub: 'Finished apartments in completed projects — move in or rent out immediately.',
      proseTitle: 'Why a completed apartment pays off',
      prose: [
        'A completed apartment in a new building means zero waiting: the building is finished, utilities are connected and you can use or rent out the unit immediately. This page collects projects that are already 100% built.',
        'A completed unit costs slightly more than an off-plan one but comes without the risk — you see exactly what you buy. Compare prices, districts and remaining inventory in Tbilisi and Batumi.',
      ],
      faqTitle: 'Frequently asked questions',
      faqs: [
        {
          q: 'What does a completed apartment mean?',
          a: 'The building is fully finished and commissioned — registration and use can start immediately. This list contains only projects that are 100% built.',
        },
        {
          q: 'How much more expensive is a completed unit than off-plan?',
          a: 'Typically 15–30% — prices are lower during construction and rise toward handover. The exact gap varies by project and district.',
        },
        {
          q: 'Can I buy a completed apartment with an installment plan?',
          a: 'Some developers keep installment terms on completed stock, but full payment or a mortgage is more common. Confirm terms per project with the sales office.',
        },
        {
          q: 'How do I check the quality of a completed building?',
          a: 'The advantage is that everything is visible: inspect common areas, elevators, the yard and the unit’s frame on site; the developer’s delivery history and reviews are on sivrce.',
        },
      ],
    },
    ru: {
      title: 'Сданные новостройки — готовые квартиры в Тбилиси и Батуми',
      ogTitle: 'Сданные новостройки | sivrce',
      description:
        'Готовые квартиры в сданных новостройках Тбилиси и Батуми — заезжайте и живите или сдавайте сразу; цена за м² и локации в одном месте.',
      h1: 'Сданные новостройки',
      sub: 'Готовые квартиры в сданных проектах — заезжайте или сдавайте в аренду сразу.',
      proseTitle: 'Почему готовая квартира выгодна',
      prose: [
        'Готовая квартира в новостройке — это нулевое ожидание: дом достроен, коммуникации подключены, квартирой можно пользоваться или сдавать сразу. На этой странице собраны проекты, которые уже построены на 100%.',
        'Готовая квартира стоит немного дороже строящейся, но без рисков — вы видите именно то, что покупаете. Сравнивайте цены, районы и оставшийся фонд в Тбилиси и Батуми.',
      ],
      faqTitle: 'Частые вопросы',
      faqs: [
        {
          q: 'Что значит сданная новостройка?',
          a: 'Дом полностью достроен и введён в эксплуатацию — регистрация и пользование квартирой возможны сразу. В этом списке только проекты со 100% готовностью.',
        },
        {
          q: 'Насколько готовая квартира дороже строящейся?',
          a: 'Обычно на 15–30% — на этапе строительства цена ниже и растёт к сдаче. Точная разница зависит от проекта и района.',
        },
        {
          q: 'Можно ли купить готовую квартиру в рассрочку?',
          a: 'Некоторые застройщики сохраняют рассрочку на сданный фонд, но чаще это полная оплата или ипотека. Условия по каждому проекту уточняйте в офисе продаж.',
        },
        {
          q: 'Как проверить качество сданного дома?',
          a: 'Преимущество как раз в том, что всё видно: осмотрите общие зоны, лифты, двор и состояние квартиры на месте; история сдач и отзывы о застройщике — на Sivrce.',
        },
      ],
    },
  },
}

/** Tbilisi district hub copy — parameterized (devFaqs/projectFaqs precedent). */
export function districtHubCopy(loc: DirLoc, d: DistrictHub, count: number): DirectoryHubCopy {
  if (loc === 'ka') {
    return {
      title: `მშენებარე ბინები ${d.kaIn} — ბინა ახალ კორპუსში, ფასები 2026`,
      ogTitle: `მშენებარე ბინები ${d.kaIn} | sivrce`,
      description: `ბინა ახალ კორპუსში ${d.kaIn}: ${count} მშენებარე პროექტი — ფასები კვადრატულზე, ჩაბარების ვადები და შიდა განვადება ერთ სივრცეში.`,
      h1: `მშენებარე ბინები ${d.kaIn}`,
      sub: `ბინა ახალ კორპუსში ${d.kaIn} — ფასები კვადრატულ მეტრზე, ჩაბარების ვადები და მშენებლობის რეალური პროგრესი`,
      proseTitle: `ბინა ახალ კორპუსში ${d.kaIn} — მიმოხილვა`,
      prose: [
        `${d.kaIn} ამჟამად ${count} მშენებარე პროექტია sivrce-ზე — თითოეულზე მითითებულია კვადრატული მეტრის ფასი, მშენებლობის პროგრესი პროცენტებში და ჩაბარების ვადა. ბინა ახალ კორპუსში ${d.kaIn} მშენებლობის ეტაპზე ჩაბარებულზე იაფია, დეველოპერები კი შიდა განვადებას იძლევიან.`,
      ],
      faqTitle: 'ხშირად დასმული კითხვები',
      faqs: [
        {
          q: `რამდენი ღირს ბინა ახალ კორპუსში ${d.kaIn}?`,
          a: `ფასები ${d.kaIn} პროექტის, სართულისა და კარკასის ტიპის მიხედვით მერყეობს — ზუსტი მიმდინარე ფასები ნახეთ თითოეული პროექტის გვერდზე. მშენებლობის ეტაპზე ყიდვა ჩაბარებულზე ჩვეულებრივ იაფია.`,
        },
        {
          q: `რამდენი მშენებარე პროექტია ${d.kaIn}?`,
          a: `ამჟამად ${count} აქტიური პროექტია sivrce-ზე ${d.kaIn}. სია რეგულარულად ახლდება ახალი კორპუსებით.`,
        },
        {
          q: `შეიძლება თუ არა შიდა განვადებით ყიდვა ${d.kaIn}?`,
          a: `დიახ — ${d.kaIn} მშენებარე პროექტების უმეტესობა შიდა განვადებას იძლევა: პირველადი შენატანი ჩვეულებრივ 10–30%, გადახდა ჩაბარებამდე, ხშირად 0%-იანი პროცენტით.`,
        },
      ],
    }
  }
  if (loc === 'ru') {
    return {
      title: `Новостройки ${d.ruIn} — квартиры в новых домах Тбилиси, цены 2026`,
      ogTitle: `Новостройки ${d.ruIn} | sivrce`,
      description: `Квартиры в новостройках ${d.ruIn}: ${count} ${ruPlural(count, 'строящийся проект', 'строящихся проекта', 'строящихся проектов')} — цена за м², сроки сдачи и рассрочка в одном месте.`,
      h1: `Новостройки ${d.ruIn}`,
      sub: `Квартиры в новостройках ${d.ruIn} — цена за м², сроки сдачи и реальный ход строительства.`,
      proseTitle: `Квартиры в новостройках ${d.ruIn} — обзор`,
      prose: [
        `${d.ruIn.charAt(0).toUpperCase()}${d.ruIn.slice(1)} сейчас ${count} ${ruPlural(count, 'строящийся проект', 'строящихся проекта', 'строящихся проектов')} на Sivrce — для каждого указаны цена за квадратный метр, процент готовности и срок сдачи. Квартира в новостройке ${d.ruIn} на этапе строительства дешевле готовой, а застройщики предлагают внутреннюю рассрочку.`,
      ],
      faqTitle: 'Частые вопросы',
      faqs: [
        {
          q: `Сколько стоит квартира в новостройке ${d.ruIn}?`,
          a: `Цены ${d.ruIn} зависят от проекта, этажа и типа каркаса — точные текущие цены смотрите на странице каждого проекта. Покупка на этапе строительства обычно дешевле готовой квартиры.`,
        },
        {
          q: `Сколько новостроек строится ${d.ruIn}?`,
          a: `Сейчас на Sivrce ${d.ruIn} — ${count} ${ruPlural(count, 'активный проект', 'активных проекта', 'активных проектов')}. Список регулярно пополняется новыми корпусами.`,
        },
        {
          q: `Можно ли купить ${d.ruIn} квартиру в рассрочку?`,
          a: `Да — большинство строящихся проектов ${d.ruIn} предлагают внутреннюю рассрочку: первый взнос обычно 10–30%, выплаты до сдачи, часто под 0%.`,
        },
      ],
    }
  }
  return {
    title: `New Developments in ${d.en}, Tbilisi — Apartments in New Buildings`,
    ogTitle: `New developments in ${d.en} | sivrce`,
    description: `Apartments in new buildings in ${d.en}, Tbilisi: ${count} under-construction ${count === 1 ? 'project' : 'projects'} — price per m², handover dates and installment plans.`,
    h1: `New developments in ${d.en}`,
    sub: `Apartments in new buildings in ${d.en} — price per m², handover dates and real construction progress.`,
    proseTitle: `Apartments in new buildings in ${d.en} — overview`,
    prose: [
      `${d.en} currently has ${count} under-construction ${count === 1 ? 'project' : 'projects'} on sivrce — each shows price per square meter, construction progress in percent and handover date. An apartment in a new building in ${d.en} bought during construction is cheaper than a completed one, and developers offer installment plans.`,
    ],
    faqTitle: 'Frequently asked questions',
    faqs: [
      {
        q: `How much does an apartment in a new building in ${d.en} cost?`,
        a: `Prices in ${d.en} vary by project, floor and frame condition — see each project page for current exact prices. Buying during construction is usually cheaper than a completed unit.`,
      },
      {
        q: `How many new developments are being built in ${d.en}?`,
        a: `There are currently ${count} active ${count === 1 ? 'project' : 'projects'} in ${d.en} on sivrce. The list is updated regularly with new buildings.`,
      },
      {
        q: `Can I buy in ${d.en} with an installment plan?`,
        a: `Yes — most under-construction projects in ${d.en} offer in-house installment plans: typically 10–30% down with payments until handover, often at 0% interest.`,
      },
    ],
  }
}
