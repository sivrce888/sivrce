/**
 * Official B-Plan PDF URL allow-list. Client-safe — no WFS fetchers.
 * Keep in sync with live GDI / GIS-Broker hosts only.
 */

export function officialBplanPdf(raw: unknown): string | null {
  const s = String(raw ?? '').trim()
  if (!s) return null
  try {
    const u = new URL(s)
    if (u.protocol !== 'https:') return null
    const h = u.hostname.toLowerCase()
    if (
      !(
        h === 'berlin.de' ||
        h.endsWith('.berlin.de') ||
        h === 'stadt-berlin.de' ||
        h.endsWith('.stadt-berlin.de') ||
        h === 'gis-broker.de' ||
        h.endsWith('.gis-broker.de')
      )
    )
      return null
    return u.href
  } catch {
    return null
  }
}
