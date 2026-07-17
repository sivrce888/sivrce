"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, X, ChevronLeft, Send, Loader2 } from "lucide-react"
import { useChat, type ChatRoom, type ChatMessage } from "./ChatProvider"

const ease = [0.21, 0.65, 0.2, 1] as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "ახლა"
  if (mins < 60) return `${mins} წთ`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} სთ`
  const days = Math.floor(hours / 24)
  return `${days} დღე`
}

function previewText(text: string, max = 40): string {
  return text.length > max ? text.slice(0, max) + "…" : text
}

// ---------------------------------------------------------------------------
// Room list item
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
  const lastMsg = room.messages?.[0]
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-module px-4 py-3 text-left transition-colors ${
        active
          ? "bg-sv-blue/10 ring-1 ring-inset ring-sv-blue/20"
          : "hover:bg-sv-ink/[0.04]"
      }`}
    >
      {/* Avatar placeholder */}
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sv-blue to-sv-violet text-[13px] font-black text-white">
        {(room.listing?.title ?? room.title).charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[14px] font-extrabold text-sv-ink">
            {room.listing?.title ?? room.title}
          </span>
          {lastMsg && (
            <span className="shrink-0 text-[11px] font-bold text-sv-ink/40">
              {timeAgo(lastMsg.createdAt)}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className="truncate text-[13px] font-medium text-sv-ink/50">
            {lastMsg ? previewText(lastMsg.content) : "ჯერ შეტყობინება არ არის"}
          </span>
          {unreadCount > 0 && (
            <span className="grid h-5 min-w-[20px] shrink-0 place-items-center rounded-full bg-sv-orange px-1.5 text-[10px] font-black text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Message thread
// ---------------------------------------------------------------------------

function MessageBubble({ msg, isOwn }: { msg: ChatMessage; isOwn: boolean }) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[14px] font-medium leading-relaxed ${
          isOwn
            ? "rounded-br-md bg-sv-blue text-white"
            : "rounded-bl-md bg-sv-ink/[0.06] text-sv-ink"
        }`}
      >
        {msg.content}
        <div
          className={`mt-1 text-[10px] font-bold ${
            isOwn ? "text-white/60" : "text-sv-ink/35"
          }`}
        >
          {timeAgo(msg.createdAt)}
        </div>
      </div>
    </div>
  )
}

function MessageThread({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)

  // Fetch initial messages
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/chat/${roomId}`)
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (!cancelled) {
          setMessages(data.messages ?? [])
          setLoaded(true)
        }
      } catch {
        // silent
      }
    }
    load()
    return () => { cancelled = true }
  }, [roomId])

  // Subscribe to SSE
  useEffect(() => {
    const es = new EventSource(`/api/chat/${roomId}/stream`)

    es.addEventListener("message", (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.messages) {
          setMessages((prev) => {
            const existing = new Set(prev.map((m) => m.id))
            const fresh = data.messages.filter((m: ChatMessage) => !existing.has(m.id))
            return [...prev, ...fresh]
          })
        }
      } catch {
        // ignore parse errors
      }
    })

    es.addEventListener("seed", (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.messages && messages.length === 0) {
          setMessages(data.messages)
          setLoaded(true)
        }
      } catch {
        // ignore
      }
    })

    es.onerror = () => {
      // ponytail: EventSource auto-reconnects; no explicit fallback needed
    }

    return () => es.close()
  }, [roomId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Mark read
  useEffect(() => {
    fetch(`/api/chat/${roomId}`, { method: "PATCH" }).catch(() => {})
  }, [roomId])

  const send = async (e: FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setInput("")
    try {
      const res = await fetch(`/api/chat/${roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, data.message])
      }
    } catch {
      // ponytail: retry on next send
    } finally {
      setSending(false)
    }
  }

  if (!loaded) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-sv-blue" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-[13px] font-medium text-sv-ink/40 py-8">
            ჯერ შეტყობინებები არ არის. გაუგზავნეთ პირველი მესიჯი.
          </p>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isOwn={msg.senderId === "me"}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={send}
        className="flex items-center gap-2 border-t border-sv-ink/[0.08] p-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="შეტყობინება…"
          className="h-11 flex-1 rounded-control border border-sv-ink/10 bg-sv-ink/[0.03] px-4 text-[14px] font-medium text-sv-ink outline-none transition-colors placeholder:text-sv-ink/35 focus:border-sv-blue/40"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-sv-blue text-white transition-all hover:bg-sv-blue-deep disabled:opacity-40"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Chat Widget
// ---------------------------------------------------------------------------

export default function ChatWidget() {
  const {
    open,
    openChat: triggerOpen,
    closeChat,
    activeRoomId,
    setActiveRoom,
    rooms,
    loading,
    unread,
    totalUnread,
    pendingListingId,
    refreshRooms,
  } = useChat()

  // If there's a pending listing, create/get room and switch to it
  useEffect(() => {
    if (!open || !pendingListingId) return
    const listingId = pendingListingId
    // ponytail: optimistic — we don't reset pendingListingId immediately
    // to avoid double-firing. It's reset once we switch to the room.
    async function init() {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId }),
        })
        if (res.ok) {
          const data = await res.json()
          setActiveRoom(data.room?.id ?? null)
          refreshRooms()
        }
      } catch {
        // silent
      }
    }
    init()
  }, [open, pendingListingId, setActiveRoom, refreshRooms])

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => {
          if (open) closeChat()
          else triggerOpen()
        }}
        aria-label={open ? "დახურვა" : "ჩატი"}
        className="fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-sv-blue text-white shadow-glow-blue transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-orange active:scale-95"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-5 w-5" />
            </motion.span>
          ) : (
            <motion.span
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle className="h-5 w-5" />
            </motion.span>
          )}
        </AnimatePresence>
        {/* Unread badge */}
        {!open && totalUnread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-sv-orange px-1.5 text-[10px] font-black text-white">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease }}
            className="fixed bottom-24 right-6 z-50 flex h-[520px] max-h-[calc(100dvh-140px)] w-[380px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-card border border-sv-ink/[0.08] bg-sv-surface shadow-panel-dark md:bottom-6"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-sv-ink/[0.08] px-4 py-3">
              {activeRoomId ? (
                <button
                  onClick={() => setActiveRoom(null)}
                  aria-label="უკან"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-control text-sv-ink/60 transition-colors hover:bg-sv-ink/[0.06]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              ) : null}
              <h2 className="flex-1 text-[16px] font-black text-sv-ink">
                {activeRoomId
                  ? rooms.find((r) => r.id === activeRoomId)?.listing?.title ?? "ჩატი"
                  : "შეტყობინებები"}
              </h2>
              <button
                onClick={closeChat}
                aria-label="დახურვა"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-control text-sv-ink/60 transition-colors hover:bg-sv-ink/[0.06]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            {activeRoomId ? (
              <MessageThread roomId={activeRoomId} />
            ) : (
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                {loading && rooms.length === 0 && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-sv-blue" />
                  </div>
                )}
                {!loading && rooms.length === 0 && (
                  <p className="text-center text-[13px] font-medium text-sv-ink/40 py-12">
                    ჯერ ჩატები არ გაქვთ. იპოვეთ უძრავი ქონება და გაუგზავნეთ მესიჯი აგენტს.
                  </p>
                )}
                {rooms.map((room) => (
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
