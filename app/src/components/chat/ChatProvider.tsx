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
  lastMessage: { content: string; createdAt: string; senderId: string; kind: string } | null
}

interface ChatContextValue {
  /** Whether the chat panel is open */
  open: boolean
  /** Open the chat panel (optionally targeting a listing) */
  openChat: (listingId?: string) => void
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
  /** Pending listing ID (open chat for this listing when panel opens) */
  pendingListingId: string | null
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
  const [pendingListingId, setPendingListingId] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  /** Dedupes the listing→room effect across open/close cycles. */
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
      setPendingListingId(null)
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

  const openChat = useCallback((listingId?: string) => {
    if (listingId) setPendingListingId(listingId)
    setOpen(true)
  }, [])

  const closeChat = useCallback(() => {
    setOpen(false)
    setActiveRoomId(null)
    lastTargetRef.current = null
  }, [])

  // Panel opened with a listing target → get/create the room, jump into it.
  useEffect(() => {
    if (!open || !pendingListingId || lastTargetRef.current === pendingListingId) return
    const listingId = pendingListingId
    lastTargetRef.current = listingId
    ;(async () => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId }),
        })
        if (!res.ok) return
        const data = await res.json()
        if (data.room?.id) {
          setActiveRoomId(data.room.id)
          setRooms((prev) =>
            prev.some((r) => r.id === data.room.id)
              ? prev
              : [
                  {
                    id: data.room.id,
                    listingId: data.room.listingId ?? listingId,
                    title: data.room.title ?? "",
                    status: "active",
                    updatedAt: new Date().toISOString(),
                    listing: data.room.listing ?? null,
                    counterpart: null,
                    lastMessage: null,
                  },
                  ...prev,
                ],
          )
          refreshRooms()
        }
      } catch {
        // ponytail: reopening the listing retargets the panel
      }
    })()
  }, [open, pendingListingId, refreshRooms])

  return (
    <ChatContext.Provider
      value={{
        open,
        openChat,
        closeChat,
        activeRoomId,
        setActiveRoom: setActiveRoomId,
        rooms,
        loading,
        unread,
        totalUnread,
        refreshRooms,
        pendingListingId,
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
