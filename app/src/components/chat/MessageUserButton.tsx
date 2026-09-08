"use client"

import { MessageCircle } from "lucide-react"
import { useSession } from "next-auth/react"
import { useI18n } from "@/lib/i18n/context"
import { useChat } from "@/components/chat/ChatProvider"

/**
 * "Message" button for /u/[id] profiles and company profile pages (agency /
 * developer owner) — opens (or creates) a direct user-to-user chat. Renders
 * only for signed-in visitors; guests keep the LeadForm conversion loop.
 */
export default function MessageUserButton({
  userId,
  className = "",
}: {
  userId: string
  /** Extra spacing at the call site (base button carries no margin). */
  className?: string
}) {
  const { status, data: session } = useSession()
  const { t } = useI18n()
  const { openChatWithUser } = useChat()

  const meId = session?.user?.id
  if (status !== "authenticated" || !meId || meId === userId) return null

  return (
    <button
      type="button"
      onClick={() => openChatWithUser(userId)}
      className={`inline-flex items-center gap-2 rounded-control bg-sv-blue px-4 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-sv-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 active:scale-[0.98] ${className}`}
    >
      <MessageCircle className="h-4 w-4" aria-hidden />
      {t("chat.message")}
    </button>
  )
}
