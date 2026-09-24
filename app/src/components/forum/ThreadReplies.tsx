'use client'

import { useState } from 'react'
import { BadgeCheck, ThumbsUp, MessageSquare } from 'lucide-react'
import type { ForumReply } from '@/data/forum'
import { ReplyForm } from '@/components/forum/ReplyForm'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { panelLang } from '@/lib/i18n/core'

const L = {
  ka: {
    verified: 'ვერიფიცირებული',
    helpful: 'სასარგებლო',
    reply: 'პასუხი',
    empty: 'ჯერ პასუხები არ არის — გახდი პირველი ვისაც უპასუხებს',
    locale: 'ka-GE',
  },
  en: {
    verified: 'Verified',
    helpful: 'Helpful',
    reply: 'Reply',
    empty: 'No replies yet — be the first to answer',
    locale: 'en-GB',
  },
  de: {
    verified: 'Verifiziert',
    helpful: 'Hilfreich',
    reply: 'Antworten',
    empty: 'Noch keine Antworten — schreiben Sie die erste',
    locale: 'de-DE',
  },
} as const

function ReplyCard({
  reply,
  nested,
  onReply,
  s,
}: {
  reply: ForumReply
  nested?: boolean
  onReply?: (id: string) => void
  s: (typeof L)[keyof typeof L]
}) {
  const live = reply.helpfulCount != null
  const [count, setCount] = useState(reply.helpfulCount ?? 0)
  const [voting, setVoting] = useState(false)

  async function vote() {
    if (voting || !live) return
    setVoting(true)
    try {
      const res = await fetch(`/api/forum/replies/${reply.id}/helpful`, { method: 'POST' })
      const data = (await res.json().catch(() => null)) as { helpfulCount?: number } | null
      if (res.ok && typeof data?.helpfulCount === 'number') setCount(data.helpfulCount)
    } finally {
      setVoting(false)
    }
  }

  return (
    <li
      className={cn(
        'rounded-module border border-sv-ink/[0.06] bg-sv-surface p-5',
        nested && 'ms-4 border-sv-blue/15 bg-sv-cloud/40 sm:ms-8',
      )}
    >
      <div className="flex flex-wrap items-center gap-2 text-[13px] font-bold text-sv-ink/60">
        <span className="text-sv-ink">{reply.authorName}</span>
        {reply.verified && (
          <span className="inline-flex items-center gap-1 text-sv-blue">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> {s.verified}
          </span>
        )}
        {/* suppressHydrationWarning: Node SSR vs browser ICU disagree on ka month names */}
        <span className="text-sv-ink/35" suppressHydrationWarning>
          {new Date(reply.createdAt).toLocaleDateString(s.locale, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </div>
      <p className="mt-3 text-[15px] font-medium leading-relaxed text-sv-ink/75">{reply.body}</p>
      {live && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={vote}
            disabled={voting}
            className="inline-flex items-center gap-1.5 rounded-full border border-sv-ink/10 px-3 py-1.5 text-[12px] font-bold text-sv-ink/60 transition hover:border-sv-blue/30 hover:text-sv-blue disabled:opacity-60"
            aria-label={s.helpful}
          >
            <ThumbsUp className="h-3.5 w-3.5" aria-hidden />
            {count > 0 ? count : s.helpful}
          </button>
          {!nested && onReply && (
            <button
              type="button"
              onClick={() => onReply(reply.id)}
              className="inline-flex items-center gap-1.5 text-[12px] font-bold text-sv-blue"
            >
              <MessageSquare className="h-3.5 w-3.5" aria-hidden />
              {s.reply}
            </button>
          )}
        </div>
      )}
    </li>
  )
}

export function ThreadReplies({ slug, replies }: { slug: string; replies: ForumReply[] }) {
  const { lang } = useI18n()
  const s = L[panelLang(lang)]
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const tops = replies.filter((r) => !r.parentId)
  const kids = (parentId: string) => replies.filter((r) => r.parentId === parentId)

  return (
    <div className="mt-5 space-y-4">
      <ul className="space-y-4">
        {tops.length === 0 && (
          <li className="rounded-tile border border-dashed border-sv-ink/15 px-6 py-8 text-center text-[14px] font-semibold text-sv-ink/60">
            {s.empty}
          </li>
        )}
        {tops.map((r) => (
          <li key={r.id} className="space-y-3">
            <ul className="space-y-3">
              <ReplyCard reply={r} s={s} onReply={r.helpfulCount != null ? setReplyTo : undefined} />
              {kids(r.id).map((c) => (
                <ReplyCard key={c.id} reply={c} s={s} nested />
              ))}
            </ul>
            {replyTo === r.id && (
              <ReplyForm
                slug={slug}
                parentId={r.id}
                compact
                onCancel={() => setReplyTo(null)}
              />
            )}
          </li>
        ))}
      </ul>
      <ReplyForm slug={slug} />
    </div>
  )
}
