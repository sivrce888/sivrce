#!/usr/bin/env node
/**
 * Backfill `Cache-Control: public, max-age=31536000, immutable` on existing
 * R2 objects under uploads/ (photo twins predate the header, videos already
 * pass it but old ones lack it). Headers only — no bytes change.
 *
 *   node scripts/r2-backfill-cache.mjs            # dry run (default)
 *   node scripts/r2-backfill-cache.mjs --apply    # write headers
 *   node scripts/r2-backfill-cache.mjs --apply --clear  # rollback: strip header
 *
 * ponytail: CopyObject onto same key + MetadataDirective REPLACE is the
 * only S3 way to patch metadata. ContentType preserved from HeadObject.
 */
import { config } from "dotenv"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import {
  S3Client,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
config({ path: join(root, ".env.local") })

const APPLY = process.argv.includes("--apply")
const CLEAR = process.argv.includes("--clear")
const CC = "public, max-age=31536000, immutable"

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error("missing R2 env (need ACCOUNT_ID/ACCESS_KEY_ID/SECRET_ACCESS_KEY/BUCKET_NAME)")
  process.exit(1)
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  forcePathStyle: true,
})

let scanned = 0, ok = 0, skipped = 0, failed = 0
let token
do {
  const list = await s3.send(
    new ListObjectsV2Command({ Bucket: R2_BUCKET_NAME, Prefix: "uploads/", ContinuationToken: token, MaxKeys: 1000 }),
  )
  token = list.IsTruncated ? list.NextContinuationToken : undefined
  for (const o of list.Contents ?? []) {
    scanned++
    const head = await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: o.Key }))
    const has = (head.CacheControl ?? "").includes("immutable")
    if (!CLEAR && has) { skipped++; continue }
    if (CLEAR && !head.CacheControl) { skipped++; continue }
    if (!APPLY) { ok++; continue } // dry run counts what would change
    try {
      await s3.send(
        new CopyObjectCommand({
          Bucket: R2_BUCKET_NAME,
          CopySource: `${R2_BUCKET_NAME}/${o.Key}`,
          Key: o.Key,
          ContentType: head.ContentType,
          ...(CLEAR ? {} : { CacheControl: CC }),
          MetadataDirective: "REPLACE",
        }),
      )
      ok++
    } catch (e) {
      failed++
      console.error(`fail ${o.Key}: ${e?.message ?? e}`)
    }
  }
} while (token)

console.log(`${APPLY ? (CLEAR ? "cleared" : "patched") : "would-patch"}: ${ok} scanned: ${scanned} skipped: ${skipped} failed: ${failed}`)
if (failed > 0) process.exit(1)
