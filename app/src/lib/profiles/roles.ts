/**
 * Seller role labels + static catalog profile links (no DB).
 */
import { AGENT_PROFILES } from '@/data/professionals'

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
