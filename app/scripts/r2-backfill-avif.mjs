#!/usr/bin/env node
/**
 * Backfill `.card.avif` twins for masters that predate the AVIF pipeline.
 * Same bytes the upload route emits: 800px, avif q70, immutable cache.
 *
 *   node scripts/r2-backfill-avif.mjs           # dry run (default)
 *   node scripts/r2-backfill-avif.mjs --apply   # generate + upload
 *
 * ponytail: idempotent — skips masters that already have a twin.
 */
import { config } from "dotenv"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import {
  S3Client,
  ListObjectsV2Command,
  HeadObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3"
import sharp from "sharp"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
config({ path: join(root, ".env.local") })

const APPLY = process.argv.includes("--apply")
const FORCE = process.argv.includes("--force")
const CC = "public, max-age=31536000, immutable"

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error("missing R2 env")
  process.exit(1)
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  forcePathStyle: true,
})

const isMaster = (k) => k.endsWith(".webp") && !k.endsWith(".card.webp") && !k.endsWith(".lqip.webp")

let scanned = 0, made = 0, skipped = 0, failed = 0
let token
do {
  const list = await s3.send(
    new ListObjectsV2Command({ Bucket: R2_BUCKET_NAME, Prefix: "uploads/", ContinuationToken: token, MaxKeys: 1000 }),
  )
  token = list.IsTruncated ? list.NextContinuationToken : undefined
  for (const o of list.Contents ?? []) {
    if (!isMaster(o.Key)) continue
    scanned++
    const twin = o.Key.replace(/\.webp$/, ".card.avif")
    const webpCard = o.Key.replace(/\.webp$/, ".card.webp")
    let needAvif = FORCE
    if (!needAvif) {
      try {
        await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: twin }))
      } catch { needAvif = true }
    }
    let needWebp = false
    try {
      await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: webpCard }))
    } catch { needWebp = true } // ancient masters lack the card twin — old-device <picture> fallback 404s without it
    if (!needAvif && !needWebp) { skipped++; continue }
    if (!APPLY) { made++; continue }
    try {
      const get = await s3.send(new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: o.Key }))
      const buf = Buffer.from(await get.Body.transformToByteArray())
      const base = sharp(buf).rotate().resize({ width: 800, withoutEnlargement: true })
      const jobs = []
      if (needAvif) {
        jobs.push(
          base.clone().avif({ quality: 70 }).toBuffer().then((Body) => s3.send(
            new PutObjectCommand({ Bucket: R2_BUCKET_NAME, Key: twin, Body, ContentType: "image/avif", CacheControl: CC }),
          )),
        )
      }
      if (needWebp) {
        jobs.push(
          base.clone().webp({ quality: 78 }).toBuffer().then((Body) => s3.send(
            new PutObjectCommand({ Bucket: R2_BUCKET_NAME, Key: webpCard, Body, ContentType: "image/webp", CacheControl: CC }),
          )),
        )
      }
      await Promise.all(jobs)
      made++
    } catch (e) {
      failed++
      console.error(`fail ${o.Key}: ${e?.message ?? e}`)
    }
  }
} while (token)

console.log(`${APPLY ? "made" : "would-make"}: ${made} masters: ${scanned} skipped: ${skipped} failed: ${failed}`)
if (failed > 0) process.exit(1)
