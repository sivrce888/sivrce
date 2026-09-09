/**
 * Cloudflare Stream: video encode pipeline (H.264 + HLS + thumbnails).
 * ponytail: direct creator upload — bytes go browser→Stream, never through
 * Vercel (60s/RAM limits forbid server ffmpeg). Bills per minute used;
 * unconfigured (no CF_STREAM_API_TOKEN) → R2 original path.
 * Env: CF_STREAM_ACCOUNT_ID, CF_STREAM_API_TOKEN.
 */

const API = "https://api.cloudflare.com/client/v4"

function cfg(): { account: string; token: string } | null {
  const account = process.env.CF_STREAM_ACCOUNT_ID
  const token = process.env.CF_STREAM_API_TOKEN
  return account && token ? { account, token } : null
}

export function isStreamEnabled(): boolean {
  return cfg() !== null
}

/** One-time upload ticket: browser POSTs the file straight to `uploadURL`. */
export async function createDirectUpload(): Promise<{ uploadURL: string; uid: string }> {
  const c = cfg()
  if (!c) throw new Error("stream_disabled")
  const res = await fetch(`${API}/accounts/${c.account}/stream/direct_upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ maxDurationSeconds: 120 }),
  })
  if (!res.ok) throw new Error("stream_upload_init_failed")
  const j = (await res.json()) as {
    success?: boolean
    result?: { uploadURL?: string; uid?: string }
  }
  if (!j.success || !j.result?.uploadURL || !j.result?.uid) {
    throw new Error("stream_upload_init_failed")
  }
  return { uploadURL: j.result.uploadURL, uid: j.result.uid }
}

export type StreamState = {
  ready: boolean
  error: boolean
  duration?: number
  thumbnail?: string
}

/** Poll after upload: queued/encoding → ready (or error). */
export async function streamState(uid: string): Promise<StreamState> {
  const c = cfg()
  if (!c) throw new Error("stream_disabled")
  const res = await fetch(`${API}/accounts/${c.account}/stream/${uid}`, {
    headers: { Authorization: `Bearer ${c.token}` },
  })
  if (!res.ok) throw new Error("stream_status_failed")
  const j = (await res.json()) as {
    success?: boolean
    result?: {
      status?: { state?: string }
      duration?: number
      thumbnail?: string
    }
  }
  const r = j.result
  if (!r) throw new Error("stream_status_failed")
  const state = r.status?.state
  return {
    ready: state === "ready",
    error: state === "error",
    ...(typeof r.duration === "number" ? { duration: r.duration } : {}),
    ...(typeof r.thumbnail === "string" ? { thumbnail: r.thumbnail } : {}),
  }
}
