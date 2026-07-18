/**
 * Self-check: photo pipeline URL conventions.
 * Run: npx tsx src/lib/media.check.ts
 */
import assert from "node:assert/strict"
import { blurProps, hasLqip, lqipOf } from "./media"

const master = "https://cdn.sivrce.ge/uploads/2026/07/3f4b2c1a-9b2e-4c3d-8f1a-2b3c4d5e6f7a.webp"

assert.equal(hasLqip(master), true)
assert.equal(
  lqipOf(master),
  "https://cdn.sivrce.ge/uploads/2026/07/3f4b2c1a-9b2e-4c3d-8f1a-2b3c4d5e6f7a.lqip.webp",
)
assert.deepEqual(blurProps(master), {
  placeholder: "blur",
  blurDataURL: "https://cdn.sivrce.ge/uploads/2026/07/3f4b2c1a-9b2e-4c3d-8f1a-2b3c4d5e6f7a.lqip.webp",
})

// Non-pipeline sources: no blur, no crash.
for (const url of [
  "https://images.unsplash.com/photo-123?w=1200",
  "/images/p2.webp",
  "https://cdn.sivrce.ge/uploads/2026/07/not-a-uuid.jpg",
  "https://cdn.sivrce.ge/uploads/2026/07/3f4b2c1a-9b2e-4c3d-8f1a-2b3c4d5e6f7a.lqip.webp", // LQIP itself has no twin
]) {
  assert.equal(hasLqip(url), false, url)
  assert.equal(lqipOf(url), undefined, url)
  assert.deepEqual(blurProps(url), { placeholder: "empty" }, url)
}

console.log("media.check: OK")
