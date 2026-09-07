'use client'

import dynamic from 'next/dynamic'
import { useI18n } from '@/lib/i18n/context'

function LazyLoading() {
  const { t } = useI18n()
  return (
    <div className="grid h-full w-full place-items-center bg-sv-navy text-[13px] font-bold text-white/70">
      {t('map.loading')}
    </div>
  )
}

export const BuildingFloorsMapLazy = dynamic(() => import('@/components/map/BuildingFloorsMap'), {
  ssr: false,
  loading: () => <LazyLoading />,
})
