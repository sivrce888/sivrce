/**
 * Germany intel seed — DataSources (DE registry) + developer_profiles (national).
 * Run: npx --yes tsx scripts/ingest-de-intel.ts
 *
 * Idempotent: DataSources upsert by slug; developers create-if-missing only
 * (never clobbers owner-claimed rows). No network — official-site fetching
 * stays in country adapters under robots.txt + rate limits. Facts/provenance
 * rows are written by lib/intel/store.ts ingestFact, not here.
 * ponytail: static catalog is the source of truth; this only mirrors it
 * into queryable tables for counts + admin coverage.
 */

import { config } from 'dotenv'
import { resolve } from 'node:path'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import {
  DataSourceKind,
  SourceReliability,
} from '../src/generated/prisma/enums'
import { SOURCE_REGISTRY } from '../src/lib/intel/core'
import { NEW_DEVELOPERS_GERMANY } from '../src/data/projects-new-germany'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = new PrismaClient({ adapter: new PrismaPg(pool) })

const KIND_MAP: Record<string, { kind: DataSourceKind; reliability: SourceReliability }> = {
  government: { kind: DataSourceKind.government, reliability: SourceReliability.official_government },
  registry: { kind: DataSourceKind.official_registry, reliability: SourceReliability.official_registry },
  institution: { kind: DataSourceKind.open_data, reliability: SourceReliability.established_institution },
}

async function main() {
  const deSources = SOURCE_REGISTRY.filter((s) => s.country === 'DE')
  let sources = 0
  for (const s of deSources) {
    const map = KIND_MAP[s.kind]
    if (!map) continue
    await db.dataSource.upsert({
      where: { slug: s.slug },
      create: {
        slug: s.slug,
        name: s.name,
        kind: map.kind,
        reliability: map.reliability,
        country: 'DE',
        url: s.baseUrl || null,
        refreshHours: s.refreshHours,
        reliabilityNote: s.notes.slice(0, 500),
      },
      update: {
        name: s.name,
        url: s.baseUrl || null,
        refreshHours: s.refreshHours,
        reliabilityNote: s.notes.slice(0, 500),
      },
    })
    sources++
  }

  let created = 0
  let skipped = 0
  for (const d of NEW_DEVELOPERS_GERMANY) {
    const existing = await db.developerProfile.findUnique({ where: { slug: d.slug } })
    if (existing) {
      skipped++
      continue
    }
    await db.developerProfile.create({
      data: {
        id: d.slug,
        slug: d.slug,
        name: d.name.en,
        logoText: d.name.en.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'DE',
        website: d.website ?? null,
        projectsCount: d.projectsDone,
        completedCount: 0,
        headquarters: d.city,
        rating: 0,
        color: 'ink',
        description: d.description.en,
      },
    })
    created++
  }

  console.log(`ingest-de-intel: ${sources} DE sources upserted, ${created} developers created, ${skipped} already present ✓`)

  // Provenance facts (idempotent: skip when the current value is unchanged).
  // Single official-site source ⇒ "unverified" until a second source agrees.
  // Dynamic import: @/lib/db reads DATABASE_URL at import time (dotenv ran above).
  const { ingestFact } = await import('../src/lib/intel/store')
  let facts = 0
  for (const d of NEW_DEVELOPERS_GERMANY) {
    const current = await db.intelFact.findUnique({
      where: { entityKind_entityId_factType: { entityKind: 'developer', entityId: d.slug, factType: 'company_identity' } },
      select: { value: true },
    })
    if (current?.value === d.name.en) continue
    await ingestFact({
      entityKind: 'developer',
      entityId: d.slug,
      fact: 'company_identity',
      value: d.name.en,
      sourceSlug: 'official-developer',
      sourceKind: 'official_company',
      url: d.website ?? null,
    })
    facts++
  }
  console.log(`ingest-de-intel: ${facts} provenance facts ingested ✓`)
}

main()
  .catch((e) => {
    console.error('ingest-de-intel failed:', e instanceof Error ? e.message : String(e))
    process.exitCode = 1
  })
  .finally(() => db.$disconnect().then(() => pool.end()))
