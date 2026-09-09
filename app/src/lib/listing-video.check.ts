/**
 * Runnable check: listing video URL sanitizer.
 * Run: npx tsx src/lib/listing-video.check.ts
 */
import assert from "node:assert/strict"
import {
  VIDEO_ACCEPT,
  extForVideoMime,
  listingVideoKind,
  listingVideoObject,
  looksLikeVideoBytes,
  mimeOfVideoFile,
  sanitizeListingVideoUrl,
  streamEmbedUrl,
  streamThumbnailUrl,
  streamUid,
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
assert.equal(extForVideoMime("video/x-m4v"), "m4v")
assert.equal(extForVideoMime("video/3gpp"), "3gp")
assert.equal(extForVideoMime("video/3gpp2"), "3g2")
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

const vid = (name: string, type = "") => ({ name, type }) as File
assert.equal(mimeOfVideoFile(vid("IMG_1234.MOV")), "video/quicktime")
assert.equal(mimeOfVideoFile(vid("clip.mov", "video/mp4")), "video/quicktime")
assert.equal(mimeOfVideoFile(vid("tour.M4V")), "video/x-m4v")
assert.equal(mimeOfVideoFile(vid("clip.3gp")), "video/3gpp")
assert.equal(mimeOfVideoFile(vid("clip.3g2")), "video/3gpp2")
assert.equal(mimeOfVideoFile(vid("noext", "video/mp4")), "video/mp4")
assert.equal(mimeOfVideoFile(vid("evil.avi", "video/avi")), "")
assert.ok(VIDEO_ACCEPT.includes(".m4v") && VIDEO_ACCEPT.includes(".3gp"))

assert.equal(
  listingVideoKind("https://cdn.sivrce.ge/uploads/2026/09/x.m4v"),
  "file",
)
assert.equal(listingVideoKind("https://cdn.sivrce.ge/uploads/2026/09/x.mkv"), null)
assert.equal(listingVideoKind("https://cdn.sivrce.ge/uploads/2026/09/x.avi"), null)

const UID = "3f4b2c1a9b2e4c3d8f1a2b3c4d5e6f7a"
assert.equal(streamUid(`https://iframe.videodelivery.net/${UID}`), UID)
assert.equal(streamUid(`https://videodelivery.net/${UID}/manifest/video.m3u8`), UID)
assert.equal(streamUid("https://evil.com/iframe.videodelivery.net/x"), null)
assert.equal(streamUid("https://iframe.videodelivery.net/short"), null)
assert.equal(streamUid("javascript:alert(1)"), null)
assert.equal(listingVideoKind(streamEmbedUrl(UID)), "stream")
assert.equal(sanitizeListingVideoUrl(streamEmbedUrl(UID)), streamEmbedUrl(UID))
assert.equal(
  streamThumbnailUrl(UID),
  `https://videodelivery.net/${UID}/thumbnails/thumbnail.jpg`,
)
const stLd = listingVideoObject(streamEmbedUrl(UID), {
  name: "Stream tour",
  description: "Encoded tour",
  poster: "/images/og-brand.png",
  uploadDate: "2026-09-01T00:00:00Z",
})
assert.equal(stLd?.embedUrl, streamEmbedUrl(UID))
assert.equal(stLd?.thumbnailUrl, streamThumbnailUrl(UID))
assert.ok(!stLd?.contentUrl)

console.log("listing-video.check: ok")
