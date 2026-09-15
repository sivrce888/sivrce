import { NextResponse } from 'next/server'

export const dynamic = 'force-static'

/**
 * Android App Links statement (https://sivrce.ge/.well-known/assetlinks.json).
 * Cert fingerprints come from the Play signing key via env:
 *   ANDROID_CERT_SHA256S   — comma-separated SHA-256 fingerprints
 *   ANDROID_PACKAGE_NAME   — defaults to the Capacitor appId
 * Without fingerprints we publish an empty statement: valid JSON, no
 * verified links, nothing for Play Console to reject.
 */
export function GET() {
  const fingerprints = (process.env.ANDROID_CERT_SHA256S ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (fingerprints.length === 0) return NextResponse.json([])

  const package_name = process.env.ANDROID_PACKAGE_NAME ?? 'ge.sivrce.app'
  return NextResponse.json(
    fingerprints.map((sha256_cert_fingerprint) => ({
      relation: ['delegate_permission/common.handle_all_urls'],
      target: { namespace: 'android_app', package_name, sha256_cert_fingerprints: [sha256_cert_fingerprint] },
    })),
  )
}
