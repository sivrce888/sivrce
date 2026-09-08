'use client'

import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import MobileDock from '@/components/MobileDock'
import ChatProvider from '@/components/chat/ChatProvider'

const CompareTray = dynamic(() => import('@/components/compare/CompareTray'), { ssr: false })
const ChatWidget = dynamic(() => import('@/components/chat/ChatWidget'), { ssr: false })

/**
 * Client shell for app-wide trays. Chat ships only for signed-in users —
 * guests keep the LeadForm conversion loop.
 * ponytail: guests could get the FAQ-only assistant view (FaqView is
 * auth-free) — flip when funnel data justifies touching the lead loop.
 */
export default function ChatShell({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  return (
    <ChatProvider>
      {children}
      <MobileDock />
      <CompareTray />
      {status === 'authenticated' && <ChatWidget />}
    </ChatProvider>
  )
}
