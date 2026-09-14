/**
 * Agent/agency catalog — carved out of data/professionals.ts so the listing and
 * compare pages can resolve an agent name → profile slug without pulling the
 * ~1 MB new-build PROJECTS/DEVELOPERS catalog into the client bundle.
 * Type-only import below is erased at compile time, so this stays a leaf.
 */
import type { AgentProfile } from './professionals'

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
    phone: '+995 500 333 111',
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
    phone: '+995 500 333 111',
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
    phone: '+995 500 333 111',
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
      ka: 'დავითი 10 წელია თბილისის ბაზარზეა — ისნისა და სამგორის ბინებიდან კომერციულ ფართებამდე. პრაქტიკული რჩევები, ზედმეტი პირობების გარეშე.',
      en: 'Davit has 10 years on the Tbilisi market — from Isani and Samgori apartments to commercial spaces. Practical advice, no overpromising.',
      ru: 'Давид 10 лет на рынке Тбилиси — от квартир в Исани-Самгори и Глдани до коммерческих площадей. Практичные советы без лишних обещаний.',
    },
    verified: false,
    phone: '+995 500 333 111',
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
    phone: '+995 500 333 111',
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
    phone: '+995 500 333 111',
  },
]
