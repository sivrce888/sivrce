'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import { GA_ID, GTM_ID } from '@/lib/analytics'
import { isLiteDevice } from '@/lib/device-budget'

/** Skip GTM/GA on lite; otherwise idle so tags never contend with first paint. */
export function GoogleTags() {
  const [on, setOn] = useState(false)

  useEffect(() => {
    if (isLiteDevice()) return
    const boot = () => setOn(true)
    const ric = window.requestIdleCallback?.(boot, { timeout: 4000 })
    if (ric == null) {
      const t = window.setTimeout(boot, 2500)
      return () => window.clearTimeout(t)
    }
    return () => window.cancelIdleCallback?.(ric)
  }, [])

  if (!on) return null
  return (
    <>
      <Script id="gtm" strategy="lazyOnload">{`
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${GTM_ID}');
      `}</Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="lazyOnload"
      />
      <Script id="ga-config" strategy="lazyOnload">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', '${GA_ID}');
      `}</Script>
      <GoogleAnalytics />
    </>
  )
}
