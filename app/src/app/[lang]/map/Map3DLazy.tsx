'use client'

import dynamic from 'next/dynamic'

export const Map3DLazy = dynamic(() => import('@/components/map/Map3D'), {
  ssr: false,
  loading: () => (
    <div className="grid h-[calc(100dvh-4.5rem)] place-items-center bg-sv-navy text-[14px] font-bold text-white/70">
      3D რუკა იტვირთება…
    </div>
  ),
})
