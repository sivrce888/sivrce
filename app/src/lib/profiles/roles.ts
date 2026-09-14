/**
 * Seller role labels + static catalog profile links (no DB).
 */
// Leaf module on purpose: importing this from '@/data/professionals' dragged the
// whole new-build catalog (~251 KB gzipped) into the listing + compare chunks.
import { AGENT_PROFILES } from '@/data/agent-profiles'

export type SellerRole = 'owner' | 'agent' | 'agency' | 'developer'

export const SELLER_ROLE_LABEL: Record<SellerRole, { ka: string; en: string }> = {
  owner: { ka: 'მესაკუთრე', en: 'Owner' },
  agent: { ka: 'აგენტი', en: 'Agent' },
  agency: { ka: 'სააგენტო', en: 'Agency' },
  developer: { ka: 'დეველოპერი', en: 'Developer' },
}

export type PublicAgentMeta = {
  profileHref: string | null
  role: SellerRole
  verified: boolean
  image: string | null
}

/** Static catalog listings — match agent name → /agents/slug. */
export function resolveStaticAgentProfile(agentName: string): PublicAgentMeta {
  const hit = AGENT_PROFILES.find(
    (a) => a.name.ka === agentName || a.name.en === agentName,
  )
  if (!hit) {
    return { profileHref: null, role: 'agent', verified: false, image: null }
  }
  return {
    profileHref: `/agents/${hit.slug}`,
    role: 'agent',
    verified: hit.verified,
    image: null,
  }
}
