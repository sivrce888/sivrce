"use client"

import { useEffect, useRef } from "react"

/**
 * Auto-growing textarea for the browsers our baseline still supports.
 * `field-sizing: content` does this natively on Chrome 123+ / Safari 17.4+,
 * but package.json targets Chrome 111 / Safari 16.4 — there the property is
 * ignored and the box would never grow past one line. Measure only when the
 * native property is missing, so modern devices pay nothing.
 */
export function useAutoGrow(value: string, maxPx: number) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof CSS !== "undefined" && CSS.supports?.("field-sizing", "content")) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, maxPx)}px`
  }, [value, maxPx])

  return ref
}
