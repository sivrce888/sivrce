import type { MetadataRoute } from 'next'
import { COM_ORIGIN, GE_ORIGIN } from '@/lib/markets'

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

export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    return { rules: { userAgent: '*', disallow: '/' } }
  }
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
    sitemap: [`${GE_ORIGIN}/sitemap.xml`, `${COM_ORIGIN}/sitemap.xml`],
    host: GE_ORIGIN,
  }
}
