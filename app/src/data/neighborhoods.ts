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
      ka: 'თბილისის ყველაზე პრესტიჟული საცხოვრებელი უბანი — ვაკის პარკი, ჩავჭავაძის გამზირი, საუკეთესო სკოლები და კაფე-კულტურა. სტაბილური მოთხოვნა ოჯახებისა და ექსპატების მხრიდან.',
      en: 'Tbilisi’s most prestigious residential district — Vake Park, Chavchavadze Avenue, top schools and café culture. Steady demand from families and expats.',
      ru: 'Самый престижный жилой район Тбилиси — парк Ваке, проспект Чавчавадзе, лучшие школы и кафе-культура. Стабильный спрос со стороны семей и экспатов.',
    },
    scores: { transport: 8, schools: 9, green: 8, safety: 9, nightlife: 7 },
    avgPriceM2USD: 1450, img: '/images/p1.webp', coords: { lat: 41.7078, lng: 44.7647 },
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
    avgPriceM2USD: 1150, img: '/images/p2.webp', coords: { lat: 41.7224, lng: 44.7571 },
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
    avgPriceM2USD: 1600, img: '/images/p3.webp', coords: { lat: 41.6938, lng: 44.8071 },
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
    avgPriceM2USD: 1850, img: '/images/p4.webp', coords: { lat: 41.7008, lng: 44.7926 },
  },
  {
    slug: 'vera',
    name: { ka: 'ვერა', en: 'Vera', ru: 'Вера' },
    city: TBILISI, cityKey: 'თბილისი', districts: [], type: 'Neighborhood',
    description: {
      ka: 'ბოჰემური უბანი ვაკესა და ცენტრს შორის — მშვიდი ქუჩები, ბარები და სტუდიო-ბინები ახალგაზრდა პროფესიონალებისთვის.',
      en: 'A bohemian quarter between Vake and the center — quiet streets, bars and studio flats for young professionals.',
      ru: 'Богемный квартал между Ваке и центром — тихие улицы, бары и студии для молодых профессионалов.',
    },
    scores: { transport: 7, schools: 7, green: 6, safety: 8, nightlife: 8 },
    avgPriceM2USD: 1500, img: '/images/p5.webp', coords: { lat: 41.7081, lng: 44.7868 },
  },
  {
    slug: 'chugureti',
    name: { ka: 'ჩუღურეთი', en: 'Chugureti', ru: 'Чугурети' },
    city: TBILISI, cityKey: 'თბილისი', districts: [], type: 'Neighborhood',
    description: {
      ka: 'მარჯვენა სანაპიროს აღმომავალი უბანი — ფაბრიკა, ევროპული მოედნები და განახლებული ისტორიული შენობები. ინვესტორების ახალი ფოკუსი.',
      en: 'The rising right-bank district — Fabrika, European-style squares and restored historic buildings. The new focus for investors.',
      ru: 'Восходящий правобережный район — «Фабрика», европейские площади и отреставрированные исторические здания. Новый фокус инвесторов.',
    },
    scores: { transport: 8, schools: 6, green: 5, safety: 7, nightlife: 8 },
    avgPriceM2USD: 1200, img: '/images/p6.webp', coords: { lat: 41.7176, lng: 44.8017 },
  },
  {
    slug: 'didube',
    name: { ka: 'დიდუბე', en: 'Didube', ru: 'Дидубе' },
    city: TBILISI, cityKey: 'თბილისი', districts: [], type: 'Neighborhood',
    description: {
      ka: 'მეტროსადგურებისა და ბაზრობის უბანი — ხელმისაწვდომი ფასები და შესანიშნავი სატრანსპორტო კავშირი ქალაქის ნებისმიერ წერტილთან.',
      en: 'A district of metro stations and the bazaar — affordable prices and excellent transport links to any point of the city.',
      ru: 'Район станций метро и базара — доступные цены и отличная транспортная связь с любой точкой города.',
    },
    scores: { transport: 8, schools: 6, green: 5, safety: 6, nightlife: 4 },
    avgPriceM2USD: 900, img: '/images/np1.webp', coords: { lat: 41.7437, lng: 44.781 },
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
    avgPriceM2USD: 780, img: '/images/np2.webp', coords: { lat: 41.7824, lng: 44.8197 },
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
    avgPriceM2USD: 950, img: '/images/p1.webp', coords: { lat: 41.6877, lng: 44.842 },
  },
  {
    slug: 'samgori',
    name: { ka: 'სამგორი', en: 'Samgori', ru: 'Самгори' },
    city: TBILISI, cityKey: 'თბილისი', districts: [], type: 'Neighborhood',
    description: {
      ka: 'აღმოსავლეთ თბილისის პრაქტიკული უბანი — მეტრო, ავტოსადგური და ქალაქის ერთ-ერთი ყველაზე დაბალი ფასი კვადრატულზე.',
      en: 'East Tbilisi’s practical district — metro, the main bus terminal and some of the city’s lowest prices per m².',
      ru: 'Практичный район восточного Тбилиси — метро, главный автовокзал и одни из самых низких цен за м² в городе.',
    },
    scores: { transport: 7, schools: 6, green: 5, safety: 6, nightlife: 3 },
    avgPriceM2USD: 820, img: '/images/p2.webp', coords: { lat: 41.7028, lng: 44.862 },
  },
  {
    slug: 'nadzaladevi',
    name: { ka: 'ნაძალადევი', en: 'Nadzaladevi', ru: 'Надзаладеви' },
    city: TBILISI, cityKey: 'თბილისი', districts: [], type: 'Neighborhood',
    description: {
      ka: 'დიდი დიღმის მეზობელი უბანი ტრამვაის ხაზით — ოჯახური, მშვიდი და ფასებით, რომელიც ჯერ არ არის გაფუჭებული მოთხოვნით.',
      en: 'Dighomi’s neighbour on the tram line — family-oriented, calm, with prices not yet spoiled by demand.',
      ru: 'Соседний с Дигоми район на трамвайной линии — семейный, спокойный, с ценами, ещё не испорченными спросом.',
    },
    scores: { transport: 6, schools: 7, green: 6, safety: 7, nightlife: 3 },
    avgPriceM2USD: 850, img: '/images/p3.webp', coords: { lat: 41.734, lng: 44.778 },
  },
  {
    slug: 'lisi',
    name: { ka: 'ლისი', en: 'Lisi', ru: 'Лиси' },
    city: TBILISI, cityKey: 'თბილისი', districts: [], type: 'Neighborhood',
    description: {
      ka: 'ლისის ტბის ირგვლივ — ეკოლოგიური გამწვანებული სარტყელი, ტაუნჰაუსები და პრემიუმ კომპლექსები ჰაერითა და სიმშვიდით.',
      en: 'Around Lisi Lake — a green ecological belt with townhouses and premium complexes offering air and tranquility.',
      ru: 'Вокруг Лисского озера — зелёный экологический пояс с таунхаусами и премиальными комплексами, воздух и тишина.',
    },
    scores: { transport: 5, schools: 6, green: 10, safety: 8, nightlife: 2 },
    avgPriceM2USD: 1300, img: '/images/p4.webp', coords: { lat: 41.7381, lng: 44.7397 },
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
    avgPriceM2USD: 1050, img: '/images/p5.webp', coords: { lat: 41.6843, lng: 44.82 },
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
    avgPriceM2USD: 980, img: '/images/p6.webp', coords: { lat: 41.7667, lng: 44.765 },
  },
  {
    slug: 'batumi',
    name: { ka: 'ბათუმი', en: 'Batumi', ru: 'Батуми' },
    city: BATUMI, cityKey: 'ბათუმი',
    districts: ['ახალი ბულვარი', 'ძველი ბათუმი', 'მახინჯაური'], type: 'City',
    description: {
      ka: 'შავი ზღვის საკურორტო დედაქალაქი — ბულვარი, ახალი ბულვარის კოშკები და მთის ხედები. სეზონური ქირის შემოსავლის #1 ბაზარი საქართველოში.',
      en: 'The Black Sea resort capital — the boulevard, New Boulevard towers and mountain views. Georgia’s #1 market for seasonal rental income.',
      ru: 'Курортная столица Черного моря — бульвар, башни Нового бульвара и вид на горы. Рынок №1 в Грузии по доходу от сезонной аренды.',
    },
    scores: { transport: 7, schools: 6, green: 8, safety: 8, nightlife: 9 },
    avgPriceM2USD: 1100, img: '/images/np2.webp', coords: { lat: 41.6461, lng: 41.636 },
  },
  {
    slug: 'kutaisi',
    name: { ka: 'ქუთაისი', en: 'Kutaisi', ru: 'Кутаиси' },
    city: KUTAISI, cityKey: 'ქუთაისი', districts: ['ცენტრი', 'ავტოქარხანა'], type: 'City',
    description: {
      ka: 'იმერეთის დედაქალაქი და საერთაშორისო აეროპორტის ქალაქი — ქვის ხიდები, ბაგრატი და ქვეყნის ყველაზე ხელმისაწვდომი ფასები დიდ ქალაქებში.',
      en: 'The capital of Imereti and an international airport city — stone bridges, Bagrati Cathedral and the most affordable prices among Georgia’s big cities.',
      ru: 'Столица Имерети и город международного аэропорта — каменные мосты, собор Баграти и самые доступные цены среди крупных городов Грузии.',
    },
    scores: { transport: 6, schools: 7, green: 7, safety: 8, nightlife: 5 },
    avgPriceM2USD: 650, img: '/images/np1.webp', coords: { lat: 42.2679, lng: 42.718 },
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
