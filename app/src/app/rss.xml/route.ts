import { listBlogPosts } from '@/lib/blog-live'
import { COM_ORIGIN, GE_ORIGIN } from '@/lib/markets'
import { hostKind, publicOriginKind } from '@/lib/site-host'

export const revalidate = 86400

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

export async function GET(req: Request) {
  // Host split like llms.txt: each origin advertises its own blog URLs.
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || ''
  const onCom = publicOriginKind(hostKind(host, process.env.VERCEL_ENV)) === 'com'
  const blogUrl = `${onCom ? COM_ORIGIN : GE_ORIGIN}/blog`
  const posts = await listBlogPosts()
  const items = posts.map((p) => {
    const url = `${blogUrl}/${p.slug}`
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
    <link>${blogUrl}</link>
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
