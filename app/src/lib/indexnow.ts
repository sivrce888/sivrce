/**
 * IndexNow — instant Bing / Yandex / Seznam / Google ingest on publish.
 * ponytail: fire-and-forget POST. Key file lives at /{INDEXNOW_KEY}.txt.
 */

export const INDEXNOW_KEY = "a8f3c91e2b7d4e6a9c1f0d5b8e4a7c2d"
export const INDEXNOW_HOST = "sivrce.ge"
export const INDEXNOW_KEY_URL = `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`

export function listingIndexUrl(id: string): string {
  return `https://${INDEXNOW_HOST}/listing/${id}`
}

export function notifyIndexNow(urls: string[]): void {
  const urlList = urls
    .filter((u) => u.startsWith(`https://${INDEXNOW_HOST}/`))
    .slice(0, 10)
  if (!urlList.length) return
  void fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: INDEXNOW_HOST,
      key: INDEXNOW_KEY,
      keyLocation: INDEXNOW_KEY_URL,
      urlList,
    }),
  }).catch(() => {})
}
