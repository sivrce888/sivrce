/**
 * Agent/agency catalog — carved out of data/professionals.ts so the listing and
 * compare pages can resolve an agent name → profile slug without pulling the
 * ~1 MB new-build PROJECTS/DEVELOPERS catalog into the client bundle.
 * Type-only import below is erased at compile time, so this stays a leaf.
 */
import type { AgentProfile } from './professionals'

// ponytail: emptied 2026-09-25 — the six entries were invented personas
// ("verified", made-up deal counts, all on the company phone). Real agents come
// from db.agentProfile (/agents, /u/[id]). Add rows here only for real people.
export const AGENT_PROFILES: AgentProfile[] = []
