"use client"

import { useEffect, type ReactNode } from "react"

const ORIGIN =
  typeof window === "undefined" ? "" : window.location.origin

type ParentMsg = { type: "cms:active"; section: string | null }

/**
 * Iframe-only overlay for the visual CMS. No-ops on the public site
 * (not framed, or missing ?cmsPreview=1) so it can sit in the lang layout
 * without dynamizing ISR.
 */
export function CmsPreviewBridge() {
  useEffect(() => {
    if (window.parent === window) return
    if (new URLSearchParams(window.location.search).get("cmsPreview") !== "1") return

    const root = document.documentElement
    root.dataset.cmsPreview = "1"

    const select = (section?: string, key?: string) => {
      window.parent.postMessage({ type: "cms:select", section, key }, ORIGIN)
    }

    const onClick = (e: MouseEvent) => {
      const t = e.target
      if (!(t instanceof Element)) return
      const keyEl = t.closest<HTMLElement>("[data-cms-key]")
      const secEl = t.closest<HTMLElement>("[data-cms-section]")
      if (keyEl || secEl) {
        e.preventDefault()
        e.stopPropagation()
        select(secEl?.dataset.cmsSection, keyEl?.dataset.cmsKey)
        return
      }
      // ponytail: block in-iframe navigation — page picker owns routing
      if (t.closest("a")) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== ORIGIN) return
      const data = e.data as ParentMsg
      if (!data || data.type !== "cms:active") return
      root.querySelectorAll("[data-cms-active]").forEach((n) => n.removeAttribute("data-cms-active"))
      if (data.section) {
        root
          .querySelector(`[data-cms-section="${CSS.escape(data.section)}"]`)
          ?.setAttribute("data-cms-active", "")
      }
    }

    document.addEventListener("click", onClick, true)
    window.addEventListener("message", onMessage)
    window.parent.postMessage({ type: "cms:ready" }, ORIGIN)
    return () => {
      document.removeEventListener("click", onClick, true)
      window.removeEventListener("message", onMessage)
      delete root.dataset.cmsPreview
    }
  }, [])

  return null
}

export function CmsSection({ id, children }: { id: string; children: ReactNode }) {
  return <div data-cms-section={id}>{children}</div>
}
