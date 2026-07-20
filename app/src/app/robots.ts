import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // ponytail: plural = public index (/agents, /developers, /projects);
      // singular = private dashboard (/agent, /agency, /developer). Keep the
      // distinction exact — crawling dashboards wastes budget + risks thin
      // content flags on auth-gated shells.
      disallow: [
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
        '/favorites',
        '/compare',
      ],
    },
    sitemap: 'https://sivrce.ge/sitemap.xml',
  }
}
