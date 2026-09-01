import { INDEXNOW_KEY } from "@/lib/indexnow"

/** IndexNow key file — https://sivrce.ge/{key}.txt */
export function GET() {
  return new Response(INDEXNOW_KEY, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=86400",
    },
  })
}
