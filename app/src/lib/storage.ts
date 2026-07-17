/**
 * File storage adapter: thin wrapper around Cloudflare R2 (S3-compatible).
 *
 * ponytail: single-region, single-bucket. Multi-bucket or multi-provider
 * storage is a straightforward upgrade behind this same interface.
 *
 * If R2 env vars are missing, all functions log a warning and return
 * placeholder / no-op values (graceful degradation).
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl as s3GetSignedUrl } from "@aws-sdk/s3-request-presigner"

/* ------------------------------------------------------------------ */
/*  Client init                                                       */
/* ------------------------------------------------------------------ */

function client(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!accountId || !accessKeyId || !secretAccessKey) return null

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  })
}

function bucket(): string | null {
  return process.env.R2_BUCKET_NAME ?? null
}

function publicUrlBase(): string | null {
  return process.env.R2_PUBLIC_URL ?? null
}

function logMissing(): void {
  console.warn(
    "[storage] R2 env vars not fully configured — " +
      "set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, " +
      "R2_BUCKET_NAME, and R2_PUBLIC_URL to enable file storage.",
  )
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/**
 * Returns the public URL for a stored object by key.
 * Falls back to a placeholder if R2 is not configured.
 */
export function getPublicUrl(key: string): string {
  const base = publicUrlBase()
  if (!base) {
    logMissing()
    return `/placeholder/${key}`
  }
  return `${base.replace(/\/$/, "")}/${key}`
}

export interface UploadFileParams {
  key: string
  body: Buffer | Uint8Array | ReadableStream | Blob
  contentType: string
}

export interface UploadFileResult {
  url: string
}

/** Upload a file to R2. Returns the public URL on success. */
export async function uploadFile(params: UploadFileParams): Promise<UploadFileResult> {
  const c = client()
  const b = bucket()
  if (!c || !b) {
    logMissing()
    return { url: getPublicUrl(params.key) }
  }

  await c.send(
    new PutObjectCommand({
      Bucket: b,
      Key: params.key,
      Body: params.body as Buffer,
      ContentType: params.contentType,
    }),
  )

  return { url: getPublicUrl(params.key) }
}

/** Delete a file from R2 by key. No-op if R2 is not configured. */
export async function deleteFile(key: string): Promise<void> {
  const c = client()
  const b = bucket()
  if (!c || !b) {
    logMissing()
    return
  }

  await c.send(
    new DeleteObjectCommand({
      Bucket: b,
      Key: key,
    }),
  )
}

/**
 * Generate a pre-signed (time-limited) URL for a private object.
 * Default expiry is 1 hour. Falls back to the public URL if R2 is not configured.
 */
export async function getSignedUrl(
  key: string,
  expiresIn: number = 3600,
): Promise<string> {
  const c = client()
  const b = bucket()
  if (!c || !b) {
    logMissing()
    return getPublicUrl(key)
  }

  return s3GetSignedUrl(
    c,
    new HeadObjectCommand({ Bucket: b, Key: key }),
    { expiresIn },
  )
}
