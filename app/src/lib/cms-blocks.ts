/**
 * SIVRCE — CMS block registry + isomorphic key helpers (client-safe).
 * Homepage marketing copy that is NOT part of the i18n dictionaries lives
 * here as defaults; admins override per language from /admin/content/pages.
 * Components read via useI18n().b(key) (client) or getCmsBlock(key) (server).
 *
 * Values are the current production copy — rendering is byte-identical until
 * an override exists in SystemConfig (`cms.<lang>.block.<key>`).
 */

import { ka, type DictKey } from "./i18n/ka"
import { LANGS, translate, type Lang } from "./i18n/core"
import { SITE_META } from "./i18n/server"

export const CMS_BLOCKS = {
  // ——— Hero ———
  'home.hero.badge': 'აქტიური განცხადებები საქართველოში',
  'home.hero.titleA': 'იპოვე შენი',
  'home.hero.titleAccent': 'სივრცე',
  'home.hero.subtitle':
    'უძრავი ქონება ერთ სივრცეში — იყიდე, იქირავე ან განათავსე',
  'home.hero.trust1': 'ვერიფიცირებული განცხადებები',
  'home.hero.trust2': 'უსაფრთხო გარიგებები',
  'home.hero.trust3': 'AI ფასის შეფასება',

  // ——— Stats (1–4 values come from getHomeStats; CMS keeps label/sub + 5–6 SLAs) ———
  'home.stats.1.value': '0',
  'home.stats.1.suffix': '+',
  'home.stats.1.label': 'აქტიური განცხადება',
  'home.stats.1.sub': 'ყოველდღიურად განახლებული',
  'home.stats.2.value': '0',
  'home.stats.2.suffix': '+',
  'home.stats.2.label': 'აგენტი და სააგენტო',
  'home.stats.2.sub': 'პროფილებით პლატფორმაზე',
  'home.stats.3.value': '0',
  'home.stats.3.suffix': '+',
  'home.stats.3.label': 'დეველოპერული პროექტი',
  'home.stats.3.sub': 'მთელი საქართველოდან',
  'home.stats.4.value': '0',
  'home.stats.4.suffix': '+',
  'home.stats.4.label': 'ქალაქი და რეგიონი',
  'home.stats.4.sub': 'განცხადებებით დაფარული',
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
  'home.stories.kicker': 'რჩეული',
  'home.listings.kicker': 'არჩეული შეთავაზებები',
  'home.listings.title': 'რჩეული განცხადებები',
  'home.listings.sub': 'ვერიფიცირებული ქონება — AI ფასის შეფასებით',
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
    'ჩვენი AI 48 პარამეტრს ანალიზებს — მდებარეობა, სართული, ხედი, რემონტი, ბაზრის დინამიკა — და გეუბნება, რამდენად კარგი გარიგებაა კონკრეტული ქონება.',
  'home.projects.kicker': 'ახალი პროექტები',
  'home.projects.title': 'მშენებარე ბინები',
  'home.projects.sub': 'ყველა დეველოპერი, ყველა პროექტი — შეფასებებით და 3D ვიზუალიზაციით',
  'home.services.title': 'ყველაფერი უძრავი ქონებისთვის',
  'home.services.sub': 'ძიებიდან გარიგებამდე — სრული ეკოსისტემა ერთ პლატფორმაზე',
  'home.services.mortgage.title': 'იპოთეკური კალკულატორი',
  'home.services.mortgage.text': 'ყოველთვიური შენატანი TBC, BoG, Liberty და ტერაბანკის პირობების მიხედვით.',
  'home.services.renovation.title': 'რემონტის ბიუჯეტი',
  'home.services.renovation.text': 'შავი / თეთრი / მწვანე კარკასი და გასაღების ჩაბარება — ორიენტირი მ²-ზე.',
  'home.services.map.title': 'რუკაზე ძებნა',
  'home.services.map.text': 'უბნები, პროექტები და ფასები ერთ რუკაზე — იპოვე ბინა რუკით.',
  'home.services.tour.title': 'ფოტო & 3D ტური',
  'home.services.tour.text': 'პროფესიონალური ფოტოგადაღება და 3D ვირტუალური ტური ობიექტისთვის.',
  'home.services.price.title': 'ფასის შეფასება',
  'home.services.price.text': 'საბაზრო ღირებულების ორიენტირი — შეადარე მსგავს განცხადებებს.',
  'home.services.docs.title': 'ხელშეკრულების შაბლონები',
  'home.services.docs.text': 'ნასყიდობის, იჯარისა და გირავნობის იურიდიულად გამართული შაბლონები.',
  'home.services.cta': 'ისარგებლე სერვისით',

  // ——— Listings rail ———
  'home.listings.viewAll': 'ყველა განცხადების ნახვა',
  'home.listings.scrollLabel': 'რჩეული განცხადებები',

  // ——— Map section ———
  'home.map.f1.title': 'დააჭირე ნებისმიერ შენობას',
  'home.map.f1.text': '3D რუკაზე შენობაზე დაჭერით ხედავ ყველა გასაყიდსა და გასაქირავებელ ფართს კონკრეტულ კორპუსში.',
  'home.map.f2.title': 'მშენებარე კორპუსების ვიზუალიზაცია',
  'home.map.f2.text': 'ჯერ დაუსრულებელ პროექტებსაც კი ვაჩვენებთ 3D-ში — აირჩიე ბინა პირდაპირ სამშენებლო მაკეტიდან.',
  'home.map.f3.title': 'უბნის სრული ანალიტიკა',
  'home.map.f3.text': 'ფასების დინამიკა, მ²-ის ღირებულება, ინფრასტრუქტურა და ინვესტიციური პოტენციალი ერთ ეკრანზე.',
  'home.map.f4.title': '2D / 3D რეჟიმები',
  'home.map.f4.text': 'გადართე კლასიკურ რუკასა და იმერსიულ 3D ხედს შორის ერთი შეხებით — ნებისმიერ მოწყობილობაზე.',
  'home.map.openCta': 'გახსენი 3D რუკა',
  'home.map.openBadge': 'გახსენი ინტერაქტიული 3D რუკა',
  'home.map.demoUnits': '{n} ბინა იყიდება',
  'home.perM2': '/მ²-დან',

  // ——— Projects rail ———
  'home.projects.viewAll': 'ყველა პროექტი',
  'home.projects.homesWord': 'მშენებარე ბინები',
  'home.projects.built': 'აშენებულია {n}%',
  'home.projects.delivery': 'ჩაბარება {v}',
  'home.projects.flats': '{n} ბინა',

  // ——— Neighborhoods rail ———
  'home.nb.kicker': 'უბნები',
  'home.nb.title': 'სად ღირს ცხოვრება',
  'home.nb.sub': 'ცხოვრების ხარისხის ქულები, ფასი მ²-ზე და რეალური ფოტოები — ვაკედან ბათუმამდე',
  'home.nb.viewAll': 'ყველა უბანი',

  // ——— Agents rail ———
  'home.agents.kicker': 'ტოპ აგენტები',
  'home.agents.title': 'ყველაზე მეტი აქტიური განცხადება',
  'home.agents.sub': 'რეიტინგი აქტიური განცხადებებით — ვისაც ახლა ყველაზე მეტი აქვს ბაზარზე',
  'home.agents.viewAll': 'ყველა აგენტი',
  'home.agents.active': '{n} აქტიური',
  'home.agents.profile': 'პროფილი',
  'home.agents.scrollLabel': 'ტოპ აგენტების კარუსელი',

  // ——— Developers rail ———
  'home.devs.kicker': 'ტოპ დეველოპერები',
  'home.devs.title': 'წამყვანი დეველოპერული კომპანიები',
  'home.devs.sub': 'რეიტინგი აქტიური პროექტებით — დაათვალიერე პროექტები და ობიექტები',
  'home.devs.viewAll': 'ყველა დეველოპერი',
  'home.devs.projectsCount': '{n} პროექტი',
  'home.devs.active': '{n} აქტიური',
  'home.devs.projectsCta': 'პროექტები',
  'home.devs.scrollLabel': 'დეველოპერების კარუსელი',

  // ——— Forum teaser ———
  'home.forum.kicker': 'ფორუმი & ანალიტიკა',
  'home.forum.title': 'სადისკუსიო თემები & ბაზრის მიმოხილვა',
  'home.forum.sub': 'გაეცანი ექსპერტებისა და მომხმარებლების გამოცდილებას უძრავი ქონების შესახებ',
  'home.forum.viewAll': 'ყველა თემა',
  'home.forum.replies': '{n} პასუხი',
  'home.forum.views': '{n} ნახვა',

  // ——— Blog / news ———
  'home.blog.kicker': 'ბლოგი & სიახლეები',
  'home.blog.title': 'უძრავი ქონების სიახლეები & რჩევები',
  'home.blog.sub': 'უახლესი სტატიები, ბაზრის ანალიზი და ექსპერტების რეკომენდაციები',
  'home.blog.viewAll': 'ყველა სტატია',
  'home.blog.readMore': 'წაიკითხე სრულად',
  'home.blog.minutes': '{n} წთ',
  'home.blog.months': 'იან,თებ,მარ,აპრ,მაი,ივნ,ივლ,აგვ,სექ,ოქტ,ნოე,დეკ',

  // ——— Categories grid ———
  'home.categories.apartments': 'ბინები',
  'home.categories.houses': 'სახლები',
  'home.categories.cottages': 'აგარაკები',
  'home.categories.land': 'მიწის ნაკვეთები',
  'home.categories.commercial': 'კომერციული',
  'home.categories.dailyRent': 'დღიური ქირა',
  'home.categories.hotels': 'სასტუმროები',
  'home.categories.newProjects': 'ახალი პროექტები',
  'home.categories.explore': 'იხილე',

  // ——— Audience paths ———
  'home.for.title': 'ვისთვისაა სივრცე',
  'home.for.sub': 'ყველა გზა ერთ პლატფორმაზე — ძიება, განთავსება, პროფესიონალური ანგარიში',
  'home.for.buy.title': 'მყიდველები',
  'home.for.buy.text': '3D რუკა, AI ფასი, ვერიფიცირებული განცხადებები',
  'home.for.rent.title': 'დამქირავებლები',
  'home.for.rent.text': 'გრძელვადიანი ქირა უბნებით, ფილტრებით და რუკით',
  'home.for.daily.title': 'დღიური ქირა',
  'home.for.daily.text': 'კოლექციები: აუზი, პლაჟი, უკონტაქტო ჩექინი',
  'home.for.sell.title': 'გამყიდველები',
  'home.for.sell.text': 'უფასო განთავსება — 3 წუთი, ლიდები შენს დაფაზე',
  'home.for.host.title': 'გამქირავებლები',
  'home.for.host.text': 'ყოველთვიური და დღიური ქირა ერთ ანგარიშზე',
  'home.for.pro.title': 'აგენტები და დეველოპერები',
  'home.for.pro.text': 'პროფილი, ლიდები, VIP — უფრო იაფი, ვიდრე SS და MyHome',

  // ——— Hero quick chips ———
  'home.search.popular': 'პოპულარული:',
  'home.search.quick.vake': 'ვაკე',
  'home.search.quick.saburtalo': 'საბურთალო',
  'home.search.quick.mtatsminda': 'მთაწმინდა',
  'home.search.quick.batumi': 'ბათუმი',
  'home.search.quick.oldTbilisi': 'ძველი თბილისი',
  'home.search.quick.digomi': 'დიღომი',

  // ——— CTA ———
  'home.cta.title': 'შენი სივრცე გელოდება',
  'home.cta.sub':
    'მყიდველი, დამქირავებელი, გამყიდველი, აგენტი თუ დეველოპერი — ერთი ანგარიში. განთავსება უფასოა, 3 წუთი.',
  'home.cta.primary': 'დაამატე განცხადება',
  'home.cta.secondary': 'დაიწყე ძიება',
  'home.cta.proofA': 'აქტიური განცხადებები',
  'home.cta.proofB': 'მშენებარე ბინები',
  'home.cta.proofC': '9 ენა · 3D რუკა · AI ქულა',
} as const

export type CmsBlockKey = keyof typeof CMS_BLOCKS

export const CMS_BLOCK_KEYS = Object.keys(CMS_BLOCKS) as CmsBlockKey[]

// ---------------------------------------------------------------------------
// Isomorphic CMS key/store helpers — shared by server store, admin UI, checks.
// ---------------------------------------------------------------------------

export const CMS_PREFIX = "cms."
/** Max chars of an override text (admin textarea + server action validation). */
export const CMS_MAX_VALUE_LEN = 2000
export const CMS_BLOCKS_GROUP = "blocks"

/** Split `cms.en.block.home.hero.titleA` → { lang: "en", key: "block.home.hero.titleA" }. */
export function parseCmsId(id: string): { lang: Lang; key: string } | null {
  if (!id.startsWith(CMS_PREFIX)) return null
  const rest = id.slice(CMS_PREFIX.length)
  const dot = rest.indexOf(".")
  if (dot < 1) return null
  const lang = rest.slice(0, dot)
  if (!(LANGS as readonly string[]).includes(lang)) return null
  return { lang: lang as Lang, key: rest.slice(dot + 1) }
}

/** SystemConfig.id is VarChar(64): null when the pair would overflow. */
export function buildCmsId(lang: Lang, key: string): string | null {
  const id = `${CMS_PREFIX}${lang}.${key}`
  return id.length <= 64 ? id : null
}

// ---------------------------------------------------------------------------
// Admin editor model — groups + rows for /admin/content/pages
// ---------------------------------------------------------------------------

export interface CmsGroup {
  id: string
  label: string
  count: number
}

export interface CmsRow {
  /** Storage key without lang: dict key ("nav.buy") or "block.<blockKey>". */
  key: string
  /** Default text shown as placeholder/hint (active lang for dicts, ka source for blocks). */
  defaultText: string
  /** Current override, "" when none. */
  value: string
}

export interface PagesFormState {
  error: string | null
  saved: boolean
}

/** Dict-key prefixes in ka order, then the marketing-blocks group, then SEO. */
export function cmsGroups(): CmsGroup[] {
  const groups: CmsGroup[] = []
  for (const key of Object.keys(ka)) {
    const prefix = key.split(".")[0]
    const g = groups.find((x) => x.id === prefix)
    if (g) g.count++
    else groups.push({ id: prefix, label: prefix, count: 1 })
  }
  groups.push({ id: CMS_BLOCKS_GROUP, label: "Homepage blocks", count: CMS_BLOCK_KEYS.length })
  groups.push({ id: CMS_SEO_GROUP, label: "SEO meta", count: CMS_SEO_KEYS.length })
  return groups
}

const DICT_KEYS = Object.keys(ka) as DictKey[]

/** Rows for one group+language. Unknown group → []. Reused by page AND action (never trust client keys). */
export function cmsRowsForGroup(
  lang: Lang,
  group: string,
  overrides: Record<string, string>,
): CmsRow[] {
  if (group === CMS_BLOCKS_GROUP) {
    return CMS_BLOCK_KEYS.map((key) => ({
      key: `block.${key}`,
      defaultText: CMS_BLOCKS[key],
      value: overrides[`block.${key}`] ?? "",
    }))
  }
  if (group === CMS_SEO_GROUP) {
    return CMS_SEO_KEYS.map((key) => ({
      key,
      defaultText: SEO_DEFAULTS[key](lang),
      value: overrides[key] ?? "",
    }))
  }
  return DICT_KEYS.filter((k) => k.split(".")[0] === group).map((k) => ({
    key: k,
    defaultText: translate(lang, k),
    value: overrides[k] ?? "",
  }))
}

// ---------------------------------------------------------------------------
// SEO meta — site-wide <title>/<meta description> per language, overridable.
// Defaults mirror SITE_META (the layout's metadata source).
// ---------------------------------------------------------------------------

export const CMS_SEO_GROUP = "seo"

export const CMS_SEO_KEYS = ["seo.site.title", "seo.site.description"] as const
export type CmsSeoKey = (typeof CMS_SEO_KEYS)[number]

const SEO_DEFAULTS: Record<CmsSeoKey, (lang: Lang) => string> = {
  "seo.site.title": (lang) => SITE_META[lang].title,
  "seo.site.description": (lang) => SITE_META[lang].description,
}
