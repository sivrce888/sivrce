import type { MetadataRoute } from 'next'
import { LISTINGS, type Listing } from '@/data/listings'
import { getAllListings } from '@/lib/listings-db'
import { BUILDINGS } from '@/data/buildings'
import { generateAllSeoParams } from '@/lib/seo-pages'
import { STREETS } from '@/data/tbilisi-streets'
import { METRO_STATIONS } from '@/data/tbilisi-metro'
import { listBlogPosts } from '@/lib/blog-live'
import { listForumThreads } from '@/lib/forum-live'
import { ListingStatus } from '@/generated/prisma/enums'
import { NEIGHBORHOODS } from '@/data/neighborhoods'
import { DEVELOPERS, PROJECTS, AGENT_PROFILES } from '@/data/professionals'
import { developersLive, projectsLive } from '@/lib/directory-live'
import { db } from '@/lib/db'
import { PROJECT_DISTRICTS } from '@/lib/directory-seo'
import { listingPath } from '@/lib/listing-slug'
import { listingVideoObject } from '@/lib/listing-video'
import { SERVICE_CATEGORIES, SERVICE_PROVIDERS } from '@/lib/services'
import { COM_ORIGIN, COUNTRY_IDS } from '@/lib/markets'
import { countrySitemapPaths } from '@/lib/country-copy'
import { BERLIN_BEZIRKE, DE_CITIES } from '@/lib/countries/de'

const BASE = 'https://sivrce.ge'

// Regenerate with fresh DB inventory hourly.
export const revalidate = 3600

// hreflang cluster: every page is now server-rendered in all 10 locales via
// app/[lang]. ka is unprefixed (canonical); the other nine carry a prefix.
const PREFIXED = ['en', 'ru', 'he', 'ar', 'tr', 'uk', 'hy', 'az', 'de'] as const
const HUB_LOCALES = ['en', 'ru'] as const

type Entry = {
  path: string
  /** Real content-change date when one exists; static pages omit lastmod —
   * an hourly-refreshed fake date teaches Google to ignore lastmod entirely. */
  lastModified?: Date
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>
  priority: number
  /** hreflang cluster this URL may claim — must mirror the page's own
   * alternates or Google drops the contradicting locale URLs:
   * - 'full' (default): truly localized via pageAlternates() — ka + 9 prefixes
   * - 'hub': programmatic SEO landings — real ka/en/ru copy only; the other
   *   seven locales serve English copy canonicalized to /en (see seoMetadata)
   * - 'ka': ka-only content via kaOnlyAlternates() (blog/forum posts, agent +
   *   agency profiles, neighbourhood guides, street/metro pages, /terms) */
  locale?: 'full' | 'hub' | 'ka'
  images?: string[]
  videos?: NonNullable<MetadataRoute.Sitemap[number]['videos']>
}

function absMedia(src: string): string {
  return src.startsWith('http') ? src : `${BASE}${src.startsWith('/') ? src : `/${src}`}`
}

function toSitemapEntry({ path, lastModified, changeFrequency, priority, locale = 'full', images, videos }: Entry): MetadataRoute.Sitemap[number] {
  // ponytail: one branch per cluster — mirrors lib/i18n/server helpers exactly.
  const languages: Record<string, string> =
    locale === 'ka'
      ? { ka: `${BASE}${path}`, 'x-default': `${BASE}${path}` }
      : locale === 'hub'
        ? { ka: `${BASE}${path}`, 'x-default': `${BASE}${path}`, ...Object.fromEntries(HUB_LOCALES.map((l) => [l, `${BASE}/${l}${path}`])) }
        : { ka: `${BASE}${path}`, ...Object.fromEntries(PREFIXED.map((l) => [l, `${BASE}/${l}${path}`])), 'x-default': `${BASE}${path}` }
  return {
    url: `${BASE}${path}`,
    ...(lastModified ? { lastModified } : {}),
    changeFrequency,
    priority,
    alternates: { languages },
    ...(images?.length ? { images } : {}),
    ...(videos?.length ? { videos } : {}),
  }
}

export async function generateSitemaps() {
  return [{ id: 'ge' }, { id: 'com' }]
}

export default async function sitemap({ id }: { id: string | Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const shard = await id
  if (shard === 'com') return countrySitemap()
  return georgiaSitemap()
}

async function georgiaSitemap(): Promise<MetadataRoute.Sitemap> {
  let listings: Listing[] = LISTINGS
  try {
    const rows = await getAllListings(5000)
    if (rows.length > 0) listings = rows
  } catch { /* DB unavailable at build — keep static URLs */ }

  const entries: Entry[] = [
    { path: '', changeFrequency: 'hourly', priority: 1 },
    // /search is meta-noindex — never list it here (conflicting signals).
    { path: '/map', changeFrequency: 'hourly', priority: 0.95 },
    { path: '/cadastre', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/buildings', changeFrequency: 'daily', priority: 0.9 },
    { path: '/blog', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/forum', changeFrequency: 'daily', priority: 0.7 },
    { path: '/neighborhoods', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/market', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/projects', changeFrequency: 'daily', priority: 0.85 },
    // New-build sub-hubs (ka/en/ru corpus in directory-seo PROJECT_HUBS).
    { path: '/projects/tbilisi', changeFrequency: 'daily', priority: 0.8 },
    { path: '/projects/batumi', changeFrequency: 'daily', priority: 0.8 },
    { path: '/projects/batumi/sea-view', changeFrequency: 'weekly', priority: 0.75 },
    { path: '/projects/installment', changeFrequency: 'weekly', priority: 0.75 },
    { path: '/projects/ready', changeFrequency: 'weekly', priority: 0.75 },
    { path: '/advertise', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/careers', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/faq', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.2, locale: 'ka' },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.2 },
    // ponytail: crawlable hubs + detail pages previously missing — sitemap
    // is the discovery path for ~140 indexed pages (agents, developers, projects).
    { path: '/mortgage-calculator', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/agents', changeFrequency: 'weekly', priority: 0.6 },
    { path: '/agencies', changeFrequency: 'weekly', priority: 0.6 },
    { path: '/developers', changeFrequency: 'daily', priority: 0.8 },
    { path: '/services', changeFrequency: 'weekly', priority: 0.8 },
  ]

  for (const a of AGENT_PROFILES) {
    entries.push({ path: `/agents/${a.slug}`, changeFrequency: 'monthly', priority: 0.55, locale: 'ka' })
  }
  // Public agency profiles (DB) — fall back to hub-only on build-time DB outage.
  try {
    const agencyRows = await db.agencyProfile.findMany({
      where: { deletedAt: null },
      select: { slug: true },
    })
    for (const a of agencyRows) {
      entries.push({ path: `/agencies/${a.slug}`, changeFrequency: 'weekly', priority: 0.55, locale: 'ka' })
    }
  } catch { /* build-time DB outage */ }
  for (const c of SERVICE_CATEGORIES) {
    entries.push({ path: `/services/${c.id}`, changeFrequency: 'weekly', priority: 0.7 })
  }
  for (const p of SERVICE_PROVIDERS) {
    entries.push({ path: `/services/${p.category}/${p.slug}`, changeFrequency: 'monthly', priority: 0.55 })
  }
  // Live directory (korter + curated) — fall back to static if DB is down.
  let sitemapDevs = DEVELOPERS
  let sitemapProjects = PROJECTS
  try {
    const [liveDevs, liveProjects] = await Promise.all([developersLive(), projectsLive()])
    if (liveDevs.length > 0) sitemapDevs = liveDevs
    if (liveProjects.length > 0) sitemapProjects = liveProjects
  } catch { /* build-time DB outage */ }
  for (const d of sitemapDevs) {
    entries.push({ path: `/developers/${d.slug}`, changeFrequency: 'weekly', priority: 0.7 })
  }
  for (const p of sitemapProjects) {
    entries.push({ path: `/projects/${p.slug}`, changeFrequency: 'weekly', priority: 0.8 })
  }
  for (const d of PROJECT_DISTRICTS) {
    entries.push({ path: `/projects/tbilisi/${d.slug}`, changeFrequency: 'weekly', priority: 0.75 })
  }

  // DB-published posts first (static seed included by the lib as fallback).
  for (const p of await listBlogPosts()) {
    entries.push({
      path: `/blog/${p.slug}`,
      lastModified: new Date(`${p.updatedAt ?? p.publishedAt}T00:00:00`),
      changeFrequency: 'monthly',
      priority: 0.6,
      locale: 'ka',
    })
  }

  // Live threads (DB + seed merged) — UGC pages need a discovery path.
  for (const t of await listForumThreads()) {
    entries.push({
      path: `/forum/${t.slug}`,
      lastModified: new Date(`${t.lastActivityAt}T00:00:00`),
      changeFrequency: 'weekly',
      priority: 0.55,
      locale: 'ka',
    })
  }

  // Public seller profiles with at least one live listing.
  try {
    const owners = await db.listing.findMany({
      where: { status: ListingStatus.active, deletedAt: null, ownerId: { not: null } },
      select: { ownerId: true },
      distinct: ['ownerId'],
      take: 2000,
    })
    for (const o of owners) {
      entries.push({ path: `/u/${o.ownerId}`, changeFrequency: 'weekly', priority: 0.5 })
    }
  } catch { /* build-time DB outage */ }

  for (const n of NEIGHBORHOODS) {
    entries.push({
      path: `/neighborhoods/${n.slug}`,
      changeFrequency: 'monthly',
      priority: 0.6,
      locale: 'ka',
    })
  }

  for (const b of BUILDINGS) {
    entries.push({
      path: `/buildings/${b.slug}`,
      changeFrequency: 'daily',
      priority: 0.7,
    })
  }

  for (const slug of generateAllSeoParams()) {
    entries.push({
      path: `/${slug.join('/')}`,
      changeFrequency: 'daily',
      priority: Math.max(0.5, 0.9 - slug.length * 0.1),
      locale: 'hub',
    })
  }

  // Street-level SEO: directory + ka-only street pages (no /en /ru twins).
  entries.push({ path: '/tbilisi/kuchebi', changeFrequency: 'weekly', priority: 0.7, locale: 'ka' })
  for (const s of STREETS) {
    if (!s.district) continue
    entries.push({
      path: `/tbilisi/${s.district}/${s.slug}`,
      changeFrequency: 'weekly',
      priority: 0.6,
      locale: 'ka',
    })
  }

  // Metro-level SEO: all-stations hub + 22 ka-only station pages.
  entries.push({ path: '/metro', changeFrequency: 'weekly', priority: 0.7, locale: 'ka' })
  entries.push({ path: '/locations', changeFrequency: 'weekly', priority: 0.7, locale: 'ka' })
  for (const m of METRO_STATIONS) {
    entries.push({
      path: `/metro/${m.slug}`,
      changeFrequency: 'weekly',
      priority: 0.6,
      locale: 'ka',
    })
  }

  for (const l of listings) {
    const poster = absMedia(l.img)
    const video = listingVideoObject(l.video, {
      name: l.title,
      description: l.description ?? "",
      poster,
      uploadDate: `${l.postedAt}T00:00:00Z`,
    })
    entries.push({
      path: listingPath(l),
      lastModified: new Date(`${l.postedAt}T00:00:00`),
      changeFrequency: 'daily',
      priority: l.video ? 0.8 : 0.7,
      images: (l.images.length ? l.images : [l.img]).slice(0, 8).map(absMedia),
      ...(video && {
        videos: [{
          title: video.name,
          thumbnail_loc: video.thumbnailUrl,
          description: video.description,
          ...(video.contentUrl ? { content_loc: video.contentUrl } : {}),
          ...(video.embedUrl ? { player_loc: video.embedUrl } : {}),
          publication_date: l.postedAt,
          family_friendly: 'yes' as const,
        }],
      }),
    })
  }

  return entries.map(toSitemapEntry)
}

function countrySitemap(): MetadataRoute.Sitemap {
  const out: MetadataRoute.Sitemap = [
    {
      url: `${COM_ORIGIN}/`,
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: {
        languages: {
          en: `${COM_ORIGIN}/`,
          'x-default': `${COM_ORIGIN}/`,
        },
      },
    },
  ]
  for (const cc of COUNTRY_IDS) {
    for (const path of countrySitemapPaths(cc)) {
      const url = `${COM_ORIGIN}${path}`
      const languages: Record<string, string> = { en: url, 'x-default': url }
      if (cc === 'ae') languages.ar = `${COM_ORIGIN}/ar${path}`
      // German DE variant exists for the hub + Berlin (reciprocal hreflang).
      if (cc === 'de' && (path === '/de' || path.startsWith('/de/berlin'))) {
        languages.de = `${COM_ORIGIN}/de${path}`
      }
      out.push({ url, changeFrequency: 'weekly', priority: path.split('/').length <= 2 ? 0.85 : 0.7, alternates: { languages } })
    }
  }
  // DE flagship content: hand-curated project detail pages under /de/projects.
  for (const p of PROJECTS) {
    if (DE_CITIES.some((c) => c.ka === p.city)) {
      out.push({ url: `${COM_ORIGIN}/de/projects/${p.slug}`, changeFrequency: 'weekly', priority: 0.7 })
    }
  }
  // Berlin Bezirk pages (12) — derived from the catalog, German variant included.
  for (const b of BERLIN_BEZIRKE) {
    const url = `${COM_ORIGIN}/de/berlin/${b.slug}`
    out.push({
      url,
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: { languages: { en: url, 'x-default': url, de: `${COM_ORIGIN}/de/de/berlin/${b.slug}` } },
    })
  }
  return out
}
