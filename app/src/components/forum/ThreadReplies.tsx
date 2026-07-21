'use client'

import { useState } from 'react'
import { BadgeCheck, ThumbsUp, MessageSquare } from 'lucide-react'
import type { ForumReply } from '@/data/forum'
import { ReplyForm } from '@/components/forum/ReplyForm'
import { cn } from '@/lib/utils'

function ReplyCard({
  reply,
  nested,
  onReply,
}: {
  reply: ForumReply
  nested?: boolean
  onReply?: (id: string) => void
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
      <div className="flex flex-wrap items-center gap-2 text-[13px] font-bold text-sv-ink/55">
        <span className="text-sv-ink">{reply.authorName}</span>
        {reply.verified && (
          <span className="inline-flex items-center gap-1 text-sv-blue">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> ვერიფიცირებული
          </span>
        )}
        <span className="text-sv-ink/35">
          {new Date(reply.createdAt).toLocaleDateString('ka-GE', {
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
            aria-label="სასარგებლო"
          >
            <ThumbsUp className="h-3.5 w-3.5" aria-hidden />
            {count > 0 ? count : 'სასარგებლო'}
          </button>
          {!nested && onReply && (
            <button
              type="button"
              onClick={() => onReply(reply.id)}
              className="inline-flex items-center gap-1.5 text-[12px] font-bold text-sv-blue"
            >
              <MessageSquare className="h-3.5 w-3.5" aria-hidden />
              პასუხი
            </button>
          )}
        </div>
      )}
    </li>
  )
}

export function ThreadReplies({ slug, replies }: { slug: string; replies: ForumReply[] }) {
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const tops = replies.filter((r) => !r.parentId)
  const kids = (parentId: string) => replies.filter((r) => r.parentId === parentId)

  return (
    <div className="mt-5 space-y-4">
      <ul className="space-y-4">
        {tops.map((r) => (
          <li key={r.id} className="space-y-3">
            <ul className="space-y-3">
              <ReplyCard reply={r} onReply={r.helpfulCount != null ? setReplyTo : undefined} />
              {kids(r.id).map((c) => (
                <ReplyCard key={c.id} reply={c} nested />
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
