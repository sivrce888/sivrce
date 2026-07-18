import type { MetadataRoute } from 'next'
import { LISTINGS, type Listing } from '@/data/listings'
import { getAllListings } from '@/lib/listings-db'
import { BUILDINGS } from '@/data/buildings'
import { generateAllSeoParams } from '@/lib/seo-pages'
import { STREETS } from '@/data/tbilisi-streets'
import { BLOG_POSTS } from '@/data/blog'
import { NEIGHBORHOODS } from '@/data/neighborhoods'
import { DEVELOPERS, PROJECTS, AGENT_PROFILES } from '@/data/professionals'
import { developersLive, projectsLive } from '@/lib/directory-live'

const BASE = 'https://sivrce.ge'

// Regenerate with fresh DB inventory hourly.
export const revalidate = 3600

// Static pages: one lastmod per deploy, not per request
const DEPLOY_DATE = new Date('2026-07-17')

// hreflang cluster: every page is now server-rendered in all 9 locales via
// app/[lang]. ka is unprefixed (canonical); the other eight carry a prefix.
const PREFIXED = ['en', 'ru', 'he', 'ar', 'tr', 'uk', 'hy', 'az'] as const

type Entry = {
  path: string
  lastModified: Date
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>
  priority: number
  /** ponytail: alternates emitted for every entry — all pages have SSR locales now. */
  localized?: boolean
}

function toSitemapEntry({ path, lastModified, changeFrequency, priority }: Entry): MetadataRoute.Sitemap[number] {
  const languages: Record<string, string> = { ka: `${BASE}${path}` }
  for (const l of PREFIXED) languages[l] = `${BASE}/${l}${path}`
  languages['x-default'] = `${BASE}${path}`
  return { url: `${BASE}${path}`, lastModified, changeFrequency, priority, alternates: { languages } }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // DB-first listing URLs; static mock is the build-time/outage fallback.
  let listings: Listing[] = LISTINGS
  try {
    const rows = await getAllListings()
    if (rows.length > 0) listings = rows
  } catch { /* DB unavailable at build — keep static URLs */ }

  const entries: Entry[] = [
    { path: '', lastModified: DEPLOY_DATE, changeFrequency: 'hourly', priority: 1, localized: true },
    { path: '/search', lastModified: DEPLOY_DATE, changeFrequency: 'hourly', priority: 0.9 },
    { path: '/map', lastModified: DEPLOY_DATE, changeFrequency: 'hourly', priority: 0.95 },
    { path: '/buildings', lastModified: DEPLOY_DATE, changeFrequency: 'daily', priority: 0.9 },
    { path: '/blog', lastModified: DEPLOY_DATE, changeFrequency: 'weekly', priority: 0.7 },
    { path: '/neighborhoods', lastModified: DEPLOY_DATE, changeFrequency: 'monthly', priority: 0.7 },
    { path: '/projects', lastModified: DEPLOY_DATE, changeFrequency: 'daily', priority: 0.85 },
    { path: '/advertise', lastModified: DEPLOY_DATE, changeFrequency: 'monthly', priority: 0.6 },
    { path: '/about', lastModified: DEPLOY_DATE, changeFrequency: 'monthly', priority: 0.5 },
    { path: '/contact', lastModified: DEPLOY_DATE, changeFrequency: 'monthly', priority: 0.5 },
    { path: '/faq', lastModified: DEPLOY_DATE, changeFrequency: 'monthly', priority: 0.5 },
    { path: '/terms', lastModified: DEPLOY_DATE, changeFrequency: 'yearly', priority: 0.2 },
    { path: '/privacy', lastModified: DEPLOY_DATE, changeFrequency: 'yearly', priority: 0.2 },
    // ponytail: crawlable hubs + detail pages previously missing — sitemap
    // is the discovery path for ~140 indexed pages (agents, developers, projects).
    { path: '/mortgage-calculator', lastModified: DEPLOY_DATE, changeFrequency: 'monthly', priority: 0.7 },
    { path: '/agents', lastModified: DEPLOY_DATE, changeFrequency: 'weekly', priority: 0.6 },
    { path: '/developers', lastModified: DEPLOY_DATE, changeFrequency: 'daily', priority: 0.8 },
  ]

  for (const a of AGENT_PROFILES) {
    entries.push({ path: `/agents/${a.slug}`, lastModified: DEPLOY_DATE, changeFrequency: 'monthly', priority: 0.55 })
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
    entries.push({ path: `/developers/${d.slug}`, lastModified: DEPLOY_DATE, changeFrequency: 'weekly', priority: 0.7 })
  }
  for (const p of sitemapProjects) {
    entries.push({ path: `/projects/${p.slug}`, lastModified: DEPLOY_DATE, changeFrequency: 'weekly', priority: 0.8 })
  }

  for (const p of BLOG_POSTS) {
    entries.push({
      path: `/blog/${p.slug}`,
      lastModified: new Date(`${p.updatedAt ?? p.publishedAt}T00:00:00`),
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }

  for (const n of NEIGHBORHOODS) {
    entries.push({
      path: `/neighborhoods/${n.slug}`,
      lastModified: DEPLOY_DATE,
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }

  for (const b of BUILDINGS) {
    entries.push({
      path: `/buildings/${b.slug}`,
      lastModified: DEPLOY_DATE,
      changeFrequency: 'daily',
      priority: 0.85,
    })
  }

  for (const slug of generateAllSeoParams()) {
    entries.push({
      path: `/${slug.join('/')}`,
      lastModified: DEPLOY_DATE,
      changeFrequency: 'daily',
      priority: Math.max(0.5, 0.9 - slug.length * 0.1),
      localized: true,
    })
  }

  // Street-level SEO: directory + ka-only street pages (no /en /ru twins).
  entries.push({ path: '/tbilisi/kuchebi', lastModified: DEPLOY_DATE, changeFrequency: 'weekly', priority: 0.7 })
  for (const s of STREETS) {
    if (!s.district) continue
    entries.push({
      path: `/tbilisi/${s.district}/${s.slug}`,
      lastModified: DEPLOY_DATE,
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  }

  for (const l of listings) {
    entries.push({
      path: `/listing/${l.id}`,
      lastModified: new Date(`${l.postedAt}T00:00:00`),
      changeFrequency: 'daily',
      priority: 0.7,
    })
  }

  return entries.map(toSitemapEntry)
}
