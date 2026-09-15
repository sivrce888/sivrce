import { NextResponse } from 'next/server'

export const dynamic = 'force-static'

/**
 * Apple App Site Association (https://sivrce.ge/apple-app-site-association)
 * for universal links into the Capacitor iOS app. APPLE_APP_ID is
 * "<TeamID>.ge.sivrce.app"; without it we publish an empty applinks list —
 * valid AASA, no verified links.
 */
export function GET() {
  const appId = process.env.APPLE_APP_ID
  return NextResponse.json({
    applinks: {
      details: appId ? [{ appIDs: [appId], components: [{ '/': '/*' }] }] : [],
    },
  })
}
