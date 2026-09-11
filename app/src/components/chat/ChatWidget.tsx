"use client"

import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type UIEvent,
} from "react"
import {
  ArrowDown,
  Check,
  CheckCheck,
  ChevronLeft,
  Copy,
  ExternalLink,
  Flag,
  HelpCircle,
  LifeBuoy,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  RotateCcw,
  Search,
  Send,
  X,
} from "lucide-react"
import UserAvatar from "@/components/UserAvatar"
import { usePathname, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useI18n } from "@/lib/i18n/context"
import { useChat, type ChatRoom } from "./ChatProvider"
import FaqView from "./FaqView"
import {
  clockLabel,
  clearChatDraft,
  dayKey,
  dayLabel,
  mergeMessages,
  peekChatDraft,
  sameGroup,
  splitLinks,
  timeAgo,
  type ChatMessage,
} from "./messages"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function previewText(text: string, max = 42): string {
  return text.length > max ? text.slice(0, max - 1) + "…" : text
}

type TFunc = ReturnType<typeof useI18n>["t"]

/** Room-list relative time, mapped onto the chat.time* dict keys. */
function agoLabel(iso: string, t: TFunc): string {
  const { n, unit } = timeAgo(iso)
  if (unit === "now") return t("chat.timeNow")
  const key = unit === "min" ? "chat.timeMin" : unit === "hour" ? "chat.timeHour" : "chat.timeDay"
  return `${n} ${t(key)}`
}

const CHAT_MAX = 2000

/** Local view-model: adds the one-shot entrance flag to API messages. */
type UIMessage = ChatMessage & { anim?: boolean }

// ---------------------------------------------------------------------------
// Room list
// ---------------------------------------------------------------------------

function RoomListItem({
  room,
  active,
  unreadCount,
  onClick,
}: {
  room: ChatRoom
  active: boolean
  unreadCount: number
  onClick: () => void
}) {
  const { t } = useI18n()
  const name = room.isSupport
    ? t("chat.supportName")
    : room.counterpart?.name || room.listing?.title || room.title
  const lastMsg = room.lastMessage
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-module px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue ${
        active
          ? "bg-sv-blue/10 ring-1 ring-inset ring-sv-blue/20"
          : "hover:bg-sv-ink/[0.04]"
      }`}
    >
      {room.isSupport ? (
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sv-blue/10 text-sv-blue-deep">
          <LifeBuoy className="h-4.5 w-4.5" aria-hidden />
        </span>
      ) : (
        <UserAvatar
          name={room.counterpart?.name}
          image={room.counterpart?.image}
          gradient={room.counterpart?.avatarStyle}
          color={room.counterpart?.avatarColor}
          icon={room.counterpart?.avatarIcon}
          size={40}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[14px] font-extrabold text-sv-ink">{name}</span>
          {lastMsg && (
            <span className="shrink-0 text-[11px] font-bold text-sv-ink/60">
              {agoLabel(lastMsg.createdAt, t)}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className="truncate text-[13px] font-medium text-sv-ink/60">
            {lastMsg ? previewText(lastMsg.content) : "—"}
          </span>
          {unreadCount > 0 && (
            <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-sv-orange px-1.5 text-[10px] font-black text-sv-ink">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        {room.counterpart?.name && room.listing?.title && (
          <span className="mt-0.5 block truncate text-[11.5px] font-semibold text-sv-ink/35">
            {room.listing.title}
          </span>
        )}
      </div>
    </button>
  )
}

/** Pinned quick actions above the room list — help assistant + support line. */
function QuickTiles({
  showSupport,
  onFaq,
  onSupport,
}: {
  showSupport: boolean
  onFaq: () => void
  onSupport: () => void
}) {
  const { t } = useI18n()
  return (
    <div className={`grid gap-2 px-1 pb-2.5 ${showSupport ? "grid-cols-2" : "grid-cols-1"}`}>
      <button
        type="button"
        onClick={onFaq}
        className="flex items-center gap-2.5 rounded-control bg-sv-ink/[0.04] px-3 py-2.5 text-left transition-colors hover:bg-sv-ink/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sv-blue/10 text-sv-blue-deep">
          <HelpCircle className="h-4 w-4" aria-hidden />
        </span>
        <span className="truncate text-[13px] font-extrabold text-sv-ink">{t("chat.help")}</span>
      </button>
      {showSupport && (
        <button
          type="button"
          onClick={onSupport}
          className="flex items-center gap-2.5 rounded-control bg-sv-ink/[0.04] px-3 py-2.5 text-left transition-colors hover:bg-sv-ink/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sv-blue/10 text-sv-blue-deep">
            <LifeBuoy className="h-4 w-4" aria-hidden />
          </span>
          <span className="truncate text-[13px] font-extrabold text-sv-ink">
            {t("chat.contactSupport")}
          </span>
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Message thread
// ---------------------------------------------------------------------------

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-sv-ink/40 motion-safe:animate-bounce"
          style={{ animationDelay: `${i * 150 - 450}ms` }}
        />
      ))}
    </span>
  )
}

/** Memoized: a keystroke or typing heartbeat must not re-render the log. */
const MessageBubble = memo(function MessageBubble({
  msg,
  own,
  firstOfGroup,
  lastOfGroup,
  animate,
  peerRead,
  lang,
  onRetry,
  retryLabel,
  menu,
  reported,
  onCopy,
  onReport,
}: {
  msg: ChatMessage
  own: boolean
  firstOfGroup: boolean
  lastOfGroup: boolean
  animate: boolean
  peerRead: boolean
  lang: string
  onRetry?: (m: ChatMessage) => void
  retryLabel?: string
  /** Copy/report affordances — report only offered on peer messages. */
  menu: { copy: string; copied: string; report: string; reported: string; actions: string }
  reported: boolean
  onCopy: (m: ChatMessage) => void
  onReport: (m: ChatMessage) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const onMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") setMenuOpen(false)
  }
  const doCopy = () => {
    setMenuOpen(false)
    onCopy(msg)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }
  const doReport = () => {
    setMenuOpen(false)
    onReport(msg)
  }
  return (
    <div
      className={`group flex ${own ? "justify-end" : "justify-start"} ${firstOfGroup ? "mt-3" : "mt-0.5"}`}
    >
      <div
        className={`relative max-w-[82%] rounded-2xl px-3.5 py-2 text-[14px] font-medium leading-relaxed ${
          own ? "bg-sv-blue text-white" : "bg-sv-ink/[0.06] text-sv-ink"
        } ${own && lastOfGroup ? "rounded-br-md" : ""} ${!own && firstOfGroup ? "rounded-bl-md" : ""} ${
          msg.status === "failed" ? "ring-1 ring-sv-orange/60" : ""
        } ${msg.status === "pending" ? "opacity-70" : ""} ${animate ? "sv-chat-msg-in" : ""}`}
      >
        <p className="whitespace-pre-wrap break-words" dir="auto">
          {splitLinks(msg.content).map((seg, i) =>
            seg.href ? (
              <a
                key={i}
                href={seg.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`underline underline-offset-2 transition-colors ${
                  own
                    ? "decoration-white/50 hover:decoration-white"
                    : "decoration-sv-ink/40 hover:decoration-sv-ink/80"
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue`}
              >
                {seg.text}
              </a>
            ) : (
              seg.text
            ),
          )}
        </p>
        {lastOfGroup && (
          <div
            className={`mt-1 flex items-center justify-end gap-1 text-[10px] font-bold ${
              own ? "text-white/60" : "text-sv-ink/35"
            }`}
          >
            {msg.status === "failed" && (
              <button
                type="button"
                onClick={() => onRetry?.(msg)}
                title={retryLabel}
                className="mr-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-sv-orange transition-colors hover:bg-sv-orange/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-orange"
              >
                <RotateCcw className="h-3 w-3" aria-hidden />
                <span aria-hidden>{retryLabel}</span>
              </button>
            )}
            {clockLabel(msg.createdAt, lang)}
            {own && msg.status !== "failed" && (
              peerRead ? (
                <CheckCheck className="h-3.5 w-3.5 text-white/90" aria-hidden />
              ) : (
                <Check className="h-3.5 w-3.5" aria-hidden />
              )
            )}
            {/* ⋯ — copy always, report on peer messages; hover/focus reveal,
                tap-reveal on touch via menuOpen. */}
            {msg.status !== "pending" && (
              <span
                className={`relative ${menuOpen ? "" : "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"}`}
                onKeyDown={onMenuKeyDown}
              >
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label={menu.actions}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  className={`grid h-5 w-5 place-items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue ${
                    own ? "hover:bg-white/20" : "hover:bg-sv-ink/10"
                  }`}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" aria-hidden />
                </button>
                {menuOpen && (
                  <span
                    role="menu"
                    className={`absolute bottom-6 z-20 w-36 overflow-hidden rounded-control bg-sv-surface py-1 shadow-panel-dark ring-1 ring-sv-ink/10 ${
                      own ? "end-0" : "start-0"
                    }`}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={doCopy}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] font-bold text-sv-ink transition-colors hover:bg-sv-ink/[0.05] focus-visible:outline-none focus-visible:bg-sv-ink/[0.05]"
                    >
                      <Copy className="h-3.5 w-3.5" aria-hidden />
                      {copied ? menu.copied : menu.copy}
                    </button>
                    {!own && (
                      <button
                        type="button"
                        role="menuitem"
                        disabled={reported}
                        onClick={doReport}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] font-bold text-sv-ink transition-colors hover:bg-sv-ink/[0.05] focus-visible:outline-none focus-visible:bg-sv-ink/[0.05] disabled:opacity-50"
                      >
                        <Flag className="h-3.5 w-3.5" aria-hidden />
                        {reported ? menu.reported : menu.report}
                      </button>
                    )}
                  </span>
                )}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

/** Owns the draft + typing heartbeat, so every keystroke re-renders only
 * this bar — never the (memoized) message log above it. */
function Composer({
  roomId,
  listingId,
  initialValue = "",
  sendText,
}: {
  roomId: string
  listingId?: string | null
  initialValue?: string
  sendText: (text: string, clientId?: string) => Promise<void>
}) {
  const { t } = useI18n()
  const [input, setInput] = useState(initialValue)
  const typingSentAt = useRef(0)

  // Sends are fire-and-forget: the optimistic bubble carries pending/failed
  // state, so slow networks never freeze the composer.
  const flush = (text: string) => {
    setInput("")
    if (listingId) clearChatDraft(listingId)
    void sendText(text)
  }

  const onSend = (e: FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    flush(text)
  }

  const onInputKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      const text = input.trim()
      if (text) flush(text)
    }
  }

  const onInputChange = (value: string) => {
    setInput(value)
    // Typing heartbeat — at most one POST every 3 s while actively typing
    const now = Date.now()
    if (value && now - typingSentAt.current > 3000) {
      typingSentAt.current = now
      fetch(`/api/chat/${roomId}/typing`, { method: "POST", keepalive: true }).catch(() => {})
    }
  }

  return (
    <form
      onSubmit={onSend}
      className="flex items-end gap-2 border-t border-sv-ink/[0.08] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"
    >
      <textarea
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={onInputKeyDown}
        placeholder={t("chat.placeholder")}
        maxLength={CHAT_MAX}
        rows={1}
        enterKeyHint="send"
        autoCapitalize="sentences"
        autoComplete="off"
        aria-label={t("chat.placeholder")}
        className="max-h-28 min-w-0 flex-1 resize-none rounded-control border border-sv-ink/10 bg-sv-ink/[0.03] px-3.5 py-2.5 text-[14px] font-medium leading-snug text-sv-ink outline-none transition-colors [field-sizing:content] placeholder:text-sv-ink/35 focus:border-sv-blue/40 touch-manipulation"
      />
      <button
        type="submit"
        disabled={!input.trim()}
        aria-label={t("chat.send")}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-sv-blue text-white transition hover:bg-sv-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 disabled:opacity-40 touch-manipulation"
      >
        <Send className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
      </button>
    </form>
  )
}

function MessageThread({
  roomId,
  listingId,
  listingTitle,
  isSupport,
}: {
  roomId: string
  listingId?: string | null
  listingTitle?: string | null
  isSupport?: boolean
}) {
  const { meId } = useChat()
  const { t, lang } = useI18n()
  const me = meId ?? ""

  const [messages, setMessages] = useState<UIMessage[]>([])
  const [loaded, setLoaded] = useState(false)
  const [page, setPage] = useState<{ hasMore: boolean; nextCursor: string | null }>({
    hasMore: false,
    nextCursor: null,
  })
  const [peerReadAt, setPeerReadAt] = useState<string | null>(null)
  const [peerTyping, setPeerTyping] = useState(false)
  const [live, setLive] = useState(true)
  const [atBottom, setAtBottom] = useState(true)
  const [loadingOlder, setLoadingOlder] = useState(false)

  const listRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const nearBottomRef = useRef(true)
  const firstLoadRef = useRef(true)
  const restoreScrollRef = useRef<number | null>(null)
  const loadedRef = useRef(false)
  const markReadTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const typingClearTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const isOwn = useCallback((m: ChatMessage) => m.senderId === me, [me])

  /** Messages arriving after the initial page load get the entrance animation. */
  const decorate = (list: ChatMessage[]): UIMessage[] =>
    loadedRef.current ? list.map((m) => ({ ...m, anim: true })) : list

  const scrollToBottom = useCallback((smooth: boolean) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "end" })
  }, [])

  const queueMarkRead = useCallback(() => {
    if (document.hidden) return
    clearTimeout(markReadTimer.current)
    markReadTimer.current = setTimeout(() => {
      fetch(`/api/chat/${roomId}`, { method: "PATCH" }).catch(() => {})
    }, 600)
  }, [roomId])

  // Initial load + SSE subscription
  useEffect(() => {
    let alive = true
    firstLoadRef.current = true
    nearBottomRef.current = true

    ;(async () => {
      try {
        const res = await fetch(`/api/chat/${roomId}`)
        if (!res.ok || !alive) return
        const data = await res.json()
        if (!alive) return
        setMessages((prev) => mergeMessages(prev, data.messages ?? []))
        setPeerReadAt(data.peerReadAt ?? null)
        setPage({ hasMore: !!data.hasMore, nextCursor: data.nextCursor ?? null })
        loadedRef.current = true
        setLoaded(true)
        queueMarkRead()
      } catch {
        if (alive) setLoaded(true)
      }
    })()

    /** Refetch the newest page — heals gaps after mobile backgrounding or a drop. */
    const catchUp = async () => {
      try {
        const res = await fetch(`/api/chat/${roomId}`)
        if (!res.ok || !alive) return
        const data = await res.json()
        if (!alive) return
        setMessages((prev) => mergeMessages(prev, data.messages ?? []))
        setPeerReadAt(data.peerReadAt ?? null)
        setPage({ hasMore: !!data.hasMore, nextCursor: data.nextCursor ?? null })
      } catch {
        // next visibility tick or SSE seed retries
      }
    }

    const es = new EventSource(`/api/chat/${roomId}/stream`)

    es.onopen = () => setLive(true)
    es.onerror = () => setLive(false)

    // Seed = history as of connect time (initial open or reconnect). Old news:
    // it never carries the entrance animation.
    es.addEventListener("seed", (e) => {
      try {
        const d = JSON.parse(e.data)
        setMessages((prev) => mergeMessages(prev, d.messages ?? []))
        if (d.readAt) setPeerReadAt(d.readAt)
      } catch {
        // ignore malformed frames
      }
    })

    es.addEventListener("message", (e) => {
      try {
        const d = JSON.parse(e.data)
        const incoming = decorate(d.messages ?? [])
        const hasPeer = incoming.some((m) => m.senderId !== me)
        setMessages((prev) => mergeMessages(prev, incoming))
        // Honest receipts: only read what was actually on screen
        if (hasPeer && !document.hidden && nearBottomRef.current) queueMarkRead()
      } catch {
        // ignore malformed frames
      }
    })

    es.addEventListener("read", (e) => {
      try {
        setPeerReadAt(JSON.parse(e.data).readAt ?? null)
      } catch {
        // ignore
      }
    })

    es.addEventListener("typing", (e) => {
      try {
        const on = !!JSON.parse(e.data).typing
        setPeerTyping(on)
        if (on) {
          clearTimeout(typingClearTimer.current)
          typingClearTimer.current = setTimeout(() => setPeerTyping(false), 8000)
        }
      } catch {
        // ignore
      }
    })

    // Catch up on messages + read state when the user returns to the tab
    const onVisible = () => {
      if (!document.hidden) {
        queueMarkRead()
        void catchUp()
      }
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      alive = false
      es.close()
      clearTimeout(markReadTimer.current)
      clearTimeout(typingClearTimer.current)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [roomId, me, queueMarkRead])

  // Auto-scroll — first load jumps; afterwards only when the user lives near
  // the bottom (never kidnaps the viewport while reading history)
  useEffect(() => {
    if (!loaded) return
    if (firstLoadRef.current) {
      scrollToBottom(false)
      firstLoadRef.current = false
      return
    }
    if (nearBottomRef.current) scrollToBottom(true)
  }, [messages, loaded, scrollToBottom])

  // Keep the viewport anchored when older pages prepend
  useLayoutEffect(() => {
    if (restoreScrollRef.current == null) return
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight - restoreScrollRef.current
    restoreScrollRef.current = null
  }, [messages])

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    nearBottomRef.current = near
    if (near !== atBottom) setAtBottom(near)
  }

  const loadOlder = async () => {
    if (!page.nextCursor || loadingOlder) return
    setLoadingOlder(true)
    const el = listRef.current
    restoreScrollRef.current = el ? el.scrollHeight - el.scrollTop : null
    try {
      const res = await fetch(`/api/chat/${roomId}?cursor=${encodeURIComponent(page.nextCursor)}`)
      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => mergeMessages(prev, data.messages ?? []))
        setPage({ hasMore: !!data.hasMore, nextCursor: data.nextCursor ?? null })
      }
    } catch {
      // ponytail: the button stays — retry on next click
    } finally {
      setLoadingOlder(false)
    }
  }

  const sendText = useCallback(
    async (text: string, clientId?: string) => {
      if (listingId) clearChatDraft(listingId)
      const cid = clientId ?? (crypto.randomUUID?.() ?? `c${Date.now()}${Math.random()}`)
      const temp: UIMessage = {
        id: `tmp_${cid}`,
        roomId,
        senderId: me,
        content: text,
        kind: "text",
        createdAt: new Date().toISOString(),
        status: "pending",
        clientId: cid,
        anim: true,
      }
      setMessages((prev) => mergeMessages(prev, [temp]))
      try {
        const res = await fetch(`/api/chat/${roomId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, metadata: { clientId: cid } }),
        })
        if (res.ok) {
          const data = await res.json()
          setMessages((prev) => mergeMessages(prev, [data.message]))
        } else {
          setMessages((prev) =>
            prev.map((m) => (m.clientId === cid ? { ...m, status: "failed" as const } : m)),
          )
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) => (m.clientId === cid ? { ...m, status: "failed" as const } : m)),
        )
      }
    },
    [roomId, me, listingId],
  )

  /** Stable identity — memoized bubbles compare it without re-rendering. */
  const retry = useCallback(
    (msg: ChatMessage) => {
      setMessages((prev) => prev.filter((m) => m.id !== msg.id))
      void sendText(msg.content, msg.clientId)
    },
    [sendText],
  )

  /** Copy/report affordances — reported ids disable the report item. */
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set())
  const copyMsg = useCallback((m: ChatMessage) => {
    try {
      void navigator.clipboard?.writeText(m.content)
    } catch {
      // ponytail: clipboard denied — the menu still closes, nothing lost
    }
  }, [])
  const reportMsg = useCallback(
    async (m: ChatMessage) => {
      try {
        const res = await fetch(`/api/chat/${roomId}/report`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId: m.id }),
        })
        if (res.ok) setReportedIds((prev) => new Set(prev).add(m.id))
      } catch {
        // ponytail: retry from the menu on next open
      }
    },
    [roomId],
  )
  const menuLabels = useMemo(
    () => ({
      copy: t("chat.copy"),
      copied: t("chat.copied"),
      report: t("chat.report"),
      reported: t("chat.reported"),
      actions: t("chat.msgActions"),
    }),
    [t],
  )

  if (!loaded) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="sv-spinner" aria-hidden />
      </div>
    )
  }

  const seed = listingId ? (peekChatDraft(listingId) ?? "") : ""

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Connection status — optimistic until the stream proves otherwise */}
      {!live && (
        <div
          role="status"
          className="flex items-center justify-center gap-2 bg-sv-ink/[0.04] py-1.5 text-[12px] font-bold text-sv-ink/60"
        >
          <span className="sv-spinner-sm" aria-hidden />
          {t("chat.reconnecting")}
        </div>
      )}

      {/* Messages log */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={listRef}
          onScroll={onScroll}
          role="log"
          aria-live="polite"
          aria-label={t("chat.log")}
          className="absolute inset-0 overflow-y-auto overscroll-contain px-4 py-2"
        >
          {listingId && listingTitle && (
            <a
              href={`/listing/${listingId}`}
              aria-label={t("chat.viewListing")}
              className="mb-2 mt-1 flex min-h-11 items-center gap-2 rounded-control bg-sv-ink/[0.04] px-3 py-2.5 text-left transition-colors hover:bg-sv-ink/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-sv-blue" aria-hidden />
              <span className="min-w-0 truncate text-[13px] font-extrabold text-sv-ink">
                {listingTitle}
              </span>
            </a>
          )}
          {page.hasMore && (
            <button
              type="button"
              onClick={loadOlder}
              className="mx-auto my-2 block rounded-full bg-sv-ink/[0.05] px-3 py-1.5 text-[12px] font-bold text-sv-ink/60 transition-colors hover:bg-sv-ink/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
            >
              {loadingOlder ? t("chat.loadOlder") + "…" : t("chat.loadOlder")}
            </button>
          )}
          {messages.length === 0 && (
            <p className="px-4 py-10 text-center text-[13px] font-medium text-sv-ink/60">
              {t("chat.emptyThread")}
            </p>
          )}
          {messages.map((m, i) => {
            const prev = messages[i - 1]
            const own = isOwn(m)
            const firstOfGroup = !prev || !sameGroup(prev, m) || isOwn(prev) !== own
            const lastOfGroup = !messages[i + 1] || !sameGroup(m, messages[i + 1])
            const showDay = !prev || dayKey(prev.createdAt) !== dayKey(m.createdAt)
            const peerRead =
              !!peerReadAt && new Date(peerReadAt).getTime() >= new Date(m.createdAt).getTime()
            return (
              <Fragment key={m.id}>
                {showDay && (
                  <div className="flex justify-center py-2">
                    <span className="rounded-full bg-sv-ink/[0.05] px-3 py-1 text-[11px] font-bold text-sv-ink/60">
                      {dayLabel(m.createdAt, lang, t("chat.today"), t("chat.yesterday"))}
                    </span>
                  </div>
                )}
                <MessageBubble
                  msg={m}
                  own={own}
                  firstOfGroup={firstOfGroup}
                  lastOfGroup={lastOfGroup}
                  animate={m.anim === true}
                  peerRead={own && peerRead}
                  lang={lang}
                  onRetry={retry}
                  retryLabel={t("chat.retry")}
                  menu={menuLabels}
                  reported={reportedIds.has(m.id)}
                  onCopy={copyMsg}
                  onReport={reportMsg}
                />
              </Fragment>
            )
          })}
          {peerTyping && (
            <div className="mt-1 flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-sv-ink/[0.06] px-3.5 py-2.5" aria-label={t("chat.typing")}>
                <TypingDots />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        {/* Jump to latest — appears once the reader scrolls away from the bottom */}
        {!atBottom && (
          <button
            type="button"
            onClick={() => {
              scrollToBottom(true)
              queueMarkRead()
            }}
            className="sv-chat-msg-in absolute bottom-3 end-4 z-10 inline-flex h-9 items-center gap-1.5 rounded-full bg-sv-surface px-3.5 text-[12.5px] font-bold text-sv-ink shadow-panel-dark ring-1 ring-sv-ink/10 transition-colors hover:bg-sv-ink/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
          >
            {t("chat.jumpLatest")}
            <ArrowDown className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </div>

      {messages.length === 0 && !isSupport && listingId && !seed && (
        <div className="border-t border-sv-ink/[0.06] px-3 pb-1 pt-2">
          <p className="px-0.5 pb-2 text-[11.5px] font-bold text-sv-ink/60">{t("chat.suggestHint")}</p>
          <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(
              [
                "chat.suggestInterest",
                "chat.suggestViewing",
                "chat.suggestAvailable",
              ] as const
            ).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => void sendText(t(key))}
                className="min-h-11 max-w-[85%] shrink-0 truncate rounded-full border border-sv-blue/20 bg-sv-blue/[0.06] px-3.5 py-2.5 text-[13px] font-bold text-sv-blue-deep transition-colors hover:bg-sv-blue/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue active:scale-[0.98] touch-manipulation"
              >
                {t(key)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Composer — owns the draft, so typing never re-renders the log */}
      <Composer
        roomId={roomId}
        listingId={listingId}
        initialValue={seed}
        sendText={sendText}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Widget — launcher + panel
// ---------------------------------------------------------------------------

const SHEET_EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]"

/** Per-room ⋯ menu: jump to the listing, or leave (two-tap, no modal). */
function RoomMenu({ room, onLeave }: { room: ChatRoom; onLeave: (id: string) => void }) {
  const { t } = useI18n()
  const [menuOpen, setMenuOpen] = useState(false)
  const [armLeave, setArmLeave] = useState(false)
  const armTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(armTimer.current), [])
  // Fresh room → fresh menu state via key={room.id} at the call site (no
  // armed Leave leaking across rooms, no set-state-in-effect).

  const onMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      setMenuOpen(false)
      setArmLeave(false)
    }
  }
  const tapLeave = () => {
    if (!armLeave) {
      setArmLeave(true)
      clearTimeout(armTimer.current)
      armTimer.current = setTimeout(() => setArmLeave(false), 3000)
      return
    }
    clearTimeout(armTimer.current)
    setMenuOpen(false)
    setArmLeave(false)
    void onLeave(room.id)
  }

  return (
    <span className="relative shrink-0" onKeyDown={onMenuKeyDown}>
      <button
        type="button"
        onClick={() => {
          setMenuOpen((v) => !v)
          setArmLeave(false)
        }}
        aria-label={t("chat.roomActions")}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        className="grid h-9 w-9 place-items-center rounded-control text-sv-ink/60 transition-colors hover:bg-sv-ink/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
      >
        <MoreHorizontal className="h-4.5 w-4.5" aria-hidden />
      </button>
      {menuOpen && (
        <span
          role="menu"
          className="absolute end-0 top-10 z-20 w-44 overflow-hidden rounded-control bg-sv-surface py-1 shadow-panel-dark ring-1 ring-sv-ink/10"
        >
          {room.listingId && (
            <a
              role="menuitem"
              href={`/listing/${room.listingId}`}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-bold text-sv-ink transition-colors hover:bg-sv-ink/[0.05] focus-visible:outline-none focus-visible:bg-sv-ink/[0.05]"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              {t("chat.viewListing")}
            </a>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={tapLeave}
            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-bold transition-colors hover:bg-sv-ink/[0.05] focus-visible:outline-none focus-visible:bg-sv-ink/[0.05] ${
              armLeave ? "text-sv-orange" : "text-sv-ink"
            }`}
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden />
            {armLeave ? t("chat.leaveConfirm") : t("chat.leave")}
          </button>
        </span>
      )}
    </span>
  )
}

export default function ChatWidget() {
  const { t, lang } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const { status } = useSession()
  // Guests get the help assistant only — rooms/support need an account, so
  // their "Message us" CTA routes to sign-in instead of the API.
  const guest = status === "unauthenticated"
  const {
    open,
    openChat,
    closeChat,
    activeRoomId,
    setActiveRoom,
    rooms,
    loading,
    unread,
    totalUnread,
    openSupportChat,
    leaveRoom,
  } = useChat()

  const launcherRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const wasOpenRef = useRef(false)

  /** Room list vs help assistant (pre-room view). */
  const [view, setView] = useState<"rooms" | "faq">("rooms")
  /** Room-list filter — rendered only once the list is long enough to need it. */
  const [roomQuery, setRoomQuery] = useState("")
  const visibleRooms =
    roomQuery.trim().length === 0
      ? rooms
      : rooms.filter((r) => {
          const q = roomQuery.trim().toLowerCase()
          const hay = `${r.isSupport ? t("chat.supportName") : ""} ${r.counterpart?.name ?? ""} ${r.listing?.title ?? ""} ${r.title} ${r.lastMessage?.content ?? ""}`.toLowerCase()
          return hay.includes(q)
        })

  const openSupport = useCallback(() => {
    if (guest) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`)
      return
    }
    setView("rooms")
    const existing = rooms.find((r) => r.isSupport)
    if (existing) setActiveRoom(existing.id)
    else openSupportChat()
  }, [guest, router, pathname, rooms, setActiveRoom, openSupportChat])

  // Mount/close choreography — setState only in rAF/timeout callbacks so the
  // enter transition always has a painted closed frame to animate from.
  const [panelMounted, setPanelMounted] = useState(false)
  const [panelIn, setPanelIn] = useState(false)
  useEffect(() => {
    if (open) {
      let raf2 = 0
      const raf1 = requestAnimationFrame(() => {
        setPanelMounted(true)
        raf2 = requestAnimationFrame(() => setPanelIn(true))
      })
      return () => {
        cancelAnimationFrame(raf1)
        cancelAnimationFrame(raf2)
      }
    }
    const raf = requestAnimationFrame(() => setPanelIn(false))
    const timer = setTimeout(() => setPanelMounted(false), 280)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
    }
  }, [open])

  // Focus lands in the panel on open; returns to the launcher on close
  useEffect(() => {
    if (open) {
      wasOpenRef.current = true
      const raf = requestAnimationFrame(() =>
        panelRef.current?.focus({ preventScroll: true }),
      )
      return () => cancelAnimationFrame(raf)
    }
    if (wasOpenRef.current) {
      wasOpenRef.current = false
      launcherRef.current?.focus({ preventScroll: true })
    }
  }, [open])

  // The mobile sheet covers the viewport → modal semantics + page scroll lock.
  // Desktop keeps the panel as a floating (non-modal) window.
  const [fullscreen, setFullscreen] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767.98px)")
    const apply = () => setFullscreen(open && mql.matches)
    apply()
    mql.addEventListener("change", apply)
    return () => mql.removeEventListener("change", apply)
  }, [open])
  useEffect(() => {
    if (!fullscreen) return
    const root = document.documentElement
    const prev = root.style.overflow
    root.style.overflow = "hidden"
    return () => {
      root.style.overflow = prev
    }
  }, [fullscreen])

  // iOS keyboard eats layout viewport; pin the sheet to visualViewport so
  // the composer stays above it. No visualViewport → 100dvh still holds.
  useEffect(() => {
    if (!fullscreen || !panelMounted) return
    const vv = window.visualViewport
    const el = panelRef.current
    if (!vv || !el) return
    const apply = () => {
      el.style.height = `${Math.round(vv.height)}px`
      el.style.top = `${Math.round(vv.offsetTop)}px`
      el.style.bottom = "auto"
    }
    apply()
    vv.addEventListener("resize", apply)
    vv.addEventListener("scroll", apply)
    return () => {
      vv.removeEventListener("resize", apply)
      vv.removeEventListener("scroll", apply)
      el.style.height = ""
      el.style.top = ""
      el.style.bottom = ""
    }
  }, [fullscreen, panelMounted])

  const activeRoom = rooms.find((r) => r.id === activeRoomId)
  const headerTitle = activeRoom
    ? activeRoom.isSupport
      ? t("chat.supportName")
      : activeRoom.counterpart?.name || activeRoom.listing?.title || activeRoom.title
    : view === "faq"
      ? t("chat.help")
      : t("chat.title")
  const headerSub = activeRoom
    ? activeRoom.isSupport
      ? t("chat.supportSub")
      : activeRoom.counterpart?.name && activeRoom.listing?.title
        ? activeRoom.listing.title
        : null
    : null

  const close = () => {
    closeChat()
    setView("rooms")
  }

  const onPanelKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation()
      close()
      return
    }
    // Fullscreen sheet is modal — keep Tab cycling inside it
    if (e.key === "Tab" && fullscreen && panelRef.current) {
      const items = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href],button:not(:disabled),textarea:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex]:not([tabindex="-1"])',
      )
      if (items.length === 0) return
      const first = items[0]!
      const last = items[items.length - 1]!
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  return (
    <>
      {/* Launcher */}
      <button
        ref={launcherRef}
        onClick={() => {
          if (open) close()
          else {
            setView(guest ? "faq" : "rooms")
            openChat()
          }
        }}
        aria-label={open ? t("chat.close") : t("chat.open")}
        aria-expanded={open}
        aria-controls="sv-chat-panel"
        className={`fixed bottom-24 end-4 z-50 grid h-14 w-14 place-items-center rounded-full bg-sv-blue text-white shadow-glow-blue transition duration-300 hover:-translate-y-0.5 hover:bg-sv-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 active:scale-95 motion-reduce:transition-none touch-manipulation lg:bottom-6 lg:end-6 ${
          open ? "pointer-events-none invisible" : ""
        }`}
      >
        <span
          className={`absolute transition-all duration-200 ${
            open ? "rotate-90 opacity-0" : "rotate-0 opacity-100"
          }`}
        >
          <MessageCircle className="h-5 w-5" aria-hidden />
        </span>
        <span
          className={`absolute transition-all duration-200 ${
            open ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
          }`}
        >
          <X className="h-5 w-5" aria-hidden />
        </span>
        {!open && totalUnread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-sv-orange px-1.5 text-[10px] font-black text-sv-ink ring-2 ring-sv-surface">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </button>

      {/* Panel */}
      {panelMounted && (
        <div
          ref={panelRef}
          id="sv-chat-panel"
          role="dialog"
          aria-label={t("chat.title")}
          aria-modal={fullscreen || undefined}
          tabIndex={-1}
          onKeyDown={onPanelKeyDown}
          className={`fixed z-50 flex flex-col overflow-hidden bg-sv-surface shadow-panel-dark outline-none
            max-md:inset-x-0 max-md:top-0 max-md:bottom-0 max-md:h-[100dvh] max-md:w-full max-md:rounded-none max-md:pt-[env(safe-area-inset-top,0px)]
            md:bottom-6 md:end-6 md:h-[560px] md:w-[380px] md:rounded-card md:border md:border-sv-ink/[0.08]
            transition-[opacity,transform] duration-[260ms] ${SHEET_EASE} motion-reduce:transition-none
            ${panelIn ? "translate-y-0 opacity-100 md:scale-100" : "max-md:translate-y-full md:translate-y-3 md:scale-[0.98] md:opacity-0"}`}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 border-b border-sv-ink/[0.08] px-3 py-2.5">
            {activeRoomId || (view === "faq" && !guest) ? (
              <button
                onClick={() => {
                  if (activeRoomId) setActiveRoom(null)
                  else setView("rooms")
                }}
                aria-label={t("chat.back")}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-control text-sv-ink/60 transition-colors hover:bg-sv-ink/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
              >
                <ChevronLeft className="h-4.5 w-4.5 rtl:rotate-180" aria-hidden />
              </button>
            ) : null}
            {activeRoom?.isSupport ? (
              <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-sv-blue/10 text-sv-blue-deep">
                <LifeBuoy className="h-4 w-4" aria-hidden />
              </span>
            ) : activeRoom ? (
              <UserAvatar
                name={activeRoom.counterpart?.name}
                image={activeRoom.counterpart?.image}
                gradient={activeRoom.counterpart?.avatarStyle}
                color={activeRoom.counterpart?.avatarColor}
                icon={activeRoom.counterpart?.avatarIcon}
                size={34}
                className="shrink-0"
              />
            ) : view === "faq" ? (
              <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-sv-blue/10 text-sv-blue-deep">
                <HelpCircle className="h-4 w-4" aria-hidden />
              </span>
            ) : null}
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[15px] font-black text-sv-ink">{headerTitle}</h2>
              {headerSub && (
                <p className="truncate text-[11.5px] font-semibold text-sv-ink/60">{headerSub}</p>
              )}
            </div>
            {activeRoom && <RoomMenu key={activeRoom.id} room={activeRoom} onLeave={leaveRoom} />}
            <button
              onClick={close}
              aria-label={t("chat.close")}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-control text-sv-ink/60 transition-colors hover:bg-sv-ink/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
            >
              <X className="h-4.5 w-4.5" aria-hidden />
            </button>
          </div>

          {/* Content */}
          {activeRoomId ? (
            <MessageThread
              key={activeRoomId}
              roomId={activeRoomId}
              listingId={activeRoom?.listingId}
              listingTitle={activeRoom?.listing?.title}
              isSupport={activeRoom?.isSupport}
            />
          ) : view === "faq" ? (
            <FaqView key={lang} onContactSupport={openSupport} />
          ) : (
            <div className="flex-1 overflow-y-auto overscroll-contain px-2.5 py-2.5">
              <QuickTiles
                showSupport={!rooms.some((r) => r.isSupport)}
                onFaq={() => setView("faq")}
                onSupport={openSupport}
              />
              {rooms.length > 4 && (
                <div className="relative px-1 pb-2">
                  <Search
                    className="pointer-events-none absolute start-4 top-1/2 h-3.5 w-3.5 -translate-y-[calc(50%+4px)] text-sv-ink/35"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={roomQuery}
                    onChange={(e) => setRoomQuery(e.target.value)}
                    placeholder={t("chat.search")}
                    aria-label={t("chat.search")}
                    className="w-full rounded-control border border-sv-ink/10 bg-sv-ink/[0.03] py-2 pe-3 ps-8 text-[13.5px] font-medium text-sv-ink outline-none transition-colors placeholder:text-sv-ink/35 focus:border-sv-blue/40"
                  />
                </div>
              )}
              {loading && rooms.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <span className="sv-spinner" aria-hidden />
                </div>
              ) : rooms.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-sv-blue/10 text-sv-blue-deep">
                    <MessageCircle className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="text-[13px] font-medium leading-relaxed text-sv-ink/60">
                    {t("chat.empty")}
                  </p>
                </div>
              ) : visibleRooms.length === 0 ? (
                <p className="px-4 py-10 text-center text-[13px] font-medium text-sv-ink/60">
                  {t("chat.noResults")}
                </p>
              ) : (
                <div className="space-y-1">
                  {visibleRooms.map((room) => (
                    <RoomListItem
                      key={room.id}
                      room={room}
                      active={room.id === activeRoomId}
                      unreadCount={unread[room.id] ?? 0}
                      onClick={() => setActiveRoom(room.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}
