"use client"

import { useEffect, useState } from "react"
import ChatProvider from "./ChatProvider"
import ChatWidget from "./ChatWidget"

/**
 * Client shell that wraps the app with ChatProvider.
 * Only renders ChatWidget when the user is authenticated.
 * ponytail: checks session via /api/auth/session endpoint.
 */
export default function ChatShell({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // ponytail: quick session check; if the user has a session cookie,
    // the chat widget appears. For guest users it stays hidden.
    async function check() {
      try {
        const res = await fetch("/api/auth/session")
        if (res.ok) {
          const data = await res.json()
          setAuthenticated(!!data?.user)
        }
      } catch {
        // not authenticated
      } finally {
        setChecked(true)
      }
    }
    check()
  }, [])

  return (
    <ChatProvider>
      {children}
      {checked && authenticated && <ChatWidget />}
    </ChatProvider>
  )
}
