/** RFC 9116 — security contact for researchers and crawlers. */
export const revalidate = 86400

const BODY = `Contact: mailto:hi@sivrce.ge
Expires: 2027-09-01T00:00:00.000Z
Preferred-Languages: ka, en
Canonical: https://sivrce.ge/.well-known/security.txt
Policy: https://sivrce.ge/privacy
Hiring: https://sivrce.ge/careers
`

export function GET() {
  return new Response(BODY, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  })
}
