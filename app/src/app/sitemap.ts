import type { MetadataRoute } from 'next'
import { LISTINGS } from '@/data/listings'
import { generateAllSeoParams } from '@/lib/seo-pages'
import { BLOG_POSTS } from '@/data/blog'
import { NEIGHBORHOODS } from '@/data/neighborhoods'

const BASE = 'https://sivrce.ge'

// Static pages: one lastmod per deploy, not per request
const DEPLOY_DATE = new Date('2026-07-17')

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: DEPLOY_DATE, changeFrequency: 'hourly', priority: 1 },
    { url: `${BASE}/blog`, lastModified: DEPLOY_DATE, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/neighborhoods`, lastModified: DEPLOY_DATE, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/projects`, lastModified: DEPLOY_DATE, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/advertise`, lastModified: DEPLOY_DATE, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/about`, lastModified: DEPLOY_DATE, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/contact`, lastModified: DEPLOY_DATE, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/faq`, lastModified: DEPLOY_DATE, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/terms`, lastModified: DEPLOY_DATE, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/privacy`, lastModified: DEPLOY_DATE, changeFrequency: 'yearly', priority: 0.2 },
  ]

  const blogPages: MetadataRoute.Sitemap = BLOG_POSTS.map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: new Date(`${p.updatedAt ?? p.publishedAt}T00:00:00`),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  const neighborhoodPages: MetadataRoute.Sitemap = NEIGHBORHOODS.map((n) => ({
    url: `${BASE}/neighborhoods/${n.slug}`,
    lastModified: DEPLOY_DATE,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  // Programmatic SEO pages: shallower = higher priority
  const seoPages: MetadataRoute.Sitemap = generateAllSeoParams().map((slug) => ({
    url: `${BASE}/${slug.join('/')}`,
    lastModified: DEPLOY_DATE,
    changeFrequency: 'daily',
    priority: Math.max(0.5, 0.9 - slug.length * 0.1),
  }))

  const listingPages: MetadataRoute.Sitemap = LISTINGS.map((l) => ({
    url: `${BASE}/listing/${l.id}`,
    lastModified: new Date(`${l.postedAt}T00:00:00`),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...blogPages, ...neighborhoodPages, ...seoPages, ...listingPages]
}
