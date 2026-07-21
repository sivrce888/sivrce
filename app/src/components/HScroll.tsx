'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { scrollEdges } from '@/lib/h-scroll'
import { useI18n } from '@/lib/i18n/context'

type Props = {
  children: ReactNode
  className?: string
  /** Scroll distance per arrow click. Default: ~80% of viewport. */
  step?: number
  /** sm = stories / chips; md = listing cards (default). */
  size?: 'sm' | 'md'
  'aria-label'?: string
}

/**
 * Horizontal rail: no scrollbar, side arrows, mouse-drag.
 * Touch = native overflow. Arrows stay mounted (fade) once overflow exists.
 * md arrows pin to first card's media midline (not full-card mid).
 */
export default function HScroll({
  children,
  className = '',
  step,
  size = 'md',
  'aria-label': ariaLabel,
}: Props) {
  const { t } = useI18n()
  const wrapRef = useRef<HTMLDivElement>(null)
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; left: number; moved: boolean; id: number } | null>(null)
  const suppressClick = useRef(false)
  const [edges, setEdges] = useState({ canL: false, canR: false })
  const [overflow, setOverflow] = useState(false)
  // ponytail: null until measure; CSS fallback top-[7.5rem] for 4/3 cards
  const [arrowY, setArrowY] = useState<number | null>(null)

  const update = useCallback(() => {
    const el = ref.current
    const wrap = wrapRef.current
    if (!el) return
    const next = scrollEdges(el.scrollLeft, el.clientWidth, el.scrollWidth)
    setEdges(next)
    setOverflow(next.canL || next.canR || el.scrollWidth > el.clientWidth + 2)

    if (size === 'sm' || !wrap) return
    const card = el.firstElementChild as HTMLElement | null
    const media =
      card?.querySelector<HTMLElement>('img, video, [class*="aspect-"]') ?? card
    if (!media) return
    const wr = wrap.getBoundingClientRect()
    const mr = media.getBoundingClientRect()
    if (mr.height < 8) return
    setArrowY(Math.round(mr.top - wr.top + mr.height / 2))
  }, [size])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    const first = el.firstElementChild
    if (first instanceof HTMLElement) ro.observe(first)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [update, children])

  const scrollBy = (dir: -1 | 1) => {
    const el = ref.current
    if (!el) return
    const amount = step ?? Math.max(240, Math.round(el.clientWidth * 0.8))
    const rtl = getComputedStyle(el).direction === 'rtl'
    el.scrollBy({ left: (rtl ? -dir : dir) * amount, behavior: 'smooth' })
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // ponytail: mouse-only; capture only after drag threshold so links stay clickable
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    const el = ref.current
    if (!el) return
    drag.current = { x: e.clientX, left: el.scrollLeft, moved: false, id: e.pointerId }
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    const el = ref.current
    if (!d || !el || d.id !== e.pointerId) return
    const dx = e.clientX - d.x
    if (!d.moved && Math.abs(dx) > 4) {
      d.moved = true
      el.setPointerCapture(e.pointerId)
      el.classList.add('select-none')
    }
    if (d.moved) el.scrollLeft = d.left - dx
  }

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    const el = ref.current
    if (!d || d.id !== e.pointerId) return
    if (d.moved) {
      suppressClick.current = true
      el?.classList.remove('select-none')
      if (el?.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
    }
    drag.current = null
  }

  const onClickCapture = (e: React.MouseEvent) => {
    if (!suppressClick.current) return
    suppressClick.current = false
    e.preventDefault()
    e.stopPropagation()
  }

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      scrollBy(-1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      scrollBy(1)
    }
  }

  const sm = size === 'sm'
  const btnBase = sm
    ? 'absolute top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-sv-ink/10 bg-sv-surface/95 text-sv-ink shadow-card backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.21,0.65,0.2,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2'
    : `absolute z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-sv-ink/10 bg-sv-surface/95 text-sv-ink shadow-card backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.21,0.65,0.2,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2 ${arrowY == null ? 'top-[7.5rem]' : ''}`
  const btnOn = 'opacity-100 hover:scale-105 hover:border-sv-blue hover:text-sv-blue hover:shadow-card-hover active:scale-95'
  const btnOff = 'pointer-events-none opacity-0'
  const icon = sm ? 'h-4 w-4' : 'h-5 w-5'
  const btnStyle = !sm && arrowY != null ? { top: arrowY } : undefined

  // Edge fade only on the side that still has content
  const mask =
    edges.canL && edges.canR
      ? 'linear-gradient(to right, transparent, black 2rem, black calc(100% - 2rem), transparent)'
      : edges.canL
        ? 'linear-gradient(to right, transparent, black 2rem, black 100%)'
        : edges.canR
          ? 'linear-gradient(to right, black 0%, black calc(100% - 2rem), transparent)'
          : undefined

  return (
    <div ref={wrapRef} className="relative">
      {overflow ? (
        <>
          <button
            type="button"
            aria-label={t('search.prev')}
            disabled={!edges.canL}
            onClick={() => scrollBy(-1)}
            style={btnStyle}
            className={`${btnBase} left-3 md:left-5 ${edges.canL ? btnOn : btnOff}`}
          >
            <ChevronLeft className={icon} />
          </button>
          <button
            type="button"
            aria-label={t('search.next')}
            disabled={!edges.canR}
            onClick={() => scrollBy(1)}
            style={btnStyle}
            className={`${btnBase} right-3 md:right-5 ${edges.canR ? btnOn : btnOff}`}
          >
            <ChevronRight className={icon} />
          </button>
        </>
      ) : null}
      <div
        ref={ref}
        role="region"
        tabIndex={0}
        aria-label={ariaLabel}
        style={mask ? { WebkitMaskImage: mask, maskImage: mask } : undefined}
        className={`scrollbar-hide flex items-stretch cursor-grab overflow-x-auto overscroll-x-contain active:cursor-grabbing ${className}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        onKeyDown={onKeyDown}
      >
        {children}
      </div>
    </div>
  )
}
