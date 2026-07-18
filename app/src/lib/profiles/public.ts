/**
 * Resolve listing owner → public profile href (DB).
 */
import 'server-only'

import { db } from '@/lib/db'
import {
  type PublicAgentMeta,
  type SellerRole,
} from '@/lib/profiles/roles'

export type { PublicAgentMeta, SellerRole }
export { SELLER_ROLE_LABEL, resolveStaticAgentProfile } from '@/lib/profiles/roles'

function roleFromUser(role: string | undefined, sellerType: string | null | undefined): SellerRole {
  switch (role) {
    case 'agent':
      return 'agent'
    case 'agency':
      return 'agency'
    case 'developer':
      return 'developer'
    case 'seller':
      return 'owner'
    default:
      return sellerType === 'agency' ? 'agency' : 'owner'
  }
}

/** Resolve clickable profile for a listing owner (DB). */
export async function resolveOwnerProfile(
  ownerId: string | null | undefined,
  sellerType?: string | null,
): Promise<PublicAgentMeta> {
  if (!ownerId) {
    return { profileHref: null, role: sellerType === 'agency' ? 'agency' : 'owner', verified: false, image: null }
  }

  try {
    const user = await db.user.findUnique({
      where: { id: ownerId },
      select: { id: true, role: true, image: true },
    })
    if (!user) {
      return { profileHref: `/u/${ownerId}`, role: 'owner', verified: false, image: null }
    }

    const role = roleFromUser(user.role, sellerType)

    if (role === 'agent') {
      const ap = await db.agentProfile.findFirst({
        where: { ownerId, deletedAt: null },
        select: { slug: true, verified: true },
      })
      if (ap?.slug) {
        return {
          profileHref: `/agents/${ap.slug}`,
          role,
          verified: ap.verified,
          image: user.image,
        }
      }
    }

    if (role === 'developer') {
      const dp = await db.developerProfile.findFirst({
        where: { ownerId, deletedAt: null },
        select: { slug: true },
      })
      if (dp?.slug) {
        return {
          profileHref: `/developers/${dp.slug}`,
          role,
          verified: false,
          image: user.image,
        }
      }
    }

    return {
      profileHref: `/u/${user.id}`,
      role,
      verified: false,
      image: user.image,
    }
  } catch {
    return { profileHref: `/u/${ownerId}`, role: 'owner', verified: false, image: null }
  }
}
