import type { Metadata } from 'next'
import LocalizedLink from '@/components/LocalizedLink'
import { notFound } from 'next/navigation'
import { ChevronRight, MessageSquare, Eye, BadgeCheck, ArrowLeft } from 'lucide-react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { ThreadReplies } from '@/components/forum/ThreadReplies'
import { FORUM_THREADS } from '@/data/forum'
import { getForumThread, listForumThreads, relatedForumThreads } from '@/lib/forum-live'
import { jsonLd } from '@/lib/utils'
import { langAlternates } from '@/lib/i18n/server'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return FORUM_THREADS.map((t) => ({ lang: 'ka', slug: t.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const thread = await getForumThread(slug)
  if (!thread) return {}
  return {
    title: `${thread.title} | sivrce ფორუმი`,
    description: thread.excerpt,
    alternates: { canonical: `/forum/${thread.slug}`, languages: langAlternates(`/forum/${thread.slug}`) },
    openGraph: {
      title: thread.title,
      description: thread.excerpt,
      type: 'article',
      url: `https://sivrce.ge/forum/${thread.slug}`,
      siteName: 'sivrce',
      locale: 'ka_GE',
      publishedTime: `${thread.createdAt}T00:00:00+04:00`,
      modifiedTime: `${thread.lastActivityAt}T00:00:00+04:00`,
    },
  }
}

function renderBody(body: string) {
  const blocks = body.trim().split(/\n\n+/)
  return blocks.map((b, i) => {
    const trimmed = b.trim()
    if (trimmed.startsWith('## ')) {
      return (
        <h2 key={i} className="mt-8 text-[20px] font-black tracking-[-0.01em] text-sv-ink">
          {trimmed.slice(3)}
        </h2>
      )
    }
    if (trimmed.startsWith('- ')) {
      const items = trimmed.split('\n').filter((l) => l.startsWith('- '))
      return (
        <ul key={i} className="mt-4 list-disc space-y-1.5 pl-5 text-[15px] font-medium leading-relaxed text-sv-ink/75">
          {items.map((item) => (
            <li key={item}>{item.slice(2)}</li>
          ))}
        </ul>
      )
    }
    return (
      <p key={i} className="mt-4 text-[16px] font-medium leading-[1.75] text-sv-ink/75">
        {trimmed}
      </p>
    )
  })
}

export default async function ForumThreadPage({ params }: PageProps) {
  const { slug } = await params
  const thread = await getForumThread(slug)
  if (!thread) notFound()

  const all = await listForumThreads()
  const related = relatedForumThreads(thread, all)
  const replyCount = thread.replies.length
  const verified = thread.replies.filter((r) => r.verified).length

  const threadLd = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: thread.title,
    text: thread.excerpt,
    datePublished: `${thread.createdAt}T00:00:00+04:00`,
    dateModified: `${thread.lastActivityAt}T00:00:00+04:00`,
    author: { '@type': 'Person', name: thread.authorName },
    url: `https://sivrce.ge/forum/${thread.slug}`,
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/CommentAction',
      userInteractionCount: replyCount,
    },
    comment: thread.replies.map((r) => ({
      '@type': 'Comment',
      text: r.body,
      datePublished: `${r.createdAt}T00:00:00+04:00`,
      author: { '@type': 'Person', name: r.authorName },
    })),
  }

  return (
    <div className="min-h-screen bg-sv-cloud">
      <Navbar />
      <main id="main" className="mx-auto max-w-[860px] px-5 pb-20 pt-24 md:px-10 md:pt-28">
        <nav aria-label="ბრედკრამბი" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-sv-ink/50">
            <li className="flex items-center gap-1.5">
              <LocalizedLink href="/" className="transition-colors hover:text-sv-blue">მთავარი</LocalizedLink>
              <ChevronRight className="h-3.5 w-3.5 text-sv-ink/30" aria-hidden />
            </li>
            <li className="flex items-center gap-1.5">
              <LocalizedLink href="/forum" className="transition-colors hover:text-sv-blue">ფორუმი</LocalizedLink>
              <ChevronRight className="h-3.5 w-3.5 text-sv-ink/30" aria-hidden />
            </li>
            <li aria-current="page" className="line-clamp-1 text-sv-ink/80">{thread.title}</li>
          </ol>
        </nav>

        <article>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-sv-blue/10 px-3 py-1 text-[11px] font-black text-sv-blue">
              {thread.category}
            </span>
            <span className="text-[12px] font-semibold text-sv-ink/45">{thread.district}</span>
            {thread.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-sv-ink/[0.04] px-2.5 py-0.5 text-[11px] font-bold text-sv-ink/50">
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-balance text-[26px] font-black tracking-[-0.02em] text-sv-ink md:text-[34px]">
            {thread.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-[13px] font-bold text-sv-ink/50">
            <span>{thread.authorName}</span>
            <span>
              {new Date(thread.createdAt).toLocaleDateString('ka-GE', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden /> {replyCount} პასუხი
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" aria-hidden /> {thread.viewsLabel} ნახვა
            </span>
            {verified > 0 && (
              <span className="inline-flex items-center gap-1 text-sv-blue">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> {verified} ვერიფიცირებული
              </span>
            )}
          </div>

          <div className="mt-8 rounded-tile border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-8">
            {renderBody(thread.body)}
          </div>
        </article>

        <section className="mt-12" aria-labelledby="replies-heading">
          <h2 id="replies-heading" className="text-[20px] font-black tracking-[-0.01em] text-sv-ink">
            პასუხები ({replyCount})
          </h2>
          <ThreadReplies slug={thread.slug} replies={thread.replies} />
        </section>

        {related.length > 0 && (
          <section className="mt-14" aria-labelledby="related-heading">
            <h2 id="related-heading" className="text-[18px] font-black text-sv-ink">
              მსგავსი თემები
            </h2>
            <ul className="mt-4 space-y-3">
              {related.map((t) => (
                <li key={t.slug}>
                  <LocalizedLink
                    href={`/forum/${t.slug}`}
                    className="block rounded-module border border-sv-ink/[0.06] bg-sv-surface px-4 py-3 text-[15px] font-extrabold text-sv-ink transition-colors hover:border-sv-blue/30 hover:text-sv-blue"
                  >
                    {t.title}
                  </LocalizedLink>
                </li>
              ))}
            </ul>
          </section>
        )}

        <LocalizedLink
          href="/forum"
          className="mt-12 inline-flex items-center gap-1.5 text-[14px] font-extrabold text-sv-blue"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> ყველა თემა
        </LocalizedLink>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(threadLd) }} />
    </div>
  )
}
