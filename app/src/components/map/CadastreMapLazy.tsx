'use client'

import dynamic from 'next/dynamic'

/** No GL until mounted — navy boot shell matches /map chrome in both themes. */
export const CadastreMapLazy = dynamic(() => import('./CadastreMap'), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center bg-sv-navy" role="status" aria-live="polite">
      <span className="sv-spinner sv-spinner-light" aria-hidden />
    </div>
  ),
})
