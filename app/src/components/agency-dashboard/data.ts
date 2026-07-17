import { db } from "@/lib/db"
import { safeQuery, type SessionUser } from "@/lib/guards"

/**
 * ponytail: schema has no AgencyProfile→AgentProfile relation and CrmLead only
 * has agentId (a user id). Team = AgentProfile rows whose `agency` string
 * matches the profile name; upgrade path: add agencyId FK to both models.
 */
export async function getAgencyContext(user: SessionUser) {
  const profile = await safeQuery(
    () => db.agencyProfile.findFirst({ where: { ownerId: user.id, deletedAt: null } }),
    null,
  )
  const team = profile
    ? await safeQuery(
        () =>
          db.agentProfile.findMany({
            where: { agency: profile.name, deletedAt: null },
            orderBy: { listingsCount: "desc" },
          }),
        [],
      )
    : []
  const ownerIds = [
    ...new Set([user.id, ...team.map((a) => a.ownerId).filter((id): id is string => !!id)]),
  ]
  return { profile, team, ownerIds }
}
