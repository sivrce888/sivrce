import { llmsFullTxt } from '@/lib/llms-txt'
import { hostKind, publicOriginKind } from '@/lib/site-host'

export const revalidate = 86400

export function GET(req: Request) {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || ''
  const catalog = publicOriginKind(hostKind(host, process.env.VERCEL_ENV))
  return new Response(llmsFullTxt(catalog), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  })
}
