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
