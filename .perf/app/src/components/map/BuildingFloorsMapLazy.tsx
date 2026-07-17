'use client'

import dynamic from 'next/dynamic'

export const BuildingFloorsMapLazy = dynamic(
  () => import('@/components/map/BuildingFloorsMap'),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full w-full place-items-center bg-sv-navy text-[13px] font-bold text-white/70">
        3D ხედი იტვირთება…
      </div>
    ),
  },
)
