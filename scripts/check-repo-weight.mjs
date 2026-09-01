#!/usr/bin/env node
/** Fail if staged files match banned junk paths or exceed size budget. */
import { execFileSync } from 'node:child_process'
import { statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
const MAX_NEW_BYTES = 512 * 1024

/** Never commit these paths (regex on repo-relative posix path). */
const BANNED = [
  /^\.perf(\/|$)/,
  /^shots(\/|$)/,
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

/** New blobs above MAX may live only under these prefixes. */
const LARGE_OK = [
  /^app\/src\/data\//,
  /^logo\//,
  /^app\/public\//,
  /^app\/android\//,
  /^app\/ios\//,
]

function rel(path) {
  return path.replace(/\\/g, '/')
}

function staged(mode) {
  const out = execFileSync(
    'git',
    ['diff', '--cached', '--name-only', `--diff-filter=${mode}`, '-z'],
    { cwd: ROOT, encoding: 'utf8' },
  )
  return out ? out.split('\0').filter(Boolean) : []
}

const errors = []

for (const file of staged('ACMRT')) {
  const p = rel(file)
  if (BANNED.some((re) => re.test(p))) {
    errors.push(`banned path: ${p}`)
  }
}

for (const file of staged('A')) {
  const p = rel(file)
  const abs = join(ROOT, file)
  let size
  try {
    size = statSync(abs).size
  } catch {
    continue
  }
  if (size <= MAX_NEW_BYTES || LARGE_OK.some((re) => re.test(p))) continue
  errors.push(`new file too large (${Math.round(size / 1024)} KB, max ${MAX_NEW_BYTES / 1024} KB): ${p}`)
}

if (errors.length) {
  console.error('repo-weight: commit blocked\n')
  for (const e of errors) console.error(`  • ${e}`)
  console.error('\nSee .cursor/rules/repo-lightweight-lock.mdc')
  process.exit(1)
}

if (process.argv.includes('--verbose')) {
  console.log('repo-weight: ok')
}
