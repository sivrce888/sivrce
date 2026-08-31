import type { MetadataRoute } from 'next'

const DISALLOW = [
  '/api/',
  '/admin',
  '/account',
  '/settings',
  '/dashboard',
  '/seller',
  '/agent',
  '/agency',
  '/developer/',
  '/auth',
  '/add-listing',
  '/add-service',
  '/favorites',
  '/compare',
]

export default function robots(): MetadataRoute.Robots {
  return {
    // Named AI crawlers honor their own UA; mirror * so they keep /llms.txt.
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
        ],
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: DISALLOW,
      },
    ],
    sitemap: 'https://sivrce.ge/sitemap.xml',
    host: 'https://sivrce.ge',
  }
}
