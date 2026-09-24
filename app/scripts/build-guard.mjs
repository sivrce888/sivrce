#!/usr/bin/env node
// Local build guard: `next build` (Turbopack = native Rust) ignores
// --max-old-space-size and has no memory/thread knob, so on a 16 GB Mac a build
// beside dev servers can balloon past 30 GB and freeze the machine in swap.
// Here: one build per machine at a time, low QoS clamp so the UI stays
// responsive, and a watchdog that kills the whole build tree before macOS
// thrashes. CI/Vercel/non-macOS: plain pass-through.
import { spawn, execFileSync } from "node:child_process"
import { openSync, writeSync, closeSync, readFileSync, unlinkSync } from "node:fs"
import { totalmem, tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const MB = 1024 * 1024
// Build tree may use at most this share of physical RAM (16 GB Mac → 8 GB).
const MAX_RSS_SHARE = 0.5
// macOS "memory free %" (kern.memorystatus_level) floor; below this swap
// thrash starts and the UI hangs — kill the build first.
const MIN_FREE_PCT = 8
const POLL_MS = 1000
const LOCK = join(tmpdir(), "sivrce-next-build.lock")

/** Sum RSS (MiB) of `root` and all descendants from `ps -A -o pid=,ppid=,rss=`. */
export function treeRssMb(root, psText) {
  const kids = new Map()
  const rss = new Map()
  for (const line of psText.split("\n")) {
    const [pid, ppid, kb] = line.trim().split(/\s+/).map(Number)
    if (!pid) continue
    rss.set(pid, kb)
    if (!kids.has(ppid)) kids.set(ppid, [])
    kids.get(ppid).push(pid)
  }
  let total = 0
  const stack = [root]
  const seen = new Set()
  while (stack.length) {
    const p = stack.pop()
    if (seen.has(p)) continue
    seen.add(p)
    total += rss.get(p) ?? 0
    stack.push(...(kids.get(p) ?? []))
  }
  return Math.round(total / 1024)
}

const alive = (pid) => {
  try { process.kill(pid, 0); return true } catch (e) { return e.code === "EPERM" }
}

// ponytail: pid lockfile, tiny stale-takeover race if two waiters wake together; flock if that ever bites.
async function acquireLock() {
  for (let warned = false; ; ) {
    try {
      const fd = openSync(LOCK, "wx")
      writeSync(fd, String(process.pid))
      closeSync(fd)
      return
    } catch (e) {
      if (e.code !== "EEXIST") throw e
    }
    const owner = Number(readFileSync(LOCK, "utf8")) || 0
    if (!alive(owner)) { try { unlinkSync(LOCK) } catch {} ; continue }
    if (!warned) console.log(`[build-guard] another next build (pid ${owner}) is running — waiting for it…`)
    warned = true
    await new Promise((r) => setTimeout(r, 5000))
  }
}

function main() {
  const args = ["build", ...process.argv.slice(2)]
  const env = { ...process.env, SIVRCE_BUILD_GUARD: "1" }
  const nextBin = join(import.meta.dirname, "../node_modules/next/dist/bin/next")
  const passThrough = process.platform !== "darwin" || process.env.CI || process.env.VERCEL

  if (passThrough) {
    const child = spawn(process.execPath, [nextBin, ...args], { stdio: "inherit", env })
    child.on("exit", (code, sig) => process.exit(code ?? (sig ? 1 : 0)))
    return
  }

  return acquireLock().then(() => {
    const release = () => { try { if (Number(readFileSync(LOCK, "utf8")) === process.pid) unlinkSync(LOCK) } catch {} }
    process.on("exit", release)
    const maxMb = Number(process.env.BUILD_MAX_RSS_MB) || Math.round((totalmem() / MB) * MAX_RSS_SHARE)
    const minFree = Number(process.env.BUILD_MIN_FREE_PCT) || MIN_FREE_PCT
    console.log(`[build-guard] QoS=utility, one build at a time, kill at ${maxMb} MB tree RSS or <${minFree}% system memory free`)

    // Own process group (detached) so the watchdog can kill every worker at once.
    const child = spawn("taskpolicy", ["-c", "utility", process.execPath, nextBin, ...args], {
      stdio: "inherit", env, detached: true,
    })
    let killedFor = ""
    let peakMb = 0
    const kill = (why) => {
      if (killedFor) return
      killedFor = why
      console.error(`\n[build-guard] ${why} — stopping build to keep the Mac responsive.`)
      try { process.kill(-child.pid, "SIGTERM") } catch {}
      setTimeout(() => { try { process.kill(-child.pid, "SIGKILL") } catch {} }, 2000).unref()
    }
    const timer = setInterval(() => {
      try {
        const used = treeRssMb(child.pid, execFileSync("ps", ["-A", "-o", "pid=,ppid=,rss="], { encoding: "utf8" }))
        peakMb = Math.max(peakMb, used)
        const free = Number(execFileSync("sysctl", ["-n", "kern.memorystatus_level"], { encoding: "utf8" }))
        if (used > maxMb) kill(`build tree RSS ${used} MB > ${maxMb} MB budget (BUILD_MAX_RSS_MB)`)
        else if (free && free < minFree) kill(`system memory free ${free}% < ${minFree}% (close apps/dev servers or set BUILD_MIN_FREE_PCT)`)
      } catch {}
    }, POLL_MS)
    for (const s of ["SIGINT", "SIGTERM"]) process.on(s, () => { try { process.kill(-child.pid, s) } catch {} })
    child.on("exit", (code, sig) => {
      clearInterval(timer)
      if (killedFor) try { process.kill(-child.pid, "SIGKILL") } catch {} // stray workers
      console.log(`[build-guard] peak build tree RSS ${peakMb} MB of ${maxMb} MB budget`)
      process.exit(killedFor ? 137 : code ?? (sig ? 1 : 0))
    })
  })
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main()
