/**
 * Who may PATCH/DELETE/boost a listing. Agency owner = own + agents whose
 * `agency` string matches the profile name (same rule as getAgencyContext).
 */
import { db } from "@/lib/db"
import { safeQuery } from "@/lib/guards"
import { listingManageRule } from "@/lib/pro-leads"

export { listingManageRule }

export async function canManageListing(
  user: { id: string; role: string },
  listingOwnerId: string,
): Promise<boolean> {
  if (listingManageRule(user, listingOwnerId, false)) return true
  if (user.role !== "agency") return false
  const profile = await safeQuery(
    () =>
      db.agencyProfile.findFirst({
        where: { ownerId: user.id, deletedAt: null },
        select: { name: true },
      }),
    null,
  )
  if (!profile) return false
  const teammate = await safeQuery(
    () =>
      db.agentProfile.findFirst({
        where: { ownerId: listingOwnerId, agency: profile.name, deletedAt: null },
        select: { id: true },
      }),
    null,
  )
  return listingManageRule(user, listingOwnerId, !!teammate)
}
