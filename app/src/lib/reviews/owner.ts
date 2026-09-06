import { db } from "@/lib/db"

/**
 * Resolves the account that owns a review target — authorizes owner replies.
 * targetId conventions: profile slugs for agent/agency/developer/project/
 * service, listing id for listing. Unknown target types have no owner.
 */
export async function getTargetOwnerId(
  targetType: string,
  targetId: string,
): Promise<string | null> {
  try {
    const bySlug = { where: { slug: targetId, deletedAt: null }, select: { ownerId: true } }
    switch (targetType) {
      case "agent": {
        const r = await db.agentProfile.findFirst(bySlug)
        return r?.ownerId ?? null
      }
      case "agency": {
        const r = await db.agencyProfile.findFirst(bySlug)
        return r?.ownerId ?? null
      }
      case "developer": {
        const r = await db.developerProfile.findFirst(bySlug)
        return r?.ownerId ?? null
      }
      case "project": {
        const r = await db.projectDirectory.findFirst(bySlug)
        return r?.ownerId ?? null
      }
      case "service": {
        const r = await db.serviceProvider.findFirst({
          where: { slug: targetId, deletedAt: null, isActive: true },
          select: { ownerId: true },
        })
        return r?.ownerId ?? null
      }
      case "listing": {
        const r = await db.listing.findUnique({
          where: { id: targetId },
          select: { ownerId: true },
        })
        return r?.ownerId ?? null
      }
      default:
        return null
    }
  } catch {
    return null
  }
}
