import type { Prisma } from "@/generated/prisma/client"
import type { Session } from "next-auth"

import { db } from "@/lib/db"

/**
 * Best-effort admin audit trail. Every mutating admin server action must call
 * this AFTER the mutation succeeds. Never throws — an audit failure must not
 * roll back a completed operation, and failures are visible in server logs.
 */
export async function logAdminAction(
  session: Session,
  action: string,
  targetType: string,
  targetId: string,
  details?: unknown,
): Promise<void> {
  try {
    await db.adminAuditLog.create({
      data: {
        actorId: session.user.id,
        actorName: session.user.name ?? session.user.email ?? "admin",
        actorRole: session.user.role,
        action,
        targetType,
        targetId,
        details: (details ?? {}) as Prisma.InputJsonValue,
      },
    })
  } catch (error) {
    console.error("[admin-audit] failed to write audit log", {
      action,
      targetType,
      targetId,
      error,
    })
  }
}
