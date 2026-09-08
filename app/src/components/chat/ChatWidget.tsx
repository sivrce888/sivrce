"use client"

import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type UIEvent,
} from "react"
import {
  Check,
  CheckCheck,
  ChevronLeft,
  Loader2,
  MessageCircle,
  RotateCcw,
  Send,
  X,
} from "lucide-react"
import UserAvatar from "@/components/UserAvatar"
import { useI18n } from "@/lib/i18n/context"
import { useChat, type ChatRoom } from "./ChatProvider"
import {
  clockLabel,
  dayKey,
  dayLabel,
  mergeMessages,
  sameGroup,
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
  const name = room.counterpart?.name || room.listing?.title || room.title
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
      <UserAvatar
        name={room.counterpart?.name}
        image={room.counterpart?.image}
        gradient={room.counterpart?.avatarStyle}
        color={room.counterpart?.avatarColor}
        icon={room.counterpart?.avatarIcon}
        size={40}
      />
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
            <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-sv-orange px-1.5 text-[10px] font-black text-white">
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

function MessageBubble({
  msg,
  own,
  firstOfGroup,
  lastOfGroup,
  animate,
  peerRead,
  lang,
  onRetry,
  retryLabel,
}: {
  msg: ChatMessage
  own: boolean
  firstOfGroup: boolean
  lastOfGroup: boolean
  animate: boolean
  peerRead: boolean
  lang: string
  onRetry?: () => void
  retryLabel?: string
}) {
  return (
    <div className={`flex ${own ? "justify-end" : "justify-start"} ${firstOfGroup ? "mt-3" : "mt-0.5"}`}>
      <div
        className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-[14px] font-medium leading-relaxed ${
          own ? "bg-sv-blue text-white" : "bg-sv-ink/[0.06] text-sv-ink"
        } ${own && lastOfGroup ? "rounded-br-md" : ""} ${!own && firstOfGroup ? "rounded-bl-md" : ""} ${
          msg.status === "failed" ? "ring-1 ring-sv-orange/60" : ""
        } ${msg.status === "pending" ? "opacity-70" : ""} ${animate ? "sv-chat-msg-in" : ""}`}
      >
        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        {lastOfGroup && (
          <div
            className={`mt-1 flex items-center justify-end gap-1 text-[10px] font-bold ${
              own ? "text-white/60" : "text-sv-ink/35"
            }`}
          >
            {msg.status === "failed" && (
              <button
                type="button"
                onClick={onRetry}
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
          </div>
        )}
      </div>
    </div>
  )
}

function MessageThread({ roomId }: { roomId: string }) {
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
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)

  const listRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const nearBottomRef = useRef(true)
  const firstLoadRef = useRef(true)
  const restoreScrollRef = useRef<number | null>(null)
  const loadedRef = useRef(false)
  const markReadTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const typingClearTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const typingSentAt = useRef(0)

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

    const es = new EventSource(`/api/chat/${roomId}/stream`)

    es.addEventListener("seed", (e) => {
      try {
        const d = JSON.parse(e.data)
        setMessages((prev) => mergeMessages(prev, decorate(d.messages ?? [])))
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
        if (hasPeer && !document.hidden) queueMarkRead()
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

    // Catch up on read state when the user returns to the tab
    const onVisible = () => {
      if (!document.hidden) queueMarkRead()
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
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120
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
    [roomId, me],
  )

  const onSend = async (e: FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setInput("")
    await sendText(text)
    setSending(false)
  }

  const retry = (msg: ChatMessage) => {
    setMessages((prev) => prev.filter((m) => m.id !== msg.id))
    sendText(msg.content, msg.clientId)
  }

  const onInputKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      const text = input.trim()
      if (text && !sending) {
        setInput("")
        sendText(text)
      }
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

  if (!loaded) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="sv-spinner" aria-hidden />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Messages log */}
      <div
        ref={listRef}
        onScroll={onScroll}
        role="log"
        aria-live="polite"
        aria-label={t("chat.log")}
        className="flex-1 overflow-y-auto px-4 py-2"
      >
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
                onRetry={() => retry(m)}
                retryLabel={t("chat.retry")}
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

      {/* Composer */}
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
          aria-label={t("chat.placeholder")}
          className="max-h-28 min-w-0 flex-1 resize-none rounded-control border border-sv-ink/10 bg-sv-ink/[0.03] px-3.5 py-2.5 text-[14px] font-medium leading-snug text-sv-ink outline-none transition-colors [field-sizing:content] placeholder:text-sv-ink/35 focus:border-sv-blue/40"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          aria-label={t("chat.send")}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-sv-blue text-white transition hover:bg-sv-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 disabled:opacity-40"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Send className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
          )}
        </button>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Widget — launcher + panel
// ---------------------------------------------------------------------------

const SHEET_EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]"

export default function ChatWidget() {
  const { t } = useI18n()
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
  } = useChat()

  const launcherRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const wasOpenRef = useRef(false)

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

  const activeRoom = rooms.find((r) => r.id === activeRoomId)
  const headerTitle = activeRoom
    ? activeRoom.counterpart?.name || activeRoom.listing?.title || activeRoom.title
    : t("chat.title")
  const headerSub = activeRoom
    ? activeRoom.counterpart?.name && activeRoom.listing?.title
      ? activeRoom.listing.title
      : null
    : null

  const onPanelKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation()
      closeChat()
    }
  }

  return (
    <>
      {/* Launcher */}
      <button
        ref={launcherRef}
        onClick={() => (open ? closeChat() : openChat())}
        aria-label={open ? t("chat.close") : t("chat.open")}
        aria-expanded={open}
        className="fixed bottom-24 right-4 z-50 grid h-14 w-14 place-items-center rounded-full bg-sv-blue text-white shadow-glow-blue transition duration-300 hover:-translate-y-0.5 hover:bg-sv-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 active:scale-95 motion-reduce:transition-none lg:bottom-6 lg:right-6"
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
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-sv-orange px-1.5 text-[10px] font-black text-white ring-2 ring-sv-surface">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </button>

      {/* Panel */}
      {panelMounted && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={t("chat.title")}
          tabIndex={-1}
          onKeyDown={onPanelKeyDown}
          className={`fixed z-50 flex flex-col overflow-hidden bg-sv-surface shadow-panel-dark outline-none
            max-md:inset-x-0 max-md:top-0 max-md:bottom-0 max-md:h-[100dvh] max-md:w-full max-md:rounded-none max-md:pt-[env(safe-area-inset-top,0px)]
            md:bottom-6 md:right-6 md:h-[560px] md:w-[380px] md:rounded-card md:border md:border-sv-ink/[0.08]
            transition-[opacity,transform] duration-[260ms] ${SHEET_EASE} motion-reduce:transition-none
            ${panelIn ? "translate-y-0 opacity-100 md:scale-100" : "max-md:translate-y-full md:translate-y-3 md:scale-[0.98] md:opacity-0"}`}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 border-b border-sv-ink/[0.08] px-3 py-2.5">
            {activeRoomId ? (
              <button
                onClick={() => setActiveRoom(null)}
                aria-label={t("chat.back")}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-control text-sv-ink/60 transition-colors hover:bg-sv-ink/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
              >
                <ChevronLeft className="h-4.5 w-4.5 rtl:rotate-180" aria-hidden />
              </button>
            ) : null}
            {activeRoom && (
              <UserAvatar
                name={activeRoom.counterpart?.name}
                image={activeRoom.counterpart?.image}
                gradient={activeRoom.counterpart?.avatarStyle}
                color={activeRoom.counterpart?.avatarColor}
                icon={activeRoom.counterpart?.avatarIcon}
                size={34}
                className="shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[15px] font-black text-sv-ink">{headerTitle}</h2>
              {headerSub && (
                <p className="truncate text-[11.5px] font-semibold text-sv-ink/60">{headerSub}</p>
              )}
            </div>
            <button
              onClick={closeChat}
              aria-label={t("chat.close")}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-control text-sv-ink/60 transition-colors hover:bg-sv-ink/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
            >
              <X className="h-4.5 w-4.5" aria-hidden />
            </button>
          </div>

          {/* Content */}
          {activeRoomId ? (
            <MessageThread roomId={activeRoomId} />
          ) : (
            <div className="flex-1 space-y-1 overflow-y-auto px-2.5 py-2.5">
              {loading && rooms.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <span className="sv-spinner" aria-hidden />
                </div>
              ) : rooms.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-sv-blue/10 text-sv-blue">
                    <MessageCircle className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="text-[13px] font-medium leading-relaxed text-sv-ink/60">
                    {t("chat.empty")}
                  </p>
                </div>
              ) : (
                rooms.map((room) => (
                  <RoomListItem
                    key={room.id}
                    room={room}
                    active={room.id === activeRoomId}
                    unreadCount={unread[room.id] ?? 0}
                    onClick={() => setActiveRoom(room.id)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}
