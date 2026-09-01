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
  'home.hero.badge': 'უძრავი ქონება ერთ სივრცეში',
  'home.hero.titleA': 'უძრავი ქონება',
  'home.hero.titleAccent': 'საქართველოში',
  'home.hero.subtitle':
    'იყიდება ქირავდება გაიცემა იჯარით გირავდება ქირავდება დღიურად ბინები სახლები აგარაკები მშენებარე ბინები',
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
  'home.stats.2.sub': 'პროფილები პლატფორმაზე',
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
  'home.categories.sub': 'ბინები, სახლები და აგარაკები — იყიდება, ქირავდება, გაიცემა იჯარით, დღიურად',
  'home.collections.title': 'კოლექციები',
  'home.collections.sub': 'დღიური ქირა — შერჩეული თემებით',
  'home.stories.kicker': 'რჩეული',
  'home.stories.videoTitle': 'განცხადებები ვიდეოთი',
  'home.stories.videoHow': 'როგორ მოვხვდე აქ',
  'home.listings.kicker': 'SUPER VIP',
  'home.listings.title': 'სუპერ VIP განცხადებები',
  'home.listings.sub': 'ტოპ შეთავაზებები პირველ ადგილზე — მაქსიმალური ხილვადობა',
  'home.map.kicker': 'ექსკლუზიური ტექნოლოგია',
  'home.map.titleA': 'პირველი',
  'home.map.titleAccent': 'ინტერაქტიული 3D რუკა',
  'home.map.titleB': 'საქართველოში',
  'home.map.sub':
    'ნახე ქალაქი ისე, როგორც არის — იპოვე ბინა პირდაპირ 3D რუკიდან.',
  'home.ai.kicker': 'AI ტექნოლოგია',
  'home.ai.titleA': 'იცოდე ნამდვილი ფასი —',
  'home.ai.titleAccent': 'ყიდვამდე',
  'home.ai.sub':
    'AI ადარებს მდებარეობას, სართულს, ხედს, რემონტს და ბაზრის დინამიკას — და გეუბნება, რამდენად კარგი გარიგებაა.',
  'home.projects.kicker': 'ახალი პროექტები',
  'home.projects.title': 'მშენებარე ბინები',
  'home.projects.sub': 'არქი, m², ORBI, Axis — ყველა დეველოპერი, ყველა პროექტი. 3D რუკა.',
  'home.services.title': 'ყველაფერი უძრავი ქონებისთვის',
  'home.services.sub': 'ძიებიდან გარიგებამდე — ყველაფერი ერთ პლატფორმაზე',
  'home.services.mortgage.title': 'იპოთეკური კალკულატორი',
  'home.services.mortgage.text': 'ყოველთვიური გადასახადი TBC, საქართველოს ბანკის, Liberty და ტერაბანკის პირობებით.',
  'home.services.renovation.title': 'რემონტის ბიუჯეტი',
  'home.services.renovation.text': 'შავი / თეთრი / მწვანე კარკასი და გასაღების ჩაბარება — ორიენტირი მ²-ზე.',
  'home.services.map.title': 'რუკაზე ძებნა',
  'home.services.map.text': 'უბნები, პროექტები და ფასები — იპოვე ბინა რუკაზე.',
  'home.services.tour.title': 'ფოტო და 3D ტური',
  'home.services.tour.text': 'პროფესიონალური ფოტოგადაღება და 3D ვირტუალური ტური ობიექტისთვის.',
  'home.services.price.title': 'ფასის შეფასება',
  'home.services.price.text': 'საბაზრო ღირებულების ორიენტირი — შეადარე მსგავს განცხადებებს.',
  'home.services.docs.title': 'ხელშეკრულების შაბლონები',
  'home.services.docs.text': 'ნასყიდობის, იჯარისა და გირავნობის იურიდიულად გამართული შაბლონები.',
  'home.services.cta': 'ისარგებლე სერვისით',

  // ——— SUPER VIP rail ———
  'home.listings.viewAll': 'ყველა SUPER VIP',
  'home.listings.scrollLabel': 'SUPER VIP განცხადებები',

  // ——— VIP+ rail ———
  'home.vipPlus.kicker': 'VIP+',
  'home.vipPlus.title': 'VIP+ განცხადებები',
  'home.vipPlus.sub': 'პრიორიტეტული შეთავაზებები — ვერიფიცირებული განცხადებები AI ფასის შეფასებით',
  'home.vipPlus.viewAll': 'ყველა VIP+',
  'home.vipPlus.scrollLabel': 'VIP+ განცხადებები',

  // ——— Map section ———
  'home.map.f1.title': 'აირჩიე ნებისმიერი შენობა',
  'home.map.f1.text': 'შენობაზე შეხებით ხედავ ყველა გასაყიდ და გასაქირავებელ ფართს იმ კორპუსში.',
  'home.map.f2.title': 'მშენებარე კორპუსები 3D-ში',
  'home.map.f2.text': 'ჯერ დაუსრულებელ პროექტებსაც კი ვაჩვენებთ 3D-ში — აირჩიე ბინა პირდაპირ სამშენებლო მაკეტიდან.',
  'home.map.f3.title': 'უბნის სრული ანალიტიკა',
  'home.map.f3.text': 'ფასების დინამიკა, მ²-ის ღირებულება, ინფრასტრუქტურა და ინვესტიციური პოტენციალი ერთ ეკრანზე.',
  'home.map.f4.title': '2D / 3D რეჟიმები',
  'home.map.f4.text': 'გადართე ჩვეულებრივ რუკასა და 3D ხედს შორის ერთი შეხებით — ნებისმიერ მოწყობილობაზე.',
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
  'home.nb.sub': 'ვაკე, საბურთალო, ძველი თბილისი — იყიდება, ქირავდება და ბინები დღიურად. ფასი მ²-ზე.',
  'home.nb.viewAll': 'ყველა უბანი',

  // ——— Agents rail ———
  'home.agents.kicker': 'ტოპ აგენტები',
  'home.agents.title': 'ყველაზე მეტი აქტიური განცხადება',
  'home.agents.sub': 'ვისაც ახლა ყველაზე მეტი აქტიური განცხადება აქვს ბაზარზე',
  'home.agents.viewAll': 'ყველა აგენტი',
  'home.agents.active': '{n} აქტიური',
  'home.agents.profile': 'პროფილი',
  'home.agents.scrollLabel': 'ტოპ აგენტების კარუსელი',

  // ——— Developers rail ———
  'home.devs.kicker': 'ტოპ დეველოპერები',
  'home.devs.title': 'წამყვანი დეველოპერული კომპანიები',
  'home.devs.sub': 'რეიტინგი აქტიური პროექტებით — ნახე კომპლექსები და ბინები',
  'home.devs.viewAll': 'ყველა დეველოპერი',
  'home.devs.projectsCount': '{n} პროექტი',
  'home.devs.active': '{n} აქტიური',
  'home.devs.projectsCta': 'პროექტები',
  'home.devs.scrollLabel': 'დეველოპერების კარუსელი',

  // ——— Forum teaser ———
  'home.forum.kicker': 'ფორუმი და ანალიტიკა',
  'home.forum.title': 'სადისკუსიო თემები და ბაზრის მიმოხილვა',
  'home.forum.sub': 'გაეცანი ექსპერტებისა და მომხმარებლების გამოცდილებას უძრავი ქონების შესახებ',
  'home.forum.viewAll': 'ყველა თემა',
  'home.forum.replies': '{n} პასუხი',
  'home.forum.views': '{n} ნახვა',

  // ——— Blog / news ———
  'home.blog.kicker': 'ბლოგი და სიახლეები',
  'home.blog.title': 'უძრავი ქონების სიახლეები და რჩევები',
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
  'home.categories.dailyRent': 'ბინები დღიურად',
  'home.categories.partyHouses': 'სახლები წვეულებისთვის',
  'home.categories.hotels': 'სასტუმროები',
  'home.categories.newProjects': 'ახალი პროექტები',
  'home.categories.explore': 'ნახე',

  // ——— Audience paths ———
  'home.for.title': 'ვისთვისაა სივრცე',
  'home.for.sub': 'ყველა გზა ერთ პლატფორმაზე — ძიება, განთავსება, პროფესიონალური ანგარიში',
  'home.for.buy.title': 'მყიდველები',
  'home.for.buy.text': '3D რუკა, AI ფასი, ვერიფიცირებული განცხადებები',
  'home.for.rent.title': 'დამქირავებლები',
  'home.for.rent.text': 'გრძელვადიანი ქირა უბნებით, ფილტრებით და რუკით',
  'home.for.daily.title': 'დღიური ქირა',
  'home.for.daily.text': 'კოლექციები: სახლები წვეულებისთვის, აუზი, პლაჟი, უკონტაქტო ჩექინი',
  'home.for.sell.title': 'გამყიდველები',
  'home.for.sell.text': 'უფასო განთავსება — 3 წუთი, გამოხმაურებები შენს დაფაზე',
  'home.for.host.title': 'გამქირავებლები',
  'home.for.host.text': 'ყოველთვიური და დღიური ქირა ერთ ანგარიშზე',
  'home.for.pro.title': 'აგენტები და დეველოპერები',
  'home.for.pro.text': 'პროფილი, გამოხმაურებები, VIP — ხელმისაწვდომი ფასად',

  // ——— Hero quick chips ———
  'home.search.popular': 'პოპულარული:',
  'home.search.quick.dailyTbilisi': 'ბინები დღიურად თბილისში',
  'home.search.quick.vake': 'ვაკეში',
  'home.search.quick.saburtalo': 'საბურთალოზე',
  'home.search.quick.mtatsminda': 'მთაწმინდაზე',
  'home.search.quick.batumi': 'ბათუმში',
  'home.search.quick.oldTbilisi': 'ძველ თბილისში',
  'home.search.quick.digomi': 'დიღომში',

  // ——— CTA ———
  'home.cta.title': 'შენი სივრცე გელოდება',
  'home.cta.sub':
    'უძრავი ქონება საქართველოში — იყიდე, იქირავე ან განათავსე. ერთი ანგარიში, 3 წუთი, უფასო.',
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

/** Allowlist for a single-key admin write — dict, homepage block, or SEO. */
export function isKnownCmsKey(key: string): boolean {
  if (key.startsWith("block.")) {
    return (CMS_BLOCK_KEYS as string[]).includes(key.slice("block.".length))
  }
  if ((CMS_SEO_KEYS as readonly string[]).includes(key)) return true
  return (DICT_KEYS as string[]).includes(key)
}

/** One row for a known key. Unknown → null (caller must not write). */
export function cmsRowForKey(
  lang: Lang,
  key: string,
  overrides: Record<string, string>,
): CmsRow | null {
  if (!isKnownCmsKey(key)) return null
  if (key.startsWith("block.")) {
    const block = key.slice("block.".length) as CmsBlockKey
    return { key, defaultText: CMS_BLOCKS[block], value: overrides[key] ?? "" }
  }
  if ((CMS_SEO_KEYS as readonly string[]).includes(key)) {
    const seo = key as CmsSeoKey
    return { key, defaultText: SEO_DEFAULTS[seo](lang), value: overrides[key] ?? "" }
  }
  return { key, defaultText: translate(lang, key as DictKey), value: overrides[key] ?? "" }
}

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
