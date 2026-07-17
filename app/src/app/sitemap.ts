import type { MetadataRoute } from 'next'
import { LISTINGS, type Listing } from '@/data/listings'
import { getAllListings } from '@/lib/listings-db'
import { BUILDINGS } from '@/data/buildings'
import { generateAllSeoParams } from '@/lib/seo-pages'
import { BLOG_POSTS } from '@/data/blog'
import { NEIGHBORHOODS } from '@/data/neighborhoods'

const BASE = 'https://sivrce.ge'

// Regenerate with fresh DB inventory hourly.
export const revalidate = 3600

// Static pages: one lastmod per deploy, not per request
const DEPLOY_DATE = new Date('2026-07-17')

// hreflang cluster for pages with real SSR locales: ka is unprefixed (canonical),
// en/ru get a prefix. Other locales are client-i18n only — not declared (Google
// ignores hreflang to pages that serve the same ka content anyway).
const PREFIXED = ['en', 'ru'] as const

type Entry = {
  path: string
  lastModified: Date
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>
  priority: number
  /** True when /en + /ru SSR twins exist (home, programmatic SEO pages). */
  localized?: boolean
}

function toSitemapEntry({ path, lastModified, changeFrequency, priority, localized }: Entry): MetadataRoute.Sitemap[number] {
  if (!localized) return { url: `${BASE}${path}`, lastModified, changeFrequency, priority }
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
    { path: '/projects', lastModified: DEPLOY_DATE, changeFrequency: 'daily', priority: 0.8 },
    { path: '/advertise', lastModified: DEPLOY_DATE, changeFrequency: 'monthly', priority: 0.6 },
    { path: '/about', lastModified: DEPLOY_DATE, changeFrequency: 'monthly', priority: 0.5 },
    { path: '/contact', lastModified: DEPLOY_DATE, changeFrequency: 'monthly', priority: 0.5 },
    { path: '/faq', lastModified: DEPLOY_DATE, changeFrequency: 'monthly', priority: 0.5 },
    { path: '/terms', lastModified: DEPLOY_DATE, changeFrequency: 'yearly', priority: 0.2 },
    { path: '/privacy', lastModified: DEPLOY_DATE, changeFrequency: 'yearly', priority: 0.2 },
  ]

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

  return entries.map(withHreflang)
}
