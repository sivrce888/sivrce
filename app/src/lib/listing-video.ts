/**
 * Listing video: native CDN file or YouTube. One URL in extendedFields.video.
 * ponytail: no transcode — R2 serves the original. HLS/Stream when bitrate complaints land.
 * Accepted = every browser-playable container (mkv/avi/ogv rejected: Safari won't play them).
 */

export const VIDEO_MAX_BYTES = 80 * 1024 * 1024
export const VIDEO_MAX_SECONDS = 120
export const VIDEO_ACCEPT =
  "video/*,.mp4,.webm,.mov,.m4v,.3gp,.3gpp,.3g2,video/mp4,video/webm,video/quicktime,video/x-m4v,video/3gpp,video/3gpp2"
export const VIDEO_MIME = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
  "video/3gpp",
  "video/3gpp2",
])

const YT_ID = /^[\w-]{11}$/
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|3gp|3gpp|3g2)$/i

/** Filename first: iOS often mislabels type (e.g. video/mp4 on a .mov). */
export function mimeOfVideoFile(file: File): string {
  const n = file.name.toLowerCase()
  if (n.endsWith(".webm")) return "video/webm"
  if (n.endsWith(".mov")) return "video/quicktime"
  if (n.endsWith(".m4v")) return "video/x-m4v"
  if (n.endsWith(".mp4")) return "video/mp4"
  if (n.endsWith(".3gp") || n.endsWith(".3gpp")) return "video/3gpp"
  if (n.endsWith(".3g2")) return "video/3gpp2"
  if (VIDEO_MIME.has(file.type)) return file.type
  return ""
}

export function extForVideoMime(mime: string): "mp4" | "webm" | "mov" | "m4v" | "3gp" | "3g2" {
  if (mime === "video/webm") return "webm"
  if (mime === "video/quicktime") return "mov"
  if (mime === "video/x-m4v") return "m4v"
  if (mime === "video/3gpp") return "3gp"
  if (mime === "video/3gpp2") return "3g2"
  return "mp4"
}

export function youtubeId(raw: string): string | null {
  let u: URL
  try {
    u = new URL(raw.trim())
  } catch {
    return null
  }
  const h = u.hostname
    .replace(/^www\./, "")
    .replace(/^m\./, "")
    .replace(/^music\./, "")
    .toLowerCase()
  if (h === "youtu.be") {
    const id = u.pathname.split("/").filter(Boolean)[0]
    return id && YT_ID.test(id) ? id : null
  }
  if (h === "youtube.com" || h === "youtube-nocookie.com") {
    const v = u.searchParams.get("v")
    if (v && YT_ID.test(v)) return v
    const parts = u.pathname.split("/").filter(Boolean)
    if (
      (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") &&
      parts[1] &&
      YT_ID.test(parts[1])
    ) {
      return parts[1]
    }
  }
  return null
}

function isAllowedVideoHost(host: string): boolean {
  const h = host.toLowerCase()
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "sivrce.ge" ||
    h.endsWith(".sivrce.ge") ||
    h.endsWith(".r2.dev")
  )
}

export function isNativeVideoUrl(raw: string): boolean {
  let u: URL
  try {
    u = new URL(raw.trim())
  } catch {
    return false
  }
  if (u.protocol !== "https:" && !(u.protocol === "http:" && isAllowedVideoHost(u.hostname))) {
    return false
  }
  return isAllowedVideoHost(u.hostname) && VIDEO_EXT.test(u.pathname)
}

export function listingVideoKind(
  raw: string | null | undefined,
): "file" | "youtube" | "stream" | null {
  if (!raw || typeof raw !== "string") return null
  if (isNativeVideoUrl(raw)) return "file"
  if (streamUid(raw)) return "stream"
  if (youtubeId(raw)) return "youtube"
  return null
}

/** Trust-boundary: only YouTube or our CDN video URLs. */
export function sanitizeListingVideoUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null
  const s = raw.trim()
  if (!s || s.length > 500) return null
  if (listingVideoKind(s)) return s
  return null
}

export function youtubePoster(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
}

const STREAM_UID = /^[0-9a-f]{32}$/i

/** Cloudflare Stream embed/playback URL → uid, else null. */
export function streamUid(raw: string): string | null {
  let u: URL
  try {
    u = new URL(raw.trim())
  } catch {
    return null
  }
  const h = u.hostname.toLowerCase()
  if (h !== "iframe.videodelivery.net" && h !== "videodelivery.net") return null
  const id = u.pathname.split("/").filter(Boolean)[0]
  return id && STREAM_UID.test(id) ? id.toLowerCase() : null
}

/** Canonical stored value for Stream videos — same iframe pattern as YouTube. */
export function streamEmbedUrl(uid: string): string {
  return `https://iframe.videodelivery.net/${uid}`
}

export function streamThumbnailUrl(uid: string): string {
  return `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg`
}

function absUrl(src: string): string {
  return src.startsWith("http") ? src : `https://sivrce.ge${src.startsWith("/") ? src : `/${src}`}`
}

export type ListingVideoLd = {
  "@type": "VideoObject"
  name: string
  description: string
  thumbnailUrl: string
  uploadDate: string
  contentUrl?: string
  embedUrl?: string
}

/** Google VideoObject for listing pages + video sitemap. */
export function listingVideoObject(
  raw: string | null | undefined,
  opts: { name: string; description: string; poster: string; uploadDate: string },
): ListingVideoLd | null {
  if (!raw) return null
  const kind = listingVideoKind(raw)
  if (!kind) return null
  const yt = youtubeId(raw)
  const st = streamUid(raw)
  const desc = opts.description.replace(/\s+/g, " ").trim().slice(0, 300)
  return {
    "@type": "VideoObject",
    name: opts.name,
    description: desc || opts.name,
    thumbnailUrl: absUrl(
      kind === "youtube" && yt
        ? youtubePoster(yt)
        : kind === "stream" && st
          ? streamThumbnailUrl(st)
          : opts.poster,
    ),
    uploadDate: opts.uploadDate,
    ...(kind === "file" ? { contentUrl: raw } : {}),
    ...(kind === "youtube" && yt
      ? { embedUrl: `https://www.youtube-nocookie.com/embed/${yt}` }
      : {}),
    ...(kind === "stream" ? { embedUrl: raw } : {}),
  }
}

/** MP4/MOV `ftyp` at offset 4, or WebM EBML header. */
export function looksLikeVideoBytes(buf: Uint8Array): boolean {
  if (buf.length < 12) return false
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return true
  return (
    buf[4] === 0x66 &&
    buf[5] === 0x74 &&
    buf[6] === 0x79 &&
    buf[7] === 0x70
  )
}
