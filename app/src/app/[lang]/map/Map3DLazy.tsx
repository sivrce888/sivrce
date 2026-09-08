'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState, type ComponentProps } from 'react'
import { useI18n } from '@/lib/i18n/context'

/** Navy shell before MapLibre chunk — matches /map chrome; no GL until idle. */
function MapLoadingShell() {
  const { t } = useI18n()
  return (
    <div
      className="relative grid h-full min-h-[50dvh] place-items-center overflow-hidden bg-sv-navy"
      role="status"
      aria-live="polite"
      aria-label={t('map.loading')}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.28]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(143,180,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(143,180,255,0.14) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="relative z-[1] flex flex-col items-center gap-3">
        <span className="sv-spinner sv-spinner-light" aria-hidden />
        <p className="text-[14px] font-bold text-white/70">{t('map.loading')}</p>
      </div>
    </div>
  )
}

export const Map3DLazy = dynamic(() => import('@/components/map/Map3D'), {
  ssr: false,
  loading: () => <MapLoadingShell />,
})

/**
 * GL parse+init is a multi-second main-thread task on phones — mount it only
 * once the browser is idle (or on first tap). Page chrome paints and turns
 * interactive first; ponytail: single idle gate, per-layer lazy load if map grows.
 */
export function Map3DIdle(props: ComponentProps<typeof Map3DLazy>) {
  const [go, setGo] = useState(false)
  useEffect(() => {
    const start = () => setGo(true)
    // ponytail: rIC missing → 400ms timer; timeout caps worst-case wait at 8s
    const ric: typeof requestIdleCallback =
      window.requestIdleCallback ??
      ((cb) => setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 0 }), 400))
    const ricId = ric(start, { timeout: 8000 })
    window.addEventListener('pointerdown', start, { once: true, passive: true })
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(ricId)
      window.removeEventListener('pointerdown', start)
    }
  }, [])
  if (!go) return <MapLoadingShell />
  return <Map3DLazy {...props} />
}
