'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

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
