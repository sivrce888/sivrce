#!/usr/bin/env node
/** Fail if staged/tracked junk, git tree, or Vercel deploy output blows the cost lock. */
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, statSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
const MAX_NEW_BYTES = 512 * 1024

/** Frozen 2026-09-12 — raise only with owner approval + date bump in perf-cost-lock. */
const MAX_TRACKED_BYTES = 96 * 1024 * 1024 // 96 MiB git tree (now ~77)
const MAX_TRACKED_FILES = 3500
const MAX_DEPLOY_BYTES = 100 * 1024 * 1024 // 100 MiB .next server+static, no maps/cache
const MAX_SERVER_BYTES = 80 * 1024 * 1024
const MAX_STATIC_BYTES = 24 * 1024 * 1024

/** Never commit these paths (regex on repo-relative posix path). */
const BANNED = [
  /^\.perf(\/|$)/,
  /^shots(\/|$)/,
  /^app\/scripts\/shots-mobile(\/|$)/,
  /^logo-refs(\/|$)/,
  /^research\/node_modules(\/|$)/,
  /^research\/.*\.(html|png|log|mjs|txt)$/,
  /^supabase\/\.temp(\/|$)/,
  /^\.playwright-mcp(\/|$)/,
  /^Screenshot .+\.png$/,
  /^v-(hero|search|chips|footer|s2)\.png$/,
  /^lh-.*\.json$/,
  /^app\/scripts\/(probe-|visual-|audit-shots|dark-shots|dark-verify|lcp-probe|mobile-audit)/,
  /^app\/scripts\/verify-mobile\.mjs$/,
  /^app\/visual-audit\.mjs$/,
  /__pycache__(\/|$)/,
  /\.DS_Store$/,
  /\.(docx|sst)$/,
]

/** Blobs above MAX may live only under these prefixes. */
const LARGE_OK = [
  /^app\/src\/data\//,
  /^app\/package-lock\.json$/,
  /^logo\//,
  /^app\/public\//,
  /^app\/android\//,
  /^app\/ios\//,
  /^research\/competitor-locations\//,
  /^scripts\/.*\.json$/,
]

function rel(path) {
  return path.replace(/\\/g, '/')
}

function mb(n) {
  return `${(n / 1048576).toFixed(1)} MB`
}

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' })
}

function listed(mode) {
  const out = git(['diff', '--cached', '--name-only', `--diff-filter=${mode}`, '-z'])
  return out ? out.split('\0').filter(Boolean) : []
}

function tracked() {
  const out = git(['ls-files', '-z'])
  return out ? out.split('\0').filter(Boolean) : []
}

function checkBanned(paths, errors, label) {
  for (const file of paths) {
    const p = rel(file)
    if (BANNED.some((re) => re.test(p))) errors.push(`${label}: ${p}`)
  }
}

function checkLarge(paths, errors, label) {
  for (const file of paths) {
    const p = rel(file)
    if (LARGE_OK.some((re) => re.test(p))) continue
    let size
    try {
      size = statSync(join(ROOT, file)).size
    } catch {
      continue
    }
    if (size <= MAX_NEW_BYTES) continue
    errors.push(`${label} too large (${Math.round(size / 1024)} KB, max ${MAX_NEW_BYTES / 1024} KB): ${p}`)
  }
}

function trackedWeight() {
  const files = tracked()
  let bytes = 0
  let count = 0
  for (const file of files) {
    try {
      bytes += statSync(join(ROOT, file)).size
      count++
    } catch {
      // ponytail: deleted-but-still-indexed during partial checkout
    }
  }
  return { bytes, count }
}

function walkFiles(dir, out = []) {
  if (!existsSync(dir)) return out
  let names
  try {
    names = readdirSync(dir)
  } catch {
    return out
  }
  for (const name of names) {
    if (name === 'cache' || name === 'turbopack') continue
    const p = join(dir, name)
    let st
    try {
      st = statSync(p)
    } catch {
      continue
    }
    if (st.isDirectory()) walkFiles(p, out)
    else out.push(p)
  }
  return out
}

function dirBytes(dir, skipMap = true) {
  let n = 0
  for (const f of walkFiles(dir)) {
    if (skipMap && f.endsWith('.map')) continue
    try {
      n += statSync(f).size
    } catch {
      // gone between walk and stat
    }
  }
  return n
}

function stripMaps(dir) {
  let n = 0
  for (const f of walkFiles(dir)) {
    if (!f.endsWith('.map')) continue
    try {
      unlinkSync(f)
      n++
    } catch {
      // already gone
    }
  }
  return n
}

function distDir() {
  const env = process.env.NEXT_DIST_DIR
  if (env) return env.startsWith('/') ? env : join(process.cwd(), env)
  const cwdNext = join(process.cwd(), '.next')
  if (existsSync(cwdNext)) return cwdNext
  return join(ROOT, 'app', '.next')
}

function checkBuild(errors, verbose) {
  const dist = distDir()
  if (!existsSync(dist)) {
    errors.push(`vercel-weight: missing ${dist} (postbuild ran with no Next output)`)
    return
  }
  const server = join(dist, 'server')
  const stat = join(dist, 'static')
  const stripped = stripMaps(server) + stripMaps(stat)
  const serverBytes = dirBytes(server)
  const staticBytes = dirBytes(stat)
  const deployBytes = serverBytes + staticBytes
  if (verbose || stripped || deployBytes > MAX_DEPLOY_BYTES * 0.8) {
    console.log(
      `vercel-weight: server ${mb(serverBytes)}/${mb(MAX_SERVER_BYTES)} static ${mb(staticBytes)}/${mb(MAX_STATIC_BYTES)} deploy ${mb(deployBytes)}/${mb(MAX_DEPLOY_BYTES)} stripped ${stripped} maps`,
    )
  }
  if (serverBytes > MAX_SERVER_BYTES) {
    errors.push(`vercel-weight: .next/server ${mb(serverBytes)} exceeds ${mb(MAX_SERVER_BYTES)} (maps stripped; Vercel 250 MB function wall)`)
  }
  if (staticBytes > MAX_STATIC_BYTES) {
    errors.push(`vercel-weight: .next/static ${mb(staticBytes)} exceeds ${mb(MAX_STATIC_BYTES)}`)
  }
  if (deployBytes > MAX_DEPLOY_BYTES) {
    errors.push(`vercel-weight: deploy ${mb(deployBytes)} exceeds ${mb(MAX_DEPLOY_BYTES)} — do not commit/push; Vercel bill scales with output`)
  }
}

function run({ ci = false, verbose = false, build = false } = {}) {
  const errors = []
  checkBanned(listed('ACMRT'), errors, 'banned path')
  checkLarge(listed('A'), errors, 'new file')
  const tree = trackedWeight()
  if (tree.bytes > MAX_TRACKED_BYTES) {
    errors.push(`git tree ${mb(tree.bytes)} exceeds ${mb(MAX_TRACKED_BYTES)} (${tree.count} files)`)
  }
  if (tree.count > MAX_TRACKED_FILES) {
    errors.push(`git tree ${tree.count} files exceeds ${MAX_TRACKED_FILES}`)
  }
  if (ci) {
    const all = tracked()
    checkBanned(all, errors, 'tracked banned')
    checkLarge(all, errors, 'tracked file')
  }
  if (build) checkBuild(errors, verbose)
  if (errors.length) {
    console.error('repo-weight: blocked\n')
    for (const e of errors) console.error(`  • ${e}`)
    console.error('\nSee .cursor/rules/repo-lightweight-lock.mdc + .cursor/rules/perf-cost-lock.mdc')
    return 1
  }
  if (verbose) {
    console.log(`repo-weight: ok${ci ? ' (ci)' : ''}${build ? ' (build)' : ''} tree ${mb(tree.bytes)}/${mb(MAX_TRACKED_BYTES)} files ${tree.count}/${MAX_TRACKED_FILES}`)
  }
  return 0
}

function selfCheck() {
  const samples = ['.perf/x', 'shots/a.png', 'research/foo.html', 'app/src/data/x.json']
  if (!BANNED.some((re) => re.test('.perf/x'))) throw new Error('banned .perf')
  if (!BANNED.some((re) => re.test('research/x.html'))) throw new Error('banned research html')
  if (!LARGE_OK.some((re) => re.test('app/src/data/x.json'))) throw new Error('large_ok data')
  if (BANNED.some((re) => re.test(samples[3]))) throw new Error('data must not be banned')
  if (!BANNED.some((re) => re.test('app/scripts/probe-home.mjs'))) throw new Error('banned probe scripts')
  if (!BANNED.some((re) => re.test('app/visual-audit.mjs'))) throw new Error('banned visual-audit')
  if (MAX_TRACKED_BYTES !== 96 * 1024 * 1024) throw new Error('tracked cap unlocked')
  if (MAX_TRACKED_FILES !== 3500) throw new Error('file-count cap unlocked')
  if (MAX_DEPLOY_BYTES !== 100 * 1024 * 1024) throw new Error('deploy cap unlocked')
  if (MAX_SERVER_BYTES !== 80 * 1024 * 1024) throw new Error('server cap unlocked')
  if (MAX_STATIC_BYTES !== 24 * 1024 * 1024) throw new Error('static cap unlocked')
  if (MAX_DEPLOY_BYTES >= 250 * 1024 * 1024) throw new Error('deploy cap hits Vercel 250 MB wall')
  console.log('repo-weight self-check: ok')
}

const ci = process.argv.includes('--ci')
const verbose = process.argv.includes('--verbose')
const build = process.argv.includes('--build')
if (process.argv.includes('--self-check')) selfCheck()
else process.exit(run({ ci, verbose, build }))
