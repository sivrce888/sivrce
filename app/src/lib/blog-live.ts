/**
 * Live blog: Prisma posts (admin CMS) merged with the editorial seed.
 * ponytail: seed stays the read-path for build-time/outage resilience; a
 * published DB post always wins its slug. Full headless CMS when the admin
 * corpus outgrows the seed catalog.
 */
import { BlogPostStatus } from "@/generated/prisma/enums"
import { BLOG_POSTS, dbPostToBlogPost, getPost, type BlogPost } from "@/data/blog"
import { db, dbAvailable } from "@/lib/db"

const POST_SELECT = { author: { select: { name: true } } } as const

export async function listBlogPosts(): Promise<BlogPost[]> {
  const bySlug = new Map<string, BlogPost>()
  for (const p of BLOG_POSTS) bySlug.set(p.slug, p)

  if (await dbAvailable()) {
    try {
      const rows = await db.blogPost.findMany({
        where: { status: BlogPostStatus.published },
        orderBy: { publishedAt: "desc" },
        take: 200,
        include: POST_SELECT,
      })
      for (const row of rows) bySlug.set(row.slug, dbPostToBlogPost(row, row.author?.name ?? null))
    } catch {
      // seed-only fallback
    }
  }

  return [...bySlug.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  if (await dbAvailable()) {
    try {
      const row = await db.blogPost.findFirst({
        where: { slug, status: BlogPostStatus.published },
        include: POST_SELECT,
      })
      if (row) {
        // Fire-and-forget view bump — ignore failures.
        void db.blogPost
          .update({ where: { id: row.id }, data: { viewCount: { increment: 1 } } })
          .catch(() => undefined)
        return dbPostToBlogPost(row, row.author?.name ?? null)
      }
    } catch {
      // seed fallback
    }
  }
  return getPost(slug) ?? null
}
