import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { COM_ORIGIN, GE_ORIGIN } from '@/lib/markets'
import { hostKind, publicOriginKind } from '@/lib/site-host'

const DISALLOW = [
  '/api/',
  '/admin',
  '/account',
  '/settings',
  '/dashboard',
  '/seller',
  '/agent/',
  '/agency/',
  '/developer/',
  '/auth',
  '/add-listing',
  '/add-service',
  '/favorites',
  '/compare',
]

export default async function robots(): Promise<MetadataRoute.Robots> {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    return { rules: { userAgent: '*', disallow: '/' } }
  }
  const h = await headers()
  const raw = h.get('x-forwarded-host') || h.get('host') || ''
  const kind = hostKind(raw, process.env.VERCEL_ENV)
  const origin = publicOriginKind(kind) === 'com' ? COM_ORIGIN : GE_ORIGIN
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOW,
      },
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'OAI-SearchBot',
          'ClaudeBot',
          'Anthropic-AI',
          'PerplexityBot',
          'Google-Extended',
          'Google-CloudVertexBot',
          'Applebot',
          'Applebot-Extended',
          'Amazonbot',
          'YouBot',
          'DuckAssistBot',
          'Bytespider',
          'cohere-ai',
          'Grok',
          'CCBot',
          'meta-externalagent',
          'MistralAI-User',
          'TikTokSpider',
          'DeepSeekBot',
          'Qwenbot',
          'Kimi',
          'AI2Bot',
        ],
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: DISALLOW,
      },
    ],
    sitemap: [`${GE_ORIGIN}/sitemap/ge.xml`, `${COM_ORIGIN}/sitemap/com.xml`],
    host: origin,
  }
}
