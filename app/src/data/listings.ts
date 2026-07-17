/**
 * SIVRCE — Shared listings data layer
 * Single source of truth for the homepage carousel, search page and
 * listing detail page. All client-side; a future API can replace LISTINGS.
 */

export type DealType = 'sale' | 'rent' | 'daily'
export type PropType = 'apartment' | 'house' | 'commercial' | 'land'
export type Badge = 'SUPER VIP' | 'VIP+' | 'VIP' | null

export interface Agent {
  name: string
  phone: string
  agency: string
}

export interface Listing {
  id: string
  img: string
  images: string[]
  priceUSD: number
  priceGEL: number
  perM2USD: number
  title: string
  address: string
  city: string
  district: string
  dealType: DealType
  propType: PropType
  rooms: number
  beds: number
  baths: number
  area: number
  floor: number
  totalFloors: number
  views: number
  badge: Badge
  ai: { score: number; label: string }
  features: string[]
  description: string
  coords: { lat: number; lng: number }
  postedAt: string // ISO date
  agent: Agent
  isNew: boolean
}

/** USD → GEL rate used across the platform (display only) */
export const USD_GEL = 2.7

const AGENTS: Agent[] = [
  { name: 'ნინო ბერიძე', phone: '+995 555 12 34 56', agency: 'სივრცე პრემიუმ' },
  { name: 'გიორგი მამულაშვილი', phone: '+995 577 98 76 54', agency: 'Capital Estate' },
  { name: 'ანა კვარაცხელია', phone: '+995 593 45 67 89', agency: 'სივრცე პრემიუმ' },
  { name: 'დავით ჯაფარიძე', phone: '+995 568 23 45 67', agency: 'Tbilisi Homes' },
  { name: 'მარიამ ლომიძე', phone: '+995 551 87 65 43', agency: 'Adjarinvest' },
  { name: 'ლუკა გელაშვილი', phone: '+995 579 11 22 33', agency: 'სივრცე პრემიუმ' },
]

const TBILISI = { lat: 41.7151, lng: 44.8271 }

export const LISTINGS: Listing[] = [
  // ——— Homepage 6 (order & figures locked with the homepage) ———
  {
    id: 'vake-chavchavadze-47',
    img: '/images/p1.webp',
    images: ['/images/p1.webp', '/images/p4.webp', '/images/p6.webp', '/images/np1.webp'],
    priceUSD: 285000, priceGEL: 769500, perM2USD: 3167,
    title: 'მოდერნული 2-ოთახიანი პანორამული ხედით',
    address: 'ჩავჭავაძის 47, ვაკე, თბილისი',
    city: 'თბილისი', district: 'ვაკე',
    dealType: 'sale', propType: 'apartment',
    rooms: 2, beds: 3, baths: 2, area: 90, floor: 12, totalFloors: 18,
    views: 3200, badge: 'SUPER VIP',
    ai: { score: 94, label: 'შესანიშნავი ფასი' },
    features: ['პანორამული ფანჯრები', 'ცენტრალური გათბობა', 'ავტოფარეხი', 'დიზაინერული რემონტი', 'ტექნიკით', 'აუზი კომპლექსში'],
    description: 'პრემიუმ კომპლექსში, ჩავჭავაძეზე, იყიდება განათებული 2-ოთახიანი ბინა ქალაქის პანორამული ხედით. დიზაინერული რემონტი შესრულებულია ევროპული მასალებით, ბინა სრულად არის განთავსებული ტექნიკით. კომპლექსს აქვს დაცული ეზო, ფიტნესი და მიწისქვეშა პარკინგი.',
    coords: { lat: 41.7055, lng: 44.7708 },
    postedAt: '2026-06-08',
    agent: AGENTS[0]!,
    isNew: true,
  },
  {
    id: 'saburtalo-pekin-12',
    img: '/images/p2.webp',
    images: ['/images/p2.webp', '/images/p1.webp', '/images/p5.webp', '/images/np2.webp'],
    priceUSD: 640000, priceGEL: 1728000, perM2USD: 3765,
    title: 'პენტჰაუსი ტერასით, საბურთალო',
    address: 'პეკინის 12, საბურთალო, თბილისი',
    city: 'თბილისი', district: 'საბურთალო',
    dealType: 'sale', propType: 'apartment',
    rooms: 5, beds: 5, baths: 3, area: 170, floor: 22, totalFloors: 22,
    views: 5800, badge: 'SUPER VIP',
    ai: { score: 89, label: 'კარგი ფასი' },
    features: ['კერძო ტერასა 40 მ²', 'სარდაფიანი პარკინგი', 'სმარტ სახლი', 'კონსიერჟი 24/7', 'კამინი', 'გარდერობული'],
    description: 'უნიკალური პენტჰაუსი თბილისის ერთ-ერთ ყველაზე პრესტიჟულ კომპლექსში — 40 კვადრატული ტერასით და 360° ხედით. შინაგანი სივრცე დაპროექტებულია იტალიური სტუდიის მიერ, გამოყენებულია მხოლოდ ბუნებრივი მასალები. იდეალურია მათთვის, ვინც ეძებს გამონაკლისს.',
    coords: { lat: 41.7225, lng: 44.7619 },
    postedAt: '2026-06-05',
    agent: AGENTS[1]!,
    isNew: true,
  },
  {
    id: 'tskvarichamia-mshvidoba-8',
    img: '/images/p3.webp',
    images: ['/images/p3.webp', '/images/np1.webp', '/images/p2.webp'],
    priceUSD: 420000, priceGEL: 1134000, perM2USD: 2100,
    title: 'ავტორის ვილა აუზით, ცხვარიჭამია',
    address: 'მშვიდობის ქ. 8, თბილისის მიდამო',
    city: 'თბილისი', district: 'ცხვარიჭამია',
    dealType: 'sale', propType: 'house',
    rooms: 6, beds: 6, baths: 4, area: 320, floor: 2, totalFloors: 2,
    views: 2100, badge: 'VIP+',
    ai: { score: 91, label: 'შესანიშნავი ფასი' },
    features: ['გათბობილი აუზი', 'ეზო 800 მ²', 'საუნა', 'ღვინის მარანი', 'გენერატორი', 'ვიდეოთვათვალი'],
    description: 'ავტორის პროექტით აშენებული ვილა ცხვარიჭამიაში, თბილისიდან 20 წუთში. 800 მ² გამწვანებული ეზო, გათბობილი აუზი და სრული პრივატულობა. სახლი აშენებულია ენერგოეფექტური სტანდარტით და იყიდება ავეჯით.',
    coords: { lat: 41.7671, lng: 44.6832 },
    postedAt: '2026-05-30',
    agent: AGENTS[2]!,
    isNew: false,
  },
  {
    id: 'vake-abashidze-34',
    img: '/images/p4.webp',
    images: ['/images/p4.webp', '/images/p1.webp', '/images/p6.webp'],
    priceUSD: 158500, priceGEL: 427950, perM2USD: 2264,
    title: 'ახალი აშენებული ბინა ვაკეში',
    address: 'აბაშიძის 34, ვაკე, თბილისი',
    city: 'თბილისი', district: 'ვაკე',
    dealType: 'sale', propType: 'apartment',
    rooms: 2, beds: 2, baths: 1, area: 70, floor: 7, totalFloors: 12,
    views: 1900, badge: 'VIP+',
    ai: { score: 87, label: 'კარგი ფასი' },
    features: ['ახალი აშენებული', 'მწვანე კარკასი', 'პარკინგი', 'ლიფტი', 'ბავშვთა მოედანი'],
    description: 'ახალაშენებულ კომპლექსში, აბაშიძის ქუჩაზე, იყიდება მზიანი ბინა მწვანე კარკასის მდგომარეობით. პროექტი უკვე დასრულებულია, შესაძლებელია დაუყოვნებლივ შესვლა. მისაღები ფასი ვაკის ბაზრისთვის.',
    coords: { lat: 41.7078, lng: 44.7644 },
    postedAt: '2026-06-09',
    agent: AGENTS[3]!,
    isNew: true,
  },
  {
    id: 'mtatsminda-sanapiro-5',
    img: '/images/p5.webp',
    images: ['/images/p5.webp', '/images/p2.webp', '/images/p4.webp'],
    priceUSD: 112000, priceGEL: 302400, perM2USD: 1750,
    title: 'მზიანი სტუდიო მთაწმინდაზე',
    address: 'სანაპიროს 5, მთაწმინდა, თბილისი',
    city: 'თბილისი', district: 'მთაწმინდა',
    dealType: 'sale', propType: 'apartment',
    rooms: 1, beds: 1, baths: 1, area: 64, floor: 4, totalFloors: 9,
    views: 1400, badge: 'VIP',
    ai: { score: 82, label: 'საშუალო ფასი' },
    features: ['მთის ხედი', 'რემონტით', 'ბუნებრივი აირი', 'ინტერნეტი', 'კონდიციონერი'],
    description: 'სანაპიროზე, მთაწმინდის ტყის გვერდით, იყიდება მყუდრო სტუდიო-ტიპის ბინა რემონტით. მშვიდი უბანი, სუფთა ჰაერი და ცენტრამდე 10 წუთის სავალი. შესანიშნავი ვარიანტია როგორც საცხოვრებლად, ისე ინვესტიციისთვის.',
    coords: { lat: 41.6989, lng: 44.7858 },
    postedAt: '2026-05-28',
    agent: AGENTS[0]!,
    isNew: false,
  },
  {
    id: 'dighomi-gudamaqari-21',
    img: '/images/p6.webp',
    images: ['/images/p6.webp', '/images/p4.webp', '/images/np2.webp'],
    priceUSD: 198000, priceGEL: 534600, perM2USD: 2200,
    title: 'დიზაინერული რემონტით, დიღომი',
    address: 'გუდამაყრის 21, დიღომი, თბილისი',
    city: 'თბილისი', district: 'დიდი დიღომი',
    dealType: 'sale', propType: 'apartment',
    rooms: 3, beds: 3, baths: 2, area: 90, floor: 9, totalFloors: 14,
    views: 2700, badge: 'VIP',
    ai: { score: 90, label: 'კარგი ფასი' },
    features: ['დიზაინერული რემონტი', 'მდინარის ხედი', 'ავტოფარეხი', 'ავეჯით', 'ტექნიკით'],
    description: 'გუდამაყარში იყიდება 3-ოთახიანი ბინა დიზაინერული რემონტით და მტკვრის ხედით. ბინა იყიდება სრული ავეჯითა და ტექნიკით — შემოსულია მხოლოდ საცხოვრებლად. კომპლექსში მუშაობს საბავშვო მოედანი და მაღაზიები.',
    coords: { lat: 41.7523, lng: 44.7593 },
    postedAt: '2026-06-02',
    agent: AGENTS[5]!,
    isNew: true,
  },

  // ——— Rent: Tbilisi ———
  {
    id: 'vake-irakli-abashidze-10-rent',
    img: '/images/p4.webp',
    images: ['/images/p4.webp', '/images/p5.webp', '/images/p1.webp'],
    priceUSD: 1200, priceGEL: 3240, perM2USD: 15,
    title: 'ევრორემონტით 3-ოთახიანი ვაკეში',
    address: 'ი. აბაშიძის 10, ვაკე, თბილისი',
    city: 'თბილისი', district: 'ვაკე',
    dealType: 'rent', propType: 'apartment',
    rooms: 3, beds: 2, baths: 2, area: 85, floor: 5, totalFloors: 10,
    views: 980, badge: 'VIP+',
    ai: { score: 88, label: 'კარგი ფასი' },
    features: ['ავეჯით და ტექნიკით', 'ცენტრალური გათბობა', 'ბალკონი', 'ინტერნეტი', 'პარკინგი'],
    description: 'ვაკის ცენტრში ქირავდება ნათელი 3-ოთახიანი ბინა ევრორემონტით, სრული ავეჯითა და ტექნიკით. უბანი მშვიდია, ფეხით სავალი მანძილზეა ვაკის პარკი და კაფეები. გრძელვადიანი ქირა უპირატესობაა.',
    coords: { lat: 41.7102, lng: 44.7681 },
    postedAt: '2026-06-07',
    agent: AGENTS[3]!,
    isNew: false,
  },
  {
    id: 'saburtalo-kavtaradze-3-rent',
    img: '/images/p6.webp',
    images: ['/images/p6.webp', '/images/p2.webp'],
    priceUSD: 850, priceGEL: 2295, perM2USD: 13,
    title: '2-ოთახიანი ახალ კომპლექსში',
    address: 'ქავთარაძის 3, საბურთალო, თბილისი',
    city: 'თბილისი', district: 'საბურთალო',
    dealType: 'rent', propType: 'apartment',
    rooms: 2, beds: 1, baths: 1, area: 65, floor: 11, totalFloors: 20,
    views: 760, badge: null,
    ai: { score: 84, label: 'კარგი ფასი' },
    features: ['ახალი აშენებული', 'ავეჯით', 'კონდიციონერი', 'ლიფტი', 'დაცული ეზო'],
    description: 'საბურთალოზე, ახალაშენებულ კომპლექსში, ქირავდება 2-ოთახიანი ბინა ავეჯით. კომპლექსს აქვს დაცული შინაურეზო და კომერციული სართული. მეტრომდე 7 წუთი ფეხით.',
    coords: { lat: 41.7278, lng: 44.7522 },
    postedAt: '2026-06-06',
    agent: AGENTS[1]!,
    isNew: true,
  },
  {
    id: 'ortachala-krtsanisi-15-rent',
    img: '/images/p5.webp',
    images: ['/images/p5.webp', '/images/p6.webp', '/images/p3.webp'],
    priceUSD: 650, priceGEL: 1755, perM2USD: 11,
    title: 'მყუდრო ბინა ორთაჭალაში',
    address: 'კრისტესის 15, ორთაჭალა, თბილისი',
    city: 'თბილისი', district: 'ორთაჭალა',
    dealType: 'rent', propType: 'apartment',
    rooms: 2, beds: 1, baths: 1, area: 58, floor: 3, totalFloors: 9,
    views: 540, badge: null,
    ai: { score: 79, label: 'საშუალო ფასი' },
    features: ['ავეჯით', 'ბუნებრივი აირი', 'ბალკონი', 'ცხელი წყალი'],
    description: 'ორთაჭალაში, მშვიდ ქუჩაზე, ქირავდება მყუდრო 2-ოთახიანი ბინა. შესანიშნავი ვარიანტია წყვილისთვის ან სტუდენტებისთვის. მახლობლად არის საზოგადოებრივი ტრანსპორტის გაჩერებები და მაღაზიები.',
    coords: { lat: 41.6831, lng: 44.8214 },
    postedAt: '2026-05-25',
    agent: AGENTS[5]!,
    isNew: false,
  },
  {
    id: 'isani-navtlughi-8-rent',
    img: '/images/p1.webp',
    images: ['/images/p1.webp', '/images/p5.webp'],
    priceUSD: 500, priceGEL: 1350, perM2USD: 10,
    title: '1-ოთახიანი ისანში, მეტროსთან',
    address: 'ნავთლუღის 8, ისანი, თბილისი',
    city: 'თბილისი', district: 'ისანი',
    dealType: 'rent', propType: 'apartment',
    rooms: 1, beds: 1, baths: 1, area: 48, floor: 6, totalFloors: 12,
    views: 430, badge: null,
    ai: { score: 81, label: 'საშუალო ფასი' },
    features: ['ავეჯით', 'მეტროსთან ახლოს', 'ინტერნეტი', 'ტელევიზორი'],
    description: 'ისანში, მეტრო ისანიდან 5 წუთში, ქირავდება გარემონტებული 1-ოთახიანი ბინა. ბინა აღჭურვილია ყველა საჭირო ტექნიკით. ხელშეკრულება მინიმუმ 6 თვით.',
    coords: { lat: 41.6927, lng: 44.8506 },
    postedAt: '2026-05-22',
    agent: AGENTS[2]!,
    isNew: false,
  },
  {
    id: 'gldani-mikheil-4-rent',
    img: '/images/p6.webp',
    images: ['/images/p6.webp', '/images/p4.webp'],
    priceUSD: 400, priceGEL: 1080, perM2USD: 8,
    title: 'საოჯახო ბინა გლდანში',
    address: 'მიხეილ გლდანელის 4, გლდანი, თბილისი',
    city: 'თბილისი', district: 'გლდანი',
    dealType: 'rent', propType: 'apartment',
    rooms: 2, beds: 2, baths: 1, area: 52, floor: 2, totalFloors: 5,
    views: 390, badge: null,
    ai: { score: 76, label: 'საშუალო ფასი' },
    features: ['ავეჯით', 'ბუნებრივი აირი', 'შუშის ბალკონი'],
    description: 'გლდანაში, ხუროთმოძღვრის მეტროს მახლობლად, ქირავდება საოჯახო ბინა. უბანში არის სკოლა, ბაღი და სავაჭრო ცენტრი. მესაკუთრე პირდაპირია, საკომისიოს გარეშე.',
    coords: { lat: 41.7936, lng: 44.8134 },
    postedAt: '2026-05-18',
    agent: AGENTS[3]!,
    isNew: false,
  },
  {
    id: 'mtatsminda-foothill-house-rent',
    img: '/images/p3.webp',
    images: ['/images/p3.webp', '/images/np1.webp'],
    priceUSD: 2500, priceGEL: 6750, perM2USD: 16,
    title: 'კერძო სახლი მთაწმინდის ძირში',
    address: 'წმ. მიხეილის ქ. 3, მთაწმინდა, თბილისი',
    city: 'თბილისი', district: 'მთაწმინდა',
    dealType: 'rent', propType: 'house',
    rooms: 4, beds: 3, baths: 2, area: 160, floor: 2, totalFloors: 2,
    views: 1120, badge: 'VIP',
    ai: { score: 86, label: 'კარგი ფასი' },
    features: ['პატარა ეზო', 'ბუხარი', 'ავეჯით', 'ტერასა', 'ავტოფარეხი'],
    description: 'მთაწმინდის ძირში, ისტორიულ უბანში, ქირავდება ორსართულიანი კერძო სახლი პატარა ეზოთი. ავთენტური ქართული არქიტექტურა თანამედროვე კომფორტთან ერთად. იდეალურია ოჯახისთვის ან ექსპატებისთვის.',
    coords: { lat: 41.7001, lng: 44.7889 },
    postedAt: '2026-06-01',
    agent: AGENTS[0]!,
    isNew: false,
  },

  // ——— Sale: more Tbilisi ———
  {
    id: 'vake-tamarashvili-6',
    img: '/images/p2.webp',
    images: ['/images/p2.webp', '/images/p1.webp', '/images/p6.webp'],
    priceUSD: 345000, priceGEL: 931500, perM2USD: 3136,
    title: '4-ოთახიანი თამარაშვილზე, ახალი პროექტი',
    address: 'თამარაშვილის 6, ვაკე, თბილისი',
    city: 'თბილისი', district: 'ვაკე',
    dealType: 'sale', propType: 'apartment',
    rooms: 4, beds: 3, baths: 2, area: 110, floor: 9, totalFloors: 16,
    views: 2480, badge: 'VIP+',
    ai: { score: 92, label: 'შესანიშნავი ფასი' },
    features: ['ახალი აშენებული', 'თეთრი კარკასი', 'პარკინგი ფასში', 'კონსიერჟი', 'ბავშვთა მოედანი', 'ფიტნესი'],
    description: 'ვაკეში, თამარაშვილის გამზირზე, იყიდება 4-ოთახიანი თეთრი კარკასის მდგომარეობით. პროექტის საკუთარი ინფრასტრუქტურა მოიცავს ფიტნესსა და კონსიერჟს. იპოთეკური დაფინანსება შესაძლებელია ადგილზე.',
    coords: { lat: 41.7121, lng: 44.7571 },
    postedAt: '2026-06-10',
    agent: AGENTS[1]!,
    isNew: true,
  },
  {
    id: 'saburtalo-nutsubidze-77',
    img: '/images/p5.webp',
    images: ['/images/p5.webp', '/images/p2.webp'],
    priceUSD: 95000, priceGEL: 256500, perM2USD: 1583,
    title: '2-ოთახიანი ნუცუბიძის პლატოზე',
    address: 'ნუცუბიძის 77, საბურთალო, თბილისი',
    city: 'თბილისი', district: 'საბურთალო',
    dealType: 'sale', propType: 'apartment',
    rooms: 2, beds: 2, baths: 1, area: 60, floor: 4, totalFloors: 16,
    views: 860, badge: null,
    ai: { score: 78, label: 'საშუალო ფასი' },
    features: ['ძველი რემონტი', 'ბალკონი', 'მაღაზიები ახლოს'],
    description: 'ნუცუბიძის პლატოზე იყიდება 2-ოთახიანი ბინა საცხოვრებელ მდგომარეობით. საჭიროებს კოსმეტიკურ განახლებას, რაც ფასში ასახულია. კარგი ვარიანტია პირველი ბინისთვის ან გაქირავების ბიზნესისთვის.',
    coords: { lat: 41.7344, lng: 44.7381 },
    postedAt: '2026-05-20',
    agent: AGENTS[5]!,
    isNew: false,
  },
  {
    id: 'ortachala-gulia-22',
    img: '/images/p1.webp',
    images: ['/images/p1.webp', '/images/p6.webp', '/images/p4.webp'],
    priceUSD: 132000, priceGEL: 356400, perM2USD: 1650,
    title: 'ახალი კომპლექსი ორთაჭალაში, ხედით',
    address: 'გულიას 22, ორთაჭალა, თბილისი',
    city: 'თბილისი', district: 'ორთაჭალა',
    dealType: 'sale', propType: 'apartment',
    rooms: 3, beds: 2, baths: 2, area: 80, floor: 14, totalFloors: 22,
    views: 1340, badge: 'VIP',
    ai: { score: 85, label: 'კარგი ფასი' },
    features: ['ახალი აშენებული', 'ქალაქის ხედი', 'მწვანე კარკასი', 'პარკინგი', 'ცენტრალური გათბობა'],
    description: 'ორთაჭალის ახალ კომპლექსში იყიდება 3-ოთახიანი ბინა ქალაქის ხედით. განვითარებადი უბანი ფასების ზრდის მაღალი პოტენციალით — AI შეფასებით კარგი ინვესტიცია. ზედა სართულები გამოირჩევა ხედებით.',
    coords: { lat: 41.6795, lng: 44.8158 },
    postedAt: '2026-06-04',
    agent: AGENTS[2]!,
    isNew: true,
  },
  {
    id: 'isani-berbuta-11',
    img: '/images/p4.webp',
    images: ['/images/p4.webp', '/images/p1.webp'],
    priceUSD: 88000, priceGEL: 237600, perM2USD: 1467,
    title: '3-ოთახიანი ისანში, გარემონტებული',
    address: 'ბერბუქის 11, ისანი, თბილისი',
    city: 'თბილისი', district: 'ისანი',
    dealType: 'sale', propType: 'apartment',
    rooms: 3, beds: 2, baths: 1, area: 60, floor: 3, totalFloors: 9,
    views: 720, badge: null,
    ai: { score: 80, label: 'საშუალო ფასი' },
    features: ['გარემონტებული', 'ავეჯით', 'ბალკონი', 'მშვიდი ეზო'],
    description: 'ისანში იყიდება გარემონტებული 3-ოთახიანი ბინა ჩეხური პროექტის კორპუსში. ბინა სუფთაა და მზადაა საცხოვრებლად. ტრანსპორტი და მაღაზიები ხელმისაწვდომია.',
    coords: { lat: 41.6862, lng: 44.8467 },
    postedAt: '2026-05-15',
    agent: AGENTS[3]!,
    isNew: false,
  },
  {
    id: 'gldani-omar-khizaneishvili-30',
    img: '/images/p6.webp',
    images: ['/images/p6.webp', '/images/p5.webp'],
    priceUSD: 62000, priceGEL: 167400, perM2USD: 1292,
    title: 'სტუდიო გლდანის ახალ კომპლექსში',
    address: 'ხიზანეიშვილის 30, გლდანი, თბილისი',
    city: 'თბილისი', district: 'გლდანი',
    dealType: 'sale', propType: 'apartment',
    rooms: 1, beds: 1, baths: 1, area: 48, floor: 8, totalFloors: 14,
    views: 510, badge: null,
    ai: { score: 74, label: 'საშუალო ფასი' },
    features: ['ახალი აშენებული', 'შავი კარკასი', 'პარკინგი'],
    description: 'გლდანის ახალ კომპლექსში იყიდება სტუდიო-ტიპის ბინა შავი კარკასით. ყველაზე ხელმისაწვდომი ფასი ახალი აშენების სეგმენტში. შესაძლებელია შიდა განვადება დეველოპერისგან.',
    coords: { lat: 41.8002, lng: 44.8061 },
    postedAt: '2026-05-27',
    agent: AGENTS[5]!,
    isNew: true,
  },
  {
    id: 'dighomi-agmashenebeli-alley-house',
    img: '/images/p3.webp',
    images: ['/images/p3.webp', '/images/p6.webp', '/images/np2.webp'],
    priceUSD: 240000, priceGEL: 648000, perM2USD: 1333,
    title: 'კერძო სახლი დიდ დიღომში',
    address: 'აღმაშენებლის ხეივანი, დიდი დიღომი, თბილისი',
    city: 'თბილისი', district: 'დიდი დიღომი',
    dealType: 'sale', propType: 'house',
    rooms: 5, beds: 4, baths: 2, area: 180, floor: 2, totalFloors: 2,
    views: 1580, badge: 'VIP',
    ai: { score: 83, label: 'კარგი ფასი' },
    features: ['ეზო 400 მ²', 'ბუხარი', 'სარდაფი', 'ავტოფარეხი 2 მანქანით', 'ხეები'],
    description: 'დიდ დიღომში იყიდება კაპიტალური ორსართულიანი სახლი 400 მ² ეზოთი. პირველ სართულზე მისაღები და სამზარეულო, მეორეზე — საძინებლები. მშვიდი საცხოვრებელი უბანი, ცენტრამდე 15 წუთი მანქანით.',
    coords: { lat: 41.7589, lng: 44.7452 },
    postedAt: '2026-05-24',
    agent: AGENTS[1]!,
    isNew: false,
  },

  // ——— Batumi ———
  {
    id: 'batumi-sherif-khimshiashvili-20',
    img: '/images/np1.webp',
    images: ['/images/np1.webp', '/images/p2.webp', '/images/p1.webp'],
    priceUSD: 165000, priceGEL: 445500, perM2USD: 2357,
    title: 'ზღვის ხედით ბინა ბათუმში, პირველი ხაზი',
    address: 'შ. ხიმშიაშვილის 20, ბათუმი',
    city: 'ბათუმი', district: 'ახალი ბულვარი',
    dealType: 'sale', propType: 'apartment',
    rooms: 2, beds: 2, baths: 1, area: 70, floor: 18, totalFloors: 30,
    views: 4100, badge: 'SUPER VIP',
    ai: { score: 93, label: 'შესანიშნავი ფასი' },
    features: ['ზღვის ხედი', 'პირველი ხაზი', 'აპარტ-სასტუმრო სერვისი', 'აუზი', 'რესეფშენი 24/7', 'შავი კარკასი'],
    description: 'ბათუმის პირველ ხაზზე იყიდება ბინა ზღვის პანორამული ხედით. აპარტ-სასტუმროს სერვისები იძლევა შეუფერხებელი გაქირავების შესაძლებლობას — პროგნოზირებული შემოსავლიანობა 9-11% წლიური. სეზონური მოთხოვნა მუდმივად იზრდება.',
    coords: { lat: 41.6102, lng: 41.6198 },
    postedAt: '2026-06-09',
    agent: AGENTS[4]!,
    isNew: true,
  },
  {
    id: 'batumi-gorgiladze-50-rent',
    img: '/images/np2.webp',
    images: ['/images/np2.webp', '/images/p4.webp'],
    priceUSD: 700, priceGEL: 1890, perM2USD: 12,
    title: 'ბათუმის ცენტრში 2-ოთახიანი',
    address: 'გორგილაძის 50, ბათუმი',
    city: 'ბათუმი', district: 'ძველი ბათუმი',
    dealType: 'rent', propType: 'apartment',
    rooms: 2, beds: 1, baths: 1, area: 58, floor: 4, totalFloors: 7,
    views: 890, badge: null,
    ai: { score: 82, label: 'კარგი ფასი' },
    features: ['ავეჯით და ტექნიკით', 'ბულვარამდე 5 წუთი', 'ინტერნეტი', 'კონდიციონერი'],
    description: 'ბათუმის ისტორიულ ცენტრში ქირავდება გარემონტებული 2-ოთახიანი ბინა. ბულვარამდე და ზღვამდე 5 წუთის სავალი. გრძელვადიანი ქირის შემთხვევაში ფასი მოლაპარაკებადია.',
    coords: { lat: 41.6481, lng: 41.6371 },
    postedAt: '2026-06-03',
    agent: AGENTS[4]!,
    isNew: false,
  },
  {
    id: 'batumi-makhinjauri-house',
    img: '/images/p3.webp',
    images: ['/images/p3.webp', '/images/np1.webp', '/images/np2.webp'],
    priceUSD: 310000, priceGEL: 837000, perM2USD: 1409,
    title: 'ვილა მახინჯაურში, ზღვის ხედით',
    address: 'მახინჯაური, ბათუმის მიდამო',
    city: 'ბათუმი', district: 'მახინჯაური',
    dealType: 'sale', propType: 'house',
    rooms: 5, beds: 4, baths: 3, area: 220, floor: 2, totalFloors: 2,
    views: 1950, badge: 'VIP+',
    ai: { score: 88, label: 'კარგი ფასი' },
    features: ['ზღვის ხედი', 'ეზო 600 მ²', 'ბოტანიკური ბაღის მახლობლად', 'აუზი', 'კამინი'],
    description: 'მახინჯაურში, ბოტანიკური ბაღის მახლობლად, იყიდება ვილა ზღვისა და მთების ხედით. ეზო გამწვანებულია მარადმწვანე მცენარეებით. ბათუმის ცენტრიდან 15 წუთის სავალი.',
    coords: { lat: 41.6841, lng: 41.6979 },
    postedAt: '2026-05-29',
    agent: AGENTS[4]!,
    isNew: false,
  },

  // ——— Kutaisi ———
  {
    id: 'kutaisi-tamar-mefe-14',
    img: '/images/p5.webp',
    images: ['/images/p5.webp', '/images/p4.webp', '/images/p6.webp'],
    priceUSD: 78000, priceGEL: 210600, perM2USD: 1114,
    title: 'ცენტრალური ბინა ქუთაისში, რემონტით',
    address: 'თამარ მეფის 14, ქუთაისი',
    city: 'ქუთაისი', district: 'ცენტრი',
    dealType: 'sale', propType: 'apartment',
    rooms: 3, beds: 2, baths: 1, area: 70, floor: 3, totalFloors: 5,
    views: 640, badge: null,
    ai: { score: 84, label: 'კარგი ფასი' },
    features: ['რემონტით', 'ისტორიული შენობა', 'ბალკონი', 'მაღალი ჭერი'],
    description: 'ქუთაისის ისტორიულ ცენტრში იყიდება გარემონტებული 3-ოთახიანი ბინა მაღალი ჭერით. ბულვარამდე 2 წუთი ფეხით. ქალაქის ტურისტული ზრდის ფონზე შესანიშნავი ინვესტიციური ვარიანტია.',
    coords: { lat: 42.2491, lng: 42.7001 },
    postedAt: '2026-05-26',
    agent: AGENTS[2]!,
    isNew: false,
  },
  {
    id: 'kutaisi-chavchavadze-rent',
    img: '/images/p4.webp',
    images: ['/images/p4.webp', '/images/p5.webp'],
    priceUSD: 450, priceGEL: 1215, perM2USD: 8,
    title: 'ქუთაისში ქირავდება 2-ოთახიანი',
    address: 'ჩავჭავაძის გამზ. 21, ქუთაისი',
    city: 'ქუთაისი', district: 'ავტოქარხანა',
    dealType: 'rent', propType: 'apartment',
    rooms: 2, beds: 2, baths: 1, area: 55, floor: 5, totalFloors: 9,
    views: 380, badge: null,
    ai: { score: 77, label: 'საშუალო ფასი' },
    features: ['ავეჯით', 'ბუნებრივი აირი', 'ინტერნეტი'],
    description: 'ქუთაისში, ჩავჭავაძის გამზირზე, ქირავდება 2-ოთახიანი ბინა ავეჯით. აეროპორტამდე 25 წუთი. გრძელვადიანი მოიჯარეებისთვის ფასი ფასდაკლებით.',
    coords: { lat: 42.2538, lng: 42.6812 },
    postedAt: '2026-05-19',
    agent: AGENTS[3]!,
    isNew: false,
  },

  // ——— Commercial & land ———
  {
    id: 'tbilisi-avlabari-commercial',
    img: '/images/np2.webp',
    images: ['/images/np2.webp', '/images/p6.webp'],
    priceUSD: 195000, priceGEL: 526500, perM2USD: 1625,
    title: 'კომერციული ფართი ავლაბარში, პირველი სართული',
    address: 'ქეთევან დედოფლის გამზ. 45, ავლაბარი, თბილისი',
    city: 'თბილისი', district: 'ავლაბარი',
    dealType: 'sale', propType: 'commercial',
    rooms: 2, beds: 0, baths: 1, area: 120, floor: 1, totalFloors: 8,
    views: 1050, badge: 'VIP',
    ai: { score: 89, label: 'კარგი ფასი' },
    features: ['პირველი სართული', 'ცალკე შესასვლელი', 'ვიტრინული ფანჯრები', 'ტურისტული ზონა', 'პარკინგი'],
    description: 'ავლაბარში, ტურისტული მარშრუტის გასწვრივ, იყიდება კომერციული ფართი ცალკე შესასვლელით და ვიტრინული ფანჯრებით. იდეალურია მაღაზიისთვის, კაფესთვის ან ოფისისთვის. AI შეფასებით ქირის შემოსავლიანობა 10%+.',
    coords: { lat: 41.6935, lng: 44.8151 },
    postedAt: '2026-06-01',
    agent: AGENTS[1]!,
    isNew: false,
  },
  {
    id: 'tbilisi-land-tskneti',
    img: '/images/np1.webp',
    images: ['/images/np1.webp', '/images/p3.webp'],
    priceUSD: 85000, priceGEL: 229500, perM2USD: 85,
    title: 'მიწის ნაკვეთი წყნეთში, საცხოვრებელი',
    address: 'წყნეთი, თბილისის მიდამო',
    city: 'თბილისი', district: 'წყნეთი',
    dealType: 'sale', propType: 'land',
    rooms: 0, beds: 0, baths: 0, area: 1000, floor: 0, totalFloors: 0,
    views: 720, badge: null,
    ai: { score: 81, label: 'კარგი ფასი' },
    features: ['საცხოვრებელი დანიშნულება', 'კომუნიკაციები ნაკვეთთან', 'წყნეთის ტყის ხედი', 'აშენების ნებართვა'],
    description: 'წყნეთში იყიდება 1000 მ² მიწის ნაკვეთი საცხოვრებელი დანიშნულებით. ყველა კომუნიკაცია მისულია ნაკვეთამდე. პრესტიჟული ზონა ელიტარული გარემოთი — ღირებულება სტაბილურად იზრდება.',
    coords: { lat: 41.7023, lng: 44.6874 },
    postedAt: '2026-05-21',
    agent: AGENTS[5]!,
    isNew: false,
  },
  {
    id: 'tbilisi-commercial-vake-rent',
    img: '/images/np1.webp',
    images: ['/images/np1.webp', '/images/np2.webp'],
    priceUSD: 1800, priceGEL: 4860, perM2USD: 20,
    title: 'ოფისი ქირავდება ვაკეში, 90 მ²',
    address: 'ჭონქაძის 9, ვაკე, თბილისი',
    city: 'თბილისი', district: 'ვაკე',
    dealType: 'rent', propType: 'commercial',
    rooms: 3, beds: 0, baths: 1, area: 90, floor: 4, totalFloors: 6,
    views: 590, badge: null,
    ai: { score: 83, label: 'კარგი ფასი' },
    features: ['open space', 'საკონფერენციო ოთახი', 'მზის მხარე', 'ლიფტი', 'მინი-სამზარეულო'],
    description: 'ვაკეში, ჭონქაძის ქუჩაზე, ქირავდება ნათელი ოფისი 90 მ² open space განლაგებით. განკუთვნილია IT კომპანიებისა და სამართალი/საკონსულტაციო ფირმებისთვის. ხელმისაწვდომია დაუყოვნებლივ.',
    coords: { lat: 41.7098, lng: 44.7723 },
    postedAt: '2026-06-05',
    agent: AGENTS[0]!,
    isNew: false,
  },

  // ——— Daily rentals ("ბინები დღიურად") — tourist zones, nightly USD ———
  {
    id: 'tbilisi-old-town-daily-1',
    img: '/images/p3.webp',
    images: ['/images/p3.webp', '/images/p5.webp', '/images/p2.webp'],
    priceUSD: 65, priceGEL: 175, perM2USD: 0,
    title: 'სტუდიო ძველ თბილისში დღიურად — აივნიანი',
    address: 'ბათუმის ქ. 12, ავლაბარი, თბილისი',
    city: 'თბილისი', district: 'ავლაბარი',
    dealType: 'daily', propType: 'apartment',
    rooms: 1, beds: 2, baths: 1, area: 38, floor: 3, totalFloors: 5,
    views: 4100, badge: 'SUPER VIP',
    ai: { score: 96, label: 'მაღალი შემოსავლიანობა' },
    features: ['აივანი ხედით', 'Wi-Fi', 'კონდიციონერი', 'სრულად აღჭურვილი', 'ტურისტული ზონა', 'ფასიანი პარკინგი'],
    description: 'ძველ თბილისში, აბანოთუბანთან ახლოს, დღიურად გაიქირავება გარემონტებული სტუდიო აივნით და მთაწმინდის ხედით. იდეალური ტურისტებისთვის — 5 წუთის სავალზე ნარიკალა, გოლიათი და გომბორი. AI შეფასებით ოკუპაცია 78%.',
    coords: { lat: 41.6912, lng: 44.8089 },
    postedAt: '2026-07-10',
    agent: AGENTS[2]!,
    isNew: true,
  },
  {
    id: 'tbilisi-mtatsminda-daily-2',
    img: '/images/p4.webp',
    images: ['/images/p4.webp', '/images/p1.webp', '/images/p6.webp'],
    priceUSD: 90, priceGEL: 243, perM2USD: 0,
    title: '2-ოთახიანი რუსთაველზე დღიურად',
    address: 'რუსთაველის გამზ. 28, მთაწმინდა, თბილისი',
    city: 'თბილისი', district: 'მთაწმინდა',
    dealType: 'daily', propType: 'apartment',
    rooms: 2, beds: 4, baths: 1, area: 56, floor: 4, totalFloors: 7,
    views: 2800, badge: 'VIP+',
    ai: { score: 93, label: 'შესანიშნავი ლოკაცია' },
    features: ['რუსთაველზე', 'მეტრო 1 წუთში', 'Wi-Fi', 'სამზარეულო', 'სამუშაო ადგილი', 'ლიფტი'],
    description: 'რუსთაველის გამზირზე, ოპერის თეატრთან, დღიურად ქირავდება ნათელი ბინა — სასიარულოდ საუკეთესო ლოკაცია თბილისში. ფასი მოლაპარაკებადია 3+ ღამეზე.',
    coords: { lat: 41.7008, lng: 44.7926 },
    postedAt: '2026-07-08',
    agent: AGENTS[0]!,
    isNew: true,
  },
  {
    id: 'batumi-boulevard-daily-1',
    img: '/images/p2.webp',
    images: ['/images/p2.webp', '/images/np2.webp', '/images/p5.webp'],
    priceUSD: 75, priceGEL: 202, perM2USD: 0,
    title: 'ზღვის ხედით ახალ ბულვარზე დღიურად',
    address: 'რუსთაველის ქ. 90, ახალი ბულვარი, ბათუმი',
    city: 'ბათუმი', district: 'ახალი ბულვარი',
    dealType: 'daily', propType: 'apartment',
    rooms: 2, beds: 4, baths: 1, area: 52, floor: 9, totalFloors: 24,
    views: 5200, badge: 'SUPER VIP',
    ai: { score: 95, label: 'სეზონური პრემიუმი' },
    features: ['ზღვის ხედი', 'სანაპირო 50 მ', 'აუზი კომპლექსში', 'Wi-Fi', 'კონდიციონერი', 'ფიტნესი'],
    description: 'ბათუმში, ახალ ბულვარზე, ზღვიდან 50 მეტრში, დღიურად გაიქირავება ბინა პანორამული ზღვის ხედით. სეზონში (ივნის-სექტემბერი) ოკუპაცია 90%+. იდეალური ინვესტიცია.',
    coords: { lat: 41.6461, lng: 41.6267 },
    postedAt: '2026-07-12',
    agent: AGENTS[4]!,
    isNew: true,
  },
  {
    id: 'batumi-old-daily-2',
    img: '/images/p6.webp',
    images: ['/images/p6.webp', '/images/p3.webp', '/images/np1.webp'],
    priceUSD: 45, priceGEL: 121, perM2USD: 0,
    title: 'ბიუჯეტური სტუდიო ძველ ბათუმში დღიურად',
    address: 'ნინოშვილის ქ. 8, ძველი ბათუმი, ბათუმი',
    city: 'ბათუმი', district: 'ძველი ბათუმი',
    dealType: 'daily', propType: 'apartment',
    rooms: 1, beds: 2, baths: 1, area: 30, floor: 2, totalFloors: 4,
    views: 1900, badge: null,
    ai: { score: 88, label: 'ბიუჯეტური ვარიანტი' },
    features: ['ცენტრი', 'ფასიანი სანაპირო 10 წუთში', 'Wi-Fi', 'კონდიციონერი', 'სამზარეულო', 'პრაჩკა'],
    description: 'ძველი ბათუმის ცენტრში, ნინოშვილის ქუჩაზე, ბიუჯეტური სტუდიო დღიურად. შესანიშნავი ერთ-ორ ღამიანი ყოფნისთვის — სულ რაღაც 10 წუთის სავალზე ქალაქის პლაჟი.',
    coords: { lat: 41.6434, lng: 41.6360 },
    postedAt: '2026-07-05',
    agent: AGENTS[4]!,
    isNew: false,
  },
  {
    id: 'batumi-makhinjauri-daily-3',
    img: '/images/np1.webp',
    images: ['/images/np1.webp', '/images/p2.webp'],
    priceUSD: 110, priceGEL: 297, perM2USD: 0,
    title: 'ლამაზი სახლი მახინჯაურში დღიურად',
    address: 'მახინჯაური, ბათუმის მიდამო',
    city: 'ბათუმი', district: 'მახინჯაური',
    dealType: 'daily', propType: 'house',
    rooms: 4, beds: 6, baths: 2, area: 110, floor: 1, totalFloors: 2,
    views: 1450, badge: 'VIP',
    ai: { score: 90, label: 'ჯგუფური დასვენება' },
    features: ['ეზო', 'გამაშები', 'მანგალი', 'პარკინგი', 'ზღვამდე 300 მ', 'Wi-Fi'],
    description: 'მახინჯაურში, ზღვის სიახლოვეს, დღიურად ქირავდება ორსართულიანი სახლი ეზოთი — იდეალური ერთად ოჯახის ან მეგობრების დასასვენებლად. წყნარი ადგილი, მაგრამ ბათუმის ცენტრამდე 15 წუთი.',
    coords: { lat: 41.6833, lng: 41.6500 },
    postedAt: '2026-07-01',
    agent: AGENTS[4]!,
    isNew: false,
  },
  {
    id: 'kutaisi-center-daily-1',
    img: '/images/p5.webp',
    images: ['/images/p5.webp', '/images/p6.webp'],
    priceUSD: 35, priceGEL: 94, perM2USD: 0,
    title: 'სტუდიო ქუთაისის ცენტრში დღიურად',
    address: 'თამარ მეფის ქ. 15, ცენტრი, ქუთაისი',
    city: 'ქუთაისი', district: 'ცენტრი',
    dealType: 'daily', propType: 'apartment',
    rooms: 1, beds: 2, baths: 1, area: 32, floor: 2, totalFloors: 5,
    views: 820, badge: null,
    ai: { score: 86, label: 'ფასი/ხარისხი' },
    features: ['ცენტრი', 'ქალაქის ბაგრატის ტაძრისკენ', 'Wi-Fi', 'კონდიციონერი', 'სრული სამზარეულო'],
    description: 'ქუთაისის ცენტრში, თამარ მეფის ქუჩაზე, დღიურად ქირავდება გარემონტებული სტუდიო. ბაგრატის ტაძარი, სატაძრო მონასტერი და მწვანე ბაზარი ფეხით ახლოს. ფასი ქალაქში ყველაზე კონკურენტული.',
    coords: { lat: 42.2679, lng: 42.7179 },
    postedAt: '2026-06-28',
    agent: AGENTS[3]!,
    isNew: false,
  },
  {
    id: 'tbilisi-vake-daily-3',
    img: '/images/p1.webp',
    images: ['/images/p1.webp', '/images/p4.webp'],
    priceUSD: 55, priceGEL: 148, perM2USD: 0,
    title: '1-ოთახიანი ვაკეში დღიურად, პარკთან',
    address: 'ირ. აბაშიძის ქ. 24, ვაკე, თბილისი',
    city: 'თბილისი', district: 'ვაკე',
    dealType: 'daily', propType: 'apartment',
    rooms: 1, beds: 2, baths: 1, area: 40, floor: 5, totalFloors: 9,
    views: 1670, badge: 'VIP',
    ai: { score: 91, label: 'სტაბილური მოთხოვნა' },
    features: ['ვაკის პარკი 200 მ', 'Wi-Fi', 'კონდიციონერი', 'ლიფტი', 'სუპერმარკეტი ახლოს'],
    description: 'ვაკეში, ვაკის პარკთან ახლოს, დღიურად ქირავდება ერთოთახიანი ბინა. მშვიდი, უსაფრთხო უბანი ბიზნეს-მგზავრებისა და ოჯახებისთვის. მეტრომდე და ჩავჭავაძის გამზირამდე 5 წუთი.',
    coords: { lat: 41.7078, lng: 44.7647 },
    postedAt: '2026-07-03',
    agent: AGENTS[0]!,
    isNew: false,
  },
  {
    id: 'tbilisi-saburtalo-daily-4',
    img: '/images/np2.webp',
    images: ['/images/np2.webp', '/images/p2.webp'],
    priceUSD: 40, priceGEL: 108, perM2USD: 0,
    title: 'ბიუჯეტური ბინა საბურთალოზე დღიურად',
    address: 'ვაჟა-ფშაველას გამზ. 50, საბურთალო, თბილისი',
    city: 'თბილისი', district: 'საბურთალო',
    dealType: 'daily', propType: 'apartment',
    rooms: 2, beds: 3, baths: 1, area: 48, floor: 3, totalFloors: 16,
    views: 940, badge: null,
    ai: { score: 87, label: 'კარგი ფასი' },
    features: ['მეტრო საბურთალო 5 წუთში', 'Wi-Fi', 'კონდიციონერი', 'სამზარეულო', 'სუპერმარკეტი სახლთან'],
    description: 'საბურთალოზე, მეტროსთან ახლოს, დღიურად ქირავდება ბიუჯეტური 2-ოთახიანი ბინა. ფასი/ფართი საუკეთესო თბილისში. ცენტრამდე მეტროთი 15 წუთი.',
    coords: { lat: 41.7224, lng: 44.7571 },
    postedAt: '2026-06-25',
    agent: AGENTS[1]!,
    isNew: false,
  },
]

/* ————— Filters ————— */

export type SortKey = 'date' | 'price-asc' | 'price-desc' | 'area' | 'ai'

export interface ListingFilters {
  deal?: DealType
  type?: PropType
  city?: string
  district?: string
  minPrice?: number
  maxPrice?: number
  rooms?: number // minimum rooms
  minArea?: number
  maxArea?: number
  q?: string
  sort?: SortKey
}

export function getListing(id: string): Listing | undefined {
  return LISTINGS.find((l) => l.id === id)
}

export function filterListings(f: ListingFilters): Listing[] {
  let out = LISTINGS.filter((l) => {
    if (f.deal && l.dealType !== f.deal) return false
    if (f.type && l.propType !== f.type) return false
    if (f.city && l.city !== f.city) return false
    if (f.district && l.district !== f.district) return false
    if (f.minPrice !== undefined && l.priceUSD < f.minPrice) return false
    if (f.maxPrice !== undefined && l.priceUSD > f.maxPrice) return false
    if (f.rooms !== undefined && l.rooms < f.rooms) return false
    if (f.minArea !== undefined && l.area < f.minArea) return false
    if (f.maxArea !== undefined && l.area > f.maxArea) return false
    if (f.q) {
      const q = f.q.toLowerCase()
      const hay = `${l.title} ${l.address} ${l.city} ${l.district}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })

  const sort: SortKey = f.sort ?? 'date'
  // ponytail: sale/rent prices are different units (price vs $/mo) — group by deal first.
  // Upgrade path: split sort per dealType or normalize rent to annual.
  const dealGroup = (x: Listing) => (x.dealType === 'sale' ? 0 : 1)
  out = [...out].sort((a, b) => {
    switch (sort) {
      case 'price-asc':
        return dealGroup(a) - dealGroup(b) || a.priceUSD - b.priceUSD
      case 'price-desc':
        return dealGroup(a) - dealGroup(b) || b.priceUSD - a.priceUSD
      case 'area':
        return b.area - a.area
      case 'ai':
        return b.ai.score - a.ai.score
      case 'date':
      default:
        return b.postedAt.localeCompare(a.postedAt)
    }
  })
  return out
}

/* ————— Formatting ————— */

export function formatUSD(n: number): string {
  return `$${n.toLocaleString('en-US')}`
}

export function formatGEL(n: number): string {
  return `${n.toLocaleString('en-US')} ₾`
}

/** Card price — appends /თვე for monthly rent, /დღე for daily rent */
export function formatListingPrice(l: Listing): string {
  if (l.dealType === 'rent') return `${formatUSD(l.priceUSD)}/თვე`
  if (l.dealType === 'daily') return `${formatUSD(l.priceUSD)}/დღე`
  return formatUSD(l.priceUSD)
}

export function formatPerM2(l: Listing): string {
  return `$${l.perM2USD.toLocaleString('en-US')}/მ²`
}

/** 3200 → "3.2კ" */
export function formatViews(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}კ`
  return String(v)
}

export function formatFloor(l: Listing): string {
  if (l.propType === 'house') return `${l.totalFloors} სართ.`
  if (l.propType === 'land') return '—'
  return `${l.floor}/${l.totalFloors}`
}

export function postedDaysAgo(l: Listing, today = new Date()): number {
  const posted = new Date(`${l.postedAt}T00:00:00`)
  return Math.max(0, Math.round((today.getTime() - posted.getTime()) / 86400000))
}

/* ————— Distinct locations for filter selects ————— */

export const CITIES: string[] = [...new Set(LISTINGS.map((l) => l.city))]

export function districtsOf(city?: string): string[] {
  return [...new Set(LISTINGS.filter((l) => !city || l.city === city).map((l) => l.district))]
}

/** Similar listings: same district first, then same property type */
export function similarListings(l: Listing, count = 4): Listing[] {
  const others = LISTINGS.filter((x) => x.id !== l.id)
  const sameDistrict = others.filter((x) => x.district === l.district && x.dealType === l.dealType)
  const sameType = others.filter(
    (x) => x.district !== l.district && x.propType === l.propType && x.dealType === l.dealType,
  )
  const rest = others.filter(
    (x) => x.dealType === l.dealType && !sameDistrict.includes(x) && !sameType.includes(x),
  )
  return [...sameDistrict, ...sameType, ...rest].slice(0, count)
}

export { TBILISI }
