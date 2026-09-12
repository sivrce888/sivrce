/** OpenSearch description — lets browsers/assistants offer sivrce as a search engine.
 * Host-scoped: each domain points at its own /search (same platform, one search). */
import { hostKind, normalizeHostname, publicOriginKind } from '@/lib/site-host'
import { COM_ORIGIN, GE_ORIGIN } from '@/lib/markets'

export const revalidate = 86400

export function GET(req: Request) {
  const host = normalizeHostname(req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '')
  const onCom = publicOriginKind(hostKind(host)) === 'com'
  const origin = onCom ? COM_ORIGIN : GE_ORIGIN
  const desc = onCom
    ? 'Real estate worldwide — apartments, houses, land'
    : 'უძრავი ქონება საქართველოში — ბინები, სახლები, აგარაკები'
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
  <ShortName>sivrce</ShortName>
  <Description>${desc}</Description>
  <Url type="text/html" template="${origin}/search?q={searchTerms}"/>
  <Image height="32" width="32" type="image/png">${origin}/icons/favicon-32.png</Image>
  <InputEncoding>UTF-8</InputEncoding>
</OpenSearchDescription>`
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/opensearchdescription+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  })
}
