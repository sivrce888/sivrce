/**
 * SIVRCE — Professionals & new-build projects data layer.
 * Developers, agents/agencies and new projects. Static client-side data, same
 * pattern as @/data/listings — a future API can replace these arrays.
 *
 * Deterministic listing matching (used by entity pages):
 *  - agents     → `listing.agent.name === profile.name.ka`
 *  - developers → listings in the developer's home city
 *  - projects   → listings in the project's city
 */

import { LISTINGS, type Listing } from './listings'

export interface LocalName {
  ka: string
  en: string
  ru: string
}

export interface LocalText {
  ka: string
  en: string
  ru: string
}

export interface Developer {
  slug: string
  name: LocalName
  /** ka city name — matches Listing.city for deterministic filtering */
  city: string
  yearsActive: number
  projectsDone: number
  unitsDelivered: number
  description: LocalText
  verified: boolean
  phone: string
}

export interface AgentProfile {
  slug: string
  /** name.ka MUST equal Listing.agent.name for deterministic matching */
  name: LocalName
  agency: string
  city: string
  yearsActive: number
  dealsClosed: number
  languages: string[]
  description: LocalText
  verified: boolean
  phone: string
}

export interface Project {
  slug: string
  name: string
  developerSlug: string
  img: string
  location: string
  /** ka city name — matches Listing.city */
  city: string
  priceFromM2: string
  done: number
  finish: string
  flats: number
  rating: number
  description: LocalText
}

// ——— Developers ———

export const DEVELOPERS: Developer[] = [
  {
    slug: 'm2-development',
    name: { ka: 'm2 დეველოპმენტი', en: 'm2 Development', ru: 'm2 Девелопмент' },
    city: 'თბილისი',
    yearsActive: 16,
    projectsDone: 23,
    unitsDelivered: 8500,
    description: {
      ka: 'm2 დეველოპმენტი — თბილისის ერთ-ერთი უმსხვილესი დეველოპერი, ცნობილი საბურთალოსა და ვაკის პრემიუმ კომპლექსებით. კომპანია აერთიანებს ხარისხიან მშენებლობას, თანამედროვე არქიტექტურასა და დროულ ჩაბარებას.',
      en: 'm2 Development is one of Tbilisi’s largest developers, known for premium complexes in Saburtalo and Vake, combining build quality, contemporary architecture and on-time delivery.',
      ru: 'm2 Development — один из крупнейших девелоперов Тбилиси, известный премиальными комплексами в Сабуртало и Ваке: качество строительства, современная архитектура и сдача в срок.',
    },
    verified: true,
    phone: '+995 322 11 22 33',
  },
  {
    slug: 'alliance-group',
    name: { ka: 'Alliance Group', en: 'Alliance Group', ru: 'Alliance Group' },
    city: 'ბათუმი',
    yearsActive: 28,
    projectsDone: 31,
    unitsDelivered: 12000,
    description: {
      ka: 'Alliance Group — ბათუმის წამყვანი დეველოპერული ჯგუფი, ახალი ბულვარის სანაპირო ხაზის მაღალსართულიანი კომპლექსებით. პროექტები გათვლილია როგორც საცხოვრებლად, ისე საინვესტიციოდ.',
      en: 'Alliance Group is Batumi’s leading development group, building high-rise complexes along the New Boulevard seafront — designed both for living and investment.',
      ru: 'Alliance Group — ведущая девелоперская группа Батуми, строящая высотные комплексы на набережной Нового бульвара — для жизни и инвестиций.',
    },
    verified: true,
    phone: '+995 422 22 33 44',
  },
  {
    slug: 'orbi-group',
    name: { ka: 'ORBI Group', en: 'ORBI Group', ru: 'ORBI Group' },
    city: 'ბათუმი',
    yearsActive: 26,
    projectsDone: 40,
    unitsDelivered: 15000,
    description: {
      ka: 'ORBI Group — ყველაზე მასშტაბური სასტუმრო-საცხოვრებელი კომპლექსების დეველოპერი ბათუმში, ზღვის პირველი ხაზის პროექტებით და მართვის სერვისით ინვესტორებისთვის.',
      en: 'ORBI Group builds Batumi’s largest hotel-residential complexes on the first sea line, with property management services for investors.',
      ru: 'ORBI Group — девелопер крупнейших гостинично-жилых комплексов Батуми на первой линии моря, с сервисом управления для инвесторов.',
    },
    verified: true,
    phone: '+995 422 33 44 55',
  },
  {
    slug: 'dirsi',
    name: { ka: 'დირსი', en: 'DIRSI', ru: 'Дирси' },
    city: 'თბილისი',
    yearsActive: 14,
    projectsDone: 12,
    unitsDelivered: 9000,
    description: {
      ka: 'დირსი — მტკვრის სანაპიროზე, ისანში, აშენებული უმსხვილესი მასშტაბის „ქალაქი ქალაქში“, საკუთარი ინფრასტრუქტურით, სკვერებითა და კომერციული სივრცეებით.',
      en: 'DIRSI is the largest “city within a city” built on the Mtkvari riverbank in Isani, with its own infrastructure, parks and commercial spaces.',
      ru: 'Дирси — крупнейший «город в городе» на берегу Куры в Исани: собственная инфраструктура, скверы и коммерческие пространства.',
    },
    verified: true,
    phone: '+995 322 44 55 66',
  },
  {
    slug: 'archi',
    name: { ka: 'არქი', en: 'Archi', ru: 'Архи' },
    city: 'თბილისი',
    yearsActive: 18,
    projectsDone: 45,
    unitsDelivered: 16000,
    description: {
      ka: 'არქი — ერთ-ერთი ყველაზე გამოცდილი ქართული დეველოპერი, რომელიც თბილისის ყველა რაიონში აშენებს ხელმისაწვდომი და საშუალო ფასის კომპლექსებს, ხშირად ადრეული ჩაბარებით.',
      en: 'Archi is one of Georgia’s most experienced developers, building affordable and mid-range complexes across every Tbilisi district — often delivered ahead of schedule.',
      ru: 'Архи — один из самых опытных грузинских девелоперов: доступные и среднеценовые комплексы во всех районах Тбилиси, часто с досрочной сдачей.',
    },
    verified: true,
    phone: '+995 322 55 66 77',
  },
  {
    slug: 'axis',
    name: { ka: 'აქსისი', en: 'Axis', ru: 'Аксис' },
    city: 'თბილისი',
    yearsActive: 25,
    projectsDone: 20,
    unitsDelivered: 3500,
    description: {
      ka: 'აქსისი — ვაკის პრემიუმ სეგმენტის პიონერი, ჩავჭავაძის გამზირის ღირსშესანიშნაობად ქცეული კოშკებით. მცირე პორტფელი, მაღალი სტანდარტი.',
      en: 'Axis pioneered Vake’s premium segment with its landmark towers on Chavchavadze Avenue — a small portfolio at a high standard.',
      ru: 'Аксис — пионер премиум-сегмента Ваке, автор знаменитых башен на проспекте Чавчавадзе. Небольшое портфолио, высокий стандарт.',
    },
    verified: false,
    phone: '+995 322 66 77 88',
  },
]

// ——— Agents / agencies ———

export const AGENT_PROFILES: AgentProfile[] = [
  {
    slug: 'nino-beridze',
    name: { ka: 'ნინო ბერიძე', en: 'Nino Beridze', ru: 'Нино Беридзе' },
    agency: 'სივრცე პრემიუმ',
    city: 'თბილისი',
    yearsActive: 9,
    dealsClosed: 240,
    languages: ['ka', 'en', 'ru'],
    description: {
      ka: 'ნინო სპეციალიზირებულია ვაკისა და მთაწმინდის პრემიუმ ბინებზე. 9 წლის გამოცდილება, სრული იურიდიული თანხლება და მოლაპარაკება კლიენტის ინტერესებით.',
      en: 'Nino specializes in premium apartments in Vake and Mtatsminda — 9 years of experience, full legal support and negotiation on the client’s side.',
      ru: 'Нино специализируется на премиальных квартирах в Ваке и Мтацминде: 9 лет опыта, полное юридическое сопровождение и переговоры в интересах клиента.',
    },
    verified: true,
    phone: '+995 555 12 34 56',
  },
  {
    slug: 'giorgi-mamulashvili',
    name: { ka: 'გიორგი მამულაშვილი', en: 'Giorgi Mamulashvili', ru: 'Гиоргий Мамулашвили' },
    agency: 'Capital Estate',
    city: 'თბილისი',
    yearsActive: 12,
    dealsClosed: 380,
    languages: ['ka', 'en'],
    description: {
      ka: 'გიორგი — საბურთალოსა და ვაკის საცხოვრებელი უძრავი ქონების ექსპერტი, 380-ზე მეტი დახურული გარიგებით. ეხმარება ინვესტორებს შემოსავლიანი ბინების შერჩევაში.',
      en: 'Giorgi is a residential expert for Saburtalo and Vake with 380+ closed deals, helping investors pick income-generating apartments.',
      ru: 'Гиоргий — эксперт по жилой недвижимости Сабуртало и Ваке, более 380 закрытых сделок. Помогает инвесторам выбирать доходные квартиры.',
    },
    verified: true,
    phone: '+995 577 98 76 54',
  },
  {
    slug: 'ana-kvaratskhelia',
    name: { ka: 'ანა კვარაცხელია', en: 'Ana Kvaratskhelia', ru: 'Ана Кварацхелия' },
    agency: 'სივრცე პრემიუმ',
    city: 'თბილისი',
    yearsActive: 7,
    dealsClosed: 185,
    languages: ['ka', 'en', 'ru'],
    description: {
      ka: 'ანა მუშაობს პირველადი ბაზრის ყიდვა-გაყიდვაზე და საცხოვრებელი სახლების სეგმენტში. ზუსტი ფასების ანალიზი და გამჭვირვალე პროცესი პირველი ზარიდან.',
      en: 'Ana works on primary-market sales and the house segment — precise pricing analysis and a transparent process from the first call.',
      ru: 'Ана работает с первичным рынком и сегментом частных домов: точный анализ цен и прозрачный процесс с первого звонка.',
    },
    verified: true,
    phone: '+995 593 45 67 89',
  },
  {
    slug: 'davit-japaridze',
    name: { ka: 'დავით ჯაფარიძე', en: 'Davit Japaridze', ru: 'Давид Джапаридзе' },
    agency: 'Tbilisi Homes',
    city: 'თბილისი',
    yearsActive: 10,
    dealsClosed: 290,
    languages: ['ka', 'ru'],
    description: {
      ka: 'დავითი 10 წელია თბილისის ბაზარზეა — ისანი-სამგორისა და გლდანის ბინებიდან კომერციულ ფართებამდე. პრაქტიკული რჩევები, ზედმეტი პირობების გარეშე.',
      en: 'Davit has 10 years on the Tbilisi market — from Isani-Samgori and Gldani apartments to commercial spaces. Practical advice, no overpromising.',
      ru: 'Давид 10 лет на рынке Тбилиси — от квартир в Исани-Самгори и Глдани до коммерческих площадей. Практичные советы без лишних обещаний.',
    },
    verified: false,
    phone: '+995 568 23 45 67',
  },
  {
    slug: 'mariam-lomidze',
    name: { ka: 'მარიამ ლომიძე', en: 'Mariam Lomidze', ru: 'Мариам Ломидзе' },
    agency: 'Adjarinvest',
    city: 'ბათუმი',
    yearsActive: 8,
    dealsClosed: 210,
    languages: ['ka', 'en', 'ru'],
    description: {
      ka: 'მარიამი ბათუმის საინვესტიციო ბინების სპეციალისტია — ზღვის ხედით, სასტუმრო ტიპის კომპლექსებში. უცხოური ინვესტორების სრული მხარდაჭერა დისტანციურად.',
      en: 'Mariam is Batumi’s investment-apartment specialist — sea views, hotel-type complexes — with full remote support for foreign investors.',
      ru: 'Мариам — специалист по инвестиционным квартирам в Батуми: вид на море, комплексы гостиничного типа. Полная дистанционная поддержка иностранных инвесторов.',
    },
    verified: true,
    phone: '+995 551 87 65 43',
  },
  {
    slug: 'luka-gelashvili',
    name: { ka: 'ლუკა გელაშვილი', en: 'Luka Gelashvili', ru: 'Лука Гелашвили' },
    agency: 'სივრცე პრემიუმ',
    city: 'თბილისი',
    yearsActive: 5,
    dealsClosed: 120,
    languages: ['ka', 'en'],
    description: {
      ka: 'ლუკა ფოკუსირებულია ახალშენებულ კომპლექსებში ყიდვაზე და ქირავდებაზე — თეთრი/მწვანე კარკასიდან საცხოვრებლად მზა ბინებამდე.',
      en: 'Luka focuses on buying and renting in new developments — from white/green frame to move-in-ready apartments.',
      ru: 'Лука специализируется на покупке и аренде в новостройках — от белого/зелёного каркаса до квартир под ключ.',
    },
    verified: true,
    phone: '+995 579 11 22 33',
  },
]

// ——— New-build projects ———

export const PROJECTS: Project[] = [
  {
    slug: 'downtown-residence',
    name: 'Downtown Residence',
    developerSlug: 'm2-development',
    img: '/images/np1.webp',
    location: 'საბურთალო, თბილისი',
    city: 'თბილისი',
    priceFromM2: '$1,450',
    done: 72,
    finish: '2027 Q2',
    flats: 214,
    rating: 4.8,
    description: {
      ka: 'Downtown Residence — m2-ის პრემიუმ კომპლექსი საბურთალოზე: დაცული ეზო, ფიტნესი, კონსიერჟი და მიწისქვეშა პარკინგი. ბინები მწვანე კარკასიდან სრული რემონტით.',
      en: 'Downtown Residence is m2’s premium complex in Saburtalo: secured courtyard, fitness, concierge and underground parking — units from green frame to fully renovated.',
      ru: 'Downtown Residence — премиальный комплекс m2 в Сабуртало: закрытый двор, фитнес, консьерж и подземный паркинг. Квартиры от зелёного каркаса до полной отделки.',
    },
  },
  {
    slug: 'batumi-riviera-tower',
    name: 'Batumi Riviera Tower',
    developerSlug: 'alliance-group',
    img: '/images/np2.webp',
    location: 'ახალი ბულვარი, ბათუმი',
    city: 'ბათუმი',
    priceFromM2: '$1,780',
    done: 45,
    finish: '2028 Q1',
    flats: 168,
    rating: 4.9,
    description: {
      ka: 'Batumi Riviera Tower — ზღვის პირველი ხაზის მაღალსართულიანი კომპლექსი ახალ ბულვარზე, სასტუმრო სტანდარტის სერვისით და პანორამული ხედებით.',
      en: 'Batumi Riviera Tower is a first-line high-rise on the New Boulevard with hotel-standard services and panoramic sea views.',
      ru: 'Batumi Riviera Tower — высотный комплекс на первой линии Нового бульвара с сервисом гостиничного стандарта и панорамными видами на море.',
    },
  },
  {
    slug: 'orbi-sea-towers',
    name: 'ORBI Sea Towers',
    developerSlug: 'orbi-group',
    img: '/images/p5.webp',
    location: 'ახალი ბულვარი, ბათუმი',
    city: 'ბათუმი',
    priceFromM2: '$1,650',
    done: 60,
    finish: '2027 Q4',
    flats: 320,
    rating: 4.7,
    description: {
      ka: 'ORBI Sea Towers — სასტუმრო-საცხოვრებელი კომპლექსი ზღვისპირა ზონაში, მართვის კომპანიით და გარანტირებული შემოსავლის პროგრამით ინვესტორებისთვის.',
      en: 'ORBI Sea Towers is a hotel-residential complex in the seaside zone with an in-house management company and a guaranteed-income program for investors.',
      ru: 'ORBI Sea Towers — гостинично-жилой комплекс в приморской зоне с управляющей компанией и программой гарантированного дохода для инвесторов.',
    },
  },
  {
    slug: 'dirsi-riverside',
    name: 'Dirsi Riverside',
    developerSlug: 'dirsi',
    img: '/images/p3.webp',
    location: 'ისანი, თბილისი',
    city: 'თბილისი',
    priceFromM2: '$1,150',
    done: 85,
    finish: '2026 Q4',
    flats: 540,
    rating: 4.6,
    description: {
      ka: 'Dirsi Riverside — მტკვრის ნაპირის ახალი კვარტლები „ქალაქი ქალაქში“ კონცეფციით: სკვერები, სკოლა, სავაჭრო ქუჩა და საკუთარი საბავშვო ინფრასტრუქტურა.',
      en: 'Dirsi Riverside is a new Mtkvari riverside quarter built as a “city within a city”: parks, a school, a retail street and children’s infrastructure.',
      ru: 'Dirsi Riverside — новые кварталы на берегу Куры по концепции «город в городе»: скверы, школа, торговая улица и детская инфраструктура.',
    },
  },
  {
    slug: 'archi-dighomi',
    name: 'Archi Dighomi',
    developerSlug: 'archi',
    img: '/images/p4.webp',
    location: 'დიღომი, თბილისი',
    city: 'თბილისი',
    priceFromM2: '$980',
    done: 90,
    finish: '2026 Q3',
    flats: 260,
    rating: 4.7,
    description: {
      ka: 'Archi Dighomi — ხელმისაწვდომი ფასის კომპლექსი დიღომში, ენერგოეფექტური ფასადით და შიდა განვადებით. იდეალური პირველი ბინისთვის.',
      en: 'Archi Dighomi is an affordable complex in Dighomi with an energy-efficient façade and in-house instalments — ideal as a first home.',
      ru: 'Archi Dighomi — доступный комплекс в Дигоми с энергоэффективным фасадом и внутренней рассрочкой. Идеален как первое жильё.',
    },
  },
  {
    slug: 'axis-towers-vake',
    name: 'Axis Towers Vake',
    developerSlug: 'axis',
    img: '/images/p2.webp',
    location: 'ჩავჭავაძის, ვაკე, თბილისი',
    city: 'თბილისი',
    priceFromM2: '$2,300',
    done: 100,
    finish: '2023 Q4',
    flats: 150,
    rating: 4.5,
    description: {
      ka: 'Axis Towers Vake — ჩაბარებული პრემიუმ კოშკები ჩავჭავაძეზე: მიწისქვეშა პარკინგი, კომერციული სარდაფი და ქალაქის საუკეთესო ხედები. ბოლო ბინები იყიდება.',
      en: 'Axis Towers Vake — delivered premium towers on Chavchavadze: underground parking, a retail podium and the best city views. Last units on sale.',
      ru: 'Axis Towers Vake — сданные премиальные башни на Чавчавадзе: подземный паркинг, торговый стилобат и лучшие виды города. Продаются последние квартиры.',
    },
  },
]

// ——— Lookups ———

export function getDeveloper(slug: string): Developer | undefined {
  return DEVELOPERS.find((d) => d.slug === slug)
}

export function getAgentProfile(slug: string): AgentProfile | undefined {
  return AGENT_PROFILES.find((a) => a.slug === slug)
}

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug)
}

export function projectsByDeveloper(developerSlug: string): Project[] {
  return PROJECTS.filter((p) => p.developerSlug === developerSlug)
}

/** Listings handled by this agent (deterministic: exact ka name match). */
export function listingsByAgent(kaName: string): Listing[] {
  return LISTINGS.filter((l) => l.agent.name === kaName)
}

/** Listings in a city (deterministic) — used for developer/project grids. */
export function listingsByCity(city: string, limit = 6): Listing[] {
  return LISTINGS.filter((l) => l.city === city).slice(0, limit)
}

/** Active listings count for a developer's home city. */
export function listingCountByCity(city: string): number {
  return LISTINGS.filter((l) => l.city === city).length
}
