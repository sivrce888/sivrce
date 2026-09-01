/**
 * Runnable check: listing video URL sanitizer.
 * Run: npx tsx src/lib/listing-video.check.ts
 */
import assert from "node:assert/strict"
import {
  extForVideoMime,
  listingVideoKind,
  listingVideoObject,
  looksLikeVideoBytes,
  sanitizeListingVideoUrl,
  youtubeId,
  youtubePoster,
} from "./listing-video"

assert.equal(youtubeId("https://youtu.be/dQw4w9wgGcQ"), "dQw4w9wgGcQ")
assert.equal(youtubeId("https://www.youtube.com/watch?v=dQw4w9wgGcQ"), "dQw4w9wgGcQ")
assert.equal(youtubeId("https://youtube.com/shorts/dQw4w9wgGcQ"), "dQw4w9wgGcQ")
assert.equal(youtubeId("https://www.youtube.com/embed/dQw4w9wgGcQ"), "dQw4w9wgGcQ")
assert.equal(youtubeId("javascript:alert(1)"), null)
assert.equal(youtubeId("https://evil.com/watch?v=dQw4w9wgGcQ"), null)

assert.equal(
  listingVideoKind("https://cdn.sivrce.ge/uploads/2026/09/3f4b2c1a-9b2e-4c3d-8f1a-2b3c4d5e6f7a.mp4"),
  "file",
)
assert.equal(listingVideoKind("https://cdn.sivrce.ge/uploads/2026/09/x.webp"), null)
assert.equal(listingVideoKind("https://evil.com/uploads/x.mp4"), null)
assert.equal(listingVideoKind("https://youtu.be/dQw4w9wgGcQ"), "youtube")

assert.equal(sanitizeListingVideoUrl("javascript:alert(1)"), null)
assert.equal(sanitizeListingVideoUrl("https://youtu.be/dQw4w9wgGcQ"), "https://youtu.be/dQw4w9wgGcQ")
assert.equal(sanitizeListingVideoUrl(""), null)
assert.equal(sanitizeListingVideoUrl("https://example.com/a.mp4"), null)

assert.equal(extForVideoMime("video/webm"), "webm")
assert.equal(extForVideoMime("video/quicktime"), "mov")
assert.equal(youtubePoster("dQw4w9wgGcQ"), "https://i.ytimg.com/vi/dQw4w9wgGcQ/hqdefault.jpg")

const ftyp = new Uint8Array(12)
ftyp.set([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d])
assert.equal(looksLikeVideoBytes(ftyp), true)
const webm = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0, 0, 0, 0, 0])
assert.equal(looksLikeVideoBytes(webm), true)
assert.equal(looksLikeVideoBytes(new Uint8Array(12)), false)

const ytLd = listingVideoObject("https://youtu.be/dQw4w9wgGcQ", {
  name: "Test",
  description: "A tour",
  poster: "/images/og-brand.png",
  uploadDate: "2026-09-01T00:00:00Z",
})
assert.equal(ytLd?.["@type"], "VideoObject")
assert.equal(ytLd?.embedUrl, "https://www.youtube-nocookie.com/embed/dQw4w9wgGcQ")
assert.ok(!ytLd?.contentUrl)
assert.equal(listingVideoObject("https://evil.com/x.mp4", {
  name: "x", description: "x", poster: "/x.jpg", uploadDate: "2026-01-01",
}), null)

console.log("listing-video.check: ok")
