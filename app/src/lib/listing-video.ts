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
const VIMEO_ID = /^\d{6,12}$/
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

export function vimeoId(raw: string): string | null {
  let u: URL
  try {
    u = new URL(raw.trim())
  } catch {
    return null
  }
  const h = u.hostname
    .replace(/^www\./, "")
    .replace(/^player\./, "")
    .toLowerCase()
  if (h === "vimeo.com") {
    const parts = u.pathname.split("/").filter(Boolean)
    const id = parts[0] === "video" ? parts[1] : parts[0]
    return id && VIMEO_ID.test(id) ? id : null
  }
  return null
}

export function vimeoEmbedUrl(id: string): string {
  return `https://player.vimeo.com/video/${id}`
}

function isAllowedVideoHost(host: string): boolean {
  const h = host.toLowerCase()
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "sivrce.ge" ||
    h.endsWith(".sivrce.ge") ||
    h === "sivrce.com" ||
    h.endsWith(".sivrce.com") ||
    h.endsWith(".r2.dev") ||
    h.endsWith(".cloudflarestream.com") ||
    h === "videodelivery.net" ||
    h.endsWith(".videodelivery.net")
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

export type VideoEmbed = { type: "youtube" | "vimeo" | "stream" | "native"; url: string }

/** Embeddable player for a video URL (nocookie/privacy variants), or null. */
export function videoEmbedFor(raw: string | undefined): VideoEmbed | null {
  if (!raw) return null
  const yt = youtubeId(raw)
  if (yt) return { type: "youtube", url: `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0` }
  const vm = vimeoId(raw)
  if (vm) return { type: "vimeo", url: `${vimeoEmbedUrl(vm)}?autoplay=1` }
  const st = streamUid(raw)
  if (st) return { type: "stream", url: `${streamEmbedUrl(st)}?autoplay=true` }
  if (isNativeVideoUrl(raw)) return { type: "native", url: raw }
  return null
}

export function listingVideoKind(
  raw: string | null | undefined,
): "file" | "youtube" | "stream" | "vimeo" | null {
  if (!raw || typeof raw !== "string") return null
  if (isNativeVideoUrl(raw)) return "file"
  if (streamUid(raw)) return "stream"
  if (youtubeId(raw)) return "youtube"
  if (vimeoId(raw)) return "vimeo"
  return null
}

/** Trust-boundary: only YouTube, Vimeo, Stream or our CDN video URLs. */
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

export interface VideoQualityScore {
  score: number // 0–100
  resolutionGrade: "4K" | "1080p" | "720p" | "SD" | "Unknown"
  aspectRatio: "16:9" | "9:16" | "4:3" | "Custom"
  durationSeconds: number
  tier: "Diamond" | "Gold" | "Silver" | "Standard"
  tips: string[]
}

/**
 * 100/100 Video Quality Matrix for listings:
 * - Optimal length: 15–90s (+15 pts)
 * - HD/4K resolution (+15 pts)
 * - Standard 16:9 or 9:16 aspect ratio (+10 pts)
 * - Supported fast CDN or verified embed (+60 pts baseline)
 */
export function evaluateVideoQuality(input: {
  duration?: number
  width?: number
  height?: number
  sizeBytes?: number
  kind?: "file" | "youtube" | "stream" | "vimeo" | null
}): VideoQualityScore {
  let score = 60
  const tips: string[] = []
  const dur = input.duration ?? 0
  const w = input.width ?? 0
  const h = input.height ?? 0

  if (input.kind === "stream") {
    score += 10
  }

  // Duration scoring
  if (dur >= 15 && dur <= 90) {
    score += 15
  } else if (dur > 90 && dur <= 120) {
    score += 10
  } else if (dur > 0 && dur < 15) {
    score += 5
    tips.push("Video tours between 15s and 90s get 2.4x more inquiries.")
  }

  // Resolution
  let resolutionGrade: VideoQualityScore["resolutionGrade"] = "Unknown"
  const maxDim = Math.max(w, h)
  if (maxDim >= 2160) {
    resolutionGrade = "4K"
    score += 15
  } else if (maxDim >= 1080) {
    resolutionGrade = "1080p"
    score += 15
  } else if (maxDim >= 720) {
    resolutionGrade = "720p"
    score += 10
  } else if (maxDim > 0) {
    resolutionGrade = "SD"
    score += 5
    tips.push("Upload in 1080p or 4K to achieve a 100/100 listing badge.")
  } else if (input.kind === "youtube" || input.kind === "vimeo") {
    resolutionGrade = "1080p"
    score += 15
  }

  // Aspect Ratio
  let aspectRatio: VideoQualityScore["aspectRatio"] = "16:9"
  if (w > 0 && h > 0) {
    const ratio = w / h
    if (Math.abs(ratio - 16 / 9) < 0.08) aspectRatio = "16:9"
    else if (Math.abs(ratio - 9 / 16) < 0.08) aspectRatio = "9:16"
    else if (Math.abs(ratio - 4 / 3) < 0.08) aspectRatio = "4:3"
    else aspectRatio = "Custom"
  }

  score = Math.min(100, Math.max(0, score))
  const tier: VideoQualityScore["tier"] =
    score >= 95 ? "Diamond" : score >= 85 ? "Gold" : score >= 75 ? "Silver" : "Standard"

  return {
    score,
    resolutionGrade,
    aspectRatio,
    durationSeconds: dur,
    tier,
    tips,
  }
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
  const vm = vimeoId(raw)
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
    ...(kind === "vimeo" && vm
      ? { embedUrl: `https://player.vimeo.com/video/${vm}` }
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
