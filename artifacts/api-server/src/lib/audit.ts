import { db } from "@workspace/db";
import { auditLogsTable } from "@workspace/db";

export async function logAudit(adminName: string, action: string, targetUser?: string | null, details?: string | null): Promise<void> {
  await db.insert(auditLogsTable).values({
    adminName,
    action,
    targetUser: targetUser ?? null,
    details: details ?? null,
  });
}
