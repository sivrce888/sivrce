'use client'

import dynamic from 'next/dynamic'
import MobileDock from '@/components/MobileDock'
import ChatProvider from '@/components/chat/ChatProvider'

const CompareTray = dynamic(() => import('@/components/compare/CompareTray'), { ssr: false })
const ChatWidget = dynamic(() => import('@/components/chat/ChatWidget'), { ssr: false })

/**
 * Client shell for app-wide trays. Chat ships for everyone: signed-in users
 * get rooms + support line; guests get the offline help assistant (FaqView
 * is client-only, zero server cost) — its "Message us" CTA routes to sign-in.
 */
export default function ChatShell({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider>
      {children}
      <MobileDock />
      <CompareTray />
      <ChatWidget />
    </ChatProvider>
  )
}
