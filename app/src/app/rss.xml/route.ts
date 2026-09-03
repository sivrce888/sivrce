import { BLOG_POSTS } from '@/data/blog'

export const revalidate = 86400

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

export function GET() {
  const items = BLOG_POSTS.map((p) => {
    const url = `https://sivrce.ge/blog/${p.slug}`
    const date = new Date(`${p.updatedAt ?? p.publishedAt}T00:00:00Z`).toUTCString()
    return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${date}</pubDate>
      <description>${esc(p.excerpt)}</description>
    </item>`
  }).join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>sivrce — უძრავი ქონების ბლოგი</title>
    <link>https://sivrce.ge/blog</link>
    <description>უძრავი ქონების გზამკვლევები — თბილისი, ბათუმი, საქართველო</description>
    <language>ka</language>
${items}
  </channel>
</rss>`
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  })
}
