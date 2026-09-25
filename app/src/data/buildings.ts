/**
 * SIVRCE — Landmark building catalog (map + SEO).
 * Street landmarks stay hand-curated; every project with coords becomes a building.
 * ponytail: derive from PROJECTS — one source for photo / coords / copy.
 */

import { GEO_CITIES, geoRaionsOf, geoDistrictsOf } from './georgia-locations'
import { canonicalizeDistrict } from '../lib/district-canon'
import { TBILISI_QUARTERS } from './tbilisi-quarters'
import {
  PROJECTS,
  getDeveloper,
  projectCode,
  type LocalText,
  type Project,
} from './professionals'

export type BuildingCatalogEntry = {
  /** URL slug */
  slug: string
  /** Unique public code — SEO / admin ID; UI shows human `name` first */
  code: string
  name: string
  nameEn: string
  address: string
  city: string
  district: string
  /** Microdistrict / ubani when the address names one (ლისი, დიდი დიღომი, …). */
  ubani?: string
  coords: { lat: number; lng: number }
  buildingNumber: string
  img: string
  gallery?: string[]
  passportUrl?: string
  developerSlug?: string
  yearBuilt?: number
  floors: number
  units?: number
  rating: number
  description: LocalText
  /** Optional link to /projects/[slug] */
  projectSlug?: string
  status: 'ready' | 'construction'
  priceFromM2?: string
  finish?: string
}

/** Address-level landmarks that are not (or not only) a PROJECTS slug. */
const STREET_LANDMARKS: BuildingCatalogEntry[] = [
  {
    slug: 'axis-towers',
    code: 'SV-TB-0001',
    name: 'აქსის თაუერსი',
    nameEn: 'Axis Towers',
    address: 'ილია ჭავჭავაძის გამზ. 37მ, ვაკე, თბილისი',
    city: 'თბილისი',
    district: 'ვაკე',
    coords: { lat: 41.71174204, lng: 44.75668685 },
    buildingNumber: '37',
    img: '/images/projects/axis-towers-photo.webp',
    developerSlug: 'axis',
    yearBuilt: 2018,
    floors: 24,
    units: 150,
    rating: 4.8,
    projectSlug: 'axis-towers',
    status: 'ready',
    description: {
      ka: 'აქსის თაუერსი — ჭავჭავაძის 37, ვაკე. ორი კოშკი, 24 სართ., მიწისქვეშა პარკინგი, კომერციული სარდაფი. ხედი ვაკის პარკისა და ცენტრისკენ.',
      en: 'Axis Towers — Chavchavadze 37, Vake. Twin 24-floor towers, underground parking, retail podium. Views toward Vake Park and the centre.',
      ru: 'Axis Towers — Чавчавадзе 37, Ваке. Две башни, 24 этажа, подземный паркинг, коммерческий стилобат.',
    },
  },
  {
    slug: 'king-david-residences',
    code: 'SV-TB-0002',
    name: 'ქინგ დევიდ რეზიდენსი',
    nameEn: 'King David Residences',
    address: 'გიორგი ათონელის ქ. 12, მთაწმინდა, თბილისი',
    city: 'თბილისი',
    district: 'მთაწმინდა',
    coords: { lat: 41.6975188, lng: 44.8047485 },
    buildingNumber: '12',
    img: '/images/projects/king-david-residences.webp',
    developerSlug: 'king-david',
    yearBuilt: 2016,
    floors: 18,
    units: 120,
    rating: 4.9,
    status: 'ready',
    description: {
      ka: 'ქინგ დევიდ რეზიდენსი — გიორგი ათონელის 12, მთაწმინდა. 18 სართ., კონსიერჟი, პარკინგი. ხედი ძველ თბილისზე და მთაწმინდაზე.',
      en: 'King David Residences — 12 Giorgi Atoneli St, Mtatsminda. 18 floors, concierge, parking. Old Tbilisi and Mtatsminda views.',
      ru: 'King David Residences — Атонели 12, Мтацминда. 18 этажей, консьерж, паркинг.',
    },
  },
  {
    slug: 'pekin-12',
    code: 'SV-TB-0006',
    name: 'პეკინის 12',
    nameEn: 'Pekin 12',
    address: 'პეკინის გამზ. 12, საბურთალო, თბილისი',
    city: 'თბილისი',
    district: 'საბურთალო',
    coords: { lat: 41.7207945, lng: 44.7748721 },
    buildingNumber: '12',
    img: '/images/projects/pekin-12.webp',
    developerSlug: 'm2-development',
    yearBuilt: 2021,
    floors: 22,
    units: 90,
    rating: 4.7,
    status: 'ready',
    description: {
      ka: 'პეკინის 12 — საბურთალო. 22 სართ., პენტჰაუსები ზედა სართულებზე.',
      en: 'Pekin 12 — Saburtalo. 22 floors, penthouses on the upper levels.',
      ru: 'Пекин 12 — Сабуртало. 22 этажа, пентхаусы на верхних этажах.',
    },
  },
  {
    slug: 'chavchavadze-47',
    code: 'SV-TB-0007',
    name: 'ჭავჭავაძის 47',
    nameEn: 'Chavchavadze 47',
    address: 'ილია ჭავჭავაძის გამზ. 47, ვაკე, თბილისი',
    city: 'თბილისი',
    district: 'ვაკე',
    coords: { lat: 41.711826, lng: 44.747685 },
    buildingNumber: '47',
    img: '/images/projects/axis-chavchavadze-49.webp',
    developerSlug: 'axis',
    yearBuilt: 2019,
    floors: 18,
    units: 80,
    rating: 4.6,
    status: 'ready',
    description: {
      ka: 'ჭავჭავაძის 47 — ვაკე, 18 სართ. ღია ხედი გამზირზე.',
      en: 'Chavchavadze 47 — Vake, 18 floors. Open view onto the avenue.',
      ru: 'Чавчавадзе 47 — Ваке, 18 этажей. Вид на проспект.',
    },
  },
  {
    slug: 'orbi-sea-towers',
    code: 'SV-BT-0001',
    name: 'ORBI Sea Towers',
    nameEn: 'ORBI Sea Towers',
    address: 'შერიფ ხიმშიაშვილის ქ. 15ბ, ახალი ბულვარი, ბათუმი',
    city: 'ბათუმი',
    district: 'ახალი ბულვარი',
    coords: { lat: 41.637316, lng: 41.610282 },
    buildingNumber: '—',
    img: '/images/projects/orbi-sea-towers.webp',
    developerSlug: 'orbi-group',
    floors: 32,
    units: 320,
    rating: 4.7,
    projectSlug: 'orbi-sea-towers',
    status: 'construction',
    description: {
      ka: 'ORBI Sea Towers — ახალი ბულვარი, ბათუმი. 32 სართ., სასტუმრო-საცხოვრებელი. მართვის კომპანია.',
      en: 'ORBI Sea Towers — New Boulevard, Batumi. 32 floors, hotel-residential. In-house management.',
      ru: 'ORBI Sea Towers — Новый бульвар, Батуми. 32 этажа, гостинично-жилой. Управляющая компания.',
    },
  },
  {
    slug: 'batumi-riviera-tower',
    code: 'SV-BT-0002',
    name: 'Batumi Riviera Tower',
    nameEn: 'Batumi Riviera Tower',
    address: 'ზღვისპირის ქ. 1ბ, ახალი ბულვარი, ბათუმი',
    city: 'ბათუმი',
    district: 'ახალი ბულვარი',
    coords: { lat: 41.6219567, lng: 41.5967227 },
    buildingNumber: '—',
    img: '/images/projects/batumi-riviera-tower.webp',
    developerSlug: 'alliance-group',
    floors: 28,
    units: 168,
    rating: 4.9,
    projectSlug: 'batumi-riviera-tower',
    status: 'construction',
    description: {
      ka: 'Batumi Riviera Tower — ახალი ბულვარი. 28 სართ., ზღვის ხედი.',
      en: 'Batumi Riviera Tower — New Boulevard. 28 floors, sea view.',
      ru: 'Batumi Riviera Tower — Новый бульвар. 28 этажей, вид на море.',
    },
  },
  {
    slug: 'gorgiladze-50',
    code: 'SV-BT-0003',
    name: 'გორგილაძის 50',
    nameEn: 'Gorgiladze 50',
    address: 'ზურაბ გორგილაძის ქ. 50, ბათუმი',
    city: 'ბათუმი',
    district: 'ბათუმი',
    coords: { lat: 41.645471, lng: 41.626121 },
    buildingNumber: '50',
    img: '/images/projects/gorgiladze-50.webp',
    developerSlug: 'alliance-group',
    yearBuilt: 2020,
    floors: 16,
    units: 64,
    rating: 4.5,
    status: 'ready',
    description: {
      ka: 'გორგილაძის 50 — ბათუმის ცენტრი. 16 სართ. ზღვამდე დაახლოებით 5 წუთი.',
      en: 'Gorgiladze 50 — Batumi centre. 16 floors. About five minutes to the sea.',
      ru: 'Горгиладзе 50 — центр Батуми. 16 этажей. Около 5 минут до моря.',
    },
  },
  {
    slug: 'abashidze-34',
    code: 'SV-TB-0008',
    name: 'აბაშიძის 34',
    nameEn: 'Abashidze 34',
    address: 'ირაკლი აბაშიძის ქ. 34, ვაკე, თბილისი',
    city: 'თბილისი',
    district: 'ვაკე',
    coords: { lat: 41.7074417, lng: 44.765686 },
    buildingNumber: '34',
    img: '/images/projects/abashidze-34.webp',
    developerSlug: 'archi',
    yearBuilt: 2015,
    floors: 12,
    units: 48,
    rating: 4.4,
    status: 'ready',
    description: {
      ka: 'აბაშიძის 34 — ვაკე. 12 სართ., ჩაბარება 2015.',
      en: 'Abashidze 34 — Vake. 12 floors, completed 2015.',
      ru: 'Абашидзе 34 — Ваке. 12 этажей, сдан в 2015.',
    },
  },
  {
    slug: 'nutsubidze-77',
    code: 'SV-TB-0009',
    name: 'ნუცუბიძის 77',
    nameEn: 'Nutsubidze 77',
    address: 'ნუცუბიძის 77, საბურთალო, თბილისი',
    city: 'თბილისი',
    district: 'საბურთალო',
    coords: { lat: 41.7339672, lng: 44.7378309 },
    buildingNumber: '77',
    img: '/images/projects/archi-nutsubidze.webp',
    developerSlug: 'archi',
    yearBuilt: 2017,
    floors: 14,
    units: 70,
    rating: 4.3,
    status: 'ready',
    description: {
      ka: 'ნუცუბიძის 77 — საბურთალოს პლატო. 14 სართ., ჩაბარება 2017.',
      en: 'Nutsubidze 77 — Saburtalo plateau. 14 floors, completed 2017.',
      ru: 'Нуцубидзе 77 — плато Сабуртало. 14 этажей, сдан в 2017.',
    },
  },
  {
    slug: 'king-david-business-center',
    code: 'SV-TB-0010',
    name: 'ქინგ დევიდ ბიზნეს ცენტრი',
    nameEn: 'King David Business Center',
    address: 'მერაბ ალექსიძის ქ. 12, საბურთალო, თბილისი',
    city: 'თბილისი',
    district: 'საბურთალო',
    coords: { lat: 41.7168, lng: 44.7865 },
    buildingNumber: '12',
    img: '/images/projects/king-david.webp',
    developerSlug: 'king-david',
    yearBuilt: 2017,
    floors: 32,
    units: 140,
    rating: 4.9,
    status: 'ready',
    description: {
      ka: 'ქინგ დევიდ ბიზნეს ცენტრი — ალექსიძის 12, საბურთალო. 32 სართული, Class-A ოფისები, საკონფერენციო დარბაზები, რესტორნები და მიწისქვეშა პარკინგი.',
      en: 'King David Business Center — 12 Aleksidze St, Saburtalo. 32 floors, Class-A workspace, conference halls, restaurants and underground parking.',
      ru: 'King David Business Center — ул. Алексидзе 12, Сабуртало. 32 этажа, офисы класса А, конференц-залы, рестораны и подземный паркинг.',
    },
  },
  {
    slug: 'biltmore-hotel-tbilisi',
    code: 'SV-TB-0011',
    name: 'ბილტმორ თბილისი',
    nameEn: 'The Biltmore Hotel Tbilisi',
    address: 'შოთა რუსთაველის გამზ. 29, მთაწმინდა, თბილისი',
    city: 'თბილისი',
    district: 'მთაწმინდა',
    coords: { lat: 41.7005, lng: 44.7952 },
    buildingNumber: '29',
    img: '/images/projects/the-biltmore-hotel-tbilisi.webp',
    yearBuilt: 2016,
    floors: 34,
    units: 214,
    rating: 4.9,
    status: 'ready',
    description: {
      ka: 'ბილტმორ თბილისი — რუსთაველის გამზ. 29. 34-სართულიანი შუშის ცათამბჯენი, უმაღლესი სასტუმრო თბილისის ისტორიულ ცენტრში.',
      en: 'The Biltmore Hotel Tbilisi — 29 Rustaveli Ave. 34-storey glass skyscraper, the tallest luxury landmark in historic central Tbilisi.',
      ru: 'The Biltmore Hotel Tbilisi — пр. Руставели 29. 34-этажный стеклянный небоскреб, самая высокая гостиничная башня в историческом центре.',
    },
  },
  {
    slug: 'radisson-blu-iveria-tbilisi',
    code: 'SV-TB-0012',
    name: 'რადისონ ბლუ ივერია',
    nameEn: 'Radisson Blu Iveria Hotel',
    address: 'პირველი რესპუბლიკის მოედანი 1, მთაწმინდა, თბილისი',
    city: 'თბილისი',
    district: 'მთაწმინდა',
    coords: { lat: 41.7042, lng: 44.7915 },
    buildingNumber: '1',
    img: '/images/projects/radisson-blu-iveria.webp',
    yearBuilt: 2009,
    floors: 18,
    units: 249,
    rating: 4.8,
    status: 'ready',
    description: {
      ka: 'რადისონ ბლუ ივერია — პირველი რესპუბლიკის მოედანი 1. 18 სართული, Anne Semonin Spa, Sky Bar და პანორამული ხედები მტკვარსა და ქალაქზე.',
      en: 'Radisson Blu Iveria Hotel — 1 First Republic Square. 18 floors, Anne Semonin Spa, rooftop Sky Bar and iconic panoramas over the Mtkvari river.',
      ru: 'Radisson Blu Iveria Hotel — пл. Первой Республики 1. 18 этажей, Anne Semonin Spa, панорамный Sky Bar и виды на реку Куру.',
    },
  },
  {
    slug: 'galleria-tbilisi',
    code: 'SV-TB-0013',
    name: 'გალერია თბილისი',
    nameEn: 'Galleria Tbilisi',
    address: 'შოთა რუსთაველის გამზ. 2/4, თავისუფლების მოედანი, მთაწმინდა, თბილისი',
    city: 'თბილისი',
    district: 'მთაწმინდა',
    coords: { lat: 41.6938, lng: 44.8015 },
    buildingNumber: '2/4',
    img: '/images/projects/galleria-tbilisi.webp',
    yearBuilt: 2017,
    floors: 8,
    units: 120,
    rating: 4.8,
    status: 'ready',
    description: {
      ka: 'გალერია თბილისი — რუსთაველის 2/4, თავისუფლების მოედანი. მრავალფუნქციური სავაჭრო-გასართობი ცენტრი ინტეგრირებული მეტროსადგურთან.',
      en: 'Galleria Tbilisi — 2/4 Rustaveli Ave, Freedom Square. Major shopping and cultural destination directly integrated with Liberty Square metro station.',
      ru: 'Galleria Tbilisi — пр. Руставели 2/4, пл. Свободы. Многофункциональный торгово-развлекательный центр с выходом в метро.',
    },
  },
  {
    slug: 'city-mall-saburtalo',
    code: 'SV-TB-0014',
    name: 'სითი მოლი საბურთალო',
    nameEn: 'City Mall Saburtalo',
    address: 'ვაჟა-ფშაველას გამზ. 70, საბურთალო, თბილისი',
    city: 'თბილისი',
    district: 'საბურთალო',
    coords: { lat: 41.7248, lng: 44.7435 },
    buildingNumber: '70',
    img: '/images/projects/city-mall-saburtalo.webp',
    yearBuilt: 2019,
    floors: 6,
    units: 180,
    rating: 4.8,
    status: 'ready',
    description: {
      ka: 'სითი მოლი საბურთალო — ვაჟა-ფშაველას 70. საბურთალოს უდიდესი სავაჭრო-საქმიანი კომპლექსი Class-A საოფისე ცენტრით City Tower.',
      en: 'City Mall Saburtalo — 70 Vazha-Pshavela Ave. Saburtalo\'s largest commercial hub anchored by the 120m City Tower Class-A offices.',
      ru: 'City Mall Saburtalo — пр. Важа-Пшавела 70. Крупнейший молл Сабуртало с бизнес-центром City Tower класса А.',
    },
  },
  {
    slug: 'le-meridien-batumi',
    code: 'SV-BT-0010',
    name: 'ლე მერიდიენ ბათუმი (Batumi Tower)',
    nameEn: 'Le Méridien Batumi (Batumi Tower)',
    address: 'ნინოშვილის ქ. 1, ბათუმი',
    city: 'ბათუმი',
    district: 'ბათუმი',
    coords: { lat: 41.6542, lng: 41.6378 },
    buildingNumber: '1',
    img: '/images/projects/le-meridien-batumi.webp',
    yearBuilt: 2019,
    floors: 35,
    units: 110,
    rating: 4.9,
    status: 'ready',
    description: {
      ka: 'ლე მერიდიენ ბათუმი / Batumi Tower — ნინოშვილის 1. 205 მეტრი სიმაღლის კოშკი ეშმაკის ბორბლით ფასადზე, კავკასიაში ერთ-ერთი უმაღლესი შენობა.',
      en: 'Le Méridien Batumi & Batumi Tower — 1 Ninoshvili St. 205m tower with the world\'s highest building-integrated Ferris wheel on the Black Sea coast.',
      ru: 'Le Méridien Batumi / Batumi Tower — ул. Ниношвили 1. 205-метровый небоскреб со встроенным колесом обозрения на фасаде.',
    },
  },
  {
    slug: 'courtyard-marriott-batumi',
    code: 'SV-BT-0011',
    name: 'ალიანს პალასი (Courtyard by Marriott)',
    nameEn: 'Alliance Palace (Courtyard by Marriott)',
    address: 'შერიფ ხიმშიაშვილის ქ. 5, ახალი ბულვარი, ბათუმი',
    city: 'ბათუმი',
    district: 'ახალი ბულვარი',
    coords: { lat: 41.6448, lng: 41.6185 },
    buildingNumber: '5',
    img: '/images/projects/alliance-palace.webp',
    developerSlug: 'alliance-group',
    yearBuilt: 2019,
    floors: 41,
    units: 1000,
    rating: 4.8,
    status: 'ready',
    description: {
      ka: 'ალიანს პალასი — ხიმშიაშვილის 5, ახალი ბულვარი. 41 სართული, Courtyard by Marriott-ის სასტუმრო და პრემიუმ აპარტამენტები ზღვის ხედით.',
      en: 'Alliance Palace — 5 Khimshiashvili St, New Boulevard. 41-storey oval tower hosting Courtyard by Marriott and luxury serviced apartments.',
      ru: 'Alliance Palace — ул. Химшиашвили 5. 41-этажная башня овальной формы с отелем Courtyard by Marriott и апартаментами.',
    },
  },
  {
    slug: 'rooms-hotel-tbilisi',
    code: 'SV-TB-0015',
    name: 'რუმს ჰოტელ თბილისი',
    nameEn: 'Rooms Hotel Tbilisi',
    address: 'მერაბ კოსტავას ქ. 14, ვერა, თბილისი',
    city: 'თბილისი',
    district: 'მთაწმინდა',
    coords: { lat: 41.7088, lng: 44.7892 },
    buildingNumber: '14',
    img: '/images/projects/rooms-hotel-tbilisi.webp',
    yearBuilt: 2014,
    floors: 8,
    units: 125,
    rating: 4.9,
    status: 'ready',
    description: {
      ka: 'რუმს ჰოტელ თბილისი — კოსტავას 14, ვერა. დიზაინ-სასტუმრო და კულტურული ჰაბი ინდუსტრიული ესთეტიკით, ბაღითა და Lounge Bar-ით.',
      en: 'Rooms Hotel Tbilisi — 14 Kostava St, Vera. Design-forward hotel and cultural hub with distinct industrial aesthetics, garden courtyard and Lounge Bar.',
      ru: 'Rooms Hotel Tbilisi — ул. Костава 14, Вера. Дизайнерский отель и культурный хаб с индустриальной эстетикой, садом и лаундж-баром.',
    },
  },
  {
    slug: 'stamba-hotel-tbilisi',
    code: 'SV-TB-0016',
    name: 'სტამბა თბილისი',
    nameEn: 'Stamba Hotel Tbilisi',
    address: 'მერაბ კოსტავას ქ. 14, ვერა, თბილისი',
    city: 'თბილისი',
    district: 'მთაწმინდა',
    coords: { lat: 41.7092, lng: 44.7888 },
    buildingNumber: '14',
    img: '/images/projects/stamba-hotel-tbilisi.webp',
    yearBuilt: 2018,
    floors: 6,
    units: 150,
    rating: 5.0,
    status: 'ready',
    description: {
      ka: 'სტამბა თბილისი — კოსტავას 14. საბჭოთა პერიოდის ისტორიული სტამბის შენობის უნიკალური რესტავრაცია შუშის ფსკერიანი აუზითა და ბიბლიოთეკით.',
      en: 'Stamba Hotel Tbilisi — 14 Kostava St. World-acclaimed restoration of a historic Soviet publishing house featuring a glass-bottom rooftop pool and 5-storey atrium.',
      ru: 'Stamba Hotel Tbilisi — ул. Костава 14. Знаменитая реставрация исторической типографии со стеклянным бассейном на крыше и 5-этажным атриумом.',
    },
  },
  {
    slug: 'tbilisi-marriott',
    code: 'SV-TB-0017',
    name: 'თბილისი მარიოტი',
    nameEn: 'Tbilisi Marriott Hotel',
    address: 'შოთა რუსთაველის გამზ. 13, მთაწმინდა, თბილისი',
    city: 'თბილისი',
    district: 'მთაწმინდა',
    coords: { lat: 41.6982, lng: 44.7985 },
    buildingNumber: '13',
    img: '/images/projects/tbilisi-marriott.webp',
    yearBuilt: 1915,
    floors: 7,
    units: 127,
    rating: 4.9,
    status: 'ready',
    description: {
      ka: 'თბილისი მარიოტი — რუსთაველის 13. ასწლოვანი ისტორიული ნეოკლასიკური არქიტექტურული ძეგლი, 5-ვარსკვლავიანი სასტუმრო დედაქალაქის გულში.',
      en: 'Tbilisi Marriott Hotel — 13 Rustaveli Ave. Century-old neoclassical architectural landmark, 5-star luxury hotel in the diplomatic heart of Tbilisi.',
      ru: 'Tbilisi Marriott Hotel — пр. Руставели 13. Исторический неоклассический памятник архитектуры, 5-звездочный отель в центре Тбилиси.',
    },
  },
  {
    slug: 'porta-batumi-tower',
    code: 'SV-BT-0012',
    name: 'პორტა ბათუმი თაუერი',
    nameEn: 'Porta Batumi Tower',
    address: 'შოთა რუსთაველის გამზ. 4, ბათუმი',
    city: 'ბათუმი',
    district: 'ბათუმი',
    coords: { lat: 41.6528, lng: 41.6362 },
    buildingNumber: '4',
    img: '/images/projects/porta-batumi-tower.webp',
    yearBuilt: 2016,
    floors: 43,
    units: 418,
    rating: 4.9,
    status: 'ready',
    description: {
      ka: 'პორტა ბათუმი თაუერი — რუსთაველის 4. 43-სართულიანი 164 მეტრიანი ექსკლუზიური მინის კოშკი Broadway Malyan-ის დიზაინით, ბათუმის პორტის პირდაპირ.',
      en: 'Porta Batumi Tower — 4 Rustaveli Ave. 43-storey 164m glass skyscraper designed by Broadway Malyan, overlooking Batumi seaport and Miracle Square.',
      ru: 'Porta Batumi Tower — пр. Руставели 4. 43-этажный 164-метровый небоскреб от Broadway Malyan с видом на Батумский порт и площадь Чудес.',
    },
  },
  {
    slug: 'radisson-blu-batumi',
    code: 'SV-BT-0013',
    name: 'რადისონ ბლუ ბათუმი',
    nameEn: 'Radisson Blu Hotel Batumi',
    address: 'ნინოშვილის ქ. 1, ბათუმი',
    city: 'ბათუმი',
    district: 'ბათუმი',
    coords: { lat: 41.6521, lng: 41.6358 },
    buildingNumber: '1',
    img: '/images/projects/radisson-blu-batumi.webp',
    yearBuilt: 2011,
    floors: 19,
    units: 168,
    rating: 4.8,
    status: 'ready',
    description: {
      ka: 'რადისონ ბლუ ბათუმი — ნინოშვილის 1. იტალიელი არქიტექტორის მიკელე დე ლუკის მიერ დაპროექტებული გამორჩეული ტალღისებური შენობა პლაჟთან.',
      en: 'Radisson Blu Hotel Batumi — 1 Ninoshvili St. Distinctive wave-formed architectural icon designed by Italian architect Michele De Lucchi.',
      ru: 'Radisson Blu Hotel Batumi — ул. Ниношвили 1. Знаковый волнообразный отель по проекту итальянского архитектора Микеле Де Лукки.',
    },
  },
]

/** SEO alias — same pin as axis-towers; do not double-list. */
const PROJECT_SLUG_ALIASES = new Set(['axis-towers-vake'])

const STREET_HINT =
  /(?:\bst\.?\b|\bstreet\b|\bave\b|\bavenue\b|\bline\b|ქ\.|ქუჩ|გამზ|შესახვ|ჩიხ|ხეივან)/i
const HOUSE_NO = /^[\d]+[a-zA-Zა-ჰ]?(?:-[\d]+[a-zA-Zა-ჰ]?)*$/

function districtFrom(location: string, city: string): string {
  const parts = location
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (parts.length && parts[parts.length - 1] === city) parts.pop()
  while (parts.length && HOUSE_NO.test(parts[parts.length - 1]!)) parts.pop()
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]!
    if (!STREET_HINT.test(p) && !/\d/.test(p)) return p
  }
  return city
}

/** Official raion → ubani for Tbilisi; longest ubani name wins. */
const TB_RAIONS = geoRaionsOf('თბილისი')
const TB_UBANI_TO_RAION: Record<string, string> = {}
for (const [raion, list] of Object.entries(TB_RAIONS)) {
  for (const u of list) TB_UBANI_TO_RAION[u] = raion
}
const TB_UBANI = Object.keys(TB_UBANI_TO_RAION).sort((a, b) => b.length - a.length)
const TB_RAION_SET = new Set(Object.keys(TB_RAIONS))

function locationHasName(location: string, city: string, name: string): boolean {
  return location
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s !== city)
    .some((p) => p === name || p.includes(name))
}

function quarterUbani(location: string, city: string): string | undefined {
  let best: string | undefined
  let bestLen = 0
  for (const q of TBILISI_QUARTERS) {
    if (locationHasName(location, city, q.ka) && q.ka.length > bestLen) {
      best = q.district
      bestLen = q.ka.length
    }
  }
  return best
}

const EXTRA_PLACE: Record<string, { district: string; ubani?: string }> = {
  თაბახმელა: { district: 'მთაწმინდა', ubani: 'ტაბახმელა' },
  ტაბახმელა: { district: 'მთაწმინდა', ubani: 'ტაბახმელა' },
  ჯიქია: { district: 'საბურთალო' },
  'კრწანისის პარკი / მტკვრის ნაპირი': { district: 'კრწანისი' },
}

const SLUG_PLACE: [RegExp, string, string?][] = [
  [/lisi/, 'საბურთალო', 'ლისი'],
  [/dighomi|digomi/, 'საბურთალო', 'დიღომი'],
  [/nutsubidze/, 'საბურთალო', 'ნუცუბიძის ფერდობი'],
  [/ortachala/, 'კრწანისი', 'ორთაჭალა'],
  [/saburtalo|mindeli|tamarashvili|holbrooke|barcelo/, 'საბურთალო'],
  [/vake|mziuri/, 'ვაკე'],
  [/isani|omnia/, 'ისანი'],
  [/gldani/, 'გლდანი'],
  [/varketili/, 'სამგორი', 'ვარკეთილი'],
  [/avlabari/, 'ისანი', 'ავლაბარი'],
  [/didube/, 'დიდუბე'],
  [/mtatsminda/, 'მთაწმინდა'],
  [/krtsanisi|gorgasali|waterfront|horizon|oriental|riverfront/, 'კრწანისი'],
  [/jikia/, 'საბურთალო'],
  [/central-park/, 'საბურთალო'],
  [/rivertown/, 'ჩუღურეთი'],
  [/kavtaradze/, 'საბურთალო'],
  [/gagarin/, 'გლდანი'],
  [/apex-towers/, 'საბურთალო', 'დიდი დიღომი'],
  [/axis-palace/, 'საბურთალო'],
]

function hintFromSlug(slug: string): { district: string; ubani?: string } | undefined {
  // ponytail: "lisi" is a substring of "tbilisi" — strip the city token first.
  const s = slug.replaceAll('tbilisi', '')
  for (const [re, district, ubani] of SLUG_PLACE) {
    if (re.test(s)) return ubani ? { district, ubani } : { district }
  }
  return undefined
}

/** District centroids from sibling projects that already carry a catalog
 *  district — polygons would be exact but ~40× heavier. ponytail: lazy
 *  per-city cache, equirectangular km² (valid under the 2.5 km catchment,
 *  same limit as METRO_MAX_CATCHMENT_M). */
const DISTRICT_CENTROIDS = new Map<string, Map<string, { lat: number; lng: number; n: number }>>()
function nearestCatalogDistrict(
  city: string,
  lat: number,
  lng: number,
  names?: Set<string>,
): string | undefined {
  let cents = DISTRICT_CENTROIDS.get(city)
  if (!cents) {
    cents = new Map()
    const catalog = new Set(geoDistrictsOf(city))
    for (const p of PROJECTS) {
      if (p.city !== city) continue
      const d = p.district && canonicalizeDistrict(p.district, city)
      if (!d || !catalog.has(d)) continue
      const c = cents.get(d) ?? { lat: 0, lng: 0, n: 0 }
      c.lat += p.coords.lat
      c.lng += p.coords.lng
      c.n++
      cents.set(d, c)
    }
    DISTRICT_CENTROIDS.set(city, cents)
  }
  const cosLat = Math.cos((lat * Math.PI) / 180)
  let best: string | undefined
  let bestD = 2.5 * 2.5
  for (const [d, c] of cents) {
    if (names && !names.has(d)) continue
    const dy = (c.lat / c.n - lat) * 111.32
    const dx = (c.lng / c.n - lng) * 111.32 * cosLat
    const dist = dy * dy + dx * dx
    if (dist <= bestD) {
      bestD = dist
      best = d
    }
  }
  return best
}

function placeFrom(
  location: string,
  city: string,
  slug?: string,
  /** Project's own (check-locked) district — wins over address parsing. */
  seed?: string,
  coords?: { lat: number; lng: number },
): { district: string; ubani?: string } {
  let district = (seed && canonicalizeDistrict(seed, city)) || districtFrom(location, city)
  if (city !== 'თბილისი') {
    // Outside Tbilisi, districtFrom grabs the last address part — lanes, 'რაიონი'
    // shorthand, street names. Keep only catalog districts (check-locked); world
    // cities have no GE catalog, so canonicalize only. When the blob names
    // nothing catalogued, snap to the nearest district centroid — an unnamed
    // district hides the building from district filters, a wrong one lies.
    const canon = canonicalizeDistrict(district, city)
    const catalog = geoDistrictsOf(city)
    if (catalog.includes(canon)) return { district: canon }
    if (!GEO_CITIES.includes(city)) return { district: canon }
    return { district: (coords ? nearestCatalogDistrict(city, coords.lat, coords.lng) : undefined) ?? '' }
  }

  const extra = EXTRA_PLACE[district]
  if (extra) return extra

  const ubani =
    TB_UBANI.find((n) => locationHasName(location, city, n)) ?? quarterUbani(location, city)
  if (ubani) {
    const raion = TB_UBANI_TO_RAION[ubani] ?? (TB_RAION_SET.has(district) ? district : undefined)
    if (raion && (district === ubani || district === city || !TB_RAION_SET.has(district))) {
      district = raion
    }
    if (!TB_RAION_SET.has(district) && coords) {
      district = nearestCatalogDistrict(city, coords.lat, coords.lng, TB_RAION_SET) ?? ''
    }
    return { district, ubani: ubani === district ? undefined : ubani }
  }
  if (TB_RAION_SET.has(district)) return { district }

  const hinted = slug ? hintFromSlug(slug) : undefined
  if (hinted) return hinted
  // Raw address leftovers ('სარაჯიშვილი', city echo) are not districts — snap
  // to the nearest raion centroid, else '' (the check locks districts to the
  // catalog; a fabricated name would be worse than none).
  if (coords) {
    const snap = nearestCatalogDistrict(city, coords.lat, coords.lng, TB_RAION_SET)
    if (snap) return { district: snap }
  }
  return { district: '' }
}

function yearBuiltFrom(p: Project): number | undefined {
  if (p.done < 100) return undefined
  const m = p.finish.match(/20\d{2}/)
  return m ? Number(m[0]) : undefined
}

/** Latin-script city keys from world seeds → the ka keys the catalog filters on. */
const CITY_KEY_ALIASES: Record<string, string> = {
  Tbilisi: 'თბილისი',
  Batumi: 'ბათუმი',
  Dubai: 'დუბაი',
  Berlin: 'ბერლინი',
  Frankfurt: 'ფრანკფურტი',
  'Abu Dhabi': 'აბუ-დაბი',
  Munich: 'მიუნხენი',
  Hamburg: 'ჰამბურგი',
  Stuttgart: 'შტუტგარტი',
  Cologne: 'კელნი',
  Leipzig: 'ლაიფციგი',
  Dresden: 'დრეზდენი',
  Mannheim: 'მანჰაიმი',
  Bremen: 'ბრემენი',
  'Ras Al Khaimah': 'რას-ელ-ხაიმა',
}

function buildingNumberFrom(location: string): string {
  const head = location.split(',')[0] ?? location
  const m = head.match(/(\d+[a-zA-Zა-ჰ]?)\s*$/)
  return m?.[1] ?? '—'
}

function projectToBuilding(p: Project): BuildingCatalogEntry {
  const floors = Math.min(100, p.floors ?? Math.max(8, Math.round(p.flats / 12)))
  // Some world-project seeds key the city in Latin script while the rest of the
  // catalog (and the city filter) is ka-keyed — normalize or the filter shows
  // both spellings as separate cities with split counts.
  const city = CITY_KEY_ALIASES[p.city] ?? p.city
  const { district, ubani } = placeFrom(p.location, city, p.slug, p.district, p.coords)
  return {
    slug: p.slug,
    code: projectCode(p),
    // ka-first like STREET_LANDMARKS; Latin brand stays in nameEn / JSON-LD alternateName.
    name: p.nameKa ?? p.name,
    nameEn: p.name,
    address: p.location,
    city,
    district,
    ubani,
    coords: p.coords,
    buildingNumber: buildingNumberFrom(p.location),
    img: p.img,
    gallery: p.gallery,
    passportUrl: p.passportUrl,
    developerSlug: p.developerSlug,
    yearBuilt: yearBuiltFrom(p),
    floors,
    units: p.flats,
    rating: p.rating,
    description: p.description,
    projectSlug: p.slug,
    status: p.done >= 100 ? 'ready' : 'construction',
    priceFromM2: p.priceFromM2,
    finish: p.finish,
  }
}

function enrichPlace(b: BuildingCatalogEntry): BuildingCatalogEntry {
  if (b.ubani) return b
  const { district, ubani } = placeFrom(b.address, b.city, b.slug, b.district, b.coords)
  return {
    ...b,
    district: TB_RAION_SET.has(b.district) ? b.district : district,
    ubani,
  }
}

function buildCatalog(): BuildingCatalogEntry[] {
  const taken = new Set(STREET_LANDMARKS.map((b) => b.slug))
  for (const b of STREET_LANDMARKS) {
    if (b.projectSlug) taken.add(b.projectSlug)
  }
  for (const alias of PROJECT_SLUG_ALIASES) taken.add(alias)

  const fromProjects = PROJECTS.filter(
    (p) =>
      Number.isFinite(p.coords.lat) &&
      Number.isFinite(p.coords.lng) &&
      !taken.has(p.slug),
  ).map(projectToBuilding)

  // Street first (stable SV-* codes), then projects A→Z by name.
  return [
    ...STREET_LANDMARKS.map(enrichPlace),
    ...fromProjects.sort((a, b) => a.name.localeCompare(b.name, 'ka')),
  ]
}

export const BUILDINGS: BuildingCatalogEntry[] = buildCatalog()

export function getBuilding(slug: string): BuildingCatalogEntry | undefined {
  return BUILDINGS.find((b) => b.slug === slug)
}

export function getBuildingByCode(code: string): BuildingCatalogEntry | undefined {
  return BUILDINGS.find((b) => b.code.toUpperCase() === code.toUpperCase())
}

export function buildingDeveloperName(slug: string): string | undefined {
  const b = getBuilding(slug)
  if (!b) return undefined
  return getDeveloper(b.developerSlug)?.name.ka
}

export function relatedBuildings(slug: string, limit = 6): BuildingCatalogEntry[] {
  const me = getBuilding(slug)
  if (!me) return []
  const same = BUILDINGS.filter(
    (b) => b.slug !== slug && b.city === me.city && b.district === me.district,
  ).sort((a, b) => b.rating - a.rating)
  if (same.length >= 3) return same.slice(0, limit)
  const fill = BUILDINGS.filter(
    (b) => b.slug !== slug && b.city === me.city && !same.some((x) => x.slug === b.slug),
  ).sort((a, b) => b.rating - a.rating)
  return [...same, ...fill].slice(0, limit)
}
