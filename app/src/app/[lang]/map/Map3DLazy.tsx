'use client'

import dynamic from 'next/dynamic'
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
