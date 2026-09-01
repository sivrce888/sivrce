#!/usr/bin/env node
/** Fail if staged or tracked files match banned junk paths or exceed size budget. */
import { execFileSync } from 'node:child_process'
import { statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
const MAX_NEW_BYTES = 512 * 1024

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

function checkLarge(paths, errors, label, newOnly) {
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

function run({ ci = false, verbose = false } = {}) {
  const errors = []
  checkBanned(listed('ACMRT'), errors, 'banned path')
  checkLarge(listed('A'), errors, 'new file', true)
  if (ci) {
    const all = tracked()
    checkBanned(all, errors, 'tracked banned')
    checkLarge(all, errors, 'tracked file', false)
  }
  if (errors.length) {
    console.error('repo-weight: blocked\n')
    for (const e of errors) console.error(`  • ${e}`)
    console.error('\nSee .cursor/rules/repo-lightweight-lock.mdc')
    return 1
  }
  if (verbose) console.log(`repo-weight: ok${ci ? ' (ci)' : ''}`)
  return 0
}

function selfCheck() {
  const samples = ['.perf/x', 'shots/a.png', 'research/foo.html', 'app/src/data/x.json']
  if (!BANNED.some((re) => re.test('.perf/x'))) throw new Error('banned .perf')
  if (!BANNED.some((re) => re.test('research/x.html'))) throw new Error('banned research html')
  if (!LARGE_OK.some((re) => re.test('app/src/data/x.json'))) throw new Error('large_ok data')
  if (BANNED.some((re) => re.test(samples[3]))) throw new Error('data must not be banned')
  console.log('repo-weight self-check: ok')
}

const ci = process.argv.includes('--ci')
const verbose = process.argv.includes('--verbose')
if (process.argv.includes('--self-check')) selfCheck()
else process.exit(run({ ci, verbose }))
