"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useSession } from "next-auth/react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatCounterpartInfo {
  id: string
  name: string | null
  image: string | null
  avatarStyle: number | null
  avatarColor: string | null
  avatarIcon: string | null
}

export interface ChatRoom {
  id: string
  listingId: string | null
  title: string
  status: string
  updatedAt: string
  listing: { id: string; title: string } | null
  counterpart: ChatCounterpartInfo | null
  /** sivrce support line — branded header instead of the counterpart name */
  isSupport: boolean
  lastMessage: { content: string; createdAt: string; senderId: string; kind: string } | null
}

/** What a pending open should create/jump into once the panel is up. */
type ChatTarget =
  | { kind: "listing"; id: string }
  | { kind: "user"; id: string }
  | { kind: "support" }

interface ChatContextValue {
  /** Whether the chat panel is open */
  open: boolean
  /** Open the chat panel (optionally targeting a listing) */
  openChat: (listingId?: string) => void
  /** Open (or create) a direct chat with another user */
  openChatWithUser: (userId: string) => void
  /** Open (or create) the sivrce support line */
  openSupportChat: () => void
  /** Close the chat panel */
  closeChat: () => void
  /** Currently active room ID */
  activeRoomId: string | null
  /** Set the active room */
  setActiveRoom: (roomId: string | null) => void
  /** Chat rooms list */
  rooms: ChatRoom[]
  /** True until the first rooms fetch lands */
  loading: boolean
  /** Unread counts per room */
  unread: Record<string, number>
  /** Total unread count */
  totalUnread: number
  /** Refresh rooms + unread */
  refreshRooms: () => Promise<void>
  /** Pending target (open the panel onto this room when it opens) */
  pendingTarget: ChatTarget | null
  /** Signed-in user's id — own vs peer message routing */
  meId: string | null
}

const ChatContext = createContext<ChatContextValue | null>(null)

const POLL_MS = 15_000

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export default function ChatProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const meId = session?.user?.id ?? null
  const authed = status === "authenticated" && !!meId

  const [open, setOpen] = useState(false)
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [unread, setUnread] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [pendingTarget, setPendingTarget] = useState<ChatTarget | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  /** Dedupes the target→room effect across open/close cycles. */
  const lastTargetRef = useRef<string | null>(null)

  const refreshRooms = useCallback(async () => {
    try {
      const res = await fetch("/api/chat")
      if (!res.ok) return
      const data = await res.json()
      setRooms(data.rooms ?? [])
      setUnread(data.unread ?? {})
    } catch {
      // ponytail: badge/list catch up on the next tick — no error surface
    } finally {
      setLoading(false)
    }
  }, [])

  // Single light poll keeps the launcher badge live everywhere — even with
  // the panel closed. Paused while the tab is hidden.
  useEffect(() => {
    if (!authed) return
    const tick = () => {
      if (!document.hidden) refreshRooms()
    }
    tick()
    pollRef.current = setInterval(tick, POLL_MS)
    document.addEventListener("visibilitychange", tick)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      document.removeEventListener("visibilitychange", tick)
    }
  }, [authed, refreshRooms])

  // Reset when signed out (async so the lint-blessed batch lands off-render)
  useEffect(() => {
    if (status !== "unauthenticated") return
    const t = setTimeout(() => {
      setRooms([])
      setUnread({})
      setLoading(true)
      setOpen(false)
      setActiveRoomId(null)
      setPendingTarget(null)
    }, 0)
    return () => clearTimeout(t)
  }, [status])

  // "(n)" tab-title flash while the tab is hidden — restored on focus
  const totalUnread = useMemo(
    () => Object.values(unread).reduce((a, b) => a + b, 0),
    [unread],
  )
  useEffect(() => {
    if (!document.hidden || totalUnread === 0) return
    const base = document.title
    document.title = `(${totalUnread}) ${base}`
    const restore = () => {
      if (!document.hidden) document.title = base
    }
    document.addEventListener("visibilitychange", restore)
    return () => {
      document.removeEventListener("visibilitychange", restore)
      if (document.title === `(${totalUnread}) ${base}`) document.title = base
    }
  }, [totalUnread])

  const openTarget = useCallback((target: ChatTarget) => {
    setPendingTarget(target)
    setOpen(true)
  }, [])

  const openChat = useCallback(
    (listingId?: string) => {
      if (listingId) openTarget({ kind: "listing", id: listingId })
      else setOpen(true)
    },
    [openTarget],
  )
  const openChatWithUser = useCallback(
    (userId: string) => openTarget({ kind: "user", id: userId }),
    [openTarget],
  )
  const openSupportChat = useCallback(() => openTarget({ kind: "support" }), [openTarget])

  const closeChat = useCallback(() => {
    setOpen(false)
    setActiveRoomId(null)
    lastTargetRef.current = null
  }, [])

  // Panel opened with a target → get/create the room, jump into it. The
  // target is consumed once resolved so a later plain open lands on the list.
  useEffect(() => {
    if (!open || !pendingTarget) return
    const target = pendingTarget
    const key = target.kind === "support" ? "support" : target.id
    if (lastTargetRef.current === key) return
    lastTargetRef.current = key
    const body =
      target.kind === "listing"
        ? { listingId: target.id }
        : target.kind === "user"
          ? { userId: target.id }
          : { support: true }
    ;(async () => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) return
        const data = await res.json()
        setPendingTarget(null)
        if (data.room?.id) {
          setActiveRoomId(data.room.id)
          setRooms((prev) =>
            prev.some((r) => r.id === data.room.id)
              ? prev
              : [
                  {
                    id: data.room.id,
                    listingId: data.room.listingId ?? null,
                    title: data.room.title ?? "",
                    status: "active",
                    updatedAt: new Date().toISOString(),
                    listing: data.room.listing ?? null,
                    counterpart: null,
                    isSupport: target.kind === "support",
                    lastMessage: null,
                  },
                  ...prev,
                ],
          )
          refreshRooms()
        }
      } catch {
        // ponytail: reopening the target retargets the panel
      }
    })()
  }, [open, pendingTarget, refreshRooms])

  return (
    <ChatContext.Provider
      value={{
        open,
        openChat,
        openChatWithUser,
        openSupportChat,
        closeChat,
        activeRoomId,
        setActiveRoom: setActiveRoomId,
        rooms,
        loading,
        unread,
        totalUnread,
        refreshRooms,
        pendingTarget,
        meId,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error("useChat must be used within ChatProvider")
  return ctx
}
