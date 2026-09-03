'use client'

import dynamic from 'next/dynamic'
import MobileDock from '@/components/MobileDock'

const CompareTray = dynamic(() => import('@/components/compare/CompareTray'), { ssr: false })

/**
 * Client shell for app-wide trays.
 * ponytail: ChatWidget parked — Message CTA uses LeadForm. Re-enable when
 * realtime chat is a product decision (auth + owner reply loop), not a bubble.
 */
export default function ChatShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <MobileDock />
      <CompareTray />
    </>
  )
}
