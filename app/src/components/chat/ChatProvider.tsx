"use client"

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatRoom {
  id: string
  listingId: string | null
  title: string
  status: string
  listing?: { title: string; id: string } | null
  participants: { userId: string; role: string; lastReadAt: string | null }[]
  messages?: { content: string; createdAt: string; senderId: string; kind: string }[]
}

export interface ChatMessage {
  id: string
  roomId: string
  senderId: string
  content: string
  kind: string
  metadata?: Record<string, unknown>
  createdAt: string
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
  /** Loading state */
  loading: boolean
  /** Unread counts per room */
  unread: Record<string, number>
  /** Total unread count */
  totalUnread: number
  /** Refresh rooms list */
  refreshRooms: () => Promise<void>
  /** Pending listing ID (open chat for this listing when panel opens) */
  pendingListingId: string | null
}

const ChatContext = createContext<ChatContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export default function ChatProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState<Record<string, number>>({})
  const [pendingListingId, setPendingListingId] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refreshRooms = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/chat")
      if (!res.ok) return
      const data = await res.json()
      setRooms(data.rooms ?? [])
    } catch {
      // ponytail: silently fail on network issues
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshUnread = useCallback(async () => {
    if (rooms.length === 0) return
    try {
      // ponytail: compute unread from last message vs lastReadAt client-side
      const counts: Record<string, number> = {}
      for (const room of rooms) {
        const lastMsg = room.messages?.[0]
        if (!lastMsg) continue
        const participant = room.participants?.find(() => true)
        const lastRead = participant?.lastReadAt
        if (!lastRead || new Date(lastMsg.createdAt) > new Date(lastRead)) {
          // ponytail: approximate — fetch individual counts from API
          try {
            const r = await fetch(`/api/chat/${room.id}`)
            if (r.ok) {
              const d = await r.json()
              counts[room.id] = d.messages?.length ?? 0
            }
          } catch {
            // skip
          }
        }
      }
      setUnread(counts)
    } catch {
      // silent
    }
  }, [rooms])

  // Load rooms when panel opens
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch, state lands after await
      refreshRooms()
    }
  }, [open, refreshRooms])

  // Poll for unread counts
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch, state lands after await
      refreshUnread()
      pollRef.current = setInterval(refreshUnread, 10_000)
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [open, refreshUnread])

  const openChat = useCallback((listingId?: string) => {
    if (listingId) setPendingListingId(listingId)
    setOpen(true)
  }, [])

  const closeChat = useCallback(() => {
    setOpen(false)
    setActiveRoomId(null)
  }, [])

  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0)

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
