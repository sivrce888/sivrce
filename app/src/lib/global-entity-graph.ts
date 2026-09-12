/**
 * SIVRCE Global Entity Graph — Canonical entity identification, domain synchronization,
 * and Place & Property hierarchy.
 *
 * One unified entity model across sivrce.ge and sivrce.com.
 * DB-free, lightweight, SSR-safe.
 */

export type EntityType =
  | 'CTRY'  // Country
  | 'REGN'  // Region / State
  | 'CITY'  // City / Metro
  | 'DIST'  // District
  | 'HOOD'  // Neighborhood
  | 'STRT'  // Street
  | 'BLDG'  // Building
  | 'PROP'  // Property / Listing
  | 'DEVR'  // Developer
  | 'DEV'   // Development / Project
  | 'AGNT'  // Agent
  | 'AGCY'  // Agency
  | 'STAY'  // Hotel / Accommodation
  | 'PLACE' // POI / Business / Attraction

export interface GlobalEntityId {
  type: EntityType
  localId: string
  globalId: string
  canonicalCc: string
}

export type EntityRelationKind =
  | 'CONTAINS'
  | 'LOCATED_IN'
  | 'DEVELOPED_BY'
  | 'MANAGED_BY'
  | 'LISTED_BY'
  | 'NEAR_POI'
  | 'HAS_STAY'
  | 'SIMILAR_TO'

export interface EntityRelation {
  sourceId: string
  targetId: string
  kind: EntityRelationKind
  weight?: number
  metadata?: Record<string, unknown>
}

export interface PlaceGraphNode {
  globalId: string
  type: EntityType
  nameKa: string
  nameEn: string
  cc: string
  citySlug?: string
  district?: string
  lat?: number
  lng?: number
  parentGlobalId?: string
}

/** Format a deterministic global entity ID: SIVRCE-{TYPE}-{LOCAL_ID} */
export function formatGlobalEntityId(type: EntityType, localId: string): string {
  const cleanId = localId.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '_')
  return `SIVRCE-${type}-${cleanId}`
}

/** Parse a global entity ID string into component parts */
export function parseGlobalEntityId(globalId: string): { type: EntityType; localId: string } | null {
  if (!globalId.startsWith('SIVRCE-')) return null
  const parts = globalId.split('-')
  if (parts.length < 3) return null
  const type = parts[1] as EntityType
  const localId = parts.slice(2).join('-')
  return { type, localId }
}

/** Canonical URL resolver for cross-domain sync (sivrce.ge vs sivrce.com) */
export interface CanonicalUrlOptions {
  domain?: 'sivrce.com' | 'sivrce.ge'
  lang?: 'ka' | 'en' | 'ru' | 'de'
  cc?: string
}

export function buildCanonicalEntityUrl(
  type: EntityType,
  slugOrId: string,
  options: CanonicalUrlOptions = {}
): string {
  const domain = options.domain ?? 'sivrce.com'
  const lang = options.lang ?? 'en'
  const cc = (options.cc ?? 'GE').toLowerCase()

  const origin = domain === 'sivrce.ge' ? 'https://sivrce.ge' : 'https://sivrce.com'

  let path = ''
  switch (type) {
    case 'PROP':
      path = domain === 'sivrce.ge' ? `/${lang}/property/${slugOrId}` : `/${lang}/${cc}/property/${slugOrId}`
      break
    case 'BLDG':
      path = domain === 'sivrce.ge' ? `/${lang}/building/${slugOrId}` : `/${lang}/${cc}/building/${slugOrId}`
      break
    case 'DEV':
      path = domain === 'sivrce.ge' ? `/${lang}/projects/${slugOrId}` : `/${lang}/${cc}/projects/${slugOrId}`
      break
    case 'DEVR':
      path = domain === 'sivrce.ge' ? `/${lang}/developers/${slugOrId}` : `/${lang}/${cc}/developers/${slugOrId}`
      break
    case 'STAY':
      path = domain === 'sivrce.ge' ? `/${lang}/hotels/${slugOrId}` : `/${lang}/${cc}/hotels/${slugOrId}`
      break
    case 'CITY':
      path = domain === 'sivrce.ge' ? `/${lang}/${slugOrId}` : `/${lang}/${cc}/${slugOrId}`
      break
    case 'HOOD':
      path = domain === 'sivrce.ge' ? `/${lang}/neighborhoods/${slugOrId}` : `/${lang}/${cc}/neighborhoods/${slugOrId}`
      break
    default:
      path = `/${lang}/${slugOrId}`
  }

  return `${origin}${path}`
}

/** Hierarchy traversal order for Place & Property graph */
export const HIERARCHY_LEVELS: EntityType[] = [
  'CTRY',
  'REGN',
  'CITY',
  'DIST',
  'HOOD',
  'STRT',
  'BLDG',
  'PROP',
]

/** Verify if a parent type can contain a child type in the hierarchy */
export function isValidHierarchyParent(parentType: EntityType, childType: EntityType): boolean {
  const parentIdx = HIERARCHY_LEVELS.indexOf(parentType)
  const childIdx = HIERARCHY_LEVELS.indexOf(childType)
  if (parentIdx === -1 || childIdx === -1) return false
  return parentIdx < childIdx
}
