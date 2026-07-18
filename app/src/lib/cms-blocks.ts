/**
 * SIVRCE — CMS block registry (client-safe, pure data).
 * Homepage marketing copy that is NOT part of the i18n dictionaries lives
 * here as defaults; admins override per language from /admin/content/pages.
 * Components read via useI18n().b(key) (client) or getCmsBlock(key) (server).
 *
 * Values are the current production copy — rendering is byte-identical until
 * an override exists in SystemConfig (`cms.<lang>.block.<key>`).
 */

export const CMS_BLOCKS = {
  // ——— Hero ———
  'home.hero.badge': '52,400+ აქტიური განცხადება საქართველოში',
  'home.hero.titleA': 'იპოვე შენი',
  'home.hero.titleAccent': 'სივრცე',
  'home.hero.subtitle':
    'ბინები, სახლები, აგარაკები, მიწა და კომერციული ფართები — ყველაფერი ერთ პლატფორმაზე, 3D რუკით და AI შეფასებით',
  'home.hero.trust1': 'ვერიფიცირებული განცხადებები',
  'home.hero.trust2': 'უსაფრთხო გარიგებები',
  'home.hero.trust3': 'AI ფასის შეფასება',

  // ——— Stats (value + suffix drive the count-up; keep value numeric) ———
  'home.stats.1.value': '52400',
  'home.stats.1.suffix': '+',
  'home.stats.1.label': 'აქტიური განცხადება',
  'home.stats.1.sub': 'ყოველდღიურად განახლებული',
  'home.stats.2.value': '1800',
  'home.stats.2.suffix': '+',
  'home.stats.2.label': 'აგენტი და სააგენტო',
  'home.stats.2.sub': 'შეფასებებითა და რეიტინგით',
  'home.stats.3.value': '136',
  'home.stats.3.suffix': '+',
  'home.stats.3.label': 'დეველოპერული პროექტი',
  'home.stats.3.sub': 'მთელი საქართველოდან',
  'home.stats.4.value': '98',
  'home.stats.4.suffix': '%',
  'home.stats.4.label': 'მომხმარებლის კმაყოფილება',
  'home.stats.4.sub': '12,000+ შეფასებიდან',
  'home.stats.5.value': '24',
  'home.stats.5.suffix': '/7',
  'home.stats.5.label': 'მხარდაჭერა',
  'home.stats.5.sub': 'ქართულად, ინგლისურად, რუსულად',
  'home.stats.6.value': '3',
  'home.stats.6.suffix': ' წთ',
  'home.stats.6.label': 'საშუალო პასუხის დრო',
  'home.stats.6.sub': 'აგენტებისგან პლატფორმაზე',

  // ——— Section headings ———
  'home.categories.title': 'რას ეძებ?',
  'home.categories.sub': 'ყველა ტიპის უძრავი ქონება — ერთ სივრცეში',
  'home.collections.title': 'კოლექციები',
  'home.collections.sub': 'დღიური ქირა — შერჩეული თემებით',
  'home.listings.kicker': 'არჩეული შეთავაზებები',
  'home.listings.title': 'SUPER VIP განცხადებები',
  'home.listings.sub': 'პრემიუმ ქონებები AI ფასის შეფასებით',
  'home.map.kicker': 'ექსკლუზიური ტექნოლოგია',
  'home.map.titleA': 'პირველი',
  'home.map.titleAccent': 'ინტერაქტიული 3D რუკა',
  'home.map.titleB': 'საქართველოში',
  'home.map.sub':
    'დაივიწყე უსასრულო სიები. ნახე ქალაქი ისე, როგორც არის — და იპოვე შენი ბინა პირდაპირ რუკიდან.',
  'home.ai.kicker': 'AI ტექნოლოგია',
  'home.ai.titleA': 'იცოდე ნამდვილი ფასი —',
  'home.ai.titleAccent': 'ყიდვამდე',
  'home.ai.sub':
    'ჩვენი AI 48 პარამეტრს ანალიზებს — მდებარეობა, იატაკი, ხედი, რემონტი, ბაზრის დინამიკა — და გეუბნება, რამდენად კარგი გარიგებაა კონკრეტული ქონება.',
  'home.projects.kicker': 'ახალი კორპუსები',
  'home.projects.title': 'მშენებარე პროექტები',
  'home.projects.sub': 'ყველა დეველოპერი, ყველა პროექტი — შეფასებებით და 3D ვიზუალიზაციით',
  'home.services.title': 'ყველაფერი უძრავი ქონებისთვის',
  'home.services.sub': 'ძიებიდან გარიგებამდე — სრული ეკოსისტემა ერთ პლატფორმაზე',

  // ——— CTA ———
  'home.cta.title': 'შენი სივრცე გელოდება',
  'home.cta.sub':
    'გამყიდველი თუ მყიდველი — დაიწყე დღეს. განცხადების დამატება უფასოა და სულ 3 წუთი სჭირდება.',
  'home.cta.primary': 'დაამატე განცხადება',
  'home.cta.secondary': 'დაიწყე ძიება',
  'home.cta.proofA': '52,400+ განცხადება',
  'home.cta.proofB': '136 მშენებარე პროექტი',
  'home.cta.proofC': '#1 პლატფორმა საქართველოში',
} as const

export type CmsBlockKey = keyof typeof CMS_BLOCKS

export const CMS_BLOCK_KEYS = Object.keys(CMS_BLOCKS) as CmsBlockKey[]
