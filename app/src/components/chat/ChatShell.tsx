"use client"

import CompareTray from "@/components/compare/CompareTray"

/**
 * Client shell for app-wide trays.
 * ponytail: ChatWidget parked — Message CTA uses LeadForm. Re-enable when
 * realtime chat is a product decision (auth + owner reply loop), not a bubble.
 */
export default function ChatShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CompareTray />
    </>
  )
}
