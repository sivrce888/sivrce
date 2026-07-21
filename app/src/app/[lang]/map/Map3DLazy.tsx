'use client'

import dynamic from 'next/dynamic'
import { STATUS_BRAND } from '@/lib/category-brand'

/** Navy shell before MapLibre chunk — matches /map chrome; no GL until idle. */
function MapLoadingShell() {
  return (
    <div
      className="relative grid h-[calc(100dvh-4.5rem)] place-items-center overflow-hidden bg-sv-navy md:h-[calc(100dvh-5rem)]"
      role="status"
      aria-live="polite"
      aria-label="3D რუკა იტვირთება"
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
      <div
        aria-hidden
        className="absolute left-1/2 top-[42%] h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-sm opacity-80 shadow-glow-blue"
        style={{ background: STATUS_BRAND.construction.hue }}
      />
      <p className="relative z-[1] text-[14px] font-bold text-white/70">3D რუკა იტვირთება…</p>
    </div>
  )
}

export const Map3DLazy = dynamic(() => import('@/components/map/Map3D'), {
  ssr: false,
  loading: () => <MapLoadingShell />,
})
