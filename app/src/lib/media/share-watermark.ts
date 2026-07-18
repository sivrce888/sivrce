/**
 * Share/social composite with brand watermark — NOT for listing gallery uploads.
 * BRAND.md §7: no watermarks on listing/AI imagery. Use for OG/export only.
 *
 * Assets: logo/watermark/png/sivrce-wm-soft-white-8x.png
 */

import path from "node:path"

import sharp from "sharp"

const WM_REL = path.join(
  process.cwd(),
  "..",
  "logo",
  "watermark",
  "png",
  "sivrce-wm-soft-white-8x.png",
)

/** Composite soft-white mark bottom-right (~12% width). */
export async function watermarkForShare(imageBuf: Buffer): Promise<Buffer> {
  const base = sharp(imageBuf).rotate()
  const meta = await base.metadata()
  const w = meta.width ?? 1200
  const markW = Math.max(80, Math.round(w * 0.12))
  const mark = await sharp(WM_REL).resize({ width: markW }).png().toBuffer()
  const markMeta = await sharp(mark).metadata()
  const mw = markMeta.width ?? markW
  const mh = markMeta.height ?? Math.round(markW / 3)
  const left = Math.max(0, w - mw - Math.round(w * 0.03))
  const top = Math.max(0, (meta.height ?? 800) - mh - Math.round((meta.height ?? 800) * 0.03))

  return base
    .composite([{ input: mark, left, top }])
    .webp({ quality: 82 })
    .toBuffer()
}
