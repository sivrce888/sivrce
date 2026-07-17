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
  /** Map placement — required for 3D construction ghosts */
  coords: { lat: number; lng: number }
  /** Planned floors for extrusion height */
  floors?: number
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
  {
    slug: 'king-david',
    name: { ka: 'ქინგ დევიდ', en: 'King David', ru: 'King David' },
    city: 'თბილისი',
    yearsActive: 12,
    projectsDone: 4,
    unitsDelivered: 400,
    description: {
      ka: 'ქინგ დევიდ — მთაწმინდის პრემიუმ რეზიდენციების დეველოპერი, სასტუმრო სტანდარტის სერვისითა და კონსიერჟით.',
      en: 'King David develops Mtatsminda premium residences with hotel-grade service and concierge.',
      ru: 'King David — девелопер премиальных резиденций на Мтацминде с гостиничным сервисом.',
    },
    verified: true,
    phone: '+995 322 77 88 99',
  },
  {
    slug: 'blox',
    name: { ka: 'Blox', en: 'Blox', ru: 'Blox' },
    city: 'თბილისი',
    yearsActive: 9,
    projectsDone: 7,
    unitsDelivered: 2600,
    description: {
      ka: 'Blox — ქართული უძრავი ქონების ბაზარზე 2016 წლიდან მოქმედი დეველოპერი, რომელიც აშენებს თანამედროვე, ენერგოეფექტურ საცხოვრებელ კომპლექსებს ვარკეთილში, სარაჯიშვილსა და ბელიაშვილის რაიონებში, თბილისის ზღვის სიახლოვეს.',
      en: 'Blox has been developing on the Georgian real estate market since 2016, building modern, energy-efficient residential complexes in Varketili, Sarajishvili and Beliashvili, near the Tbilisi Sea.',
      ru: 'Blox работает на рынке недвижимости Грузии с 2016 года, возводя современные энергоэффективные жилые комплексы в Вarketili, Сарджишвили и Белиашвили, рядом с Тбилисским морем.',
    },
    verified: true,
    phone: '+995 322 00 11 22',
  },
  {
    slug: 'next-group',
    name: { ka: 'NEXT Group', en: 'NEXT Group', ru: 'NEXT Group' },
    city: 'თბილისი',
    yearsActive: 12,
    projectsDone: 65,
    unitsDelivered: 5700,
    description: {
      ka: 'NEXT Group — პირველი ქართული დეველოპერი, რომელიც აშენებს ბრენდირებულ რეზიდენციებს მსოფლიო სასტუმრო ბრენდებთან (Radisson, Wyndham, Barceló) ერთად. 65-ზე მეტი პროექტი სამ კონტინენტზე — საქართველო, არაბეთი, კენია, ესპანეთი.',
      en: 'NEXT Group is the first Georgian developer to build branded residences with global hotel brands (Radisson, Wyndham, Barceló). 65+ projects across three continents — Georgia, the UAE, Kenya and Spain.',
      ru: 'NEXT Group — первый грузинский девелопер брендированных резиденций с мировыми гостиничными брендами (Radisson, Wyndham, Barceló). 65+ проектов на трёх континентах.',
    },
    verified: true,
    phone: '+995 322 11 99 00',
  },
  {
    slug: 'metropol',
    name: { ka: 'მეტროპოლი', en: 'Metropol', ru: 'Метрополь' },
    city: 'თბილისი',
    yearsActive: 4,
    projectsDone: 6,
    unitsDelivered: 1200,
    description: {
      ka: 'მეტროპოლი — 2022 წელს დაფუძნებული ქართული დეველოპერი, Luxury Lifestyle Awards-ის ტოპ-100-ში. 6 აქტიური პროექტი ~1 მლნ მ²-ზე, მათ შორის მეტროპოლ ორთაჭალა და მეტროპოლ ლისი — პირველი კერძო საცხოვრებელი გაერთიანება ლისის ტბის სიახლოვეს.',
      en: 'Metropol is a Georgian developer founded in 2022 and ranked in the Luxury Lifestyle Awards Top 100. Six active projects cover ~1 million m², including Metropol Ortachala and Metropol Lisi — the first private residential community near Lisi Lake.',
      ru: 'Метрополь — грузинский девелопер, основанный в 2022 году, в Топ-100 Luxury Lifestyle Awards. Шесть активных проектов (~1 млн м²), включая Метрополь Ортачала и Метрополь Лиси — первое частное сообщество у озера Лиси.',
    },
    verified: true,
    phone: '+995 322 22 00 99',
  },
  {
    slug: 'redix',
    name: { ka: 'Redix', en: 'Redix', ru: 'Redix' },
    city: 'თბილისი',
    yearsActive: 11,
    projectsDone: 3,
    unitsDelivered: 400,
    description: {
      ka: 'Redix — ქართული უძრავი ქონებისა და ინვესტიციების მართვის კომპანია, ოფისით ვაჟა-ფშაველას გამზ. 71-ში. ცნობილია ჩავჭავაძის გამზირის 64-ში აშენებული პროექტითა და CH64 კლას A საქმიანი ცენტრით.',
      en: 'Redix is a Georgian real estate and investment-management company, headquartered at 71 Vazha-Pshavela Ave. Known for its completed project at 64 Ilia Chavchavadze Ave and the CH64 Class-A business center.',
      ru: 'Redix — грузинская компания по управлению недвижимостью и инвестициями, офис на пр. Важа-Пшавела 71. Известна завершённым проектом на пр. Ильи Чавчавадзе 64 и бизнес-центром CH64 класса А.',
    },
    verified: false,
    phone: '+995 322 33 00 11',
  },
  {
    slug: 'white-square',
    name: { ka: 'White Square', en: 'White Square', ru: 'White Square' },
    city: 'თბილისი',
    yearsActive: 9,
    projectsDone: 8,
    unitsDelivered: 3100,
    description: {
      ka: 'White Square — BK Holding-ის ჯგუფის ერთ-ერთი წამყვანი საცხოვრებელი დეველოპერი, ფოკუსით საბურთალოსა და ვაკეზე. მშენებლობას ახორციელებს BK Construction. პორტფელი: შართავა, მინდელი, ფილიგრინი, ისანი პარკი.',
      en: 'White Square is a leading residential developer in the BK Holding group, focused on Saburtalo and Vake, with construction by BK Construction. Portfolio: Shartava, Mindeli, Filigreen and Isani Park.',
      ru: 'White Square — один из ведущих жилых девелоперов группы BK Holding, фокус на Сабуртало и Ваке, строительство ведёт BK Construction. Портфель: Шартава, Миндели, Филигрин, Исани Парк.',
    },
    verified: true,
    phone: '+995 322 44 00 22',
  },
  {
    slug: 'elt-group',
    name: { ka: 'ELT Group', en: 'ELT Group', ru: 'ELT Group' },
    city: 'ბათუმი',
    yearsActive: 18,
    projectsDone: 14,
    unitsDelivered: 2800,
    description: {
      ka: 'ELT Group — 18 წლის გამოცდილების მქონე დეველოპერი, 300 000 მ²-ზე მეტი აშენებული ფართით ბათუმსა და თბილისში, საერთაშორისო პარტნიორობებით. ცნობილი პროექტი — Barceló Residences Tbilisi.',
      en: 'ELT Group is a developer with 18 years of experience and over 300,000 m² built across Batumi and Tbilisi, with international partnerships. Best known for Barceló Residences Tbilisi.',
      ru: 'ELT Group — девелопер с 18-летним опытом, более 300 000 м² построено в Батуми и Тбилиси, международные партнёрства. Известный проект — Barceló Residences Tbilisi.',
    },
    verified: true,
    phone: '+995 422 11 00 33',
  },
  {
    slug: 'guru-holding',
    name: { ka: 'GURU Holding', en: 'GURU Holding', ru: 'GURU Holding' },
    city: 'ბათუმი',
    yearsActive: 7,
    projectsDone: 5,
    unitsDelivered: 1500,
    description: {
      ka: 'GURU Holding — საერთაშორისო სამშენებლო-დეველოპმენტის კომპანია, ძირითადად ბათუმის ბაზარზე. პროექტი Guru Status თანამშრომლობს Holiday Inn Express-თან, ჩაბარებით 2025 წელს.',
      en: 'GURU Holding is an international construction and development company, mainly on the Batumi market. Its Guru Status project is a collaboration with Holiday Inn Express, completing in 2025.',
      ru: 'GURU Holding — международная строительная и девелоперская компания, в основном на рынке Батуми. Проект Guru Status — сотрудничество с Holiday Inn Express, сдача в 2025 году.',
    },
    verified: false,
    phone: '+995 422 22 00 44',
  },
  {
    slug: 'tekto-group',
    name: { ka: 'Tekto Group', en: 'Tekto Group', ru: 'Tekto Group' },
    city: 'თბილისი',
    yearsActive: 10,
    projectsDone: 6,
    unitsDelivered: 900,
    description: {
      ka: 'Tekto Group — ქართული სამშენებლო კომპანია, პროექტებით თბილისსა და სანაპირო ზონაში. ინვესტიციური პროექტი Tekto Rakurs ჩაკვში გვთავაზობს მაღალი შემოსავლიანობის ბინებს.',
      en: 'Tekto Group is a Georgian construction company with projects in Tbilisi and along the coast. Its investment project Tekto Rakurs in Chakvi offers high-yield apartments.',
      ru: 'Tekto Group — грузинская строительная компания с проектами в Тбилиси и на побережье. Инвестиционный проект Tekto Rakurs в Чакви предлагает квартиры с высокой доходностью.',
    },
    verified: false,
    phone: '+995 322 55 00 33',
  },
  {
    slug: 'apart-group',
    name: { ka: 'Apart Group', en: 'Apart Group', ru: 'Apart Group' },
    city: 'თბილისი',
    yearsActive: 8,
    projectsDone: 5,
    unitsDelivered: 1300,
    description: {
      ka: 'Apart Group — თბილისის ერთ-ერთი წამყვანი დეველოპერი, ცნობილი პროექტებით ლისის ტბის სიახლოვეს (Lisi Lakers) და ქალაქის სხვა პერსპექტიულ რაიონებში.',
      en: 'Apart Group is one of Tbilisi’s leading developers, known for projects near Lisi Lake (Lisi Lakers) and other high-potential city districts.',
      ru: 'Apart Group — один из ведущих девелоперов Тбилиси, известен проектами у озера Лиси (Lisi Lakers) и в других перспективных районах.',
    },
    verified: false,
    phone: '+995 322 66 00 44',
  },
  {
    slug: 'european-village',
    name: { ka: 'European Village', en: 'European Village', ru: 'European Village' },
    city: 'ბათუმი',
    yearsActive: 12,
    projectsDone: 9,
    unitsDelivered: 600,
    description: {
      ka: 'European Village — დასავლეთ საქართველოში მომუშავე დეველოპერი, რომელიც სპეციალიზდება ევროპული ტექნოლოგიებით აგებულ სამთავროვო ვილებზე: 250 000 მ²-ზე მეტი დასრულებული, $90 მლნ-ზე მეტი მოწოდებული.',
      en: 'European Village is a developer active in western Georgia, specializing in luxury villas built with European technologies: over 250,000 m² completed and $90M+ delivered.',
      ru: 'European Village — девелопер в западной Грузии, специализируется на элитных виллах по европейским технологиям: более 250 000 м² завершено, свыше $90 млн сдано.',
    },
    verified: false,
    phone: '+995 422 33 00 55',
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
    coords: { lat: 41.7218, lng: 44.7526 },
    floors: 22,
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
    coords: { lat: 41.6508, lng: 41.6362 },
    floors: 28,
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
    coords: { lat: 41.6482, lng: 41.6348 },
    floors: 32,
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
    coords: { lat: 41.6884, lng: 44.8452 },
    floors: 18,
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
    coords: { lat: 41.7812, lng: 44.7815 },
    floors: 16,
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
    coords: { lat: 41.7088, lng: 44.7732 },
    floors: 24,
    description: {
      ka: 'Axis Towers Vake — ჩაბარებული პრემიუმ კოშკები ჩავჭავაძეზე: მიწისქვეშა პარკინგი, კომერციული სარდაფი და ქალაქის საუკეთესო ხედები. ბოლო ბინები იყიდება.',
      en: 'Axis Towers Vake — delivered premium towers on Chavchavadze: underground parking, a retail podium and the best city views. Last units on sale.',
      ru: 'Axis Towers Vake — сданные премиальные башни на Чавчавадзе: подземный паркинг, торговый стилобат и лучшие виды города. Продаются последние квартиры.',
    },
  },
  {
    slug: 'm2-hippodrome',
    name: 'm2 Hippodrome',
    developerSlug: 'm2-development',
    img: '/images/np1.webp',
    location: 'ჰიპოდრომი, საბურთალო, თბილისი',
    city: 'თბილისი',
    priceFromM2: '$1,600',
    done: 30,
    finish: '2029 Q1',
    flats: 400,
    rating: 4.7,
    coords: { lat: 41.7233, lng: 44.7389 },
    floors: 25,
    description: {
      ka: 'm2 Hippodrome — m2-ის ახალი დიდმასშტაბიანი პროექტი ჰიპოდრომის მიმდებარედ, საბურთალოზე: გამწვანებული ეზოები, კომერციული სართულები და მიწისქვეშა პარკინგი. ბინები მწვანე კარკასით, შიდა განვადებით.',
      en: 'm2 Hippodrome is m2’s new large-scale project by the Hippodrome in Saburtalo: green courtyards, retail floors and underground parking — units in green frame with in-house instalments.',
      ru: 'm2 Hippodrome — новый масштабный проект m2 у ипподрома в Сабуртало: зелёные дворы, коммерческие этажи и подземный паркинг. Квартиры в зелёном каркасе, внутренняя рассрочка.',
    },
  },
  {
    slug: 'archi-central-park',
    name: 'Archi Central Park',
    developerSlug: 'archi',
    img: '/images/p4.webp',
    location: 'მოსკოვის გამზ., გლდანი, თბილისი',
    city: 'თბილისი',
    priceFromM2: '$950',
    done: 55,
    finish: '2028 Q2',
    flats: 380,
    rating: 4.5,
    coords: { lat: 41.7898, lng: 44.8135 },
    floors: 20,
    description: {
      ka: 'Archi Central Park — ხელმისაწვდომი ფასის კომპლექსი გლდანში, მოსკოვის გამზირზე: ენერგოეფექტური ფასადი, საკუთარი პარკი და შიდა განვადება. კარგი არჩევანია პირველი ბინისთვის.',
      en: 'Archi Central Park is an affordable complex in Gldani on Moscow Avenue: energy-efficient façade, its own park and in-house instalments — a solid first-home choice.',
      ru: 'Archi Central Park — доступный комплекс в Глдани на Московском проспекте: энергоэффективный фасад, собственный парк и внутренняя рассрочка. Хороший выбор для первого жилья.',
    },
  },
  {
    slug: 'orbi-city',
    name: 'ORBI City',
    developerSlug: 'orbi-group',
    img: '/images/p5.webp',
    location: 'ზღვის პირველი ხაზი, ბათუმი',
    city: 'ბათუმი',
    priceFromM2: '$1,500',
    done: 92,
    finish: '2026 Q4',
    flats: 2500,
    rating: 4.6,
    coords: { lat: 41.6114, lng: 41.6288 },
    floors: 45,
    description: {
      ka: 'ORBI City — ბათუმის ყველაზე მასშტაბური სასტუმრო-საცხოვრებელი ქალაქი ზღვის პირველ ხაზზე: საკონცერტო მოედანი, აუზები და მართვის კომპანია ინვესტორებისთვის გარანტირებული შემოსავლის პროგრამით.',
      en: 'ORBI City is Batumi’s largest hotel-residential city on the first sea line: a concert square, pools and an in-house management company with a guaranteed-income program for investors.',
      ru: 'ORBI City — крупнейший гостинично-жилой город Батуми на первой линии моря: концертная площадь, бассейны и управляющая компания с программой гарантированного дохода для инвесторов.',
    },
  },
  {
    slug: 'alliance-palace',
    name: 'Alliance Palace',
    developerSlug: 'alliance-group',
    img: '/images/np2.webp',
    location: 'გმირთა ხეივანი, ბათუმი',
    city: 'ბათუმი',
    priceFromM2: '$1,700',
    done: 65,
    finish: '2027 Q3',
    flats: 520,
    rating: 4.8,
    coords: { lat: 41.6371, lng: 41.636 },
    floors: 41,
    description: {
      ka: 'Alliance Palace — პრემიუმ მაღალსართულიანი კომპლექსი გმირთა ხეივანზე, ბულვართან ახლოს: პანორამული ზღვის ხედები, ლობი-რესეფშენი და სასტუმრო სტანდარტის სერვისი.',
      en: 'Alliance Palace is a premium high-rise on Heroes’ Alley near the Boulevard: panoramic sea views, a lobby reception and hotel-standard service.',
      ru: 'Alliance Palace — премиальный высотный комплекс на аллее Героев возле бульвара: панорамные виды на море, лобби-ресепшн и сервис гостиничного стандарта.',
    },
  },
  {
    slug: 'archi-horizon',
    name: 'Archi Horizon',
    developerSlug: 'archi',
    img: '/images/np1.webp',
    location: 'ისანი, თბილისი',
    city: 'თბილისი',
    priceFromM2: '$1,400',
    done: 45,
    finish: '2026 Q4',
    flats: 320,
    rating: 4.7,
    coords: { lat: 41.6808, lng: 44.8137 },
    floors: 36,
    description: {
      ka: 'Archi Horizon — 36-სართულიანი საფირმო კოშკი ისანში, თბილისის ცენტრში, პანორამული ხედებით. სტუდიები და ბინები $70 000-იდან, ენერგოეფექტური BREEAM სტანდარტით.',
      en: 'Archi Horizon is a flagship 36-storey tower in Isani, central Tbilisi, with panoramic views. Studios and apartments from $70,000, built to the energy-efficient BREEAM standard.',
      ru: 'Archi Horizon — 36-этажная знаковая башня в Исани, центр Тбилиси, с панорамными видами. Студии и квартиры от $70 000, энергоэффективный стандарт BREEAM.',
    },
  },
  {
    slug: 'archi-nutsubidze',
    name: 'Archi Nutsubidze',
    developerSlug: 'archi',
    img: '/images/np2.webp',
    location: 'ნუცუბიძე, საბურთალო, თბილისი',
    city: 'თბილისი',
    priceFromM2: '$1,050',
    done: 70,
    finish: '2026 Q2',
    flats: 280,
    rating: 4.6,
    coords: { lat: 41.7185, lng: 44.7651 },
    floors: 22,
    description: {
      ka: 'Archi Nutsubidze — ინოვაციური პროექტი საბურთალოზე, გაუმჯობესებული ენერგოეფექტურობის მაჩვენებლებით. თანამედროვე არქიტექტურა და გამართული სატრანსპორტო წვდომა.',
      en: 'Archi Nutsubidze is an innovative project on Saburtalo with improved energy-efficiency metrics, contemporary architecture and good transport access.',
      ru: 'Archi Nutsubidze — инновационный проект на Сабуртало с улучшенными показателями энергоэффективности, современной архитектурой и удобной транспортной доступностью.',
    },
  },
  {
    slug: 'blox-varketili',
    name: 'Blox Varketili',
    developerSlug: 'blox',
    img: '/images/np3.webp',
    location: 'ვარკეთილი, თბილისის ზღვის სიახლოვეს',
    city: 'თბილისი',
    priceFromM2: '$1,200',
    done: 80,
    finish: '2025 Q3',
    flats: 240,
    rating: 4.5,
    coords: { lat: 41.6773, lng: 44.9189 },
    floors: 10,
    description: {
      ka: 'Blox Varketili — 10-სართულიანი თანამედროვე კომპლექსი თბილისის ზღვის სიახლოვეს, პირველ სართულზე კომერციული ფართით. მწვანე კარკასი, რაიონული ინფრასტრუქტურით.',
      en: 'Blox Varketili is a contemporary 10-storey complex near the Tbilisi Sea, with commercial space on the ground floor. Green frame, with local infrastructure.',
      ru: 'Blox Varketili — современный 10-этажный комплекс рядом с Тбилисским морем, коммерческие площади на первом этаже. Зелёный каркас, местная инфраструктура.',
    },
  },
  {
    slug: 'blox-sarajishvili',
    name: 'Blox Sarajishvili',
    developerSlug: 'blox',
    img: '/images/np4.webp',
    location: 'სარაჯიშვილი, თბილისი',
    city: 'თბილისი',
    priceFromM2: '$1,300',
    done: 60,
    finish: '2026 Q1',
    flats: 190,
    rating: 4.6,
    coords: { lat: 41.7247, lng: 44.8032 },
    floors: 14,
    description: {
      ka: 'Blox Sarajishvili — 14-სართულიანი საცხოვრებელი კომპლექსი ჩრდილოეთ თბილისში, მეტროს სიახლოვეს. ენერგოეფექტური გადაწყვეტები და დახურული ეზო.',
      en: 'Blox Sarajishvili is a 14-storey residential complex in northern Tbilisi near the metro, with energy-efficient solutions and a closed courtyard.',
      ru: 'Blox Sarajishvili — 14-этажный жилой комплекс в северном Тбилиси у метро: энергоэффективные решения и закрытый двор.',
    },
  },
  {
    slug: 'blox-beliashvili',
    name: 'Blox Beliashvili',
    developerSlug: 'blox',
    img: '/images/np5.webp',
    location: 'ბელიაშვილის ქ., თბილისი',
    city: 'თბილისი',
    priceFromM2: '$1,350',
    done: 55,
    finish: '2026 Q2',
    flats: 210,
    rating: 4.6,
    coords: { lat: 41.7156, lng: 44.7821 },
    floors: 16,
    description: {
      ka: 'Blox Beliashvili — 16-სართულიანი კომპლექსი ბელიაშვილის ქუჩაზე, თანამედროვე დაგეგმარებით, ფართო სამზარეულოებითა და აივნებით.',
      en: 'Blox Beliashvili is a 16-storey complex on Beliashvili Street with modern layouts, spacious kitchens and balconies.',
      ru: 'Blox Beliashvili — 16-этажный комплекс на улице Белиашвили: современные планировки, просторные кухни и балконы.',
    },
  },
  {
    slug: 'm2-mtatsminda-park',
    name: 'm² Mtatsminda Park',
    developerSlug: 'm2-development',
    img: '/images/np6.webp',
    location: 'ინოვაციების ქ. 20-30, მთაწმინდა, თბილისი',
    city: 'თბილისი',
    priceFromM2: '$2,250',
    done: 35,
    finish: '2027 Q2',
    flats: 340,
    rating: 4.7,
    coords: { lat: 41.6925, lng: 44.7958 },
    floors: 18,
    description: {
      ka: 'm² Mtatsminda Park — პრემიუმ კომპლექსი მთაწმინდაზე, ინოვაციების ქუჩაზე, ქალაქისა და მთის ხედებით. ფასები $186 728-იდან, ~$2 250/მ².',
      en: 'm² Mtatsminda Park is a premium complex on Mtatsminda, Inovatsiebi St, with city and mountain views. Prices from $186,728 (~$2,250/m²).',
      ru: 'm² Mtatsminda Park — премиальный комплекс на Мтацминде, ул. Инноваций: виды на город и горы. Цены от $186 728 (~$2 250/м²).',
    },
  },
  {
    slug: 'm2-highlight',
    name: 'm² Highlight',
    developerSlug: 'm2-development',
    img: '/images/np7.webp',
    location: 'მ. გელოვანის გამზ., საბურთალო, თბილისი',
    city: 'თბილისი',
    priceFromM2: '$2,100',
    done: 30,
    finish: '2027 Q4',
    flats: 180,
    rating: 4.7,
    coords: { lat: 41.7243, lng: 44.7519 },
    floors: 30,
    description: {
      ka: 'm² Highlight — m²-ის პირველი ცათამბარებელი, მარშალ გელოვანის გამზირზე, მე-3 საბურთალოს რაიონის გვერდით. 30 სართული, პრემიუმ სტანდარტი.',
      en: 'm² Highlight is m²’s first skyscraper, on Marshal Gelovani Avenue next to the m³ Saburtalo district. 30 floors, premium standard.',
      ru: 'm² Highlight — первый небоскрёб m² на проспекте Маршала Геловани рядом с районом m³ Сабуртало. 30 этажей, премиум-стандарт.',
    },
  },
  {
    slug: 'next-tbilisi-downtown',
    name: 'Tbilisi Downtown',
    developerSlug: 'next-group',
    img: '/images/np8.webp',
    location: 'ვერა, თბილისი',
    city: 'თბილისი',
    priceFromM2: '$2,800',
    done: 50,
    finish: '2026 Q3',
    flats: 260,
    rating: 4.8,
    coords: { lat: 41.6947, lng: 44.7985 },
    floors: 24,
    description: {
      ka: 'Tbilisi Downtown — NEXT-ის ბრენდირებული რეზიდენცია ვერაში, ქალაქის ცენტრთან. მაღალი სტანდარტის სერვისი და გლობალური სასტუმრო მართვა.',
      en: 'Tbilisi Downtown is a NEXT branded residence in Vera, close to the city centre, with high-standard service and global hotel management.',
      ru: 'Tbilisi Downtown — брендированная резиденция NEXT в Вере, рядом с центром: сервис высокого стандарта и управление глобальным гостиничным оператором.',
    },
  },
  {
    slug: 'next-tbilisi-oriental',
    name: 'Tbilisi Oriental',
    developerSlug: 'next-group',
    img: '/images/np9.webp',
    location: 'ჩუღურეთი, თბილისი',
    city: 'თბილისი',
    priceFromM2: '$2,400',
    done: 40,
    finish: '2027 Q1',
    flats: 220,
    rating: 4.7,
    coords: { lat: 41.7036, lng: 44.8091 },
    floors: 21,
    description: {
      ka: 'Tbilisi Oriental — NEXT-ის 21-სართულიანი განვითარება ჩუღურეთში, აღმოსავლური დიზაინის აქცენტებითა და პრემიუმ ამენიტებით.',
      en: 'Tbilisi Oriental is NEXT’s 21-storey development in Chugureti, with eastern-design accents and premium amenities.',
      ru: 'Tbilisi Oriental — 21-этажная разработка NEXT в Чугурети: акценты восточного дизайна и премиальные удобства.',
    },
  },
  {
    slug: 'metropol-ortachala',
    name: 'Metropol Ortachala',
    developerSlug: 'metropol',
    img: '/images/np10.webp',
    location: 'ორთაჭალა, თბილისი',
    city: 'თბილისი',
    priceFromM2: '$1,500',
    done: 45,
    finish: '2026 Q4',
    flats: 600,
    rating: 4.5,
    coords: { lat: 41.6712, lng: 44.8234 },
    floors: 28,
    description: {
      ka: 'Metropol Ortachala — მეტროპოლის საცხოვრებელი კომპლექსი ორთაჭალაში, მტკვრის სიახლოვეს. თანამედროვე ინფრასტრუქტურა და ხედები მდინარეზე.',
      en: 'Metropol Ortachala is a residential complex by Metropol in Ortachala, near the Mtkvari River, with modern infrastructure and river views.',
      ru: 'Metropol Ortachala — жилой комплекс «Метрополь» в Ортачала, рядом с рекой Кура: современная инфраструктура и виды на реку.',
    },
  },
  {
    slug: 'metropol-lisi',
    name: 'Metropol Lisi',
    developerSlug: 'metropol',
    img: '/images/np11.webp',
    location: 'ლისის ტბის სიახლოვეს, თბილისი',
    city: 'თბილისი',
    priceFromM2: '$1,900',
    done: 20,
    finish: '2028 Q2',
    flats: 380,
    rating: 4.7,
    coords: { lat: 41.7288, lng: 44.7463 },
    floors: 12,
    description: {
      ka: 'Metropol Lisi — პირველი კერძო საცხოვრებელი გაერთიანება ლისის ტბის სიახლოვეს. გარეუბნული ცხოვრება ქალაქთან ახლოს, ეკოლოგიურად სუფთა გარემოთი.',
      en: 'Metropol Lisi is the first private residential community near Lisi Lake — suburban living close to the city in a clean environment.',
      ru: 'Metropol Lisi — первое частное жилое сообщество у озера Лиси: пригородная жизнь рядом с городом в экологически чистой среде.',
    },
  },
  {
    slug: 'white-square-shartava',
    name: 'White Square Shartava',
    developerSlug: 'white-square',
    img: '/images/np12.webp',
    location: 'ჟიული შართავას ქ. 43, საბურთალო, თბილისი',
    city: 'თბილისი',
    priceFromM2: '$1,700',
    done: 65,
    finish: '2026 Q2',
    flats: 240,
    rating: 4.6,
    coords: { lat: 41.7153, lng: 44.7688 },
    floors: 22,
    description: {
      ka: 'White Square Shartava — პრემიუმ საცხოვრებელი კომპლექსი შართავას ქ. 43-ში, საბურთალოზე, მერიისა და საქართველოს უნივერსიტეტის სიახლოვეს. განვადება 36 თვემდე.',
      en: 'White Square Shartava is a premium residential complex at 43 Shartava St, Saburtalo, near City Hall and the University of Georgia. Installments up to 36 months.',
      ru: 'White Square Shartava — премиальный жилой комплекс на ул. Шартава 43, Сабуртало, рядом с мэрией и Университетом Грузии. Рассрочка до 36 месяцев.',
    },
  },
  {
    slug: 'white-square-mindeli',
    name: 'White Square Mindeli',
    developerSlug: 'white-square',
    img: '/images/np13.webp',
    location: 'შართავას ქ., მინდელის მიდამოები, საბურთალო, თბილისი',
    city: 'თბილისი',
    priceFromM2: '$1,650',
    done: 40,
    finish: '2027 Q1',
    flats: 520,
    rating: 4.5,
    coords: { lat: 41.7161, lng: 44.7702 },
    floors: 22,
    description: {
      ka: 'White Square Mindeli — ექვსი ბლოკისგან შემდგარი კომპლექსი საბურთალოზე: ორი 14-სართულიანი, ერთი 15-სართულიანი და სამი 22-სართულიანი შენობა.',
      en: 'White Square Mindeli is a six-block complex on Saburtalo: two 14-storey, one 15-storey and three 22-storey buildings.',
      ru: 'White Square Mindeli — комплекс из шести блоков на Сабуртало: два 14-этажных, один 15-этажный и три 22-этажных здания.',
    },
  },
  {
    slug: 'elt-barcelo-residences',
    name: 'Barceló Residences Tbilisi',
    developerSlug: 'elt-group',
    img: '/images/np14.webp',
    location: 'საბურთალო, თბილისი',
    city: 'თბილისი',
    priceFromM2: '$2,200',
    done: 50,
    finish: '2026 Q4',
    flats: 180,
    rating: 4.7,
    coords: { lat: 41.7222, lng: 44.7566 },
    floors: 20,
    description: {
      ka: 'Barceló Residences Tbilisi — ELT Group-ის ბრენდირებული სასტუმრო-მართვის პროექტი, მსოფლიო ბრენდ Barceló-სთან ერთად. სასტუმრო სტანდარტის სერვისი.',
      en: 'Barceló Residences Tbilisi is an ELT Group branded hotel-managed project with global brand Barceló, offering hotel-standard service.',
      ru: 'Barceló Residences Tbilisi — брендированный гостиничный проект ELT Group с мировым брендом Barceló: сервис гостиничного стандарта.',
    },
  },
  {
    slug: 'guru-status',
    name: 'Guru Status',
    developerSlug: 'guru-holding',
    img: '/images/np15.webp',
    location: 'ახალი ბულვარი, ბათუმი',
    city: 'ბათუმი',
    priceFromM2: '$1,800',
    done: 85,
    finish: '2025 Q4',
    flats: 300,
    rating: 4.6,
    coords: { lat: 41.6412, lng: 41.6289 },
    floors: 25,
    description: {
      ka: 'Guru Status — GURU Holding-ის პროექტი Holiday Inn Express-თან თანამშრომლობით, ახალ ბულვარზე, ზღვის ხედებით. ჩაბარება 2025 წელს.',
      en: 'Guru Status is a GURU Holding project in collaboration with Holiday Inn Express, on the New Boulevard with sea views, completing in 2025.',
      ru: 'Guru Status — проект GURU Holding совместно с Holiday Inn Express на Новом бульваре с видами на море. Сдача в 2025 году.',
    },
  },
  {
    slug: 'tekto-rakurs',
    name: 'Tekto Rakurs',
    developerSlug: 'tekto-group',
    img: '/images/np16.webp',
    location: 'ჩაკვი, შავი ზღვის სანაპირო',
    city: 'ბათუმი',
    priceFromM2: '$1,400',
    done: 30,
    finish: '2027 Q2',
    flats: 160,
    rating: 4.4,
    coords: { lat: 41.8879, lng: 41.8273 },
    floors: 8,
    description: {
      ka: 'Tekto Rakurs — ინვესტიციური პროექტი ჩაკვში, ზღვის სიახლოვეს. პრემიუმ ბინები მაღალი შემოსავლიანობის პერსპექტივით — წლიური ROI 13%-მდე.',
      en: 'Tekto Rakurs is an investment project in Chakvi near the sea — premium apartments with high yield potential, up to 13% ROI annually.',
      ru: 'Tekto Rakurs — инвестиционный проект в Чакви у моря: премиальные квартиры с высокой доходностью, ROI до 13% годовых.',
    },
  },
  {
    slug: 'apart-lisi-lakers',
    name: 'Lisi Lakers',
    developerSlug: 'apart-group',
    img: '/images/np17.webp',
    location: 'ლისის ტბის სიახლოვეს, თბილისი',
    city: 'თბილისი',
    priceFromM2: '$1,750',
    done: 45,
    finish: '2026 Q3',
    flats: 220,
    rating: 4.5,
    coords: { lat: 41.7301, lng: 44.7478 },
    floors: 14,
    description: {
      ka: 'Lisi Lakers — Apart Group-ის პროექტი ლისის ტბის სიახლოვეს, მწვანე გარემოში, ქალაქთან ახლოს. თანამედროვე არქიტექტურა და რეკრეაციული ზონები.',
      en: 'Lisi Lakers is an Apart Group project near Lisi Lake in a green setting close to the city, with contemporary architecture and recreation areas.',
      ru: 'Lisi Lakers — проект Apart Group у озера Лиси в зелёной среде рядом с городом: современная архитектура и рекреационные зоны.',
    },
  },
  {
    slug: 'redix-chavchavadze-64',
    name: 'Redix Chavchavadze 64',
    developerSlug: 'redix',
    img: '/images/np18.webp',
    location: 'ილია ჭავჭავაძის გამზ. 64, ვაკე, თბილისი',
    city: 'თბილისი',
    priceFromM2: '$2,400',
    done: 100,
    finish: 'გადაცემულია (2019)',
    flats: 120,
    rating: 4.7,
    coords: { lat: 41.7112, lng: 44.7789 },
    floors: 12,
    description: {
      ka: 'Redix Chavchavadze 64 — დასრულებული კომპლექსი ჭავჭავაძის გამზირის 64-ში, ვაკეში (2019). ახლოს CH64 კლას A საქმიანი ცენტრი.',
      en: 'Redix Chavchavadze 64 is a completed complex at 64 Chavchavadze Ave, Vake (2019). Nearby is the CH64 Class-A business center.',
      ru: 'Redix Chavchavadze 64 — завершённый комплекс на пр. Чавчавадзе 64, Ваке (2019). Рядом бизнес-центр CH64 класса А.',
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
