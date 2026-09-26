import assert from "node:assert/strict"

import { background } from "./background"

// Outside a request scope `after` throws — the task must still run, and a
// failing task must be logged, never thrown into the caller.
let ran = false
background("check.ok", async () => {
  ran = true
})
const logged: unknown[] = []
const origError = console.error
console.error = (...args: unknown[]) => void logged.push(args)
background("check.fail", async () => {
  throw new Error("boom")
})
setTimeout(() => {
  console.error = origError
  assert.equal(ran, true, "task runs outside request scope")
  assert.equal(logged.length, 1, "failure is logged once")
  console.log("background.check: ok")
}, 10)
