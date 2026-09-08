'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { isLiteDevice } from '@/lib/device-budget'

/**
 * Fires once when the element scrolls into view (with a margin, like
 * framer's viewport margin). Powers [data-reveal] CSS animations — zero
 * animation library on the critical path.
 */
export function useInViewOnce<T extends Element>(margin = '-80px') {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin: margin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [inView, margin])
  return { ref, inView }
}

interface RevealProps {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}

export function Reveal({ children, delay = 0, y = 28, className }: RevealProps) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>()
  return (
    <div
      ref={ref}
      data-reveal
      data-in={inView || undefined}
      className={className}
      style={{ '--reveal-y': `${y}px`, '--reveal-delay': `${delay}s` } as CSSProperties}
    >
      {children}
    </div>
  )
}

const enUS = (n: number) => n.toLocaleString('en-US')
const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3)

/**
 * Odometer count-up once in view (dub.co NumberFlow pattern). The final value
 * is what SSR renders — crawlers, no-JS and the pre-hydration paint all see
 * it, zero CLS. Lite devices and reduced-motion users skip straight to it.
 */
export function CountUp({
  value,
  format = enUS,
  duration = 700,
}: {
  value: number
  format?: (n: number) => string
  duration?: number
}) {
  const { ref, inView } = useInViewOnce<HTMLSpanElement>('-40px')
  const [text, setText] = useState(() => format(value))
  const played = useRef(false)

  useEffect(() => {
    if (!inView || played.current) return
    played.current = true
    if (isLiteDevice() || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t0 = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min((t - t0) / duration, 1)
      setText(format(Math.round(value * easeOutCubic(p))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, format, duration])

  return <span ref={ref}>{text}</span>
}
