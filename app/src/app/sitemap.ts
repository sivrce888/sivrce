import type { MetadataRoute } from 'next'
import { LISTINGS } from '@/data/listings'
import { BUILDINGS } from '@/data/buildings'
import { generateAllSeoParams } from '@/lib/seo-pages'
import { BLOG_POSTS } from '@/data/blog'
import { NEIGHBORHOODS } from '@/data/neighborhoods'

const BASE = 'https://sivrce.ge'

// Static pages: one lastmod per deploy, not per request
const DEPLOY_DATE = new Date('2026-07-17')

// hreflang cluster for every URL: ka is unprefixed (canonical), others get a
// locale prefix served by middleware rewrites (see src/middleware.ts).
const PREFIXED = ['en', 'ru', 'he', 'ar', 'tr', 'uk', 'hy', 'az'] as const

type Entry = {
  path: string
  lastModified: Date
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>
  priority: number
}

function withHreflang({ path, lastModified, changeFrequency, priority }: Entry): MetadataRoute.Sitemap[number] {
  const languages: Record<string, string> = { ka: `${BASE}${path}` }
  for (const l of PREFIXED) languages[l] = `${BASE}/${l}${path}`
  languages['x-default'] = `${BASE}${path}`
  return { url: `${BASE}${path}`, lastModified, changeFrequency, priority, alternates: { languages } }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: Entry[] = [
    { path: '', lastModified: DEPLOY_DATE, changeFrequency: 'hourly', priority: 1 },
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

  for (const l of LISTINGS) {
    entries.push({
      path: `/listing/${l.id}`,
      lastModified: new Date(`${l.postedAt}T00:00:00`),
      changeFrequency: 'daily',
      priority: 0.7,
    })
  }

  return entries.map(withHreflang)
}
