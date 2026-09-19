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
import { requestOrigin } from '@/lib/request-market'
import {kaOnlyAlternates,  } from '@/lib/i18n/server'
import { isValidLang, type Lang } from '@/lib/i18n/core'

export const revalidate = 60

interface PageProps {
  params: Promise<{ lang: string; slug: string }>
}

// Thread chrome (thread bodies are user-generated; crumbs/stats localize).
const L = {
  ka: {
    crumbAria: 'ბრედკრამბი',
    crumbHome: 'მთავარი',
    crumbForum: 'ფორუმი',
    replies: (n: number) => `${n} პასუხი`,
    views: (n: string) => `${n} ნახვა`,
    verified: 'ვერიფიცირებული',
    repliesHeading: (n: number) => `პასუხები (${n})`,
    related: 'მსგავსი თემები',
    allThreads: 'ყველა თემა',
    metaSuffix: 'sivrce ფორუმი',
    locale: 'ka-GE',
  },
  en: {
    crumbAria: 'Breadcrumb',
    crumbHome: 'Home',
    crumbForum: 'Forum',
    replies: (n: number) => `${n} ${n === 1 ? 'reply' : 'replies'}`,
    views: (n: string) => `${n} ${n === '1' ? 'view' : 'views'}`,
    verified: 'Verified',
    repliesHeading: (n: number) => `Replies (${n})`,
    related: 'Related topics',
    allThreads: 'All topics',
    metaSuffix: 'sivrce forum',
    locale: 'en-GB',
  },
  de: {
    crumbAria: 'Brotkrumennavigation',
    crumbHome: 'Start',
    crumbForum: 'Forum',
    replies: (n: number) => `${n} ${n === 1 ? 'Antwort' : 'Antworten'}`,
    views: (n: string) => `${n} Aufrufe`,
    verified: 'Verifiziert',
    repliesHeading: (n: number) => `Antworten (${n})`,
    related: 'Ähnliche Themen',
    allThreads: 'Alle Themen',
    metaSuffix: 'sivrce Forum',
    locale: 'de-DE',
  },
} as const

function forumThreadStrings(lang: Lang): (typeof L)[keyof typeof L] {
  return L[lang === 'en' ? 'en' : lang === 'de' ? 'de' : 'ka']
}

export function generateStaticParams() {
  return FORUM_THREADS.map((t) => ({ lang: 'ka', slug: t.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const origin = await requestOrigin()
  const { lang: raw, slug } = await params
  const lang: Lang = isValidLang(raw) ? raw : 'ka'
  const t = forumThreadStrings(lang)
  const thread = await getForumThread(slug)
  if (!thread) return {}
  return {
    title: `${thread.title} | ${t.metaSuffix}`,
    description: thread.excerpt,
    alternates: kaOnlyAlternates(`/forum/${thread.slug}`),
    openGraph: {
      title: thread.title,
      description: thread.excerpt,
      type: 'article',
      url: `${origin}/forum/${thread.slug}`,
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
  const origin = await requestOrigin()
  const { lang: raw, slug } = await params
  const lang: Lang = isValidLang(raw) ? raw : 'ka'
  const t = forumThreadStrings(lang)
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
    url: `${origin}/forum/${thread.slug}`,
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
      <main id="main" className="sv-pt-nav mx-auto max-w-[860px] px-5 pb-20 md:px-10">
        <nav aria-label={t.crumbAria} className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-sv-ink/60">
            <li className="flex items-center gap-1.5">
              <LocalizedLink href="/" className="transition-colors hover:text-sv-blue">{t.crumbHome}</LocalizedLink>
              <ChevronRight className="h-3.5 w-3.5 text-sv-ink/30" aria-hidden />
            </li>
            <li className="flex items-center gap-1.5">
              <LocalizedLink href="/forum" className="transition-colors hover:text-sv-blue">{t.crumbForum}</LocalizedLink>
              <ChevronRight className="h-3.5 w-3.5 text-sv-ink/30" aria-hidden />
            </li>
            <li aria-current="page" className="line-clamp-1 text-sv-ink/80">{thread.title}</li>
          </ol>
        </nav>

        <article>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-sv-blue/10 px-3 py-1 text-[11px] font-black text-sv-blue-deep">
              {thread.category}
            </span>
            <span className="text-[12px] font-semibold text-sv-ink/60">{thread.district}</span>
            {thread.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-sv-ink/[0.04] px-2.5 py-0.5 text-[11px] font-bold text-sv-ink/60">
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-balance text-[26px] font-black tracking-[-0.02em] text-sv-ink md:text-[34px]">
            {thread.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-[13px] font-bold text-sv-ink/60">
            <span>{thread.authorName}</span>
            <span>
              {new Date(thread.createdAt).toLocaleDateString(t.locale, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden /> {t.replies(replyCount)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" aria-hidden /> {t.views(thread.viewsLabel)}
            </span>
            {verified > 0 && (
              <span className="inline-flex items-center gap-1 text-sv-blue">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> {verified} {t.verified}
              </span>
            )}
          </div>

          <div className="mt-8 rounded-tile border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card md:p-8">
            {renderBody(thread.body)}
          </div>
        </article>

        <section className="mt-12" aria-labelledby="replies-heading">
          <h2 id="replies-heading" className="text-[20px] font-black tracking-[-0.01em] text-sv-ink">
            {t.repliesHeading(replyCount)}
          </h2>
          <ThreadReplies slug={thread.slug} replies={thread.replies} />
        </section>

        {related.length > 0 && (
          <section className="mt-14" aria-labelledby="related-heading">
            <h2 id="related-heading" className="text-[18px] font-black text-sv-ink">
              {t.related}
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
          <ArrowLeft className="h-4 w-4" aria-hidden /> {t.allThreads}
        </LocalizedLink>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(threadLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: t.crumbHome, item: origin },
              { '@type': 'ListItem', position: 2, name: t.crumbForum, item: `${origin}/forum` },
              { '@type': 'ListItem', position: 3, name: thread.title, item: `${origin}/forum/${thread.slug}` },
            ],
          }),
        }}
      />
    </div>
  )
}
