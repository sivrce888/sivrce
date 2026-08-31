/**
 * SIVRCE — Neighborhood guides data layer.
 * Static source of truth for /neighborhoods pages (SEO moat: area guides
 * with livability scores + reviews). Images reuse existing /public assets.
 */

export type LText = { ka: string; en: string; ru: string }

/** Pick a localized string; any non-ka/ru language falls back to English. */
export function pick(t: LText, lang: string): string {
  return lang === 'ka' ? t.ka : lang === 'ru' ? t.ru : t.en
}

export interface LivabilityScores {
  transport: number // 1..10
  schools: number
  green: number
  safety: number
  nightlife: number
}

export interface Neighborhood {
  slug: string
  name: LText
  city: LText
  /** Matches Listing.city in src/data/listings.ts (Georgian) */
  cityKey: string
  /** Listing.district values (Georgian) belonging to this neighborhood */
  districts: string[]
  type: 'Neighborhood' | 'City'
  description: LText
  scores: LivabilityScores
  /** Average sale price per m², USD */
  avgPriceM2USD: number
  /** Hero image — reused from existing /public/images assets */
  img: string
  coords: { lat: number; lng: number }
}

const TBILISI: LText = { ka: 'თბილისი', en: 'Tbilisi', ru: 'Тбилиси' }
const BATUMI: LText = { ka: 'ბათუმი', en: 'Batumi', ru: 'Батуми' }
const KUTAISI: LText = { ka: 'ქუთაისი', en: 'Kutaisi', ru: 'Кутаиси' }

export const NEIGHBORHOODS: Neighborhood[] = [
  {
    slug: 'vake',
    name: { ka: 'ვაკე', en: 'Vake', ru: 'Ваке' },
    city: TBILISI, cityKey: 'თბილისი', districts: ['ვაკე'], type: 'Neighborhood',
    description: {
      ka: 'თბილისის ყველაზე პრესტიჟული საცხოვრებელი უბანი — ვაკის პარკი, ჭავჭავაძის გამზირი, საუკეთესო სკოლები და კაფე-კულტურა. სტაბილური მოთხოვნა ოჯახებისა და ექსპატების მხრიდან.',
      en: 'Tbilisi’s most prestigious residential district — Vake Park, Chavchavadze Avenue, top schools and café culture. Steady demand from families and expats.',
      ru: 'Самый престижный жилой район Тбилиси — парк Ваке, проспект Чавчавадзе, лучшие школы и кафе-культура. Стабильный спрос со стороны семей и экспатов.',
    },
    scores: { transport: 8, schools: 9, green: 8, safety: 9, nightlife: 7 },
    // ponytail: OSM place centroids — label on district, not metro/peak
    avgPriceM2USD: 1450, img: '/images/neighborhoods/vake.webp', coords: { lat: 41.70929, lng: 44.76366 },
  },
  {
    slug: 'saburtalo',
    name: { ka: 'საბურთალო', en: 'Saburtalo', ru: 'Сабуртало' },
    city: TBILISI, cityKey: 'თბილისი', districts: ['საბურთალო'], type: 'Neighborhood',
    description: {
      ka: 'ახალი კორპუსებისა და ინფრასტრუქტურის უბანი — მეტრო, უნივერსიტეტები, სავაჭრო ცენტრები. აქტიურად იშენება; ფასი ჯერ კიდევ ვაკეზე დაბალია.',
      en: 'The district of new builds and infrastructure — metro, universities, malls. Actively developing; prices still below Vake.',
      ru: 'Район новостроек и инфраструктуры — метро, университеты, торговые центры. Активно застраивается; цены пока ниже Ваке.',
    },
    scores: { transport: 9, schools: 8, green: 6, safety: 8, nightlife: 7 },
    avgPriceM2USD: 1150, img: '/images/neighborhoods/saburtalo.webp', coords: { lat: 41.72473, lng: 44.75173 },
  },
  {
    slug: 'old-tbilisi',
    name: { ka: 'ძველი თბილისი', en: 'Old Tbilisi', ru: 'Старый Тбилиси' },
    city: TBILISI, cityKey: 'თბილისი', districts: ['ავლაბარი'], type: 'Neighborhood',
    description: {
      ka: 'ისტორიული ბირთვი — გამოქვაბული ეზოები, აბანოთუბანი, მთაწმინდის ხედები. ტურისტული მაგნიტი; იდეალური დღიური ქირის ინვესტიციისთვის.',
      en: 'The historic core — carved balconies, Abanotubani baths, Narikala views. A tourist magnet; ideal for short-term rental investment.',
      ru: 'Историческое ядро — резные балконы, серные бани Абанотубани, виды на Нарикалу. Магнит для туристов; идеален для посуточной аренды.',
    },
    scores: { transport: 8, schools: 6, green: 5, safety: 7, nightlife: 9 },
    avgPriceM2USD: 1600, img: '/images/neighborhoods/old-tbilisi.webp', coords: { lat: 41.6915, lng: 44.8055 },
  },
  {
    slug: 'mtatsminda',
    name: { ka: 'მთაწმინდა', en: 'Mtatsminda', ru: 'Мтатцминда' },
    city: TBILISI, cityKey: 'თბილისი', districts: ['მთაწმინდა'], type: 'Neighborhood',
    description: {
      ka: 'რუსთაველის გამზირი, თეატრები და მთის ჰაერი — ქალაქის კულტურული გული მაღალი საცხოვრებელი ღირებულებით.',
      en: 'Rustaveli Avenue, theatres and mountain air — the cultural heart of the city with premium residential value.',
      ru: 'Проспект Руставели, театры и горный воздух — культурное сердце города с премиальной стоимостью жилья.',
    },
    scores: { transport: 8, schools: 8, green: 7, safety: 9, nightlife: 8 },
    avgPriceM2USD: 1850, img: '/images/neighborhoods/mtatsminda.webp', coords: { lat: 41.69636, lng: 44.79385 },
  },
  {
    slug: 'vera',
    name: { ka: 'ვერა', en: 'Vera', ru: 'Вера' },
    city: TBILISI, cityKey: 'თბილისი', districts: ['ვერა'], type: 'Neighborhood',
    description: {
      ka: 'ბოჰემური უბანი ვაკესა და ცენტრს შორის — მშვიდი ქუჩები, ბარები და სტუდიო-ბინები ახალგაზრდა პროფესიონალებისთვის.',
      en: 'A bohemian quarter between Vake and the center — quiet streets, bars and studio flats for young professionals.',
      ru: 'Богемный квартал между Ваке и центром — тихие улицы, бары и студии для молодых профессионалов.',
    },
    scores: { transport: 7, schools: 7, green: 6, safety: 8, nightlife: 8 },
    avgPriceM2USD: 1500, img: '/images/neighborhoods/vera.webp', coords: { lat: 41.7058, lng: 44.78278 },
  },
  {
    slug: 'chugureti',
    name: { ka: 'ჩუღურეთი', en: 'Chugureti', ru: 'Чугурети' },
    city: TBILISI, cityKey: 'თბილისი', districts: ['ჩუღურეთი'], type: 'Neighborhood',
    description: {
      ka: 'მარჯვენა სანაპიროს აღმომავალი უბანი — ფაბრიკა, ევროპული მოედნები და განახლებული ისტორიული შენობები. ინვესტორების ახალი ფოკუსი.',
      en: 'The rising right-bank district — Fabrika, European-style squares and restored historic buildings. The new focus for investors.',
      ru: 'Восходящий правобережный район — «Фабрика», европейские площади и отреставрированные исторические здания. Новый фокус инвесторов.',
    },
    scores: { transport: 8, schools: 6, green: 5, safety: 7, nightlife: 8 },
    avgPriceM2USD: 1200, img: '/images/neighborhoods/chugureti.webp', coords: { lat: 41.71116, lng: 44.79943 },
  },
  {
    slug: 'didube',
    name: { ka: 'დიდუბე', en: 'Didube', ru: 'Дидубе' },
    city: TBILISI, cityKey: 'თბილისი', districts: ['დიდუბე'], type: 'Neighborhood',
    description: {
      ka: 'მეტროსადგურებისა და ბაზრობის უბანი — ხელმისაწვდომი ფასები და შესანიშნავი სატრანსპორტო კავშირი ქალაქის ნებისმიერ წერტილთან.',
      en: 'A district of metro stations and the bazaar — affordable prices and excellent transport links to any point of the city.',
      ru: 'Район станций метро и базара — доступные цены и отличная транспортная связь с любой точкой города.',
    },
    scores: { transport: 8, schools: 6, green: 5, safety: 6, nightlife: 4 },
    avgPriceM2USD: 900, img: '/images/neighborhoods/didube.webp', coords: { lat: 41.73538, lng: 44.78126 },
  },
  {
    slug: 'gldani',
    name: { ka: 'გლდანი', en: 'Gldani', ru: 'Глдани' },
    city: TBILISI, cityKey: 'თბილისი', districts: ['გლდანი'], type: 'Neighborhood',
    description: {
      ka: 'დიდი საძილე უბანი მეტროთი — ოჯახებისთვის ბიუჯეტური ფასებით, ახალი პარკებითა და სკოლებით.',
      en: 'A large sleeping district with a metro line — family-friendly budget prices, new parks and schools.',
      ru: 'Большой спальный район с веткой метро — бюджетные цены для семей, новые парки и школы.',
    },
    scores: { transport: 7, schools: 7, green: 6, safety: 7, nightlife: 3 },
    avgPriceM2USD: 780, img: '/images/neighborhoods/gldani.webp', coords: { lat: 41.80268, lng: 44.82915 },
  },
  {
    slug: 'isani',
    name: { ka: 'ისანი', en: 'Isani', ru: 'Исани' },
    city: TBILISI, cityKey: 'თბილისი', districts: ['ისანი'], type: 'Neighborhood',
    description: {
      ka: 'მტკვრის მარცხენა სანაპირო ცენტრთან ახლოს — ახალი კომპლექსები მდინარის ხედებით და სწრაფი ზრდის პოტენციალით.',
      en: 'The left bank of the Mtkvari near the center — new complexes with river views and fast growth potential.',
      ru: 'Левый берег Куры рядом с центром — новые комплексы с видом на реку и потенциалом быстрого роста.',
    },
    scores: { transport: 7, schools: 6, green: 6, safety: 7, nightlife: 4 },
    avgPriceM2USD: 950, img: '/images/neighborhoods/isani.webp', coords: { lat: 41.68813, lng: 44.83411 },
  },
  {
    slug: 'samgori',
    name: { ka: 'სამგორი', en: 'Samgori', ru: 'Самгори' },
    city: TBILISI, cityKey: 'თბილისი', districts: ['სამგორი'], type: 'Neighborhood',
    description: {
      ka: 'აღმოსავლეთ თბილისის პრაქტიკული უბანი — მეტრო, ავტოსადგური და ქალაქის ერთ-ერთი ყველაზე დაბალი ფასი კვადრატულზე.',
      en: 'East Tbilisi’s practical district — metro, the main bus terminal and some of the city’s lowest prices per m².',
      ru: 'Практичный район восточного Тбилиси — метро, главный автовокзал и одни из самых низких цен за м² в городе.',
    },
    scores: { transport: 7, schools: 6, green: 5, safety: 6, nightlife: 3 },
    avgPriceM2USD: 820, img: '/images/neighborhoods/samgori.webp', coords: { lat: 41.6847, lng: 44.85468 },
  },
  {
    slug: 'nadzaladevi',
    name: { ka: 'ნაძალადევი', en: 'Nadzaladevi', ru: 'Надзаладеви' },
    city: TBILISI, cityKey: 'თბილისი', districts: ['ნაძალადევი'], type: 'Neighborhood',
    description: {
      ka: 'ჩრდილოეთ თბილისის საძილე უბანი მეტროთი — დიდუბეს მეზობლად, ხელმისაწვდომი ფასები და კარგი კავშირი ცენტრთან.',
      en: 'A northern Tbilisi residential district on the metro — next to Didube, affordable prices and a solid link to the centre.',
      ru: 'Северный спальный район Тбилиси у метро — рядом с Дидубе, доступные цены и хорошая связь с центром.',
    },
    scores: { transport: 6, schools: 7, green: 6, safety: 7, nightlife: 3 },
    avgPriceM2USD: 850, img: '/images/neighborhoods/nadzaladevi.webp', coords: { lat: 41.74711, lng: 44.82073 },
  },
  {
    slug: 'lisi',
    name: { ka: 'ლისი', en: 'Lisi', ru: 'Лиси' },
    city: TBILISI, cityKey: 'თბილისი', districts: ['ლისი'], type: 'Neighborhood',
    description: {
      ka: 'ლისის ტბის ირგვლივ — ეკოლოგიური გამწვანებული სარტყელი, ტაუნჰაუსები და პრემიუმ კომპლექსები ჰაერითა და სიმშვიდით.',
      en: 'Around Lisi Lake — a green ecological belt with townhouses and premium complexes offering air and tranquility.',
      ru: 'Вокруг Лисского озера — зелёный экологический пояс с таунхаусами и премиальными комплексами, воздух и тишина.',
    },
    scores: { transport: 5, schools: 6, green: 10, safety: 8, nightlife: 2 },
    avgPriceM2USD: 1300, img: '/images/neighborhoods/lisi.webp', coords: { lat: 41.7439, lng: 44.7346 },
  },
  {
    slug: 'ortachala',
    name: { ka: 'ორთაჭალა', en: 'Ortachala', ru: 'Ортачала' },
    city: TBILISI, cityKey: 'თბილისი', districts: ['ორთაჭალა'], type: 'Neighborhood',
    description: {
      ka: 'ძველ თბილისთან მიმდებარე მშვიდი უბანი ბორცვზე — ცენტრის ხედები, მყუდრო ქუჩები და ზომიერი ფასები.',
      en: 'A calm hillside district next to Old Tbilisi — views over the center, quiet streets and moderate prices.',
      ru: 'Спокойный район на холме рядом со Старым Тбилиси — виды на центр, тихие улицы и умеренные цены.',
    },
    scores: { transport: 6, schools: 6, green: 6, safety: 7, nightlife: 4 },
    avgPriceM2USD: 1050, img: '/images/neighborhoods/ortachala.webp', coords: { lat: 41.68204, lng: 44.82625 },
  },
  {
    slug: 'didi-dighomi',
    name: { ka: 'დიდი დიღომი', en: 'Didi Dighomi', ru: 'Диди Дигоми' },
    city: TBILISI, cityKey: 'თბილისი', districts: ['დიდი დიღომი'], type: 'Neighborhood',
    description: {
      ka: 'ჩრდილო-დასავლეთის სწრაფად მზარდი უბანი — ახალი ბაზრობები, სკოლები და ფართო ბინები ოჯახებისთვის ცენტრის ფასის ნახევრად.',
      en: 'The fast-growing northwest — new markets, schools and spacious family flats at half the price of the center.',
      ru: 'Быстрорастущий северо-запад — новые рынки, школы и просторные семейные квартиры вдвое дешевле центра.',
    },
    scores: { transport: 6, schools: 7, green: 6, safety: 7, nightlife: 3 },
    avgPriceM2USD: 980, img: '/images/neighborhoods/didi-dighomi.webp', coords: { lat: 41.78844, lng: 44.75283 },
  },
  {
    slug: 'krtsanisi',
    name: { ka: 'კრწანისი', en: 'Krtsanisi', ru: 'Крцаниси' },
    city: TBILISI, cityKey: 'თბილისი', districts: ['კრწანისი'], type: 'Neighborhood',
    description: {
      ka: 'სამხრეთ თბილისის მშვიდი უბანი კრწანისის ტყე-პარკთან — დაბალი კორპუსები, ორთაჭალას მეზობლად. ფასი ვაკეზე დაბალია; ყიდულობენ სივრცესა და სიმშვიდეს, არა მეტროს.',
      en: 'A quiet southern district next to Krtsanisi forest park — low-rise blocks beside Ortachala. Prices sit below Vake; buyers come for space and calm, not the metro.',
      ru: 'Тихий южный район у лесопарка Крцаниси — малоэтажная застройка рядом с Ортачалой. Цены ниже Ваке; покупают пространство и тишину, не метро.',
    },
    scores: { transport: 5, schools: 6, green: 8, safety: 7, nightlife: 3 },
    // ponytail: shared hero until district photo lands
    avgPriceM2USD: 880, img: '/images/neighborhoods/ortachala.webp', coords: { lat: 41.67306, lng: 44.81717 },
  },
  {
    slug: 'avlabari',
    name: { ka: 'ავლაბარი', en: 'Avlabari', ru: 'Авлабари' },
    city: TBILISI, cityKey: 'თბილისი', districts: ['ავლაბარი'], type: 'Neighborhood',
    description: {
      ka: 'მტკვრის მარცხენა სანაპირო სამების კათედრალთან — მეტრო, ისტორიული ეზოები და ტურისტული ნაკადი. დღიური ქირა აქ მუშაობს; საცხოვრებლად უფრო ხმაურიანია, ვიდრე ვაკე.',
      en: 'The left bank by Holy Trinity Cathedral — metro, historic courtyards and tourist traffic. Daily rent works here; as a home it is louder than Vake.',
      ru: 'Левый берег у собора Самеба — метро, исторические дворы и туристический поток. Посуточная аренда работает; для жизни шумнее, чем Ваке.',
    },
    scores: { transport: 8, schools: 6, green: 5, safety: 7, nightlife: 7 },
    avgPriceM2USD: 1400, img: '/images/neighborhoods/old-tbilisi.webp', coords: { lat: 41.69265, lng: 44.81681 },
  },
  {
    slug: 'tskneti',
    name: { ka: 'წყნეთი', en: 'Tskneti', ru: 'Цкнети' },
    city: TBILISI, cityKey: 'თბილისი', districts: ['წყნეთი'], type: 'Neighborhood',
    description: {
      ka: 'ვაკის მთის გარეუბანი — აგარაკები, წიწვოვანი ჰაერი და ზამთრის თოვლი. თბილისის ცენტრამდე 20–30 წუთი; ყიდულობენ მეორე სახლს ან მუდმივ საცხოვრებელს ავტომობილით.',
      en: 'Vake’s mountain suburb — dachas, pine air and winter snow. 20–30 minutes to the centre; people buy a second home or a car-commute residence.',
      ru: 'Горный пригород Ваке — дачи, хвойный воздух и зимний снег. 20–30 минут до центра; покупают второй дом или жильё с машиной.',
    },
    scores: { transport: 4, schools: 5, green: 9, safety: 8, nightlife: 2 },
    avgPriceM2USD: 1250, img: '/images/neighborhoods/vake.webp', coords: { lat: 41.69391, lng: 44.69366 },
  },
  {
    slug: 'tskhvarichamia',
    name: { ka: 'ცხვარიჭამია', en: 'Tskhvarichamia', ru: 'Цхваричамия' },
    city: TBILISI, cityKey: 'თბილისი', districts: ['ცხვარიჭამია'], type: 'Neighborhood',
    description: {
      ka: 'წყნეთის მიღმა ტყის დასახლება — პრემიუმ აგარაკები და შაბათ-კვირის სახლები. ინვენტარი მცირეა; ყიდვამდე შეამოწმეთ ზამთრის გზა და გათბობა.',
      en: 'A forest settlement beyond Tskneti — premium dachas and weekend houses. Inventory is thin; check the winter road and heating before you buy.',
      ru: 'Лесное поселение за Цкнети — премиальные дачи и дома выходного дня. Инвентарь тонкий; до покупки проверьте зимнюю дорогу и отопление.',
    },
    scores: { transport: 3, schools: 4, green: 10, safety: 8, nightlife: 1 },
    avgPriceM2USD: 1100, img: '/images/neighborhoods/vake.webp', coords: { lat: 41.752, lng: 44.657 },
  },
  {
    slug: 'varketili',
    name: { ka: 'ვარკეთილი', en: 'Varketili', ru: 'Варкетили' },
    city: TBILISI, cityKey: 'თბილისი', districts: ['ვარკეთილი'], type: 'Neighborhood',
    description: {
      ka: 'აღმოსავლეთის მასივი მეტროთი — საბჭოთა კორპუსები და ახალი პროექტები თბილისის ზღვის მხარეს. ოჯახური უბანი ხელმისაწვდომი კვადრატით.',
      en: 'An eastern massiv on the metro — Soviet blocks and new projects toward Tbilisi Sea. A family district with an accessible price per m².',
      ru: 'Восточный массив у метро — советские корпуса и новостройки в сторону Тбилисского моря. Семейный район с доступной ценой за м².',
    },
    scores: { transport: 7, schools: 7, green: 6, safety: 6, nightlife: 3 },
    avgPriceM2USD: 850, img: '/images/neighborhoods/samgori.webp', coords: { lat: 41.70751, lng: 44.87025 },
  },
  {
    slug: 'digomis-masivi',
    name: { ka: 'დიღმის მასივი', en: 'Dighomi Massive', ru: 'Дигомский массив' },
    city: TBILISI, cityKey: 'თბილისი', districts: ['დიღმის მასივი'], type: 'Neighborhood',
    description: {
      ka: 'დიღომის I–VI კვარტლები — საბჭოთა პანელები ავტობუსითა და ახალი სავაჭროებით. კვადრატი დიდ დიღომის ახალ კორპუსებზე იაფია; ცენტრამდე ტრანსპორტი გადამწყვეტია.',
      en: 'Dighomi blocks I–VI — Soviet panels with buses and new retail. Cheaper per m² than Didi Dighomi’s new builds; the commute to the centre is the trade-off.',
      ru: 'Кварталы Дигоми I–VI — советские панели, автобусы и новые магазины. Дешевле новостроек Диди Дигоми; компромисс — дорога до центра.',
    },
    scores: { transport: 6, schools: 7, green: 5, safety: 6, nightlife: 3 },
    avgPriceM2USD: 900, img: '/images/neighborhoods/didi-dighomi.webp', coords: { lat: 41.76266, lng: 44.77492 },
  },
  {
    slug: 'baghebi',
    name: { ka: 'ბაგები', en: 'Baghebi', ru: 'Багеби' },
    city: TBILISI, cityKey: 'თბილისი', districts: ['ბაგები'], type: 'Neighborhood',
    description: {
      ka: 'ვაკის დასავლეთი კიდე კუს ტბის გზაზე — საელჩოები, მშვიდი ქუჩები და პრემიუმ სახლები. ფასი ვაკეს უახლოვდება; მეტრო არ არის.',
      en: 'The western edge of Vake on the Turtle Lake road — embassies, quiet streets and premium houses. Prices approach Vake; there is no metro.',
      ru: 'Западный край Ваке по дороге к Черепашьему озеру — посольства, тихие улицы и премиальные дома. Цены близки к Ваке; метро нет.',
    },
    scores: { transport: 5, schools: 8, green: 8, safety: 9, nightlife: 3 },
    avgPriceM2USD: 1550, img: '/images/neighborhoods/vake.webp', coords: { lat: 41.70821, lng: 44.73109 },
  },
  {
    slug: 'nutsubidze',
    name: { ka: 'ნუცუბიძის ფერდობი', en: 'Nutsubidze Plateau', ru: 'Плато Нуцубидзе' },
    city: TBILISI, cityKey: 'თბილისი', districts: ['ნუცუბიძის ფერდობი'], type: 'Neighborhood',
    description: {
      ka: 'საბურთალოს ფერდობი ხედებით — ციცაბო ქუჩები, ახალი მაღალსართულიანები და ვაჟა-ფშაველას მეტრო ფეხით. ყიდულობენ ხედს; პარკირება და ლიფტი გადამწყვეტია.',
      en: 'Saburtalo’s hillside with views — steep streets, new towers and Vazha-Pshavela metro on foot. Buyers pay for the view; parking and lifts decide comfort.',
      ru: 'Склон Сабуртало с видами — крутые улицы, новые башни и метро Важа-Пшавела пешком. Покупают вид; парковка и лифт решают комфорт.',
    },
    scores: { transport: 7, schools: 7, green: 6, safety: 7, nightlife: 4 },
    avgPriceM2USD: 1100, img: '/images/neighborhoods/saburtalo.webp', coords: { lat: 41.73372, lng: 44.72501 },
  },
  {
    slug: 'vashlijvari',
    name: { ka: 'ვაშლიჯვარი', en: 'Vashlijvari', ru: 'Вашлиджвари' },
    city: TBILISI, cityKey: 'თბილისი', districts: ['ვაშლიჯვარი'], type: 'Neighborhood',
    description: {
      ka: 'საბურთალოსა და დიღომს შორის ახალი სამშენებლო დერეფანი — გელოვანის გამზირი, ახალი კორპუსები და მზარდი ფასი. ჯერ კიდევ იაფია ვაკეზე.',
      en: 'The new-build corridor between Saburtalo and Dighomi — Gelovani Avenue, fresh towers and rising prices. Still cheaper than Vake.',
      ru: 'Коридор новостроек между Сабуртало и Дигоми — проспект Геловани, новые корпуса и растущая цена. Всё ещё дешевле Ваке.',
    },
    scores: { transport: 6, schools: 6, green: 6, safety: 7, nightlife: 3 },
    avgPriceM2USD: 1000, img: '/images/neighborhoods/saburtalo.webp', coords: { lat: 41.75541, lng: 44.76644 },
  },
  {
    slug: 'temka',
    name: { ka: 'თემქა', en: 'Temka', ru: 'Темка' },
    city: TBILISI, cityKey: 'თბილისი', districts: ['თემქა'], type: 'Neighborhood',
    description: {
      ka: 'გლდან-ნაძალადევის მასივი თბილისის ზღვის მხარეს — ახალი პროექტები და ხელმისაწვდომი კვადრატი. მეტრო პირდაპირ არ შედის; ავტობუსი და მანქანა ძირითადი გზაა.',
      en: 'A Gldani–Nadzaladevi massiv toward Tbilisi Sea — new projects and an accessible m². No direct metro; bus and car are the default.',
      ru: 'Массив Глдани–Надзаладеви к Тбилисскому морю — новостройки и доступный м². Прямого метро нет; автобус и машина — основной путь.',
    },
    scores: { transport: 5, schools: 6, green: 6, safety: 6, nightlife: 2 },
    avgPriceM2USD: 800, img: '/images/neighborhoods/gldani.webp', coords: { lat: 41.75832, lng: 44.8525 },
  },
  {
    slug: 'mukhiani',
    name: { ka: 'მუხიანი', en: 'Mukhiani', ru: 'Мухиани' },
    city: TBILISI, cityKey: 'თბილისი', districts: ['მუხიანი'], type: 'Neighborhood',
    description: {
      ka: 'გლდანის საბჭოთა მასივი — ქალაქის ერთ-ერთი ყველაზე დაბალი ფასი კვადრატზე. მეტრო გლდანი ახლოსაა; ყიდულობენ პირველ ბინას და ქირას, არა პრესტიჟს.',
      en: 'A Soviet Gldani massiv — among the city’s lowest prices per m². Gldani metro is close; people buy a first flat or a rental, not prestige.',
      ru: 'Советский массив Глдани — одна из самых низких цен за м² в городе. Метро Глдани рядом; покупают первую квартиру или аренду, не престиж.',
    },
    scores: { transport: 7, schools: 6, green: 5, safety: 6, nightlife: 2 },
    avgPriceM2USD: 720, img: '/images/neighborhoods/gldani.webp', coords: { lat: 41.78671, lng: 44.84083 },
  },
  {
    slug: 'vazisubani',
    name: { ka: 'ვაზისუბანი', en: 'Vazisubani', ru: 'Вазисубани' },
    city: TBILISI, cityKey: 'თბილისი', districts: ['ვაზისუბანი'], type: 'Neighborhood',
    description: {
      ka: 'ისნის ზემოთ სამგორის მეზობლად — ახალი კორპუსები და საშუალო ფასი. ცენტრამდე უფრო ახლოსაა, ვიდრე გლდანი; მეტრო ისანი/სამგორი ფეხით ან ავტობუსით.',
      en: 'Above Isani, next to Samgori — new blocks at a mid-range price. Closer to the centre than Gldani; Isani/Samgori metro by foot or bus.',
      ru: 'Над Исани, рядом с Самгори — новые корпуса по средней цене. Ближе к центру, чем Глдани; метро Исани/Самгори пешком или на автобусе.',
    },
    scores: { transport: 6, schools: 6, green: 5, safety: 6, nightlife: 3 },
    avgPriceM2USD: 900, img: '/images/neighborhoods/isani.webp', coords: { lat: 41.70405, lng: 44.84942 },
  },
  {
    slug: 'batumi',
    name: { ka: 'ბათუმი', en: 'Batumi', ru: 'Батуми' },
    city: BATUMI, cityKey: 'ბათუმი',
    districts: ['ახალი ბულვარი', 'ძველი ბათუმი', 'მახინჯაური', 'რუსთაველის უბანი', 'აეროპორტის უბანი'], type: 'City',
    description: {
      ka: 'შავი ზღვის საკურორტო დედაქალაქი — ბულვარი, ახალი ბულვარის კოშკები და მთის ხედები. სეზონური ქირის შემოსავლის #1 ბაზარი საქართველოში.',
      en: 'The Black Sea resort capital — the boulevard, New Boulevard towers and mountain views. Georgia’s #1 market for seasonal rental income.',
      ru: 'Курортная столица Черного моря — бульвар, башни Нового бульвара и вид на горы. Рынок №1 в Грузии по доходу от сезонной аренды.',
    },
    scores: { transport: 7, schools: 6, green: 8, safety: 8, nightlife: 9 },
    avgPriceM2USD: 1100, img: '/images/neighborhoods/batumi.webp', coords: { lat: 41.6461, lng: 41.636 },
  },
  {
    slug: 'akhali-bulvari',
    name: { ka: 'ახალი ბულვარი', en: 'New Boulevard', ru: 'Новый бульвар' },
    city: BATUMI, cityKey: 'ბათუმი', districts: ['ახალი ბულვარი'], type: 'Neighborhood',
    description: {
      ka: 'ბათუმის სანაპირო კოშკები — ზღვის ხედი, Alliance და ORBI. საინვესტიციო #1 უბანი: სეზონური ქირა მაღალია, ზამთარი უფრო ცარიელი. კვადრატი ქალაქის პრემიუმია.',
      en: 'Batumi’s seafront towers — sea views, Alliance and ORBI. The #1 investment strip: summer rent is high, winter quieter. The city’s premium m².',
      ru: 'Башни набережной Батуми — вид на море, Alliance и ORBI. Полоса №1 для инвестиций: лето дорогое, зима тише. Премиальный м² города.',
    },
    scores: { transport: 7, schools: 5, green: 7, safety: 8, nightlife: 9 },
    avgPriceM2USD: 1400, img: '/images/neighborhoods/batumi.webp', coords: { lat: 41.6508, lng: 41.6495 },
  },
  {
    slug: 'dzveli-batumi',
    name: { ka: 'ძველი ბათუმი', en: 'Old Batumi', ru: 'Старый Батуми' },
    city: BATUMI, cityKey: 'ბათუმი', districts: ['ძველი ბათუმი'], type: 'Neighborhood',
    description: {
      ka: 'ისტორიული ბირთვი პიაცასთან — დაბალი შენობები, კაფეები და დღიური ქირა. ზღვის ხედი იშვიათია; ყიდულობენ ატმოსფეროს და ფეხით სიარულს, არა ცათამბჯენს.',
      en: 'The historic core around Piazza — low buildings, cafés and daily rent. Sea views are rare; buyers want walkability, not a tower.',
      ru: 'Историческое ядро у Пьяццы — низкая застройка, кафе и посуточная аренда. Вид на море редок; покупают атмосферу и пешую доступность, не башню.',
    },
    scores: { transport: 8, schools: 6, green: 5, safety: 8, nightlife: 9 },
    avgPriceM2USD: 1200, img: '/images/neighborhoods/batumi.webp', coords: { lat: 41.6506, lng: 41.6369 },
  },
  {
    slug: 'makhinjauri',
    name: { ka: 'მახინჯაური', en: 'Makhinjauri', ru: 'Махинджаури' },
    city: BATUMI, cityKey: 'ბათუმი', districts: ['მახინჯაური'], type: 'Neighborhood',
    description: {
      ka: 'ბათუმის ჩრდილოეთი, სადაც მთა ზღვას ეყრდნობა — უფრო მშვიდი და იაფი ბულვარზე. რკინიგზის გაჩერება ახლოსაა; სეზონი იგივეა, ღამის ფასი დაბალი.',
      en: 'North of Batumi, where the mountain meets the sea — quieter and cheaper than the boulevard. A rail stop nearby; the season is the same, the nightly rate lower.',
      ru: 'Север Батуми, где гора упирается в море — тише и дешевле бульвара. Железнодорожная остановка рядом; сезон тот же, ночная цена ниже.',
    },
    scores: { transport: 6, schools: 5, green: 8, safety: 7, nightlife: 4 },
    avgPriceM2USD: 950, img: '/images/neighborhoods/batumi.webp', coords: { lat: 41.6736, lng: 41.7139 },
  },
  {
    slug: 'rustavelis-ubani',
    name: { ka: 'რუსთაველის უბანი', en: 'Rustaveli District', ru: 'Район Руставели' },
    city: BATUMI, cityKey: 'ბათუმი', districts: ['რუსთაველის უბანი'], type: 'Neighborhood',
    description: {
      ka: 'ბათუმის საცხოვრებელი უბანი სანაპიროს მიღმა — ადგილობრივი ოჯახები, სკოლები, უფრო დაბალი ფასი. ქირა აქ მთელი წელია, არა მხოლოდ ივლისი.',
      en: 'A residential Batumi district behind the seafront — local families, schools, a lower price. Rent here runs year-round, not only in July.',
      ru: 'Жилой район Батуми за набережной — местные семьи, школы, ниже цена. Аренда здесь круглая, не только в июле.',
    },
    scores: { transport: 7, schools: 7, green: 5, safety: 7, nightlife: 5 },
    avgPriceM2USD: 850, img: '/images/neighborhoods/batumi.webp', coords: { lat: 41.638, lng: 41.62 },
  },
  {
    slug: 'airport-ubani',
    name: { ka: 'აეროპორტის უბანი', en: 'Airport District', ru: 'Район аэропорта' },
    city: BATUMI, cityKey: 'ბათუმი', districts: ['აეროპორტის უბანი'], type: 'Neighborhood',
    description: {
      ka: 'სამხრეთ ბათუმი აეროპორტთან — ყველაზე ხელმისაწვდომი კვადრატი ქალაქში. ხმაური და ლოჯისტიკა კომპრომისია; ყიდულობენ ბიუჯეტსა და ფრენასთან სიახლოვეს.',
      en: 'South Batumi by the airport — the city’s most accessible m². Noise and logistics are the trade-off; buyers want budget and proximity to flights.',
      ru: 'Юг Батуми у аэропорта — самый доступный м² в городе. Шум и логистика — компромисс; покупают бюджет и близость к рейсам.',
    },
    scores: { transport: 8, schools: 5, green: 4, safety: 6, nightlife: 3 },
    avgPriceM2USD: 750, img: '/images/neighborhoods/batumi.webp', coords: { lat: 41.6103, lng: 41.5997 },
  },
  {
    slug: 'kutaisi',
    name: { ka: 'ქუთაისი', en: 'Kutaisi', ru: 'Кутаиси' },
    city: KUTAISI, cityKey: 'ქუთაისი', districts: ['ცენტრი', 'ავტოქარხანა', 'ნიკეა'], type: 'City',
    description: {
      ka: 'იმერეთის დედაქალაქი და საერთაშორისო აეროპორტის ქალაქი — ქვის ხიდები, ბაგრატი და ქვეყნის ყველაზე ხელმისაწვდომი ფასები დიდ ქალაქებში.',
      en: 'The capital of Imereti and an international airport city — stone bridges, Bagrati Cathedral and the most affordable prices among Georgia’s big cities.',
      ru: 'Столица Имерети и город международного аэропорта — каменные мосты, собор Баграти и самые доступные цены среди крупных городов Грузии.',
    },
    scores: { transport: 6, schools: 7, green: 7, safety: 8, nightlife: 5 },
    avgPriceM2USD: 650, img: '/images/neighborhoods/kutaisi.webp', coords: { lat: 42.2679, lng: 42.718 },
  },
  {
    slug: 'kutaisi-centri',
    name: { ka: 'ქუთაისის ცენტრი', en: 'Kutaisi Center', ru: 'Центр Кутаиси' },
    city: KUTAISI, cityKey: 'ქუთაისი', districts: ['ცენტრი'], type: 'Neighborhood',
    description: {
      ka: 'თეთრი ხიდი, რიონი და ბაგრატის ხედი — ქუთაისის ისტორიული ბირთვი. ბინები აქ ყველაზე ძვირია ქალაქში, მაგრამ თბილისის ცენტრზე მაინც იაფი. დღიური ქირა აეროპორტის მგზავრებზე მუშაობს.',
      en: 'White Bridge, the Rioni and the Bagrati view — Kutaisi’s historic core. Flats here are the city’s dearest, still cheaper than central Tbilisi. Daily rent serves airport passengers.',
      ru: 'Белый мост, Риони и вид на Баграти — историческое ядро Кутаиси. Квартиры здесь самые дорогие в городе, но всё ещё дешевле центра Тбилиси. Посуточная аренда работает на пассажиров аэропорта.',
    },
    scores: { transport: 7, schools: 7, green: 6, safety: 8, nightlife: 6 },
    avgPriceM2USD: 750, img: '/images/neighborhoods/kutaisi.webp', coords: { lat: 42.271, lng: 42.705 },
  },
  {
    slug: 'avtokarkhana',
    name: { ka: 'ავტოქარხანა', en: 'Avtokarkhana', ru: 'Автокархана' },
    city: KUTAISI, cityKey: 'ქუთაისი', districts: ['ავტოქარხანა'], type: 'Neighborhood',
    description: {
      ka: 'საბჭოთა ინდუსტრიული უბანი — პანელური ბინები და დაბალი ფასი. ცენტრამდე ავტობუსით; ყიდულობენ საცხოვრებლად და ქირაზე, არა ტურისტულ ბინას.',
      en: 'A Soviet industrial district — panel flats and a low price. Bus to the centre; people buy to live or let long-term, not a tourist flat.',
      ru: 'Советский промышленный район — панельные квартиры и низкая цена. До центра на автобусе; покупают для жизни и долгосрочной аренды, не туристическую квартиру.',
    },
    scores: { transport: 5, schools: 6, green: 5, safety: 6, nightlife: 3 },
    avgPriceM2USD: 580, img: '/images/neighborhoods/kutaisi.webp', coords: { lat: 42.249, lng: 42.672 },
  },
  {
    slug: 'nikea',
    name: { ka: 'ნიკეა', en: 'Nikea', ru: 'Никеа' },
    city: KUTAISI, cityKey: 'ქუთაისი', districts: ['ნიკეა'], type: 'Neighborhood',
    description: {
      ka: 'ქუთაისის საძილე უბანი — ოჯახები, სკოლები და ქალაქის ყველაზე ხელმისაწვდომი კვადრატი. ახალი მშენებლობა იშვიათია; ინვენტარი ძირითადად საბჭოთა კორპუსებია.',
      en: 'Kutaisi’s sleeping district — families, schools and the city’s most accessible m². New builds are rare; inventory is mostly Soviet blocks.',
      ru: 'Спальный район Кутаиси — семьи, школы и самый доступный м² в городе. Новостроек мало; инвентарь в основном советские корпуса.',
    },
    scores: { transport: 5, schools: 7, green: 6, safety: 7, nightlife: 2 },
    avgPriceM2USD: 550, img: '/images/neighborhoods/kutaisi.webp', coords: { lat: 42.256, lng: 42.689 },
  },
]

export function getNeighborhood(slug: string): Neighborhood | undefined {
  return NEIGHBORHOODS.find((n) => n.slug === slug)
}

/** Overall livability = mean of the five category scores, one decimal. */
export function overallScore(n: Neighborhood): number {
  const s = n.scores
  return Math.round(((s.transport + s.schools + s.green + s.safety + s.nightlife) / 5) * 10) / 10
}
