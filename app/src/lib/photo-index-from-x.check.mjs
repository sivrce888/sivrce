/** Runnable check: `node app/src/lib/photo-index-from-x.check.mjs` — mirrors photo-index-from-x.ts */
function photoIndexFromX(ratio, n) {
  if (n <= 1) return 0
  return Math.min(n - 1, Math.max(0, Math.floor(ratio * n)))
}

const cases = [
  [0, 5, 0],
  [0.19, 5, 0],
  [0.2, 5, 1],
  [0.99, 5, 4],
  [1, 5, 4],
  [-0.1, 5, 0],
  [0.5, 1, 0],
  [0.5, 0, 0],
]

for (const [ratio, n, want] of cases) {
  const got = photoIndexFromX(ratio, n)
  if (got !== want) {
    console.error(`fail: photoIndexFromX(${ratio}, ${n}) = ${got}, want ${want}`)
    process.exit(1)
  }
}
console.log('ok')
