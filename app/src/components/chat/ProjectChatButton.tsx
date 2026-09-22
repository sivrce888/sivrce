"use client"

import { MessagesSquare } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

import { useChat } from "@/components/chat/ChatProvider"

/**
 * Buyer ↔ developer chat entry on project pages. Signed-out taps go to
 * sign-in with a return; rooms that cannot open (unclaimed project, block)
 * fall back to the on-page lead form — the tap never does nothing.
 */
export function ProjectChatButton({ projectSlug, label }: { projectSlug: string; label: string }) {
  const { status } = useSession()
  const { openChatWithProject } = useChat()
  const router = useRouter()

  const onClick = () => {
    if (status !== "authenticated") {
      const here = window.location.pathname + "#contact"
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(here)}`)
      return
    }
    openChatWithProject(projectSlug)
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-12 items-center gap-2 rounded-full border border-sv-blue px-6 text-[14px] font-bold text-sv-blue transition hover:bg-sv-blue/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue"
    >
      <MessagesSquare size={16} strokeWidth={2.4} aria-hidden />
      {label}
    </button>
  )
}
